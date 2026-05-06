import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { Layout, WifiOff, Wifi } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { MainPanel } from './components/MainPanel';
import { Terminal } from './components/Terminal';
import { Message, GeneratedFile, MainTab, TerminalLog, UserProfile, GitHubUser, GitHubRepo } from './types';
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
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'idle'>('idle');
  const [commitMessage, setCommitMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewSrcDoc, setPreviewSrcDoc] = useState('');
  const sandboxRef = useRef<SandboxEngine | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
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

      // Check current GitHub session
      checkGitHubSession();
    };
    loadData();
  }, []);

  const checkGitHubSession = async (retries = 3) => {
    setIsCheckingSession(true);
    try {
      addTerminalLog('GITHUB_AUTH: Verifying session state...', 'system');
      const res = await fetch('/api/auth/github/me', { 
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      
      if (data.authenticated) {
        setGithubUser(data.user);
        addTerminalLog(`GITHUB_AUTH: Session established for ${data.user.login}`, 'system');
        fetchGitHubRepos();
        setIsCheckingSession(false);
        return true;
      } else if (retries > 0) {
        addTerminalLog(`GITHUB_AUTH: Handshake pending, retrying... (${retries} left)`, 'warn');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return checkGitHubSession(retries - 1);
      } else {
        addTerminalLog('GITHUB_AUTH: No active session found.', 'log');
        setIsCheckingSession(false);
        return false;
      }
    } catch (e) {
      addTerminalLog('GITHUB_AUTH_ERROR: Verification sequence interrupted', 'error');
      setIsCheckingSession(false);
      return false;
    }
  };

  const fetchGitHubRepos = async () => {
    try {
      addTerminalLog('GITHUB_API: Fetching repositories...', 'system');
      const res = await fetch('/api/github/repos', { credentials: 'include' });
      const data = await res.json();
      if (data.repos) {
        setGithubRepos(data.repos);
        addTerminalLog(`GITHUB_API: Successfully loaded ${data.repos.length} repositories`, 'system');
      }
    } catch (e) {
      addTerminalLog('GITHUB_API_ERROR: Failed to fetch repositories', 'error');
    }
  };

  const handleGitHubLogin = async () => {
    try {
      addTerminalLog('GITHUB_AUTH: Launching authentication sequence...', 'system');
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();
      
      if (data.error) {
        addTerminalLog(`GITHUB_AUTH_ERROR: ${data.error}`, 'error');
        return;
      }

      const { url, redirectUri } = data;
      addTerminalLog(`GITHUB_AUTH: Requested redirect_uri: ${redirectUri}`, 'system');
      addTerminalLog('GITHUB_AUTH: Verify this matches your GitHub App settings.', 'warn');
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'github_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        addTerminalLog('GITHUB_AUTH_ERROR: Popup blocked. Please enable popups.', 'error');
        return;
      }

      // Check for window closure or success message
      const pollTimer = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(pollTimer);
          addTerminalLog('GITHUB_AUTH: Auth window closed, verifying backend session...', 'system');
          // Delay verification slightly to allow cookies to settle
          setTimeout(checkGitHubSession, 1200);
        }
      }, 800);
    } catch (error) {
      addTerminalLog(`GITHUB_AUTH_ERROR: ${error}`, 'error');
    }
  };

  const handleGitHubLogout = async () => {
    try {
      await fetch('/api/auth/github/logout', { method: 'POST', credentials: 'include' });
      setGithubUser(null);
      setGithubRepos([]);
      setSelectedRepo(null);
      addTerminalLog('GITHUB_AUTH: Session terminated', 'system');
    } catch (error) {
      addTerminalLog(`GITHUB_AUTH_ERROR: Logout failed`, 'error');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      // 1. GitHub Auth Success signals
      if (data.type === 'GITHUB_AUTH_SUCCESS' || data === 'GITHUB_AUTH_SUCCESS') {
        addTerminalLog('GITHUB_AUTH: Success signal received...', 'system');
        checkGitHubSession(5); 
      }
      
      // 2. Runtime Event Mapping
      if (data.type === 'runtime_event' && data.payload) {
        const { type, message } = data.payload;
        if (type === 'log') addTerminalLog(message, 'log');
        if (type === 'error') addTerminalLog(message, 'error');
        if (type === 'warn') addTerminalLog(message, 'warn');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (messages.length === 0 && generatedFiles.length === 0) return;
      
      setSaveStatus('saving');
      try {
        await dbService.saveState({
          messages,
          generatedFiles,
          userProfile
        });
        setSaveStatus('saved');
        const timeout = setTimeout(() => setSaveStatus('idle'), 2000);
        return () => clearTimeout(timeout);
      } catch (e) {
        console.error("Save failed", e);
        setSaveStatus('idle');
      }
    };

    const timeout = setTimeout(saveData, 3000); // Increased debounce for stability
    return () => clearTimeout(timeout);
  }, [messages, generatedFiles, userProfile]);

  useEffect(() => {
    if (generatedFiles.length === 0) return;
    
    // Stabilize sandbox updates
    if (sandboxRef.current) {
      sandboxRef.current.destroy();
    }
    const engine = new SandboxEngine(generatedFiles);
    sandboxRef.current = engine;
    setPreviewSrcDoc(engine.generateSrcDoc());
    
    return () => {
      // Don't destroy immediately to prevent white screens during rapid typing
      // sandboxRef.current.destroy() is handled in next iteration or unmount
    };
  }, [generatedFiles]);

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
            if (idx > -1) {
              newFiles[idx] = { ...newFile, diffStatus: 'modified' };
            } else {
              newFiles.push({ ...newFile, diffStatus: 'added' });
            }
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
    } catch (error: any) {
      addTerminalLog(`FATAL_ERROR: VFS_SYNC_FAILED - ${error}`, 'error');
      const errorMessage = error.message.includes("high demand") || error.message.includes("503")
        ? error.message
        : 'Connection to architect failed. Please try again.';
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGitHubSync = async () => {
    if (!selectedRepo) {
      addTerminalLog('SYNC_ABORT: No repository selected as target', 'error');
      return;
    }

    setIsSyncing(true);
    addTerminalLog(`GIT_BRIDGE_INIT: Pushing ${generatedFiles.length} files to ${selectedRepo}`, 'system');
    
    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoFullName: selectedRepo,
          commitMessage: commitMessage || `Update from Lumina AI Studio v4 - ${new Date().toISOString()}`,
          files: generatedFiles
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addTerminalLog(`GIT_PUSH_SUCCESS: ${data.message}`, 'system');
        setCommitMessage('');
        setGeneratedFiles(prev => prev.map(f => ({ ...f, diffStatus: undefined })));
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error: any) {
      addTerminalLog(`GIT_PUSH_ERROR: ${error.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
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
    setGeneratedFiles(prev => prev.map(f => f.name === name ? { ...f, content, diffStatus: 'modified' } : f));
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans overflow-hidden selection:bg-gray-900 selection:text-white">
      <Navigation 
        saveStatus={saveStatus} 
        isOffline={isOffline} 
        userProfile={userProfile}
        githubUser={githubUser}
        onOpenProfile={() => setActiveTab('Profile')}
        onLogin={handleGitHubLogin}
        onLogout={handleGitHubLogout}
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
            previewSrcDoc={previewSrcDoc}
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
            githubUser={githubUser}
            isCheckingSession={isCheckingSession}
            githubRepos={githubRepos}
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
            onGitHubLogin={handleGitHubLogin}
            onGitHubLogout={handleGitHubLogout}
            onRefreshRepos={fetchGitHubRepos}
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
