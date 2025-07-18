import dotenv from 'dotenv';
dotenv.config();

import _ from 'lodash';
import userQuery from '../utils/helper/dbHelper.js';

import path from 'path';
import fs from 'fs';

// upload Pdf Template
const uploadTemplatePdf = async (req, res) => {
    const { name, type, access } = req.body;
    const pdfFile = req.file;

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
        const filePath = `/uploads/templatesPdf/${pdfFile.filename}`;

        await userQuery(
            `INSERT INTO templates_pdf  (name, file_path, type, access) VALUES (?, ?, ?, ?)`,
            [name, filePath, type, access || "free"]
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
        let query = `SELECT id, name, type, access, file_path, uploaded_at FROM templates_pdf`;
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
    const { id, name, type, access } = req.body;
    const newPdfFile = req.file;

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
       const rows = await userQuery(`SELECT file_path FROM templates_pdf WHERE id = ?`, [id]);

if (!rows || rows.length === 0) {
    return res.status(404).json({
        status: "error",
        message: "Template not found.",
        statusCode: 404
    });
}

let updatedFilePath = rows[0].file_path;

       if(newPdfFile){
        const oldFilePath = path.join("public", rows[0].file_path);
        if(fs.existsSync (oldFilePath)){
            fs.unlinkSync(oldFilePath);
        }

        updatedFilePath = `/uploads/templatesPdf/${newPdfFile.filename}`;

       }

       await userQuery(
        `UPDATE templates_pdf SET name = ?, type = ?, access = ?, file_path = ? WHERE id = ?`,
        [name, type, access, updatedFilePath, id]
       );

       return res.status(200).json({
        status : "success",
        message : "Template updated successfully.",
        statusCode : 200,
       });

    } catch (error) {
        console.error("Update Pdf: ", error);
        return res.status(500).json({
            status : "error",
            message : error.message,
            statusCode :500,
        });
    }
}

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