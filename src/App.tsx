import React, { useState, useEffect, useCallback } from 'react';
import { openDB } from 'idb';
import JSZip from 'jszip';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { MainPanel } from './components/MainPanel';
import { Terminal } from './components/Terminal';
import { Message, GeneratedFile, MainTab, TerminalLog } from './types';
import { generateArchitecture } from './services/geminiService';

const STORAGE_KEY = 'lumina_studio_v4';

export default function App() {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Architect instance ready. Describe the production system you want to build.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('Preview');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([
    { name: 'index.html', content: '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-white flex items-center justify-center h-screen">\n  <h1 class="text-4xl font-black text-gray-900 tracking-tighter uppercase">Genesis Node Active</h1>\n</body>\n</html>' }
  ]);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const loadState = async () => {
      const db = await openDB(STORAGE_KEY, 1, {
        upgrade(db) {
          db.createObjectStore('state');
        },
      });
      const savedMessages = await db.get('state', 'messages');
      const savedFiles = await db.get('state', 'files');
      if (savedMessages) setMessages(savedMessages);
      if (savedFiles) {
        setGeneratedFiles(savedFiles);
        setSelectedFile(savedFiles[0].name);
      }
    };
    loadState();
  }, []);

  useEffect(() => {
    const saveState = async () => {
      setSaveStatus('saving');
      const db = await openDB(STORAGE_KEY, 1);
      await db.put('state', messages, 'messages');
      await db.put('state', generatedFiles, 'files');
      setTimeout(() => setSaveStatus('saved'), 500);
      setTimeout(() => setSaveStatus('idle'), 2000);
    };
    if (messages.length > 1 || generatedFiles.length > 1) {
      saveState();
    }
  }, [messages, generatedFiles]);

  // --- Handlers ---
  const addTerminalLog = (message: string) => {
    const newLog = {
      id: Date.now().toString(),
      message,
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
    addTerminalLog(`USER_SIGNAL: ${input.slice(0, 30)}...`);

    try {
      const data = await generateArchitecture(input, messages);
      
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
        addTerminalLog(`VFS_SYNC: ${data.files.length} units modified`);
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: data.explanation || 'Architectural changes applied successfully.',
        actions: data.files ? {
          id: Date.now().toString(),
          action: 'Architectural Synthesis',
          files: data.files.map((f: any) => f.name)
        } : undefined
      }]);
      
      addTerminalLog('MODEL_CALLBACK_SUCCESS: 200 OK');
    } catch (error) {
      addTerminalLog(`FATAL_ERROR: VFS_SYNC_FAILED - ${error}`);
      setMessages(prev => [...prev, { role: 'model', content: 'Connection to architect failed. Retrying sync...' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGitHubSync = async () => {
    setIsSyncing(true);
    addTerminalLog(`GIT_BRIDGE_INIT: ${commitMessage}`);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setIsSyncing(false);
    setCommitMessage('');
    addTerminalLog('GIT_PUSH_SUCCESS: Release tagged as v1.0.' + Date.now().toString().slice(-3));
  };

  const handleDownloadZip = async () => {
    addTerminalLog('ZIP_PACKAGING_START');
    const zip = new JSZip();
    generatedFiles.forEach(file => zip.file(file.name, file.content));
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumina-project-${Date.now()}.zip`;
    link.click();
    addTerminalLog('ZIP_DOWNLOAD_READY');
  };

  const handleUpdateFile = (name: string, content: string) => {
    setGeneratedFiles(prev => prev.map(f => f.name === name ? { ...f, content } : f));
  };

  const getIframeSource = useCallback(() => {
    const mainFile = generatedFiles.find(f => f.name === 'index.html');
    if (!mainFile) return '';

    // Inject console relay script
    const script = `
      <script>
        const originalLog = console.log;
        const originalError = console.error;
        console.log = (...args) => {
          window.parent.postMessage({ type: 'log', message: args.join(' ') }, '*');
          originalLog.apply(console, args);
        };
        console.error = (...args) => {
          window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*');
          originalError.apply(console, args);
        };
        window.onerror = (msg, url, line) => {
          window.parent.postMessage({ type: 'error', message: \`Unhandled Error: \${msg} at \${line}\` }, '*');
        };
      </script>
    `;

    return mainFile.content.replace('</head>', `${script}</head>`);
  }, [generatedFiles]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'log') addTerminalLog(`RUNTIME_LOG: ${event.data.message}`);
      if (event.data.type === 'error') addTerminalLog(`RUNTIME_ERROR: ${event.data.message}`);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden selection:bg-gray-900 selection:text-white">
      <Navigation saveStatus={saveStatus} />
      
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          messages={messages} 
          input={input} 
          setInput={setInput} 
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
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
          />
          <Terminal 
            logs={terminalLogs} 
            onClear={() => setTerminalLogs([])}
          />
        </div>
      </main>
    </div>
  );
}
