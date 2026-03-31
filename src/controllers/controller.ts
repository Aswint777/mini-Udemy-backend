import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { sendEmail } from "../supportFunctions/nodemailer";
import otpVerify from "../models/otpSchemsa";
import User from "../models/userSchema";
import { loginBody, otpBody, SignUpBody } from "../interfaces";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../supportFunctions/jwt";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

export const userSignUpPost = async (
  req: Request<{}, {}, SignUpBody>,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (name.length < 3) {
      res.status(400).json({ message: "Name must be at least 3 characters" });
      return;
    }

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (!passwordRegex.test(password)) {
      res.status(400).json({
        message:
          "Password must be at least 6 characters, include uppercase, lowercase and number",
      });
      return;
    }

    const existingUser = await otpVerify.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await sendEmail({
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}`,
    });
    console.log(otp);

    const userData = await otpVerify.create({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
    });

    res.status(201).json({
      message: "OTP sent successfully",
      user: {
        id: userData?._id,
        name: userData?.name,
        email: userData?.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const otpVerifyPost = async (
  req: Request<{}, {}, otpBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const userData = await otpVerify.findOne({ email: email });
    if (otp !== userData?.otp) {
      res.status(400).json({ message: "check your otp " });
      return;
    }
    if (!email) {
      res.status(400).json({ message: "Email is not matched " });
      return;
    }
    const newUser = await User.create({
      name: userData?.name,
      email: userData?.email,
      password: userData?.password,
      role: userData?.role,
    });

    res.status(201).json({
      message: "OTP verification successful",
    });
  } catch (error: unknown) {
    console.error(" error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const userLoginPost = async (
  req: Request<{}, {}, loginBody>,
  res: Response,
): Promise<void> => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    const userData = await User.findOne({ email });
    if (!userData) {

      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordMatch = await bcrypt.compare(password, userData?.password);
    if (!isPasswordMatch) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const accessToken = generateAccessToken({
      _id: String(userData?._id),
      email: userData?.email!,
      role: userData?.role,
    });
    const refreshToken = generateRefreshToken({
      _id: String(userData?._id),
      email: userData?.email!,
      role: userData?.role,
    });
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: userData?._id,
        email: userData?.email,
        name: userData?.name,
        role: userData?.role,
      },
    });
  } catch (error: unknown) {
    console.error("login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(201).json({
      user: req.user,
      message: "OTP verification successfullll",
    });
  } catch (error: unknown) {
    console.error(" error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
