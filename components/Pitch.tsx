
import React from 'react';
import { Player, PlayerMatchStats } from '../types';
import { ROLE_COLORS } from '../constants';
import { UserMinus, UserPlus, Zap } from 'lucide-react';

interface PitchProps {
  starters: Player[];
  bench: Player[];
  onSetStarter: (player: Player) => void;
  onSetBench: (player: Player) => void;
  isLocked: boolean;
  votes?: Record<string, PlayerMatchStats>; 
}

const PitchPlayer: React.FC<{ 
  player: Player; 
  onClick: () => void; 
  isLocked: boolean; 
  mode: 'starter' | 'bench';
  stats?: PlayerMatchStats;
}> = ({ player, onClick, isLocked, mode, stats }) => {
  
  const totalScore = stats && stats.voto > 0 ? (
    (stats.voto || 0) + 
    (stats.goals * 3) + 
    (stats.assists * 1) - 
    (stats.ownGoals * 2) - 
    (stats.yellowCard ? 0.5 : 0) - 
    (stats.redCard ? 1 : 0) + 
    (stats.extraPoints || 0)
  ) : null;

  return (
    <div 
      onClick={!isLocked ? onClick : undefined}
      className={`flex flex-col items-center gap-1 transition-all relative ${!isLocked ? 'hover:scale-105 cursor-pointer active:scale-95' : 'opacity-90'}`}
    >
      {totalScore !== null && (
        <div className="absolute -top-10 flex flex-col items-center z-50 pointer-events-none fade-in">
          <div className="flex gap-0.5 mb-1">
            {stats && stats.goals > 0 && (
              <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-lg border border-white">G</div>
            )}
            {stats && stats.yellowCard && (
              <div className="w-3 h-4 bg-yellow-400 rounded-sm border border-white shadow-lg" />
            )}
            {stats && stats.redCard && (
              <div className="w-3 h-4 bg-red-600 rounded-sm border border-white shadow-lg" />
            )}
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[11px] font-black shadow-xl border border-white flex items-center gap-1 ${totalScore >= 6 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {totalScore.toFixed(1)}
          </div>
        </div>
      )}

      <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 ${mode === 'starter' ? 'border-white shadow-lg' : 'border-slate-300'} flex items-center justify-center text-white font-black text-lg ${ROLE_COLORS[player.role]} overflow-visible transition-colors`}>
        {player.name[0]}
        
        {!isLocked && (
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white border border-white shadow-md ${mode === 'starter' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
            {mode === 'starter' ? <UserMinus size={12} /> : <UserPlus size={12} />}
          </div>
        )}
      </div>
      <div className="bg-orange-950/90 text-white text-[9px] sm:text-[10px] px-2 py-1 rounded-lg font-bold shadow-lg border border-white/10 whitespace-nowrap uppercase tracking-tighter flex flex-col items-center">
        <span>{player.name}</span>
      </div>
    </div>
  );
};

export const Pitch: React.FC<PitchProps> = ({ starters, bench, onSetStarter, onSetBench, isLocked, votes }) => {
  const startersM = starters.filter(p => p.role === 'M');
  const starterP = starters.find(p => p.role === 'P');

  return (
    <div className="space-y-6">
      <div className="relative w-full aspect-[4/5] max-w-sm mx-auto bg-blue-900 rounded-3xl overflow-hidden border-8 border-slate-800 shadow-2xl concrete-texture">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-orange-600/20 border-b-2 border-white/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-orange-600/20 border-t-2 border-white/30" />
        
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-4 border-2 border-white/20 rounded-xl" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/20" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-around py-12 px-6 z-10">
          <div className="flex justify-around items-center">
             {startersM.slice(0, 2).map((p) => (
               <PitchPlayer key={p.id} player={p} onClick={() => onSetBench(p)} isLocked={isLocked} mode="starter" stats={votes?.[p.id]} />
             ))}
          </div>
          <div className="flex justify-around items-center">
             {startersM.slice(2, 4).map((p) => (
               <PitchPlayer key={p.id} player={p} onClick={() => onSetBench(p)} isLocked={isLocked} mode="starter" stats={votes?.[p.id]} />
             ))}
          </div>
          <div className="flex justify-center items-center">
            {starterP && <PitchPlayer player={starterP} onClick={() => onSetBench(starterP)} isLocked={isLocked} mode="starter" stats={votes?.[starterP.id]} />}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-orange-100">
         <h3 className="text-sm font-black text-orange-950 uppercase mb-4 italic tracking-tighter flex items-center gap-2">
           <Zap className="text-amber-500" size={16} fill="currentColor" /> Panchina
         </h3>
         {bench.length === 0 ? (
           <div className="text-center py-6 text-slate-300 font-bold uppercase text-[10px] border-2 border-dashed border-slate-50 rounded-2xl">
             Nessun giocatore
           </div>
         ) : (
           <div className="flex flex-wrap justify-center gap-4">
              {bench.map(p => (
                <PitchPlayer key={p.id} player={p} onClick={() => onSetStarter(p)} isLocked={isLocked} mode="bench" stats={votes?.[p.id]} />
              ))}
           </div>
         )}
      </div>
    </div>
  );
};
