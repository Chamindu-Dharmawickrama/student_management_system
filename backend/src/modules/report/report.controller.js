import { sendSuccess } from "../../utils/apiResponse.js";
import { getStudentTermReportService, getClassExamReportService } from "./report.service.js";
import { renderStudentTermReportPdf, renderClassMarkSheetPdf } from "./report.pdf.js";
import { renderStudentTermReportExcel, renderClassMarkSheetExcel } from "./report.excel.js";

const CONTENT_TYPES = {
    pdf: "application/pdf",
    excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const EXTENSIONS = { pdf: "pdf", excel: "xlsx" };

const sendFile = async (res, buffer, format, filenameBase) => {
    res.setHeader("Content-Type", CONTENT_TYPES[format]);
    res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.${EXTENSIONS[format]}"`);
    return res.send(buffer);
};

// GET /reports/student/:studentId/term/:termId
export const getStudentTermReportController = async (req, res) => {
    const { studentId, termId } = req.params;
    const { format } = req.query;

    const payload = await getStudentTermReportService(req.user, studentId, termId, format);

    if (format === "json") {
        return sendSuccess(res, { statusCode: 200, message: "Report retrieved successfully.", data: payload });
    }

    const buffer = format === "pdf" ? await renderStudentTermReportPdf(payload) : await renderStudentTermReportExcel(payload);
    return sendFile(res, buffer, format, `term-report-${studentId}-${termId}`);
};

// GET /reports/class/:classId/exam/:examId
export const getClassExamReportController = async (req, res) => {
    const { classId, examId } = req.params;
    const { format } = req.query;

    const payload = await getClassExamReportService(req.user, classId, examId, format);

    if (format === "json") {
        return sendSuccess(res, { statusCode: 200, message: "Report retrieved successfully.", data: payload });
    }

    const buffer = format === "pdf" ? await renderClassMarkSheetPdf(payload) : await renderClassMarkSheetExcel(payload);
    return sendFile(res, buffer, format, `class-marksheet-${classId}-${examId}`);
};
