
import { Player, RuleEntry } from './types';

export const PLAYERS: Player[] = [
  { id: '1', name: 'Il Capitano', team: 'Birra Real', role: 'M', price: 45, status: 'available', goals: 0, assists: 0 },
  { id: '2', name: 'Bomber di Razza', team: 'NeroVerdi', role: 'M', price: 38, status: 'available', goals: 0, assists: 0 },
  { id: '3', name: 'Saracinesca', team: 'BlueStars', role: 'P', price: 25, status: 'available', goals: 0, assists: 0 },
  { id: '4', name: 'Il Geometra', team: 'BiancoNeri', role: 'M', price: 22, status: 'available', goals: 0, assists: 0 },
  { id: '5', name: 'Puntazza d\'Oro', team: 'Azzurri', role: 'M', price: 28, status: 'available', goals: 0, assists: 0 },
  { id: '6', name: 'Gatto delle Nevi', team: 'NeroVerdi', role: 'P', price: 18, status: 'available', goals: 0, assists: 0 },
  { id: '7', name: 'Zaino in Spalla', team: 'Birra Real', role: 'M', price: 12, status: 'available', goals: 0, assists: 0 },
  { id: '8', name: 'Polmone Infinito', team: 'BlueStars', role: 'M', price: 15, status: 'available', goals: 0, assists: 0 },
  { id: '9', name: 'L\'Eterno Secondo', team: 'BiancoNeri', role: 'M', price: 10, status: 'available', goals: 0, assists: 0 },
  { id: '10', name: 'Dribbling Folle', team: 'Azzurri', role: 'M', price: 20, status: 'available', goals: 0, assists: 0 },
];

export const ROLE_COLORS = {
  P: 'bg-amber-400',
  M: 'bg-emerald-600',
};

export const BONUS_RULES: RuleEntry[] = [
  { id: 'st1', category: 'Tecnico', name: 'Goal Segnato', points: 3, description: 'Bonus standard per ogni rete.' },
  { id: 'st2', category: 'Tecnico', name: 'Assist Servito', points: 1, description: 'Passaggio decisivo per il goal.' },
  { id: 'st3', category: 'Tecnico', name: 'Porta Inviolata', points: 1, description: 'Bonus solo per il Portiere se non subisce reti.' },
  { id: 'st4', category: 'Tecnico', name: 'Rigore Parato', points: 3, description: 'Prodezza estrema del numero 1.' },
  { id: 'b1', category: 'Goliardia', name: 'Tunnel (Nutmeg)', points: 5, description: 'Umore alto, palla tra le gambe.' },
  { id: 'b2', category: 'Goliardia', name: 'Publican Hero', points: 10, description: 'Porta le birre ghiacciate a fine match.' },
  { id: 'b3', category: 'Goliardia', name: 'Siuuu Reale', points: 5, description: 'Esultanza iconica eseguita perfettamente.' },
];

export const MALUS_RULES: RuleEntry[] = [
  { id: 'sm1', category: 'Tecnico', name: 'Autogoal', points: -2, description: 'Malus per sfortunata deviazione nella propria porta.' },
  { id: 'sm2', category: 'Tecnico', name: 'Ammonizione', points: -0.5, description: 'Cartellino Giallo.' },
  { id: 'sm3', category: 'Tecnico', name: 'Espulsione', points: -1, description: 'Cartellino Rosso.' },
  { id: 'sm4', category: 'Tecnico', name: 'Rigore Sbagliato', points: -3, description: 'Errore dal dischetto.' },
  { id: 'm1', category: 'Goliardia', name: 'Liscio Epico', points: -5, description: 'Calcio a vuoto clamoroso.' },
  { id: 'm2', category: 'Goliardia', name: 'Ritardo Cronico', points: -5, description: 'Arrivo a partita già iniziata.' },
];
