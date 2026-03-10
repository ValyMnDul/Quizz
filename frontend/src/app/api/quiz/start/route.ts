import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QUIZ_QUESTIONS } from '@/lib/questions';

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { player_name } = body;

    if (!player_name?.trim()) {
      return NextResponse.json(
        { error: 'Numele este obligatoriu' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    const session = {
      id: generateId(),
      player_name: player_name.trim(),
      current_question: 0,
      score: 0,
      answers: [],
      started_at: new Date().toISOString(),
      completed: false,
      completed_at: null
    };

    await db.collection('quiz_sessions').insertOne(session);

    return NextResponse.json({
      session_id: session.id,
      player_name: session.player_name,
      total_questions: QUIZ_QUESTIONS.length
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    return NextResponse.json(
      { error: 'Eroare la pornirea quiz-ului' },
      { status: 500 }
    );
  }
}
