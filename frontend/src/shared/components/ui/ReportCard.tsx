import { formatMark } from "@/shared/utils/formatUtils";
import { formatDate } from "@/shared/utils/dateUtils";
import type { StudentTermReportDto } from "@/features/reports/types/reports.types";

interface ReportCardProps {
    report: StudentTermReportDto;
}

export function ReportCard({ report }: ReportCardProps) {
    // We assume report is matching StudentTermReportDto schema
    return (
        <div className="bg-white text-black p-8 sm:p-12 shadow-sm border border-border max-w-4xl mx-auto print:border-none print:shadow-none print:max-w-none print:p-0">
            {/* School Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
                <img src="/mainLogo.png" alt="" className="h-16 w-16 mx-auto mb-3 object-contain" />
                <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Student Management System</h1>
                <h2 className="text-xl font-semibold text-gray-700">Official Report Card</h2>
            </div>

            {/* Student Details Grid */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                <div>
                    <span className="text-gray-500 font-medium">Name: </span>
                    <span className="font-semibold text-gray-900">{report.student.firstName} {report.student.lastName}</span>
                </div>
                <div>
                    <span className="text-gray-500 font-medium">Academic Year: </span>
                    <span className="font-semibold text-gray-900">{report.academicYear.name}</span>
                </div>
                <div>
                    <span className="text-gray-500 font-medium">Admission No: </span>
                    <span className="font-semibold text-gray-900">{report.student.admissionNumber}</span>
                </div>
                <div>
                    <span className="text-gray-500 font-medium">Term: </span>
                    <span className="font-semibold text-gray-900">{report.term.name}</span>
                </div>
                <div>
                    <span className="text-gray-500 font-medium">Class: </span>
                    <span className="font-semibold text-gray-900">{report.class?.name ?? '—'}</span>
                </div>
                {report.exam.startDate && report.exam.endDate && (
                    <div>
                        <span className="text-gray-500 font-medium">Exam Period: </span>
                        <span className="font-semibold text-gray-900">
                            {formatDate(report.exam.startDate)} – {formatDate(report.exam.endDate)}
                        </span>
                    </div>
                )}
            </div>

            {/* Marks Table */}
            <table className="w-full text-left border-collapse mb-8">
                <thead>
                    <tr className="bg-gray-100 border-y-2 border-gray-300 print:bg-gray-100">
                        <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs">Subject</th>
                        <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs text-right w-24">Marks</th>
                        <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs text-center w-24">Grade</th>
                        <th className="py-3 px-4 font-bold text-gray-900 uppercase text-xs w-1/3">Remarks</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {report.subjects.map((s) => (
                        <tr key={s.subject.id} className="print:break-inside-avoid">
                            <td className="py-3 px-4">
                                <span className="font-semibold text-gray-900">{s.subject.name}</span>
                                {s.subject.code && <span className="text-gray-500 text-xs ml-2">({s.subject.code})</span>}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900 tabular-nums">
                                {formatMark(s.marksObtained, s.maxMarks, s.isAbsent)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-gray-900">
                                {s.grade ?? "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                                {s.remarks ?? "—"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Summary Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-md border border-gray-200 print:bg-gray-50 print:break-inside-avoid">
                <div className="text-center">
                    <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Total Marks</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.totals.totalMarks}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Average</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.totals.average !== null ? `${report.totals.average.toFixed(1)}%` : "—"}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Overall Grade</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{report.totals.overallGrade ?? "—"}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Passed</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                        {report.totals.subjectsPassed} <span className="text-sm font-medium text-gray-500">/ {report.totals.subjectCount}</span>
                    </p>
                </div>
            </div>

            {/* Signatures */}
            <div className="mt-20 flex justify-between px-8 print:break-inside-avoid">
                <div className="text-center w-48">
                    <div className="border-t border-gray-400 pt-2 text-sm font-semibold text-gray-700">Class Teacher</div>
                </div>
                <div className="text-center w-48">
                    <div className="border-t border-gray-400 pt-2 text-sm font-semibold text-gray-700">Principal</div>
                </div>
            </div>
        </div>
    );
}
