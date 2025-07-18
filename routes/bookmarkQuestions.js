import express from 'express';
import bookmarkQuestionController from '../controllers/bookmarkQuestions.js';
import verifyUser from '../middleware/verifyUser.js';
const router = express.Router();

router.post("/addBookmarkQuestions", verifyUser, bookmarkQuestionController.addBookmarkQuestion);
router.get("/getbookmarkQuestions", verifyUser, bookmarkQuestionController.getBookmarkedQuestions);
router.delete("/deletebookmarkQuestion/:questionId", verifyUser, bookmarkQuestionController.removeBookmarkedQuestion)

export default router;