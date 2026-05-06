import React, { useRef, useEffect } from 'react';
import { Eye, Code, Globe, Shield, Settings, Github, Monitor, Smartphone, RotateCcw, ExternalLink, Download, FileCode, File, Layers, Activity, AlertCircle, UserCircle, Save, WifiOff, Link2, Database } from 'lucide-react';
import { MainTab, GeneratedFile, TerminalLog, UserProfile as UserProfileType, GitHubRepo } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { UserProfile } from './UserProfile';

interface MainPanelProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  generatedFiles: GeneratedFile[];
  selectedFile: string;
  setSelectedFile: (name: string) => void;
  previewDevice: 'mobile' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'desktop') => void;
  isTyping: boolean;
  previewSrcDoc: string;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  onGitHubSync: () => void;
  isSyncing: boolean;
  onDownloadZip: () => void;
  onUpdateFile: (name: string, content: string) => void;
  terminalLogs: TerminalLog[];
  userProfile: UserProfileType | null;
  onUpdateProfile: (profile: UserProfileType) => void;
  isOffline: boolean;
  githubUser: any;
  isCheckingSession: boolean;
  githubRepos: GitHubRepo[];
  selectedRepo: string | null;
  onSelectRepo: (fullName: string) => void;
  onGitHubLogin: () => void;
  onGitHubLogout: () => void;
  onRefreshRepos: () => void;
}

