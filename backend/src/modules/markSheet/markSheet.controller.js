import { sendSuccess } from "../../utils/apiResponse.js";
import {
    listMarkSheetsService,
    getMarkSheetDetailService,
    submitMarkSheetService,
    approveMarkSheetService,
    rejectMarkSheetService,
    lockMarkSheetService,
} from "./markSheet.service.js";

// GET /marksheets
export const listMarkSheetsController = async (req, res) => {
    const { items, meta } = await listMarkSheetsService(req.user, req.query);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheets retrieved successfully.", data: items, meta });
};

// GET /marksheets/:id
export const getMarkSheetController = async (req, res) => {
    const markSheet = await getMarkSheetDetailService(req.user, req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheet retrieved successfully.", data: markSheet });
};

// POST /marksheets/:id/submit
export const submitMarkSheetController = async (req, res) => {
    const markSheet = await submitMarkSheetService(req.user.id, req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheet submitted for approval.", data: markSheet });
};

// POST /marksheets/:id/approve
export const approveMarkSheetController = async (req, res) => {
    const markSheet = await approveMarkSheetService(req.user.id, req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheet approved.", data: markSheet });
};

// POST /marksheets/:id/reject
export const rejectMarkSheetController = async (req, res) => {
    const markSheet = await rejectMarkSheetService(req.user.id, req.params.id, req.body.reason);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheet rejected.", data: markSheet });
};

// POST /marksheets/:id/lock
export const lockMarkSheetController = async (req, res) => {
    const markSheet = await lockMarkSheetService(req.user.id, req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Mark sheet locked.", data: markSheet });
};
