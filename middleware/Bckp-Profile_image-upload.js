import multer from "multer";
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination:function (req, file, cb){
        const dir = './uploads/profile_pictures/';
        fs.mkdirSync(dir, { recursive: true});
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext =path.extname(file.originalname);
        cb(null, `profile-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({ storage });

export default upload;