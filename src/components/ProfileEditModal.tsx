import React, { useState } from 'react';
import { X, Sparkles, Plus, Loader2 } from 'lucide-react';
import { User } from '../types';

interface ProfileEditModalProps {
  currentUser: User;
  onClose: () => void;
  onSave: (updatedFields: Partial<User>) => void;
}

export default function ProfileEditModal({ currentUser, onClose, onSave }: ProfileEditModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [location, setLocation] = useState(currentUser.location);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [coverImage, setCoverImage] = useState(currentUser.coverImage);
  const [interests, setInterests] = useState<string[]>(currentUser.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Suggested preset background styles for instant cover switches
  const PRESET_COVERS = [
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  ];

  // Suggested preset avatars
  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200'
  ];

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter(i => i !== item));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        name,
        username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
        bio,
        location,
        avatar,
        coverImage,
        interests
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Base64 loader for profile pictures
  const handlePhotoLoad = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'avatar') setAvatar(reader.result);
          if (type === 'cover') setCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white border border-slate-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col justify-between">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            Customize Premium Profile
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Scrolling Area */}
        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-5">
          
          {/* Cover Photo Customizer */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cover Banner photo</label>
            <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-3xs bg-slate-50 group">
              <img src={coverImage} alt="Banner" className="w-full h-full object-cover" />
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span>Upload Custom Banner</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoLoad(e, 'cover')} />
              </label>
            </div>
            
            {/* Cover Presets */}
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-slate-400 font-medium">Or presets:</span>
              {PRESET_COVERS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCoverImage(url)}
                  className="w-12 h-6 rounded-lg overflow-hidden border border-slate-200 transition-transform hover:scale-105"
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Avatar and Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Avatar Section */}
            <div className="space-y-2 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Profile Avatar</label>
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md group">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center">
                  <span>Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoLoad(e, 'avatar')} />
                </label>
              </div>

              {/* Avatar presets */}
              <div className="flex gap-1.5 mt-2.5 justify-center">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setAvatar(url)}
                    className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 hover:scale-110 transition-transform"
                  >
                    <img src={url} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* General Info input fields */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Bio input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl resize-none"
            />
          </div>

          {/* Interests inputs */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interests & Specializations</label>
            <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl min-h-[50px]">
              {interests.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 pl-2.5 pr-1.5 py-1 rounded-lg text-[10px] font-bold shadow-3xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 cursor-pointer transition-colors"
                  onClick={() => handleRemoveInterest(item)}
                  title="Click to remove"
                >
                  <span>{item}</span>
                  <span className="text-[9px] font-light text-slate-400">×</span>
                </span>
              ))}
              {interests.length === 0 && (
                <span className="text-[10px] text-slate-400 font-medium italic">No interests declared yet.</span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill tag, e.g. React, UI Design, Rust"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                className="flex-grow text-xs text-slate-700 border border-slate-200 focus:outline-none focus:border-sky-400 bg-white px-3 py-2 rounded-xl"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all flex items-center justify-center"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
