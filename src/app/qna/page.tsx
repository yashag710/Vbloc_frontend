"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Icon helper component
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {path}
  </svg>
);

// Icon paths mimicking lucide-react
const ICONS = {
  brain: <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h-3A2.5 2.5 0 0 1 4 4.5v0A2.5 2.5 0 0 1 6.5 2h3m10 0a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h-3a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 14.5 2h3M9 10.5A2.5 2.5 0 0 1 11.5 13v0a2.5 2.5 0 0 1-2.5 2.5h-1A2.5 2.5 0 0 1 5.5 13v0A2.5 2.5 0 0 1 8 10.5h1m6 0a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h-1a2.5 2.5 0 0 1-2.5-2.5v0a2.5 2.5 0 0 1 2.5-2.5h1M6.5 17A2.5 2.5 0 0 1 9 19.5v0a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 1 19.5v0A2.5 2.5 0 0 1 3.5 17h3m10 0a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5h-3a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 14.5 17h3" />,
  checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>,
  xCircle: <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  bookOpen: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>,
  trophy: <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M9 12l-3-9 9 9-3 9" />,
  rotateCcw: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>,
  chevronRight: <path d="m9 18 6-6-6-6" />,
};

// Define question types
interface BaseQuestion {
  question: string;
  type: "mcq" | "numerical" | "output";
  explanation: string;
  difficulty: string;
  topic: string;
}
interface MCQQuestion extends BaseQuestion { type: "mcq"; options: { [key: string]: string }; correct_answer: string; }
interface NumericalQuestion extends BaseQuestion { type: "numerical"; expected_answer: string; solution_steps: string[]; }
interface OutputQuestion extends BaseQuestion { type: "output"; expected_answer: string; }
type Question = MCQQuestion | NumericalQuestion | OutputQuestion;

