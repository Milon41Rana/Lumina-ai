import React from 'react';
import { Share2, Rocket, RotateCcw, CheckCircle2, Layout, Github } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, GitHubUser } from '../types';

interface NavigationProps {
  saveStatus: 'saving' | 'saved' | 'idle';
  isOffline: boolean;
  userProfile: UserProfile | null;
  githubUser: GitHubUser | null;
  onOpenProfile: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  saveStatus, isOffline, userProfile, githubUser, onOpenProfile, onLogin, onLogout 
}) => {
  return (
    <nav className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-sm">
          <Layout className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-sm tracking-tight leading-none uppercase truncate max-w-[100px] md:max-w-none">Lumina Studio</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]",
              isOffline ? "bg-red-500 shadow-red-500/30" : "bg-green-500"
            )} />
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.1em]">
              {isOffline ? 'Offline' : 'Connected'}
            </span>
          </div>
        </div>
        
        <div className="h-4 w-px bg-gray-200 mx-1 md:mx-2" />
        
        <div className="hidden sm:flex items-center gap-2">
          <div className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Engine: Gemini 3.1 Flash Lite</span>
          </div>
          {saveStatus === 'saving' ? (
            <RotateCcw className="w-3 h-3 text-blue-500 animate-spin" />
          ) : saveStatus === 'saved' ? (
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          ) : null}
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-widest transition-colors",
            saveStatus === 'saving' ? "text-blue-500" : saveStatus === 'saved' ? "text-green-600" : "text-gray-300"
          )}>
            {saveStatus === 'saving' ? "Syncing..." : saveStatus === 'saved' ? "Saved (IDB)" : "Ready"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-100">
          Remix
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-100">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-all shadow-lg shadow-gray-200 active:scale-95">
          <Rocket className="w-3.5 h-3.5" />
          Publish
        </button>
        <div className="w-px h-6 bg-gray-100 mx-1" />
        <button 
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 hover:border-gray-400 transition-all overflow-hidden"
        >
          {githubUser?.avatar ? (
            <img src={githubUser.avatar} alt="GitHub Avatar" className="w-full h-full object-cover" />
          ) : userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="Local Avatar" className="w-full h-full object-cover" />
          ) : (
            githubUser?.name?.slice(0, 2).toUpperCase() || userProfile?.name?.slice(0, 2).toUpperCase() || 'RA'
          )}
        </button>
      </div>
    </nav>
  );
};
