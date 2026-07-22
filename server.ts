import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { User, Post, Comment, Story, Message, Conversation } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  console.log('Gemini GenAI initialized successfully.');
} else {
  console.warn('GEMINI_API_KEY is missing! AI-powered features will fall back to smart local algorithms.');
}

// -------------------------------------------------------------
// Database & Persistence Layer
// -------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Database {
  users: User[];
  posts: Post[];
  stories: Story[];
  messages: Message[];
  conversations: Conversation[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_1',
    username: 'anshikashah',
    name: 'Anshika Shah',
    email: 'anshika2004shah@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800',
    bio: 'CS Student & Tech Enthusiast | Building awesome web apps in React & Express! Let\'s connect and create.',
    location: 'Mumbai, India',
    interests: ['React', 'TypeScript', 'Web Dev', 'AI', 'UI Design'],
    connections: ['user_2', 'user_3'],
    pendingRequests: [],
    following: ['user_2', 'user_3', 'user_5'],
    onlineStatus: true
  },
  {
    id: 'user_2',
    username: 'alexrivera',
    name: 'Alex Rivera',
    email: 'alex.rivera@dev.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    bio: 'Software Engineer @ Google | Love talking about rust, next-gen databases, and photography. Weekend mountaineer!',
    location: 'San Francisco, USA',
    interests: ['Rust', 'Distributed Systems', 'Cloud Native', 'Hiking', 'Photography'],
    connections: ['user_1', 'user_4'],
    pendingRequests: [],
    following: ['user_1', 'user_4'],
    onlineStatus: true
  },
  {
    id: 'user_3',
    username: 'priyanair',
    name: 'Priya Nair',
    email: 'priya.nair@design.co',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=800',
    bio: 'Lead Product Designer | Creating delightful experiences. Sketching, typography geek, and flat white lover.',
    location: 'Bengaluru, India',
    interests: ['Figma', 'UI/UX', 'Illustration', 'Typography', 'Coffee'],
    connections: ['user_1'],
    pendingRequests: [],
    following: ['user_1', 'user_4'],
    onlineStatus: false
  },
  {
    id: 'user_4',
    username: 'lucasdurand',
    name: 'Lucas Durand',
    email: 'lucas.durand@creative.org',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800',
    bio: 'Travel Photographer & Filmmaker. Capturing stories of remote places and unique communities around the globe.',
    location: 'Paris, France',
    interests: ['Photography', 'Filmmaking', 'Travel', 'Adventure', 'Vlog'],
    connections: ['user_2'],
    pendingRequests: [
      { from: 'user_4', to: 'user_1', status: 'pending' }
    ],
    following: ['user_2'],
    onlineStatus: true
  },
  {
    id: 'user_5',
    username: 'sophiam',
    name: 'Sophia Martinez',
    email: 'sophia.m@nature.net',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800',
    bio: 'Botanist & Nature Conservator | Sharing the beautiful mysteries of plants and trail guides.',
    location: 'Denver, USA',
    interests: ['Botany', 'Conservation', 'Hiking', 'Gardening', 'Outdoors'],
    connections: [],
    pendingRequests: [],
    following: [],
    onlineStatus: false
  }
];

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post_1',
    userId: 'user_2',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    content: 'Just deployed our new high-throughput event processing pipeline written entirely in Rust! Latency reduced by 42%. Absolutely mind-blown by the performance compile-time safety brings. Check out the setup below 🚀',
    imageUrls: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800'],
    likes: ['user_1', 'user_3'],
    comments: [
      {
        id: 'comment_1_1',
        userId: 'user_1',
        userName: 'Anshika Shah',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
        content: 'This looks incredibly cool Alex! Rust is definitely on my list to learn next.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'comment_1_2',
        userId: 'user_3',
        userName: 'Priya Nair',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
        content: 'Is there a github repo or open source blog post detailing the architecture?',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'post_2',
    userId: 'user_3',
    userName: 'Priya Nair',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    content: 'Spending my Sunday morning wireframing a new wellness app concept. Love utilizing generous negative space and soft, earthy color palettes to instill a feeling of calmness. What do you think about this login interface? 🌸🎨',
    imageUrls: ['https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800'],
    likes: ['user_1', 'user_2'],
    comments: [
      {
        id: 'comment_2_1',
        userId: 'user_1',
        userName: 'Anshika Shah',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
        content: 'Beautifully minimal! The soft typography is so premium.',
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'post_3',
    userId: 'user_4',
    userName: 'Lucas Durand',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    content: 'Golden Hour at the French Alps. After hours of climbing, the clouds parted right at sunset to reveal this magnificent peak. Moments like these make all the heavy gear worth carrying. 🏔️✨',
    imageUrls: ['https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&q=80&w=800'],
    likes: ['user_2'],
    comments: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const DEFAULT_STORIES: Story[] = [
  {
    id: 'story_1',
    userId: 'user_2',
    userName: 'Alex Rivera',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'text',
    content: 'linear-gradient(135deg, #13b5e4 0%, #4a56e2 100%)||Keyboard clicks and hot black coffee. Ready to debug!',
    createdAt: new Date().toISOString()
  },
  {
    id: 'story_2',
    userId: 'user_3',
    userName: 'Priya Nair',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'image',
    content: 'Designing new brand icons!',
    mediaUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  },
  {
    id: 'story_3',
    userId: 'user_4',
    userName: 'Lucas Durand',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'image',
    content: 'En route to the next peak 🚠',
    mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1_2',
    senderId: 'user_2',
    receiverId: 'user_1',
    content: 'Hi Anshika! Saw your comment on my Rust post. Glad you liked it!',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1_2',
    senderId: 'user_1',
    receiverId: 'user_2',
    content: 'Hey Alex! Yes, it genuinely looks amazing. I am a CS student and we do standard systems coding, but Rust seems so modern. Where is a good place to start?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1_2',
    senderId: 'user_2',
    receiverId: 'user_1',
    content: 'I highly recommend starting with "The Book" (The Rust Programming Language guide). It is completely free and walks through ownership and borrowing wonderfully!',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    aiSuggestedReplies: [
      'Awesome! I will check "The Book" out today.',
      'Thanks! Do you have any favorite video tutorials too?',
      'Ownership seems tricky, is it hard to learn?'
    ]
  },
  {
    id: 'msg_4',
    conversationId: 'conv_1_3',
    senderId: 'user_3',
    receiverId: 'user_1',
    content: 'Hey Anshika! Let me know if you would like to collaborate on the designs for our next college hackathon project!',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'msg_5',
    conversationId: 'conv_1_3',
    senderId: 'user_1',
    receiverId: 'user_3',
    content: 'Oh that would be absolutely incredible Priya! I am working on a social app concept right now actually.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    aiSuggestedReplies: [
      'Can I share the wireframes with you?',
      'Let\'s hop on a call this evening!',
      'That sounds like a plan.'
    ]
  }
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1_2',
    participants: ['user_1', 'user_2'],
    lastMessage: DEFAULT_MESSAGES[2],
    unreadCount: { 'user_1': 0, 'user_2': 0 }
  },
  {
    id: 'conv_1_3',
    participants: ['user_1', 'user_3'],
    lastMessage: DEFAULT_MESSAGES[4],
    unreadCount: { 'user_1': 0, 'user_3': 0 }
  }
];

// Helper to load DB
function loadDB(): Database {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const db: Database = {
        users: DEFAULT_USERS,
        posts: DEFAULT_POSTS,
        stories: DEFAULT_STORIES,
        messages: DEFAULT_MESSAGES,
        conversations: DEFAULT_CONVERSATIONS
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return {
      users: DEFAULT_USERS,
      posts: DEFAULT_POSTS,
      stories: DEFAULT_STORIES,
      messages: DEFAULT_MESSAGES,
      conversations: DEFAULT_CONVERSATIONS
    };
  }
}

// Helper to save DB
function saveDB(db: Database) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Helper middleware to get Mock logged in User ID from X-User-Id header
const getCurrentUserId = (req: Request): string => {
  return (req.headers['x-user-id'] as string) || 'user_1';
};

// 1. Authentication APIs
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;
  const db = loadDB();
  
  // Find user by username or email
  const user = db.users.find(
    u => u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
         u.email.toLowerCase() === usernameOrEmail.toLowerCase()
  );

  if (user) {
    user.onlineStatus = true;
    saveDB(db);
    return res.json({ success: true, user });
  }

  // Fallback / Auto-register to make the app incredibly seamless to test!
  const isEmail = usernameOrEmail.includes('@');
  const generatedUsername = isEmail ? usernameOrEmail.split('@')[0] : usernameOrEmail;
  const newUser: User = {
    id: 'user_' + Date.now(),
    username: generatedUsername.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: generatedUsername.charAt(0).toUpperCase() + generatedUsername.slice(1),
    email: isEmail ? usernameOrEmail : `${generatedUsername}@pingup.com`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    bio: 'Proud member of PingUp! Excited to connect with creative developers and thinkers here.',
    location: 'World Citizen',
    interests: ['PingUp', 'Networking', 'AI'],
    connections: [],
    pendingRequests: [],
    following: ['user_1', 'user_2'],
    onlineStatus: true
  };

  db.users.push(newUser);
  saveDB(db);
  res.json({ success: true, user: newUser, isNew: true });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, name, email, avatar, bio, location, interests } = req.body;
  const db = loadDB();

  const existing = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const newUser: User = {
    id: 'user_' + Date.now(),
    username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: name || username,
    email,
    avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    bio: bio || 'Hello, I just joined PingUp!',
    location: location || 'Remote',
    interests: interests || [],
    connections: [],
    pendingRequests: [],
    following: ['user_1', 'user_2'], // Auto follow default influencers!
    onlineStatus: true
  };

  db.users.push(newUser);
  saveDB(db);
  res.json({ success: true, user: newUser });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getCurrentUserId(req);
  const db = loadDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// 2. Discover Users / Suggestions
app.get('/api/users', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const db = loadDB();
  // Return all users except currently logged in user
  const otherUsers = db.users.filter(u => u.id !== currentUserId);
  res.json(otherUsers);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = loadDB();
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users/profile/update', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { name, bio, location, interests, avatar, coverImage, username } = req.body;
  const db = loadDB();

  const userIdx = db.users.findIndex(u => u.id === currentUserId);
  if (userIdx === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update fields
  if (name !== undefined) db.users[userIdx].name = name;
  if (bio !== undefined) db.users[userIdx].bio = bio;
  if (location !== undefined) db.users[userIdx].location = location;
  if (interests !== undefined) db.users[userIdx].interests = interests;
  if (avatar !== undefined) db.users[userIdx].avatar = avatar;
  if (coverImage !== undefined) db.users[userIdx].coverImage = coverImage;
  if (username !== undefined) db.users[userIdx].username = username;

  saveDB(db);
  res.json({ success: true, user: db.users[userIdx] });
});

// 3. Connections (Connect, Pending, Follows)
app.post('/api/connections/request', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { targetUserId } = req.body;
  const db = loadDB();

  const fromUser = db.users.find(u => u.id === currentUserId);
  const toUser = db.users.find(u => u.id === targetUserId);

  if (!fromUser || !toUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if connection already exists
  if (fromUser.connections.includes(targetUserId)) {
    return res.status(400).json({ error: 'Already connected' });
  }

  // Check if request is already pending
  const existingRequest = toUser.pendingRequests.find(r => r.from === currentUserId && r.status === 'pending');
  if (existingRequest) {
    return res.status(400).json({ error: 'Request already pending' });
  }

  // Add pending request to target user
  toUser.pendingRequests.push({
    from: currentUserId,
    to: targetUserId,
    status: 'pending'
  });

  saveDB(db);
  res.json({ success: true, targetUser: toUser });
});

app.post('/api/connections/respond', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { fromUserId, action } = req.body; // action: 'accept' | 'decline'
  const db = loadDB();

  const currentUser = db.users.find(u => u.id === currentUserId);
  const fromUser = db.users.find(u => u.id === fromUserId);

  if (!currentUser || !fromUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Find index of pending request
  const reqIdx = currentUser.pendingRequests.findIndex(r => r.from === fromUserId && r.status === 'pending');
  if (reqIdx === -1) {
    return res.status(400).json({ error: 'No pending request found' });
  }

  if (action === 'accept') {
    currentUser.pendingRequests[reqIdx].status = 'accepted';
    
    // Add to each other's connections lists
    if (!currentUser.connections.includes(fromUserId)) {
      currentUser.connections.push(fromUserId);
    }
    if (!fromUser.connections.includes(currentUserId)) {
      fromUser.connections.push(currentUserId);
    }

    // Auto follow each other upon connection!
    if (!currentUser.following.includes(fromUserId)) {
      currentUser.following.push(fromUserId);
    }
    if (!fromUser.following.includes(currentUserId)) {
      fromUser.following.push(currentUserId);
    }

    // Initialize clean conversation
    const sortedIds = [currentUserId, fromUserId].sort();
    const convId = `conv_${sortedIds[0]}_${sortedIds[1]}`;
    const existingConv = db.conversations.find(c => c.id === convId);
    if (!existingConv) {
      db.conversations.push({
        id: convId,
        participants: [currentUserId, fromUserId],
        unreadCount: { [currentUserId]: 0, [fromUserId]: 0 }
      });
    }
  } else {
    currentUser.pendingRequests[reqIdx].status = 'declined';
  }

  // Clear accepted/declined requests to keep database clean
  currentUser.pendingRequests = currentUser.pendingRequests.filter(r => r.status === 'pending');

  saveDB(db);
  res.json({ success: true, user: currentUser });
});

app.post('/api/connections/follow', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { targetUserId } = req.body;
  const db = loadDB();

  const user = db.users.find(u => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const followIdx = user.following.indexOf(targetUserId);
  let following = false;
  if (followIdx === -1) {
    user.following.push(targetUserId);
    following = true;
  } else {
    user.following.splice(followIdx, 1);
    following = false;
  }

  saveDB(db);
  res.json({ success: true, following, user });
});

// 4. Posts, Likes, Comments
app.get('/api/posts', (req: Request, res: Response) => {
  const db = loadDB();
  // Return all posts sorted by newest
  const sortedPosts = [...db.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sortedPosts);
});

app.post('/api/posts/create', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { content, imageUrls, isToxic, toxicityReason } = req.body;
  const db = loadDB();

  const user = db.users.find(u => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newPost: Post = {
    id: 'post_' + Date.now(),
    userId: currentUserId,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    imageUrls: imageUrls || [],
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
    isToxic,
    toxicityReason
  };

  db.posts.push(newPost);
  saveDB(db);
  res.json({ success: true, post: newPost });
});

app.post('/api/posts/:id/like', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { id } = req.params;
  const db = loadDB();

  const post = db.posts.find(p => p.id === id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const likeIdx = post.likes.indexOf(currentUserId);
  let liked = false;
  if (likeIdx === -1) {
    post.likes.push(currentUserId);
    liked = true;
  } else {
    post.likes.splice(likeIdx, 1);
    liked = false;
  }

  saveDB(db);
  res.json({ success: true, liked, likesCount: post.likes.length, likes: post.likes });
});

app.post('/api/posts/:id/comment', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { id } = req.params;
  const { content, isToxic, toxicityReason } = req.body;
  const db = loadDB();

  const post = db.posts.find(p => p.id === id);
  const user = db.users.find(u => u.id === currentUserId);

  if (!post || !user) {
    return res.status(404).json({ error: 'Post or User not found' });
  }

  const newComment: Comment = {
    id: 'comment_' + Date.now(),
    userId: currentUserId,
    userName: user.name,
    userAvatar: user.avatar,
    content,
    createdAt: new Date().toISOString(),
    isToxic,
    toxicityReason
  };

  post.comments.push(newComment);
  saveDB(db);
  res.json({ success: true, comment: newComment, comments: post.comments });
});

