import { Router } from "express";
import {
  checkAuth,
  logout,
  otpVerifyPost,
  userLoginPost,
  userSignUpPost,
} from "../controllers/controller";
import { authMiddleware } from "../jwtMiddleware";
import { refreshTokenHandler } from "../supportFunctions/refreshTokenHandler";
import {
  createCourse,
  deleteCourse,
  getCourseById,
  getInstructorCourses,
  updateCourse,
} from "../controllers/courseController";
import multer from "multer";
import {
  checkEnrollment,
  enrollInCourse,
  getAllCourses,
  getCertificateData,
  getCourseDetails,
  getMyEnrollments,
  getMyLearning,
  markLessonCompleted,
} from "../controllers/enrollmentController";
import {
  getCourseReviews,
  submitReview,
} from "../controllers/reviewController";

const router = Router();

const storage = multer.memoryStorage();
export const upload = multer({ storage });

//common routs

router.post("/userSignUpPost", userSignUpPost);
router.post("/otpVerifyPost", otpVerifyPost);
router.post("/userLoginPost", userLoginPost);
router.post("/logout", logout);
router.post("/refresh", refreshTokenHandler);

// user routes

router.get("/checkAuth", authMiddleware, checkAuth);
router.get("/courses", getAllCourses);
router.get("/courses/:courseId", getCourseDetails);

// instructor routs
router.post(
  "/create-course",
  authMiddleware,
  upload.fields([
    { name: "videos", maxCount: 20 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createCourse,
);

router.get("/instructor/courses", authMiddleware, getInstructorCourses);

router.get("/instructor/courses/:courseId", authMiddleware, getCourseById);
router.put(
  "/instructor/courses/:courseId",
  authMiddleware,
  upload.fields([
    { name: "videos", maxCount: 20 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateCourse,
);

router.delete("/instructor/courses/:courseId", authMiddleware, deleteCourse);

// student routs

router.post("/enrollments", authMiddleware, enrollInCourse);
router.get("/enrollments/check/:courseId", authMiddleware, checkEnrollment);
router.get("/enrollments/my-courses", authMiddleware, getMyEnrollments);
router.get("/my-learning/:courseId", authMiddleware, getMyLearning);
router.post(
  "/my-learning/:courseId/complete-lesson",
  authMiddleware,
  markLessonCompleted,
);
router.get("/certificate/:courseId", authMiddleware, getCertificateData);
router.post("/courses/:courseId/review", authMiddleware, submitReview);
router.get("/courses/:courseId/reviews", authMiddleware, getCourseReviews);

export default router;
