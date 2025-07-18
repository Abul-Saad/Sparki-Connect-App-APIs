import express from 'express';
import AdsController from '../controllers/Ads.js';
import verifyUser from '../middleware/verifyUser.js';
import { adsUpload } from '../middleware/upload.js';
const router = express.Router();

router.post('/addAds', verifyUser, adsUpload.single("image_url"), AdsController.AddAds);
router.get('/getAds',verifyUser, AdsController.getAds);
router.patch('/updateAds/:id', verifyUser, adsUpload.single("image_url"), AdsController.updateAds);
router.delete('/deleteAds/:id', verifyUser, AdsController.deleteAds);

export default router;