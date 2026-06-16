const db = require('../db');
const axios = require('axios');
const crypto = require('crypto');

const MOE_BOOKS = require('../config/moe-books');

const router = require('express').Router();

// ===== PUBLIC SAVE RESULT (for activities without login) =====
router.post('/save-result', (req, res) => {
  const body = req.body || {};
  const {
    studentName,
    grade,
    gradeName,
    activityName,
    score,
    total_questions,
    percentage,
    time_taken_seconds,
    date,
    answers,
    submittedAt
  } = body;

  if (!studentName || !grade || !activityName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate a student record if not exists
  let student = db.prepare('SELECT * FROM students WHERE first_name = ? AND grade = ?').get(studentName, grade);
  if (!student) {
    const token = crypto.randomBytes(16).toString('hex');
    const result = db.prepare(`
      INSERT INTO students (first_name, last_name, grade, password, token, token_expiry)
      VALUES (?, 'طالب', ?, 'anonymous', datetime('now', '+1 year'), datetime('now', '+1 year'))
    `).run(studentName, grade);
    student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
  }

  // Insert activity result
  // Map activity names to sections
  let sectionReading = 0, sectionHandwriting = 0, sectionComprehension = 0, sectionGrammar = 0, sectionVocabulary = 0;
  const act = activityName || '';
  if (act.includes('القراءة')) sectionReading = parseFloat(score || 0);
  else if (act.includes('الكتابة')) sectionHandwriting = parseFloat(score || 0);
  else if (act.includes('الفهم')) sectionComprehension = parseFloat(score || 0);
  else if (act.includes('القواعد')) sectionGrammar = parseFloat(score || 0);
  else if (act.includes('المفردات')) sectionVocabulary = parseFloat(score || 0);

  db.prepare(`
    INSERT INTO activity_results (
      student_id, grade, activity_date,
      section_reading, section_handwriting, section_comprehension,
      section_grammar, section_vocabulary, total_score,
      total_questions, correct_answers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    student.id, parseInt(grade), date || new Date().toISOString().split('T')[0],
    sectionReading, sectionHandwriting, sectionComprehension,
    sectionGrammar, sectionVocabulary,
    parseFloat(score || 0),
    parseInt(total_questions || 0),
    parseInt(score || 0) // correctAnswers = score for now
  );

  res.json({ success: true });
});


function requireAuth(req, res, next) {
  if (req.cookies.token) {
    const token = req.cookies.token;
    const stmt = db.prepare("SELECT * FROM students WHERE token = ? AND token_expiry > datetime('now', '+4 hours')");
    const student = stmt.get(token);
    if (student) {
      req.student = student;
      return next();
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// ===== GET AVAILABLE BOOKS FOR A GRADE =====
router.get('/books/:grade', (req, res) => {
  const grade = parseInt(req.params.grade);
  if (grade < 1 || grade > 12) {
    return res.status(400).json({ error: 'Grade must be 1-12' });
  }

  const books = MOE_BOOKS[grade] || [];
  res.json({ books });
});

// ===== GET BOOK CONTENT (PDF URL) =====
router.get('/book/:grade/:bookId', (req, res) => {
  const grade = parseInt(req.params.grade);
  const bookId = req.params.bookId;

  if (grade < 1 || grade > 12) {
    return res.status(400).json({ error: 'Invalid grade' });
  }

  const pdfUrl = `https://ict.moe.gov.om/book/PDF/${grade}/${bookId}/files/downloads/${bookId}.pdf`;

  // Verify PDF exists
  axios.head(pdfUrl, { timeout: 10000 })
    .then(() => {
      res.json({ url: pdfUrl, available: true });
    })
    .catch(() => {
      res.json({ url: pdfUrl, available: false });
    });
});

// ===== SAVE ACTIVITY RESULT =====
router.post('/save', requireAuth, (req, res) => {
  const {
    activityDate,
    sectionReading,
    sectionHandwriting,
    sectionComprehension,
    sectionGrammar,
    sectionVocabulary,
    totalScore,
    totalQuestions,
    correctAnswers
  } = req.body;

  if (!activityDate || totalScore === undefined) {
    return res.status(400).json({ error: 'Date and score required' });
  }

  const result = db.prepare(`
    INSERT INTO activity_results (
      student_id, grade, activity_date,
      section_reading, section_handwriting, section_comprehension,
      section_grammar, section_vocabulary, total_score,
      total_questions, correct_answers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.student.id, req.student.grade, activityDate,
    parseFloat(sectionReading || 0),
    parseFloat(sectionHandwriting || 0),
    parseFloat(sectionComprehension || 0),
    parseFloat(sectionGrammar || 0),
    parseFloat(sectionVocabulary || 0),
    parseFloat(totalScore),
    parseInt(totalQuestions || 0),
    parseInt(correctAnswers || 0)
  );

  res.json({ success: true, resultId: result.lastInsertRowid });
});

// ===== GET STUDENT RESULTS =====
router.get('/results', requireAuth, (req, res) => {
  const { limit } = req.query;
  const n = parseInt(limit || 20);

  const results = db.prepare(`
    SELECT * FROM activity_results 
    WHERE student_id = ? 
    ORDER BY completed_at DESC 
    LIMIT ?
  `).all(req.student.id, n);

  res.json({ results });
});

// ===== GET OVERALL STATS =====
router.get('/stats/summary', requireAuth, (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as totalActivities,
      AVG(total_score) as avgScore,
      AVG(total_score * 100.0 / NULLIF(total_questions, 0)) as avgPercentage,
      MAX(completed_at) as lastActivity
    FROM activity_results
    WHERE student_id = ?
  `).get(req.student.id);

  res.json(stats);
});

module.exports = router;
