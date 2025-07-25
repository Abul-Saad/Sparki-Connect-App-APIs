import multer from "multer";
import path from 'path';
import fs from 'fs';

// Profile Picture Upload Configuration
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/profile_pictures/";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

const profileUpload = multer({ storage: profileStorage });

// Ads Image Upload Configuration
const adsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/ads_images/";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `ad-${uniqueSuffix}${ext}`);
  },
});

const adsUpload = multer({ storage: adsStorage });

// Education Upload Configuration (icon, image_banner, video_file)
const educationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = "./uploads/education/";
    let subFolder = "";

    if (file.fieldname === "icon") {
      subFolder = "education_icons";
    } else if (file.fieldname === "image_banner") {
      subFolder = "education_image_banners";
    } else if (file.fieldname === "video_file") {
      subFolder = "education_videos";
    } else {
      return cb(new Error(`Unsupported fieldname '${file.fieldname}'`));
    }

    const dir = path.join(baseDir, subFolder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    const prefix = {
      icon: "icon",
      image_banner: "image_banner",
      video_file: "video",
    }[file.fieldname] || "file";

    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

const educationIconUpload = multer({ storage: educationStorage }).fields([
  { name: "icon", maxCount: 1 },
  { name: "image_banner", maxCount: 1 },
  { name: "video_file", maxCount: 1 },
]);

// Mentor Program Icon Upload Configuration
const mentorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/mentor_icons/";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `mentor-icon-${uniqueSuffix}${ext}`);
  },
});

const mentorIconUpload = multer({ storage: mentorStorage });

// Calculator Icon Upload Configuration
const calculatorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "./uploads/calculator_icons/";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `calculator-icon-${uniqueSuffix}${ext}`);
  },
});

const calculatorIconUpload = multer({ storage: calculatorStorage });

// Export both uploaders
export { profileUpload, adsUpload, educationIconUpload, mentorIconUpload, calculatorIconUpload };