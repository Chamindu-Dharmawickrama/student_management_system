import ExcelJS from "exceljs";

export const renderStudentTermReportExcel = async (payload) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Term Report");

    sheet.addRow(["Student", `${payload.student.firstName} ${payload.student.lastName}`]);
    sheet.addRow(["Admission No.", payload.student.admissionNumber]);
    sheet.addRow(["Class", payload.class ? payload.class.name : "-"]);
    sheet.addRow(["Academic Year", payload.academicYear.name]);
    sheet.addRow(["Term", payload.term.name]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(["Subject", "Marks Obtained", "Max Marks", "Absent", "Grade", "Status", "Remarks"]);
    headerRow.font = { bold: true };

    for (const row of payload.subjects) {
        sheet.addRow([
            row.subject.name,
            row.marksObtained,
            row.maxMarks,
            row.isAbsent ? "Yes" : "No",
            row.grade ?? "",
            row.status,
            row.remarks ?? "",
        ]);
    }

    sheet.addRow([]);
    sheet.addRow(["Subjects", payload.totals.subjectCount]);
    sheet.addRow(["Total Marks", payload.totals.totalMarks]);
    sheet.addRow(["Average", payload.totals.average]);
    sheet.addRow(["Overall Grade", payload.totals.overallGrade ?? ""]);
    sheet.addRow(["Subjects Passed", payload.totals.subjectsPassed]);
    sheet.addRow(["Subjects Failed", payload.totals.subjectsFailed]);

    sheet.columns.forEach((column) => {
        column.width = 20;
    });

    return workbook.xlsx.writeBuffer();
};

export const renderClassMarkSheetExcel = async (payload) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Class Mark Sheet");

    sheet.addRow(["Class", payload.class.name]);
    sheet.addRow(["Academic Year", payload.academicYear.name]);
    sheet.addRow(["Exam", payload.exam.name]);
    if (payload.term) sheet.addRow(["Term", payload.term.name]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(["Admission No.", "First Name", "Last Name", "Subject", "Marks Obtained", "Max Marks", "Absent", "Grade", "Remarks"]);
    headerRow.font = { bold: true };

    for (const row of payload.students) {
        sheet.addRow([
            row.student.admissionNumber,
            row.student.firstName,
            row.student.lastName,
            row.subject.name,
            row.marksObtained,
            row.maxMarks,
            row.isAbsent ? "Yes" : "No",
            row.grade ?? "",
            row.remarks ?? "",
        ]);
    }

    sheet.addRow([]);
    sheet.addRow(["Students", payload.stats.studentCount]);
    sheet.addRow(["Highest", payload.stats.highest?.marksObtained ?? ""]);
    sheet.addRow(["Lowest", payload.stats.lowest?.marksObtained ?? ""]);
    sheet.addRow(["Average", payload.stats.average]);
    sheet.addRow(["Pass Rate", payload.stats.passRate !== null ? `${(payload.stats.passRate * 100).toFixed(1)}%` : ""]);
    sheet.addRow(["Grade Distribution", Object.entries(payload.stats.gradeDistribution).map(([g, c]) => `${g}: ${c}`).join(", ")]);

    sheet.columns.forEach((column) => {
        column.width = 18;
    });

    return workbook.xlsx.writeBuffer();
};
