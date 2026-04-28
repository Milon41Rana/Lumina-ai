import React from 'react';
import { Terminal as TerminalIcon, RotateCcw, Maximize2, X } from 'lucide-react';
import { TerminalLog } from '../types';
import { cn } from '../lib/utils';

interface TerminalProps {
  logs: TerminalLog[];
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onClear }) => {
  return (
    <div className="h-44 border-t border-gray-100 bg-white flex flex-col shrink-0 relative group shadow-[0_-10px_30px_rgba(0,0,0,0.01)] transition-all">
      <div className="h-10 px-8 border-b border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Build Pipeline</span>
          </div>
          <RotateCcw 
            onClick={onClear} 
            className="w-3.5 h-3.5 text-gray-200 hover:text-gray-900 cursor-pointer transition-all ml-4" 
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-lg shadow-blue-100" />
          <span className="text-[9px] font-black text-gray-800 uppercase tracking-[0.15em]">System Instance Active</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] bg-white">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-gray-300 italic opacity-50 uppercase tracking-[0.1em] font-medium py-2">Waiting for signals...</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="flex gap-8 group hover:translate-x-1 transition-all duration-300">
                <span className="text-gray-200 font-bold shrink-0 select-none">[{log.timestamp}]</span>
                <span className={cn(
                  "font-bold uppercase tracking-tight",
                  log.message.includes("ERROR") ? "text-red-500" : "text-gray-700"
                )}>
                   {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="absolute top-2.5 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 className="w-3.5 h-3.5 text-gray-200 cursor-pointer hover:text-gray-900" />
        <X className="w-3.5 h-3.5 text-gray-200 cursor-pointer hover:text-gray-900" />
      </div>
    </div>
  );
};
