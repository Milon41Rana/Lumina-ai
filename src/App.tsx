import * as React from "react";
import {
  Plus,
  Terminal,
  Code2,
  Smartphone,
  Sparkles,
  Eye,
  Monitor,
  Send,
  FileCode,
  Github,
  Menu,
  Database,
  Search,
  Settings,
  Share2,
  ChevronDown,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  FileText,
  History,
  Activity,
  Layers,
  Key,
  Puzzle,
  X,
  Maximize2,
  Check,
  File,
  FolderOpen,
  Cloud, 
  Lock, 
  ShieldCheck, 
  Mail, 
  UserPlus, 
  FileJson, 
  Download, 
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { saveSession, loadSession } from "./lib/db";
import JSZip from "jszip";

// --- Types ---
interface GeneratedFile {
  name: string;
  content: string;
}

interface ActionLog {
  id: string;
  action: string;
  files: string[];
}

interface TerminalLog {
  id: string;
  message: string;
  timestamp: string;
}

type MainTab = "Preview" | "Code" | "Versions" | "Secrets" | "Integrations" | "GitHub";

const STORAGE_KEY = "lumina_studio_v3";

const DEFAULT_FILES: GeneratedFile[] = [
  { 
    name: "index.html", 
    content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Lumina Project</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n  <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap\" rel=\"stylesheet\">\n  <style>body { font-family: 'Inter', sans-serif; }</style>\n</head>\n<body class=\"bg-white text-slate-900 h-screen flex flex-col items-center justify-center\">\n  <h1 class=\"text-5xl font-black tracking-tighter text-slate-900 mb-2\">Lumina AI Studio</h1>\n  <p class=\"text-slate-400 font-medium tracking-tight\">Start by describing your vision in the Meta-Control panel.</p>\n</body>\n</html>" 
  },
];

export default function App() {
  const [activeTab, setActiveTab] = React.useState<MainTab>("Preview");
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [generatedFiles, setGeneratedFiles] = React.useState<GeneratedFile[]>(DEFAULT_FILES);
  const [messages, setMessages] = React.useState<{ role: "user" | "model"; content: string; actions?: ActionLog }[]>([
    { role: "model", content: "Architecture engine connected. I'm ready to build your full-stack vision." }
  ]);
  const [terminalLogs, setTerminalLogs] = React.useState<TerminalLog[]>(() => [
    { id: "1", message: "Build Start", timestamp: new Date().toLocaleTimeString() },
    { id: "2", message: "Render Start", timestamp: new Date().toLocaleTimeString() },
    { id: "3", message: "CONNECTED", timestamp: new Date().toLocaleTimeString() },
    { id: "4", message: "Lumina Engine Ready", timestamp: new Date().toLocaleTimeString() },
  ]);
  const [previewLogs, setPreviewLogs] = React.useState<TerminalLog[]>([]);
  const [selectedFile, setSelectedFile] = React.useState("index.html");
  const [previewDevice, setPreviewDevice] = React.useState<"mobile" | "desktop">("desktop");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState<"saving" | "saved" | "idle">("idle");
  const [commitMessage, setCommitMessage] = React.useState("");
  const [isSyncing, setIsSyncing] = React.useState(false);

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Persistence: Load
  React.useEffect(() => {
    const load = async () => {
      const data = await loadSession(STORAGE_KEY);
      if (data) {
        if (data.generatedFiles) setGeneratedFiles(data.generatedFiles);
        if (data.messages) setMessages(data.messages);
      }
    };
    load();
  }, []);

  // Persistence: Save
  React.useEffect(() => {
    const save = async () => {
      setSaveStatus("saving");
      await saveSession(STORAGE_KEY, { generatedFiles, messages });
      setTimeout(() => setSaveStatus("saved"), 800);
    };
    if (messages.length > 1 || generatedFiles.length > 1) {
      const timer = setTimeout(save, 1000);
      return () => clearTimeout(timer);
    }
  }, [generatedFiles, messages]);

  React.useEffect(() => {
    // Suppress benign platform errors
    const handleError = (e: ErrorEvent) => {
      if (e.message?.includes("WebSocket") || e.message?.includes("[vite]")) e.stopImmediatePropagation();
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || e.reason || "";
      if (typeof msg === 'string' && (msg.includes("WebSocket") || msg.includes("vite"))) e.stopImmediatePropagation();
    };
    
    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleRejection, true);

    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data?.message === 'string' && event.data.message.includes('[vite]')) return;
      if (event.data?.type === "log" || event.data?.type === "error") {
        setPreviewLogs(prev => [...prev.slice(-30), { 
          id: crypto.randomUUID(), 
          message: `${event.data.type?.toUpperCase()}: ${event.data.message}`,
          timestamp: new Date().toLocaleTimeString() 
        }]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleRejection, true);
    };
  }, []);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addTerminalLog = (message: string) => {
    setTerminalLogs(prev => [...prev.slice(-20), { id: crypto.randomUUID(), message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    generatedFiles.forEach(file => {
      zip.file(file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lumina-project-${Date.now()}.zip`;
    link.click();
    addTerminalLog("Project exported as ZIP");
  };

  const handleGitHubSync = () => {
    if (!commitMessage.trim()) return;
    setIsSyncing(true);
    addTerminalLog(`Initiating GitHub Sync: ${commitMessage}`);
    setTimeout(() => {
      setIsSyncing(false);
      setCommitMessage("");
      addTerminalLog("GitHub Repo Synchronized Successfully");
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setInput("");
    setIsTyping(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    addTerminalLog(`Syncing prompt: ${userMessage.slice(0, 15)}...`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Server synchronization failed");
      }

      const data = await res.json();
      
      const newAction: ActionLog = {
        id: crypto.randomUUID(),
        action: `Edited ${data.files?.length || 0} files`,
        files: data.files?.map((f: any) => f.name) || [],
      };

      setMessages(prev => [...prev, { role: "model", content: data.explanation, actions: newAction }]);
      if (data.files && data.files.length > 0) setGeneratedFiles(data.files);
      
      addTerminalLog("Modules Synchronized Successfully");
    } catch (err: any) {
      const errorMsg = err.message || "Unknown synchronization error";
      addTerminalLog(`CRITICAL ERROR: ${errorMsg}`);
      setMessages(prev => [...prev, { role: "model", content: `Architecture synchronization failed: ${errorMsg}. Please verify your API Key in Vercel Settings.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getIframeSource = () => {
    const htmlFile = generatedFiles.find(f => f.name === "index.html");
    if (!htmlFile) return "";
    
    const relayScript = `
      <script>
        (function() {
          const originalLog = console.log;
          const originalError = console.error;
          console.log = function(...args) {
            window.parent.postMessage({ type: 'log', message: args.join(' ') }, '*');
            originalLog.apply(console, args);
          };
          console.error = function(...args) {
            window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*');
            originalError.apply(console, args);
          };
          window.onerror = function(msg) {
            window.parent.postMessage({ type: 'error', message: msg }, '*');
          };
        })();
      </script>
    `;
    
    let content = htmlFile.content;
    if (content.includes("<head>")) {
      content = content.replace("<head>", `<head>${relayScript}`);
    } else {
      content = relayScript + content;
    }
    return content;
  };

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-12 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shadow-gray-200">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tighter uppercase">Lumina Studio</span>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Idle</span>
          </div>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            {saveStatus === "saving" ? (
              <RotateCcw className="w-3 h-3 text-blue-500 animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : null}
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest transition-colors",
              saveStatus === "saving" ? "text-blue-500" : saveStatus === "saved" ? "text-green-600" : "text-slate-300"
            )}>
              {saveStatus === "saving" ? "Syncing..." : saveStatus === "saved" ? "Saved" : "Not Synced"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900">
            <Share2 className="w-3.5 h-3.5 mr-2" /> Share
          </Button>
          <Button size="sm" className="h-8 px-5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-black transition-all active:scale-95">
            Publish
          </Button>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-slate-600 ml-2">RA</div>
        </div>
      </header>

      {/* Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Meta-Control */}
        <aside className={cn(
          "bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isSidebarOpen ? "w-full lg:w-[400px]" : "w-0 overflow-hidden"
        )}>
          <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between bg-gray-50/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Meta-Control</h2>
            <RotateCcw className="w-3.5 h-3.5 text-slate-300 cursor-pointer hover:text-slate-600 transition-colors" />
          </div>

          <ScrollArea className="flex-1 p-6 bg-gray-50/5">
            <div className="space-y-8">
              {messages.map((m, i) => (
                <div key={i} className={cn("space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500")}>
                  <div className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-5 rounded-2xl text-[13px] leading-relaxed max-w-[92%] shadow-sm",
                      m.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-gray-100 text-slate-600 font-medium"
                    )}>
                      {m.content}
                    </div>
                  </div>

                  {m.actions && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 rounded-2xl bg-white border border-gray-100 space-y-4 shadow-sm mx-2">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                           <History className="w-3 h-3 text-blue-500" /> Action Log
                         </h4>
                       </div>
                       <div className="space-y-3">
                          <div className="flex items-center gap-2.5 text-xs font-black text-slate-800">
                            <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                               <Check className="w-3 h-3 text-green-500" />
                            </div>
                            {m.actions.action}
                          </div>
                          <div className="pl-7 space-y-2">
                            {m.actions.files.map(f => (
                              <div key={f} className="flex items-center gap-3 text-[11px] text-slate-400 font-medium hover:text-slate-600 cursor-default transition-colors">
                                <FileText className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                       </div>
                    </motion.div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-3 p-4 bg-white border border-blue-100 rounded-2xl shadow-sm mx-2">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Architecting...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-5 border-t border-gray-100 bg-white">
            <form onSubmit={handleSendMessage} className="relative group">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What should we build today?"
                className="h-12 bg-gray-50 border-transparent pr-12 rounded-xl text-sm font-medium transition-all group-hover:bg-gray-100 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent shadow-inner"
              />
              <Button type="submit" size="icon" disabled={isTyping} className="absolute right-1.5 top-1.5 h-9 w-9 bg-slate-900 text-white rounded-lg hover:bg-black active:scale-90 transition-all">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </aside>

        {/* Right Side: Tab Interface + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Tab Bar */}
          <div className="h-10 border-b border-gray-100 bg-white flex items-center justify-between z-10 shrink-0">
             <div className="flex h-full">
                {(["Preview", "Code", "Versions", "Secrets", "Integrations", "GitHub"] as MainTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "h-full px-6 text-[10px] font-black uppercase tracking-widest transition-all relative border-r border-gray-50",
                      activeTab === tab ? "text-slate-900 bg-white" : "text-slate-300 hover:text-slate-500 hover:bg-gray-50/30"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="studio-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900" />
                    )}
                  </button>
                ))}
             </div>
             <div className="pr-6 hidden md:block">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Build Core v3.0 // SHIELD_ENABLED</div>
             </div>
          </div>

          {/* Active Tab Surface */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50/20">
             <AnimatePresence mode="wait">
                {activeTab === "Preview" ? (
                  <motion.div 
                    key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-6 overflow-hidden"
                  >
                    <div className="h-12 mb-6 flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 shrink-0 shadow-sm">
                       <div className="flex gap-2.5">
                          <Button variant="ghost" size="sm" onClick={() => setPreviewDevice("desktop")} className={cn("h-8 px-4 text-[10px] font-black gap-2.5 rounded-xl transition-all", previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-gray-50")}>
                             <Monitor className="w-3.5 h-3.5" /> Desktop
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewDevice("mobile")} className={cn("h-8 px-4 text-[10px] font-black gap-2.5 rounded-xl transition-all", previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-gray-50")}>
                             <Smartphone className="w-3.5 h-3.5" /> Mobile
                          </Button>
                       </div>
                       <div className="flex items-center gap-4">
                          <RotateCcw onClick={() => setPreviewLogs([])} className="w-4 h-4 text-slate-300 hover:text-slate-900 cursor-pointer transition-colors" />
                          <ExternalLink className="w-4 h-4 text-slate-300 hover:text-slate-900 cursor-pointer transition-colors" />
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
                       <div className="flex-1 flex items-center justify-center overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-inner group relative">
                          <div className={cn(
                            "bg-white ring-8 ring-slate-900 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden relative",
                            previewDevice === "mobile" ? "w-[360px] h-[720px] rounded-[3.5rem] border-[12px] border-slate-900" : "w-full h-full rounded-2xl border-none"
                          )}>
                            {isTyping && (
                              <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-10 animate-in fade-in duration-500">
                                <Activity className="w-10 h-10 text-slate-900 animate-pulse mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Hot Reloading</span>
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

                       {/* Preview Console */}
                       <div className="w-full lg:w-[320px] flex flex-col bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl h-48 lg:h-auto overflow-hidden">
                          <div className="h-11 px-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                             <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-slate-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Runtime Console</span>
                             </div>
                             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          </div>
                          <ScrollArea className="flex-1 p-6 font-mono text-[10px] text-slate-300">
                             <div className="space-y-3">
                                {previewLogs.length === 0 ? (
                                  <div className="text-slate-600 italic py-4 font-medium uppercase tracking-tight opacity-50">Listening for signals...</div>
                                ) : (
                                  previewLogs.map(log => (
                                    <div key={log.id} className={cn(
                                      "p-3 rounded-xl border transition-all",
                                      log.message.includes("ERROR") ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-slate-800/50 border-slate-700 text-slate-400"
                                    )}>
                                       <div className="flex justify-between mb-2 opacity-30 font-black text-[8px]">
                                          <span>ID_{log.id.slice(0, 4)}</span>
                                          <span>{log.timestamp}</span>
                                       </div>
                                       <div className="break-all font-bold tracking-tight leading-relaxed">{log.message}</div>
                                    </div>
                                  ))
                                )}
                             </div>
                          </ScrollArea>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === "GitHub" ? (
                  <motion.div 
                    key="github" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 p-8 overflow-y-auto bg-gray-50/10"
                  >
                    <div className="max-w-4xl mx-auto space-y-10">
                       <div className="flex items-center justify-between">
                          <div className="space-y-1">
                             <h2 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                               <Github className="w-8 h-8" /> GitHub Bridge
                             </h2>
                             <p className="text-sm text-slate-400 font-medium tracking-tight">Coordinate your Virtual File System with remote repositories.</p>
                          </div>
                          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white rounded-full">
                             <GitBranch className="w-4 h-4" />
                             <span className="text-[11px] font-black uppercase tracking-widest">main</span>
                          </div>
                       </div>

                       <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-100/50 overflow-hidden">
                          <div className="h-12 px-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Modified Modules</span>
                             <span className="text-[10px] font-black text-slate-900 px-3 py-1 bg-slate-100 rounded-full">{generatedFiles.length} files tracked</span>
                          </div>
                          <div className="divide-y divide-gray-50">
                             {generatedFiles.map((file, idx) => (
                               <div key={file.name} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                  <div className="flex items-center gap-4">
                                     <FileCode className="w-5 h-5 text-slate-300" />
                                     <span className="text-sm font-black text-slate-800 tracking-tight">{file.name}</span>
                                  </div>
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                                    idx === 0 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                  )}>
                                    {idx === 0 ? "Modified" : "Added"}
                                  </span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl shadow-gray-100/50 space-y-6">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Release Signature</label>
                             <Input 
                               value={commitMessage}
                               onChange={(e) => setCommitMessage(e.target.value)}
                               placeholder="What did you change in this iteration?"
                               className="h-14 bg-gray-50 border-transparent rounded-2xl font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                             />
                          </div>
                          <div className="flex gap-4">
                             <Button 
                               disabled={!commitMessage.trim() || isSyncing}
                               onClick={handleGitHubSync}
                               className="flex-1 h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest gap-4 transition-all active:scale-95 shadow-xl shadow-slate-200"
                             >
                                {isSyncing ? (
                                  <RotateCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Github className="w-5 h-5" />
                                )}
                                {isSyncing ? "Pushing Changes..." : "Push to Production"}
                             </Button>
                             <Button 
                               variant="outline" 
                               onClick={handleDownloadZip}
                               className="h-14 border-2 border-gray-100 text-slate-600 font-black uppercase tracking-widest gap-3 px-8 rounded-2xl hover:bg-gray-50 transition-all"
                             >
                                <Download className="w-5 h-5" /> Export
                             </Button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === "Integrations" ? (
                   <motion.div 
                    key="integrations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 p-8 overflow-y-auto bg-gray-50/10"
                  >
                    <div className="max-w-4xl mx-auto space-y-10">
                       <div className="space-y-2">
                          <h2 className="text-2xl font-black tracking-tighter text-slate-900">Cloud Integrations</h2>
                          <p className="text-sm text-slate-400 font-medium tracking-tight">Configure external services and database security for this project.</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Firebase Integration */}
                          <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50 space-y-8">
                             <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                                 <Database className="w-7 h-7 text-orange-500" />
                               </div>
                               <div>
                                 <h3 className="text-md font-black text-slate-900">Firebase Firestore</h3>
                                 <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">NoSQL Database</p>
                               </div>
                             </div>
                             
                             <div className="space-y-5">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Engine</label>
                                   <Button 
                                     onClick={() => handleSendMessage({ preventDefault: () => {}, target: { value: "Generate Firebase Security Rules for this project based on current features." } } as any)}
                                     variant="outline" 
                                     className="w-full h-12 border-2 border-blue-50 text-blue-600 hover:bg-blue-50 rounded-2xl text-[11px] font-black uppercase tracking-widest gap-3"
                                   >
                                     <ShieldCheck className="w-5 h-5" /> Generate firestore.rules
                                   </Button>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      <Lock className="w-4 h-4 text-slate-200" />
                                      <span>ACL: Owner-Only Write Access</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Firebase Auth */}
                          <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-xl shadow-gray-100/50 space-y-8">
                             <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                                 <Key className="w-7 h-7 text-blue-500" />
                               </div>
                               <div>
                                 <h3 className="text-md font-black text-slate-900">Firebase Auth</h3>
                                 <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Identity Management</p>
                               </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col items-center gap-3 hover:bg-white transition-colors cursor-pointer">
                                  <Mail className="w-5 h-5 text-slate-400" />
                                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Email Auth</span>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex flex-col items-center gap-3 hover:bg-white transition-colors cursor-pointer">
                                  <UserPlus className="w-5 h-5 text-slate-400" />
                                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Google Login</span>
                                </div>
                             </div>
                             <Button variant="ghost" className="w-full h-10 text-[10px] font-black text-blue-600 hover:bg-blue-50 rounded-xl uppercase tracking-widest">Manage Providers</Button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === "Code" ? (
                  <motion.div 
                    key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex overflow-hidden bg-white"
                  >
                    <aside className="w-64 border-r border-gray-50 flex flex-col p-6 bg-gray-50/10">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8 px-2">Project Files</h3>
                       <div className="space-y-1.5">
                          {generatedFiles.map(file => (
                            <button
                              key={file.name}
                              onClick={() => setSelectedFile(file.name)}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl text-xs flex items-center gap-3.5 transition-all",
                                selectedFile === file.name ? "bg-slate-900 text-white font-black shadow-lg shadow-gray-200" : "text-slate-400 hover:bg-white hover:text-slate-800"
                              )}
                            >
                              <File className={cn("w-4 h-4", selectedFile === file.name ? "text-blue-400" : "text-slate-200")} />
                              <span className="truncate tracking-tight font-bold">{file.name}</span>
                            </button>
                          ))}
                       </div>
                    </aside>
                    <div className="flex-1 flex flex-col overflow-hidden">
                       <div className="h-11 border-b border-gray-50 px-8 flex items-center justify-between bg-white shrink-0">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{selectedFile}</span>
                          <span className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest italic opacity-50">VFS_READ_ONLY</span>
                       </div>
                       <ScrollArea className="flex-1 p-10 bg-gray-50/5">
                          <pre className="text-[13px] font-mono leading-[1.8] text-slate-600 bg-white border border-gray-100 p-12 rounded-[2.5rem] shadow-2xl shadow-gray-100 select-all selection:bg-blue-100">
                            <code>{generatedFiles.find(f => f.name === selectedFile)?.content}</code>
                          </pre>
                       </ScrollArea>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 transition-all duration-1000">
                     <div className="relative mb-8">
                        <Layers className="w-20 h-20 text-slate-100 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Activity className="w-8 h-8 text-slate-200 animate-bounce" />
                        </div>
                     </div>
                     <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.5em] animate-pulse">Interface Synchronizing...</p>
                  </div>
                )}
             </AnimatePresence>

             {/* Bottom Panel: Terminal */}
             <div className="h-44 border-t border-gray-100 bg-white flex flex-col shrink-0 group relative shadow-[0_-15px_40px_rgba(0,0,0,0.02)]">
                <div className="h-10 px-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/10">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                         <Terminal className="w-4 h-4 text-slate-300" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Build Pipeline</span>
                      </div>
                      <RotateCcw 
                        onClick={() => setTerminalLogs([])} 
                        className="w-3.5 h-3.5 text-slate-200 hover:text-slate-900 cursor-pointer transition-all ml-4" 
                      />
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping shadow-lg shadow-blue-200" />
                      <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">Active instance</span>
                   </div>
                </div>
                <ScrollArea className="flex-1 p-6 font-mono text-[11px] tracking-tight">
                   <div className="space-y-2">
                      {terminalLogs.map(log => (
                        <div key={log.id} className="flex gap-8 group hover:translate-x-1 transition-all duration-300">
                          <span className="text-slate-200 font-bold shrink-0">[{log.timestamp}]</span>
                          <span className={cn(
                            "font-black uppercase",
                            log.message.includes("ERROR") ? "text-red-500" : "text-slate-800"
                          )}>
                             {log.message}
                          </span>
                        </div>
                      ))}
                   </div>
                </ScrollArea>
                <div className="absolute top-2.5 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Maximize2 className="w-3.5 h-3.5 text-slate-200 cursor-pointer hover:text-slate-900" />
                   <X className="w-3.5 h-3.5 text-slate-200 cursor-pointer hover:text-slate-900" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Floating Action for Mobile Interaction */}
      <Button 
        variant="ghost" size="icon" 
        className="fixed bottom-8 right-8 h-16 w-16 rounded-[2rem] bg-slate-900 text-white shadow-2xl z-[100] md:hidden active:scale-90 border-4 border-white transition-all shadow-slate-300"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </Button>
    </div>
  );
}
