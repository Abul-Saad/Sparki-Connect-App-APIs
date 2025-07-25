import express from 'express';

import templatePdfController from '../controllers/templatePdfController.js';

import verifyUser from '../middleware/verifyUser.js';
import templatePdfUpload from '../middleware/templatePdfUpload.js';

const router = express.Router();

router.post("/upload-temp-pdf", verifyUser, templatePdfUpload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]), templatePdfController.uploadTemplatePdf);

router.get("/get-temp-pdf", verifyUser, templatePdfController.getAllTemplatePdf);

router.put("/update-temp-pdf", verifyUser, templatePdfUpload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]), templatePdfController.updateTemplatePdf);

router.post("/delete-temp-pdf/:id", verifyUser, templatePdfController.deleteTemplatePdf);

export default router;