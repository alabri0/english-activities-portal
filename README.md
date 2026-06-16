# English Activities Portal - Production Ready

## 🚀 Quick Start

### Local Development
```bash
npm install
node src/server.js
# Open http://localhost:3000
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel Configuration:**
- Environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL` (optional - for Supabase)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional - for Supabase)
- No build step required
- Static files served from `public/`
- Serverless APIs from `api/`

## 📊 Platform Features

### Student Portal
- **Login**: Students enter their name, grade (1-12), and password
- **Dashboard**: View results, progress tracking, activity history
- **Activities**: Reading, Comprehension, Grammar, Vocabulary, Handwriting
- **Auto-grading**: Instant score display with detailed feedback

### Teacher Dashboard
- **Student Management**: Create/edit/delete students
- **Analytics**: Results filtered by grade, student, date range
- **Export**: Download results as CSV
- **Statistics**: Success/failure rates, activity completion tracking

### Supported Grades
All grades 1-12 supported with activities:
- Grade 1-5: Uses grade2 template (lower difficulty)
- Grade 6-12: Uses grade6 template (higher difficulty)

## 🔧 Architecture
- **Backend**: Express.js + SQLite (local) / Supabase (production)
- **Frontend**: Static HTML/CSS/JS with RTL Arabic UI
- **Auth**: Teacher cookie tokens + Student localStorage tokens
- **Deployment**: Vercel serverless functions

## 📁 Project Structure
```
english-portal/
├── public/                  # Frontend files
│   ├── index.html           # Landing page
│   ├── grade*.html          # Grade hub pages (1-12)
│   ├── student-portal.html  # Student login
│   ├── student-dashboard.html # Student results
│   ├── admin.html           # Teacher dashboard
│   └── activities/          # 60 activity pages (12 grades × 5 types)
├── src/
│   ├── server.js            # Express server entry
│   ├── db.js                # SQLite database
│   ├── config/moe-books.js  # Oman MOE English books
│   └── routes/              # API routes
├── api/                     # Vercel serverless functions
├── db/                      # SQLite database files
├── vercel.json              # Vercel deployment config
├── package.json             # Dependencies
└── README.md                # Full documentation
```

## 📱 Mobile Support
All pages are responsive and work on mobile browsers.