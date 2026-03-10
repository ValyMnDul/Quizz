import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QUIZ_QUESTIONS } from '@/lib/questions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, question_id, answer, time_taken } = body;

    const { db } = await connectToDatabase();
    
    const session = await db.collection('quiz_sessions').findOne(
      { id: session_id },
      { projection: { _id: 0 } }
    );

    if (!session) {
      return NextResponse.json(
        { error: 'Sesiune negasita' },
        { status: 404 }
      );
    }

    if (session.completed) {
      return NextResponse.json(
        { error: 'Quiz-ul este deja finalizat' },
        { status: 400 }
      );
    }

    const question = QUIZ_QUESTIONS.find(q => q.id === question_id);
    if (!question) {
      return NextResponse.json(
        { error: 'Intrebare negasita' },
        { status: 404 }
      );
    }

    const is_correct = answer === question.correct;
    let points = is_correct ? 10 : 0;

    if (is_correct && time_taken < question.time_limit / 2) {
      points += 5;
    }

    const new_score = (session.score || 0) + points;
    const new_question = (session.current_question || 0) + 1;
    const answers = [...(session.answers || []), {
      question_id,
      answer,
      correct: is_correct,
      points,
      time_taken
    }];

    const completed = new_question >= QUIZ_QUESTIONS.length;

    await db.collection('quiz_sessions').updateOne(
      { id: session_id },
      {
        $set: {
          score: new_score,
          current_question: new_question,
          answers,
          completed,
          ...(completed && { completed_at: new Date().toISOString() })
        }
      }
    );

    return NextResponse.json({
      is_correct,
      correct_answer: question.correct,
      points_earned: points,
      total_score: new_score,
      completed
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Eroare la trimiterea raspunsului' },
      { status: 500 }
    );
  }
}