app.delete('/api/posts/:id', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { id } = req.params;
  const db = loadDB();

  const postIdx = db.posts.findIndex(p => p.id === id);
  if (postIdx === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // Only allow deleting own posts
  if (db.posts[postIdx].userId !== currentUserId) {
    return res.status(403).json({ error: 'Unauthorized to delete this post' });
  }

  db.posts.splice(postIdx, 1);
  saveDB(db);
  res.json({ success: true });
});

// 5. Stories
app.get('/api/stories', (req: Request, res: Response) => {
  const db = loadDB();
  
  // Filter stories that are newer than 24 hours
  const twentyFourHoursAgo = Date.now() - 24 * 3600 * 1000;
  const activeStories = db.stories.filter(s => new Date(s.createdAt).getTime() > twentyFourHoursAgo);
  
  res.json(activeStories);
});

app.post('/api/stories/create', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { type, content, mediaUrl } = req.body; // type: 'text' | 'image'
  const db = loadDB();

  const user = db.users.find(u => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newStory: Story = {
    id: 'story_' + Date.now(),
    userId: currentUserId,
    userName: user.name,
    userAvatar: user.avatar,
    type,
    content: content || '',
    mediaUrl,
    createdAt: new Date().toISOString()
  };

  db.stories.push(newStory);
  saveDB(db);
  res.json({ success: true, story: newStory });
});

