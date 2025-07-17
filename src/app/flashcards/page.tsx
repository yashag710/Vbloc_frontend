"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios, { AxiosError } from "axios";

// Icon helper component
const Icon = ({ path, className = "w-5 h-5" }: { path: React.ReactNode, className?: string }) => (
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

// Icon paths
const ICONS = {
    layers: <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    xCircle: <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></>,
};

// --- Type Definitions ---
interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  hint?: string;
  importance: 'high' | 'medium' | 'low';
}

interface FlashcardData {
  video_id: string;
  generated_at: string;
  total_cards: number;
  flashcards: Flashcard[];
}

export default function FlashcardsPage() {
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  
  const [studyMode, setStudyMode] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const generateFlashcards = useCallback(async () => {
    if (!hasMounted) return;
    
    const videoId = localStorage.getItem("video_id");
    const transcript = localStorage.getItem("transcript");
    
    if (!videoId || !transcript) {
      setError("Missing video data. Please go back and select a video.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiClient = axios.create({
        timeout: 90000,
        baseURL: "https://vblocbackend-production.up.railway.app",
        headers: { 'Content-Type': 'application/json' }
      });
      const response = await apiClient.post("/generate-flashcards", { video_id: videoId, transcript: transcript });
      
      if (response.data && response.data.flashcards && response.data.flashcards.length > 0) {
          setFlashcardData(response.data);
      } else {
          setError("No flashcards could be generated. The video may be too short or lack distinct concepts.");
      }

    } catch (err: unknown) {
      console.error("Error generating flashcards:", err);
      let errorMessage = "An unexpected error occurred while generating flashcards.";
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<any>;
        if (axiosError.response) {
            errorMessage = `Server Error (${axiosError.response.status}): ${axiosError.response.data?.detail || "Please try again."}`;
        } else if (axiosError.request) {
            errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [hasMounted]);

  useEffect(() => {
    generateFlashcards();
  }, [generateFlashcards]);

  const filteredCards = useMemo(() => {
    if (!flashcardData) return [];
    return flashcardData.flashcards.filter(card => 
      (selectedCategory === 'all' || card.category === selectedCategory) &&
      (selectedDifficulty === 'all' || card.difficulty === selectedDifficulty) &&
      (selectedImportance === 'all' || card.importance === selectedImportance)
    );
  }, [flashcardData, selectedCategory, selectedDifficulty, selectedImportance]);

  const uniqueCategories = useMemo(() => {
    if (!flashcardData) return [];
    return [...new Set(flashcardData.flashcards.map(card => card.category))];
  }, [flashcardData]);

  if (!hasMounted) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon path={ICONS.layers} className="w-12 h-12 text-black/20 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black tracking-tighter mb-1">Generating Flashcards</h2>
          <p className="text-black/60">This can take a moment for longer videos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="border border-black/10 p-8 text-center">
          <Icon path={ICONS.xCircle} className="w-12 h-12 text-black/20 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Failed to Generate Flashcards</h1>
          <p className="text-black/70 mb-6 max-w-sm">{error}</p>
          <button onClick={() => window.location.href = '/content'} className="px-5 py-2 bg-black text-white text-sm font-semibold">Back to Dashboard</button>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #fff; }
        .perspective { perspective: 1000px; }
        .card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
        .card.flipped .card-inner { transform: rotateY(180deg); }
        .card-face { position: absolute; width: 100%; height: 100%; -webkit-backface-visibility: hidden; backface-visibility: hidden; }
        .card-back { transform: rotateY(180deg); }
      `}</style>
      <main className="min-h-screen w-full bg-white text-black flex flex-col antialiased">
        <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-black/10 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tighter">Flashcards</h1>
            <button onClick={() => window.location.href = '/content'} className="px-4 py-2 text-sm font-semibold border border-black hover:bg-black hover:text-white transition-colors">Back to Dashboard</button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
          {flashcardData && (
            <>
              {/* Controls */}
              <div className="border border-black/10 p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm">
                      <p><span className="font-bold">{flashcardData.total_cards}</span> Total</p>
                      <p><span className="font-bold">{filteredCards.length}</span> Showing</p>
                  </div>
                  <button onClick={() => setStudyMode(!studyMode)} disabled={filteredCards.length === 0} className="px-5 py-2 bg-black text-white font-semibold text-sm disabled:bg-neutral-300 disabled:cursor-not-allowed">
                    {studyMode ? "Exit Study Mode" : "Start Study Session"}
                  </button>
                </div>
                {!studyMode && (
                    <div className="grid md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-black/5">
                        <FilterSelect label="Category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} options={uniqueCategories} />
                        <FilterSelect label="Difficulty" value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} options={['easy', 'medium', 'hard']} />
                        <FilterSelect label="Importance" value={selectedImportance} onChange={e => setSelectedImportance(e.target.value)} options={['high', 'medium', 'low']} />
                    </div>
                )}
              </div>

              {studyMode ? (
                <StudyModeView 
                    cards={filteredCards} 
                    exitStudyMode={() => setStudyMode(false)}
                />
              ) : (
                <CardGridView cards={filteredCards} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

// Sub-components for better organization
const FilterSelect = ({ label, value, onChange, options }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }) => (
  <div>
    <label className="block text-xs font-semibold text-black/60 mb-1">{label}</label>
    <select value={value} onChange={onChange} className="w-full bg-white border border-black/20 p-2 text-sm focus:border-black focus:outline-none capitalize">
      <option value="all">All</option>
      {options.map(opt => <option key={opt} value={opt} className="capitalize">{opt}</option>)}
    </select>
  </div>
);

const CardGridView = ({ cards }: { cards: Flashcard[] }) => {
    if (cards.length === 0) {
        return (
            <div className="text-center py-16 border border-black/10">
                <p className="font-bold">No flashcards match your filters.</p>
                <p className="text-sm text-black/60">Try adjusting the filters above to see more cards.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => (
                <div key={card.id} className="border border-black/10 p-4 flex flex-col">
                    <p className="font-bold mb-2 flex-1">{card.front}</p>
                    <p className="text-black/70 mb-4 flex-1">{card.back}</p>
                    <div className="flex items-center justify-between text-xs uppercase font-semibold tracking-wider mt-auto pt-3 border-t border-black/5">
                        <span className="px-2 py-1 bg-neutral-100 text-black/70 capitalize">{card.difficulty}</span>
                        <span className="px-2 py-1 bg-neutral-100 text-black/70 capitalize">{card.importance}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const StudyModeView = ({ cards, exitStudyMode }: { cards: Flashcard[], exitStudyMode: () => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        setIsFlipped(false);
    }, [currentIndex]);

    const card = cards[currentIndex];

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={exitStudyMode} className="text-sm font-semibold hover:underline">Exit Study Mode</button>
                <p className="text-sm font-semibold">{currentIndex + 1} / {cards.length}</p>
            </div>
            <div className="w-full h-2 bg-neutral-100 mb-6">
                <div className="h-2 bg-black transition-all duration-300" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
            </div>

            <div className="perspective w-full max-w-2xl mx-auto h-80 mb-6">
                <div className={`card-inner card ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                    <div className="card-face absolute w-full h-full border border-black/20 flex items-center justify-center p-6 text-center bg-white">
                        <p className="text-2xl font-bold">{card.front}</p>
                    </div>
                    <div className="card-back absolute w-full h-full border border-black/20 flex flex-col items-center justify-center p-6 text-center bg-neutral-50">
                        <p className="text-xl font-semibold mb-4">{card.back}</p>
                        {card.hint && <p className="text-sm text-black/60">💡 {card.hint}</p>}
                    </div>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4">
                <button onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0} className="px-6 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setCurrentIndex(p => Math.min(cards.length - 1, p + 1))} disabled={currentIndex === cards.length - 1} className="px-6 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed">Next</button>
            </div>
        </div>
    );
};
