import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { Layout, WifiOff, Wifi } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { MainPanel } from './components/MainPanel';
import { Terminal } from './components/Terminal';
import { Message, GeneratedFile, MainTab, TerminalLog, UserProfile } from './types';
import { SandboxEngine } from './lib/sandbox';
import { dbService } from './lib/db';
import { useOffline } from './hooks/useOffline';

export default function App() {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Preview');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const sandboxRef = useRef<SandboxEngine | null>(null);
  const isOffline = useOffline();

  // --- Persistence ---
  useEffect(() => {
    const loadData = async () => {
      const state = await dbService.loadState();
      setMessages(state.messages);
      setGeneratedFiles(state.generatedFiles);
      setUserProfile(state.userProfile);
      if (state.generatedFiles.length > 0) {
        setSelectedFile(state.generatedFiles[0].name);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (messages.length === 0 && generatedFiles.length === 0) return;
      
      setSaveStatus('saving');
      await dbService.saveState({
        messages,
        generatedFiles,
        userProfile
      });
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [messages, generatedFiles, userProfile]);

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    addTerminalLog('PROFILE_UPDATED: Local identity synced to IndexedDB', 'system');
  };

  // --- Handlers ---
  const addTerminalLog = (message: string, type: TerminalLog['type'] = 'system') => {
    const newLog: TerminalLog = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    };
    setTerminalLogs(prev => [...prev.slice(-100), newLog]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    addTerminalLog(`USER_SIGNAL: ${input.slice(0, 30)}...`, 'system');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: messages.concat(userMessage) }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate');
      }

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        setGeneratedFiles(prev => {
          const newFiles = [...prev];
          data.files.forEach((newFile: GeneratedFile) => {
            const idx = newFiles.findIndex(f => f.name === newFile.name);
            if (idx > -1) newFiles[idx] = newFile;
            else newFiles.push(newFile);
          });
          return newFiles;
        });
        addTerminalLog(`VFS_SYNC: ${data.files.length} units modified`, 'system');
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: data.explanation || 'Architectural changes applied successfully.',
        actions: (data.files && data.files.length > 0) ? {
          id: Date.now().toString(),
          action: 'Architectural Synthesis',
          files: data.files.map((f: any) => f.name)
        } : undefined
      }]);
      
      addTerminalLog('MODEL_CALLBACK_SUCCESS: 200 OK', 'system');
    } catch (error) {
      addTerminalLog(`FATAL_ERROR: VFS_SYNC_FAILED - ${error}`, 'error');
      setMessages(prev => [...prev, { role: 'model', content: 'Connection to architect failed. Retrying sync...' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGitHubSync = async () => {
    setIsSyncing(true);
    addTerminalLog(`GIT_BRIDGE_INIT: ${commitMessage}`, 'system');
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setIsSyncing(false);
    setCommitMessage('');
    addTerminalLog('GIT_PUSH_SUCCESS: Release tagged as v1.0.' + Date.now().toString().slice(-3), 'system');
  };

  const handleDownloadZip = async () => {
    addTerminalLog('ZIP_PACKAGING_START', 'system');
    const zip = new JSZip();
    generatedFiles.forEach(file => zip.file(file.name, file.content));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina-project-${Date.now()}.zip`;
    link.click();
    addTerminalLog('ZIP_DOWNLOAD_READY', 'system');
  };

  const handleUpdateFile = (name: string, content: string) => {
    setGeneratedFiles(prev => prev.map(f => f.name === name ? { ...f, content } : f));
  };

  const getIframeSource = useCallback(() => {
    if (sandboxRef.current) {
      sandboxRef.current.destroy();
    }
    sandboxRef.current = new SandboxEngine(generatedFiles);
    return sandboxRef.current.generateSrcDoc();
  }, [generatedFiles]);

  useEffect(() => {
    return () => {
      if (sandboxRef.current) {
        sandboxRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === 'runtime_event') {
        const { type, message } = data.payload;
        if (type === 'log') addTerminalLog(message, 'log');
        if (type === 'error') addTerminalLog(message, 'error');
        if (type === 'warn') addTerminalLog(message, 'warn');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden selection:bg-gray-900 selection:text-white">
      <Navigation 
        saveStatus={saveStatus} 
        isOffline={isOffline} 
        userProfile={userProfile}
        onOpenProfile={() => setActiveTab('Profile')}
      />
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="hidden md:flex shrink-0">
          <Sidebar 
            messages={messages} 
            input={input} 
            setInput={setInput} 
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <MainPanel 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            generatedFiles={generatedFiles}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            previewDevice={previewDevice}
            setPreviewDevice={setPreviewDevice}
            isTyping={isTyping}
            getIframeSource={getIframeSource}
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            onGitHubSync={handleGitHubSync}
            isSyncing={isSyncing}
            onDownloadZip={handleDownloadZip}
            onUpdateFile={handleUpdateFile}
            terminalLogs={terminalLogs}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            isOffline={isOffline}
          />
          <Terminal 
            logs={terminalLogs} 
            onClear={() => setTerminalLogs([])}
          />
        </div>

        {/* Mobile Sidebar Overlay (Simplified) */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
           <button 
             onClick={() => setActiveTab('Preview')}
             className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-2xl flex items-center justify-center"
           >
             <Layout className="w-5 h-5" />
           </button>
        </div>
      </main>
    </div>
  );
}
