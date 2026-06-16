export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const data = req.body;
    if (!data.studentName || !data.grade || !data.activityName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/student_results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            student_name: data.studentName,
            grade: data.grade,
            grade_name: data.gradeName,
            activity_name: data.activityName,
            score: data.score,
            total_questions: data.total_questions,
            percentage: data.percentage,
            time_taken_seconds: data.time_taken_seconds,
            answers: data.answers,
            date: data.date,
            created_at: data.submittedAt
          })
        });
        if (response.ok || response.status === 201 || response.status === 204) {
          return res.status(200).json({ success: true });
        }
      } catch (e) {
        console.log('Supabase error, using fallback:', e.message);
      }
    }
    // Fallback: save to a local JSON file since Supabase is not configured
    const fs = require('fs');
    const path = require('path');
    const resultsFile = path.join(__dirname, '..', 'data', 'results.json');
    try {
      const data = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf8')) : [];
      data.push(req.body);
      fs.writeFileSync(resultsFile, JSON.stringify(data, null, 2));
      return res.status(200).json({ success: true, source: 'local-fallback' });
    } catch (e) {
      console.error('Local fallback save error:', e.message);
      return res.status(500).json({ error: 'Failed to save result locally' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
