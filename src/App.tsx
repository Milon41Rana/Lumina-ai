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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { saveSession, loadSession } from "./lib/db";
import { Cloud, Lock, ShieldCheck, Mail, UserPlus, FileJson } from "lucide-react";

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
  { name: "index.html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Lumina Project</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-white text-slate-900 h-screen flex flex-col items-center justify-center\">\n  <h1 class=\"text-4xl font-black tracking-tight text-blue-600 mb-2\">Lumina AI Studio</h1>\n  <p class=\"text-slate-500 font-medium\">Cloud Architect Platform v3.0</p>\n</body>\n</html>" },
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
      setTimeout(() => setSaveStatus("saved"), 500);
    };
    if (messages.length > 1 || generatedFiles.length > 1) {
      save();
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

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
      });
    }

    const handleMessage = (event: MessageEvent) => {
      // Filter out benign Vite HMR errors/logs
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
      <header className="h-10 border-b border-gray-100 flex items-center justify-between px-4 bg-white shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shadow-sm shadow-blue-200">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-[13px] tracking-tight">Lumina AI</span>
          <div className="h-3 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connected</span>
          </div>
          <div className="h-3 w-px bg-gray-200 mx-1" />
          <div className="flex items-center gap-2">
            {saveStatus === "saving" ? (
              <RotateCcw className="w-3 h-3 text-blue-500 animate-spin" />
            ) : saveStatus === "saved" ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : null}
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-tight transition-colors",
              saveStatus === "saving" ? "text-blue-500" : saveStatus === "saved" ? "text-green-600" : "text-slate-300"
            )}>
              {saveStatus === "saving" ? "Syncing..." : saveStatus === "saved" ? "Saved" : "Not Synced"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-slate-500 hover:text-slate-900">
            <Share2 className="w-3 h-3 mr-2" /> Share
          </Button>
          <Button size="sm" className="h-7 px-4 bg-slate-900 text-white rounded-md text-[11px] font-bold hover:bg-black transition-all">
            Deploy
          </Button>
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-[10px] font-medium text-slate-600 ml-2">RA</div>
        </div>
      </header>

      {/* Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Meta-Control */}
        <aside className={cn(
          "bg-white border-r border-gray-100 flex flex-col shrink-0 transition-all duration-300",
          isSidebarOpen ? "w-full lg:w-[380px]" : "w-0 overflow-hidden"
        )}>
          <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between bg-gray-50/30">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Meta-Control</h2>
            <RotateCcw className="w-3 h-3 text-slate-300 cursor-pointer hover:text-slate-600" />
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={cn("space-y-3 animate-in fade-in slide-in-from-bottom-2")}>
                  <div className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "p-4 rounded-xl text-[12.5px] leading-relaxed max-w-[90%] shadow-sm",
                      m.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-gray-100 text-slate-700"
                    )}>
                      {m.content}
                    </div>
                  </div>

                  {m.actions && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                       <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                           <History className="w-3 h-3 text-blue-500" /> Action History
                         </h4>
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            {m.actions.action}
                          </div>
                          <div className="pl-6 space-y-1">
                            {m.actions.files.map(f => (
                              <div key={f} className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                                <FileText className="w-3 h-3 opacity-40 shrink-0" />
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
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Architecting...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-50">
            <form onSubmit={handleSendMessage} className="relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Instruct the AI to build..."
                className="h-11 bg-gray-50 border-gray-100 pl-4 pr-12 rounded-lg text-sm transition-all focus:bg-white focus:ring-slate-900"
              />
              <Button type="submit" size="icon" disabled={isTyping} className="absolute right-1 top-1 h-9 w-9 bg-slate-900 text-white rounded-md hover:bg-black">
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
                      "h-full px-5 text-[10.5px] font-bold uppercase tracking-widest transition-all relative border-r border-gray-50",
                      activeTab === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="studio-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
                    )}
                  </button>
                ))}
             </div>
             <div className="pr-4 hidden md:block">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Instance v3.0.0_PROD</div>
             </div>
          </div>

          {/* Active Tab Surface */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50/20">
             <AnimatePresence mode="wait">
                {activeTab === "Preview" ? (
                  <motion.div 
                    key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden"
                  >
                    <div className="h-10 mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 shrink-0 shadow-sm">
                       <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setPreviewDevice("desktop")} className={cn("h-7 px-3 text-[10px] font-bold gap-2 rounded-lg", previewDevice === "desktop" ? "bg-slate-100 text-slate-900" : "text-slate-400")}>
                             <Monitor className="w-3.5 h-3.5" /> Desktop
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewDevice("mobile")} className={cn("h-7 px-3 text-[10px] font-bold gap-2 rounded-lg", previewDevice === "mobile" ? "bg-slate-100 text-slate-900" : "text-slate-400")}>
                             <Smartphone className="w-3.5 h-3.5" /> Mobile
                          </Button>
                       </div>
                       <div className="flex items-center gap-3">
                          <RotateCcw onClick={() => setPreviewLogs([])} className="w-3.5 h-3.5 text-slate-300 hover:text-slate-600 cursor-pointer" />
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 hover:text-slate-600 cursor-pointer" />
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                       <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-100/50 rounded-2xl border border-dashed border-gray-200">
                          <div className={cn(
                            "bg-white ring-1 ring-gray-100 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden relative",
                            previewDevice === "mobile" ? "w-[340px] h-[600px] rounded-[3rem] border-[10px] border-slate-900" : "w-full h-full rounded-2xl border border-gray-100"
                          )}>
                            {isTyping && (
                              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <Activity className="w-8 h-8 text-blue-600 animate-pulse mb-3" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-400 animate-pulse">Hot Reloading</span>
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
                       <div className="w-full lg:w-80 flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm h-48 lg:h-auto overflow-hidden">
                          <div className="h-9 px-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/20 shrink-0">
                             <div className="flex items-center gap-2">
                                <Terminal className="w-3 h-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Instance Console</span>
                             </div>
                             <span className="text-[8px] font-medium text-slate-300">SANDBOX_MODE</span>
                          </div>
                          <ScrollArea className="flex-1 p-4 font-mono text-[10px]">
                             <div className="space-y-2">
                                {previewLogs.length === 0 ? (
                                  <div className="text-slate-300 italic py-4">Waiting for logs...</div>
                                ) : (
                                  previewLogs.map(log => (
                                    <div key={log.id} className={cn(
                                      "p-2 rounded border transition-all",
                                      log.message.includes("ERROR") ? "bg-red-50/50 border-red-100 text-red-600" : "bg-gray-50/50 border-gray-100 text-slate-600"
                                    )}>
                                       <div className="flex justify-between mb-1 opacity-50">
                                          <span>{log.id.slice(0, 4)}</span>
                                          <span>{log.timestamp}</span>
                                       </div>
                                       <div className="break-all font-bold tracking-tight">{log.message}</div>
                                    </div>
                                  ))
                                )}
                             </div>
                          </ScrollArea>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === "Integrations" ? (
                  <motion.div 
                    key="integrations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 p-8 overflow-y-auto bg-gray-50/10"
                  >
                    <div className="max-w-4xl mx-auto space-y-8">
                       <div className="space-y-2">
                          <h2 className="text-xl font-black tracking-tight text-slate-900">Cloud Integrations</h2>
                          <p className="text-sm text-slate-500">Configure external services and database security for this project.</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Firebase Integration */}
                          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                 <Database className="w-6 h-6 text-orange-500" />
                               </div>
                               <div>
                                 <h3 className="text-sm font-bold text-slate-900">Firebase Firestore</h3>
                                 <p className="text-[11px] text-slate-400">Database & Real-time Sync</p>
                               </div>
                             </div>
                             
                             <div className="space-y-4">
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Project Security</label>
                                   <Button 
                                     onClick={() => handleSendMessage({ preventDefault: () => {}, target: { value: "Generate Firebase Security Rules for this project based on current features." } } as any)}
                                     variant="outline" 
                                     className="w-full h-10 border-blue-100 text-blue-600 hover:bg-blue-50 text-[11px] font-bold gap-2"
                                   >
                                     <ShieldCheck className="w-4 h-4" /> Generate firestore.rules
                                   </Button>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                   <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                                      <Lock className="w-3 h-3 text-slate-300" />
                                      <span>Current Role: Owner/Admin (Read-Write)</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Firebase Auth */}
                          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-6">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                 <Key className="w-6 h-6 text-blue-500" />
                               </div>
                               <div>
                                 <h3 className="text-sm font-bold text-slate-900">Firebase Auth</h3>
                                 <p className="text-[11px] text-slate-400">Identity & Access Control</p>
                               </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-2">
                                  <Mail className="w-4 h-4 text-slate-400" />
                                  <span className="text-[9px] font-bold uppercase text-slate-500">Email/Pass</span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center gap-2">
                                  <UserPlus className="w-4 h-4 text-slate-400" />
                                  <span className="text-[9px] font-bold uppercase text-slate-500">Google Auth</span>
                                </div>
                             </div>
                             <Button variant="ghost" className="w-full h-8 text-[10px] font-bold text-blue-600 hover:bg-blue-50">Configure Providers</Button>
                          </div>
                          
                          {/* Export Module */}
                          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm md:col-span-2 space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                                     <Cloud className="w-6 h-6 text-slate-500" />
                                   </div>
                                   <div>
                                     <h3 className="text-sm font-bold text-slate-900">VFS Deployment Strategy</h3>
                                     <p className="text-[11px] text-slate-400">Virtual File System Export & Sync</p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   <Button variant="outline" className="h-9 px-4 text-[11px] font-bold gap-2">
                                      <FileJson className="w-4 h-4" /> Download VFS (JSON)
                                   </Button>
                                   <Button className="h-9 px-4 bg-slate-900 text-white text-[11px] font-bold">Push to Production</Button>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : activeTab === "Code" ? (
                  <motion.div 
                    key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex-1 flex overflow-hidden bg-white"
                  >
                    <aside className="w-60 border-r border-gray-50 flex flex-col p-4 bg-gray-50/10">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 px-2">FileSystem</h3>
                       <div className="space-y-1">
                          {generatedFiles.map(file => (
                            <button
                              key={file.name}
                              onClick={() => setSelectedFile(file.name)}
                              className={cn(
                                "w-full text-left p-2.5 rounded-lg text-xs flex items-center gap-3 transition-all",
                                selectedFile === file.name ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-500 hover:bg-white hover:text-slate-800"
                              )}
                            >
                              <File className={cn("w-3.5 h-3.5", selectedFile === file.name ? "text-blue-500" : "text-slate-300")} />
                              <span className="truncate tracking-tight">{file.name}</span>
                            </button>
                          ))}
                       </div>
                    </aside>
                    <div className="flex-1 flex flex-col overflow-hidden">
                       <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-gray-50/10">
                          {selectedFile}
                          <span className="text-[9px] text-zinc-300 italic">Read-Only View</span>
                       </div>
                       <ScrollArea className="flex-1 p-8 bg-gray-50/5">
                          <pre className="text-[13px] font-mono leading-[1.8] text-slate-600 bg-white border border-gray-100 p-10 rounded-2xl shadow-inner select-all selection:bg-blue-100">
                            <code>{generatedFiles.find(f => f.name === selectedFile)?.content}</code>
                          </pre>
                       </ScrollArea>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-10 italic text-slate-300">
                     <Layers className="w-16 h-16 mb-4 opacity-5" />
                     <p className="text-[11px] font-bold uppercase tracking-[0.3em]">{activeTab} Interface Synchronizing...</p>
                  </div>
                )}
             </AnimatePresence>

             {/* Bottom Panel: Terminal */}
             <div className="h-44 border-t border-gray-100 bg-white flex flex-col shrink-0 group relative shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                <div className="h-9 px-6 border-b border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/20">
                   <div className="flex items-center gap-3">
                      <Terminal className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Build Runtime Logs</span>
                      <RotateCcw 
                        onClick={() => setTerminalLogs([])} 
                        className="w-3 h-3 text-slate-300 hover:text-slate-600 cursor-pointer transition-colors ml-2" 
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Active Pipeline</span>
                   </div>
                </div>
                <ScrollArea className="flex-1 p-5 font-mono text-[10.5px]">
                   <div className="space-y-1.5">
                      {terminalLogs.map(log => (
                        <div key={log.id} className="flex gap-6 group hover:translate-x-1 transition-all">
                          <span className="text-slate-300 italic shrink-0">[{log.timestamp}]</span>
                          <span className={cn(
                            "font-bold uppercase tracking-tight",
                            log.message.includes("ERROR") ? "text-red-500" : "text-slate-800"
                          )}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                   </div>
                </ScrollArea>
                <div className="absolute top-2 right-4 flex gap-2">
                   <Maximize2 className="w-3 h-3 text-slate-200 cursor-pointer hover:text-slate-900" />
                   <X className="w-3 h-3 text-slate-200 cursor-pointer hover:text-slate-900" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Floating Action for Mobile Interaction */}
      <Button 
        variant="ghost" size="icon" 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-slate-900 text-white shadow-2xl z-[100] md:hidden active:scale-95 border-2 border-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-6 h-6" />
      </Button>
    </div>
  );
}
