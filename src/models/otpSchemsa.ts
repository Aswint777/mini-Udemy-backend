import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  otp: string;
  createdAt: Date;
}

const otpSchema: Schema<IOtp> = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      default: "student",
      enum: ["student", "instructor"],
    },
    otp: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const otpVerify = mongoose.model<IOtp>("otpVerify", otpSchema);

export default otpVerify;
