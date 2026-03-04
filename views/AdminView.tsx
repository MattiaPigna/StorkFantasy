
import React from 'react';
import { Settings as SettingsIcon, ChevronLeft, PlusCircle, X, Save, Calculator, Trash2, RefreshCcw, FileText, Image as ImageIcon, Lock, Trash } from 'lucide-react';
import { Matchday, Player, Sponsor, FantasyRule, SpecialCard, TournamentRules, AppSettings, Role, PlayerMatchStats } from '../types';
import { ROLE_COLORS } from '../constants';
import { dbService } from '../services/dbService';

interface AdminViewProps {
  adminAuthenticated: boolean;
  setAdminAuthenticated: (val: boolean) => void;
  adminPass: string;
  setAdminPass: (val: string) => void;
  adminActiveTab: string;
  setAdminActiveTab: (tab: any) => void;
  setIsAdminPath: (path: boolean) => void;
  ADMIN_PASSWORD_REQUIRED: string;
  selectedMatchday: Matchday | null;
  setSelectedMatchday: (m: Matchday | null) => void;
  matchdayVotes: Record<string, PlayerMatchStats>;
  setMatchdayVotes: (v: any) => void;
  players: Player[];
  matchdays: Matchday[];
  sponsors: Sponsor[];
  fantasyRules: FantasyRule[];
  specialCards: SpecialCard[];
  settings: AppSettings | null;
  setSettings: (s: any) => void;
  tourneyHtml: string;
  setTourneyHtml: (val: string) => void;
  tourneyPdfFile: File | null;
  setTourneyPdfFile: (f: File | null) => void;
  tourneyInputRef: React.RefObject<HTMLInputElement>;
  sponsorLogoFile: File | null;
  setSponsorLogoFile: (f: File | null) => void;
  sponsorInputRef: React.RefObject<HTMLInputElement>;
  newSponsor: Partial<Sponsor>;
  setNewSponsor: (s: any) => void;
  newPlayer: Partial<Player>;
  setNewPlayer: (p: any) => void;
  newRule: Partial<FantasyRule>;
  setNewRule: (r: any) => void;
  newCard: Partial<SpecialCard>;
  setNewCard: (c: any) => void;
  cardImageFile: File | null;
  setCardImageFile: (f: File | null) => void;
  cardInputRef: React.RefObject<HTMLInputElement>;
  actionLoading: boolean;
  refreshData: () => void;
  handleSaveVotes: (calculated: boolean) => void;
  handleSaveSettings: () => void;
  handleSaveTournament: () => void;
  handleClearTournament: () => void;
  handleAddSponsor: () => void;
  handleAddCard: () => void;
  updateVote: (pid: string, field: keyof PlayerMatchStats, val: any) => void;
  ytInput: string;
  setYtInput: (val: string) => void;
  marqueeInput: string;
  setMarqueeInput: (val: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = (props) => {
  const {
    adminAuthenticated, setAdminAuthenticated, adminPass, setAdminPass, adminActiveTab, setAdminActiveTab,
    setIsAdminPath, ADMIN_PASSWORD_REQUIRED, selectedMatchday, setSelectedMatchday, matchdayVotes, setMatchdayVotes,
    players, matchdays, sponsors, fantasyRules, specialCards, settings, setSettings, tourneyHtml, setTourneyHtml,
    tourneyPdfFile, setTourneyPdfFile, tourneyInputRef, sponsorLogoFile, setSponsorLogoFile, sponsorInputRef,
    newSponsor, setNewSponsor, newPlayer, setNewPlayer, newRule, setNewRule, newCard, setNewCard, cardImageFile,
    setCardImageFile, cardInputRef, actionLoading, refreshData, handleSaveVotes, handleSaveSettings,
    handleSaveTournament, handleClearTournament, handleAddSponsor, handleAddCard, updateVote, ytInput, setYtInput, marqueeInput, setMarqueeInput
  } = props;

  if (!adminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 w-full">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
          <button onClick={() => setIsAdminPath(false)} className="mb-4 flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]"><ChevronLeft size={14}/> Torna alla Landing</button>
          <h1 className="text-xl font-black text-slate-900 text-center uppercase mb-6 italic">Accesso Amministratore</h1>
          <form onSubmit={(e) => { e.preventDefault(); if(adminPass === ADMIN_PASSWORD_REQUIRED) setAdminAuthenticated(true); else alert("Password Errata"); }} className="space-y-4">
            <input type="password" placeholder="Password Master" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-black border-2 border-transparent focus:border-orange-500 outline-none" required />
            <button type="submit" className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] tracking-widest">ENTRA</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 w-full pb-safe">
       <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
             <h1 className="text-xl font-black uppercase italic flex items-center gap-2 text-orange-950"><SettingsIcon size={20}/> Gestione Lega</h1>
             <div className="flex bg-slate-200 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
                {['matchdays', 'players', 'rules', 'cards', 'tournament', 'sponsors', 'settings'].map(tab => (
                  <button key={tab} onClick={() => setAdminActiveTab(tab)} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === tab ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>{tab}</button>
                ))}
             </div>
             <button onClick={() => setAdminAuthenticated(false)} className="bg-red-50 p-3 rounded-xl text-red-500"><X size={18}/></button>
          </div>

          {adminActiveTab === 'matchdays' && (
            selectedMatchday ? (
              <div className="bg-white p-6 rounded-[32px] shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <button onClick={() => setSelectedMatchday(null)} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><ChevronLeft size={16}/> Indietro</button>
                  <h2 className="text-lg font-black uppercase italic">Inserimento Voti: Gara {selectedMatchday.number}</h2>
                  <div className="flex gap-2">
                     <button onClick={() => handleSaveVotes(false)} disabled={actionLoading} className="px-4 py-2 bg-slate-100 rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Save size={14}/> Salva Bozza</button>
                     <button onClick={() => handleSaveVotes(true)} disabled={actionLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><Calculator size={14}/> Calcola Giornata</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="border-b font-black uppercase text-slate-400">
                        <th className="p-2">Giocatore</th><th className="p-2">Voto</th><th className="p-2">Gol</th><th className="p-2">Ass</th><th className="p-2">Aut</th><th className="p-2">Gia</th><th className="p-2">Ros</th><th className="p-2">Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map(p => {
                        const v = matchdayVotes[p.id] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
                        return (
                          <tr key={p.id} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-bold uppercase">{p.name} <span className="text-[8px] opacity-30">({p.team})</span></td>
                            <td className="p-2"><input type="number" step="0.5" className="w-12 p-1 border rounded" value={v.voto} onChange={e => updateVote(p.id, 'voto', parseFloat(e.target.value))} /></td>
                            <td className="p-2"><input type="number" className="w-10 p-1 border rounded" value={v.goals} onChange={e => updateVote(p.id, 'goals', parseInt(e.target.value))} /></td>
                            <td className="p-2"><input type="number" className="w-10 p-1 border rounded" value={v.assists} onChange={e => updateVote(p.id, 'assists', parseInt(e.target.value))} /></td>
                            <td className="p-2"><input type="number" className="w-10 p-1 border rounded" value={v.ownGoals} onChange={e => updateVote(p.id, 'ownGoals', parseInt(e.target.value))} /></td>
                            <td className="p-2"><input type="checkbox" checked={v.yellowCard} onChange={e => updateVote(p.id, 'yellowCard', e.target.checked)} /></td>
                            <td className="p-2"><input type="checkbox" checked={v.redCard} onChange={e => updateVote(p.id, 'redCard', e.target.checked)} /></td>
                            <td className="p-2"><input type="number" step="0.5" className="w-12 p-1 border rounded" value={v.extraPoints} onChange={e => updateVote(p.id, 'extraPoints', parseFloat(e.target.value))} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-black uppercase italic">Calendario Giornate</h3>
                    <button onClick={() => dbService.createMatchday(matchdays.length + 1).then(() => refreshData())} className="px-5 py-2.5 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] flex items-center gap-2"><PlusCircle size={14}/> NUOVA GIORNATA</button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matchdays.map(m => (
                       <div key={m.id} className="bg-white p-6 rounded-[24px] shadow border-l-4 border-orange-950 flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-4">
                             <p className="text-2xl font-black italic">G{m.number}</p>
                             <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${m.status === 'calculated' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>{m.status === 'calculated' ? 'Calcolata' : 'Aperta'}</span>
                          </div>
                          <button onClick={() => { setSelectedMatchday(m); setMatchdayVotes(m.votes || {}); }} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px]">GESTISCI VOTI</button>
                          <button onClick={() => { if(confirm("Sicuro?")) dbService.deleteMatchday(m.id).then(() => refreshData()); }} className="mt-2 text-center text-[8px] font-black uppercase text-red-300 hover:text-red-500">Elimina</button>
                       </div>
                    ))}
                 </div>
              </div>
            )
          )}

          {adminActiveTab === 'players' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h3 className="font-black uppercase italic mb-4">Aggiungi Calciatore</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input type="text" placeholder="Nome" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Squadra" value={newPlayer.team} onChange={e => setNewPlayer({...newPlayer, team: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <select value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value as Role})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm">
                    <option value="M">Movimento</option>
                    <option value="P">Portiere</option>
                  </select>
                  <input type="number" placeholder="Prezzo" value={newPlayer.price} onChange={e => setNewPlayer({...newPlayer, price: parseInt(e.target.value)})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                </div>
                <button onClick={() => dbService.upsertPlayer(newPlayer).then(() => {setNewPlayer({name:'', team:'', role:'M', price:10}); refreshData();})} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px]">AGGIUNGI</button>
              </div>
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 font-black uppercase"><tr><th className="p-4">Nome</th><th className="p-4">Team</th><th className="p-4">Ruolo</th><th className="p-4">Prezzo</th><th className="p-4 text-right">Azioni</th></tr></thead>
                  <tbody>
                    {players.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="p-4 font-bold uppercase">{p.name}</td>
                        <td className="p-4 uppercase opacity-50">{p.team}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-white font-black ${ROLE_COLORS[p.role]}`}>{p.role}</span></td>
                        <td className="p-4 font-black">{p.price} SK</td>
                        <td className="p-4 text-right"><button onClick={() => dbService.deletePlayer(p.id).then(() => refreshData())} className="text-red-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminActiveTab === 'rules' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h3 className="font-black uppercase italic mb-4">Nuova Regola Fanta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input type="text" placeholder="Nome Regola" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Descrizione" value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="number" step="0.5" placeholder="Punti" value={newRule.points} onChange={e => setNewRule({...newRule, points: parseFloat(e.target.value)})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <select value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value as 'bonus' | 'malus'})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm">
                    <option value="bonus">Bonus</option><option value="malus">Malus</option>
                  </select>
                </div>
                <button onClick={() => dbService.upsertFantasyRule(newRule).then(() => {setNewRule({name:'', description:'', points:1, type:'bonus'}); refreshData();})} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px]">SALVA REGOLA</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {['bonus', 'malus'].map(type => (
                   <div key={type} className="bg-white rounded-3xl shadow-lg overflow-hidden">
                     <div className={`p-4 font-black uppercase text-[10px] text-white ${type === 'bonus' ? 'bg-emerald-600' : 'bg-red-600'}`}>{type}</div>
                     <div className="divide-y">
                       {fantasyRules.filter(r => r.type === type).map(r => (
                         <div key={r.id} className="p-4 flex justify-between items-center">
                           <div><p className="font-bold uppercase text-xs">{r.name}</p><p className="text-[10px] opacity-50">{r.description}</p></div>
                           <div className="flex items-center gap-4"><span className="font-black text-sm">{r.points > 0 ? `+${r.points}` : r.points}</span><button onClick={() => dbService.deleteFantasyRule(r.id).then(() => refreshData())} className="text-slate-300 hover:text-red-500"><X size={14}/></button></div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {adminActiveTab === 'cards' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h3 className="font-black uppercase italic mb-4">Aggiungi Carta Speciale</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" placeholder="Nome Carta" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Descrizione" value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Effetto (es. +3 Gol)" value={newCard.effect} onChange={e => setNewCard({...newCard, effect: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <input type="file" ref={cardInputRef} className="hidden" onChange={e => setCardImageFile(e.target.files?.[0] || null)} />
                  <button onClick={() => cardInputRef.current?.click()} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><ImageIcon size={16}/> {cardImageFile ? cardImageFile.name : 'Carica Immagine'}</button>
                </div>
                <button onClick={handleAddCard} disabled={actionLoading} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px]">SALVA CARTA</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {specialCards.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl overflow-hidden shadow border flex flex-col relative group">
                    <button onClick={() => dbService.deleteSpecialCard(c.id).then(() => refreshData())} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"><X size={12}/></button>
                    <div className="h-32 bg-orange-950 p-2"><img src={c.image_url} className="w-full h-full object-contain" /></div>
                    <div className="p-3 text-center flex-1 flex flex-col justify-center"><p className="font-black uppercase text-[9px] line-clamp-1">{c.name}</p><p className="text-[7px] text-amber-600 font-bold uppercase">{c.effect}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminActiveTab === 'tournament' && (
            <div className="bg-white p-8 rounded-3xl shadow-lg space-y-6">
              <h3 className="font-black uppercase italic">Regolamento Torneo (HTML)</h3>
              <textarea value={tourneyHtml} onChange={e => setTourneyHtml(e.target.value)} className="w-full h-96 p-6 bg-slate-50 rounded-2xl border-none outline-none font-mono text-xs leading-relaxed" />
              <div className="flex flex-wrap items-center gap-4 pt-4">
                 <input type="file" ref={tourneyInputRef} className="hidden" onChange={e => setTourneyPdfFile(e.target.files?.[0] || null)} />
                 <button onClick={() => tourneyInputRef.current?.click()} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><FileText size={16}/> {tourneyPdfFile ? tourneyPdfFile.name : 'Carica PDF Regolamento'}</button>
                 <button onClick={handleClearTournament} disabled={actionLoading} className="px-6 py-3 bg-red-100 text-red-600 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-200 transition-colors">
                   <Trash size={16} /> Rimuovi Regolamento
                 </button>
              </div>
              <button onClick={handleSaveTournament} disabled={actionLoading} className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] shadow-lg hover:bg-orange-900 transition-all">AGGIORNA DOCUMENTI</button>
            </div>
          )}

          {adminActiveTab === 'sponsors' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h3 className="font-black uppercase italic mb-4">Nuovo Sponsor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input type="text" placeholder="Nome Sponsor" value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Tipo (es. Platinum)" value={newSponsor.type} onChange={e => setNewSponsor({...newSponsor, type: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                  <input type="text" placeholder="Link Sito" value={newSponsor.link_url} onChange={e => setNewSponsor({...newSponsor, link_url: e.target.value})} className="p-3 bg-slate-50 rounded-xl border-none outline-none font-bold text-sm" />
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <input type="file" ref={sponsorInputRef} className="hidden" onChange={e => setSponsorLogoFile(e.target.files?.[0] || null)} />
                  <button onClick={() => sponsorInputRef.current?.click()} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><ImageIcon size={16}/> {sponsorLogoFile ? sponsorLogoFile.name : 'Carica Logo'}</button>
                </div>
                <button onClick={handleAddSponsor} disabled={actionLoading} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px]">AGGIUNGI SPONSOR</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sponsors.map(s => (
                  <div key={s.id} className="bg-white p-4 rounded-3xl shadow border flex items-center gap-4 group">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 flex items-center justify-center"><img src={s.logo_url} className="w-full h-full object-contain" /></div>
                     <div className="flex-1 truncate"><p className="font-black uppercase text-xs truncate">{s.name}</p><p className="text-[9px] opacity-50 uppercase font-bold">{s.type}</p></div>
                     <button onClick={() => dbService.deleteSponsor(s.id).then(() => refreshData())} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminActiveTab === 'settings' && settings && (
            <div className="bg-white p-8 rounded-[40px] shadow-xl space-y-8">
               <h3 className="text-sm font-black uppercase italic text-orange-950">Parametri di Sistema</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div><p className="text-[11px] font-black uppercase">Mercato Aperto</p></div>
                        <input type="checkbox" checked={settings.isMarketOpen} onChange={e => setSettings({...settings, isMarketOpen: e.target.checked})} className="w-6 h-6" />
                     </div>
                     <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <div><p className="text-[11px] font-black uppercase">Formazioni Bloccate</p></div>
                        <input type="checkbox" checked={settings.isLineupLocked} onChange={e => setSettings({...settings, isLineupLocked: e.target.checked})} className="w-6 h-6" />
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold uppercase text-slate-400">Youtube Live URL</p>
                     <input type="text" value={ytInput} onChange={e => setYtInput(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="YouTube Live URL" />
                     <p className="text-[10px] font-bold uppercase text-slate-400">News Scorrimento (una per riga)</p>
                     <textarea value={marqueeInput} onChange={e => setMarqueeInput(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" rows={5} placeholder="Inserisci news... una per ogni riga." />
                  </div>
               </div>
               <button onClick={handleSaveSettings} disabled={actionLoading} className="w-full py-5 bg-orange-950 text-amber-500 rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl">SALVA CONFIGURAZIONE</button>
               <div className="pt-10 border-t flex flex-col items-center"><button onClick={() => { if(confirm("AZIONE ESTREMA: RESET TUTTO?")) dbService.resetAllStandings().then(() => refreshData()); }} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2 px-6 py-3 border-2 border-red-100 rounded-full hover:bg-red-50"><RefreshCcw size={14}/> RESET COMPLETO LEGA</button></div>
            </div>
          )}
       </div>
    </div>
  );
};
