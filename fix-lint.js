const fs = require('fs');

// Helper to replace in file
function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    for (const { search, replace } of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

// 1. ExamDetail.tsx
replaceInFile('frontend/src/features/academicYear/pages/ExamDetail.tsx', [
    { search: /import React from "react";\n/, replace: '' },
    { search: /import \{ updateExamSchema, UpdateExamInput \}/g, replace: 'import { updateExamSchema, type UpdateExamInput }' },
    { search: /value=\{exam.results.length.toString\(\)\}/g, replace: 'value={exam.markSheetCount.toString()}' },
    { search: /<PageHeader[\s\S]*?breadcrumbs=\{[\s\S]*?\}[\s\S]*?\/>/g, replace: '<PageHeader\n        title={`${exam.name} Details`}\n        description={formatDateRange(exam.startDate, exam.endDate)}\n      />' }
]);

// 2. AcademicYearDetail.tsx
replaceInFile('frontend/src/features/academicYear/pages/AcademicYearDetail.tsx', [
    { search: /import React from "react";\n/, replace: '' },
    { search: /import \{ termSchema, UpdateTermInput \}/g, replace: 'import { termSchema, type UpdateTermInput }' },
    { search: /import \{ Term, Exam \}/g, replace: 'import type { Term, Exam }' },
    { search: /<PageHeader[\s\S]*?breadcrumbs=\{[\s\S]*?\}[\s\S]*?\/>/g, replace: '<PageHeader\n        title={`${academicYear.name} Details`}\n        description={`${formatDate(academicYear.startDate)} - ${formatDate(academicYear.endDate)}`}\n      />' }
]);

// 3. AcademicYearsList.tsx
replaceInFile('frontend/src/features/academicYear/pages/AcademicYearsList.tsx', [
    { search: /import React, \{ useState \} from "react";\n/, replace: 'import { useState } from "react";\n' },
    { search: /import \{ AcademicYear \} from "\.\.\/types\/academicYear.types";/g, replace: 'import type { AcademicYearListDTO as AcademicYear } from "../types/academicYear.types";' }
]);

// 4. classesApi.ts
replaceInFile('frontend/src/features/classes/api/classesApi.ts', [
    { search: /import type \{ Class, ClassInput, ClassDetailDTO \}/g, replace: 'import type { Class, ClassDetailDTO }' },
    { search: /import type \{ PaginatedResponse, ApiResponse \}/g, replace: 'import type { ApiResponse }' },
    { search: /import \{ PaginatedResponse \} from "@\/features\/academicYear\/api\/academicYearApi";/g, replace: 'import type { PaginatedResponse } from "@/types/api.types";' },
    { search: /meta: response.meta!,/g, replace: 'meta: response.meta!,\n        success: response.success,\n        message: response.message' }
]);

// 5. ClassModal.tsx
replaceInFile('frontend/src/features/classes/components/ClassModal.tsx', [
    { search: /import React, \{ useEffect \} from "react";\n/, replace: 'import { useEffect } from "react";\n' },
    { search: /<Alert variant="warning">/g, replace: '<Alert variant="warning" title="Warning">' }
]);

// 6. ClassDetail.tsx
replaceInFile('frontend/src/features/classes/pages/ClassDetail.tsx', [
    { search: /import \{ useParams, useNavigate, Link \}/g, replace: 'import { useParams, Link }' },
    { search: /const navigate = useNavigate\(\);\n/g, replace: '' },
    { search: /studentCount\.toString\(\)/g, replace: 'currentStudentCount.toString()' }
]);

// 7. ClassesList.tsx
replaceInFile('frontend/src/features/classes/pages/ClassesList.tsx', [
    { search: /import \{ useGetClassesQuery \} from "\.\.\/api\/classesApi";\nimport \{ ClassModal \} from "\.\.\/components\/ClassModal";\nimport \{ Class \} from "\.\.\/types\/classes\.types";/g, replace: 'import { useGetClassesQuery } from "../api/classesApi";\nimport { ClassModal } from "../components/ClassModal";\nimport type { Class } from "../types/classes.types";' },
    { search: /<Alert variant="warning">/g, replace: '<Alert variant="warning" title="Warning">' }
]);

// 8. classes.schemas.ts
replaceInFile('frontend/src/features/classes/validation/classes.schemas.ts', [
    { search: /required_error: "Grade level is required",/g, replace: '' }
]);

// 9. gradeBandsApi.ts
replaceInFile('frontend/src/features/gradeBands/api/gradeBandsApi.ts', [
    { search: /import \{ PaginatedResponse \} from "@\/features\/academicYear\/api\/academicYearApi";/g, replace: 'import type { PaginatedResponse } from "@/types/api.types";' }
]);

// 10. GradeBandModal.tsx
replaceInFile('frontend/src/features/gradeBands/components/GradeBandModal.tsx', [
    { search: /import React, \{ useEffect \} from "react";\n/, replace: 'import { useEffect } from "react";\n' },
    { search: /<Alert variant="danger">/g, replace: '<Alert variant="danger" title="Error">' },
    { search: /import React from "react";\n/, replace: '' }
]);

// 11. gradeBands.schemas.ts
replaceInFile('frontend/src/features/gradeBands/validation/gradeBands.schemas.ts', [
    { search: /invalid_type_error: "Min mark must be a number",/g, replace: '' },
    { search: /invalid_type_error: "Max mark must be a number",/g, replace: '' }
]);

// 12. subjectsApi.ts
replaceInFile('frontend/src/features/subjects/api/subjectsApi.ts', [
    { search: /meta: response.meta!,/g, replace: 'meta: response.meta!,\n        success: response.success,\n        message: response.message' }
]);

// 13. SubjectModal.tsx
replaceInFile('frontend/src/features/subjects/components/SubjectModal.tsx', [
    { search: /import React from "react";\n/, replace: '' },
    { search: /helperText="Code is automatically uppercased."/g, replace: '' }
]);

console.log("Done");
