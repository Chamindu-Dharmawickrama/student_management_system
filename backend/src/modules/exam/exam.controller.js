import { sendSuccess } from "../../utils/apiResponse.js";
import { getExamService, updateExamPeriodService, generateMarkSheetsService } from "./exam.service.js";

// GET /exams/:id
export const getExamController = async (req, res) => {
    const exam = await getExamService(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Exam retrieved successfully.", data: exam });
};

// PATCH /exams/:id
export const updateExamPeriodController = async (req, res) => {
    const exam = await updateExamPeriodService(req.params.id, req.body);
    return sendSuccess(res, { statusCode: 200, message: "Exam period updated successfully.", data: exam });
};

// POST /exams/:id/generate-marksheets
export const generateMarkSheetsController = async (req, res) => {
    const result = await generateMarkSheetsService(req.params.id, req.user.id);
    return sendSuccess(res, {
        statusCode: 200,
        message: "MarkSheet generation completed.",
        data: result,
    });
};
