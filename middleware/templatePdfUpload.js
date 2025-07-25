import multer from "multer";
import path from "path";
import fs from "fs";

// Base upload directory
const baseDir = "uploads/templatesPdf";

// Create subdirectories if they don't exist
const ensureDir = (subdir) => {
  const dirPath = path.join(baseDir, subdir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Prepare subfolders
["pdf", "video", "image"].forEach(folder => ensureDir(folder));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = "others"; // default

    if (file.mimetype === "application/pdf") {
      subdir = "pdf";
    } else if (file.mimetype.startsWith("video/")) {
      subdir = "video";
    } else if (file.mimetype.startsWith("image/")) {
      subdir = "image";
    }

    const finalPath = path.join(baseDir, subdir);
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const allowedMimeTypes = [
  "application/pdf",
  "video/mp4",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/jpg"
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

export default multer({ storage, fileFilter });