// 6. Direct Messaging (Chat)
app.get('/api/messages/conversations', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const db = loadDB();

  // Find all conversations featuring current user
  const convs = db.conversations.filter(c => c.participants.includes(currentUserId));
  
  // Populate participants profiles
  const populatedConvs = convs.map(c => {
    const otherParticipantId = c.participants.find(p => p !== currentUserId);
    const otherUser = db.users.find(u => u.id === otherParticipantId);
    return {
      ...c,
      otherUser: otherUser || {
        id: otherParticipantId,
        name: 'PingUp Member',
        username: 'pingup_member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
        onlineStatus: false
      }
    };
  });

  res.json(populatedConvs);
});

app.get('/api/messages/:conversationId', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const db = loadDB();

  const msgs = db.messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json(msgs);
});

app.post('/api/messages/send', (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const { conversationId, receiverId, content, mediaUrl } = req.body;
  const db = loadDB();

  const newMessage: Message = {
    id: 'msg_' + Date.now(),
    conversationId,
    senderId: currentUserId,
    receiverId,
    content,
    mediaUrl,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);

  // Update conversation last message
  const convIdx = db.conversations.findIndex(c => c.id === conversationId);
  if (convIdx !== -1) {
    db.conversations[convIdx].lastMessage = newMessage;
  } else {
    // Dynamically insert missing conversation record
    db.conversations.push({
      id: conversationId,
      participants: [currentUserId, receiverId],
      lastMessage: newMessage,
      unreadCount: { [currentUserId]: 0, [receiverId]: 1 }
    });
  }

  saveDB(db);
  res.json({ success: true, message: newMessage });
});

