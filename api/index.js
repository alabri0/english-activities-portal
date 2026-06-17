const fs = require('fs');
const path = require('path');

// Use /tmp for Vercel serverless (read-write) or __dirname for local dev
const DATA_FILE = process.env.NODE_ENV === 'production'
  ? '/tmp/data.json'
  : path.join(__dirname, '..', 'data.json');

const ROOT_DIR = process.cwd();

function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { teachers: [], students: [], results: [] };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('saveData error:', e.message);
  }
}

function readStaticFile(filename) {
  // Try multiple possible locations on Vercel
  const candidates = [
    path.join(ROOT_DIR, 'public', filename),
    path.join(ROOT_DIR, filename),
    path.join(__dirname, '..', 'public', filename),
    path.join(__dirname, '..', filename),
  ];
  for (const fp of candidates) {
    try {
      return fs.readFileSync(fp, 'utf8');
    } catch (e) {
      // try next candidate
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body - Vercel provides req.body for @vercel/node
  let body = req.body || {};
  if ((!body || Object.keys(body).length === 0) && (req.method === 'POST' || req.method === 'PUT')) {
    try {
      if (req.rawBody) {
        body = JSON.parse(req.rawBody);
      }
    } catch(e) {
      // Fallback: try stream
      try {
        const chunks = [];
        let totalLen = 0;
        req.on('data', chunk => { chunks.push(chunk); totalLen += chunk.length; });
        req.on('end', () => {
          try { body = JSON.parse(Buffer.concat(chunks, totalLen).toString('utf8')); } catch(e2) { body = {}; }
        });
      } catch(e2) { body = {}; }
    }
  }

  // TEACHER LOGIN
  if (req.method === 'POST' && req.url === '/api/teacher/login') {
    const { username, password } = body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const db = loadData();
    const teacher = (db.teachers || []).find(t => t.username === username);
    if (!teacher) return res.status(401).json({ error: 'Invalid credentials' });
    if (password !== 'admin123') return res.status(401).json({ error: 'Invalid credentials' });
    return res.status(200).json({
      success: true,
      teacher: { id: teacher.id, username: teacher.username, fullName: teacher.full_name }
    });
  }

  // GET /api/students/list
  if (req.method === 'GET' && req.url === '/api/students/list') {
    const db = loadData();
    return res.status(200).json({ students: db.students || [] });
  }

  // POST /api/students/create
  if (req.method === 'POST' && req.url === '/api/students/create') {
    try {
      const db = loadData();
      const { firstName, lastName, grade, username, password } = body;
      if (!firstName || !lastName || !grade || !username || !password) {
        return res.status(400).json({ error: 'All fields required. Got: ' + JSON.stringify(body) });
      }
      if ((db.students || []).find(s => s.username === username)) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      const newStudent = {
        id: (db.students ? db.students.length : 0) + 1,
        first_name: firstName,
        last_name: lastName,
        grade: parseInt(grade),
        password: simpleHash(password),
        username: username,
        created_at: new Date().toISOString(),
        is_active: 1
      };
      if (!db.students) db.students = [];
      db.students.push(newStudent);
      saveData(db);
      return res.status(201).json({
        success: true,
        student: {
          id: newStudent.id,
          firstName: newStudent.first_name,
          lastName: newStudent.last_name,
          grade: newStudent.grade,
          username: newStudent.username,
          fullName: newStudent.first_name + ' ' + newStudent.last_name
        }
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PUT /api/students/:id
  if (req.method === 'PUT' && req.url.startsWith('/api/students/')) {
    try {
      const id = parseInt(req.url.split('/').pop());
      const db = loadData();
      const idx = (db.students || []).findIndex(s => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Student not found' });
      if (body.firstName) db.students[idx].first_name = body.firstName.trim();
      if (body.lastName) db.students[idx].last_name = body.lastName.trim();
      if (body.grade) db.students[idx].grade = parseInt(body.grade);
      if (body.username) db.students[idx].username = body.username.trim();
      if (body.password && body.password.trim()) db.students[idx].password = simpleHash(body.password.trim());
      if (body.isActive !== undefined) db.students[idx].is_active = body.isActive;
      db.students[idx].updated_at = new Date().toISOString();
      saveData(db);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE /api/students/:id
  if (req.method === 'DELETE' && req.url.startsWith('/api/students/')) {
    try {
      const id = parseInt(req.url.split('/').pop());
      const db = loadData();
      const index = (db.students || []).findIndex(s => s.id === id);
      if (index === -1) return res.status(404).json({ error: 'Student not found' });
      db.students.splice(index, 1);
      saveData(db);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE /api/students/reset
  if (req.method === 'DELETE' && req.url === '/api/students/reset') {
    try {
      const db = loadData();
      db.students = [];
      db.results = [];
      saveData(db);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET /api/results
  if (req.method === 'GET' && req.url === '/api/results') {
    const db = loadData();
    const results = (db.results || []).map(r => ({
      studentName: r.student_name || 'طالب',
      grade: r.grade,
      gradeName: 'الصف ' + r.grade,
      activityName: 'نشاط انجليزي',
      score: r.total_score,
      total_questions: r.total_questions,
      percentage: r.total_questions ? Math.round((r.total_score / r.total_questions) * 100) : 0,
      time_taken_seconds: r.time_taken_seconds || 0,
      date: r.activity_date,
      submittedAt: r.completed_at
    }));
    return res.status(200).json(results);
  }

  // POST /api/save-result
  if (req.method === 'POST' && req.url === '/api/save-result') {
    try {
      const db = loadData();
      if (!db.results) db.results = [];
      const newResult = {
        id: db.results.length + 1,
        student_id: body.student_id,
        grade: body.grade,
        activity_date: body.activity_date || new Date().toISOString().split('T')[0],
        section_reading: body.section_reading || 0,
        section_handwriting: body.section_handwriting || 0,
        section_comprehension: body.section_comprehension || 0,
        section_grammar: body.section_grammar || 0,
        section_vocabulary: body.section_vocabulary || 0,
        total_score: body.total_score || 0,
        total_questions: body.total_questions || 0,
        correct_answers: body.correct_answers || 0,
        completed_at: new Date().toISOString()
      };
      db.results.push(newResult);
      saveData(db);
      return res.status(201).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // DELETE /api/results/reset
  if (req.method === 'DELETE' && req.url === '/api/results/reset') {
    try {
      const db = loadData();
      db.results = [];
      saveData(db);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // STATIC FILES
  const staticRoutes = {
    '/': 'index.html',
    '/admin': 'admin.html',
    '/student': 'student-portal.html',
    '/student/dashboard': 'student-dashboard.html'
  };

  if (staticRoutes[req.url]) {
    const content = readStaticFile(staticRoutes[req.url]);
    if (content) {
      return res.status(200)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(content);
    }
  }

  if (req.url.startsWith('/grade')) {
    const gradeNum = req.url.replace('/grade', '');
    if (gradeNum && /^[1-12]$/.test(gradeNum)) {
      const content = readStaticFile('grade' + gradeNum + '.html');
      if (content) {
        return res.status(200)
          .setHeader('Content-Type', 'text/html; charset=utf-8')
          .send(content);
      }
    }
  }

  if (req.url.startsWith('/activities/')) {
    const file = req.url.replace('/activities/', '');
    const content = readStaticFile('activities/' + file);
    if (content) {
      return res.status(200)
        .setHeader('Content-Type', 'text/html; charset=utf-8')
        .send(content);
    }
  }

  return res.status(404).json({ error: 'Not Found' });
};
