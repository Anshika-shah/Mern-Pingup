import React, { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Trash2, 
  Send, 
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Post, Comment, User } from '../types';

interface PostCardProps {
  key?: string | number;
  post: Post;
  currentUser: User;
  onLikeToggle: (postId: string) => void;
  onCommentAdded: (postId: string, commentContent: string, isToxic?: boolean, toxicityReason?: string) => void;
  onPostDeleted: (postId: string) => void;
}

export default function PostCard({ 
  post, 
  currentUser, 
  onLikeToggle, 
  onCommentAdded, 
  onPostDeleted 
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [toxicityCommentWarning, setToxicityCommentWarning] = useState<string | null>(null);

  const isLikedByMe = post.likes.includes(currentUser.id);
  const isMyPost = post.userId === currentUser.id;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    setToxicityCommentWarning(null);

    try {
      // Analyze comment text for toxicity using Gemini API endpoint
      const modRes = await fetch('/api/gemini/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText })
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        setToxicityCommentWarning(modData.reason || 'This comment is flagged as potentially toxic.');
        setIsSubmittingComment(false);
        return;
      }

      onCommentAdded(post.id, commentText);
      setCommentText('');
    } catch (err) {
      console.error('Comment moderation error, fallback active:', err);
      onCommentAdded(post.id, commentText);
      setCommentText('');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Helper to format timestamps
  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      
      let interval = Math.floor(seconds / 31536000);
      if (interval >= 1) return `${interval}y ago`;
      interval = Math.floor(seconds / 2592000);
      if (interval >= 1) return `${interval}mo ago`;
      interval = Math.floor(seconds / 86400);
      if (interval >= 1) return `${interval}d ago`;
      interval = Math.floor(seconds / 3600);
      if (interval >= 1) return `${interval}h ago`;
      interval = Math.floor(seconds / 60);
      if (interval >= 1) return `${interval}m ago`;
      return 'just now';
    } catch (err) {
      return 'some time ago';
    }
  };

  return (
    <div id={`post-card-${post.id}`} className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
      {/* Top Profile / Action Zone */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.userAvatar} 
            alt={post.userName} 
            className="w-10.5 h-10.5 rounded-full object-cover border border-slate-50"
            referrerPolicy="no-referrer"
          />
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 leading-tight">{post.userName}</h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>

        {isMyPost && (
          <button
            id={`btn-delete-post-${post.id}`}
            onClick={() => onPostDeleted(post.id)}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-all"
            title="Delete post"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Post Text Body */}
      <div className="px-5 pb-4">
        <p className="text-[14.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Grid of attached images */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div className={`border-t border-b border-slate-50 overflow-hidden bg-slate-50 ${
          post.imageUrls.length === 1 ? 'max-h-[450px]' : 'grid grid-cols-2 gap-0.5'
        }`}>
          {post.imageUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt="Post media"
              className="w-full h-full object-cover select-all max-h-[400px] mx-auto block"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}

      {/* Interactive Actions bar */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-slate-50">
        <div className="flex items-center gap-6 text-slate-500 font-medium text-xs">
          {/* Like Action Button */}
          <button
            id={`btn-like-post-${post.id}`}
            onClick={() => onLikeToggle(post.id)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-full transition-colors ${
              isLikedByMe 
                ? 'text-rose-500 bg-rose-50/60 font-semibold' 
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Heart className={`h-4.5 w-4.5 ${isLikedByMe ? 'fill-rose-500 stroke-rose-500' : ''}`} />
            <span>{post.likes.length}</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            id={`btn-comments-toggle-${post.id}`}
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-full transition-colors ${
              showComments 
                ? 'text-sky-500 bg-sky-50/60 font-semibold' 
                : 'hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="h-4.5 w-4.5" />
            <span>{post.comments ? post.comments.length : 0}</span>
          </button>
        </div>
      </div>

      {/* Expanded Comments Panel */}
      {showComments && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-4">
          
          {/* Comments list */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start bg-white p-3 rounded-2xl border border-slate-100 animate-fade-in shadow-2xs">
                  <img 
                    src={comment.userAvatar} 
                    alt={comment.userName} 
                    className="w-8.5 h-8.5 rounded-full object-cover mt-0.5 border border-slate-50"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[12px] font-bold text-slate-800">{comment.userName}</h5>
                      <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">No comments yet. Write one below!</p>
            )}
          </div>

          {/* Add a comment Form */}
          <form onSubmit={handleAddComment} className="space-y-2">
            <div className="flex gap-2.5 items-center">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="flex-grow flex items-center bg-white border border-slate-200 focus-within:border-sky-400 transition-colors px-3 py-1.5 rounded-2xl shadow-2xs">
                <input
                  id={`comment-input-${post.id}`}
                  type="text"
                  placeholder="Share your perspective on this..."
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    if (toxicityCommentWarning) setToxicityCommentWarning(null);
                  }}
                  className="flex-grow text-xs text-slate-700 bg-transparent focus:outline-none"
                />
                <button
                  id={`btn-submit-comment-${post.id}`}
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="p-1.5 bg-sky-50 hover:bg-sky-500 hover:text-white rounded-xl text-sky-600 transition-all disabled:opacity-40"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Comment toxicity alert */}
            {toxicityCommentWarning && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-[10px] text-rose-700 animate-fade-in">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                <span>{toxicityCommentWarning}</span>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
