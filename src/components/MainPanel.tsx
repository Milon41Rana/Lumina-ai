import React, { useRef, useEffect } from 'react';
import { Eye, Code, Globe, Shield, Settings, Github, Monitor, Smartphone, RotateCcw, ExternalLink, Download, FileCode, File, Layers, Activity, AlertCircle, UserCircle, Save, WifiOff } from 'lucide-react';
import { MainTab, GeneratedFile, TerminalLog, UserProfile as UserProfileType } from '../types';
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
  getIframeSource: () => string;
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
}

export const MainPanel: React.FC<MainPanelProps> = ({ 
  activeTab, setActiveTab, generatedFiles, selectedFile, setSelectedFile, 
  previewDevice, setPreviewDevice, isTyping, getIframeSource,
  commitMessage, setCommitMessage, onGitHubSync, isSyncing, onDownloadZip,
  onUpdateFile, terminalLogs, userProfile, onUpdateProfile, isOffline
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
                           key={`${generatedFiles.length}-${refreshKey}`}
                           srcDoc={getIframeSource()}
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
                 </div>

                 <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden">
                    <div className="h-12 px-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/40">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Modified Files</span>
                       <span className="text-[10px] font-black text-gray-900 px-3 py-1 bg-gray-100 rounded-full">{generatedFiles.length} files tracked</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                       {generatedFiles.map((file, idx) => (
                         <div key={file.name} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                               <FileCode className="w-5 h-5 text-gray-300" />
                               <span className="text-sm font-bold text-gray-800 tracking-tight">{file.name}</span>
                            </div>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                              idx === 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-701"
                            )}>
                              {idx === 0 ? "Modified" : "Created"}
                            </span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 space-y-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Release Message</label>
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
                         disabled={!commitMessage.trim() || isSyncing}
                         onClick={onGitHubSync}
                         className="flex-1 h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest gap-4 transition-all active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center font-sans mt-0"
                       >
                          {isSyncing ? (
                            <RotateCcw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Github className="w-5 h-5" />
                          )}
                          {isSyncing ? "Pushing..." : "Sync Repository"}
                       </button>
                       <button 
                         onClick={onDownloadZip}
                         className="h-14 border-2 border-gray-100 text-gray-600 font-black uppercase tracking-widest gap-3 px-8 rounded-2xl hover:bg-gray-50 transition-all flex items-center"
                       >
                          <Download className="w-5 h-5" /> Export
                       </button>
                    </div>
                 </div>
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