export default function QnAPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch questions from backend (using mock data for now)
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError("");
      try {
        // In a real app, you would fetch from your backend:
        const videoId = localStorage.getItem("video_id");
        const transcript = localStorage.getItem("transcript");
        const response = await axios.post('https://vblocbackend-production.up.railway.app/generate-qna', { videoId, transcript });
        setQuestions(response.data.questions);
        
        // Using mock data for demonstration
        // await new Promise(resolve => setTimeout(resolve, 1500));
        // const mockQuestions: Question[] = [
        //     { question: "What is the primary purpose of React hooks?", type: "mcq", options: { "A": "To replace class components entirely", "B": "To manage state and side effects in functional components", "C": "To improve performance of React applications", "D": "To handle routing in React applications" }, correct_answer: "B", explanation: "React hooks allow you to use state and other React features in functional components, making them more powerful and easier to work with.", difficulty: "Intermediate", topic: "React Fundamentals" },
        //     { question: "Calculate the time complexity of a binary search algorithm.", type: "numerical", expected_answer: "O(log n)", solution_steps: ["Binary search divides the search space in half with each iteration.", "With n elements, we can divide at most log₂(n) times.", "Therefore, time complexity is O(log n)."], explanation: "Binary search has logarithmic time complexity because it eliminates half of the remaining elements in each step.", difficulty: "Advanced", topic: "Algorithms" },
        //     { question: "What would be the output of the following Python code?\n\nfor i in range(3):\n    print(i * 2)", type: "output", expected_answer: "0\n2\n4", explanation: "The loop runs 3 times (for i = 0, 1, and 2), and each iteration prints the value of i multiplied by 2.", difficulty: "Beginner", topic: "Python Basics" }
        // ];
        // setQuestions(mockQuestions);

      } catch (err) {
        setError("Failed to generate questions. The video content might not be suitable for a quiz.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswerChange = (index: number, value: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [index]: value }));
  };
  
  const handleSubmit = () => {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRetake = () => {
      setUserAnswers({});
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScore = () => {
    const scorableQuestions = questions.filter(q => q.type === "mcq");
    const correctAnswers = scorableQuestions.filter((q, i) => {
        const originalIndex = questions.indexOf(q);
        return userAnswers[originalIndex] === (q as MCQQuestion).correct_answer;
    });
    return { score: correctAnswers.length, total: scorableQuestions.length };
  };

  const isCorrect = (q: Question, index: number) => {
    const userAnswer = userAnswers[index];
    if (!userAnswer) return false;
    if (q.type === "mcq") return userAnswer === q.correct_answer;
    return userAnswer.trim().toLowerCase() === (q as (NumericalQuestion | OutputQuestion)).expected_answer.trim().toLowerCase();
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon path={ICONS.brain} className="w-12 h-12 text-black/20 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black tracking-tighter mb-1">Generating Your Quiz</h2>
          <p className="text-black/60">Analyzing video content to create personalized questions...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="border border-black/10 p-8 text-center">
          <Icon path={ICONS.xCircle} className="w-12 h-12 text-black/20 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-black/70 mb-6">{error}</p>
          <button onClick={() => window.location.href = '/content'} className="px-5 py-2 bg-black text-white text-sm font-semibold">Back to Dashboard</button>
        </div>
      </main>
    );
  }

  const { score, total } = getScore();
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <>
     <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #fff; }
      `}</style>
    <main className="min-h-screen bg-white text-black antialiased">
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-black/10 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tighter">Quiz Assessment</h1>
          {submitted && (
             <div className="text-right">
                <p className="font-bold text-lg">{percentage}%</p>
                <p className="text-sm text-black/60">Score ({score}/{total} correct)</p>
             </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submitted && (
            <div className="border border-black/10 p-6 mb-8">
                <div className="text-center">
                    <Icon path={ICONS.trophy} className="w-10 h-10 mx-auto mb-3 text-black/30" />
                    <h2 className="text-2xl font-black tracking-tighter mb-2">Quiz Complete!</h2>
                    <p className="text-black/70 mb-4">{percentage >= 80 ? "Excellent work! 🎉" : percentage >= 60 ? "Good job! Keep practicing 👍" : "Keep studying and try again 📚"}</p>
                    <div className="flex justify-center items-center gap-4">
                        <button onClick={handleRetake} className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-semibold transition-colors">
                            <Icon path={ICONS.rotateCcw} className="w-4 h-4" /> Retake Quiz
                        </button>
                         <button onClick={() => window.location.href = '/content'} className="px-5 py-2 text-sm font-semibold border border-black/20 hover:bg-black/5 transition-colors">Back to Dashboard</button>
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className={`border border-black/10 p-6 transition-all ${submitted && q.type === 'mcq' ? (isCorrect(q, index) ? 'border-green-600/40' : 'border-red-600/40') : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold">Question {index + 1}</p>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold">
                    <span className="px-2 py-1 bg-neutral-100 text-black/70">{q.difficulty}</span>
                    <span className="px-2 py-1 bg-neutral-100 text-black/70">{q.topic}</span>
                </div>
              </div>
              <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{q.question}</p>

              {q.type === 'mcq' && (
                <div className="space-y-3">
                  {Object.entries(q.options).map(([key, value]) => {
                    const isSelected = userAnswers[index] === key;
                    const isCorrectChoice = key === q.correct_answer;
                    
                    let stateClasses = "border-black/10 hover:border-black";
                    if (submitted) {
                        if (isCorrectChoice) stateClasses = "border-green-600 bg-green-600/5 text-green-800";
                        else if (isSelected) stateClasses = "border-red-600 bg-red-600/5 text-red-800";
                        else stateClasses = "border-black/10 opacity-60";
                    } else if (isSelected) {
                        stateClasses = "border-black bg-black text-white";
                    }

                    return (
                      <label key={key} className={`flex items-center p-3 border-2 transition-all cursor-pointer ${stateClasses}`}>
                        <input type="radio" name={`q-${index}`} value={key} checked={isSelected} onChange={() => handleAnswerChange(index, key)} disabled={submitted} className="sr-only" />
                        <span className="font-bold mr-3">{key}.</span>
                        <span>{value}</span>
                        {submitted && isCorrectChoice && <Icon path={ICONS.checkCircle} className="w-5 h-5 ml-auto text-green-600" />}
                        {submitted && isSelected && !isCorrectChoice && <Icon path={ICONS.xCircle} className="w-5 h-5 ml-auto text-red-600" />}
                      </label>
                    );
                  })}
                </div>
              )}

              {(q.type === 'numerical' || q.type === 'output') && (
                <div>
                  <textarea
                    placeholder="Your answer..."
                    value={userAnswers[index] || ""}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    disabled={submitted}
                    className="w-full p-3 bg-white border-2 border-black/10 placeholder-black/40 focus:border-black focus:outline-none transition-colors disabled:bg-neutral-100 disabled:text-black/50"
                    rows={q.type === 'output' ? 4 : 1}
                  />
                </div>
              )}

              {submitted && (
                <div className="mt-6 pt-6 border-t border-black/10">
                  <h4 className="font-bold mb-2">Explanation</h4>
                  <p className="text-black/70 mb-4">{q.explanation}</p>
                  {(q.type === 'numerical' || q.type === 'output') && (
                     <div className={`p-3 border-2 ${isCorrect(q, index) ? 'border-green-600/40' : 'border-red-600/40'}`}>
                        <p className="text-sm font-bold">Correct Answer:</p>
                        <p className="font-mono whitespace-pre-wrap">{q.expected_answer}</p>
                     </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!submitted && (
            <div className="mt-8 text-center">
                <button onClick={handleSubmit} className="px-8 py-3 bg-black text-white font-bold text-lg hover:bg-neutral-800 transition-colors">
                    Submit Quiz
                </button>
            </div>
        )}
      </div>
    </main>
    </>
  );
}
