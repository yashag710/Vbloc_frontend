"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

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
  bot: <path d="M12 8V4H8V8H4v4h4v4h4v4h4v-4h4V8h-4zM4 12v4h4v4h4v-4h4v-4h4V8h-4V4H8v4H4z" />,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="m22 2-11 11" /></>,
  messageCircle: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  alertCircle: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
};

// --- Type Definitions ---
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BackendError {
    detail?: string;
    error?: string;
    message?: string;
}
export default function YouTubeChatUI() {
  const [videoId, setVideoId] = useState('');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedVideoId = localStorage.getItem('video_id');
    const storedTranscript = localStorage.getItem('transcript');

    if (storedVideoId) setVideoId(storedVideoId);
    if (storedTranscript) setTranscript(storedTranscript);

    setIsInitialized(true);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || loading) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    const currentQuestion = question;
    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const apiClient = axios.create({
        baseURL: "https://vblocbackend-production.up.railway.app",
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await apiClient.post('/video-chat', {
        video_id: videoId,
        transcript: transcript,
        new_question: currentQuestion,
        chat_history: chatHistory, // Send history before the new question
      });

      const assistantTurn: ChatMessage = response.data.new_chat_turn;
      setChatHistory(prev => [...prev, assistantTurn]);

    } catch (err: unknown) {
        let errorMessage = 'An unknown error occurred. Please try again.';
        if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError<BackendError>;
            if (axiosError.response) {
                errorMessage = `Server Error (${axiosError.response.status}): ${axiosError.response.data?.detail || "Please try again."}`;
            } else if (axiosError.request) {
                errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }
      setError(errorMessage);
      setChatHistory(chatHistory); // Revert optimistic update
    } finally {
      setLoading(false);
    }
  }, [question, loading, chatHistory, videoId, transcript]);
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (!isInitialized) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Icon path={ICONS.loader} className="w-8 h-8 animate-spin mx-auto mb-4 text-black/50" />
          <p className="text-black/60">Initializing Chat...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #fff; }
        .scrollbar-thin::-webkit-scrollbar { width: 5px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #ccc; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #aaa; }
      `}</style>
      <main className="min-h-screen w-full bg-white text-black flex flex-col antialiased">
        <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-black/10 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tighter">Video Chatbot</h1>
            <button
              onClick={() => window.location.href = "/content"}
              className="px-4 py-2 text-sm font-semibold border border-black hover:bg-black hover:text-white transition-colors duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
          <div className="flex-1 overflow-y-auto mb-4 p-4 border border-black/10 scrollbar-thin">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Icon path={ICONS.messageCircle} className="w-12 h-12 text-black/20 mx-auto mb-4" />
                  <p className="text-black/80 text-lg font-bold mb-1">Ask Anything</p>
                  <p className="text-black/50 text-sm">Start a conversation about the video content.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black text-white flex-shrink-0">
                        <Icon path={ICONS.bot} className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-xl p-4 rounded-lg ${msg.role === 'user' ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                     {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-neutral-200 text-black flex-shrink-0">
                        <Icon path={ICONS.user} className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                   <div className="flex items-start gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black text-white flex-shrink-0">
                        <Icon path={ICONS.bot} className="w-4 h-4" />
                      </div>
                      <div className="max-w-xl p-4 rounded-lg bg-neutral-100 text-black">
                        <Icon path={ICONS.loader} className="w-5 h-5 animate-spin" />
                      </div>
                    </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/5 rounded-lg flex items-center gap-3 text-sm text-red-700">
              <Icon path={ICONS.alertCircle} className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mt-auto">
            <div className="flex gap-2">
              <textarea
                placeholder="Ask a question about the video..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 bg-white border-2 border-black/10 rounded-none text-black placeholder-black/40 focus:border-black focus:outline-none transition-colors resize-none"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="flex items-center justify-center px-6 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                {loading ? <Icon path={ICONS.loader} className="w-5 h-5 animate-spin" /> : <Icon path={ICONS.send} />}
              </button>
            </div>
            <div className="mt-2 text-xs text-black/40 flex justify-between">
                <span>Press Enter to send, Shift+Enter for a new line.</span>
                <button 
                  onClick={() => setChatHistory([])} 
                  disabled={chatHistory.length === 0 || loading}
                  className="hover:underline disabled:text-black/20 disabled:no-underline"
                >
                  Clear Chat
                </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
