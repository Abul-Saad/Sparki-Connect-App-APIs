import express from 'express';
import mentorProgramController from '../controllers/mentorProgram.js';

import verifyUser from '../middleware/verifyUser.js';
import { mentorIconUpload } from '../middleware/upload.js';


const router = express.Router();

router.post("/add-mentor-program", verifyUser, mentorIconUpload.single("icon"), mentorProgramController.createMentorProgram);
router.get("/get-mentor-programs", verifyUser, mentorProgramController.getAllMentorProgram);
router.put("/update-mentor-program", verifyUser,mentorIconUpload.single("icon"), mentorProgramController.updateMentorProgram);
router.post("/delete-mentor-program/:id", verifyUser, mentorProgramController.deleteMentorProgram);
router.patch("/mentor-program-hide-unhide/:id", verifyUser, mentorProgramController.toggleMentorVisibility);
router.get("/get-unhide-mentor-program", verifyUser, mentorProgramController.getUnhideMentorProgram);


export default router;