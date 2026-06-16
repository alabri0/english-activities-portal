const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// ============ MIDDLEWARE ============

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
  res.status(401).json({ error: 'Unauthorized' });
}

// ============ ROUTES ============

const router = require('express').Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const teacher = db.prepare('SELECT * FROM teachers WHERE username = ?').get(username);
  if (!teacher) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const bcrypt = require('bcryptjs');
  if (!bcrypt.compareSync(password, teacher.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = uuidv4();
  const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  db.prepare('UPDATE teachers SET token = ?, token_expiry = ? WHERE id = ?')
    .run(token, tokenExpiry.toISOString(), teacher.id);

  res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' });

  res.json({
    success: true,
    teacher: { id: teacher.id, username: teacher.username, fullName: teacher.full_name },
    token
  });
});

// Logout
router.post('/logout', (req, res) => {
  if (req.cookies.token) {
    db.prepare("UPDATE teachers SET token = NULL, token_expiry = datetime('now', '+4 hours') WHERE token = ?")
      .run(req.cookies.token);
  }
  res.clearCookie('token');
  res.json({ success: true });
});

// Get profile
router.get('/profile', requireAuth, (req, res) => {
  const teacher = db.prepare('SELECT id, username, full_name FROM teachers WHERE id = ?').get(req.teacher.id);
  res.json({ teacher });
});

// Change password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords required' });
  }

  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.teacher.id);
  if (!bcrypt.compareSync(currentPassword, teacher.password_hash)) {
    return res.status(401).json({ error: 'Current password incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE teachers SET password_hash = ? WHERE id = ?').run(hash, req.teacher.id);
  res.json({ success: true });
});

// Stats
router.get('/stats', requireAuth, (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE is_active = 1").get();
  const activeStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE is_active = 1").get();
  const grades = db.prepare('SELECT DISTINCT grade FROM students WHERE is_active = 1 ORDER BY grade');
  const recentActivity = db.prepare('SELECT s.first_name, s.grade, a.total_score, a.total_questions, a.activity_date FROM activity_results a JOIN students s ON s.id = a.student_id ORDER BY a.completed_at DESC LIMIT 10').all();

  // Students per grade
  const gradeStats = db.prepare('SELECT grade, COUNT(*) as count FROM students WHERE is_active = 1 GROUP BY grade ORDER BY grade').all();

  res.json({
    totalStudents: totalStudents.count,
    activeStudents: activeStudents.count,
    grades: gradeStats,
    recentActivity,
  });
});

module.exports = router;
