import { Request, Response } from "express";
import cloudinary from "../supportFunctions/Cloudinary";
import Course from "../models/CourseSchema";
import Enrollment from "../models/EnrollmentSchema";

export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title, description, price, lessons } = req.body;

    const files = req.files as {
      videos?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    };

    if (!title || !description || !price) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!files?.videos || files.videos.length === 0) {
      res.status(400).json({ message: "Videos are required" });
      return;
    }

    if (!files?.thumbnail || files.thumbnail.length === 0) {
      res.status(400).json({ message: "Thumbnail is required" });
      return;
    }

    const thumbnailFile = files.thumbnail[0];

    const thumbnailUpload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(thumbnailFile.buffer);
    });

    const parsedLessons = JSON.parse(lessons);

    const uploadedLessons = [];

    for (let i = 0; i < parsedLessons.length; i++) {
      const file = files.videos[i];

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "video" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(file.buffer);
      });

      uploadedLessons.push({
        title: parsedLessons[i].title,
        videoUrl: result.secure_url,
      });
    }

    const instructorId = req.user?._id;

    const newCourse = await Course.create({
      title,
      description,
      price: Number(price),
      thumbnail: thumbnailUpload.secure_url,
      instructor: instructorId,
      lessons: uploadedLessons,
    });

    res.status(201).json({
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const instructorId = (req as any).user?._id;

    if (!instructorId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const courses = await Course.find({ instructor: instructorId })
      .select(
        "title description price thumbnail lessons createdAt averageRating totalReviews",
      )
      .sort({ createdAt: -1 })
      .lean();

    if (courses.length === 0) {
      res.status(200).json({
        courses: [],
        stats: {
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
        },
      });
      return;
    }

    const courseIds = courses.map((course: any) => course._id);

    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    }).select("paymentInfo");

    const totalCourses = courses.length;
    const totalStudents = enrollments.length;

    const totalRevenue = enrollments.reduce((sum, enrollment) => {
      return sum + (enrollment.paymentInfo?.amount || 0);
    }, 0);

    res.status(200).json({
      success: true,
      courses,
      stats: {
        totalCourses,
        totalStudents,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user?._id;

    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    }).select("title description price thumbnail lessons");

    if (!course) {
      res
        .status(404)
        .json({ message: "Course not found or you don't have permission" });
      return;
    }

    res.status(200).json({ course });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, price, lessons } = req.body;
    const instructorId = req.user?._id;

    const files = req.files as {
      videos?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    };

    if (!title || !description || !price) {
      res
        .status(400)
        .json({ message: "Title, description and price are required" });
      return;
    }

    const existingCourse = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    });

    if (!existingCourse) {
      res.status(404).json({ message: "Course not found or unauthorized" });
      return;
    }

    let thumbnailUrl = existingCourse.thumbnail;

    if (files?.thumbnail && files.thumbnail.length > 0) {
      const thumbnailFile = files.thumbnail[0];

      const thumbnailUpload = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(thumbnailFile.buffer);
      });

      thumbnailUrl = thumbnailUpload.secure_url;
    }

    const parsedLessons = JSON.parse(lessons || "[]");

    const finalLessons = [];
    let videoIndex = 0;

    for (const lesson of parsedLessons) {
      if (lesson._id) {
        const existingLesson = existingCourse.lessons.find(
          (l: any) => l._id.toString() === lesson._id,
        );

        finalLessons.push({
          _id: lesson._id,
          title: lesson.title,
          videoUrl: existingLesson?.videoUrl,
        });
      } else {
        const videoFile = files?.videos?.[videoIndex];

        if (!videoFile) {
          res
            .status(400)
            .json({ message: "Video file missing for new lesson" });
          return;
        }

        const videoUpload = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "video" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(videoFile.buffer);
        });

        finalLessons.push({
          title: lesson.title,
          videoUrl: videoUpload.secure_url,
        });

        videoIndex++;
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title,
        description,
        price: Number(price),
        thumbnail: thumbnailUrl,
        lessons: finalLessons,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user?._id;

    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found or you don't have permission to delete it",
      });
      return;
    }
    await Course.findByIdAndDelete(courseId);

    res.status(200).json({
      message: "Course deleted successfully",
      courseId,
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ message: "Server error while deleting course" });
  }
};
