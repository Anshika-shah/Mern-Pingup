import React from 'react';
import { Plus } from 'lucide-react';
import { Story, User } from '../types';

interface StoriesBarProps {
  currentUser: User;
  stories: Story[];
  allUsers: User[];
  onOpenStory: (storyIndex: number) => void;
  onCreateStoryTrigger: () => void;
}

export default function StoriesBar({ 
  currentUser, 
  stories, 
  allUsers, 
  onOpenStory, 
  onCreateStoryTrigger 
}: StoriesBarProps) {
  
  // Group stories by user so that clicking a circle views that user's chain
  const groupedStories: { [userId: string]: Story[] } = {};
  stories.forEach(story => {
    if (!groupedStories[story.userId]) {
      groupedStories[story.userId] = [];
    }
    groupedStories[story.userId].push(story);
  });

  const uniqueUserIds = Object.keys(groupedStories);

  return (
    <div className="flex items-center gap-4 py-4 px-1 overflow-x-auto scrollbar-none select-none">
      {/* Add Story Button */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group" onClick={onCreateStoryTrigger}>
        <div className="relative">
          <img 
            src={currentUser.avatar} 
            alt="My Avatar" 
            className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-md group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 p-1.5 rounded-full text-white shadow-md border-2 border-white flex items-center justify-center transition-all group-hover:scale-110">
            <Plus className="h-4 w-4 stroke-[3]" />
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium group-hover:text-slate-800 transition-colors">My Story</span>
      </div>

      {/* List of Active Stories */}
      {uniqueUserIds.map((userId) => {
        const userStories = groupedStories[userId];
        const firstStory = userStories[0];
        const userObj = allUsers.find(u => u.id === userId);
        const avatar = userObj?.avatar || firstStory.userAvatar;
        const name = userObj?.name || firstStory.userName;

        return (
          <div 
            id={`story-circle-${userId}`}
            key={userId}
            onClick={() => {
              // Find the index of this user's first story in the master stories array
              const masterIndex = stories.findIndex(s => s.id === firstStory.id);
              if (masterIndex !== -1) {
                onOpenStory(masterIndex);
              }
            }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-sky-400 via-pink-500 to-indigo-500 animate-gradient hover:scale-105 transition-transform shadow-md">
              <div className="bg-white p-[2px] rounded-full">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-14 h-14 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold text-[8px] flex items-center justify-center rounded-full border border-white">
                {userStories.length}
              </span>
            </div>
            <span className="text-xs text-slate-600 max-w-[70px] truncate font-medium group-hover:text-slate-900 transition-colors">
              {name.split(' ')[0]}
            </span>
          </div>
        );
      })}

      {stories.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 flex-grow text-center justify-center">
          <p className="text-xs text-slate-400 font-medium italic">No friends stories yet. Create yours!</p>
        </div>
      )}
    </div>
  );
}
