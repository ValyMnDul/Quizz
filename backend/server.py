from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Quiz Questions - 15 questions about Criticismul Junimist
QUIZ_QUESTIONS = [
    {
        "id": 1,
        "question": "In ce an a fost intemeiata societatea culturala Junimea?",
        "type": "abcd",
        "options": ["1860", "1863", "1867", "1870"],
        "correct": 1,
        "time_limit": 20
    },
    {
        "id": 2,
        "question": "In ce oras a fost intemeiata societatea Junimea?",
        "type": "abcd",
        "options": ["Bucuresti", "Cluj", "Iasi", "Timisoara"],
        "correct": 2,
        "time_limit": 15
    },
    {
        "id": 3,
        "question": "Titu Maiorescu este considerat primul critic literar modern din literatura romana.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 15
    },
    {
        "id": 4,
        "question": "Care a fost revista principala a societatii Junimea?",
        "type": "abcd",
        "options": ["Romania literara", "Convorbiri literare", "Familia", "Tribuna"],
        "correct": 1,
        "time_limit": 20
    },
    {
        "id": 5,
        "question": "Cati fondatori a avut societatea Junimea?",
        "type": "abcd",
        "options": ["3", "4", "5", "7"],
        "correct": 2,
        "time_limit": 15
    },
    {
        "id": 6,
        "question": "Teoria formelor fara fond apartine lui Titu Maiorescu.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 15
    },
    {
        "id": 7,
        "question": "Care dintre urmatorii NU a fost fondator al Junimii?",
        "type": "abcd",
        "options": ["Petre Carp", "Mihai Eminescu", "Vasile Pogor", "Iacob Negruzzi"],
        "correct": 1,
        "time_limit": 20
    },
    {
        "id": 8,
        "question": "Revista Convorbiri literare a aparut in anul 1867.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 15
    },
    {
        "id": 9,
        "question": "Cat timp a condus Iacob Negruzzi revista Convorbiri literare?",
        "type": "abcd",
        "options": ["10 ani", "20 ani", "28 ani", "35 ani"],
        "correct": 2,
        "time_limit": 20
    },
    {
        "id": 10,
        "question": "Cum l-a numit Titu Maiorescu pe Mihai Eminescu?",
        "type": "abcd",
        "options": ["Geniul poeziei", "Poetul nepereche", "Marele poet", "Poetul neamului"],
        "correct": 1,
        "time_limit": 20
    },
    {
        "id": 11,
        "question": "Ion Creanga a fost promovat de societatea Junimea.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 15
    },
    {
        "id": 12,
        "question": "Care scriitor a fost apreciat pentru dimensiunea realist-satirica a orientarii junimiste?",
        "type": "abcd",
        "options": ["Mihai Eminescu", "Ion Creanga", "I.L. Caragiale", "Ioan Slavici"],
        "correct": 2,
        "time_limit": 20
    },
    {
        "id": 13,
        "question": "In studiul In contra directiei de azi in cultura romana, Maiorescu identifica viciul radical al culturii romane ca fiind neadevarul.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 20
    },
    {
        "id": 14,
        "question": "Care este opera lui Ioan Slavici mentionata in document?",
        "type": "abcd",
        "options": ["Amintiri din copilarie", "Moara cu noroc", "O scrisoare pierduta", "Luceafarul"],
        "correct": 1,
        "time_limit": 20
    },
    {
        "id": 15,
        "question": "Generatia pasoptista a fost prima care a incercat sa apropie cultura romana de cea europeana.",
        "type": "tf",
        "options": ["Adevarat", "Fals"],
        "correct": 0,
        "time_limit": 15
    }
]

# Models
class QuizSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    current_question: int = 0
    score: int = 0
    answers: List[dict] = []
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed: bool = False
    completed_at: Optional[str] = None

class StartQuizRequest(BaseModel):
    player_name: str

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_id: int
    answer: int
    time_taken: float

class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    player_name: str
    score: int
    total_questions: int
    completed: bool
    position: int = 0

# Routes
@api_router.get("/")
async def root():
    return {"message": "Quiz API - Criticismul Junimist"}

@api_router.get("/questions")
async def get_questions():
    """Get all questions (without correct answers for client)"""
    questions_for_client = []
    for q in QUIZ_QUESTIONS:
        questions_for_client.append({
            "id": q["id"],
            "question": q["question"],
            "type": q["type"],
            "options": q["options"],
            "time_limit": q["time_limit"]
        })
    return {"questions": questions_for_client, "total": len(QUIZ_QUESTIONS)}

@api_router.post("/quiz/start")
async def start_quiz(request: StartQuizRequest):
    """Start a new quiz session"""
    if not request.player_name.strip():
        raise HTTPException(status_code=400, detail="Numele este obligatoriu")
    
    session = QuizSession(player_name=request.player_name.strip())
    session_dict = session.model_dump()
    
    await db.quiz_sessions.insert_one(session_dict)
    
    return {
        "session_id": session.id,
        "player_name": session.player_name,
        "total_questions": len(QUIZ_QUESTIONS)
    }

@api_router.post("/quiz/answer")
async def submit_answer(request: SubmitAnswerRequest):
    """Submit an answer for a question"""
    # Find session
    session = await db.quiz_sessions.find_one({"id": request.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negasita")
    
    if session.get("completed"):
        raise HTTPException(status_code=400, detail="Quiz-ul este deja finalizat")
    
    # Find question
    question = None
    for q in QUIZ_QUESTIONS:
        if q["id"] == request.question_id:
            question = q
            break
    
    if not question:
        raise HTTPException(status_code=404, detail="Intrebare negasita")
    
    # Check if answer is correct
    is_correct = request.answer == question["correct"]
    points = 10 if is_correct else 0
    
    # Bonus points for fast answers
    if is_correct and request.time_taken < question["time_limit"] / 2:
        points += 5
    
    # Update session
    new_score = session.get("score", 0) + points
    new_question = session.get("current_question", 0) + 1
    answers = session.get("answers", [])
    answers.append({
        "question_id": request.question_id,
        "answer": request.answer,
        "correct": is_correct,
        "points": points,
        "time_taken": request.time_taken
    })
    
    completed = new_question >= len(QUIZ_QUESTIONS)
    update_data = {
        "score": new_score,
        "current_question": new_question,
        "answers": answers,
        "completed": completed
    }
    
    if completed:
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.quiz_sessions.update_one(
        {"id": request.session_id},
        {"$set": update_data}
    )
    
    return {
        "is_correct": is_correct,
        "correct_answer": question["correct"],
        "points_earned": points,
        "total_score": new_score,
        "completed": completed
    }

@api_router.get("/leaderboard")
async def get_leaderboard():
    """Get real-time leaderboard"""
    sessions = await db.quiz_sessions.find(
        {},
        {"_id": 0, "player_name": 1, "score": 1, "completed": 1, "current_question": 1}
    ).sort("score", -1).to_list(100)
    
    leaderboard = []
    for idx, session in enumerate(sessions):
        leaderboard.append({
            "position": idx + 1,
            "player_name": session.get("player_name", "Anonim"),
            "score": session.get("score", 0),
            "progress": session.get("current_question", 0),
            "total_questions": len(QUIZ_QUESTIONS),
            "completed": session.get("completed", False)
        })
    
    return {"leaderboard": leaderboard}

@api_router.get("/quiz/session/{session_id}")
async def get_session(session_id: str):
    """Get session details"""
    session = await db.quiz_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negasita")
    
    return session

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
