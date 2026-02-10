import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingCart, Shield, LogOut, Key, LayoutPanelLeft, BarChart3, Trash2, CheckCircle, X, Save, AlertTriangle, UserPlus, Star, Settings as SettingsIcon, ChevronLeft, PlusCircle, Search, RefreshCcw, Loader2, Zap, Edit3, Calculator, Send, Unlock, Lock, Video, Info, Camera, Upload, Award, Coffee, Pizza, Zap as ZapIcon, RotateCcw } from 'lucide-react';
import { ROLE_COLORS } from './constants';
import { Player, UserTeam, AppSettings, User, Role, PlayerMatchStats, Matchday, Sponsor } from './types';
import { Pitch } from './components/Pitch';
import { dbService, supabase } from './services/dbService';

const ADMIN_PASSWORD_REQUIRED = "stork2025";

const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const id = (match && match[2].length === 11) ? match[2] : null;
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : null;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authData, setAuthData] = useState({ email: '', password: '', teamName: '', managerName: '' });
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAdminPath, setIsAdminPath] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'matchdays' | 'players' | 'sponsors' | 'settings'>('matchdays');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'lineup' | 'market' | 'standings'>('home');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [ytInput, setYtInput] = useState('');
  const [marqueeInput, setMarqueeInput] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [selectedMatchday, setSelectedMatchday] = useState<Matchday | null>(null);
  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({ name: '', type: '' });
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const sponsorInputRef = useRef<HTMLInputElement>(null);

  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({ name: '', team: '', role: 'M', price: 10 });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [p, s, u, m, sp] = await Promise.all([
        dbService.getPlayers(),
        dbService.getSettings(),
        dbService.getAllProfiles(),
        dbService.getMatchdays(),
        dbService.getSponsors()
      ]);
      setPlayers(p || []);
      setSettings(s || null);
      if (s) {
        setYtInput(s.youtubeLiveUrl || '');
        setMarqueeInput(s.marqueeText || '');
      }
      setAllUsers(u || []);
      setMatchdays(m || []);
      setSponsors(sp || []);
      
      if (selectedMatchday) {
        const updated = (m || []).find(x => x.id === selectedMatchday.id);
        if (updated) setSelectedMatchday(updated);
      }
    } catch (err) {
      console.error("Refresh error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchdays' }, () => {
        refreshData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        refreshData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await dbService.getProfile(session.user.id);
          if (profile) {
            setCurrentUser(profile);
            await refreshData(false);
          } else {
            setCurrentUser(null);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await dbService.getProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setAuthError(null);
    try {
      if (authMode === 'signup') {
        await dbService.signUp(authData.email, authData.password, { teamName: authData.teamName, managerName: authData.managerName });
        alert("Account creato con successo! Ora puoi accedere.");
        setAuthMode('login');
      } else {
        const { user } = await dbService.signIn(authData.email, authData.password);
        if (user) {
          const profile = await dbService.getProfile(user.id);
          if (profile) {
             setCurrentUser(profile);
             await refreshData(false);
          } else {
             throw new Error("Impossibile trovare il profilo utente.");
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Errore durante l'autenticazione.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await dbService.signOut();
  };

  const confirmLineup = async () => {
    if (!currentUser || !settings || settings.isLineupLocked || currentUser.team.isLineupConfirmed) return;
    if (currentUser.team.currentLineupIds.length < 5) {
      alert("Devi schierare 5 giocatori!");
      return;
    }
    setActionLoading(true);
    try {
      await dbService.confirmLineup(currentUser.id, settings.currentMatchday, currentUser.team.currentLineupIds);
      const updatedProfile = await dbService.getProfile(currentUser.id);
      if (updatedProfile) setCurrentUser(updatedProfile);
      showNotification("Formazione consegnata!");
    } catch (error) {
      console.error(error);
      alert("Errore salvataggio formazione.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSponsor = async () => {
    if (!newSponsor.name || !sponsorLogoFile) return alert("Nome e Logo obbligatori!");
    setActionLoading(true);
    try {
      const url = await dbService.uploadFile('sponsor', 'sponsor-logos', sponsorLogoFile);
      await dbService.upsertSponsor({ ...newSponsor, logo_url: url });
      setNewSponsor({ name: '', type: '' });
      setSponsorLogoFile(null);
      showNotification("Sponsor salvato!");
      await refreshData(false);
    } catch (e: any) {
      alert("Errore caricamento sponsor.");
    } finally {
      setActionLoading(false);
    }
  };

  const saveAdminSettings = async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      const updated = { ...settings, youtubeLiveUrl: ytInput, marqueeText: marqueeInput };
      await dbService.updateSettings(updated);
      setSettings(updated);
      showNotification("Impostazioni salvate!");
    } catch (e) {
      alert("Errore salvataggio impostazioni.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStat = (pid: string, key: keyof PlayerMatchStats, val: any) => {
    if (!selectedMatchday || selectedMatchday.status === 'calculated') return;
    const newVotes = { ...selectedMatchday.votes };
    const current = newVotes[pid] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
    let finalVal = val;
    if (typeof current[key] === 'number') {
      finalVal = val === '' ? 0 : parseFloat(val);
      if (isNaN(finalVal)) finalVal = 0;
    }
    newVotes[pid] = { ...current, [key]: finalVal };
    setSelectedMatchday({ ...selectedMatchday, votes: newVotes });
  };

  const currentStarters = currentUser?.team.currentLineupIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];
  const latestCalculatedMatchday = matchdays.find(m => m.status === 'calculated');
  const ytEmbedUrl = getYouTubeEmbedUrl(settings?.youtubeLiveUrl);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <Loader2 className="animate-spin text-orange-950 mb-4" size={48} />
      <p className="font-black uppercase text-[10px] tracking-widest italic text-orange-950">Lega in Caricamento...</p>
    </div>
  );

  return (
    <div className="pb-24 lg:pb-0 lg:pl-64 min-h-screen bg-slate-50 relative font-sans">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-white px-6 py-2 rounded-full font-bold uppercase text-[10px] shadow-xl flex items-center gap-2">
          <CheckCircle size={14} /> {notification}
        </div>
      )}

      {isAdminPath ? (
        !adminAuthenticated ? (
          <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
              <button onClick={() => setIsAdminPath(false)} className="mb-4 flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]"><ChevronLeft size={14}/> Esci</button>
              <h1 className="text-xl font-black text-slate-900 text-center uppercase mb-6 italic">Area Admin</h1>
              <form onSubmit={(e) => { e.preventDefault(); if(adminPass === ADMIN_PASSWORD_REQUIRED) setAdminAuthenticated(true); else alert("Password Errata"); }} className="space-y-4">
                <input type="password" placeholder="Password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                <button type="submit" className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] tracking-widest">ENTRA</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
             <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                   <h1 className="text-xl font-black uppercase italic flex items-center gap-2 text-orange-950"><SettingsIcon size={20}/> Gestione</h1>
                   <div className="flex bg-slate-200 p-1 rounded-xl gap-1 overflow-x-auto">
                      <button onClick={() => { setSelectedMatchday(null); setAdminActiveTab('matchdays'); }} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] ${adminActiveTab === 'matchdays' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Giornate</button>
                      <button onClick={() => { setSelectedMatchday(null); setAdminActiveTab('players'); }} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] ${adminActiveTab === 'players' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Giocatori</button>
                      <button onClick={() => { setSelectedMatchday(null); setAdminActiveTab('sponsors'); }} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] ${adminActiveTab === 'sponsors' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Sponsor</button>
                      <button onClick={() => { setSelectedMatchday(null); setAdminActiveTab('settings'); }} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] ${adminActiveTab === 'settings' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Setup</button>
                   </div>
                   <button onClick={() => setAdminAuthenticated(false)} className="bg-red-50 p-3 rounded-xl text-red-500"><X size={18}/></button>
                </div>

                {adminActiveTab === 'players' && (
                  <div className="space-y-6">
                     <div className="bg-white p-6 rounded-2xl shadow">
                        <h3 className="text-sm font-black uppercase italic mb-4">Aggiungi Calciatore</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                           <input type="text" placeholder="Nome" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="p-3 rounded-xl border text-xs" />
                           <input type="text" placeholder="Team" value={newPlayer.team} onChange={e => setNewPlayer({...newPlayer, team: e.target.value})} className="p-3 rounded-xl border text-xs" />
                           <select value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value as Role})} className="p-3 rounded-xl border text-xs">
                              <option value="P">Portiere</option>
                              <option value="M">Movimento</option>
                           </select>
                           <input type="number" placeholder="SK" value={newPlayer.price} onChange={e => setNewPlayer({...newPlayer, price: parseInt(e.target.value) || 0})} className="p-3 rounded-xl border text-xs" />
                        </div>
                        <button onClick={() => dbService.upsertPlayer(newPlayer).then(() => { setNewPlayer({name:'', team:'', role:'M', price:10}); refreshData(); })} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest">SALVA</button>
                     </div>
                     <div className="bg-white p-4 rounded-2xl shadow overflow-x-auto">
                        <table className="w-full text-[10px] text-left">
                           <thead>
                              <tr className="border-b font-black uppercase">
                                 <th className="p-2">Nome</th>
                                 <th className="p-2">Squadra</th>
                                 <th className="p-2">Ruolo</th>
                                 <th className="p-2">SK</th>
                                 <th className="p-2 text-right">Azioni</th>
                              </tr>
                           </thead>
                           <tbody>
                              {players.map(p => (
                                 <tr key={p.id} className="border-b hover:bg-slate-50">
                                    <td className="p-2 font-bold uppercase">{p.name}</td>
                                    <td className="p-2 uppercase opacity-40">{p.team}</td>
                                    <td className="p-2"><span className={`px-2 py-0.5 rounded text-white font-black ${ROLE_COLORS[p.role]}`}>{p.role}</span></td>
                                    <td className="p-2 font-black">{p.price}</td>
                                    <td className="p-2 text-right"><button onClick={() => { if(confirm("Eliminare giocatore?")) dbService.deletePlayer(p.id).then(() => refreshData()); }} className="text-red-500"><Trash2 size={14}/></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {adminActiveTab === 'matchdays' && !selectedMatchday && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-2">
                       <h3 className="text-sm font-black uppercase italic">Giornate Gara</h3>
                       <button onClick={() => dbService.createMatchday(matchdays.length + 1).then(() => refreshData())} className="px-4 py-2 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] flex items-center gap-2">
                          <PlusCircle size={14}/> NUOVA GARA
                       </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {matchdays.map(m => (
                         <div key={m.id} className="bg-white p-6 rounded-2xl shadow border-l-4 border-orange-950 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                               <p className="text-2xl font-black italic">G{m.number}</p>
                               <span className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase ${m.status === 'calculated' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                  {m.status === 'calculated' ? 'Finita' : 'Aperta'}
                               </span>
                            </div>
                            <div className="space-y-2">
                               <button onClick={() => setSelectedMatchday(m)} className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold uppercase text-[9px]">
                                  {m.status === 'calculated' ? 'VEDI VOTI' : 'INSERISCI VOTI'}
                               </button>
                               <div className="flex gap-2">
                                  {m.status === 'calculated' && <button onClick={() => { if(confirm("Riaprire la giornata? I voti torneranno modificabili.")) dbService.saveMatchdayVotes(m.id, m.votes, 'open').then(() => refreshData()); }} className="flex-1 py-2 bg-amber-50 text-amber-600 rounded-lg font-bold text-[8px] uppercase">RIAPRI</button>}
                                  <button onClick={() => { if(confirm("Eliminare giornata? I punti saranno sottratti dalla classifica.")) dbService.deleteMatchday(m.id).then(() => refreshData()); }} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={14}/></button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {selectedMatchday && (
                  <div className="bg-white p-4 rounded-2xl shadow space-y-4">
                    <div className="flex justify-between items-center border-b pb-4">
                        <button onClick={() => setSelectedMatchday(null)} className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[9px]"><ChevronLeft size={14}/> Torna</button>
                        <div className="text-center">
                           <h3 className="font-black uppercase text-lg italic">G{selectedMatchday.number}</h3>
                           <p className={`text-[8px] font-black ${selectedMatchday.status === 'calculated' ? 'text-red-500' : 'text-emerald-500'}`}>
                              {selectedMatchday.status === 'calculated' ? 'GIORNATA CHIUSA' : 'GIORNATA APERTA'}
                           </p>
                        </div>
                        <div className="flex gap-2">
                           {selectedMatchday.status === 'calculated' ? (
                             <button onClick={() => { if(confirm("Riaprire la giornata?")) dbService.saveMatchdayVotes(selectedMatchday.id, selectedMatchday.votes, 'open').then(() => refreshData()); }} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-[9px] uppercase">Riapri</button>
                           ) : (
                             <>
                               <button onClick={() => dbService.saveMatchdayVotes(selectedMatchday.id, selectedMatchday.votes).then(() => showNotification("Voti salvati!"))} className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-[9px] uppercase">Salva</button>
                               <button onClick={() => { if(confirm("Calcolare i punteggi? La giornata verrà chiusa.")) dbService.calculateMatchday(selectedMatchday.id, selectedMatchday.votes).then(() => { refreshData(); setSelectedMatchday(null); }); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[9px] uppercase">Calcola</button>
                             </>
                           )}
                        </div>
                    </div>
                    {selectedMatchday.status === 'calculated' && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-800 text-[10px] font-bold">
                        <Lock size={14} /> I voti sono bloccati. Premi 'Riapri' per modificarli.
                      </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead>
                            <tr className="border-b uppercase font-black text-slate-400">
                              <th className="py-2 pr-2">Nome</th>
                              <th className="py-2">Voto</th>
                              <th className="py-2">G</th>
                              <th className="py-2">A</th>
                              <th className="py-2 text-center">Cart.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {players.map(p => {
                              const s = selectedMatchday.votes[p.id] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
                              const isLocked = selectedMatchday.status === 'calculated';
                              return (
                                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                                   <td className="py-2 font-bold uppercase">{p.name}</td>
                                   <td><input type="number" step="0.5" disabled={isLocked} value={s.voto || ''} onChange={e => updateStat(p.id, 'voto', e.target.value)} className="w-10 p-1 border rounded text-center disabled:bg-slate-50" /></td>
                                   <td><input type="number" disabled={isLocked} value={s.goals || ''} onChange={e => updateStat(p.id, 'goals', e.target.value)} className="w-8 p-1 border rounded text-center disabled:bg-slate-50" /></td>
                                   <td><input type="number" disabled={isLocked} value={s.assists || ''} onChange={e => updateStat(p.id, 'assists', e.target.value)} className="w-8 p-1 border rounded text-center disabled:bg-slate-50" /></td>
                                   <td className="flex gap-2 py-2 justify-center">
                                      <input type="checkbox" disabled={isLocked} checked={s.yellowCard} onChange={e => updateStat(p.id, 'yellowCard', e.target.checked)} className="accent-yellow-400" />
                                      <input type="checkbox" disabled={isLocked} checked={s.redCard} onChange={e => updateStat(p.id, 'redCard', e.target.checked)} className="accent-red-500" />
                                   </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                    </div>
                  </div>
                )}

                {adminActiveTab === 'sponsors' && (
                   <div className="space-y-6">
                      <div className="bg-white p-6 rounded-2xl shadow">
                         <h3 className="text-sm font-black uppercase italic mb-4">Carica Sponsor</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <input type="text" placeholder="Nome Attività" value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="p-3 rounded-xl border text-xs" />
                            <input type="text" placeholder="Settore" value={newSponsor.type} onChange={e => setNewSponsor({...newSponsor, type: e.target.value})} className="p-3 rounded-xl border text-xs" />
                            <div className="flex items-center gap-2">
                               <button onClick={() => sponsorInputRef.current?.click()} className="flex-1 py-3 bg-slate-100 rounded-xl text-xs font-bold uppercase border-2 border-dashed border-slate-300">
                                  {sponsorLogoFile ? 'Logo Selezionato' : 'Seleziona Logo'}
                               </button>
                               <input type="file" ref={sponsorInputRef} onChange={e => { if(e.target.files?.[0]) setSponsorLogoFile(e.target.files[0]); }} hidden accept="image/*" />
                            </div>
                         </div>
                         <button onClick={handleAddSponsor} disabled={actionLoading} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                           {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14}/> CARICA</>}
                         </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {sponsors.map(s => (
                            <div key={s.id} className="bg-white p-4 rounded-xl shadow relative group border border-slate-100 hover:border-orange-500 transition-all">
                               <div className="h-16 w-full mb-2 flex items-center justify-center bg-slate-50 rounded-lg p-2">
                                  <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" />
                               </div>
                               <p className="text-[9px] font-black uppercase text-center truncate">{s.name}</p>
                               <button onClick={() => { if(confirm("Rimuovere sponsor?")) dbService.deleteSponsor(s.id).then(() => refreshData()); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={12}/></button>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {adminActiveTab === 'settings' && (
                  <div className="bg-white p-6 rounded-2xl shadow space-y-6">
                     <div className="flex justify-between items-center border-b pb-4">
                       <h3 className="text-lg font-black uppercase italic text-orange-950">Configurazione Lega</h3>
                       <div className="flex gap-2">
                          <button onClick={() => { if(confirm("AZIONE ESTREMA: Azzerare tutto?")) dbService.resetAllStandings().then(() => refreshData()); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[9px] flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                             <RotateCcw size={14}/> RESET TOTALE
                          </button>
                          <button onClick={saveAdminSettings} disabled={actionLoading} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] flex items-center gap-2 shadow-xl">
                            {actionLoading ? <Loader2 size={14} className="animate-spin"/> : <><Save size={14}/> SALVA TUTTO</>}
                          </button>
                       </div>
                     </div>
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border">
                             <span className="text-[10px] font-bold uppercase">Mercato Libero</span>
                             <button onClick={() => setSettings(settings ? {...settings, isMarketOpen: !settings.isMarketOpen} : null)} className={`px-4 py-2 rounded-lg text-white text-[9px] font-bold ${settings?.isMarketOpen ? 'bg-emerald-500' : 'bg-red-500'}`}>{settings?.isMarketOpen ? 'APERTO' : 'CHIUSO'}</button>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border">
                             <span className="text-[10px] font-bold uppercase">Blocco Rose</span>
                             <button onClick={() => setSettings(settings ? {...settings, isLineupLocked: !settings.isLineupLocked} : null)} className={`px-4 py-2 rounded-lg text-white text-[9px] font-bold ${settings?.isLineupLocked ? 'bg-red-500' : 'bg-emerald-500'}`}>{settings?.isLineupLocked ? 'BLOCCATE' : 'ATTIVE'}</button>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                           <label className="text-[10px] font-black uppercase italic text-slate-500">ID Video YouTube</label>
                           <input type="text" value={ytInput} onChange={e => setYtInput(e.target.value)} className="w-full p-4 rounded-xl border-2 text-sm font-bold outline-none focus:border-orange-500 transition-all" placeholder="Incolla l'ID video" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                           <label className="text-[10px] font-black uppercase italic text-slate-500">News Bacheca</label>
                           <textarea value={marqueeInput} onChange={e => setMarqueeInput(e.target.value)} className="w-full p-4 rounded-xl border-2 text-sm font-bold outline-none focus:border-orange-500 transition-all" rows={2} placeholder="Testo scorrevole in home..." />
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )
      ) : (
        !currentUser ? (
          <div className="min-h-screen bg-[#1a0702] flex items-center justify-center p-4">
             <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
                <h1 className="text-2xl font-black text-orange-950 text-center uppercase mb-1 italic tracking-tighter">STORKFANTASY</h1>
                <p className="text-center text-[8px] font-bold text-amber-600 uppercase mb-6 italic tracking-widest">ELITE FUTSAL LEAGUE</p>
                {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl flex items-center gap-2"><AlertTriangle size={14}/> {authError}</div>}
                <form onSubmit={handleAuth} className="space-y-4">
                  <input type="email" placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                  <input type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                  {authMode === 'signup' && (
                    <div className="space-y-4">
                      <input type="text" placeholder="Nome Squadra" value={authData.teamName} onChange={e => setAuthData({...authData, teamName: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                      <input type="text" placeholder="Nome Manager" value={authData.managerName} onChange={e => setAuthData({...authData, managerName: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                    </div>
                  )}
                  <button type="submit" disabled={actionLoading} className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                     {actionLoading ? 'SINCRONIZZAZIONE...' : (authMode === 'login' ? 'ACCEDI' : 'REGISTRA TEAM')}
                  </button>
                </form>
                <div className="mt-6 flex flex-col gap-4 text-center">
                   <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[9px] font-bold uppercase text-orange-600">{authMode === 'login' ? 'Crea un nuovo team' : 'Hai già un team? Accedi'}</button>
                   <button onClick={() => setIsAdminPath(true)} className="text-[8px] font-bold uppercase text-slate-300 flex items-center justify-center gap-1"><Key size={10}/> Area Amministratore</button>
                </div>
             </div>
          </div>
        ) : (
          <>
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-orange-950 text-white flex-col z-50">
              <div className="p-8 text-center"><Shield size={32} className="text-amber-500 mx-auto mb-4" /><h1 className="text-lg font-black italic text-amber-500 uppercase tracking-tighter">STORKFANTASY</h1></div>
              <nav className="flex-1 px-3 space-y-2">
                <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={18}/>} label="Home" />
                <NavItem active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} icon={<LayoutPanelLeft size={18}/>} label="Il Mio Campo" />
                <NavItem active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={18}/>} label="Mercato" />
                <NavItem active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<BarChart3 size={18}/>} label="Classifica" />
              </nav>
              <div className="p-4"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 font-bold uppercase text-[9px]"><LogOut size={14}/> Esci</button></div>
            </aside>

            <main className="max-w-xl mx-auto p-4 sm:p-6 mb-24 lg:mb-0">
              {activeTab === 'home' && (
                <div className="space-y-6 fade-in">
                   <div className="bg-orange-950 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                               {currentUser.team.logo ? <img src={currentUser.team.logo} className="w-full h-full object-cover rounded-xl" /> : <Shield size={28} className="text-amber-500/50" />}
                            </div>
                            <div><h2 className="text-xl font-black italic uppercase text-amber-500 tracking-tighter">{currentUser.team.teamName}</h2><p className="text-orange-300 font-bold uppercase text-[8px] tracking-widest">{currentUser.team.managerName}</p></div>
                         </div>
                         <div className="text-right"><p className="text-[8px] text-amber-500 uppercase font-black">Totale</p><p className="text-3xl font-black italic">{currentUser.team.totalPoints.toFixed(1)}</p></div>
                      </div>
                   </div>

                   {settings?.marqueeText && (
                    <div className="relative overflow-hidden bg-orange-950/5 border-y border-orange-950/10 py-2.5 -mx-4 sm:-mx-6">
                        <div className="flex whitespace-nowrap animate-marquee">
                            <div className="flex gap-12 items-center px-4">
                                <span className="text-[9px] font-black uppercase text-orange-950/60 flex items-center gap-2 italic">
                                    <Award size={12} className="text-amber-500" /> {settings.marqueeText}
                                </span>
                            </div>
                            <div className="flex gap-12 items-center px-4" aria-hidden="true">
                                <span className="text-[9px] font-black uppercase text-orange-950/60 flex items-center gap-2 italic">
                                    <Award size={12} className="text-amber-500" /> {settings.marqueeText}
                                </span>
                            </div>
                        </div>
                    </div>
                   )}

                   <div className="space-y-3">
                     <h3 className="text-xs font-black uppercase flex items-center gap-2 italic text-orange-950"><Video size={16} className="text-red-600 animate-pulse"/> Match Live</h3>
                     {ytEmbedUrl ? (
                        <div className="bg-black rounded-3xl overflow-hidden aspect-video border-4 border-orange-950 shadow-2xl">
                           <iframe className="w-full h-full" src={ytEmbedUrl} frameBorder="0" allow="autoplay; fullscreen" />
                        </div>
                     ) : (
                        <div className="bg-white p-10 rounded-3xl shadow-lg border border-orange-100 text-center opacity-40 italic text-[10px] uppercase font-black tracking-widest">Nessun segnale live attivo</div>
                     )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-50">
                         <h3 className="text-[10px] font-black uppercase mb-3 italic flex items-center gap-2 text-orange-950"><Star className="text-amber-500" size={14} fill="currentColor" /> Top Scores</h3>
                         <div className="space-y-2">
                            {currentStarters.length > 0 ? currentStarters.slice(0, 3).map(p => {
                               const s = latestCalculatedMatchday?.votes[p.id];
                               return (
                               <div key={p.id} className="flex justify-between items-center text-[9px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <span className="font-bold uppercase truncate pr-2">{p.name}</span>
                                  <span className="font-black text-orange-600">{s ? (Number(s.voto) + (Number(s.goals)*3)).toFixed(1) : '-'}</span>
                               </div>
                            )}) : (
                               <p className="text-[8px] uppercase font-bold text-slate-300 text-center py-2">Rosa da definire</p>
                            )}
                         </div>
                      </div>
                      <div className="bg-orange-950 p-5 rounded-3xl text-white shadow-xl flex flex-col justify-center items-center text-center">
                        <ZapIcon className={`mb-2 text-amber-500 ${currentUser.team.isLineupConfirmed ? 'animate-pulse' : 'opacity-20'}`} size={28} />
                        <h3 className="text-xs font-black uppercase text-amber-500 mb-1 italic">Gara {settings?.currentMatchday || 1}</h3>
                        <div className={`px-4 py-1.5 rounded-full font-black uppercase text-[7px] border tracking-widest ${currentUser.team.isLineupConfirmed ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30 animate-pulse'}`}>
                           {currentUser.team.isLineupConfirmed ? 'CONFERMATA' : 'DA SCHIERARE'}
                        </div>
                      </div>
                   </div>

                   <div className="pt-6 space-y-4">
                      <h3 className="text-[9px] font-black uppercase text-slate-400 text-center tracking-widest italic opacity-50">Sponsor Ufficiali</h3>
                      <div className="grid grid-cols-2 gap-3">
                         {sponsors.length > 0 ? sponsors.map(s => (
                           <SponsorCard key={s.id} icon={<img src={s.logo_url} className="w-full h-full object-contain" />} name={s.name} type={s.type} />
                         )) : (
                           <div className="col-span-2 text-center text-[8px] font-bold text-slate-300 uppercase">Nessuno sponsor caricato...</div>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'lineup' && (
                <div className="space-y-6 fade-in">
                   <div className="flex justify-between items-end">
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-orange-950">Il Mio Campo</h2>
                      <button onClick={confirmLineup} disabled={!settings || settings.isLineupLocked || currentUser.team.isLineupConfirmed || actionLoading} className={`px-7 py-2.5 rounded-2xl font-black uppercase text-[10px] shadow-2xl transition-all ${currentUser.team.isLineupConfirmed ? 'bg-emerald-500 text-white' : 'bg-orange-950 text-amber-500 hover:scale-105 active:scale-95'}`}>
                         {actionLoading ? <Loader2 size={12} className="animate-spin" /> : (currentUser.team.isLineupConfirmed ? 'PRONTA' : 'CONSEGNA')}
                      </button>
                   </div>
                   <Pitch 
                      starters={currentStarters} 
                      bench={players.filter(p => currentUser.team.playerIds.includes(p.id) && !currentUser.team.currentLineupIds.includes(p.id))} 
                      onSetStarter={async (p) => {
                         if(!settings || settings.isLineupLocked || currentUser.team.isLineupConfirmed) return;
                         if(p.role === 'P' && currentStarters.filter(x => x.role === 'P').length >= 1) return;
                         if(p.role === 'M' && currentStarters.filter(x => x.role === 'M').length >= 4) return;
                         const newIds = [...currentUser.team.currentLineupIds, p.id];
                         const newTeam = { ...currentUser.team, currentLineupIds: newIds };
                         setCurrentUser({...currentUser, team: newTeam});
                      }} 
                      onSetBench={async (p) => {
                         if(!settings || settings.isLineupLocked || currentUser.team.isLineupConfirmed) return;
                         const newIds = currentUser.team.currentLineupIds.filter(id => id !== p.id);
                         const newTeam = { ...currentUser.team, currentLineupIds: newIds };
                         setCurrentUser({...currentUser, team: newTeam});
                      }} 
                      isLocked={!settings || settings.isLineupLocked || currentUser.team.isLineupConfirmed}
                      votes={latestCalculatedMatchday?.votes} 
                   />
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-4 fade-in">
                   <div className="bg-orange-950 p-6 rounded-3xl text-white flex justify-between items-center shadow-xl">
                      <div><h2 className="text-2xl font-black uppercase text-amber-500 italic tracking-tighter">Mercato</h2><p className="text-[10px] font-bold text-orange-300 tracking-widest">Residuo: {currentUser.team.creditsLeft} SK</p></div>
                      <ShoppingCart className="text-amber-500/20" size={40} />
                   </div>
                   <div className="space-y-3">
                      {players.map(p => {
                        const isBought = currentUser.team.playerIds.includes(p.id);
                        return (
                          <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all ${isBought ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-100 hover:border-orange-200'}`}>
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg ${ROLE_COLORS[p.role]}`}>{p.role}</div>
                                   <div>
                                      <p className="font-black text-orange-950 uppercase text-[11px] tracking-tight">{p.name}</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{p.team}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <p className="font-black text-orange-950 text-sm italic">{p.price} SK</p>
                                   <button 
                                      onClick={async () => {
                                         if(!settings?.isMarketOpen) {
                                            alert("Il mercato è chiuso!");
                                            return;
                                         }
                                         let newTeam;
                                         if(isBought) {
                                            newTeam = { ...currentUser.team, playerIds: currentUser.team.playerIds.filter(id => id !== p.id), currentLineupIds: currentUser.team.currentLineupIds.filter(id => id !== p.id), creditsLeft: currentUser.team.creditsLeft + p.price, isLineupConfirmed: false };
                                         } else {
                                            if(currentUser.team.creditsLeft < p.price) {
                                               alert("Budget terminato!");
                                               return;
                                            }
                                            newTeam = { ...currentUser.team, playerIds: [...currentUser.team.playerIds, p.id], creditsLeft: currentUser.team.creditsLeft - p.price, isLineupConfirmed: false };
                                         }
                                         setCurrentUser({...currentUser, team: newTeam});
                                         await dbService.updateProfile(currentUser.id, newTeam).catch(e => alert("Errore connessione."));
                                      }}
                                      className={`w-10 h-10 rounded-xl text-white shadow-lg flex items-center justify-center transition-all ${isBought ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'} ${!settings?.isMarketOpen ? 'opacity-20 cursor-not-allowed' : ''}`}
                                      disabled={!settings?.isMarketOpen}
                                   >{isBought ? <Trash2 size={18}/> : <UserPlus size={18}/>}</button>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="space-y-6 fade-in">
                   <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Classifica</h2>
                   <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
                      {allUsers.length > 0 ? [...allUsers].sort((a, b) => (b.team?.totalPoints || 0) - (a.team?.totalPoints || 0)).map((u, idx) => (
                         <div key={u.id} className={`flex items-center justify-between p-5 border-b last:border-0 hover:bg-slate-50 transition-colors ${u.id === currentUser.id ? 'bg-amber-50/50' : ''}`}>
                            <div className="flex items-center gap-5">
                               <span className={`font-black text-[12px] w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${idx === 0 ? 'bg-amber-400 text-orange-950 rotate-12' : (idx === 1 ? 'bg-slate-300 text-slate-700' : (idx === 2 ? 'bg-orange-400 text-orange-950' : 'bg-slate-100 text-slate-400'))}`}>{idx + 1}</span>
                               <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                                  {u.team.logo ? <img src={u.team.logo} className="w-full h-full object-cover" /> : <Shield size={16} className="m-auto mt-2.5 text-slate-400" />}
                               </div>
                               <div>
                                  <p className="font-black uppercase text-orange-950 text-[11px] tracking-tight truncate max-w-[140px]">{u.team.teamName}</p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{u.team.managerName}</p>
                               </div>
                            </div>
                            <p className="text-2xl font-black italic text-orange-950">{u.team.totalPoints.toFixed(1)}</p>
                         </div>
                      )) : (
                         <div className="p-10 text-center text-slate-300 font-bold uppercase text-[10px]">Attendi i primi dati...</div>
                      )}
                   </div>
                </div>
              )}
            </main>

            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-orange-950 flex justify-around p-1 pb-10 z-[100] rounded-t-[40px] shadow-2xl border-t border-amber-500/20">
              <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24}/>} />
              <NavBtn active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} icon={<LayoutPanelLeft size={24}/>} />
              <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={24}/>} />
              <NavBtn active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<BarChart3 size={24}/>} />
              <button onClick={handleLogout} className="p-4 text-red-500/40 hover:text-red-500 transition-colors"><LogOut size={24}/></button>
            </nav>
          </>
        )
      )}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 25s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
};

const SponsorCard: React.FC<{ icon: React.ReactNode; name: string; type: string }> = ({ icon, name, type }) => (
  <div className="bg-white p-4 rounded-3xl border border-orange-50 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
     <div className="w-11 h-11 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 p-2 shadow-inner">
        {icon}
     </div>
     <div className="truncate">
        <p className="text-[10px] font-black uppercase text-orange-950 italic truncate tracking-tight">{name}</p>
        <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest opacity-60">{type}</p>
     </div>
  </div>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 transition-all duration-300 ${active ? 'text-amber-500 scale-125' : 'text-white/20'}`}>{icon}</button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-amber-500 text-orange-950 shadow-xl scale-105' : 'text-orange-300/30 hover:bg-white/5'}`}>
    <span className={`${active ? 'scale-110' : ''}`}>{icon}</span>
    <span className="text-[10px] uppercase font-black tracking-widest">{label}</span>
  </button>
);

export default App;