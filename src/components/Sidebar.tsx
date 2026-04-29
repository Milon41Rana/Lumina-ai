import React, { useRef, useEffect } from 'react';
import { Send, FileText, CheckCircle2, History, RotateCcw } from 'lucide-react';
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <aside className="w-[400px] border-r border-gray-100 bg-white flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="h-10 border-b border-gray-50 px-6 flex items-center justify-between bg-gray-50/30">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Meta-Control</h2>
        <RotateCcw className="w-3.5 h-3.5 text-gray-300 cursor-pointer hover:text-gray-900 transition-colors" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/5">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={cn(
                "max-w-[92%] px-5 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' 
                  : 'bg-white border border-gray-100 text-gray-700 font-medium'
              )}>
                {msg.content}
              </div>
            </div>

            {msg.actions && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm mx-2 space-y-3"
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
          <div className="flex items-center gap-3 p-4 bg-white border border-blue-100 rounded-2xl shadow-sm mx-2">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Architecting...</span>
          </div>
        )}
      </div>

      <div className="p-5 bg-white border-t border-gray-100">
        <form onSubmit={onSendMessage} className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What should we build today?"
            className="w-full bg-gray-50 border-transparent rounded-2xl py-3.5 pl-4 pr-12 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none h-14 transition-all shadow-inner"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendMessage(e as any);
              }
            }}
          />
          <button 
            type="submit"
            disabled={isTyping}
            className="absolute bottom-2.5 right-2 w-9 h-9 bg-gray-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center font-sans mt-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
  );
};
