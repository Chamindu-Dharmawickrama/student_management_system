const fs = require('fs');

const filesToUpdate = [
    'frontend/src/features/academicYear/pages/AcademicYearsList.tsx',
    'frontend/src/features/academicYear/pages/AcademicYearDetail.tsx',
    'frontend/src/features/academicYear/pages/ExamDetail.tsx',
    'frontend/src/features/subjects/pages/SubjectsList.tsx',
    'frontend/src/features/classes/pages/ClassesList.tsx',
    'frontend/src/features/classes/pages/ClassDetail.tsx',
    'frontend/src/features/gradeBands/pages/GradeBandsList.tsx',
];

for (const file of filesToUpdate) {
    if (!fs.existsSync(file)) continue;

    let content = fs.readFileSync(file, 'utf8');

    // Make sure we have PageContainer import
    if (!content.includes('PageContainer')) {
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            content = content.substring(0, endOfLastImport + 1) + 'import { PageContainer } from "@/shared/components/layout";\n' + content.substring(endOfLastImport + 1);
        } else {
            content = 'import { PageContainer } from "@/shared/components/layout";\n' + content;
        }
    }

    // Replace all instances of `<div className="space-y-4">` and `<div className="space-y-6">` that are right after a return with PageContainer
    content = content.replace(/return\s*\(\s*<div[^>]*className=["'][^"']*space-y-(4|6)["'][^>]*>/g, 'return (\n    <PageContainer>');

    // We also need to fix the closing tags.
    // In ClassesList there's an early return.
    // To be perfectly safe, we can manually fix the specific known issues.
    // Instead of regex for closing tags, we can just replace `<PageContainer>` back to what it was, and then do a reliable string replacement for the specific files.
}
