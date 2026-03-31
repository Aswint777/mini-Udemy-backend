import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "./supportFunctions/jwt";

export interface UserPayload {
  _id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
    ) as UserPayload;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
