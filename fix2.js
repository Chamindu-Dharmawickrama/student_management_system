const fs = require('fs');

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

// 1. AcademicYearModal.tsx
replaceInFile('frontend/src/features/academicYear/components/AcademicYearModal.tsx', [
    { search: /import React from "react";\n/, replace: '' },
    { search: /import \{ academicYearSchema, CreateAcademicYearInput \}/g, replace: 'import { academicYearSchema, type CreateAcademicYearInput }' },
    { search: /<Alert variant="danger">/g, replace: '<Alert variant="danger" title="Error">' },
    { search: /<Alert variant="info" className="mb-4">/g, replace: '<Alert variant="info" title="Info" className="mb-4">' }
]);

// 2. useSelectedAcademicYear.ts
replaceInFile('frontend/src/features/academicYear/hooks/useSelectedAcademicYear.ts', [
    { search: /selectSelectedAcademicYearId,/g, replace: 'selectCurrentYearId,' },
    { search: /setSelectedAcademicYearId,/g, replace: 'setCurrentYearId,' },
    { search: /selectSelectedAcademicYearId\)/g, replace: 'selectCurrentYearId)' },
    { search: /setSelectedAcademicYearId\(/g, replace: 'setCurrentYearId(' }
]);

// 3. AcademicYearDetail.tsx
replaceInFile('frontend/src/features/academicYear/pages/AcademicYearDetail.tsx', [
    { search: /formatDate\(academicYear.startDate\)/g, replace: 'formatDate(yearDetails.startDate)' },
    { search: /formatDate\(academicYear.endDate\)/g, replace: 'formatDate(yearDetails.endDate)' },
    { search: /\$\{academicYear.name\}/g, replace: '${yearDetails.name}' }
]);

// 4. AcademicYearsList.tsx
replaceInFile('frontend/src/features/academicYear/pages/AcademicYearsList.tsx', [
    { search: /import type \{ AcademicYearListDTO as AcademicYear \} from "\.\.\/types\/academicYear.types";/g, replace: 'import type { AcademicYearListItem as AcademicYear } from "../types/academicYear.types";' },
    { search: /import \{ AcademicYearListDTO as AcademicYear \} from "\.\.\/types\/academicYear.types";/g, replace: 'import type { AcademicYearListItem as AcademicYear } from "../types/academicYear.types";' }
]);

// 5. ExamDetail.tsx
replaceInFile('frontend/src/features/academicYear/pages/ExamDetail.tsx', [
    { search: /icon=\{null as any\}/g, replace: 'icon={undefined}' },
    { search: /icon=\{null\}/g, replace: 'icon={undefined}' }
]);

// 6. ClassDetail.tsx
replaceInFile('frontend/src/features/classes/pages/ClassDetail.tsx', [
    { search: /icon=\{null as any\}/g, replace: 'icon={undefined}' },
    { search: /icon=\{null\}/g, replace: 'icon={undefined}' }
]);

// 7. classesApi.ts
replaceInFile('frontend/src/features/classes/api/classesApi.ts', [
    { search: /import type \{ ApiResponse \} from "@\/types\/api.types";/g, replace: 'import type { ApiResponse, PaginatedResponse } from "@/types/api.types";' }
]);

// 8. classes.schemas.ts
replaceInFile('frontend/src/features/classes/validation/classes.schemas.ts', [
    { search: /invalid_type_error: "Grade level is required",/g, replace: '' }
]);

// 9. gradeBandsApi.ts
replaceInFile('frontend/src/features/gradeBands/api/gradeBandsApi.ts', [
    { search: /meta: response.meta!,/g, replace: 'meta: response.meta!,\n        success: response.success,\n        message: response.message' }
]);

console.log("Done");
