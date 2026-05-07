import React, { useRef, useEffect } from 'react';
import { Send, FileText, CheckCircle2, History, RotateCcw, Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { Message } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isTyping: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ messages, input, setInput, onSendMessage, isTyping }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <aside className="w-[400px] border-r border-gray-100 bg-white flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between bg-gray-50/30">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Meta-Control</h2>
        <RotateCcw className="w-3.5 h-3.5 text-gray-300 cursor-pointer hover:text-gray-900 transition-colors" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/10">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={cn(
                "max-w-[92%] px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white rounded-[20px] rounded-br-[4px] shadow-gray-200 ml-4' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-[20px] rounded-bl-[4px] font-medium mr-4'
              )}>
                {msg.content}
              </div>
            </div>

            {msg.actions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mx-2 space-y-3 ml-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Modified Files
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {msg.actions.files.map((file) => (
                    <div 
                      key={file} 
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-6 h-6 rounded bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <FileText className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                        {file}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-[20px] rounded-bl-[4px] shadow-sm max-w-[200px]">
            <div className="flex gap-1.5 ml-1">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-2">Thinking</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() || selectedFile) onSendMessage(e);
          }} 
          className="relative bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900 transition-all flex flex-col p-2"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />
          {selectedFile && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2 mx-2 mt-2 mb-1">
              <span className="text-xs text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFile(null)} 
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove attachment"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What should we build today?"
            className="w-full bg-transparent border-transparent py-2 px-3 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none resize-none min-h-[44px] max-h-[200px]"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() || selectedFile) {
                  onSendMessage(e as any);
                  setSelectedFile(null); // Clear on send
                }
              }
            }}
          />
          <div className="flex items-center justify-between px-2 pt-2 pb-1 border-t border-gray-50/50 mt-1">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-2"
              title="Upload Image/Attachment"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-xs font-semibold">Attach</span>
            </button>
            <button 
              type="submit"
              onClick={() => setSelectedFile(null)}
              disabled={isTyping || (!input.trim() && !selectedFile)}
              className="w-8 h-8 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center font-sans"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
};
