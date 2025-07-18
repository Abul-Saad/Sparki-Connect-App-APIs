import dotenv from 'dotenv';
dotenv.config();

import _ from 'lodash';
import userQuery from '../utils/helper/dbHelper.js';

const addBookmarkContents = async (req, res) => {
    const { educationContentId } = req.body;
    const { userId } = req.user;

    if(!educationContentId) {
        return res.status(400).json({
            status : "error",
            message : "Education Content Id is required.",
            statusCode : 400
        });
    }

    try {
        const [content] = await userQuery(
            `SELECT id FROM education_content WHERE id = ?`,
            [educationContentId]
        );

        if(!content){
            return res.status(404).json({
                status : "error",
                message : "The education content you are trying to bookmark does not exist.",
                statusCode : 404
            });
        }

        const [exists] = await userQuery(
            `SELECT 1 FROM bookmarks_education_contents WHERE user_id = ? AND education_content_id = ? LIMIT 1`,
            [userId, educationContentId]
        );
        
        if(exists) {
            return res.status(409).json({
                status : "error",
                message : "You have already bookmarked this education content."
            });
        }

        await userQuery(
            `INSERT INTO bookmarks_education_contents (user_id, education_content_id) VALUES(?, ?)`,
            [userId, educationContentId]
        );

        return res.status(200).json({
            status : "success",
            message : "Education Content bookmarked successfully!.",
            statusCode : 200,
        });

    } catch (error) {
        console.error("Bookmark Contents Error : ", error);
        return res.status(500).json({
            status : "error",
            message : "Internal Server Error",
            error : error.message,
            statusCode : 500
        });
    }


}

const getBookmarkContents = async (req, res) => {
    const { userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const totalResult = await userQuery(
            `SELECT COUNT(*) AS total FROM bookmarks_education_contents WHERE user_id = ?`,
            [userId]
        );

        const total = totalResult[0]?.total || 0;

        const bookmarkEducationContents = await userQuery(
        `SELECT *
            FROM bookmarks_education_contents bec
            JOIN education_content ec ON bec.education_content_id = ec.id
            WHERE bec.user_id = ?
            ORDER BY bec.bookmarked_at DESC
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
    return res.status(200).json({
        status : "success",
        message : "Bookmarked education contents fetched successfully.",
        data : bookmarkEducationContents,
        pagination : {
            totalsItems : total,
            currentPage : page,
            totalPages : Math.ceil(total/limit),
            limit,
        },
        statusCode : 200,
    });

    } catch (error) {
        console.error("Fetch Bookmark Error : ", error);
        return res.status(500).json({
            status : "error",
            message : "Internal Server Error",
            error : error.message,
            statusCode : 500,
        });
    }
}

const removeBookmarkContent = async (req, res) => {
    const { educationContentId } = req.params;
    const { userId } = req.user;

    if(!educationContentId) {
        return res.status(400).json({
            status : "error",
            message : "Education Content ID required.",
            statusCode : 400,
        });
    }

    try {
        const [bookmark] = await userQuery(
            `SELECT 1 FROM bookmarks_education_contents WHERE user_id = ? AND education_content_id = ? LIMIT 1`,
            [userId, educationContentId]
        );

        if(!bookmark) {
            return res.status(404).json({
                status : "error",
                message : "Bookmark not found.",
                statusCode : 404,
            });
        }

        await userQuery(
            `DELETE FROM bookmarks_education_contents WHERE user_id = ? AND education_content_id = ?`,
            [userId, educationContentId]
        );

        return res.status(200).json({
            status : "success",
            message : "Bookmark remove successfully!.",
            statusCode : 200,
        });

    } catch (error) {
        console.error("Remove Bookmark Error: ", error);
        return res.status(500).json({
            status : "error",
            message : "Internal Server Error",
            error : error.message,
            statusCode : 500,
        });
    }
}

export default {
    addBookmarkContents,
    getBookmarkContents,
    removeBookmarkContent,
}