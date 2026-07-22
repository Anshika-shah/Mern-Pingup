import React, { useState } from 'react';
import { 
  Home, 
  MessageSquare, 
  Users, 
  Compass, 
  User, 
  Sparkles, 
  LogOut, 
  UserSquare2,
  ChevronUp
} from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  currentUser: UserType;
  allUsers: UserType[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchAccount: (userId: string) => void;
}

export default function Sidebar({ 
  currentUser, 
  allUsers, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onSwitchAccount 
}: SidebarProps) {
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const menuItems = [
    { id: 'feed', name: 'Feed', icon: Home },
    { id: 'messages', name: 'Messages', icon: MessageSquare, badge: 3 },
    { id: 'connections', name: 'Connections', icon: Users },
    { id: 'discover', name: 'Discover', icon: Compass },
    { id: 'profile', name: 'My Profile', icon: User },
  ];

  // We can switch to any default seeded profiles for rapid testing!
  const switchableUsers = allUsers.filter(u => u.id !== currentUser.id);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900 border-r border-slate-800 text-white fixed left-0 top-0 p-5 justify-between z-30">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="bg-gradient-to-tr from-sky-400 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-sky-500/20">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                PingUp
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">AI Social Space</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-${item.id}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                    isActive 
                      ? 'bg-gradient-to-r from-sky-500/15 to-indigo-500/15 text-sky-400 font-medium border-l-4 border-sky-400' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`h-5 w-5 transition-transform group-hover:scale-105 ${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="font-sans text-[15px]">{item.name}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] text-white font-bold px-2 py-0.5 rounded-full shadow-md shadow-rose-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Session Switcher */}
        <div className="relative">
          {showAccountSwitcher && (
            <div className="absolute bottom-full left-0 w-full mb-3 bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-2xl animate-fade-in z-50">
              <p className="text-xs text-slate-400 font-medium mb-2 px-2">Switch User Account</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {switchableUsers.map(user => (
                  <button
                    id={`switch-to-${user.id}`}
                    key={user.id}
                    onClick={() => {
                      onSwitchAccount(user.id);
                      setShowAccountSwitcher(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 hover:bg-slate-800 rounded-lg text-left transition-colors"
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-100 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-800/80 mt-2 pt-2">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out Account
                </button>
              </div>
            </div>
          )}

          {/* Current Profile Card */}
          <div className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800/80 rounded-2xl">
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity overflow-hidden"
            >
              <div className="relative">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-10 h-10 rounded-full object-cover border border-sky-400"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">{currentUser.name}</p>
                <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
              </div>
            </button>
            <button 
              id="switch-account-trigger"
              onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Switch session account"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom/Top Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around py-2.5 px-2 text-slate-400 z-40 shadow-xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`nav-mobile-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 relative ${isActive ? 'text-sky-400' : 'hover:text-white'}`}
            >
              <Icon className="h-5.5 w-5.5" />
              <span className="text-[10px] font-medium">{item.name === 'My Profile' ? 'Profile' : item.name}</span>
              {item.badge && !isActive && (
                <span className="absolute -top-1 right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-[8px] text-white font-bold px-1.5 py-0.2 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        {/* Mobile logout/switcher trigger */}
        <button
          id="nav-mobile-logout"
          onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-400 relative"
        >
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-5.5 h-5.5 rounded-full object-cover border border-slate-700"
            referrerPolicy="no-referrer"
          />
          <span className="text-[10px] font-medium">Account</span>
        </button>

        {/* Mobile Account Switcher Overlaid Popup */}
        {showAccountSwitcher && (
          <div className="fixed bottom-16 right-4 left-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl animate-fade-in z-50">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-slate-100">Switch Session Account</p>
              <button 
                onClick={() => setShowAccountSwitcher(false)} 
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
              {switchableUsers.map(user => (
                <button
                  id={`switch-to-mobile-${user.id}`}
                  key={user.id}
                  onClick={() => {
                    onSwitchAccount(user.id);
                    setShowAccountSwitcher(false);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-800 rounded-xl text-left transition-colors"
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign Out Account
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
