"use client";
import { useState } from "react";
// import { useRouter } from "next/navigation"; // This was removed as it's specific to Next.js
import axios from "axios";

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


export default function Home() {
  const [videoLink, setVideoLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const videoId = extractYouTubeID(videoLink);
    if (!videoId) {
      setError("Please enter a valid YouTube link or video ID.");
      setLoading(false);
      return;
    }

    try {
      console.log("Extracted video ID:", videoId);
      
      // First check if video is accessible by calling your backend
      const checkRes = await axios.get(`http://localhost:8000/check-video/${videoId}`);
      console.log("Video check result:", checkRes.data);
      
      if (!checkRes.data.video_accessible) {
        setError(`Video is not accessible: ${checkRes.data.error}`);
        setLoading(false);
        return;
      }

      // Fetch transcript from backend
      const res = await axios.get(`http://localhost:8000/transcript/${videoId}`);
      console.log("Transcript fetched successfully");

      // Store videoId and transcript in localStorage
      localStorage.setItem("video_id", videoId);
      localStorage.setItem("transcript", res.data.transcript);

      console.log("Transcript and video ID stored in localStorage.");
      
      // Redirect to the content page using standard browser navigation
      window.location.href = `/content`;

    } catch (error) {
      console.error("Error details:", error);
      let errorMessage = "Could not fetch transcript. ";
      
      if (error.response) {
        // Server responded with error status
        errorMessage += error.response.data.detail || error.response.data.message || "Server error";
      } else if (error.request) {
        // Request was made but no response
        errorMessage += "No response from server. Check if backend is running.";
      } else {
        // Something else happened
        errorMessage += error.message;
      }
      
      setError(errorMessage);
    } finally {
      // In a real redirect, this might not run if the page navigates away quickly.
      setLoading(false);
    }
  };

  const extractYouTubeID = (url) => {
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  return (
    <>
      {/* This style tag injects global styles for the component. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <main className="min-h-screen w-full bg-white text-black antialiased">
        {/* Header */}
        <header className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tighter">
              Vbloc
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl w-full">
            {/* Welcome Section */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4">
              Learn Anything from Video.
            </h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-black/70 mb-10">
              Paste a YouTube link to instantly generate concepts, flashcards, and quizzes. Transform passive watching into active learning.
            </p>

            {/* Input Form */}
            <div className="bg-black text-white p-8 sm:p-10 w-full">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="videoLink" className="sr-only">
                    YouTube Video URL
                  </label>
                  <div className="relative">
                     <Icon path="M22 12h-4l-3 9L9 3l-3 9H2" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      id="videoLink"
                      type="text"
                      placeholder="Paste your YouTube link here..."
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-black text-white border-b-2 border-white/20 focus:border-white focus:outline-none text-lg placeholder:text-white/40 transition-colors duration-300"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="p-3 text-center text-white bg-white/5 border border-white/10">
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading || !videoLink.trim()}
                  className="w-full py-4 bg-white hover:bg-neutral-200 disabled:bg-neutral-700 disabled:text-white/50 disabled:cursor-not-allowed text-black font-bold text-lg transition-all duration-300 transform active:scale-95"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Analyze Video"
                  )}
                </button>
              </form>
            </div>

            {/* Features Section */}
            <div className="mt-16">
              <h3 className="text-sm font-bold uppercase tracking-widest text-black/50 mb-8">Powered By AI</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-left p-6 border border-black/10">
                  <Icon path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" className="w-8 h-8 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Concept Extraction</h3>
                  <p className="text-black/70 text-sm">
                    Key concepts are automatically identified and explained in detail.
                  </p>
                </div>

                <div className="text-left p-6 border border-black/10">
                  <Icon path="M3 3v18h18V3H3zm16 16H5V5h14v14zM11 11h2v2h-2v-2zm-4 0h2v2H7v-2zm8 0h2v2h-2v-2z" className="w-8 h-8 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Smart Flashcards</h3>
                  <p className="text-black/70 text-sm">
                    Generate interactive flashcards for effective, spaced-repetition learning.
                  </p>
                </div>

                <div className="text-left p-6 border border-black/10">
                  <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="w-8 h-8 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Q&A Generation</h3>
                  <p className="text-black/70 text-sm">
                    Create comprehensive question and answer pairs for self-assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-black/10 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-black/60 text-sm">
              &copy; {new Date().getFullYear()} VideoLearner. An AI-powered learning tool.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
