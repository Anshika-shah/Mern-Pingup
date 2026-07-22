export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  coverImage: string;
  bio: string;
  location: string;
  interests: string[];
  connections: string[]; // Connected user IDs
  pendingRequests: {
    from: string; // User ID who sent the request
    to: string;   // User ID who receives the request
    status: 'pending' | 'accepted' | 'declined';
  }[];
  following: string[]; // List of followed user IDs
  onlineStatus: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  isToxic?: boolean;
  toxicityReason?: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  imageUrls: string[];
  likes: string[]; // User IDs who liked this post
  comments: Comment[];
  createdAt: string;
  isToxic?: boolean;
  toxicityReason?: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image' | 'video';
  content: string; // Post text or bg gradient preset
  mediaUrl?: string; // Optional image/video base64 or URL
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  aiSuggestedReplies?: string[]; // Quick action replies computed by Gemini
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount?: { [userId: string]: number };
}
