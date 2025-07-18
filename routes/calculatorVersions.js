import express from 'express';
import calculatorVersionsController from '../controllers/calculatorVersions.js';
import {calculatorIconUpload} from '../middleware/upload.js';

import verifyUser from '../middleware/verifyUser.js';
const router = express.Router();

router.post("/add-calculator", verifyUser, calculatorIconUpload.single("icon"), calculatorVersionsController.addCalculator);
router.get("/get-calculators", verifyUser, calculatorVersionsController.getAllCalculator);
router.put("/update-calculator/:id", verifyUser, calculatorIconUpload.single("icon"), calculatorVersionsController.updateCalculator);
router.post("/delete-calculator/:id", verifyUser, calculatorVersionsController.deleteCalculator);
router.patch("/hide-and-unhide/:id", verifyUser, calculatorVersionsController.toggleCalculatorVisibility);
router.get("/get-unhide-calculator", verifyUser, calculatorVersionsController.getUnhideCalculator);
router.post("/coming-soon/:id", verifyUser, calculatorVersionsController.toggleComingSoonLabel);

export default router;