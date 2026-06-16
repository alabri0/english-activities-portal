#!/usr/bin/env node
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err.message);
  console.error(err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED:', err);
});

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Needed for inline scripts in activities
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

// Routes (MUST be before static files)
app.use('/api/teacher', require('./routes/teacher-routes'));
app.use('/api/students', require('./routes/student-routes'));
app.use('/api/activities', require('./routes/activity-routes'));
app.use('/api/dashboard', require('./routes/dashboard-routes'));

// Student portal - protected bypass
app.use('/student', require('./routes/student-portal'));

// Static files (AFTER routes)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 English Activities Portal v2.0`);
  console.log(`   Server: http://localhost:${PORT}`);
  console.log(`   Teacher Dashboard: http://localhost:${PORT}/teacher`);
  console.log(`   Student Portal: http://localhost:${PORT}/student`);
  console.log(`\n`);
}).on('error', (err) => {
  console.error('Server error:', err.message);
});
