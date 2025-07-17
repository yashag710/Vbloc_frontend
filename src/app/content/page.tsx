"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
// import { useRouter } from "next/navigation"; // Removed this line to fix compilation error

// Helper component for Icons
const Icon = ({ path, className = "w-6 h-6" }) => (
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
    <path d={path} />
  </svg>
);

export default function VideoAssistantPage() {
  const [concepts, setConcepts] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // const router = useRouter(); // Removed this line

  // This ensures localStorage is accessed only on the client side.
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const fetchData = async (isRetry = false) => {
    if (!hasMounted) return;
    
    const videoId = localStorage.getItem("video_id");
    const transcript = localStorage.getItem("transcript");
    
    if (!videoId) {
      setError("Missing video ID. Please go back and select a video.");
      setLoading(false);
      return;
    }

    if (!transcript) {
      setError("Transcript not found. Please go back and try again.");
      setLoading(false);
      return;
    }

    if (transcript.length < 100) {
      setError("Transcript too short for meaningful analysis. Please select a longer video.");
      setLoading(false);
      return;
    }
    
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
        setRetryCount(0);
      }

      const apiClient = axios.create({
        timeout: 60000,
        baseURL: "https://vblocbackend-production.up.railway.app",
        headers: { 'Content-Type': 'application/json' }
      });

      const [conceptsRes, topicsRes] = await Promise.allSettled([
        apiClient.post("/extract-concepts", { video_id: videoId, transcript: transcript }),
        apiClient.post("/extract-topic-structure", { video_id: videoId, transcript: transcript })
      ]);

      if (conceptsRes.status === 'fulfilled') {
        setConcepts(conceptsRes.value.data?.concepts || []);
      } else {
        console.error("Concepts request failed:", conceptsRes.reason);
        setConcepts([]);
      }

      if (topicsRes.status === 'fulfilled') {
        setTopics(topicsRes.value.data?.topics || []);
      } else {
        console.error("Topics request failed:", topicsRes.reason);
        setTopics([]);
      }

      if (conceptsRes.status === 'rejected' && topicsRes.status === 'rejected') {
        throw new Error("Both concepts and topics extraction failed. Please check the server.");
      }

    } catch (err: any) {
      console.error("Error fetching data:", err);
      
      let errorMessage = "An unexpected error occurred. ";
      let canRetry = false;
      
      if (err.response) {
        const { status, data } = err.response;
        const detail = data?.detail || data?.error || "Unknown server error";
        errorMessage = `Server Error (${status}): ${detail}`;
        canRetry = status >= 500;
      } else if (err.request) {
        errorMessage = "Cannot connect to the server. Please ensure the backend is running and accessible.";
        canRetry = true;
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "The request timed out. The video might be too long or the server is overloaded.";
        canRetry = true;
      } else {
        errorMessage = err.message || "An unknown error occurred.";
        canRetry = true;
      }
      
      setError(errorMessage);
      
      if (canRetry && retryCount < 2) {
        const nextRetry = retryCount + 1;
        console.log(`Retrying... Attempt ${nextRetry}`);
        setRetryCount(nextRetry);
        setTimeout(() => fetchData(true), 2000 * nextRetry);
      }
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(hasMounted) {
        fetchData();
    }
  }, [hasMounted]);

  if (!hasMounted) {
    return null; // Prevents server-side rendering/hydration errors
  }

  const handleRetry = () => {
    fetchData(false);
  };
  
  const renderConceptField = (item: any, fieldName: string, displayName: string) => {
    const value = item[fieldName];
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    return (
      <div>
        <h4 className="font-bold text-sm uppercase tracking-wider text-black/60 mb-2">{displayName}</h4>
        <div className="text-black/80 space-y-2">
          {Array.isArray(value) ? (
            value.map((subItem: string, idx: number) => (
              <p key={idx} className="leading-relaxed flex items-start"><span className="mr-2 mt-1.5 opacity-50">•</span>{subItem}</p>
            ))
          ) : (
            <p className="leading-relaxed">{value}</p>
          )}
        </div>
      </div>
    );
  };
  
  const ActionButton = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 text-center px-4 py-3 bg-white text-black border border-black/20 hover:bg-black hover:text-white disabled:bg-neutral-100 disabled:text-black/30 disabled:cursor-not-allowed transition-all duration-300 font-semibold text-sm"
    >
      {children}
    </button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #fff; }
      `}</style>
      <main className="min-h-screen w-full bg-white text-black flex flex-col antialiased">
        {/* Header */}
        <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-black/10 flex-shrink-0">
          <div className="max-w-[90rem] mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tighter">
              Learning Dashboard
            </h1>
            <button
              onClick={() => window.location.href = "/"}
              className="px-4 py-2 text-sm font-semibold border border-black hover:bg-black hover:text-white transition-colors duration-300"
            >
              New Video
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex max-w-[90rem] mx-auto w-full overflow-hidden">
          {/* Left Panel - Concepts */}
          <section className="flex-1 flex flex-col border-r border-black/10">
            <div className="px-6 py-4 border-b border-black/10 flex-shrink-0">
              <h2 className="text-lg font-bold tracking-tight">Extracted Concepts</h2>
              <p className="text-black/60 text-sm">Key ideas and explanations from the video.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
                  <p className="font-semibold">Analyzing Video Content...</p>
                  <p className="text-black/60 text-sm">This may take a moment for longer videos.</p>
                  {retryCount > 0 && <p className="text-black/60 font-bold text-sm mt-2">Retry attempt {retryCount}/2</p>}
                </div>
              )}

              {error && (
                <div className="h-full flex items-center justify-center">
                    <div className="border border-black/10 p-6 text-center">
                        <h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
                        <p className="text-black/70 mb-4 max-w-sm">{error}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={handleRetry} className="px-4 py-2 bg-black text-white text-sm font-semibold transition-colors duration-200">Try Again</button>
                            <button onClick={() => window.location.href = "/"} className="px-4 py-2 bg-white border border-black/20 text-black text-sm font-semibold transition-colors duration-200">Go Home</button>
                        </div>
                    </div>
                </div>
              )}

              {!loading && !error && concepts?.length > 0 && (
                <div className="space-y-8">
                  {concepts.map((item, index) => (
                    <div key={index} className="border border-black/10 p-6">
                      <h3 className="text-2xl font-black tracking-tighter text-black mb-4">
                        {item.concept || "Unnamed Concept"}
                      </h3>
                      <div className="space-y-6">
                        {renderConceptField(item, "definition", "Definition")}
                        {renderConceptField(item, "detailed_explanation", "Detailed Explanation")}
                        {renderConceptField(item, "formulas", "Formulas")}
                        {renderConceptField(item, "real_world_examples", "Examples")}
                        {renderConceptField(item, "key_points", "Key Points")}
                        {renderConceptField(item, "common_mistakes", "Common Mistakes")}
                        {renderConceptField(item, "study_tips", "Study Tips")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                            {renderConceptField(item, "applications", "Applications")}
                            {renderConceptField(item, "prerequisites", "Prerequisites")}
                        </div>
                        <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider pt-4 border-t border-black/5">
                            {item.difficulty_level && <span className="px-2 py-1 bg-neutral-100 text-black/70">{item.difficulty_level}</span>}
                            {item.estimated_study_time && <span className="px-2 py-1 bg-neutral-100 text-black/70">{item.estimated_study_time}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!loading && !error && (!concepts || concepts.length === 0) && (
                 <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <h3 className="font-bold text-lg mb-2">No Concepts Found</h3>
                        <p className="text-black/70 mb-4 max-w-sm">The AI could not extract detailed concepts from this video.</p>
                        <button onClick={handleRetry} className="px-4 py-2 bg-black text-white text-sm font-semibold transition-colors duration-200">Try Again</button>
                    </div>
                </div>
              )}
            </div>
          </section>

          {/* Right Panel - Topics & Actions */}
          <aside className="w-96 flex-shrink-0 flex flex-col bg-white">
            <div className="px-6 py-4 border-b border-black/10">
              <h2 className="text-lg font-bold tracking-tight">Topic Structure</h2>
              <p className="text-black/60 text-sm">An organized breakdown of the content.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {topics?.length > 0 ? (
                <div className="space-y-4">
                  {topics.map((topic, index) => (
                    <div key={index}>
                      <h3 className="font-bold text-black mb-2 flex items-start">
                        <span className="text-black/40 mr-2">{index + 1}.</span>
                        {topic.topic}
                      </h3>
                      {topic.subtopics?.length > 0 && (
                        <div className="ml-2 pl-3 border-l border-black/10 space-y-1.5">
                          {topic.subtopics.map((subtopic: string, subIndex: number) => (
                            <p key={subIndex} className="text-black/70 text-sm">{subtopic}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-8 text-black/50 text-sm">
                    {error ? "Topics unavailable due to error." : "No topics found."}
                  </div>
                )
              )}
            </div>
            
            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-black/10 mt-auto">
                <h3 className="text-sm font-bold text-center mb-3 uppercase tracking-wider text-black/50">Next Steps</h3>
                <div className="flex justify-center items-center gap-2">
                    <ActionButton onClick={() => window.location.href = "/flashcards"} disabled={loading || !!error}>Flashcards</ActionButton>
                    <ActionButton onClick={() => window.location.href = "/qna"} disabled={loading || !!error}>Generate Q&A</ActionButton>
                    <ActionButton onClick={() => window.location.href = "/chatbot"} disabled={loading || !!error}>Chatbot</ActionButton>
                </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
