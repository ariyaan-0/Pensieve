import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Task: Study CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

//Configuration---
app.use(express.json({limit: "16kb"})); //data limitation for json
app.use(express.urlencoded({extended: true, limit: "16kb"})); //data from url
app.use(express.static("public")); //if needed for file
app.use(cookieParser());

//routes import
import userRouter from  './routes/user.routes.js';

//routes declaration
app.use("/api/v1/users", userRouter);



export {app};