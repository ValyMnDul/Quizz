import { NextResponse } from 'next/server';
import { QUIZ_QUESTIONS } from '@/lib/questions';

export async function GET() {
  const questionsForClient = QUIZ_QUESTIONS.map(q => ({
    id: q.id,
    question: q.question,
    type: q.type,
    options: q.options,
    time_limit: q.time_limit
  }));

  return NextResponse.json({ 
    questions: questionsForClient, 
    total: QUIZ_QUESTIONS.length 
  });
}
