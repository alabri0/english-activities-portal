#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'db', 'portal.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  -- Teachers (admins)
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Students
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    grade INTEGER NOT NULL CHECK(grade >= 1 AND grade <= 12),
    password TEXT NOT NULL,
    token TEXT,
    token_expiry TEXT,
    created_by INTEGER REFERENCES teachers(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  -- Student Activity Results
  CREATE TABLE IF NOT EXISTS activity_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    activity_date TEXT NOT NULL,
    section_reading REAL DEFAULT 0,
    section_handwriting REAL DEFAULT 0,
    section_comprehension REAL DEFAULT 0,
    section_grammar REAL DEFAULT 0,
    section_vocabulary REAL DEFAULT 0,
    total_score REAL DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
  CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);
  CREATE INDEX IF NOT EXISTS idx_results_student ON activity_results(student_id);
  CREATE INDEX IF NOT EXISTS idx_results_date ON activity_results(activity_date);
`);

// Create default teacher account
const defaultPassword = 'teacher2026';
const hash = bcrypt.hashSync(defaultPassword, 10);

const stmt = db.prepare('INSERT OR IGNORE INTO teachers (username, password_hash, full_name) VALUES (?, ?, ?)');
stmt.run('admin', hash, 'مدير المنصة');

// Create default student accounts with grade-based passwords
const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const studentPassword = 'student123';
const studentPasswordHash = bcrypt.hashSync(studentPassword, 10);

const insertStudent = db.prepare(`
  INSERT OR IGNORE INTO students (first_name, last_name, grade, password, is_active)
  VALUES (?, ?, ?, ?, 1)
`);

grades.forEach(g => {
  insertStudent.run(`طالب${g}`, `الصف ${g}`, g, studentPasswordHash);
});

console.log('✅ Student accounts created with password: ' + studentPassword);

db.close();
