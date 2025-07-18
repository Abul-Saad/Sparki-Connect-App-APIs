import express from 'express';

import bookmarkEducationContents from '../controllers/bookmarkQ&AContents.js';
import verifyUser from '../middleware/verifyUser.js';

const router = express.Router();

router.post("/addBookmarkEducationContent", verifyUser, bookmarkEducationContents.addBookmarkContents);
router.get("/getBookmarkEducationContent", verifyUser, bookmarkEducationContents.getBookmarkContents);
router.post("/removeBookmarkEducationContent/:educationContentId", verifyUser, bookmarkEducationContents.removeBookmarkContent);

export default router;