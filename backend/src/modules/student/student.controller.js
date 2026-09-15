import { sendSuccess } from "../../utils/apiResponse.js";
import {
    registerStudentService,
    listStudentsService,
    getStudentService,
    updateStudentService,
    deactivateStudentService,
    getStudentSubjectSelectionsService,
    setStudentSubjectSelectionsService,
} from "./student.service.js";

// POST /students
export const createStudentController = async (req, res) => {
    const student = await registerStudentService(req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Student registered successfully. Login credentials have been emailed.",
        data: student,
    });
};

// GET /students
export const listStudentsController = async (req, res) => {
    const { items, meta } = await listStudentsService(req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Students retrieved successfully.",
        data: items,
        meta,
    });
};

// GET /students/:id
export const getStudentController = async (req, res) => {
    const student = await getStudentService(req.params.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Student retrieved successfully.",
        data: student,
    });
};

// PATCH /students/:id
export const updateStudentController = async (req, res) => {
    const student = await updateStudentService(req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Student updated successfully.",
        data: student,
    });
};

// DELETE /students/:id
export const deleteStudentController = async (req, res) => {
    await deactivateStudentService(req.params.id, req.user.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Student deactivated successfully.",
        data: { id: req.params.id, isActive: false },
    });
};

// GET /students/:id/subject-selections
export const listSubjectSelectionsController = async (req, res) => {
    const selections = await getStudentSubjectSelectionsService(req.params.id, req.query.academicYearId);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Subject selections retrieved successfully.",
        data: selections,
    });
};

// PUT /students/:id/subject-selections
export const setSubjectSelectionsController = async (req, res) => {
    const selections = await setStudentSubjectSelectionsService(req.params.id, req.body);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Subject selections updated successfully.",
        data: selections,
    });
};
