import PDFDocument from "pdfkit";

// Collects a PDFDocument's streamed output into one Buffer — pdfkit writes
// incrementally rather than returning a value, so every render function
// pipes through this instead of persisting to disk (Report.filePath stays
// null; the file only ever exists in memory for this one response).
const toBuffer = (doc) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
    });

const formatScore = (row) => {
    if (row.isAbsent) return "Absent";
    if (row.marksObtained === null) return "Not entered";
    return `${row.marksObtained}/${row.maxMarks}`;
};

export const renderStudentTermReportPdf = (payload) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.fontSize(18).text("Student Term Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Student: ${payload.student.firstName} ${payload.student.lastName} (${payload.student.admissionNumber})`);
    doc.text(`Class: ${payload.class ? payload.class.name : "-"}`);
    doc.text(`Academic Year: ${payload.academicYear.name}`);
    doc.text(`Term: ${payload.term.name}`);
    doc.moveDown();

    doc.fontSize(13).text("Subjects", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const row of payload.subjects) {
        const label = `${row.subject.name}  —  ${formatScore(row)}  —  Grade: ${row.grade ?? "-"}`;
        doc.text(row.status && row.status !== "APPROVED" && row.status !== "LOCKED" ? `${label}  [${row.status}]` : label);
        if (row.remarks) doc.fontSize(9).fillColor("#555555").text(`  Remarks: ${row.remarks}`).fillColor("black").fontSize(10);
    }

    doc.moveDown();
    doc.fontSize(13).text("Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Subjects: ${payload.totals.subjectCount}`);
    doc.text(`Total Marks: ${payload.totals.totalMarks}`);
    doc.text(`Average: ${payload.totals.average !== null ? payload.totals.average.toFixed(2) : "-"}`);
    doc.text(`Overall Grade: ${payload.totals.overallGrade ?? "-"}`);
    doc.text(`Passed: ${payload.totals.subjectsPassed}   Failed: ${payload.totals.subjectsFailed}`);

    return toBuffer(doc);
};

export const renderClassMarkSheetPdf = (payload) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.fontSize(18).text("Class Mark Sheet", { align: "center" });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Class: ${payload.class.name}`);
    doc.text(`Academic Year: ${payload.academicYear.name}`);
    doc.text(`Exam: ${payload.exam.name}${payload.term ? ` (${payload.term.name})` : ""}`);
    doc.moveDown();

    doc.fontSize(13).text("Students", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (const row of payload.students) {
        doc.text(
            `${row.student.lastName}, ${row.student.firstName} (${row.student.admissionNumber}) — ${row.subject.name} — ${formatScore(row)} — Grade: ${row.grade ?? "-"}`,
        );
    }

    doc.moveDown();
    doc.fontSize(13).text("Class Statistics", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Students: ${payload.stats.studentCount}`);
    doc.text(`Highest: ${payload.stats.highest ? `${payload.stats.highest.marksObtained} (${payload.stats.highest.student.firstName} ${payload.stats.highest.student.lastName})` : "-"}`);
    doc.text(`Lowest: ${payload.stats.lowest ? `${payload.stats.lowest.marksObtained} (${payload.stats.lowest.student.firstName} ${payload.stats.lowest.student.lastName})` : "-"}`);
    doc.text(`Average: ${payload.stats.average !== null ? payload.stats.average.toFixed(2) : "-"}`);
    doc.text(`Pass Rate: ${payload.stats.passRate !== null ? `${(payload.stats.passRate * 100).toFixed(1)}%` : "-"}`);
    doc.text(`Grade Distribution: ${Object.entries(payload.stats.gradeDistribution).map(([g, c]) => `${g}: ${c}`).join(", ") || "-"}`);

    return toBuffer(doc);
};