// -------------------------------------------------------------
// Gemini AI integrations
// -------------------------------------------------------------

// End point: AI Caption Generator
app.post('/api/gemini/generate-caption', async (req: Request, res: Response) => {
  const { keywords, mood, imageBase64 } = req.body;

  if (!ai) {
    return res.json({
      caption: `🚀 Exploring the boundaries of creative technology! Feeling completely ${mood || 'inspired'} as I dive deep into these keywords: ${keywords || 'Coding, PingUp social networking, UI Design'}. #TechFuture #BuildWithPingUp`
    });
  }

  try {
    let response;
    const prompt = `Write a creative, catchy, and trendy social media caption for a platform called PingUp (like Instagram/LinkedIn mix).
    Keywords to include/theme: ${keywords || 'coding life, social networking, premium design'}.
    Desired tone/mood: ${mood || 'inspiring'}.
    Keep it modern, concise, use emojis and appropriate hashtags, and do not put quotation marks around the final caption.`;

    if (imageBase64) {
      // Multimodal generation with starting image
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          prompt + ' Use visual cues from the attached image to write the perfect relevant caption.'
        ]
      });
    } else {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });
    }

    const caption = response.text ? response.text.trim() : 'Fascinating thoughts on tech & design! 🚀';
    res.json({ caption });
  } catch (error: any) {
    console.error('Gemini generate-caption error:', error);
    res.json({
      caption: `💻 Coffee, coding, and continuous improvement! Feeling highly ${mood || 'creative'} with ${keywords || 'this setup'}. #DeveloperLife #PingUp`
    });
  }
});

