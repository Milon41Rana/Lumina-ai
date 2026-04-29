import React, { useState } from 'react';
import { UserProfile as UserProfileType } from '../types';
import { User, Mail, FileText, Save, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  profile: UserProfileType | null;
  onUpdate: (profile: UserProfileType) => void;
}

export function UserProfile({ profile, onUpdate }: Props) {
  const [formData, setFormData] = useState<UserProfileType>(profile || {
    name: '',
    email: '',
    bio: '',
    avatar: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">User Profile</h1>
        <p className="text-sm text-gray-500 font-mono">Manage your local identity. Data is stored safely in IndexedDB.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <User className="w-3 h-3" /> Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 rounded-none transition-all"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Mail className="w-3 h-3" /> Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 rounded-none transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Professional Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 rounded-none transition-all min-h-[120px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          disabled={isSaved}
        >
          {isSaved ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              Profile Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Update Profile
            </>
          )}
        </button>
      </form>

      <div className="mt-12 p-6 border border-yellow-200 bg-yellow-50/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-700 mb-2">Offline-First Privacy Note</h3>
        <p className="text-xs text-yellow-800/70 leading-relaxed">
          Your profile information is stored exclusively in your browser's IndexedDB. 
          No personal data is sent to our servers except for AI generation context when explicitly requested. 
          Refreshing the page or going offline will not erase these details.
        </p>
      </div>
    </motion.div>
  );
}
