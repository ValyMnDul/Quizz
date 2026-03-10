"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sun, Moon, Trophy, Clock, CheckCircle, XCircle, Users, BookOpen } from "lucide-react";

interface Question {
  id: number;
  question: string;
  type: string;
  options: string[];
  time_limit: number;
}

interface LeaderboardEntry {
  position: number;
  player_name: string;
  score: number;
  progress: number;
  total_questions: number;
  completed: boolean;
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState<"start" | "quiz" | "result" | "leaderboard-view">("start");
  const [playerName, setPlayerName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Show notification
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "quiz" && timeLeft > 0 && !showResult && !showLeaderboard) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showResult, showLeaderboard]);

  // Poll leaderboard
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showLeaderboard || gameState === "leaderboard-view") {
      fetchLeaderboard();
      interval = setInterval(fetchLeaderboard, 3000);
    }
    return () => clearInterval(interval);
  }, [showLeaderboard, gameState, fetchLeaderboard]);

  const handleTimeUp = async () => {
    if (selectedAnswer === null) {
      await submitAnswer(-1);
    }
  };

  const startQuiz = async () => {
    if (!playerName.trim()) {
      showNotification("Te rog introdu numele tau!", "error");
      return;
    }

    setLoading(true);
    try {
      const questionsRes = await fetch("/api/questions");
      const questionsData = await questionsRes.json();
      setQuestions(questionsData.questions);

      const sessionRes = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_name: playerName.trim() }),
      });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.session_id);

      setCurrentQuestionIndex(0);
      setScore(0);
      setGameState("quiz");
      setTimeLeft(questionsData.questions[0].time_limit);

      showNotification("Quiz-ul a inceput! Succes!", "success");
    } catch (error) {
      showNotification("Eroare la pornirea quiz-ului", "error");
      console.error(error);
    }
    setLoading(false);
  };

  const submitAnswer = async (answerIndex: number) => {
    if (showResult) return;

    const question = questions[currentQuestionIndex];
    const timeTaken = question.time_limit - timeLeft;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    try {
      const response = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          answer: answerIndex,
          time_taken: timeTaken,
        }),
      });
      const data = await response.json();

      setLastAnswerCorrect(data.is_correct);
      setCorrectAnswer(data.correct_answer);
      setScore(data.total_score);

      if (data.is_correct) {
        showNotification(`Corect! +${data.points_earned} puncte`, "success");
      } else {
        showNotification("Incorect!", "error");
      }

      setTimeout(() => {
        setShowLeaderboard(true);
        fetchLeaderboard();
      }, 2000);
    } catch (error) {
      showNotification("Eroare la trimiterea raspunsului", "error");
      console.error(error);
    }
  };

  const nextQuestion = () => {
    setShowLeaderboard(false);
    setShowResult(false);
    setSelectedAnswer(null);
    setLastAnswerCorrect(null);
    setCorrectAnswer(null);

    if (currentQuestionIndex + 1 >= questions.length) {
      setGameState("result");
      fetchLeaderboard();
    } else {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(questions[nextIndex].time_limit);
    }
  };

  const restartQuiz = () => {
    setGameState("start");
    setPlayerName("");
    setSessionId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowLeaderboard(false);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Start Screen */}
        {gameState === "start" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border-2 border-border rounded-xl shadow-2xl p-8">
              <div className="text-center pb-4">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold">Criticismul Junimist</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Testeaza-ti cunostintele despre societatea Junimea si Titu Maiorescu
                </p>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Introdu numele tau:</label>
                  <Input
                    placeholder="Numele tau..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && startQuiz()}
                    className="text-lg py-6"
                  />
                </div>

                <Button
                  onClick={startQuiz}
                  disabled={loading || !playerName.trim()}
                  className="w-full py-6 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? "Se incarca..." : "Incepe Quiz-ul"}
                </Button>

                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGameState("leaderboard-view");
                      fetchLeaderboard();
                    }}
                    className="w-full"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Vezi Clasamentul
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-secondary rounded">15 intrebari</span>
                  <span className="px-2 py-1 bg-secondary rounded">Timp limitat</span>
                  <span className="px-2 py-1 bg-secondary rounded">Leaderboard live</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard View */}
        {gameState === "leaderboard-view" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border-2 border-border rounded-xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-2 p-3 rounded-full bg-amber-500/20 w-fit">
                  <Trophy className="h-8 w-8 text-amber-500 animate-float" />
                </div>
                <h2 className="text-2xl font-serif font-semibold">Clasament</h2>
              </div>
              <LeaderboardList leaderboard={leaderboard} currentPlayer={null} />
              <Button onClick={() => setGameState("start")} className="w-full mt-4">
                Inapoi
              </Button>
            </div>
          </div>
        )}

        {/* Quiz Screen */}
        {gameState === "quiz" && currentQuestion && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Intrebarea {currentQuestionIndex + 1} din {questions.length}</span>
                  <span className="font-semibold text-primary">Scor: {score}</span>
                </div>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
              </div>

              {!showLeaderboard ? (
                <div className="bg-card border-2 border-border rounded-xl shadow-2xl p-6">
                  {/* Timer */}
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        timeLeft <= 5 ? "bg-destructive/20 text-destructive animate-pulse-gentle" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Clock className="h-5 w-5" />
                      <span className="text-2xl font-bold font-mono">{timeLeft}s</span>
                    </div>
                  </div>

                  {/* Question Type Badge */}
                  <div className="flex justify-center mb-2">
                    <span className="px-3 py-1 text-xs bg-secondary rounded-full">
                      {currentQuestion.type === "tf" ? "Adevarat / Fals" : "Alegere Multipla"}
                    </span>
                  </div>

                  {/* Question */}
                  <h2 className="text-lg sm:text-xl text-center leading-relaxed font-serif font-semibold mb-6">
                    {currentQuestion.question}
                  </h2>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      let buttonClass = "w-full py-4 px-6 text-left justify-start text-base border-2 rounded-lg transition-all";
                      
                      if (showResult) {
                        if (index === correctAnswer) {
                          buttonClass += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                        } else if (index === selectedAnswer && !lastAnswerCorrect) {
                          buttonClass += " bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                        } else {
                          buttonClass += " bg-card border-border";
                        }
                      } else if (selectedAnswer === index) {
                        buttonClass += " bg-primary text-primary-foreground border-primary";
                      } else {
                        buttonClass += " bg-card border-border hover:bg-accent hover:border-accent";
                      }

                      const optionLabel = currentQuestion.type === "abcd"
                        ? String.fromCharCode(65 + index)
                        : index === 0 ? "A" : "F";

                      return (
                        <button
                          key={index}
                          className={buttonClass}
                          onClick={() => !showResult && submitAnswer(index)}
                          disabled={showResult}
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {optionLabel}
                            </span>
                            <span className="flex-1">{option}</span>
                            {showResult && index === correctAnswer && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {showResult && index === selectedAnswer && !lastAnswerCorrect && index !== correctAnswer && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Leaderboard After Question */
                <div className="bg-card border-2 border-border rounded-xl shadow-2xl p-6">
                  <div className="text-center pb-4">
                    <div className="mx-auto mb-2 p-3 rounded-full bg-amber-500/20 w-fit">
                      <Trophy className="h-6 w-6 text-amber-500 animate-float" />
                    </div>
                    <h2 className="text-xl font-serif font-semibold">Clasament Live</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lastAnswerCorrect ? (
                        <span className="text-green-500 flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Raspuns corect!
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-center gap-1">
                          <XCircle className="h-4 w-4" /> Raspuns incorect
                        </span>
                      )}
                    </p>
                  </div>
                  <LeaderboardList leaderboard={leaderboard} currentPlayer={playerName} />
                  <Button onClick={nextQuestion} className="w-full mt-4 py-6 text-lg">
                    {currentQuestionIndex + 1 >= questions.length ? "Vezi Rezultatul Final" : "Urmatoarea Intrebare"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Screen */}
        {gameState === "result" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-card border-2 border-border rounded-xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 p-4 rounded-full bg-amber-500/20 w-fit">
                  <Trophy className="h-12 w-12 text-amber-500 animate-float" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold">Quiz Finalizat!</h2>
                <p className="text-muted-foreground mt-2">Felicitari, {playerName}!</p>
              </div>

              <div className="text-center p-6 rounded-xl bg-primary/5 border mb-6">
                <div className="text-5xl font-bold text-primary mb-2">{score}</div>
                <div className="text-muted-foreground">puncte din {questions.length * 15} posibile</div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" /> Clasament Final
                </h3>
                <LeaderboardList leaderboard={leaderboard} currentPlayer={playerName} />
              </div>

              <Button onClick={restartQuiz} className="w-full py-6 text-lg">
                Incearca Din Nou
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardList({ leaderboard, currentPlayer }: { leaderboard: LeaderboardEntry[]; currentPlayer: string | null }) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nimeni nu a participat inca</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentPlayer = entry.player_name === currentPlayer;
          const positionColors = ["text-amber-500", "text-gray-400", "text-amber-700"];

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors animate-slideIn ${
                isCurrentPlayer ? "bg-primary/10 border-2 border-primary" : "bg-muted/50 hover:bg-muted"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`text-2xl font-bold w-8 ${positionColors[index] || "text-muted-foreground"}`}>
                {entry.position}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isCurrentPlayer ? "text-primary" : ""}`}>
                  {entry.player_name}
                  {isCurrentPlayer && " (Tu)"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.completed ? (
                    <span className="text-green-500">Finalizat</span>
                  ) : (
                    `${entry.progress}/${entry.total_questions} intrebari`
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{entry.score}</div>
                <div className="text-xs text-muted-foreground">puncte</div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
