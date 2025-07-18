import express from 'express';
import reportedCommentController from '../controllers/reportedComment.js';
import verifyUser from '../middleware/verifyUser.js';

const router = express.Router();


router.post("/addReportComment", verifyUser, reportedCommentController.reportedComment);
router.get("/getReportedComment", verifyUser, reportedCommentController.getReportedComment);

export default router;