import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./database";
import Routes from "./routes/routes";

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://mini-udemy-frontend-fma81nt3y-aswint777s-projects.vercel.app",   
        "https://mini-udemy-frontend-2tikcsrvp-aswint777s-projects.vercel.app",
        "https://mini-udemy-frontend-git-main-aswint777s-projects.vercel.app",
        "https://mini-udemy-frontend-nu.vercel.app"
      ];

      // Allow any vercel.app domain (good for preview deployments)
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204
  })
);

connectDB();

app.use("/", Routes);

console.log("MONGO_URI:", process.env.MONGO_URI);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
