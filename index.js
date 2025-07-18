import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import bodyParser from "body-parser";
import { dbConnection } from "./db/connection.js";

// Route imports
import userRoutes from "./routes/user.js";
import wholesalerRoutes from "./routes/wholeseller.js"; 
import educationRoutes from "./routes/education.js"; 
import educationResourceContent from "./routes/educationResourceContent.js";
import educationUserTrack from "./routes/educationUserTrack.js";
import educationFilter from "./routes/educationFilter.js";
import question from "./routes/question.js";
import bookmarkQuestion from "./routes/bookmarkQuestions.js";
import adsRoute from "./routes/ads.js";
import reportedCommentRoute from "./routes/reportedComment.js";
import adminApproveRoute from "./routes/adminApprovelQ&A.js";
import userSupportInquiresRoute from "./routes/userSupportInquires.js";
import temppdfRoute from "./routes/templatePdfRoute.js";
import mentorProgramRoute from "./routes/mentorProgram.js";
import calculatorVersionsRoute from "./routes/calculatorVersions.js";
import bookmarkEducationContentRoute from "./routes/bookmarkQ&AContents.js";
import userSubscriptionRoute from "./routes/userSubscription.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";

const app = express();
const port = process.env.PORT || 3000;
const con = dbConnection();

// Middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 * 1000, // 30 minutes
    },
  })
);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/wholesaler", wholesalerRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/educationResourceContent", educationResourceContent);
app.use("/api/educationUserTrack", educationUserTrack);
app.use("/api/educationFilter", educationFilter);
app.use("/api/question", question);
app.use("/api/bookmark",bookmarkQuestion);
app.use("/api/ads", adsRoute);
app.use("/api/reports", reportedCommentRoute);
app.use('/uploads', express.static('uploads'));
app.use("/api/questions", adminApproveRoute);
app.use("/api/support", userSupportInquiresRoute);
app.use("/api/template", temppdfRoute);
app.use("/api/mentor", mentorProgramRoute);
app.use("/api/calculator", calculatorVersionsRoute);
app.use("/api/bookmarkContent", bookmarkEducationContentRoute);
app.use("/api/subscription", userSubscriptionRoute);
app.use("/api/payments", paymentsRoutes);


// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "An unexpected error occurred", error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});