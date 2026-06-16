const path = require('path');
const db = require('../db');
const router = require('express').Router();

// Student portal page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'student-portal.html'));
});

// Student dashboard page
router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'student-dashboard.html'));
});

module.exports = router;
