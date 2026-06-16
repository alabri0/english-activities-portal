# Supabase Setup Instructions for English Activities Portal

## Step 1: Create a Supabase Project
1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name:** English Activities Portal
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest (e.g., UAE/Middle East if available, or default)
   - Wait ~2 minutes for setup to complete

## Step 2: Get Your Project Credentials
1. In your Supabase dashboard, click **Settings** (gear icon) in the sidebar
2. Click **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 3: Create Database Table
1. In Supabase dashboard, go to **Table Editor**
2. Click **+ Create Table**
3. Name the table: `student_results`
4. Add these columns:

| Column Name | Type | Details |
|---|---|---|
| `id` | int8 | Primary Key, Enable Identity, Increment by 1 |
| `created_at` | timestamptz | Default: `now()` |
| `student_name` | text | Required |
| `grade` | text | Required |
| `activity_name` | text | Required |
| `score` | int4 | |
| `total_questions` | int4 | |
| `percentage` | numeric | |
| `time_taken_seconds` | int4 | |
| `answers` | jsonb | |
| `date` | text | Format: YYYY-MM-DD |
| `grade_name` | text | e.g., "Grade 2" or "Grade 6" |

5. Click **Review** then **Save Table**

## Step 4: Configure Row Level Security (RLS)
1. Go to **Authentication** → **Policies**
2. Find the `student_results` table
3. Click **+ Add Policy** → **Custom Policy**
4. Add these policies:

**Policy 1 - Allow Insert (for anonymous users):**
```
Name: Enable insert for all users
Policy definition: INSERT with check true
```

SQL command:
```sql
CREATE POLICY "Allow anonymous insert"
ON student_results
FOR INSERT
TO public
WITH CHECK (true);
```

**Policy 2 - Allow Select (for admin dashboard):**
```
Name: Allow select for all
Policy definition: SELECT enabled for all
```

SQL command:
```sql
CREATE POLICY "Allow anonymous select"
ON student_results
FOR SELECT
TO public
USING (true);
```

Or run this in **SQL Editor**:
```sql
-- Enable RLS
ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert results
CREATE POLICY "Allow anonymous insert"
ON student_results
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read results (for admin dashboard)
CREATE POLICY "Allow anonymous select"
ON student_results
FOR SELECT
TO public
USING (true);
```

## Step 5: Add Environment Variables
After getting your Supabase URL and anon key, create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## Done!
Your Supabase database is ready. Continue with building the portal.
