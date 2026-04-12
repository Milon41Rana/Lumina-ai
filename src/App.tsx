import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Sparkles, Bot, User, Loader2, Settings2 } from "lucide-react";
import { Sidebar } from "@/src/components/Sidebar";
import { ChatInput } from "@/src/components/ChatInput";
import { Markdown } from "@/src/components/Markdown";
import { SettingsDialog } from "@/src/components/SettingsDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatSession, Message } from "@/src/lib/gemini";
import { cn } from "@/lib/utils";

export default function App() {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [isTyping, setIsTyping] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load sessions from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("lumina_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Save sessions to localStorage
  React.useEffect(() => {
    localStorage.setItem("lumina_sessions", JSON.stringify(sessions));
  }, [sessions]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [sessions, currentSessionId, isTyping]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      const newId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: newId,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newId);
      // Continue with the new ID
      processMessage(newId, content);
    } else {
      processMessage(currentSessionId, content);
    }
  };

  const processMessage = async (sessionId: string, content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              updatedAt: Date.now(),
              title: s.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? "..." : "") : s.title,
            }
          : s
      )
    );

    setIsTyping(true);

    try {
      const session = sessions.find((s) => s.id === sessionId);
      const history = session?.messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      })) || [];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          history: history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch from API: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullResponse = "";
      const modelMessageId = crypto.randomUUID();

      // Add initial empty model message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  { id: modelMessageId, role: "model", content: "", timestamp: Date.now() },
                ],
              }
            : s
        )
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === modelMessageId ? { ...m, content: fullResponse } : m
                  ),
                }
              : s
          )
        );
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "model",
                    content: "Sorry, I encountered an error. Please check your API key or try again later.",
                    timestamp: Date.now(),
                  },
                ],
              }
            : s
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const handleClearHistory = () => {
    setSessions([]);
    setCurrentSessionId(null);
    setIsSettingsOpen(false);
    localStorage.removeItem("lumina_sessions");
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={handleDeleteSession}
        onToggleSettings={() => setIsSettingsOpen(true)}
        className="hidden md:flex"
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r-sidebar-border">
                <Sidebar
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onNewChat={handleNewChat}
                  onSelectSession={(id) => {
                    setCurrentSessionId(id);
                    setIsSidebarOpen(false);
                  }}
                  onDeleteSession={handleDeleteSession}
                  onToggleSettings={() => {
                    setIsSettingsOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full border-r-0"
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Lumina AI
              <span className="text-muted-foreground font-normal ml-1">3.0 Flash</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-2">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">How can I help you today?</h1>
                <p className="text-muted-foreground max-w-sm">
                  Lumina is your intelligent companion for coding, writing, and creative exploration.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-8">
                  {[
                    "Write a Python script for data analysis",
                    "Explain quantum computing simply",
                    "Help me plan a 3-day trip to Tokyo",
                    "Write a professional email for a job application"
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4 text-left font-normal text-sm hover:bg-muted/50"
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              currentSession.messages.map((message, idx) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex gap-4 max-w-[85%] md:max-w-[80%]",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn(
                      "rounded-2xl px-4 py-3",
                      message.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted/30"
                    )}>
                      {message.content ? (
                        <Markdown content={message.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground italic text-sm">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {isTyping && !currentSession?.messages.find(m => m.role === 'model' && !m.content) && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted/30 rounded-2xl px-4 py-3 flex items-center gap-2 text-muted-foreground italic text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
          <ChatInput onSend={handleSendMessage} disabled={isTyping} />
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Lumina can make mistakes. Check important info.
          </p>
        </div>
      </main>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <SettingsDialog onClearHistory={handleClearHistory} />
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
