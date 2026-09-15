import { sendSuccess } from "../../utils/apiResponse.js";
import {
    createAcademicYearService,
    listAcademicYearsService,
    getAcademicYearService,
    updateAcademicYearService,
    listTermsService,
    getTermService,
    updateTermService,
} from "./academicYear.service.js";

// POST /academic-years
export const createAcademicYearController = async (req, res) => {
    const academicYear = await createAcademicYearService(req.body);
    return sendSuccess(res, {
        statusCode: 201,
        message: "Academic year created successfully.",
        data: academicYear,
    });
};

// GET /academic-years
export const listAcademicYearsController = async (req, res) => {
    const { items, meta } = await listAcademicYearsService(req.query);
    return sendSuccess(res, { statusCode: 200, message: "Academic years retrieved successfully.", data: items, meta });
};

// GET /academic-years/:id
export const getAcademicYearController = async (req, res) => {
    const academicYear = await getAcademicYearService(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Academic year retrieved successfully.", data: academicYear });
};

// PATCH /academic-years/:id
export const updateAcademicYearController = async (req, res) => {
    const academicYear = await updateAcademicYearService(req.params.id, req.body);
    return sendSuccess(res, { statusCode: 200, message: "Academic year updated successfully.", data: academicYear });
};

// GET /academic-years/:id/terms
export const listTermsController = async (req, res) => {
    const terms = await listTermsService(req.params.id);
    return sendSuccess(res, { statusCode: 200, message: "Terms retrieved successfully.", data: terms });
};

// GET /academic-years/:id/terms/:termId
export const getTermController = async (req, res) => {
    const term = await getTermService(req.params.id, req.params.termId);
    return sendSuccess(res, { statusCode: 200, message: "Term retrieved successfully.", data: term });
};

// PATCH /academic-years/:id/terms/:termId
export const updateTermController = async (req, res) => {
    const term = await updateTermService(req.params.id, req.params.termId, req.body);
    return sendSuccess(res, { statusCode: 200, message: "Term updated successfully.", data: term });
};
