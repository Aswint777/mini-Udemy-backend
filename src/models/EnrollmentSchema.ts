import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEnrollment extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  enrolledAt: Date;
  status: "active" | "completed" | "cancelled";
  progress: number;
  completedLessons: Types.ObjectId[];
  lastAccessedAt: Date;
  paymentInfo?: {
    amount: number;
    paymentId?: string;
    paymentMethod?: string;
  };
}

const enrollmentSchema = new Schema<IEnrollment>(
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

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedLessons: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course.lessons",
      },
    ],

    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },

    paymentInfo: {
      amount: { type: Number },
      paymentId: { type: String },
      paymentMethod: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
