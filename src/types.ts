export interface GeneratedFile {
  name: string;
  content: string;
}

export interface ActionLog {
  id: string;
  action: string;
  files: string[];
}

export interface TerminalLog {
  id: string;
  message: string;
  timestamp: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  actions?: ActionLog;
}

export type MainTab = 'Preview' | 'Code' | 'Versions' | 'Secrets' | 'Integrations' | 'GitHub';
