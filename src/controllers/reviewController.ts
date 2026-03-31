import { Request, Response } from "express";
import Course from "../models/CourseSchema";
import Enrollment from "../models/EnrollmentSchema";
import Review from "../models/ReviewSchema";

export const submitReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "Please login to submit review" });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
      return;
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["active", "completed"] },
    });

    if (!enrollment) {
      res.status(403).json({
        success: false,
        message: "You must be enrolled in this course to submit a review",
      });
      return;
    }

    const review = await Review.findOneAndUpdate(
      { user: userId, course: courseId },
      {
        user: userId,
        course: courseId,
        rating: Number(rating),
        reviewText: reviewText ? reviewText.trim() : undefined,
        isApproved: true,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    await updateCourseRatingStats(courseId);

    res.status(200).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error: any) {
    console.error("Submit review error:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "You have already reviewed this course",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Server error while submitting review",
    });
  }
};

export const getCourseReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const reviews = await Review.find({
      course: courseId,
      isApproved: true,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    const course = await Course.findById(courseId).select(
      "averageRating totalReviews",
    );

    res.status(200).json({
      success: true,
      reviews,
      averageRating: course?.averageRating || 0,
      totalReviews: course?.totalReviews || 0,
      currentUserId: req.user?._id || null,
    });
  } catch (error) {
    console.error("Get course reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
    });
  }
};

const updateCourseRatingStats = async (courseId: string): Promise<void> => {
  try {
    const reviews = await Review.find({
      course: courseId,
      isApproved: true,
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      await Course.findByIdAndUpdate(courseId, {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      return;
    }

    const sumOfRatings = reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const averageRating = Number((sumOfRatings / totalReviews).toFixed(1));

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
      number,
      number
    >;
    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    await Course.findByIdAndUpdate(courseId, {
      averageRating,
      totalReviews,
      ratingDistribution: distribution,
    });
  } catch (error) {
    console.error("Update course rating stats error:", error);
  }
};

export default {
  submitReview,
  getCourseReviews,
};
