// Vercel serverless function - retrieves all results
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/student_results?order=submitted_at.desc`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const results = data.map(r => ({
          studentName: r.student_name,
          grade: r.grade,
          gradeName: r.grade_name,
          activityName: r.activity_name,
          score: r.score,
          total_questions: r.total_questions,
          percentage: r.percentage,
          time_taken_seconds: r.time_taken_seconds,
          answers: r.answers,
          date: r.date,
          submittedAt: r.created_at
        }));
        return res.status(200).json(results);
      }
    } catch (e) {
      console.log('Supabase fetch error:', e.message);
    }
  }
  return res.status(200).json([]);
}
