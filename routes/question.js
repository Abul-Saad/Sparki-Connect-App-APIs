import express from "express";
import questionController from "../controllers/question.js";
import verifyUser from "../middleware/verifyUser.js";
const router = express.Router();

router.post("/addQuestion", verifyUser, questionController.addQuestion);

router.get("/getQuestionAdmin", verifyUser, questionController.getQuestionsAdmin);

router.patch("/updateQuestion/:id", verifyUser, questionController.updateQuestion);
router.post("/deleteQuestion/:id", verifyUser, questionController.removeQuestion);
router.post("/addQuestionsViews", verifyUser, questionController.addQuestionViews);
router.post("/addQuestionLikes", verifyUser, questionController.addQuestionLikes);
router.get("/getQuestionLikes", verifyUser, questionController.getQuestionLikes);

router.post("/removeQuestionLikes", verifyUser, questionController.removeQuestionLikes);
router.post("/addQuestionComments", verifyUser, questionController.addQuestionComments);
router.post("/deleteComment/:commentId", verifyUser, questionController.deleteComments);
router.get("/getCurrentUserPostedQuestions", verifyUser, questionController.getCurrentUserPostedQuestions);
router.get("/getQuestionComments", verifyUser, questionController.getQuestionComments);

router.post("/addCommentsLike", verifyUser, questionController.addCommentLikes);
router.get("/getCommentLikes", verifyUser, questionController.getCommentLikes);
router.post("/removeCommentLike", verifyUser, questionController.removeCommentLikes);
router.get("/get-my-questions", verifyUser, questionController.getMyQuestions);
// router.post("/addReportComment", verifyUser, questionController.reportedComment);

// BookMark-Questions
// router.post("/bookmarkQuestions", verifyUser, questionController.bookmarkQuestion);
// router.get("/getbookmarkQuestions", verifyUser, questionController.getBookmarkedQuestions);
export default router;
