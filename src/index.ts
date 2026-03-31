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
    origin: [
      "http://localhost:5173",                    
      "http://localhost:3000",
      "https://mini-udemy-frontend-2tikcsrvp-aswint777s-projects.vercel.app"   
    ],
    credentials: true,          
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);


connectDB();

app.use("/", Routes);

console.log("MONGO_URI:", process.env.MONGO_URI);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});
