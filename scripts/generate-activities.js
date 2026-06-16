// Generate activities for all grades
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ACTIVITIES = path.join(ROOT, 'public', 'activities');

const gradeNames = {
  1: 'الصف الأول', 2: 'الصف الثاني', 3: 'الصف الثالث', 4: 'الصف الرابع',
  5: 'الصف الخامس', 6: 'الصف السادس', 7: 'الصف السابع', 8: 'الصف الثامن',
  9: 'الصف التاسع', 10: 'الصف العاشر', 11: 'الصف الحادي عشر', 12: 'الصف الثاني عشر'
};

const activities = ['reading', 'comprehension', 'grammar', 'vocabulary', 'handwriting'];
const grades = [1,2,3,4,5,7,8,9,10,11,12]; // Skip 6, already done

const lowerTemplates = {
  reading: 'grade2-reading.html',
  comprehension: 'grade2-comprehension.html',
  grammar: 'grade2-grammar.html',
  vocabulary: 'grade2-vocabulary.html',
  handwriting: 'grade2-handwriting.html'
};

const upperTemplates = {
  reading: 'grade6-reading.html',
  comprehension: 'grade6-comprehension.html',
  grammar: 'grade6-grammar.html',
  vocabulary: 'grade6-vocabulary.html',
  handwriting: 'grade6-handwriting.html'
};

grades.forEach(grade => {
  activities.forEach(act => {
    const template = grade <= 5 ? lowerTemplates[act] : upperTemplates[act];
    const templatePath = path.join(ACTIVITIES, template);
    if (!fs.existsSync(templatePath)) {
      console.log(`Skipping ${grade}-${act}: no template`);
      return;
    }
    
    let content = fs.readFileSync(templatePath, 'utf8');
    
    // Replace grade references
    const isLower = grade <= 5;
    if (isLower) {
      content = content.replace(/grade2/g, `grade${grade}`);
      content = content.replace(/Grade 2/g, `Grade ${grade}`);
    } else {
      content = content.replace(/grade6/g, `grade${grade}`);
      content = content.replace(/Grade 6/g, `Grade ${grade}`);
    }
    
    // Replace Arabic grade names
    if (isLower) {
      content = content.replace(/الصف الثاني/g, gradeNames[grade]);
    } else {
      const nameMap = {
        7: 'الصف السابع', 8: 'الصف الثامن', 9: 'الصف التاسع',
        10: 'الصف العاشر', 11: 'الصف الحادي عشر', 12: 'الصف الثاني عشر'
      };
      content = content.replace(/الصف السادس/g, nameMap[grade] || `الصف ${grade}`);
    }
    
    // Update grade numbers in JS
    if (isLower) {
      content = content.replace(/grade:\s*2/g, `grade: ${grade}`);
    } else {
      content = content.replace(/grade:\s*6/g, `grade: ${grade}`);
    }
    
    // Update gradeName in JS
    content = content.replace(
      /gradeName:\s*['\"]الصف [^\"]+['\"]/g,
      `gradeName: '${gradeNames[grade]}'`
    );
    
    // Update colors (keep template colors for simplicity)
    const dest = path.join(ACTIVITIES, `grade${grade}-${act}.html`);
    fs.writeFileSync(dest, content, 'utf8');
    console.log(`✅ Created grade${grade}-${act}.html`);
  });
});

console.log('Done generating all activities!');