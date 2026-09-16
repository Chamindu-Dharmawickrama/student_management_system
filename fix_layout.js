const fs = require('fs');
const path = require('path');

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
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file} - not found`);
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');

    // Add import if not present
    if (!content.includes('PageContainer')) {
        // find a good place to insert the import, e.g., after the last import
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfLastImport = content.indexOf('\n', lastImportIndex);
            content = content.substring(0, endOfLastImport + 1) + 'import { PageContainer } from "@/shared/components/layout";\n' + content.substring(endOfLastImport + 1);
        } else {
            content = 'import { PageContainer } from "@/shared/components/layout";\n' + content;
        }
    }

    // Replace `return (\n    <div className="space-y-6">` with `return (\n    <PageContainer>`
    // We can use a regex to find `return (\n *<div className="space-y-...">`
    // but the safest way is to find the first `<div className="space-y-` after `return (` and replace it with `<PageContainer>`
    const returnRegex = /return\s*\(\s*<div[^>]*className=["'][^"']*space-y-[^"']*["'][^>]*>/;
    const match = content.match(returnRegex);
    if (match) {
        content = content.replace(returnRegex, 'return (\n    <PageContainer>');
        // Then find the very last </div> before `);` at the end of the component
        // Since we are changing the root div, the last `</div>` before the end of the file is likely it.
        const lastDivRegex = /<\/div>\s*\)\s*;\s*}\s*$/;
        content = content.replace(lastDivRegex, '</PageContainer>\n  );\n}');
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Could not find root div in ${file}`);
    }
}
