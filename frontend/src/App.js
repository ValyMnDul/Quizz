import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import { Switch } from "./components/ui/switch";
import { ScrollArea } from "./components/ui/scroll-area";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Sun, Moon, Trophy, Clock, CheckCircle, XCircle, Users, BookOpen } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [gameState, setGameState] = useState("start"); // start, quiz, result, leaderboard-view
  const [playerName, setPlayerName] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/leaderboard`);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let timer;
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

  // Poll leaderboard when showing it
  useEffect(() => {
    let interval;
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
      toast.error("Te rog introdu numele tău!");
      return;
    }

    setLoading(true);
    try {
      // Fetch questions
      const questionsRes = await axios.get(`${API}/questions`);
      setQuestions(questionsRes.data.questions);

      // Start session
      const sessionRes = await axios.post(`${API}/quiz/start`, {
        player_name: playerName.trim(),
      });
      setSessionId(sessionRes.data.session_id);

      // Initialize quiz
      setCurrentQuestionIndex(0);
      setScore(0);
      setGameState("quiz");
      setTimeLeft(questionsRes.data.questions[0].time_limit);
      
      toast.success("Quiz-ul a început! Succes!");
    } catch (error) {
      toast.error("Eroare la pornirea quiz-ului");
      console.error(error);
    }
    setLoading(false);
  };

  const submitAnswer = async (answerIndex) => {
    if (showResult) return;

    const question = questions[currentQuestionIndex];
    const timeTaken = question.time_limit - timeLeft;

    setSelectedAnswer(answerIndex);
    setShowResult(true);

    try {
      const response = await axios.post(`${API}/quiz/answer`, {
        session_id: sessionId,
        question_id: question.id,
        answer: answerIndex,
        time_taken: timeTaken,
      });

      setLastAnswerCorrect(response.data.is_correct);
      setCorrectAnswer(response.data.correct_answer);
      setScore(response.data.total_score);

      if (response.data.is_correct) {
        toast.success(`Corect! +${response.data.points_earned} puncte`);
      } else {
        toast.error("Incorect!");
      }

      // Show leaderboard after 2 seconds
      setTimeout(() => {
        setShowLeaderboard(true);
        fetchLeaderboard();
      }, 2000);

    } catch (error) {
      toast.error("Eroare la trimiterea răspunsului");
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
        <Toaster position="top-center" richColors />
        
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <Switch
            data-testid="theme-toggle"
            checked={darkMode}
            onCheckedChange={setDarkMode}
          />
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Start Screen */}
        {gameState === "start" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-2 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-serif">
                  Criticismul Junimist
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  Testează-ți cunoștințele despre societatea „Junimea" și Titu Maiorescu
                </p>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Introdu numele tău:</label>
                  <Input
                    data-testid="player-name-input"
                    placeholder="Numele tău..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && startQuiz()}
                    className="text-lg py-6"
                  />
                </div>

                <Button
                  data-testid="start-quiz-btn"
                  onClick={startQuiz}
                  disabled={loading || !playerName.trim()}
                  className="w-full py-6 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? "Se încarcă..." : "Începe Quiz-ul"}
                </Button>

                <div className="border-t pt-4">
                  <Button
                    data-testid="view-leaderboard-btn"
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
                  <Badge variant="secondary">15 întrebări</Badge>
                  <Badge variant="secondary">Timp limitat</Badge>
                  <Badge variant="secondary">Leaderboard live</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leaderboard View */}
        {gameState === "leaderboard-view" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-2 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 rounded-full bg-amber-500/20">
                  <Trophy className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-serif">Clasament</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardList leaderboard={leaderboard} currentPlayer={null} />
                <Button
                  data-testid="back-to-start-btn"
                  onClick={() => setGameState("start")}
                  className="w-full mt-4"
                >
                  Înapoi
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Screen */}
        {gameState === "quiz" && currentQuestion && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Întrebarea {currentQuestionIndex + 1} din {questions.length}</span>
                  <span className="font-semibold text-primary">Scor: {score}</span>
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / questions.length) * 100} 
                  className="h-2"
                />
              </div>

              {!showLeaderboard ? (
                <Card className="border-2 shadow-2xl">
                  <CardHeader className="pb-4">
                    {/* Timer */}
                    <div className="flex items-center justify-center mb-4">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                        timeLeft <= 5 ? "bg-destructive/20 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                        <Clock className="h-5 w-5" />
                        <span className="text-2xl font-bold font-mono">{timeLeft}s</span>
                      </div>
                    </div>

                    {/* Question Type Badge */}
                    <div className="flex justify-center mb-2">
                      <Badge variant={currentQuestion.type === "tf" ? "secondary" : "default"}>
                        {currentQuestion.type === "tf" ? "Adevărat / Fals" : "Alegere Multiplă"}
                      </Badge>
                    </div>

                    {/* Question */}
                    <CardTitle className="text-lg sm:text-xl text-center leading-relaxed font-serif">
                      {currentQuestion.question}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      let buttonClass = "w-full py-4 px-6 text-left justify-start text-base";
                      let variant = "outline";

                      if (showResult) {
                        if (index === correctAnswer) {
                          buttonClass += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-300";
                        } else if (index === selectedAnswer && !lastAnswerCorrect) {
                          buttonClass += " bg-red-500/20 border-red-500 text-red-700 dark:text-red-300";
                        }
                      } else if (selectedAnswer === index) {
                        variant = "default";
                      }

                      const optionLabel = currentQuestion.type === "abcd" 
                        ? String.fromCharCode(65 + index) 
                        : (index === 0 ? "A" : "F");

                      return (
                        <Button
                          key={index}
                          data-testid={`answer-option-${index}`}
                          variant={variant}
                          className={buttonClass}
                          onClick={() => !showResult && submitAnswer(index)}
                          disabled={showResult}
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {optionLabel}
                            </span>
                            <span>{option}</span>
                            {showResult && index === correctAnswer && (
                              <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
                            )}
                            {showResult && index === selectedAnswer && !lastAnswerCorrect && index !== correctAnswer && (
                              <XCircle className="ml-auto h-5 w-5 text-red-500" />
                            )}
                          </span>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                /* Leaderboard After Question */
                <Card className="border-2 shadow-2xl">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-2 p-3 rounded-full bg-amber-500/20">
                      <Trophy className="h-6 w-6 text-amber-500" />
                    </div>
                    <CardTitle className="text-xl font-serif">Clasament Live</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {lastAnswerCorrect ? (
                        <span className="text-green-500 flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4" /> Răspuns corect!
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center justify-center gap-1">
                          <XCircle className="h-4 w-4" /> Răspuns incorect
                        </span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardList leaderboard={leaderboard} currentPlayer={playerName} />
                    <Button
                      data-testid="next-question-btn"
                      onClick={nextQuestion}
                      className="w-full mt-4 py-6 text-lg"
                    >
                      {currentQuestionIndex + 1 >= questions.length ? "Vezi Rezultatul Final" : "Următoarea Întrebare"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Results Screen */}
        {gameState === "result" && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-2 shadow-2xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-amber-500/20">
                  <Trophy className="h-12 w-12 text-amber-500" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-serif">
                  Quiz Finalizat!
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Felicitări, {playerName}!
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 rounded-xl bg-primary/5 border">
                  <div className="text-5xl font-bold text-primary mb-2">{score}</div>
                  <div className="text-muted-foreground">puncte din {questions.length * 15} posibile</div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" /> Clasament Final
                  </h3>
                  <LeaderboardList leaderboard={leaderboard} currentPlayer={playerName} />
                </div>

                <Button
                  data-testid="restart-quiz-btn"
                  onClick={restartQuiz}
                  className="w-full py-6 text-lg"
                >
                  Încearcă Din Nou
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Leaderboard Component
function LeaderboardList({ leaderboard, currentPlayer }) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nimeni nu a participat încă</p>
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
              data-testid={`leaderboard-entry-${index}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentPlayer 
                  ? "bg-primary/10 border-2 border-primary" 
                  : "bg-muted/50 hover:bg-muted"
              }`}
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
                    `${entry.progress}/${entry.total_questions} întrebări`
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

export default App;
