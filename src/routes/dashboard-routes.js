const db = require('../db');

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
  res.status(401).json({ error: 'Unauthorized' });
}

// ===== OVERALL DASHBOARD STATS =====
router.get('/stats', requireAuth, (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) as count FROM students WHERE is_active = 1").get();
  const totalActivities = db.prepare("SELECT COUNT(*) as count FROM activity_results").get();
  const avgScore = db.prepare("SELECT AVG(total_score) as avg FROM activity_results").get();
  
  const gradeBreakdown = db.prepare('SELECT grade, COUNT(*) as students FROM students WHERE is_active = 1 GROUP BY grade ORDER BY grade').all();
  
  const topStudents = db.prepare(`
    SELECT s.first_name, s.last_name, s.grade, 
           AVG(a.total_score * 100.0 / NULLIF(a.total_questions, 0)) as avgPct
    FROM activity_results a
    JOIN students s ON s.id = a.student_id
    GROUP BY a.student_id
    ORDER BY avgPct DESC
    LIMIT 10
  `).all();

  const recentActivity = db.prepare(`
    SELECT s.first_name, s.last_name, s.grade, a.total_score, a.total_questions, a.activity_date
    FROM activity_results a
    JOIN students s ON s.id = a.student_id
    ORDER BY a.completed_at DESC
    LIMIT 15
  `).all();

  // Students per grade
  const allGrades = [];
  for (let g = 1; g <= 12; g++) {
    const count = db.prepare('SELECT COUNT(*) as c FROM students WHERE grade = ? AND is_active = 1').get(g);
    allGrades.push({ grade: g, students: count.c });
  }

  res.json({
    totalStudents: totalStudents.count,
    totalActivities: totalActivities.count,
    averageScore: avgScore.avg || 0,
    gradeBreakdown,
    allGrades,
    topStudents,
    recentActivity,
  });
});

// ===== GRADE-SPECIFIC STATS =====
router.get('/grade/:grade', requireAuth, (req, res) => {
  const grade = parseInt(req.params.grade);
  if (grade < 1 || grade > 12) return res.status(400).json({ error: 'Invalid grade' });

  const studentCount = db.prepare("SELECT COUNT(*) as c FROM students WHERE grade = ? AND is_active = 1").get(grade);
  const avgScore = db.prepare(`
    SELECT AVG(a.total_score * 100.0 / NULLIF(a.total_questions, 0)) as avg
    FROM activity_results a JOIN students s ON s.id = a.student_id
    WHERE s.grade = ?
  `).get(grade);

  const gradeStudents = db.prepare('SELECT id, first_name, last_name, grade FROM students WHERE grade = ? AND is_active = 1 ORDER BY first_name').all(grade);

  const gradeResults = db.prepare(`
    SELECT s.first_name, s.last_name, a.total_score, a.total_questions, a.activity_date
    FROM activity_results a
    JOIN students s ON s.id = a.student_id
    WHERE s.grade = ?
    ORDER BY a.completed_at DESC
    LIMIT 20
  `).all(grade);

  res.json({
    studentCount: studentCount.c,
    averageScore: avgScore.avg || 0,
    students: gradeStudents,
    results: gradeResults,
  });
});

// ===== MOE BOOKS INFO =====
router.get('/moe-books', (req, res) => {
  const books = require('../config/moe-books');
  res.json(books);
});

module.exports = router;
