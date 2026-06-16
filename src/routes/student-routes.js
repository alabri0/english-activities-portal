const db = require('../db');
const bcrypt = require('bcryptjs');

const router = require('express').Router();

function requireAuth(req, res, next) {
  if (req.cookies.token) {
    const token = req.cookies.token;
    const stmt = db.prepare("SELECT * FROM teachers WHERE token = ? AND token_expiry > datetime('now', '+4 hours')");
    const teacher = stmt.get(token);
    if (teacher) {
      req.teacher = teacher;
      return next();
    }
  }
  // Also check student token
  if (req.query.token || req.body.token) {
    const token = req.query.token || req.body.token;
    const stmt = db.prepare("SELECT * FROM students WHERE token = ? AND token_expiry > datetime('now', '+4 hours')");
    const student = stmt.get(token);
    if (student) {
      req.student = student;
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// ===== STUDENT MANAGEMENT =====

// Get all students (with optional grade filter)
router.get('/', requireAuth, (req, res) => {
  const { grade, search } = req.query;

  let query = 'SELECT s.*, t.full_name as created_by_name FROM students s LEFT JOIN teachers t ON t.id = s.created_by WHERE 1=1';
  const params = [];

  if (grade) {
    query += ' AND s.grade = ?';
    params.push(parseInt(grade));
  }

  if (search) {
    query += " AND (s.first_name LIKE ? OR s.last_name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.grade ASC, s.first_name ASC';

  const students = db.prepare(query).all(...params);
  res.json({ students });
});

// Get single student by ID
router.get('/:id', requireAuth, (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json({ student });
});

// Create new student
router.post('/', requireAuth, (req, res) => {
  const { firstName, lastName, grade, password } = req.body;

  if (!firstName || !lastName || !grade || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  if (parseInt(grade) < 1 || parseInt(grade) > 12) {
    return res.status(400).json({ error: 'Grade must be 1-12' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO students (first_name, last_name, grade, password, created_by) VALUES (?, ?, ?, ?, ?)'
  ).run(firstName, lastName, parseInt(grade), passwordHash, req.teacher.id);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    student: {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      grade: student.grade,
      // password is NOT returned — teacher must share via dashboard only
      fullName: `${student.first_name} ${student.last_name}`
    }
  });
});

// Update student
router.put('/:id', requireAuth, (req, res) => {
  const { firstName, lastName, grade, password, isActive } = req.body;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const updates = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (grade) updates.grade = parseInt(grade);
  if (isActive !== undefined) updates.is_active = Boolean(isActive);
  if (password) updates.password = bcrypt.hashSync(password, 10);

  const keys = Object.keys(updates);
  if (keys.length === 0) return res.status(400).json({ error: 'No updates provided' });

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(req.params.id);

  db.prepare(`UPDATE students SET ${setClause} WHERE id = ?`).run(...values);
  res.json({ success: true });
});

// Delete student
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
  res.json({ success: true });
});

// ===== STUDENT LOGIN =====

// Login by grade + password (legacy)
router.post('/login', (req, res) => {
  const { grade, password } = req.body;

  if (!grade || !password) {
    return res.status(400).json({ error: 'Grade and password required' });
  }

  const student = db.prepare(
    'SELECT * FROM students WHERE grade = ? AND is_active = 1'
  ).all(parseInt(grade));

  let found = null;
  for (const s of student) {
    if (bcrypt.compareSync(password, s.password)) {
      found = s;
      break;
    }
  }

  if (!found) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = require('uuid').v4();
  const tokenExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6h for students
  db.prepare('UPDATE students SET token = ?, token_expiry = ? WHERE id = ?')
    .run(token, tokenExpiry.toISOString(), found.id);

  res.json({
    success: true,
    student: {
      id: found.id,
      firstName: found.first_name,
      grade: found.grade,
      token
    }
  });
});

// Login by username + password (new)
router.post('/login-by-username', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const student = db.prepare(
    'SELECT * FROM students WHERE username = ? AND is_active = 1'
  ).get(username);

  if (!student) {
    return res.status(401).json({ error: 'طالب غير موجود' });
  }

  if (!bcrypt.compareSync(password, student.password)) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }

  const token = require('uuid').v4();
  const tokenExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000);
  db.prepare('UPDATE students SET token = ?, token_expiry = ? WHERE id = ?')
    .run(token, tokenExpiry.toISOString(), student.id);

  res.json({
    success: true,
    student: {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      fullName: `${student.first_name} ${student.last_name}`,
      grade: student.grade,
      username: student.username,
      token
    }
  });
});

// Admin: List students with usernames
router.get('/list', requireAuth, (req, res) => {
  const students = db.prepare(
    'SELECT id, first_name, last_name, grade, username, created_at, is_active FROM students ORDER BY grade ASC, first_name ASC'
  ).all();
  res.json({ students });
});

// Admin: Create student with username
router.post('/create', requireAuth, (req, res) => {
  const { firstName, lastName, grade, username, password } = req.body;

  if (!firstName || !lastName || !grade || !username || !password) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  if (parseInt(grade) < 1 || parseInt(grade) > 12) {
    return res.status(400).json({ error: 'الصف يجب أن يكون 1-12' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
  }

  const existing = db.prepare('SELECT id FROM students WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'اسم المستخدم موجود مسبقاً' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO students (first_name, last_name, grade, password, username, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(firstName, lastName, parseInt(grade), passwordHash, username, req.teacher.id);

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    student: {
      id: student.id,
      firstName: student.first_name,
      lastName: student.last_name,
      grade: student.grade,
      username: student.username,
      // password is NOT returned — teacher must share via dashboard only
      fullName: `${student.first_name} ${student.last_name}`
    }
  });
});

module.exports = router;
