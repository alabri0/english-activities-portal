// Vercel serverless function - Main API handler
// This file proxies requests to the Express server or handles them directly

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { teachers: [], students: [], results: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function readStaticFile(filename) {
  try {
    return fs.readFileSync(path.join(PUBLIC_DIR, filename), 'utf8');
  } catch (e) {
    return null;
  }
}

  return true;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Routes
  if (req.method === 'GET' && req.url === '/api/results') {
    const data = loadData();
    const results = (data.results || []).map(r => ({
      studentName: r.student_name,
      grade: r.grade,
      gradeName: `الصف ${r.grade}`,
      activityName: 'نشاط إنجليزي',
      score: r.total_score,
      total_questions: r.total_questions,
      percentage: r.total_questions ? Math.round((r.total_score / r.total_questions) * 100) : 0,
      time_taken_seconds: r.time_taken_seconds || 0,
      date: r.activity_date,
      submittedAt: r.completed_at
    }));
    return res.status(200).json(results);
  }

  if (req.method === 'GET' && req.url === '/api/students/list') {
    const data = loadData();
    return res.status(200).json({ students: data.students || [] });
  }

  if (req.method === 'POST' && req.url === '/api/students/create') {
    try {
      const data = loadData();
      const { firstName, lastName, grade, username, password } = req.body;
      
      if (!firstName || !lastName || !grade || !username || !password) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
      }

      const existing = (data.students || []).find(s => s.username === username);
      if (existing) {
        return res.status(409).json({ error: 'اسم المستخدم موجود مسبقاً' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const newStudent = {
        id: (data.students?.length || 0) + 1,
        first_name: firstName,
        last_name: lastName,
        grade: parseInt(grade),
        password: passwordHash,
        username: username,
        created_at: new Date().toISOString(),
        is_active: 1
      };

      if (!data.students) data.students = [];
      data.students.push(newStudent);
      saveData(data);
      
      return res.status(201).json({
        success: true,
        student: {
          id: newStudent.id,
          firstName: newStudent.first_name,
          lastName: newStudent.last_name,
          grade: newStudent.grade,
          username: newStudent.username,
          fullName: `${newStudent.first_name} ${newStudent.last_name}`
        }
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PUT /api/students/:id - Edit student
  if (req.method === 'PUT' && req.url.startsWith('/api/students/')) {
    try {
      const id = parseInt(req.url.split('/').pop());
      const data = loadData();
      const idx = (data.students || []).findIndex(s => s.id === id);
      
      if (idx === -1) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      const body = req.body || {};
      if (body.firstName) data.students[idx].first_name = body.firstName.trim();
      if (body.lastName) data.students[idx].last_name = body.lastName.trim();
      if (body.grade) data.students[idx].grade = parseInt(body.grade);
      if (body.username) data.students[idx].username = body.username.trim();
      if (body.password && body.password.trim()) {
        // Use bcrypt instead of MD5
        data.students[idx].password = bcrypt.hashSync(body.password.trim(), 10);
      }
      if (body.isActive !== undefined) data.students[idx].is_active = body.isActive;
      
      data.students[idx].updated_at = new Date().toISOString();
      
      saveData(data);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE' && req.url.startsWith('/api/students/')) {
    try {
      const id = parseInt(req.url.split('/').pop());
      const data = loadData();
      const index = (data.students || []).findIndex(s => s.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      data.students.splice(index, 1);
      saveData(data);
      
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST' && req.url === '/api/teacher/login') {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const data = loadData();
    const teacher = (data.teachers || []).find(t => t.username === username);
    
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, teacher.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.status(200).json({
      success: true,
      teacher: { id: teacher.id, username: teacher.username, fullName: teacher.full_name },
      token: 'vercel-token-' + Date.now()
    });
  }

  // Serve static files
  if (req.url === '/') {
    const content = readStaticFile('index.html');
    if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
  }
  if (req.url === '/admin') {
    const content = readStaticFile('admin.html');
    if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
  }
  if (req.url === '/student') {
    const content = readStaticFile('student-portal.html');
    if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
  }
  if (req.url === '/student/dashboard') {
    const content = readStaticFile('student-dashboard.html');
    if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
  }

  // Serve grade files
  if (req.url.startsWith('/grade')) {
    const gradeNum = req.url.replace('/grade', '');
    if (gradeNum && /^[1-12]$/.test(gradeNum)) {
      const content = readStaticFile(`grade${gradeNum}.html`);
      if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
    }
  }

  // Serve activities
  if (req.url.startsWith('/activities/')) {
    const file = req.url.replace('/activities/', '');
    const content = readStaticFile(`activities/${file}`);
    if (content) return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(content);
  }

  return res.status(404).json({ error: 'Not Found' });
}
