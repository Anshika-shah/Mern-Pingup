import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { Message, User, Conversation } from '../types';

interface ChatBoxProps {
  conversation: Conversation & { otherUser: User };
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, mediaUrl?: string) => void;
}

export default function ChatBox({ 
  conversation, 
  messages, 
  currentUser, 
  onSendMessage 
}: ChatBoxProps) {
  const [inputText, setInputText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isComputingSuggestions, setIsComputingSuggestions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const otherUser = conversation.otherUser;

  // Scroll to bottom on load/new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Automatically trigger Gemini AI Smart suggestions based on the last message
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== currentUser.id) {
        computeSmartReplies(lastMessage.content);
      } else {
        setAiSuggestions([]);
      }
    } else {
      // Prompt a conversation starter
      setAiSuggestions([
        `Hey ${otherUser.name}! How's your week going?`,
        `Hi! Let's connect on code & design.`,
        `Hey there!`
      ]);
    }
  }, [messages, otherUser.id]);

  // Compute smart reply suggestions using server-side Gemini
  const computeSmartReplies = async (content: string) => {
    setIsComputingSuggestions(true);
    try {
      const res = await fetch('/api/gemini/smart-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastMessageContent: content
        })
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } catch (err) {
      console.error(err);
      setAiSuggestions(['That sounds great!', 'Let\'s catch up!', 'Awesome!']);
    } finally {
      setIsComputingSuggestions(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !mediaUrl) return;

    onSendMessage(inputText, mediaUrl || undefined);
    setInputText('');
    setMediaUrl(null);
    setAiSuggestions([]);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    onSendMessage(suggestionText);
    setAiSuggestions([]);
  };

  // Base64 simulated photo attachment
  const handlePhotoAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setMediaUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[650px] bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
      
      {/* Header Info */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={otherUser.avatar} 
              alt={otherUser.name} 
              className="w-10 h-10 rounded-full object-cover border border-slate-800"
              referrerPolicy="no-referrer"
            />
            {otherUser.onlineStatus && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold leading-tight">{otherUser.name}</h4>
            <p className="text-[10px] text-slate-400 font-medium">
              {otherUser.onlineStatus ? 'Active Now' : 'Offline'} • @{otherUser.username}
            </p>
          </div>
        </div>
      </div>

      {/* Message List area */}
      <div className="flex-grow p-5 overflow-y-auto bg-slate-50 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Sparkles className="h-8 w-8 text-indigo-400 mb-2 animate-bounce" />
            <p className="text-sm font-semibold">Start your premium conversation</p>
            <p className="text-xs max-w-[240px] mt-1 leading-relaxed">
              Say hello to {otherUser.name}! Start sharing ideas, code, and design wireframes securely.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div 
                key={msg.id} 
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-2xs ${
                  isMe 
                    ? 'bg-slate-900 text-white rounded-br-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                }`}>
                  {msg.mediaUrl && (
                    <img 
                      src={msg.mediaUrl} 
                      alt="Shared attachment" 
                      className="rounded-xl max-h-48 object-cover mb-2 border border-slate-100" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {msg.content && (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <span className={`block text-[8px] mt-1 text-right leading-none ${
                    isMe ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Replies Panel */}
      {aiSuggestions.length > 0 && (
        <div className="px-4 py-2 bg-indigo-50/50 border-t border-indigo-100 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-indigo-600">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Suggested Quick Replies</span>
            {isComputingSuggestions && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
          </div>
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
            {aiSuggestions.map((suggestion, idx) => (
              <button
                id={`btn-smart-reply-${idx}`}
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex-shrink-0 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-medium text-indigo-700 transition-all cursor-pointer shadow-3xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Sender Form */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 space-y-2">
        {mediaUrl && (
          <div className="relative inline-block bg-slate-50 p-2 rounded-xl border border-slate-100 animate-fade-in shadow-3xs">
            <img src={mediaUrl} alt="Attached upload" className="w-16 h-16 rounded-lg object-cover" />
            <button
              onClick={() => setMediaUrl(null)}
              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 rounded-full text-white font-bold transition-all"
            >
              <span className="text-[10px] block leading-none px-0.5">X</span>
            </button>
          </div>
        )}

        <div className="flex gap-3 items-center">
          <label className="cursor-pointer p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors">
            <ImageIcon className="h-5 w-5 text-sky-500" />
            <input 
              id="chat-photo-attach-input"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePhotoAttach} 
            />
          </label>

          <input
            id="chat-message-input"
            type="text"
            placeholder={`Message ${otherUser.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow text-xs text-slate-700 bg-slate-100 focus:bg-white border border-transparent focus:border-slate-200 transition-all px-4 py-3 rounded-2xl focus:outline-none"
          />

          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputText.trim() && !mediaUrl}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
