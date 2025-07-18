import express from 'express';
import adminApproveController from '../controllers/adminApprovelQ&A.js';
import verifyUser from '../middleware/verifyUser.js';

const router = express.Router();

router.patch("/approve/:questionId", verifyUser, adminApproveController.adminApproveQuestions);
router.get("/get-pending-questions", verifyUser, adminApproveController.getPendingQuestions);
router.get("/get-approved-questions", verifyUser, adminApproveController.getApprovedQuestions);
router.post("/reject-question/:questionId", verifyUser, adminApproveController.adminRejectQuestion);
router.get("/get-rejected-questions", verifyUser, adminApproveController.getMyRejectedQuestions);


export default router;