export const MainPanel: React.FC<MainPanelProps> = ({ 
  activeTab, setActiveTab, generatedFiles, selectedFile, setSelectedFile, 
  previewDevice, setPreviewDevice, isTyping, previewSrcDoc,
  commitMessage, setCommitMessage, onGitHubSync, isSyncing, onDownloadZip,
  onUpdateFile, terminalLogs, userProfile, onUpdateProfile, isOffline,
  githubUser, isCheckingSession, githubRepos, selectedRepo, onSelectRepo, onGitHubLogin, onGitHubLogout, onRefreshRepos
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [consolePinned, setConsolePinned] = React.useState(true);

  const [isSaving, setIsSaving] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const getLanguage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx': return 'typescript';
      case 'js':
      case 'jsx': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onUpdateFile(selectedFile, value);
      
      // Visual indicator for "Auto-saving"
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);
  const tabs: { name: MainTab, icon: any }[] = [
    { name: 'Preview', icon: Eye },
    { name: 'Code', icon: Code },
    { name: 'Profile', icon: UserCircle },
    { name: 'Versions', icon: Settings },
    { name: 'Secrets', icon: Shield },
    { name: 'Integrations', icon: Globe },
    { name: 'GitHub', icon: Github },
  ];

  const activeTabIndex = tabs.findIndex(t => t.name === activeTab);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : -20,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Tab Bar */}
      <div className="h-10 border-b border-gray-100 bg-white flex items-center justify-between z-10 shrink-0">
        <div className="flex h-full overflow-x-auto no-scrollbar">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={cn(
                  "h-full px-6 text-[10px] font-black uppercase tracking-widest transition-all relative border-r border-gray-50 flex items-center gap-2.5",
                  isActive ? "text-gray-900 bg-white" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50/30"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-gray-900" : "text-gray-300")} />
                {tab.name}
                {isActive && (
                  <motion.div 
                    layoutId="studio-tab" 
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="pr-6 hidden xl:block uppercase font-black text-[9px] text-gray-300 tracking-[0.2em] select-none">
          Build Pipeline v4.0 // LMN_RNDR
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-gray-50/10 overflow-hidden">
        <AnimatePresence mode="wait" custom={activeTabIndex}>
          {activeTab === 'Preview' && (
            <motion.div 
              key="preview" 
              custom={activeTabIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 h-full flex flex-col p-6 overflow-hidden"
            >
               {isOffline && (
                 <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-widest animate-in slide-in-from-top-2">
                   <WifiOff className="w-4 h-4" />
                   Browser is Offline - Local sync active (IndexedDB)
                 </div>
               )}
               <div className="h-14 mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-6 shrink-0 shadow-sm">
                  <div className="flex items-center gap-8">
                     <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-xl">
                        <button 
                          onClick={() => setDevice('desktop')}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                            device === 'desktop' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Desktop</span>
                        </button>
                        <button 
                          onClick={() => setDevice('mobile')}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
                            device === 'mobile' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mobile</span>
                        </button>
                     </div>
                     <div className="h-4 w-px bg-gray-100" />
                     <button 
                        onClick={() => setConsolePinned(!consolePinned)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          consolePinned ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                        )}
                     >
                       <Activity className="w-3.5 h-3.5" />
                       Live Console
                     </button>
                  </div>
                  <div className="flex items-center gap-4">
                     <RotateCcw 
                        onClick={handleRefresh}
                        className="w-4 h-4 text-gray-300 hover:text-gray-900 cursor-pointer transition-colors active:rotate-180" 
                     />
                     <ExternalLink className="w-4 h-4 text-gray-300 hover:text-gray-900 cursor-pointer transition-colors" />
                  </div>
               </div>

               <div className="flex-1 overflow-hidden bg-gray-50/20 rounded-[2.5rem] border border-gray-100 relative flex flex-col">
                  <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                    {!generatedFiles.some(f => f.name === 'index.html') ? (
                      <div className="text-center p-12 bg-white border border-gray-100 rounded-3xl shadow-xl max-w-sm">
                        <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No index.html Entry</h3>
                        <p className="text-sm text-gray-500">I need an index.html file in the virtual filesystem to render a preview.</p>
                      </div>
                    ) : (
                      <motion.div 
                        layout
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        className={cn(
                          "bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden relative",
                          device === 'desktop' ? "w-full h-full rounded-2xl" : "w-[375px] h-[700px] rounded-[3.5rem] border-[12px] border-gray-900 ring-4 ring-gray-100"
                        )}
                      >
                        {device === 'mobile' && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-20 flex items-center justify-center">
                            <div className="w-10 h-1.5 bg-gray-800 rounded-full" />
                          </div>
                        )}
                        <iframe 
                           key={refreshKey}
                           srcDoc={previewSrcDoc}
                           sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
                           className="w-full h-full border-none"
                        />
                      </motion.div>
                    )}
                  </div>

                  <AnimatePresence>
                    {consolePinned && (
                      <motion.div 
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        className="h-56 bg-white border-t border-gray-100 flex flex-col shrink-0"
                      >
                        <div className="h-11 px-6 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.25em]">Runtime Console</span>
                             <span className="text-[10px] text-gray-300 font-bold ml-1 opacity-50 italic">Connected</span>
                          </div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{terminalLogs.filter(l => l.type !== 'system').length} Events</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 bg-gray-50/10">
                          {terminalLogs.filter(l => l.type !== 'system').length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                               <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200" />
                               <span className="italic">Awaiting runtime signals...</span>
                            </div>
                          ) : (
                            terminalLogs.filter(l => l.type !== 'system').map((log, i) => (
                              <div key={i} className={cn(
                                "flex items-start gap-4 py-1.5 px-3 rounded-lg group transition-colors",
                                log.type === 'error' ? "text-red-500 bg-red-50/50" : 
                                log.type === 'warn' ? "text-amber-600 bg-amber-50/50" : "text-gray-500 hover:bg-gray-100/50"
                              )}>
                                <span className="opacity-20 shrink-0 font-bold">[{log.timestamp}]</span>
                                {log.type === 'error' && <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />}
                                <span className="whitespace-pre-wrap flex-1">{log.message}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </motion.div>
          )}

          {activeTab === 'Profile' && (
            <motion.div 
              key="profile" 
              custom={activeTabIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 h-full overflow-y-auto bg-white"
            >
              <UserProfile profile={userProfile} onUpdate={onUpdateProfile} />
            </motion.div>
          )}

          {activeTab === 'GitHub' && (
            <motion.div 
              key="github" 
              custom={activeTabIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 h-full p-8 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h2 className="text-2xl font-black tracking-tighter text-gray-900 flex items-center gap-3 underline decoration-blue-500 decoration-4 underline-offset-8">
                         <Github className="w-8 h-8" /> GitHub Bridge
                       </h2>
                       <p className="text-sm text-gray-400 font-medium tracking-tight">Sync your virtual code with physical repositories.</p>
                    </div>
                    {githubUser && (
                      <div className="flex items-center gap-3 bg-white border border-gray-100 p-2 pl-4 rounded-2xl shadow-sm">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{githubUser.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono">@{githubUser.login}</p>
                        </div>
                        <img src={githubUser.avatar} className="w-10 h-10 rounded-xl" alt="GitHub Avatar" />
                        <button 
                          onClick={onGitHubLogout}
                          className="px-3 py-1 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                 </div>

                 {!githubUser ? (
                   <div className="bg-gray-900 rounded-[2.5rem] p-12 text-center space-y-8 shadow-2xl shadow-black/40 border border-white/5 relative overflow-hidden">
                     <AnimatePresence>
                       {isCheckingSession && (
                         <motion.div 
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-6"
                         >
                           <div className="relative">
                             <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                             <Github className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                           </div>
                           <div className="space-y-2">
                             <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] animate-pulse">Verifying Identity</p>
                             <p className="text-[9px] text-gray-500 font-medium">Syncing with GitHub OAuth Gateway...</p>
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>

                     <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto">
                        <Github className="w-10 h-10 text-white" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Authorize GitHub Access</h3>
                        <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                          Connect your account to enable direct repository syncing, itemized commits, and cloud deployment.
                        </p>
                     </div>
                      <div className="flex flex-col items-center gap-6">
                        <button 
                          onClick={onGitHubLogin}
                          className="bg-white text-gray-900 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20"
                        >
                          Login with GitHub
                        </button>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 max-w-sm mx-auto space-y-4">
                          <div className="flex items-center justify-center gap-2 text-blue-400">
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                             <p className="text-[10px] font-black uppercase tracking-widest">
                               GitHub Configuration Guide
                             </p>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed text-center font-medium">
                            আপনার GitHub App সেটিংসে নিচের ইউআরএলটি <span className="text-white underline decoration-blue-500">অবিকল</span> কপি করে বসান:
                          </p>
                          <div className="relative group">
                            <code className="block bg-black/60 p-4 rounded-xl text-[10px] text-blue-300 break-all select-all border border-white/10 font-mono text-center ring-1 ring-blue-500/20">
                              {window.location.origin}/api/auth/github/callback
                            </code>
                          </div>
                          <p className="text-[9px] text-gray-500 text-center italic">
                            Settings &gt; Developer Settings &gt; OAuth Apps &gt; Your App &gt; Authorization callback URL
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                          <button 
                            onClick={onRefreshRepos}
                            className="text-[10px] font-black uppercase text-gray-500 hover:text-white tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            <RotateCcw className="w-3 h-3" /> Refresh Auth Status
                          </button>
                          <p className="text-[9px] text-gray-600 font-medium italic">Already logged in? Click refresh to sync repos.</p>
                        </div>
                      </div>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="md:col-span-2 space-y-6">
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden">
                           <div className="h-12 px-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/40">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Your Repositories</span>
                              <button 
                                onClick={onRefreshRepos}
                                className="text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase flex items-center gap-2"
                              >
                                <RotateCcw className="w-3 h-3" /> Refresh
                              </button>
                           </div>
                           <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                              {githubRepos.length === 0 ? (
                                <div className="p-12 text-center text-gray-300 text-xs italic">
                                  No repositories found or still loading...
                                </div>
                              ) : (
                                githubRepos.map((repo) => (
                                  <div 
                                    key={repo.id} 
                                    onClick={() => onSelectRepo(repo.full_name)}
                                    className={cn(
                                      "px-8 py-4 flex items-center justify-between transition-colors group cursor-pointer",
                                      selectedRepo === repo.full_name ? "bg-blue-50/50" : "hover:bg-gray-50/50"
                                    )}
                                  >
                                     <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-bold text-gray-800 tracking-tight flex items-center gap-2">
                                          {repo.name}
                                          {repo.forks_count > 0 && <span className="text-[8px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Fork</span>}
                                          {selectedRepo === repo.full_name && (
                                            <span className="text-[8px] bg-blue-600 px-2 py-0.5 rounded-full text-white font-black uppercase tracking-widest">Active Target</span>
                                          )}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[250px]">{repo.description || 'No description provided'}</span>
                                     </div>
                                     <div className="flex items-center gap-4">
                                        <div className={cn(
                                          "w-2 h-2 rounded-full transition-all",
                                          selectedRepo === repo.full_name ? "bg-blue-500 scale-125" : "bg-gray-200 group-hover:bg-gray-300"
                                        )} />
                                        <a 
                                          href={repo.html_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                           <ExternalLink className="w-4 h-4 text-gray-400" />
                                        </a>
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>

                        <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sync Changes</label>
                              <div className="text-[10px] text-gray-400 mb-2 font-bold">
                                Target: <span className={selectedRepo ? "text-blue-500" : "text-red-400"}>{selectedRepo || 'None selected'}</span>
                              </div>
                              <input 
                                type="text"
                                value={commitMessage}
                                onChange={(e) => setCommitMessage(e.target.value)}
                                placeholder="Describe your architectural changes..."
                                className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 shadow-inner focus:bg-white focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                              />
                           </div>
                           <div className="flex gap-4">
                              <button 
                                disabled={!commitMessage.trim() || isSyncing || !selectedRepo}
                                onClick={onGitHubSync}
                                className="flex-1 h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest gap-4 transition-all active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center font-sans mt-0"
                              >
                                 {isSyncing ? (
                                   <RotateCcw className="w-5 h-5 animate-spin" />
                                 ) : (
                                   <Github className="w-5 h-5" />
                                 )}
                                 {isSyncing ? "Pushing Changes..." : selectedRepo ? `Sync to ${selectedRepo.split('/')[1]}` : "Sync Changes"}
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="bg-gray-900 rounded-[2rem] p-6 shadow-2xl shadow-black/40 border border-white/5">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center justify-between">
                             <span className="flex items-center gap-2">
                               <Layers className="w-3.5 h-3.5 text-blue-400" /> Staged Changes
                             </span>
                             <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[8px] font-black">
                               {generatedFiles.filter(f => f.diffStatus).length}
                             </span>
                           </h4>
                           <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                              {generatedFiles.filter(f => f.diffStatus).length === 0 ? (
                                <div className="text-center py-12 px-8 bg-white/5 border border-dashed border-white/10 rounded-2xl">
                                  <Activity className="w-8 h-8 text-gray-700 mx-auto mb-3 opacity-20" />
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Workspace Clean</p>
                                  <p className="text-[9px] text-gray-600 mt-2 font-medium">Modify code in the editor to stage for push.</p>
                                </div>
                              ) : (
                                generatedFiles.filter(f => f.diffStatus).map((file) => (
                                  <div key={file.name} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-default border-l-4 border-l-transparent hover:border-l-blue-400">
                                     <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-xl flex items-center justify-center bg-white/5",
                                          file.diffStatus === 'added' ? "text-green-400" : "text-blue-400"
                                        )}>
                                          <FileCode className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-black text-gray-200 tracking-tight">{file.name}</span>
                                          <span className="text-[8px] text-gray-500 font-mono tracking-tighter uppercase">{file.diffStatus === 'added' ? 'New Entry' : 'Modified Synthesis'}</span>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-3">
                                       <span className={cn(
                                         "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                                         file.diffStatus === 'added' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                       )}>
                                         {file.diffStatus}
                                       </span>
                                     </div>
                                  </div>
                                ))
                              )}
                           </div>
                        </div>

                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                             <Activity className="w-3.5 h-3.5" /> Project Stats
                           </h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">VFS Status</span>
                                 <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Optimized</span>
                              </div>
                              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Modified Units</span>
                                 <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{generatedFiles.length} file(s)</span>
                              </div>
                              <button 
                                onClick={onDownloadZip}
                                className="w-full h-12 border-2 border-gray-200 text-gray-600 font-black uppercase tracking-widest gap-3 px-8 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center text-[10px]"
                              >
                                 <Download className="w-4 h-4" /> Export Bundle
                              </button>
                           </div>
                        </div>
                     </div>
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Code' && (
            <motion.div 
              key="code" 
              custom={activeTabIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 h-full flex overflow-hidden bg-white"
            >
              <aside className="w-64 border-r border-gray-50 flex flex-col p-6 bg-gray-50/10">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8 px-2">Virtual Files</h3>
                 <div className="space-y-1.5 overflow-y-auto">
                    {generatedFiles.map(file => (
                      <button
                        key={file.name}
                        onClick={() => setSelectedFile(file.name)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-[11px] flex items-center gap-3.5 transition-all",
                          selectedFile === file.name ? "bg-gray-900 text-white font-bold shadow-lg shadow-gray-200" : "text-gray-400 hover:bg-white hover:text-gray-800"
                        )}
                      >
                        <File className={cn("w-4 h-4", selectedFile === file.name ? "text-blue-400" : "text-gray-200")} />
                        <span className="truncate tracking-tight">{file.name}</span>
                      </button>
                    ))}
                 </div>
              </aside>
              <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="h-11 border-b border-gray-50 px-8 flex items-center justify-between bg-white shrink-0">
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">{selectedFile}</span>
                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest italic opacity-50">VFS_SYMMETRIC_ENCRYPTED</span>
                 </div>
                  <div className="flex-1 bg-white relative overflow-hidden">
                    <Editor
                      height="100%"
                      language={getLanguage(selectedFile)}
                      value={generatedFiles.find(f => f.name === selectedFile)?.content || ''}
                      onChange={handleEditorChange}
                      theme="light"
                      options={{
                        fontSize: 13,
                        lineHeight: 1.8,
                        fontFamily: 'JetBrains Mono, monospace',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 40, bottom: 40 },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        selectionHighlight: true,
                        occurrencesHighlight: 'off',
                        renderLineHighlight: 'none',
                        hideCursorInOverviewRuler: true,
                        scrollbar: {
                          vertical: 'hidden',
                          horizontal: 'hidden'
                        }
                      }}
                    />
                    <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500",
                        isSaving ? "bg-blue-50 text-blue-600 scale-100 opacity-100" : "bg-green-50 text-green-600 scale-95 opacity-0"
                      )}>
                         <Save className="w-3 h-3 animate-bounce" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Auto Saving</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Connected</span>
                      </div>
                    </div>
                  </div>
              </div>
            </motion.div>
          )}

          {(!['Preview', 'GitHub', 'Code'].includes(activeTab)) && (
            <motion.div 
              key="empty" 
              custom={activeTabIndex}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="flex-1 h-full flex flex-col items-center justify-center p-12"
            >
               <div className="relative mb-8 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Layers className="w-10 h-10 text-gray-200 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.5em] animate-pulse">Synchronizing Component...</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
