import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  UserPlus, 
  Check, 
  X, 
  Clock, 
  Plus, 
  ChevronRight, 
  Loader2, 
  ShieldAlert,
  Users,
  Send,
  UserCheck,
  Heart,
  MessageSquare,
  Lock,
  Trash2
} from 'lucide-react';
import { User, Post, Story, Message, Conversation } from './types';
import Sidebar from './components/Sidebar';
import StoriesBar from './components/StoriesBar';
import StoryModal from './components/StoryModal';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import ChatBox from './components/ChatBox';
import ProfileEditModal from './components/ProfileEditModal';

export default function App() {
  // Authentication & Active Session States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authFormUsername, setAuthFormUsername] = useState('');
  const [authFormPassword, setAuthFormPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // App Master Datasets
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [conversations, setConversations] = useState<(Conversation & { otherUser: User })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Interactive View States
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal controllers
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  
  // Story Creator State
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [newStoryType, setNewStoryType] = useState<'text' | 'image'>('text');
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryBg, setNewStoryBg] = useState('linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)');
  const [newStoryImage, setNewStoryImage] = useState<string | null>(null);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  // AI Recommendation State
  const [aiRecommendations, setAiRecommendations] = useState<{ userId: string; score: number; matchReason: string }[]>([]);
  const [isLoadingAiRecs, setIsLoadingAiRecs] = useState(false);

  // Messaging sub-state
  const [activeConversation, setActiveConversation] = useState<(Conversation & { otherUser: User }) | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Story color presets
  const STORY_BG_PRESETS = [
    'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)', // sunset amber
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // green emerald
    'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // sky breeze
    'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', // purple electric
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'  // cosmic slate
  ];

  // Load active session on boot
  useEffect(() => {
    const savedUserId = localStorage.getItem('pingup_user_id');
    if (savedUserId) {
      fetchCurrentUser(savedUserId);
    }
  }, []);

  // Fetch whole app database whenever active user switches
  useEffect(() => {
    if (currentUser) {
      fetchMasterData();
    }
  }, [currentUser?.id]);

  // Handle active conversation message polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentUser && activeConversation) {
      fetchActiveChatMessages(activeConversation.id);
      
      // Fast polling simulation for immediate responsive mock conversations!
      interval = setInterval(() => {
        fetchActiveChatMessages(activeConversation.id);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser?.id, activeConversation?.id]);

  // Fetch recommendations whenever Connections page is opened
  useEffect(() => {
    if (activeTab === 'connections' && currentUser) {
      fetchAiRecommendations();
    }
  }, [activeTab, currentUser?.id]);

  const fetchCurrentUser = async (userId: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
        localStorage.setItem('pingup_user_id', user.id);
      } else {
        localStorage.removeItem('pingup_user_id');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const fetchMasterData = async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const headers = { 'X-User-Id': currentUser.id };
      
      // Fetch users, posts, stories, conversations simultaneously
      const [usersRes, postsRes, storiesRes, convsRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/posts', { headers }),
        fetch('/api/stories', { headers }),
        fetch('/api/messages/conversations', { headers })
      ]);

      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
      if (storiesRes.ok) setStories(await storiesRes.json());
      if (convsRes.ok) {
        const convList = await convsRes.json();
        setConversations(convList);
        
        // Retain selected active conversation if exists
        if (activeConversation) {
          const updated = convList.find((c: any) => c.id === activeConversation.id);
          if (updated) setActiveConversation(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchActiveChatMessages = async (convId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages/${convId}`, {
        headers: { 'X-User-Id': currentUser.id }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAiRecommendations = async () => {
    if (!currentUser) return;
    setIsLoadingAiRecs(true);
    try {
      const res = await fetch('/api/gemini/recommend-connections', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAiRecs(false);
    }
  };

  // -------------------------------------------------------------
  // Event Handlers (CRUD API Synced)
  // -------------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFormUsername.trim()) return;

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: authFormUsername,
          password: authFormPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('pingup_user_id', data.user.id);
        setAuthFormUsername('');
        setAuthFormPassword('');
      } else {
        setAuthError(data.error || 'Login failed. Please check details.');
      }
    } catch (err) {
      setAuthError('Connection failed. Server might be launching.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Switch session account locally instantly
  const handleSwitchAccount = async (userId: string) => {
    localStorage.setItem('pingup_user_id', userId);
    setActiveConversation(null);
    setMessages([]);
    await fetchCurrentUser(userId);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pingup_user_id');
    setActiveConversation(null);
    setMessages([]);
  };

  const handlePostCreated = async (content: string, imageUrls: string[]) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({ content, imageUrls })
      });
      if (res.ok) {
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'X-User-Id': currentUser.id }
      });
      if (res.ok) {
        // Perform fast optimistic UI update
        const updatedLikes = await res.json();
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { ...p, likes: updatedLikes.likes };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentAdded = async (postId: string, commentContent: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({ content: commentContent })
      });
      if (res.ok) {
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostDeleted = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'X-User-Id': currentUser.id }
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Connection and requests management
  const handleConnectRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        fetchMasterData();
        // Optimistic refresh
        setAllUsers(allUsers.map(u => {
          if (u.id === targetUserId) {
            return {
              ...u,
              pendingRequests: [...u.pendingRequests, { from: currentUser.id, to: targetUserId, status: 'pending' }]
            };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConnectResponse = async (fromUserId: string, action: 'accept' | 'decline') => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({ fromUserId, action })
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentUser(updated.user);
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/connections/follow', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Save edits
  const handleProfileSave = async (updatedFields: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/profile/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setShowProfileEdit(false);
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Story publishing
  const handleStoryPublish = async () => {
    if (!currentUser) return;
    if (newStoryType === 'text' && !newStoryText.trim()) return;
    if (newStoryType === 'image' && !newStoryImage) return;

    setIsSubmittingStory(true);
    try {
      const content = newStoryType === 'text' 
        ? `${newStoryBg}||${newStoryText}` 
        : newStoryText;

      const res = await fetch('/api/stories/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
          type: newStoryType,
          content,
          mediaUrl: newStoryImage || undefined
        })
      });

      if (res.ok) {
        setNewStoryText('');
        setNewStoryImage(null);
        setShowStoryCreator(false);
        fetchMasterData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingStory(false);
    }
  };

  const handleStoryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewStoryImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Chat message send
  const handleSendMessage = async (content: string, imageUrl?: string) => {
    if (!currentUser || !activeConversation) return;
    setIsSendingMessage(true);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id
        },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          receiverId: activeConversation.otherUser.id,
          content,
          mediaUrl: imageUrl
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Append sent message immediately to message stream for high-performance responsive UI
        setMessages([...messages, data.message]);
        
        // Update conversation lastMessage bubble
        setConversations(conversations.map(c => {
          if (c.id === activeConversation.id) {
            return { ...c, lastMessage: data.message };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Helper filters
  const filteredUsers = allUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || 
           u.email.toLowerCase().includes(q) || 
           u.location.toLowerCase().includes(q) ||
           u.interests.some(i => i.toLowerCase().includes(q));
  });

  const myPosts = posts.filter(p => p.userId === currentUser?.id);

  // -------------------------------------------------------------
  // Render Auth Portal if not logged in
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-sky-500/30 font-sans">
        
        {/* Sleek dynamic background decorations */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        {/* Central Auth Container */}
        <div className="w-full max-w-[440px] bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex bg-gradient-to-tr from-sky-400 to-indigo-500 p-3 rounded-2xl shadow-xl shadow-sky-500/15 mb-2">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display font-bold text-3xl tracking-tight text-white">Welcome to PingUp</h2>
            <p className="text-slate-400 text-xs">The premium AI-infused workspace social network</p>
          </div>

          {authError && (
            <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl animate-fade-in text-rose-300 text-xs leading-relaxed">
              <ShieldAlert className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email or Username</label>
              <input
                id="login-username-input"
                type="text"
                required
                placeholder="e.g. anshikashah or anshika2004shah@gmail.com"
                value={authFormUsername}
                onChange={(e) => setAuthFormUsername(e.target.value)}
                className="w-full text-xs text-slate-100 border border-slate-800/80 focus:border-sky-400 focus:outline-none bg-slate-950 px-4 py-3 rounded-xl transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <span className="text-[10px] text-slate-500 font-medium">Auto-creates account if new!</span>
              </div>
              <input
                id="login-password-input"
                type="password"
                placeholder="Enter password"
                value={authFormPassword}
                onChange={(e) => setAuthFormPassword(e.target.value)}
                className="w-full text-xs text-slate-100 border border-slate-800/80 focus:border-sky-400 focus:outline-none bg-slate-950 px-4 py-3 rounded-xl transition-all"
              />
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isAuthLoading || !authFormUsername.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isAuthLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Configuring Session...</span>
                </span>
              ) : (
                <span>Access Social Feed</span>
              )}
            </button>
          </form>

          {/* Social login Simulation */}
          <div className="space-y-3.5 pt-2">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest">Or simulate Google Login</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              id="btn-google-login"
              onClick={() => {
                setAuthFormUsername('anshika2004shah@gmail.com');
                setAuthFormPassword('mock_password_123');
              }}
              className="w-full py-3 bg-slate-950 border border-slate-800/80 hover:bg-slate-800/50 rounded-xl text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <img src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=40&h=40" className="w-4 h-4 rounded-full object-cover" alt="google" />
              <span>Sign In as Anshika (Anshika Shah)</span>
            </button>

            <button
              id="btn-google-login-alex"
              onClick={() => {
                setAuthFormUsername('alexrivera');
                setAuthFormPassword('mock_password_123');
              }}
              className="w-full py-2.5 bg-slate-950 border border-slate-800/50 hover:bg-slate-800/50 rounded-xl text-slate-400 text-[11px] transition-colors flex items-center justify-center gap-2"
            >
              <span>Or sign in as Alex (Alex Rivera)</span>
            </button>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="mt-8 text-[10px] text-slate-600 font-mono uppercase tracking-widest">PingUp Workspace • Security Encrypted</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Dashboard
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex font-sans select-none">
      
      {/* 1. Left Navigation panel */}
      <Sidebar 
        currentUser={currentUser}
        allUsers={allUsers}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />

      {/* 2. Main content container */}
      <main className="flex-grow md:pl-64 pb-20 md:pb-6 pr-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
          
          {/* Header Dashboard indicator */}
          <header className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs">
            <div>
              <h2 className="font-display font-bold text-xl text-slate-900 capitalize leading-tight">
                {activeTab === 'connections' ? 'My Connections' : `${activeTab}space`}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Active member: <strong className="text-slate-600">@{currentUser.username}</strong> ({currentUser.location})
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase font-bold">Synchronized</span>
            </div>
          </header>

          {/* Tab: Feed */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {/* Stories Bar */}
              <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Friend Stories</h3>
                <StoriesBar 
                  currentUser={currentUser}
                  stories={stories}
                  allUsers={allUsers}
                  onOpenStory={setActiveStoryIndex}
                  onCreateStoryTrigger={() => setShowStoryCreator(true)}
                />
              </div>

              {/* Create Post Card */}
              <CreatePost 
                currentUser={currentUser}
                onPostCreated={handlePostCreated}
              />

              {/* Feed List of Posts */}
              <div className="space-y-5">
                {posts.length > 0 ? (
                  posts.map(post => (
                    <PostCard 
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onLikeToggle={handleLikeToggle}
                      onCommentAdded={handleCommentAdded}
                      onPostDeleted={handlePostDeleted}
                    />
                  ))
                ) : (
                  <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl space-y-3">
                    <Users className="h-8 w-8 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">Your Feed is completely empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Discover and follow people or create your very first post above!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Messages (Real-time Split Screen Chat) */}
          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Conversations Left Sidebar */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-4 md:col-span-1 flex flex-col h-[650px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Conversations</h3>
                
                <div className="space-y-2 flex-grow overflow-y-auto scrollbar-none">
                  {conversations.length > 0 ? (
                    conversations.map(conv => {
                      const other = conv.otherUser;
                      const isActive = activeConversation?.id === conv.id;
                      return (
                        <button
                          id={`conv-btn-${conv.id}`}
                          key={conv.id}
                          onClick={() => setActiveConversation(conv)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                            isActive 
                              ? 'bg-gradient-to-r from-sky-400/10 to-indigo-400/10 border-l-4 border-sky-400 text-sky-950 font-semibold shadow-2xs' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img 
                              src={other.avatar} 
                              alt={other.name} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            {other.onlineStatus && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div className="overflow-hidden flex-grow">
                            <p className="text-xs font-bold truncate text-slate-800">{other.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {conv.lastMessage ? conv.lastMessage.content : 'No messages yet.'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-1 my-auto">
                      <MessageSquare className="h-6 w-6 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">No active conversations</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        To chat, connect with people in the Discover tab first!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Box Right Panel */}
              <div className="md:col-span-2">
                {activeConversation ? (
                  <ChatBox 
                    conversation={activeConversation}
                    messages={messages}
                    currentUser={currentUser}
                    onSendMessage={handleSendMessage}
                  />
                ) : (
                  <div className="h-[650px] bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center p-6 shadow-2xs">
                    <div className="bg-slate-50 p-4 rounded-full border border-slate-100 text-slate-400 mb-3 animate-pulse">
                      <Lock className="h-7 w-7 text-sky-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Select active conversation</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                      Accept pending requests, or select any contact on the left to initiate real-time conversations securely.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Connections */}
          {activeTab === 'connections' && (
            <div className="space-y-6">
              
              {/* Connection Pending requests */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-500" />
                  Pending Connection Requests ({currentUser.pendingRequests ? currentUser.pendingRequests.length : 0})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentUser.pendingRequests && currentUser.pendingRequests.length > 0 ? (
                    currentUser.pendingRequests.map(req => {
                      const sender = allUsers.find(u => u.id === req.from);
                      if (!sender) return null;
                      return (
                        <div id={`pending-req-${req.from}`} key={req.from} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <img src={sender.avatar} alt={sender.name} className="w-9 h-9 rounded-full object-cover" />
                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{sender.name}</h4>
                              <p className="text-[10px] text-slate-400 truncate">@{sender.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              id={`btn-accept-conn-${req.from}`}
                              onClick={() => handleConnectResponse(req.from, 'accept')}
                              className="p-1.5 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-xl transition-all shadow-3xs"
                              title="Accept"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`btn-decline-conn-${req.from}`}
                              onClick={() => handleConnectResponse(req.from, 'decline')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl transition-all shadow-3xs"
                              title="Decline"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                      <p className="text-xs text-slate-400 font-medium italic">No pending requests at the moment.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Followers and Following lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Followers columns */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    My Connected Network ({currentUser.connections ? currentUser.connections.length : 0})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {currentUser.connections && currentUser.connections.length > 0 ? (
                      currentUser.connections.map(connId => {
                        const connUser = allUsers.find(u => u.id === connId);
                        if (!connUser) return null;
                        return (
                          <div id={`network-item-${connId}`} key={connId} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2.5">
                              <img src={connUser.avatar} alt={connUser.name} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{connUser.name}</h4>
                                <span className="text-[9px] text-slate-400 font-mono">@{connUser.username}</span>
                              </div>
                            </div>
                            <button
                              id={`btn-conn-chat-${connId}`}
                              onClick={() => {
                                // Find conversation
                                const sortedIds = [currentUser.id, connId].sort();
                                const convId = `conv_${sortedIds[0]}_${sortedIds[1]}`;
                                const convObj = conversations.find(c => c.id === convId);
                                if (convObj) {
                                  setActiveConversation(convObj);
                                  setActiveTab('messages');
                                }
                              }}
                              className="px-2.5 py-1 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                            >
                              Chat
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic">No connections yet. Send connect requests!</p>
                    )}
                  </div>
                </div>

                {/* Following list */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    People I Follow ({currentUser.following ? currentUser.following.length : 0})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {currentUser.following && currentUser.following.length > 0 ? (
                      currentUser.following.map(followId => {
                        const followUser = allUsers.find(u => u.id === followId);
                        if (!followUser) return null;
                        return (
                          <div id={`following-item-${followId}`} key={followId} className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2.5">
                              <img src={followUser.avatar} alt={followUser.name} className="w-8 h-8 rounded-full object-cover" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{followUser.name}</h4>
                                <span className="text-[9px] text-slate-400 font-mono">{followUser.location}</span>
                              </div>
                            </div>
                            <button
                              id={`btn-unfollow-${followId}`}
                              onClick={() => handleFollowToggle(followId)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Unfollow
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 italic">You aren't following anyone yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* AI-Powered connection Recommendation Engine container */}
              <div className="bg-gradient-to-r from-sky-950 to-indigo-950 border border-slate-800 rounded-3xl p-6 text-white space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-sky-400 animate-pulse" />
                    <h3 className="font-display font-bold text-base bg-gradient-to-r from-white to-sky-300 bg-clip-text text-transparent">
                      Gemini AI Connection Recommendations
                    </h3>
                  </div>
                  {isLoadingAiRecs && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiRecommendations.length > 0 ? (
                    aiRecommendations.map(rec => {
                      const userObj = allUsers.find(u => u.id === rec.userId);
                      if (!userObj) return null;
                      
                      // Check if already sent request
                      const requestSent = userObj.pendingRequests?.some(r => r.from === currentUser.id);

                      return (
                        <div id={`ai-rec-${rec.userId}`} key={rec.userId} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl hover:border-slate-700/80 transition-all space-y-3.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src={userObj.avatar} alt={userObj.name} className="w-10 h-10 rounded-full object-cover border border-slate-800" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-100">{userObj.name}</h4>
                                <p className="text-[10px] text-slate-400">{userObj.location}</p>
                              </div>
                            </div>
                            <div className="bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full text-sky-400 font-mono text-[9px] font-bold">
                              {rec.score}% match
                            </div>
                          </div>

                          <p className="text-[11px] leading-relaxed text-slate-300 italic bg-indigo-500/5 p-2.5 rounded-xl border border-indigo-500/10">
                            "{rec.matchReason}"
                          </p>

                          <div className="flex gap-2 justify-end">
                            <button
                              id={`btn-ai-follow-${rec.userId}`}
                              onClick={() => handleFollowToggle(rec.userId)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-colors"
                            >
                              {currentUser.following?.includes(rec.userId) ? 'Following' : 'Follow'}
                            </button>
                            <button
                              id={`btn-ai-connect-${rec.userId}`}
                              onClick={() => handleConnectRequest(rec.userId)}
                              disabled={requestSent}
                              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-slate-950 font-bold text-[10px] rounded-lg transition-colors"
                            >
                              {requestSent ? 'Requested' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 text-center py-6 text-slate-400">
                      <p className="text-xs">Gathering profile metadata...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Discover page */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              
              {/* Search Filtering box */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <input
                  id="discover-search-input"
                  type="text"
                  placeholder="Search PingUp members by Name, Email, Location or skill tags (e.g. React)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none text-xs text-slate-700 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Grid of Users Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const isFollowing = currentUser.following?.includes(user.id);
                    const isConnected = currentUser.connections?.includes(user.id);
                    
                    // Check if sent connection request
                    const requestSent = user.pendingRequests?.some(r => r.from === currentUser.id);

                    return (
                      <div id={`user-card-${user.id}`} key={user.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-2xs flex flex-col justify-between animate-fade-in text-center space-y-4">
                        <div className="space-y-2 flex flex-col items-center">
                          <div className="relative">
                            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-50 shadow-md" />
                            {user.onlineStatus && (
                              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 leading-tight">{user.name}</h4>
                            <p className="text-[10px] text-slate-400">@{user.username}</p>
                          </div>
                          <div className="flex items-center gap-1 justify-center text-slate-500">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-medium truncate max-w-[140px]">{user.location}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed px-1">
                          {user.bio}
                        </p>

                        <div className="flex flex-wrap gap-1 justify-center max-h-[44px] overflow-hidden">
                          {user.interests && user.interests.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-slate-50 text-[9px] text-slate-500 font-bold px-2 py-0.5 rounded-lg border border-slate-100">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Connection buttons */}
                        <div className="pt-2 border-t border-slate-50 flex gap-2 justify-center">
                          <button
                            id={`btn-discover-follow-${user.id}`}
                            onClick={() => handleFollowToggle(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                              isFollowing 
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>

                          {isConnected ? (
                            <button
                              id={`btn-discover-chat-${user.id}`}
                              onClick={() => {
                                // Go direct to chat!
                                const sortedIds = [currentUser.id, user.id].sort();
                                const convId = `conv_${sortedIds[0]}_${sortedIds[1]}`;
                                const convObj = conversations.find(c => c.id === convId);
                                if (convObj) {
                                  setActiveConversation(convObj);
                                  setActiveTab('messages');
                                }
                              }}
                              className="px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Message
                            </button>
                          ) : (
                            <button
                              id={`btn-discover-connect-${user.id}`}
                              onClick={() => handleConnectRequest(user.id)}
                              disabled={requestSent}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                requestSent 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : 'bg-sky-500 hover:bg-sky-600 text-slate-950'
                              }`}
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>{requestSent ? 'Requested' : 'Connect'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-100 space-y-2">
                    <p className="text-xs font-bold text-slate-500">No matching members found.</p>
                    <p className="text-[11px] text-slate-400">Try modifying spelling, tags, or cities.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-fade-in relative">
                {/* Cover Image Banner */}
                <div className="h-40 overflow-hidden bg-slate-100">
                  <img src={currentUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
                </div>

                {/* Avatar & Edit button details */}
                <div className="px-6 pb-6 relative">
                  <div className="flex justify-between items-end -mt-10 mb-4">
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md relative z-10" referrerPolicy="no-referrer" />
                    <button
                      id="btn-edit-profile-trigger"
                      onClick={() => setShowProfileEdit(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      Edit Profile
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">{currentUser.name}</h3>
                      <p className="text-xs text-slate-400">@{currentUser.username}</p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{currentUser.location || 'Remote'}</span>
                    </div>

                    <p className="text-sm leading-relaxed text-slate-700 max-w-xl">{currentUser.bio}</p>

                    {/* Interests tags list */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {currentUser.interests && currentUser.interests.map(item => (
                        <span key={item} className="bg-slate-50 text-slate-500 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-slate-100">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* My Created Posts */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">My Created Posts ({myPosts.length})</h3>
                
                <div className="space-y-5">
                  {myPosts.length > 0 ? (
                    myPosts.map(post => (
                      <PostCard 
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onLikeToggle={handleLikeToggle}
                        onCommentAdded={handleCommentAdded}
                        onPostDeleted={handlePostDeleted}
                      />
                    ))
                  ) : (
                    <div className="bg-white border border-slate-100 p-12 text-center rounded-3xl space-y-2">
                      <p className="text-xs font-bold text-slate-500">You haven't posted anything yet.</p>
                      <p className="text-[10px] text-slate-400">Create a caption story or a post from the feed tab!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* -------------------------------------------------------------
          Story Creator Drawer Overlay
          ------------------------------------------------------------- */}
      {showStoryCreator && (
        <div id="story-creator-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-sky-500" />
                Create Friend Story
              </h3>
              <button onClick={() => setShowStoryCreator(false)} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selector story types */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setNewStoryType('text')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${newStoryType === 'text' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Text Story
              </button>
              <button
                type="button"
                onClick={() => setNewStoryType('image')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${newStoryType === 'image' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Image Story
              </button>
            </div>

            {newStoryType === 'text' ? (
              // Text Story Config
              <div className="space-y-4">
                <div 
                  className="h-44 rounded-2xl flex items-center justify-center text-center p-6 relative border border-slate-100 shadow-inner"
                  style={{ background: newStoryBg }}
                >
                  <textarea
                    id="story-textarea"
                    placeholder="Type your story headline here..."
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="w-full text-center text-white bg-transparent focus:outline-none resize-none placeholder-white/60 font-semibold text-sm leading-relaxed"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-white/50 font-mono">
                    {100 - newStoryText.length} left
                  </span>
                </div>

                {/* Preset gradients */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Theme Backdrop</label>
                  <div className="flex gap-2">
                    {STORY_BG_PRESETS.map((bg, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setNewStoryBg(bg)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${newStoryBg === bg ? 'border-sky-500 scale-105' : 'border-transparent'}`}
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Image Story Config
              <div className="space-y-4">
                {newStoryImage ? (
                  <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
                    <img src={newStoryImage} alt="Story attached" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewStoryImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-slate-50 transition-colors">
                    <Plus className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-500">Attach story picture</span>
                    <span className="text-[10px] text-slate-400 mt-1">Accepts IANA standard jpeg/png files</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleStoryPhotoUpload} />
                  </label>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Short Overlay Caption (Optional)</label>
                  <input
                    id="story-caption-input"
                    type="text"
                    placeholder="e.g. Flight booked! 🛫"
                    value={newStoryText}
                    onChange={(e) => setNewStoryText(e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Publish Story Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowStoryCreator(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStoryPublish}
                disabled={isSubmittingStory || (newStoryType === 'text' && !newStoryText.trim()) || (newStoryType === 'image' && !newStoryImage)}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                {isSubmittingStory ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Publish Story</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          Story Viewer Full-screen Modal
          ------------------------------------------------------------- */}
      {activeStoryIndex !== null && (
        <StoryModal 
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}

      {/* -------------------------------------------------------------
          Profile Customizer Modal
          ------------------------------------------------------------- */}
      {showProfileEdit && (
        <ProfileEditModal 
          currentUser={currentUser}
          onClose={() => setShowProfileEdit(false)}
          onSave={handleProfileSave}
        />
      )}

    </div>
  );
}
