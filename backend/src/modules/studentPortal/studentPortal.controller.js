import { sendSuccess } from "../../utils/apiResponse.js";
import { getStudentService } from "../student/student.service.js";
import { listStudentMarksService } from "../marks/marks.service.js";

// GET /student/me — reuses the admin detail service unchanged: User.id is
// the FK anchor for StudentProfile, so req.user.id works exactly like the
// admin's :id path param. There is deliberately no GET /student/:id — the
// logged-in user IS the only student this router can ever return (§13/§35).
export const getMyProfileController = async (req, res) => {
    const student = await getStudentService(req.user.id);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Profile retrieved successfully.",
        data: student,
    });
};

// GET /student/me/marks
export const listMyMarksController = async (req, res) => {
    const { items, meta } = await listStudentMarksService(req.user.id, req.query);

    return sendSuccess(res, {
        statusCode: 200,
        message: "Marks retrieved successfully.",
        data: items,
        meta,
    });
};
