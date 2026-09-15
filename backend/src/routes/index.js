import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import profileRouter from "../modules/profile/profile.routes.js";
import studentRouter from "../modules/student/student.routes.js";
import teacherRouter from "../modules/teacher/teacher.routes.js";
import studentPortalRouter from "../modules/studentPortal/studentPortal.routes.js";
import teacherPortalRouter from "../modules/teacherPortal/teacherPortal.routes.js";
import subjectRouter from "../modules/subject/subject.routes.js";
import classRouter from "../modules/class/class.routes.js";
import academicYearRouter from "../modules/academicYear/academicYear.routes.js";
import examRouter from "../modules/exam/exam.routes.js";
import gradeBandRouter from "../modules/gradeBand/gradeBand.routes.js";

const router = Router();

router.use("/auth", authRouter)
router.use("/profile", profileRouter)
router.use("/students", studentRouter)
router.use("/teachers", teacherRouter)
router.use("/student", studentPortalRouter)
router.use("/teacher", teacherPortalRouter)
router.use("/subjects", subjectRouter)
router.use("/classes", classRouter)
router.use("/academic-years", academicYearRouter)
router.use("/exams", examRouter)
router.use("/grade-bands", gradeBandRouter)

export default router;