// End point: AI Toxicity Checker / Content Moderation
app.post('/api/gemini/moderate', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.json({ safe: true });
  }

  if (!ai) {
    // Smart local checks as robust fallback
    const toxicWords = ['hate', 'kill', 'toxic', 'idiot', 'stupid', 'abuse', 'harass', 'spam', 'trash'];
    const hasToxic = toxicWords.some(word => text.toLowerCase().includes(word));
    if (hasToxic) {
      return res.json({
        safe: false,
        reason: 'Flagged by localized filter due to potentially hostile or inflammatory vocabulary.'
      });
    }
    return res.json({ safe: true });
  }

  try {
    const prompt = `You are a strict, smart social media community manager for PingUp.
    Analyze the following post/comment text for toxicity, harassment, hate speech, explicit content, or extreme abuse.
    Respond in STRICT JSON format matching this schema:
    {
      "safe": boolean,
      "reason": "short explanation of why it was flagged, or empty string if safe"
    }
    Text to evaluate: "${text.replace(/"/g, '\\"')}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ['safe', 'reason']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"safe":true,"reason":""}');
    res.json(parsed);
  } catch (error) {
    console.error('Gemini content moderation error:', error);
    res.json({ safe: true });
  }
});

// End point: AI Profile / Connections Recommendation Engine
app.post('/api/gemini/recommend-connections', async (req: Request, res: Response) => {
  const currentUserId = getCurrentUserId(req);
  const db = loadDB();

  const currentUser = db.users.find(u => u.id === currentUserId);
  if (!currentUser) {
    return res.json({ recommendations: [] });
  }

  // Get other users who are NOT connected already
  const candidates = db.users.filter(u => u.id !== currentUserId && !currentUser.connections.includes(u.id));

  if (candidates.length === 0) {
    return res.json({ recommendations: [] });
  }

  if (!ai) {
    // Fallback logic: Match mutual interests
    const matches = candidates.map(c => {
      const mutual = c.interests.filter(i => currentUser.interests.includes(i));
      return {
        userId: c.id,
        score: mutual.length,
        matchReason: mutual.length > 0 
          ? `You both share interests in: ${mutual.slice(0, 2).join(', ')}.`
          : `Connect with fellow members in ${c.location}!`
      };
    }).sort((a, b) => b.score - a.score);

    return res.json({ recommendations: matches });
  }

  try {
    const candidatesDetails = candidates.map(c => ({
      id: c.id,
      name: c.name,
      bio: c.bio,
      location: c.location,
      interests: c.interests
    }));

    const prompt = `Match the current user to the best candidates for professional and social connection.
    Current User details:
    - Name: ${currentUser.name}
    - Bio: ${currentUser.bio}
    - Location: ${currentUser.location}
    - Interests: ${currentUser.interests.join(', ')}

    Candidates to evaluate:
    ${JSON.stringify(candidatesDetails, null, 2)}

    Output STRICT JSON matching this schema:
    [
      {
        "userId": "string",
        "score": number, // out of 100 representing compatibility
        "matchReason": "witty, personalized sentence explaining why they should connect"
      }
    ]
    Order from highest score to lowest.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              userId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              matchReason: { type: Type.STRING }
            },
            required: ['userId', 'score', 'matchReason']
          }
        }
      }
    });

    const recommendations = JSON.parse(response.text || '[]');
    res.json({ recommendations });
  } catch (error) {
    console.error('Gemini connection recommendations error:', error);
    // Simple local fallback on exception
    const matches = candidates.map(c => ({
      userId: c.id,
      score: 80,
      matchReason: `Both are interested in tech and active in ${c.location}.`
    }));
    res.json({ recommendations: matches });
  }
});

