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
  type?: 'log' | 'error' | 'warn' | 'system';
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  actions?: ActionLog;
}

export type MainTab = 'Preview' | 'Code' | 'Versions' | 'Secrets' | 'Integrations' | 'GitHub' | 'Profile';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
}
