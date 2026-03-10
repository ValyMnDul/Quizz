import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QUIZ_QUESTIONS } from '@/lib/questions';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    
    const sessions = await db.collection('quiz_sessions')
      .find({}, { projection: { _id: 0, player_name: 1, score: 1, completed: 1, current_question: 1 } })
      .sort({ score: -1 })
      .limit(100)
      .toArray();

    const leaderboard = sessions.map((session, idx) => ({
      position: idx + 1,
      player_name: session.player_name || 'Anonim',
      score: session.score || 0,
      progress: session.current_question || 0,
      total_questions: QUIZ_QUESTIONS.length,
      completed: session.completed || false
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
