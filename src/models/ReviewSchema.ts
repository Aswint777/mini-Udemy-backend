import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  rating: number;
  reviewText?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    reviewText: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ user: 1, course: 1 }, { unique: true });

reviewSchema.index({ course: 1, rating: -1 });

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