// End point: AI Smart Reply Suggestions
app.post('/api/gemini/smart-suggestions', async (req: Request, res: Response) => {
  const { conversationHistory, lastMessageContent } = req.body;

  if (!lastMessageContent) {
    return res.json({ suggestions: ['Hey there!', 'How\'s it going?', 'How was your weekend?'] });
  }

  if (!ai) {
    // Smart algorithmic preset replies
    const msg = lastMessageContent.toLowerCase();
    if (msg.includes('rust') || msg.includes('code') || msg.includes('book')) {
      return res.json({
        suggestions: [
          'Wow! I\'ll check "The Book" out today.',
          'Awesome, thanks for the resource!',
          'Ownership sounds tricky but super safe.'
        ]
      });
    }
    if (msg.includes('design') || msg.includes('figma') || msg.includes('ui')) {
      return res.json({
        suggestions: [
          'I\'d love to see the Figma file!',
          'Let\'s pair-design this week.',
          'The layout feels incredibly premium.'
        ]
      });
    }
    if (msg.includes('climb') || msg.includes('mountain') || msg.includes('travel')) {
      return res.json({
        suggestions: [
          'What camera gear did you carry up?',
          'That view looks unreal!',
          'Where is your next trek?'
        ]
      });
    }
    return res.json({
      suggestions: [
        'That sounds like a plan!',
        'Thanks for sharing!',
        'Let\'s touch base on this soon.'
      ]
    });
  }

  try {
    const prompt = `Generate 3 natural, highly contextual, short quick-reply suggestions for the current user.
    Context (last message received): "${lastMessageContent}"
    Keep them conversational, short (under 7 words), and diverse in intent (e.g. one agreement, one query, one curious expansion).
    Output STRICT JSON matching this schema:
    {
      "suggestions": ["string", "string", "string"]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['suggestions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"suggestions":["Nice!","Tell me more.","That sounds great!"]}');
    res.json(parsed);
  } catch (error) {
    console.error('Gemini smart suggestions error:', error);
    res.json({
      suggestions: ['That sounds awesome!', 'Awesome, thanks!', 'Let\'s catch up later.']
    });
  }
});

// -------------------------------------------------------------
// Vite or Production Fallback Static Servers
// -------------------------------------------------------------
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static build serving from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PingUp Server booted successfully. Accessible at http://localhost:${PORT}`);
  });
}

bootstrap();
