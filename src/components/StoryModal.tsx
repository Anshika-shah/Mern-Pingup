import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Story } from '../types';

interface StoryModalProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryModal({ stories, initialIndex, onClose }: StoryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const activeStory = stories[currentIndex];
  const duration = 5000; // 5 seconds per story

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) {
      if (progressInterval.current) clearInterval(progressInterval.current);
      return;
    }

    const start = Date.now() - (progress / 100) * duration;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        handleNext();
      }
    }, 50);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, isPaused, progress]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  if (!activeStory) return null;

  // Extract text and bg-style if it is a text-gradient preset
  let storyText = activeStory.content;
  let bgStyle = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'; // slate default
  
  if (activeStory.type === 'text' && activeStory.content.includes('||')) {
    const parts = activeStory.content.split('||');
    bgStyle = parts[0];
    storyText = parts[1];
  }

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 animate-fade-in select-none">
      {/* Outer Click to close (mobile friendly margins) */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      {/* Story Player Frame */}
      <div className="relative w-full max-w-lg h-full max-h-[85vh] md:h-[750px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-900 z-10 flex flex-col justify-between">
        
        {/* Navigation and Progress Bars */}
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/70 to-transparent z-20">
          
          {/* Multiple Progress Indicator Segments */}
          <div className="flex gap-1.5 mb-4">
            {stories.map((story, idx) => {
              let widthVal = '0%';
              if (idx < currentIndex) widthVal = '100%';
              if (idx === currentIndex) widthVal = `${progress}%`;
              return (
                <div key={story.id} className="h-1 flex-grow bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-75"
                    style={{ width: widthVal }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Meta Information */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <img 
                src={activeStory.userAvatar} 
                alt={activeStory.userName} 
                className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-sm font-semibold text-white truncate drop-shadow-sm">{activeStory.userName}</p>
                <p className="text-[10px] text-white/75 font-mono drop-shadow-sm">
                  {new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button 
                id="btn-close-story"
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Left/Right Tap zones for mobile skipping */}
        <div className="absolute inset-x-0 bottom-0 top-20 z-10 flex">
          <div 
            id="story-zone-prev"
            className="w-1/3 h-full cursor-pointer" 
            onClick={handlePrev}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div 
            id="story-zone-pause"
            className="w-1/3 h-full cursor-pointer" 
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div 
            id="story-zone-next"
            className="w-1/3 h-full cursor-pointer" 
            onClick={handleNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
        </div>

        {/* Interactive Content Area */}
        <div className="flex-grow flex items-center justify-center relative w-full h-full bg-slate-900">
          {activeStory.type === 'image' ? (
            <>
              <img 
                src={activeStory.mediaUrl} 
                alt="Story Content" 
                className="w-full h-full object-contain md:object-cover"
                referrerPolicy="no-referrer"
              />
              {activeStory.content && (
                <div className="absolute bottom-12 inset-x-6 bg-black/60 backdrop-blur-md p-4 rounded-2xl text-center border border-white/10 shadow-lg text-white text-sm leading-relaxed z-20">
                  {activeStory.content}
                </div>
              )}
            </>
          ) : (
            // Text Gradients presets
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-10 text-center relative"
              style={{ background: bgStyle }}
            >
              <p className="text-xl md:text-2xl font-display font-semibold text-white drop-shadow-md leading-relaxed">
                {storyText}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Controls for Desktop (Next/Prev Buttons) */}
        <div className="hidden md:block">
          <button 
            onClick={handlePrev}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 p-2 bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white rounded-full transition-all hover:scale-105 z-30 ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 p-2 bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white rounded-full transition-all hover:scale-105 z-30"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Bottom space */}
        <div className="p-4 bg-slate-950 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          Story {currentIndex + 1} of {stories.length}
        </div>
      </div>
    </div>
  );
}
