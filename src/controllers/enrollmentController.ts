import { Request, Response } from "express";
import Course from "../models/CourseSchema";
import Enrollment from "../models/EnrollmentSchema";
import Review from "../models/ReviewSchema";

export const getAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const courses = await Course.find()
      .select(
        "title description price thumbnail lessons createdAt averageRating totalReviews",
      )
      .sort({ createdAt: -1 })
      .populate("instructor", "name");

    res.status(200).json({
      success: true,
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error("Get all courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
};

export const getCourseDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .select(
        "title description price thumbnail lessons createdAt averageRating totalReviews",
      )
      .populate("instructor", "name email")
      .lean();

    if (!course) {
      res.status(404).json({
        success: false,
        message: "Course not found",
      });
      return;
    }

    const reviews = await Review.find({
      course: courseId,
      isApproved: true,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    const responseCourse = {
      ...course,
      totalLessons: course.lessons?.length || 0,
      averageRating: course.averageRating || 0,
      totalReviews: course.totalReviews || 0,
    };

    res.status(200).json({
      success: true,
      course: responseCourse,
      reviews: reviews || [],
    });
  } catch (error) {
    console.error("Get course details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course details",
    });
  }
};

export const enrollInCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Please login to enroll" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    if (course.instructor.toString() === userId.toString()) {
      res
        .status(400)
        .json({ message: "Instructors cannot enroll in their own courses" });
      return;
    }

    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });
    if (existingEnrollment) {
      res
        .status(400)
        .json({ message: "You are already enrolled in this course" });
      return;
    }

    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      status: "active",
      progress: 0,
      paymentInfo: {
        amount: course.price,
        paymentId: `PAY_${Date.now()}`,
        paymentMethod: "manual",
      },
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled in the course",
      enrollment,
    });
  } catch (error: any) {
    console.error("Enrollment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Enrollment failed",
    });
  }
};

export const checkEnrollment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(200).json({ isEnrolled: false });
      return;
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    res.status(200).json({
      isEnrolled: !!enrollment,
      enrollment: enrollment ? { progress: enrollment.progress } : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ isEnrolled: false });
  }
};

export const getMyEnrollments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    const enrollments = await Enrollment.find({
      user: userId,
      status: { $in: ["active", "completed"] },
    })
      .populate({
        path: "course",
        select: "title description price thumbnail lessons",
      })
      .sort({ lastAccessedAt: -1 });

    res.status(200).json({
      success: true,
      enrollments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyLearning = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    }).populate({
      path: "course",
      select: "title description thumbnail lessons",
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "You are not enrolled in this course",
      });
      return;
    }

    res.status(200).json({
      success: true,
      enrollment,
    });
  } catch (error) {
    console.error("Get my learning error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const markLessonCompleted = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;
    const userId = req.user?._id;

    if (!lessonId) {
      res.status(400).json({ message: "Lesson ID is required" });
      return;
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      res.status(404).json({ message: "Enrollment not found" });
      return;
    }

    if (!enrollment.completedLessons.includes(lessonId as any)) {
      enrollment.completedLessons.push(lessonId as any);
    }

    const course = await Course.findById(courseId);
    if (course) {
      const totalLessons = course.lessons.length;
      const completedCount = enrollment.completedLessons.length;
      enrollment.progress = Math.round((completedCount / totalLessons) * 100);
    }

    enrollment.lastAccessedAt = new Date();

    if (enrollment.progress === 100) {
      enrollment.status = "completed";
    }

    await enrollment.save();

    res.status(200).json({
      success: true,
      message: "Lesson marked as completed",
      progress: enrollment.progress,
    });
  } catch (error) {
    console.error("Mark lesson completed error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update lesson progress",
    });
  }
};

export const getCertificateData = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: "completed",
    })
      .populate({
        path: "course",
        select: "title instructor",
        populate: {
          path: "instructor",
          select: "name",
        },
      })
      .populate({
        path: "user",
        select: "name email",
      });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: "Certificate not available. Course must be completed.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      certificateData: {
        studentName: (enrollment.user as any)?.name || "Student",
        courseTitle: (enrollment.course as any)?.title || "Unknown Course",
        completionDate: new Date(),
        instructorName:
          (enrollment.course as any)?.instructor?.name || "Mini Udemy Academy",
      },
    });
  } catch (error) {
    console.error("Get certificate data error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating certificate",
    });
  }
};
