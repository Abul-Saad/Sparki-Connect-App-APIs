import dotenv from 'dotenv';
dotenv.config();

import _ from 'lodash';
import userQuery from '../utils/helper/dbHelper.js';

import path from 'path';
import fs from 'fs';

// upload Pdf Template
const uploadTemplatePdf = async (req, res) => {
    const { name, type, access, video_url } = req.body;
    const pdfFile = req.files?.pdf?.[0];
    const videoFile = req.files?.video?.[0];
    const imageFile = req.files?.image?.[0];


     // ✅ Check if user is admin
    if (!req.user || req.user.userType !== "admin") {
        return res.status(403).json({
            status: "error",
            message: "Access denied. Only admin can upload PDF templates.",
            statusCode: 403,
        });
    }   

    if(!pdfFile) {
        return res.status(400).json({
            status : "error",
            message : "PDF file is required.",
            statusCode : 400,
        });
    }

    try {
        const pdfPath = pdfFile ? `/uploads/templatesPdf/pdf/${pdfFile.filename}` : null;
        const videoPath = videoFile ? `/uploads/templatesPdf/video/${videoFile.filename}` : null;
        const imagePath = imageFile ? `/uploads/templatesPdf/image/${imageFile.filename}` : null;

        await userQuery(
            `INSERT INTO templates_pdf  (name, file_path, type, access, video_file, video_url, image_file) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, pdfPath, type, access || "free", videoPath, video_url || null, imagePath]
        );

        return res.status(200).json({
            status : "success",
            message : "Template Pdf uploaded successfully",
            statusCode : 200,
        });

    } catch (error) {
        console.error("Pdf Error : ", error);
        return res.status(500).json({
            status : "error",
            error : "Internal Server Error",
            message : error.message,
            statusCode : 500
        });
    }
}

const getAllTemplatePdf = async (req, res) => {
    const userType = req.user?.userType || "visitor";

    try {
        let query = `SELECT* FROM templates_pdf`;
        let params = [];

        if (userType !== "admin") {
            const accessLevel = userType === "pro" ? ["free", "pro"] : ["free"];
            const placeholders = accessLevel.map(() => '?').join(', ');
            query += ` WHERE access IN (${placeholders})`;
            params = accessLevel;
        }

        query += ` ORDER BY uploaded_at DESC`;

        const result = await userQuery(query, params);
        const templates = Array.isArray(result[0]) ? result[0] : result;

        return res.status(200).json({
            status: "success",
            message: "Templates fetched successfully",
            data: templates,
            statusCode: 200
        });

    } catch (error) {
        console.error("Get Pdf:", error);
        return res.status(500).json({
            status: "error",
            message: error.message,
            error: "Internal Server Error",
            statusCode: 500
        });
    }
};

const updateTemplatePdf = async (req, res) => {
    const { id, name, type, access, video_url } = req.body;
    const newPdfFile = req.files?.pdf?.[0];
    const newVideoFile = req.files?.video?.[0];
    const newImageFile = req.files?.video?.[0];

    // Only admin can update
    if(!req.user || req.user.userType !== "admin") {
        return res.status(403).json({
            status : "error",
            message : "Access denied. Only admin can update templates.",
            statusCode : 403,
        });
    }

    if(!id || !name || !type || !access) {
        return res.status(400).json({
            status : "error",
            message : "All fields (id, name, type, access) are required.",
            statusCode : 400,
        });
    }

    try {
       const rows = await userQuery(`SELECT file_path, video_file, image_file FROM templates_pdf WHERE id = ?`, [id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Template not found.",
                statusCode: 404
            });
        }

      const old = rows[0];
        let updatedPdfPath = old.file_path;
        let updatedVideoPath = old.video_file;
        let updatedImagePath = old.image_file;

       if (newPdfFile) {
            const oldPdf = path.join("public", old.file_path);
            if (fs.existsSync(oldPdf)) fs.unlinkSync(oldPdf);
            updatedPdfPath = `/uploads/templatesPdf/pdf/${newPdfFile.filename}`;
        }

        if (newVideoFile) {
            if (old.video_file) {
                const oldVideo = path.join("public", old.video_file);
                if (fs.existsSync(oldVideo)) fs.unlinkSync(oldVideo);
            }
            updatedVideoPath = `/uploads/templatesPdf/video/${newVideoFile.filename}`;
        }

        if (newImageFile) {
            if (old.image_file) {
                const oldImg = path.join("public", old.image_file);
                if (fs.existsSync(oldImg)) fs.unlinkSync(oldImg);
            }
            updatedImagePath = `/uploads/templatesPdf/image/${newImageFile.filename}`;
        }

        await userQuery(
            `UPDATE templates_pdf 
             SET name = ?, type = ?, access = ?, file_path = ?, video_file = ?, video_url = ?, image_file = ?
             WHERE id = ?`,
            [
                name,
                type,
                access,
                updatedPdfPath,
                updatedVideoPath,
                video_url || null,
                updatedImagePath,
                id
            ]
        );

        return res.status(200).json({
            status: "success",
            message: "Template updated successfully.",
            statusCode: 200,
        });

    } catch (error) {
        console.error("Update Pdf: ", error);
        return res.status(500).json({
            status : "error",
            message : error.message,
            statusCode :500,
        });
    }
};

const deleteTemplatePdf = async (req, res) => {
    const { id } = req.params;

    if(!req.user || req.user.userType !== "admin") {
        return res.status(403).json({
            status : "error",
            message : "Access denied. Only admin can delete templates.",
            statusCode : 403,
        });
    }
    try {
        await userQuery(
            `DELETE FROM templates_pdf WHERE id = ?`,[id]
        );

        return res.status(200).json({
            status : "success",
            message : "Template Pdf deleted successfully.",
            statusCode : 200,
        });

    } catch (error) {
        console.error("Delete Pdf : ", error);
        return res.status(500).json({
            status : "error",
            error : "Internal Server Error: ",
            message : error.message,
            statusCode : 500,
        });
    }

}

export default {
    uploadTemplatePdf,
    getAllTemplatePdf,
    updateTemplatePdf,
    deleteTemplatePdf,
     
}