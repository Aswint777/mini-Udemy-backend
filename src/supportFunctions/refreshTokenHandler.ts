import { Request, Response } from "express";
import { generateAccessToken } from "./jwt";
import jwt from "jsonwebtoken";
import { UserPayload } from "../jwtMiddleware";

export const refreshTokenHandler = (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
    ) as UserPayload & { iat: number; exp: number };

    const payload = {
      _id: decoded._id,
      email: decoded.email,
      role: decoded.role,
    };

    const newAccessToken = generateAccessToken(payload);
    res.status(200).json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
