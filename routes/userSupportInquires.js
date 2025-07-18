import express from 'express';
import userSupportInquires from '../controllers/userSupportInquires.js';

import verifyUser from '../middleware/verifyUser.js';
const router = express.Router();

router.post("/add-inquiry", verifyUser, userSupportInquires.submitUserInquiry);
router.get('/get-inquiries',verifyUser, userSupportInquires.getAllInquiry);
router.post('/reply-inquiry/:inquiryId/', verifyUser, userSupportInquires.replyToUserInquiry);
router.get('/get-replies/:inquiryId',verifyUser, userSupportInquires.getInquiryReplies);
router.patch('/notification/:notificationId',verifyUser, userSupportInquires.markNotificationAsRead)


export default router;