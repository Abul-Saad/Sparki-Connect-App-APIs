import express from "express";
import educationController from "../controllers/education.js";
import verifyUser from "../middleware/verifyUser.js";

import { educationIconUpload } from "../middleware/upload.js";

const router = express.Router();

router.post("/addEducationResource", verifyUser, educationIconUpload, educationController.addEducationResource);
router.get("/getEducationResources", verifyUser, educationController.getEducationResources);
router.patch("/updateEducationResources/:id", verifyUser,educationIconUpload, educationController.updateEducationResources);
router.delete("/deleteEducationResources/:id", verifyUser, educationController.deleteEducationResources);
export default router;
