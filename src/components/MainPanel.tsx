import React from 'react';
import { Eye, Code, Globe, Shield, Settings, Github, Monitor, Smartphone, RotateCcw, ExternalLink, Download, FileCode, File, Layers, Activity, AlertCircle, Check } from 'lucide-react';
import { MainTab, GeneratedFile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
}

export const MainPanel: React.FC<MainPanelProps> = ({ 
  activeTab, setActiveTab, generatedFiles, selectedFile, setSelectedFile, 
  previewDevice, setPreviewDevice, isTyping, getIframeSource,
  commitMessage, setCommitMessage, onGitHubSync, isSyncing, onDownloadZip,
  onUpdateFile
}) => {
  const tabs: { name: MainTab, icon: any }[] = [
    { name: 'Preview', icon: Eye },
    { name: 'Code', icon: Code },
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
        <div className="pr-6 hidden lg:block uppercase font-black text-[9px] text-gray-300 tracking-[0.2em] select-none">
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
               <div className="h-12 mb-6 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 shrink-0 shadow-sm">
                  <div className="flex gap-2.5">
                     <button onClick={() => setPreviewDevice('desktop')} className={cn("h-8 px-4 text-[10px] font-bold gap-2.5 rounded-xl transition-all flex items-center", previewDevice === 'desktop' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50")}>
                        <Monitor className="w-3.5 h-3.5" /> Desktop
                     </button>
                     <button onClick={() => setPreviewDevice('mobile')} className={cn("h-8 px-4 text-[10px] font-bold gap-2.5 rounded-xl transition-all flex items-center", previewDevice === 'mobile' ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50")}>
                        <Smartphone className="w-3.5 h-3.5" /> Mobile
                     </button>
                  </div>
                  <div className="flex items-center gap-4">
                     <RotateCcw className="w-4 h-4 text-gray-300 hover:text-gray-900 cursor-pointer transition-colors" />
                     <ExternalLink className="w-4 h-4 text-gray-300 hover:text-gray-900 cursor-pointer transition-colors" />
                  </div>
               </div>

               <div className="flex-1 flex items-center justify-center overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-inner relative">
                  <div className={cn(
                    "bg-white ring-8 ring-gray-900 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden relative",
                    previewDevice === 'mobile' ? "w-[360px] h-[720px] rounded-[3.5rem] border-[12px] border-gray-900" : "w-full h-full rounded-2xl border-none"
                  )}>
                    {isTyping && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
                        <Activity className="w-10 h-10 text-gray-900 animate-pulse mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Syncing Runtime</span>
                      </div>
                    )}
                    <iframe 
                       key={generatedFiles.length}
                       srcDoc={getIframeSource()}
                       sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation"
                       className="w-full h-full border-none"
                    />
                  </div>
               </div>
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
                 <div className="flex-1 p-10 bg-gray-50/5 overflow-y-auto">
                    <div className="relative h-full">
                       <textarea
                         value={generatedFiles.find(f => f.name === selectedFile)?.content || ''}
                         onChange={(e) => onUpdateFile(selectedFile, e.target.value)}
                         spellCheck={false}
                         className="w-full h-[600px] font-mono text-[13px] leading-[1.8] text-gray-700 bg-white border border-gray-100 p-12 rounded-[2.5rem] shadow-2xl shadow-gray-100 outline-none resize-none selection:bg-blue-100"
                       />
                       <div className="absolute top-6 right-6 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Sync</span>
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
