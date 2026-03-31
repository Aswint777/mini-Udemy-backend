import mongoose, { Schema, Document, Types } from "mongoose";

interface ILesson {
  title: string;
  videoUrl: string;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  instructor: Types.ObjectId;
  lessons: ILesson[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
});

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },

    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lessons: [lessonSchema],

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    ratingDistribution: {
      type: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
      default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
  },
  { timestamps: true },
);

const Course = mongoose.model<ICourse>("Course", courseSchema);

export default Course;
