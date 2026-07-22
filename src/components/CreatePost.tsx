import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Trash2, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { User } from '../types';

interface CreatePostProps {
  currentUser: User;
  onPostCreated: (postContent: string, imageUrls: string[]) => void;
}

export default function CreatePost({ currentUser, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showAiCaptionBox, setShowAiCaptionBox] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState('inspiring');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState<string | null>(null);

  // Suggested preset photos for instant mock uploading
  const PRESET_MOCK_PHOTOS = [
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&q=80&w=400'
  ];

  const handleAddPresetPhoto = (url: string) => {
    if (imageUrls.length >= 4) return; // Limit 4 photos
    setImageUrls([...imageUrls, url]);
    setToxicityWarning(null);
  };

  const handleRemovePhoto = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  // Base64 file upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrls([...imageUrls, reader.result]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. AI Caption Generator trigger
  const handleGenerateAiCaption = async () => {
    if (!aiKeywords.trim()) return;
    setIsGeneratingCaption(true);
    try {
      const res = await fetch('/api/gemini/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: aiKeywords,
          mood: aiTone,
          imageBase64: imageUrls[0] || null
        })
      });
      const data = await res.json();
      setContent(data.caption);
      setShowAiCaptionBox(false);
      setAiKeywords('');
      setToxicityWarning(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  // 2. AI Toxicity check / publishing flow
  const handlePublishFlow = async () => {
    if (!content.trim() && imageUrls.length === 0) return;

    setIsModerating(true);
    setToxicityWarning(null);

    try {
      // Moderate content before publishing
      const modRes = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content })
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        setToxicityWarning(modData.reason || 'This post contains potentially inflammatory or toxic phrasing. Please refine.');
        setIsModerating(false);
        return;
      }

      // Safe! Let's complete post creation
      onPostCreated(content, imageUrls);
      setContent('');
      setImageUrls([]);
    } catch (err) {
      console.error(err);
      // Fail-safe publish
      onPostCreated(content, imageUrls);
      setContent('');
      setImageUrls([]);
    } finally {
      setIsModerating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Input box */}
      <div className="flex gap-4">
        <img 
          src={currentUser.avatar} 
          alt={currentUser.name} 
          className="w-11 h-11 rounded-full object-cover border border-slate-100"
          referrerPolicy="no-referrer"
        />
        <div className="flex-grow space-y-2">
          <textarea
            id="post-input-textarea"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (toxicityWarning) setToxicityWarning(null);
            }}
            placeholder="Share your latest tech breakthroughs or design wireframes..."
            rows={3}
            className="w-full text-slate-700 placeholder-slate-400 text-[15px] focus:outline-none resize-none pt-1"
          />

          {/* Attached images preview list */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square group rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                  <img src={url} alt="Attached" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 rounded-lg text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toxicity Alerts */}
      {toxicityWarning && (
        <div id="toxicity-warning-box" className="flex items-start gap-3 bg-rose-50 border border-rose-100 p-3.5 rounded-2xl animate-fade-in text-rose-700 text-xs">
          <ShieldAlert className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">PingUp Content Integrity System Warning:</p>
            <p className="mt-0.5">{toxicityWarning}</p>
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* File Upload Hidden */}
          <label className="cursor-pointer p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold">
            <ImageIcon className="h-4 w-4 text-sky-500" />
            <span>Photo</span>
            <input 
              id="file-upload-input"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </label>

          {/* Preset Photo Suggests */}
          <button
            id="btn-presets"
            onClick={() => handleAddPresetPhoto(PRESET_MOCK_PHOTOS[Math.floor(Math.random() * PRESET_MOCK_PHOTOS.length)])}
            className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            disabled={imageUrls.length >= 4}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Preset Photo</span>
          </button>

          {/* AI Caption Trigger */}
          <button
            id="btn-ai-caption"
            onClick={() => setShowAiCaptionBox(!showAiCaptionBox)}
            className={`p-2 hover:bg-sky-50/50 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold ${showAiCaptionBox ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:text-sky-600'}`}
          >
            <Sparkles className="h-4 w-4 text-indigo-500 animate-bounce" />
            <span>AI Assist</span>
          </button>
        </div>

        <button
          id="btn-publish-post"
          onClick={handlePublishFlow}
          disabled={isModerating || (!content.trim() && imageUrls.length === 0)}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
        >
          {isModerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Checking Toxicity...</span>
            </>
          ) : (
            <span>Publish Post</span>
          )}
        </button>
      </div>

      {/* AI Assistant Config Card */}
      {showAiCaptionBox && (
        <div id="ai-generation-panel" className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 animate-fade-in space-y-3.5">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Gemini AI Social Writer
            </h4>
            <button onClick={() => setShowAiCaptionBox(false)} className="text-[10px] text-slate-400 hover:text-slate-700">Cancel</button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">What is your post about?</label>
              <input
                id="ai-keywords-input"
                type="text"
                placeholder="e.g. coffee, backend coding, debugging success"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-grow">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tone & Mood</label>
                <select
                  id="ai-tone-select"
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-2 py-2 rounded-xl"
                >
                  <option value="inspiring">Inspiring & Motivational</option>
                  <option value="witty">Witty & Humorous</option>
                  <option value="professional">Professional / Tech Guru</option>
                  <option value="playful">Playful & Catchy</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  id="btn-ai-generate-submit"
                  onClick={handleGenerateAiCaption}
                  disabled={isGeneratingCaption || !aiKeywords.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 h-[36px]"
                >
                  {isGeneratingCaption ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Write</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
