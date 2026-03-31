import jwt from "jsonwebtoken";

export interface payLoad {
  _id: string;
  email: string;
  role?: string;
}

export const generateAccessToken = (payload: payLoad) => {
  return jwt.sign(payload, String(process.env.ACCESS_TOKEN_SECRET), {
    expiresIn: "40m",
  });
};

export const generateRefreshToken = (payload: payLoad) => {
  return jwt.sign(payload, String(process.env.REFRESH_TOKEN_SECRET), {
    expiresIn: "15d",
  });
};
