#!/usr/bin/env node
/**
 * Generate grade pages (3-12) and activities from templates
 * Uses existing grade2 and grade6 files as templates
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PUBLIC = path.join(ROOT, 'public');
const ACTIVITIES = path.join(PUBLIC, 'activities');

const gradeNames = {
  1: 'الصف الأول', 2: 'الصف الثاني', 3: 'الصف الثالث', 4: 'الصف الرابع',
  5: 'الصف الخامس', 6: 'الصف السادس', 7: 'الصف السابع', 8: 'الصف الثامن',
  9: 'الصف التاسع', 10: 'الصف العاشر', 11: 'الصف الحادي عشر', 12: 'الصف الثاني عشر'
};

const colors = {
  1: ['#6C63FF', '#5A52D5'],    // Purple (same as grade 2)
  2: ['#6C63FF', '#5A52D5'],    // Purple
  3: ['#00C9A7', '#00A88E'],    // Green
  4: ['#FF9A56', '#E88A4C'],    // Orange
  5: ['#9B59B6', '#8E44AD'],    // Purple
  6: ['#FF6584', '#E5577A'],    // Pink (same as grade 6)
  7: ['#3498DB', '#2980B9'],    // Blue
  8: ['#E74C3C', '#C0392B'],    // Red
  9: ['#2ECC71', '#27AE60'],    // Green
  10: ['#F39C12', '#E67E22'],   // Amber
  11: ['#1ABC9C', '#16A085'],    // Teal
  12: ['#34495E', '#2C3E50']    // Dark blue
};

// ===== Grade Hub Pages =====
function createGradePage(grade) {
  const template = fs.readFileSync(path.join(ROOT, 'grade_template.html'), 'utf8');
  
  const page = template
    .replace(/<title>الصف <GRADE><\/title>/g, `<title>${gradeNames[grade]}</title>`)
    .replace(/<h1>📚 الأنشطة - <GRADE_NAME><\/h1>/g, `<h1>📚 الأنشطة - ${gradeNames[grade]}</h1>`)
    .replace(/onclick="goActivity\('reading'\)"/g, `onclick="goActivity('reading', ${grade})"`)
    .replace(/onclick="goActivity\('comprehension'\)"/g, `onclick="goActivity('comprehension', ${grade})"`)
    .replace(/onclick="goActivity\('grammar'\)"/g, `onclick="goActivity('grammar', ${grade})"`)
    .replace(/onclick="goActivity\('vocabulary'\)"/g, `onclick="goActivity('vocabulary', ${grade})"`)
    .replace(/onclick="goActivity\('handwriting'\)"/g, `onclick="goActivity('handwriting', ${grade})"`)
    .replace(/\.\.\/grade2\.html/g, `../grade${grade}.html`)
    .replace(/\.\.\/grade6\.html/g, `../grade${grade}.html`);
  
  const color = colors[grade] || ['#6C63FF', '#5A52D5'];
  const updated = page
    .replace(/--primary:#6C63FF/g, `--primary:${color[0]}`)
    .replace(/--accent:#00C9A7/g, `--accent:${color[0]}`)
    .replace(/background:linear-gradient\(135deg,var\(--primary\),#5A52D5\)/g, `background:linear-gradient(135deg,${color[0]},${color[1]})`)
    .replace(/background:linear-gradient\(135deg,var\(--primary\),#E5577A\)/g, `background:linear-gradient(135deg,${color[0]},${color[1]})`)
    .replace(/box-shadow:0 10px 40px rgba\(108,99,255,\.15\)/g, `box-shadow:0 10px 40px rgba(${hexToRgb(color[0])},.15)`)
    .replace(/box-shadow:0 20px 50px rgba\(108,99,255,\.2\)/g, `box-shadow:0 20px 50px rgba(${hexToRgb(color[0])},.2)`);

  // Update the script
  const scriptMatch = updated.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    const script = scriptMatch[1];
    const updatedScript = script.replace(
      /function goActivity\(act\) \{[\s\S]*?window\.location\.href = `activities\/grade\$\{grade\}-\$\{act\}\.html`;[\s\S]*?\}/,
      `function goActivity(act, g) { window.location.href = \`activities/grade\${g}-\${act}.html\`; }`
    );
    const final = updated.replace(scriptMatch[0], `<script>${updatedScript}</script>`);
    return final;
  }
  
  return page;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

function createIndexEntry(grade) {
  return `
            <div class="activity-card" onclick="goToGrade(${grade})">
                <div class="icon">${getGradeEmoji(grade)}</div>
                <h3>${gradeNames[grade]}</h3>
                <p>أنشطة القراءة، القواعد، المفردات، الكتابة</p>
            </div>`;
}

function getGradeEmoji(g) {
  return ['🎒','📚','✏️','📖','🧮','📝','🔬','🌍','💡','🎯','🏆','🌟'][g-1] || '📚';
}

// Generate grade 3-12 pages
const grades = [3,4,5,6,7,8,9,10,11,12];

// Remove duplicate grade 6 if exists (we keep existing grade 6)
grades.splice(grades.indexOf(6), 1);

grades.forEach(grade => {
  const page = createGradePage(grade);
  const destPath = path.join(PUBLIC, `grade${grade}.html`);
  fs.writeFileSync(destPath, page, 'utf8');
  console.log(`✅ Created grade${grade}.html`);
});

// Update index.html to include all grades
const indexPath = path.join(PUBLIC, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Check if all grades are already in index
if (!indexContent.includes('grade3.html')) {
  // Add grades 3-12 cards to index
  const gradeCards = grades.map(g => createIndexEntry(g)).join('');
  
  // Find the activities grid and insert after grade2 card
  const insertPoint = indexContent.indexOf('<!-- ADDITIONAL GRADES -->');
  if (insertPoint >= 0) {
    indexContent = indexContent.replace(/<!-- ADDITIONAL GRADES -->/, `<!-- ADDITIONAL GRADES -->${gradeCards}`);
  }
  
  // Add goToGrade function if missing
  if (!indexContent.includes('goToGrade(')) {
    const goToGradeFunc = `
    function goToGrade(grade) {
        window.location.href = 'grade' + grade + '.html';
    }`;
    indexContent = indexContent.replace('<\/body>', goToGradeFunc + '\n</body>');
  }
  
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('✅ Updated index.html with grades 3-12');
}

console.log('Done! Created all grade pages.');
