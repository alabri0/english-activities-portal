const fs = require('fs');

const gradeNames = {
  1:'الصف الأول',2:'الصف الثاني',3:'الصف الثالث',4:'الصف الرابع',
  5:'الصف الخامس',6:'الصف السادس',7:'الصف السابع',8:'الصف الثامن',
  9:'الصف التاسع',10:'الصف العاشر',11:'الصف الحادي عشر',12:'الصف الثاني عشر'
};

const actNames = {
  reading:'القراءة',comprehension:'الفهم والاستيعاب',grammar:'القواعد',
  vocabulary:'المفردات',handwriting:'الكتابة اليدوية'
};

const files = fs.readdirSync('public/activities').filter(f => f.startsWith('grade') && f.endsWith('.html'));

let fixed = 0;
let skipped = 0;

files.forEach(f => {
  let content = fs.readFileSync('public/activities/' + f, 'utf8');
  
  // Check if it already has proper fetch
  if (content.includes("fetch('/api/save-result") || content.includes("fetch('/api/save-result") || content.includes('fetch(`/api/save-result')) {
    skipped++;
    return;
  }
  
  const match = f.match(/grade(\d+)-(.+)\.html$/);
  if (!match) return;
  
  const gradeNum = parseInt(match[1]);
  const activity = match[2];
  const activityName = actNames[activity] || activity;
  const gradeName = gradeNames[gradeNum] || 'الصف ' + gradeNum;
  const isHandwriting = activity === 'handwriting';
  
  // Check for broken saveResult or save function
  const hasBrokenSave = content.includes("JSON.stringify(a))") && !content.includes("fetch('");
  
  if (!hasBrokenSave) {
    console.log('No broken save in:', f);
    return;
  }
  
  // Determine function name (saveResult, save, or finishActivity)
  let funcName = 'save';
  if (content.includes('function saveResult')) funcName = 'saveResult';
  else if (content.includes('function saveResult')) funcName = 'saveResult';
  else if (content.includes('function finish')) funcName = 'finishActivity';
  
  const scoreParams = isHandwriting ? 'strokes.length' : 's';
  const totalParams = isHandwriting ? '1' : 't';
  const pctParams = isHandwriting ? '100' : 'p';
  
  const newFunc = `function ${funcName}(s,t,p,tm){const r={studentName:localStorage.getItem('studentName')||'طالب',grade:${gradeNum},gradeName:'${gradeName}',activityName:'${activityName}',score:${scoreParams},total_questions:${totalParams},percentage:${pctParams},time_taken_seconds:tm,date:new Date().toISOString().split('T')[0],submittedAt:new Date().toISOString()};fetch('/api/save-result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)}).catch(()=>{let a=JSON.parse(localStorage.getItem('studentResults')||'[]');a.push(r);localStorage.setItem('studentResults',JSON.stringify(a));});}`;
  
  // Replace from function definition to end of function
  let updated = false;
  const funcRegex = new RegExp(`(function ${funcName}\\([^)]*\\)\\{)([\\s\\S]*?)(?=(function |</script>|$))`);
  const match2 = content.match(funcRegex);
  
  if (match2) {
    content = content.replace(funcRegex, newFunc);
    updated = true;
  } else {
    // Try simpler replacement for broken functions
    const broken = `const r={studentName:localStorage.getItem('studentName')||'طالب',grade: ${gradeNum},gradeName: '${gradeName}'`;
    if (content.includes(broken)) {
      content = content.replace(broken, newFunc.replace('function ' + funcName + '(s,t,p,tm){const r={studentName:', ''));
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync('public/activities/' + f, content, 'utf8');
    fixed++;
    console.log('Fixed:', f);
  } else {
    console.log('Could not fix:', f);
  }
});

console.log('\nDone! Fixed', fixed, 'files, Skipped', skipped, 'already OK');