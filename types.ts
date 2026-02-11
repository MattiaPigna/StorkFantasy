
export type Role = 'P' | 'M';

export interface Player {
  id: string;
  name: string;
  team: string;
  role: Role;
  price: number;
  status: 'available' | 'injured' | 'suspended';
  goals: number; 
  assists: number;
}

export interface PlayerMatchStats {
  voto: number;
  goals: number;
  assists: number;
  ownGoals: number;
  yellowCard: boolean;
  redCard: boolean;
  extraPoints: number;
}

export interface Matchday {
  id: number;
  number: number;
  status: 'open' | 'calculated';
  votes: Record<string, PlayerMatchStats>;
  created_at?: string;
}

export interface UserTeam {
  teamName: string;
  managerName: string;
  playerIds: string[];
  currentLineupIds: string[];
  creditsLeft: number;
  totalPoints: number;
  logo?: string;
  isLineupConfirmed: boolean;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  team: UserTeam;
}

export interface Sponsor {
  id: string;
  name: string;
  type: string;
  logo_url: string;
  link_url?: string;
}

export interface AppSettings {
  leagueName: string;
  isMarketOpen: boolean;
  isLineupLocked: boolean;
  marketDeadline: string;
  currentMatchday: number;
  youtubeLiveUrl?: string;
  marqueeText?: string;
}

export interface FantasyRule {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'bonus' | 'malus';
}

// Added RuleEntry to match the usage in constants.ts
export interface RuleEntry {
  id: string;
  category: string;
  name: string;
  points: number;
  description: string;
}

export interface SpecialCard {
  id: string;
  name: string;
  description: string;
  effect: string;
  image_url?: string;
}

export interface TournamentRules {
  id: number;
  pdf_url?: string;
  html_content?: string;
}
