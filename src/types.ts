export interface GeneratedFile {
  name: string;
  content: string;
  diffStatus?: 'added' | 'modified';
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

export interface GitHubUser {
  name: string;
  avatar: string;
  login: string;
  email?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}
