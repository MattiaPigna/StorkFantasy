
import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingCart, Shield, LogOut, LayoutPanelLeft, BarChart3, Trash2, CheckCircle, X, Star, Settings as SettingsIcon, ChevronLeft, PlusCircle, Loader2, Zap, Edit3, Video, Lock, ExternalLink, FileText, Sparkles, BookOpen, ArrowDown, AlertTriangle, UserPlus, Zap as ZapIcon, Save, Calculator, RefreshCcw } from 'lucide-react';
import { ROLE_COLORS } from './constants';
import { Player, UserTeam, AppSettings, User, Role, Matchday, Sponsor, FantasyRule, SpecialCard, TournamentRules, PlayerMatchStats } from './types';
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
  const [adminActiveTab, setAdminActiveTab] = useState<'matchdays' | 'players' | 'sponsors' | 'settings' | 'rules' | 'cards' | 'tournament'>('matchdays');
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'lineup' | 'market' | 'standings' | 'tournament_rules' | 'fantasy_rules' | 'special_cards'>('home');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [fantasyRules, setFantasyRules] = useState<FantasyRule[]>([]);
  const [specialCards, setSpecialCards] = useState<SpecialCard[]>([]);
  const [tournamentRules, setTournamentRules] = useState<TournamentRules | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [selectedMatchday, setSelectedMatchday] = useState<Matchday | null>(null);
  const [matchdayVotes, setMatchdayVotes] = useState<Record<string, PlayerMatchStats>>({});

  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({ name: '', type: '', link_url: '' });
  const [sponsorLogoFile, setSponsorLogoFile] = useState<File | null>(null);
  const sponsorInputRef = useRef<HTMLInputElement>(null);

  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({ name: '', team: '', role: 'M', price: 10 });
  const [newRule, setNewRule] = useState<Partial<FantasyRule>>({ name: '', description: '', points: 1, type: 'bonus' });
  const [newCard, setNewCard] = useState<Partial<SpecialCard>>({ name: '', description: '', effect: '' });
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const [tourneyHtml, setTourneyHtml] = useState('');
  const [tourneyPdfFile, setTourneyPdfFile] = useState<File | null>(null);
  const tourneyInputRef = useRef<HTMLInputElement>(null);

  // Fix: Defined missing loginSectionRef to match usage in the landing page section
  const loginSectionRef = useRef<HTMLElement>(null);
  
  // Fix: Defined missing scrollToLogin function for the "PARTECIPA ORA" button
  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [ytInput, setYtInput] = useState('');
  const [marqueeInput, setMarqueeInput] = useState('');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const [p, s, u, m, sp, fr, sc, tr] = await Promise.all([
        dbService.getPlayers(),
        dbService.getSettings(),
        dbService.getAllProfiles(),
        dbService.getMatchdays(),
        dbService.getSponsors(),
        dbService.getFantasyRules(),
        dbService.getSpecialCards(),
        dbService.getTournamentRules()
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
      setFantasyRules(fr || []);
      setSpecialCards(sc || []);
      setTournamentRules(tr || null);
      if (tr) setTourneyHtml(tr.html_content || '');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await dbService.getProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      }
    } catch (err) {
      console.error("Refresh error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
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
        showNotification("Account creato! Ora accedi.");
        setAuthMode('login');
      } else {
        const { user } = await dbService.signIn(authData.email, authData.password);
        if (user) {
          const profile = await dbService.getProfile(user.id);
          if (profile) setCurrentUser(profile);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Errore autenticazione.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setCurrentUser(null);
  };

  // ADMIN ACTIONS
  const handleSaveVotes = async (isCalculated: boolean = false) => {
    if (!selectedMatchday) return;
    setActionLoading(true);
    try {
      if (isCalculated) {
        await dbService.calculateMatchday(selectedMatchday.id, matchdayVotes);
        showNotification("Giornata calcolata e classifiche aggiornate!");
      } else {
        await dbService.saveMatchdayVotes(selectedMatchday.id, matchdayVotes, 'open');
        showNotification("Voti salvati con successo!");
      }
      setSelectedMatchday(null);
      refreshData(false);
    } catch (e: any) {
      alert("Errore: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const updateVote = (playerId: string, field: keyof PlayerMatchStats, value: any) => {
    const current = matchdayVotes[playerId] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
    setMatchdayVotes({
      ...matchdayVotes,
      [playerId]: { ...current, [field]: value }
    });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      await dbService.updateSettings({ ...settings, youtubeLiveUrl: ytInput, marqueeText: marqueeInput });
      showNotification("Impostazioni salvate!");
      refreshData(false);
    } catch (e) { alert("Errore setup"); } finally { setActionLoading(false); }
  };

  const currentStarters = currentUser?.team.currentLineupIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];
  const latestCalculatedMatchday = matchdays.find(m => m.status === 'calculated');
  const ytEmbedUrl = getYouTubeEmbedUrl(settings?.youtubeLiveUrl);
  const marqueeNews = settings?.marqueeText?.split('\n').filter(t => t.trim().length > 0) || [];

  if (loading) return (
    <div className="min-h-screen bg-[#1a0702] flex flex-col items-center justify-center p-8">
      <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
      <p className="font-black uppercase text-[10px] tracking-widest italic text-amber-500/50">Lega in Caricamento...</p>
    </div>
  );

  const showDashboard = currentUser && !isAdminPath;

  return (
    <div className={`min-h-screen bg-[#f8f9fa] relative font-sans w-full ${showDashboard ? 'pb-24 lg:pb-0 lg:pl-64' : ''}`}>
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-white px-6 py-2 rounded-full font-bold uppercase text-[10px] shadow-xl flex items-center gap-2">
          <CheckCircle size={14} /> {notification}
        </div>
      )}

      {isAdminPath ? (
        !adminAuthenticated ? (
          <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 w-full">
            <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
              <button onClick={() => setIsAdminPath(false)} className="mb-4 flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]"><ChevronLeft size={14}/> Torna alla Landing</button>
              <h1 className="text-xl font-black text-slate-900 text-center uppercase mb-6 italic">Accesso Amministratore</h1>
              <form onSubmit={(e) => { e.preventDefault(); if(adminPass === ADMIN_PASSWORD_REQUIRED) setAdminAuthenticated(true); else alert("Password Errata"); }} className="space-y-4">
                <input type="password" placeholder="Password Master" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                <button type="submit" className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] tracking-widest">ENTRA</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-slate-100 p-4 sm:p-6 w-full">
             <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                   <h1 className="text-xl font-black uppercase italic flex items-center gap-2 text-orange-950"><SettingsIcon size={20}/> Gestione Lega</h1>
                   <div className="flex bg-slate-200 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
                      <button onClick={() => setAdminActiveTab('matchdays')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'matchdays' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Gare</button>
                      <button onClick={() => setAdminActiveTab('players')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'players' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Calciatori</button>
                      <button onClick={() => setAdminActiveTab('rules')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'rules' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Regole Fanta</button>
                      <button onClick={() => setAdminActiveTab('cards')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'cards' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Carte Stork</button>
                      <button onClick={() => setAdminActiveTab('tournament')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'tournament' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Reg. Torneo</button>
                      <button onClick={() => setAdminActiveTab('sponsors')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'sponsors' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Sponsor</button>
                      <button onClick={() => setAdminActiveTab('settings')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'settings' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Setup Lega</button>
                   </div>
                   <button onClick={() => setAdminAuthenticated(false)} className="bg-red-50 p-3 rounded-xl text-red-500"><X size={18}/></button>
                </div>

                {/* ADMIN: MATCHDAYS TAB */}
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
                              <th className="p-2">Giocatore</th>
                              <th className="p-2">Voto</th>
                              <th className="p-2">Gol</th>
                              <th className="p-2">Ass</th>
                              <th className="p-2">Aut</th>
                              <th className="p-2">Gia</th>
                              <th className="p-2">Ros</th>
                              <th className="p-2">Extra</th>
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
                          <button onClick={() => dbService.createMatchday(matchdays.length + 1).then(() => refreshData())} className="px-5 py-2.5 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] flex items-center gap-2">
                             <PlusCircle size={14}/> NUOVA GIORNATA
                          </button>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {matchdays.map(m => (
                             <div key={m.id} className="bg-white p-6 rounded-[24px] shadow border-l-4 border-orange-950 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                   <p className="text-2xl font-black italic">G{m.number}</p>
                                   <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${m.status === 'calculated' ? 'bg-emerald-50 text-emerald-500' : 'bg-orange-50 text-orange-500'}`}>
                                      {m.status === 'calculated' ? 'Calcolata' : 'Aperta'}
                                   </span>
                                </div>
                                <button onClick={() => { setSelectedMatchday(m); setMatchdayVotes(m.votes || {}); }} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px]">GESTISCI VOTI</button>
                                <button onClick={() => { if(confirm("Sicuro?")) dbService.deleteMatchday(m.id).then(() => refreshData()); }} className="mt-2 text-center text-[8px] font-black uppercase text-red-300 hover:text-red-500">Elimina</button>
                             </div>
                          ))}
                       </div>
                    </div>
                  )
                )}

                {/* ADMIN: PLAYERS TAB */}
                {adminActiveTab === 'players' && (
                  <div className="space-y-6">
                     <div className="bg-white p-6 rounded-[32px] shadow">
                        <h3 className="text-sm font-black uppercase italic mb-4">Aggiungi Calciatore</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <input type="text" placeholder="Nome Cognome" value={newPlayer.name} onChange={e => setNewPlayer({...newPlayer, name: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                           <input type="text" placeholder="Squadra" value={newPlayer.team} onChange={e => setNewPlayer({...newPlayer, team: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                           <select value={newPlayer.role} onChange={e => setNewPlayer({...newPlayer, role: e.target.value as Role})} className="p-3 rounded-xl border text-xs font-bold">
                              <option value="P">Portiere</option>
                              <option value="M">Movimento</option>
                           </select>
                           <input type="number" placeholder="Prezzo SK" value={newPlayer.price} onChange={e => setNewPlayer({...newPlayer, price: parseInt(e.target.value) || 0})} className="p-3 rounded-xl border text-xs font-bold" />
                        </div>
                        <button onClick={() => dbService.upsertPlayer(newPlayer).then(() => { setNewPlayer({name:'', team:'', role:'M', price:10}); refreshData(); })} className="mt-4 w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black text-[10px] uppercase tracking-widest">AGGIUNGI AL LISTONE</button>
                     </div>
                     <div className="bg-white p-4 rounded-[32px] shadow overflow-hidden">
                        <table className="w-full text-[10px] text-left">
                           <thead><tr className="border-b font-black uppercase text-slate-400"><th className="p-3">Nome</th><th className="p-3">Team</th><th className="p-3">Ruolo</th><th className="p-3">SK</th><th className="p-3 text-right">Azioni</th></tr></thead>
                           <tbody>
                              {players.map(p => (
                                 <tr key={p.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-bold uppercase">{p.name}</td>
                                    <td className="p-3 uppercase opacity-40">{p.team}</td>
                                    <td className="p-3"><span className={`px-2 py-0.5 rounded font-black text-white ${ROLE_COLORS[p.role]}`}>{p.role}</span></td>
                                    <td className="p-3 font-black">{p.price}</td>
                                    <td className="p-3 text-right"><button onClick={() => { if(confirm("Eliminare?")) dbService.deletePlayer(p.id).then(() => refreshData()); }} className="text-red-500"><Trash2 size={16}/></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}

                {/* ADMIN: RULES TAB */}
                {adminActiveTab === 'rules' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow">
                      <h3 className="text-sm font-black uppercase mb-4 italic">Nuova Regola Fantacalcio</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Nome Regola" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <input type="text" placeholder="Descrizione Breve" value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <input type="number" step="0.5" value={newRule.points} onChange={e => setNewRule({...newRule, points: parseFloat(e.target.value)})} className="p-3 rounded-xl border text-xs font-bold" />
                        <select value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value as any})} className="p-3 rounded-xl border text-xs font-bold">
                          <option value="bonus">Bonus (+)</option>
                          <option value="malus">Malus (-)</option>
                        </select>
                      </div>
                      <button onClick={() => dbService.upsertFantasyRule(newRule).then(() => {setNewRule({name:'',description:'',points:1,type:'bonus'}); refreshData();})} className="mt-4 w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black text-[10px] uppercase">SALVA REGOLA</button>
                    </div>
                    <div className="bg-white p-4 rounded-[32px] shadow overflow-hidden">
                      <table className="w-full text-left text-[10px]">
                        <thead><tr className="border-b font-black uppercase text-slate-400"><th className="p-3">Nome</th><th className="p-3">Punti</th><th className="p-3">Tipo</th><th className="p-3 text-right">Azioni</th></tr></thead>
                        <tbody>
                          {fantasyRules.map(r => (
                            <tr key={r.id} className="border-b">
                              <td className="p-3 font-bold uppercase">{r.name}</td>
                              <td className={`p-3 font-black ${r.type === 'bonus' ? 'text-emerald-500' : 'text-red-500'}`}>{r.points > 0 ? `+${r.points}` : r.points}</td>
                              <td className="p-3 uppercase text-[8px] font-black">{r.type}</td>
                              <td className="p-3 text-right"><button onClick={() => dbService.deleteFantasyRule(r.id).then(() => refreshData())} className="text-red-500"><Trash2 size={14}/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ADMIN: CARDS TAB */}
                {adminActiveTab === 'cards' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow">
                      <h3 className="text-sm font-black uppercase mb-4 italic">Nuova Carta Speciale Stork League</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome Carta" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <input type="text" placeholder="Tag Effetto (es. Gol x2)" value={newCard.effect} onChange={e => setNewCard({...newCard, effect: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <textarea placeholder="Descrizione completa dell'effetto" value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="p-3 rounded-xl border text-xs font-bold md:col-span-2" rows={2} />
                        <div className="md:col-span-2">
                           <input type="file" ref={cardInputRef} hidden onChange={e => e.target.files?.[0] && setCardImageFile(e.target.files[0])} />
                           <button onClick={() => cardInputRef.current?.click()} className="w-full py-4 bg-slate-50 border-2 border-dashed rounded-xl text-[10px] font-black uppercase">{cardImageFile ? 'Immagine Caricata' : 'Carica Design Carta'}</button>
                        </div>
                      </div>
                      <button onClick={async () => {
                        let url = '';
                        if(cardImageFile) url = await dbService.uploadFile('cards', 'img', cardImageFile);
                        await dbService.upsertSpecialCard({...newCard, image_url: url});
                        setNewCard({name:'',effect:'',description:''}); setCardImageFile(null); refreshData();
                      }} className="mt-4 w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black text-[10px] uppercase">CREA CARTA</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {specialCards.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-2xl shadow relative group">
                           {c.image_url && <img src={c.image_url} className="w-full aspect-square object-contain mb-2" />}
                           <p className="font-black uppercase text-[10px]">{c.name}</p>
                           <button onClick={() => dbService.deleteSpecialCard(c.id).then(() => refreshData())} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={10}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ADMIN: SPONSORS TAB */}
                {adminActiveTab === 'sponsors' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[32px] shadow">
                      <h3 className="text-sm font-black uppercase mb-4 italic">Nuovo Sponsor</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome Azienda" value={newSponsor.name} onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <input type="text" placeholder="Settore" value={newSponsor.type} onChange={e => setNewSponsor({...newSponsor, type: e.target.value})} className="p-3 rounded-xl border text-xs font-bold" />
                        <div className="md:col-span-2">
                           <input type="file" ref={sponsorInputRef} hidden onChange={e => e.target.files?.[0] && setSponsorLogoFile(e.target.files[0])} />
                           <button onClick={() => sponsorInputRef.current?.click()} className="w-full py-4 bg-slate-50 border-2 border-dashed rounded-xl text-[10px] font-black uppercase">{sponsorLogoFile ? 'Logo Caricato' : 'Carica Logo Sponsor'}</button>
                        </div>
                      </div>
                      <button onClick={async () => {
                        let url = '';
                        if(sponsorLogoFile) url = await dbService.uploadFile('sponsor', 'logos', sponsorLogoFile);
                        await dbService.upsertSponsor({...newSponsor, logo_url: url});
                        setNewSponsor({name:'',type:''}); setSponsorLogoFile(null); refreshData();
                      }} className="mt-4 w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black text-[10px] uppercase">SALVA SPONSOR</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                       {sponsors.map(s => (
                         <div key={s.id} className="bg-white p-4 rounded-2xl shadow text-center relative group">
                            <img src={s.logo_url} className="h-16 w-full object-contain mb-2 mx-auto" />
                            <p className="font-black uppercase text-[10px]">{s.name}</p>
                            <button onClick={() => dbService.deleteSponsor(s.id).then(() => refreshData())} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={10}/></button>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* ADMIN: SETTINGS TAB */}
                {adminActiveTab === 'settings' && settings && (
                  <div className="bg-white p-8 rounded-[40px] shadow-xl space-y-8">
                     <h3 className="text-sm font-black uppercase italic text-orange-950">Parametri di Sistema</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                              <div><p className="text-[11px] font-black uppercase">Mercato Aperto</p><p className="text-[9px] text-slate-400">Permetti scambi di giocatori</p></div>
                              <input type="checkbox" checked={settings.isMarketOpen} onChange={e => setSettings({...settings, isMarketOpen: e.target.checked})} className="w-6 h-6" />
                           </div>
                           <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                              <div><p className="text-[11px] font-black uppercase">Formazioni Bloccate</p><p className="text-[9px] text-slate-400">Impedisci cambio campo</p></div>
                              <input type="checkbox" checked={settings.isLineupLocked} onChange={e => setSettings({...settings, isLineupLocked: e.target.checked})} className="w-6 h-6" />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">YouTube Live URL</label>
                              <input type="text" value={ytInput} onChange={e => setYtInput(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" placeholder="https://youtube.com/..." />
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">News a Scorrimento (Marquee)</label>
                              <textarea value={marqueeInput} onChange={e => setMarqueeInput(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold" rows={3} placeholder="Una notizia per riga..." />
                           </div>
                        </div>
                     </div>
                     <button onClick={handleSaveSettings} disabled={actionLoading} className="w-full py-5 bg-orange-950 text-amber-500 rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                        {actionLoading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} SALVA CONFIGURAZIONE
                     </button>
                     <div className="pt-10 border-t flex flex-col items-center">
                        <button onClick={() => { if(confirm("AZIONE ESTREMA: RESET TUTTO?")) dbService.resetAllStandings().then(() => refreshData()); }} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-2 px-6 py-3 border-2 border-red-100 rounded-full hover:bg-red-50"><RefreshCcw size={14}/> RESET COMPLETO LEGA</button>
                     </div>
                  </div>
                )}

                {/* ADMIN: TOURNAMENT TAB */}
                {adminActiveTab === 'tournament' && (
                  <div className="bg-white p-8 rounded-[40px] shadow-xl space-y-6">
                    <h3 className="text-sm font-black uppercase italic text-orange-950">Regolamento Torneo Stork League</h3>
                    <div className="space-y-4">
                      <div>
                         <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Testo Regolamento (HTML)</label>
                         <textarea value={tourneyHtml} onChange={e => setTourneyHtml(e.target.value)} className="w-full p-6 bg-slate-50 rounded-2xl font-mono text-[11px]" rows={12} placeholder="<h1>Regole...</h1><p>Articolo 1...</p>" />
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Documento PDF Ufficiale</label>
                            <input type="file" ref={tourneyInputRef} hidden onChange={e => e.target.files?.[0] && setTourneyPdfFile(e.target.files[0])} />
                            <button onClick={() => tourneyInputRef.current?.click()} className="w-full py-4 bg-slate-50 border-2 border-dashed rounded-xl font-black text-[10px] uppercase">{tourneyPdfFile ? 'PDF Selezionato' : 'Sostituisci PDF Regolamento'}</button>
                         </div>
                      </div>
                      <button onClick={async () => {
                         setActionLoading(true);
                         let pdfUrl = tournamentRules?.pdf_url || '';
                         if(tourneyPdfFile) pdfUrl = await dbService.uploadFile('rules', 'pdf', tourneyPdfFile);
                         await dbService.updateTournamentRules({ html_content: tourneyHtml, pdf_url: pdfUrl });
                         setTourneyPdfFile(null); refreshData(false); setActionLoading(false); showNotification("Regolamento Aggiornato");
                      }} disabled={actionLoading} className="w-full py-5 bg-emerald-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest shadow-xl">PUBBLICA REGOLAMENTO</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )
      ) : (
        !currentUser ? (
          /* LANDING PAGE PUBBLICA RIPRISTINATA E MIGLIORATA */
          <div className="w-full bg-[#f8f9fa] overflow-x-hidden">
            <header className="min-h-screen bg-[#1a0702] relative flex flex-col items-center justify-center p-6 text-center">
              <div className="absolute inset-0 opacity-10 concrete-texture" />
              <div className="relative z-10 space-y-4 animate-fade-in-up">
                <Shield size={64} className="text-amber-500 mx-auto mb-4 drop-shadow-2xl" />
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                  STORK<span className="text-amber-500">FANTASY</span>
                </h1>
                <p className="text-amber-600 font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs italic">Fantacalcio ufficiale della storkleague</p>
                <div className="pt-8">
                  <button onClick={scrollToLogin} className="px-10 py-4 bg-amber-500 text-orange-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95">
                    PARTECIPA ORA
                  </button>
                </div>
              </div>
              <button onClick={() => document.getElementById('public-info')?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-10 animate-bounce text-amber-500/50">
                <ArrowDown size={32} />
              </button>
            </header>

            <div id="public-info" className="space-y-0">
                {/* REGOLAMENTO TORNEO STORK LEAGUE */}
                <section className="py-24 px-6 bg-white">
                  <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                      <div className="inline-block px-4 py-1.5 bg-orange-100 rounded-full text-orange-950 font-black text-[8px] uppercase tracking-widest mb-2 italic">STORK LEAGUE OFFICIAL</div>
                      <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Ufficiale Torneo</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-2 bg-slate-50 p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 prose prose-slate max-w-none">
                          {tournamentRules?.html_content ? <div dangerouslySetInnerHTML={{ __html: tournamentRules.html_content }} /> : <p className="italic text-slate-300">Documento in arrivo...</p>}
                        </div>
                        <div className="bg-orange-950 p-10 rounded-[40px] text-white shadow-2xl flex flex-col items-center text-center">
                           <BookOpen size={48} className="text-amber-500 mb-6" />
                           <h3 className="font-black uppercase italic text-lg mb-3">Versione PDF</h3>
                           <p className="text-[11px] text-orange-200/60 leading-relaxed mb-8">Scarica il regolamento ufficiale Stork League per la consultazione offline.</p>
                           {tournamentRules?.pdf_url && <a href={tournamentRules.pdf_url} target="_blank" className="w-full py-4 bg-amber-500 text-orange-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">DOWNLOAD PDF <ExternalLink size={14}/></a>}
                        </div>
                    </div>
                  </div>
                </section>

                {/* REGOLAMENTO FANTACALCIO */}
                <section className="py-24 px-6 bg-[#fdfaf8]">
                  <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                      <div className="inline-block px-4 py-1.5 bg-emerald-100 rounded-full text-emerald-900 font-black text-[8px] uppercase tracking-widest mb-2 italic">FANTASTORK RULES</div>
                      <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Fantacalcio</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase text-emerald-600 italic px-6 flex items-center gap-2 tracking-widest">Bonus (+ Punti)</h3>
                          <div className="bg-white rounded-[40px] shadow-xl border border-emerald-50 overflow-hidden">
                             {fantasyRules.filter(r => r.type === 'bonus').length > 0 ? fantasyRules.filter(r => r.type === 'bonus').map(r => (
                               <div key={r.id} className="p-6 border-b last:border-0 flex justify-between items-center hover:bg-emerald-50/20">
                                 <div><p className="font-black uppercase text-[12px] text-orange-950">{r.name}</p><p className="text-[9px] text-slate-400 italic font-medium">{r.description}</p></div>
                                 <span className="font-black text-emerald-600 text-xl">+{r.points}</span>
                               </div>
                             )) : <p className="p-10 text-center text-[10px] font-black uppercase opacity-20">In aggiornamento...</p>}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase text-red-600 italic px-6 flex items-center gap-2 tracking-widest">Malus (- Punti)</h3>
                          <div className="bg-white rounded-[40px] shadow-xl border border-red-50 overflow-hidden">
                             {fantasyRules.filter(r => r.type === 'malus').length > 0 ? fantasyRules.filter(r => r.type === 'malus').map(r => (
                               <div key={r.id} className="p-6 border-b last:border-0 flex justify-between items-center hover:bg-red-50/20">
                                 <div><p className="font-black uppercase text-[12px] text-orange-950">{r.name}</p><p className="text-[9px] text-slate-400 italic font-medium">{r.description}</p></div>
                                 <span className="font-black text-red-600 text-xl">{r.points}</span>
                               </div>
                             )) : <p className="p-10 text-center text-[10px] font-black uppercase opacity-20">In aggiornamento...</p>}
                          </div>
                        </div>
                    </div>
                  </div>
                </section>

                {/* CARTE SPECIALI STORK LEAGUE */}
                <section className="py-24 px-6 bg-white overflow-hidden">
                   <div className="max-w-7xl mx-auto space-y-12">
                      <div className="text-center space-y-2">
                        <div className="inline-block px-4 py-1.5 bg-amber-100 rounded-full text-amber-900 font-black text-[8px] uppercase tracking-widest mb-2 italic">STORK LEAGUE EXCLUSIVE</div>
                        <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Carte Speciali Stork League</h2>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                         {specialCards.length > 0 ? specialCards.map(c => (
                           <div key={c.id} className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-orange-100 group aspect-[3/4.2] flex flex-col hover:scale-105 transition-all">
                              <div className="h-[55%] bg-orange-950 relative flex items-center justify-center p-4">
                                 {c.image_url ? <img src={c.image_url} className="h-full w-full object-contain relative z-10" /> : <Sparkles size={40} className="text-amber-500/20" />}
                              </div>
                              <div className="p-5 flex-1 flex flex-col justify-center text-center space-y-2">
                                 <h3 className="font-black uppercase italic text-orange-950 text-[11px] line-clamp-2">{c.name}</h3>
                                 <div className="bg-amber-100 text-amber-700 font-black uppercase text-[8px] py-1 px-3 rounded-full inline-block">{c.effect}</div>
                              </div>
                           </div>
                         )) : <div className="col-span-full py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Le carte verranno svelate presto</div>}
                      </div>
                   </div>
                </section>

                {/* AUTH SECTION */}
                <section ref={loginSectionRef} className="min-h-screen bg-[#1a0702] flex items-center justify-center p-6 relative">
                   <div className="absolute inset-0 opacity-10 concrete-texture" />
                   <div className="w-full max-w-sm bg-white rounded-[48px] p-8 md:p-12 shadow-2xl relative z-10 space-y-10">
                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-orange-950 uppercase italic tracking-tighter">Entra in Azione</h2>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">Crea il tuo team o accedi</p>
                      </div>
                      {authError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black flex items-center gap-3"><AlertTriangle size={16} /> {authError}</div>}
                      <form onSubmit={handleAuth} className="space-y-4">
                        {authMode === 'signup' && (
                          <div className="space-y-4">
                            <input type="text" placeholder="Nome Squadra" value={authData.teamName} onChange={e => setAuthData({...authData, teamName: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none" required />
                            <input type="text" placeholder="Nome Manager" value={authData.managerName} onChange={e => setAuthData({...authData, managerName: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none" required />
                          </div>
                        )}
                        <input type="email" placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none" required />
                        <input type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none" required />
                        <button type="submit" disabled={actionLoading} className="w-full py-5 bg-orange-950 text-amber-500 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          {actionLoading ? <Loader2 className="animate-spin" size={18}/> : (authMode === 'login' ? 'ACCEDI' : 'CREA TEAM')}
                        </button>
                        <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">{authMode === 'login' ? "NON SEI REGISTRATO? REGISTRATI" : "HAI GIÀ UN TEAM? ACCEDI"}</button>
                      </form>
                      <button type="button" onClick={() => setIsAdminPath(true)} className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto"><Lock size={12} /> ACCESSO STAFF</button>
                   </div>
                </section>
            </div>
          </div>
        ) : (
          /* DASHBOARD USER AUTENTICATO */
          <>
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-orange-950 text-white flex-col z-50">
              <div className="p-10 text-center">
                <Shield size={40} className="text-amber-500 mx-auto mb-3" />
                <h1 className="text-xl font-black italic text-amber-500 uppercase tracking-tighter">STORKFANTASY</h1>
                <p className="text-[8px] font-black text-orange-300/40 uppercase tracking-widest mt-2">Ufficiale storkleague</p>
              </div>
              <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20}/>} label="Home" />
                <NavItem active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} icon={<LayoutPanelLeft size={20}/>} label="Il Mio Campo" />
                <NavItem active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={20}/>} label="Calciomercato" />
                <NavItem active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<BarChart3 size={20}/>} label="Classifica" />
                <NavItem active={activeTab === 'tournament_rules'} onClick={() => setActiveTab('tournament_rules')} icon={<BookOpen size={20}/>} label="Reg. Torneo" />
                <NavItem active={activeTab === 'fantasy_rules'} onClick={() => setActiveTab('fantasy_rules')} icon={<FileText size={20}/>} label="Regole Fanta" />
                <NavItem active={activeTab === 'special_cards'} onClick={() => setActiveTab('special_cards')} icon={<Sparkles size={20}/>} label="Carte Speciali" />
              </nav>
              <div className="p-6"><button onClick={handleLogout} className="w-full p-4 rounded-2xl bg-white/5 text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/> Esci</button></div>
            </aside>

            <main className="max-w-6xl mx-auto p-4 sm:p-8 mb-24 lg:mb-0">
              {activeTab === 'home' && (
                <div className="space-y-8 fade-in">
                   {/* TESTATA TEAM */}
                   <div className="bg-orange-950 rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                               {currentUser.team.logo ? <img src={currentUser.team.logo} className="w-full h-full object-cover rounded-xl" /> : <Shield size={32} className="text-amber-500/50" />}
                            </div>
                            <div>
                               <h2 className="text-2xl font-black italic uppercase text-amber-500 tracking-tighter">{currentUser.team.teamName}</h2>
                               <p className="text-orange-300 font-bold uppercase text-[10px] tracking-widest italic">{currentUser.team.managerName}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest">Totale Punti</p>
                            <p className="text-4xl font-black italic">{currentUser.team.totalPoints.toFixed(1)}</p>
                         </div>
                      </div>
                   </div>

                   {/* LIVE VIDEO E NEWS */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                     <div className="space-y-4">
                       <h3 className="text-xs font-black uppercase flex items-center gap-2 italic text-orange-950"><Video size={16} className="text-red-600 animate-pulse"/> Stork League LIVE</h3>
                       {ytEmbedUrl ? (
                          <div className="bg-black rounded-3xl overflow-hidden aspect-video border-4 border-orange-950 shadow-2xl">
                             <iframe className="w-full h-full" src={ytEmbedUrl} frameBorder="0" allow="autoplay; fullscreen" />
                          </div>
                       ) : (
                          <div className="bg-white p-10 rounded-3xl shadow-lg border border-orange-100 text-center opacity-40 italic text-[10px] uppercase font-black">Nessun segnale live attivo</div>
                       )}
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-50">
                           <h3 className="text-[10px] font-black uppercase mb-3 italic flex items-center gap-2 text-orange-950"><Star className="text-amber-500" size={14} fill="currentColor" /> Top Scores</h3>
                           <div className="space-y-2">
                              {currentStarters.length > 0 ? currentStarters.slice(0, 5).map(p => {
                                 const stats = latestCalculatedMatchday?.votes[p.id];
                                 const score = stats && stats.voto > 0 ? (stats.voto + (stats.goals*3)).toFixed(1) : '-';
                                 return (
                                 <div key={p.id} className="flex justify-between items-center text-[9px] p-2 bg-slate-50 rounded-lg">
                                    <span className="font-bold uppercase truncate">{p.name}</span>
                                    <span className="font-black text-orange-600">{score}</span>
                                 </div>
                              )}) : <p className="text-[8px] uppercase font-bold text-slate-300 text-center py-2">Rosa da definire</p>}
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
                   </div>

                   {/* SPONSOR */}
                   <div className="pt-6 space-y-4">
                      <h3 className="text-[9px] font-black uppercase text-slate-400 text-center tracking-widest italic opacity-50">Sponsor Ufficiali Stork League</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                         {sponsors.map(s => (
                           <div key={s.id} className="bg-white p-4 rounded-3xl border border-orange-50 shadow-sm flex items-center gap-4">
                             <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center p-2"><img src={s.logo_url} className="w-full h-full object-contain" /></div>
                             <div className="truncate"><p className="text-[10px] font-black uppercase text-orange-950 italic truncate">{s.name}</p></div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'lineup' && (
                <div className="space-y-6 fade-in max-w-2xl mx-auto">
                   <div className="flex justify-between items-end">
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-orange-950">Il Mio Campo</h2>
                      <button onClick={async () => {
                        await dbService.confirmLineup(currentUser.id, settings?.currentMatchday || 1, currentUser.team.currentLineupIds);
                        refreshData();
                        showNotification("Formazione consegnata!");
                      }} disabled={currentUser.team.isLineupConfirmed || settings?.isLineupLocked} className={`px-7 py-2.5 rounded-2xl font-black uppercase text-[10px] shadow-2xl transition-all ${currentUser.team.isLineupConfirmed ? 'bg-emerald-500 text-white' : 'bg-orange-950 text-amber-500'}`}>
                         {currentUser.team.isLineupConfirmed ? 'PRONTA' : 'CONSEGNA'}
                      </button>
                   </div>
                   <Pitch starters={currentStarters} bench={players.filter(p => currentUser.team.playerIds.includes(p.id) && !currentUser.team.currentLineupIds.includes(p.id))} onSetStarter={async (p) => {
                     const newIds = [...currentUser.team.currentLineupIds, p.id];
                     if(newIds.length > 5) return alert("Massimo 5 titolari nel Futsal!");
                     const newTeam = { ...currentUser.team, currentLineupIds: newIds, isLineupConfirmed: false };
                     setCurrentUser({...currentUser, team: newTeam});
                     await dbService.updateProfile(currentUser.id, newTeam);
                   }} onSetBench={async (p) => {
                     const newIds = currentUser.team.currentLineupIds.filter(id => id !== p.id);
                     const newTeam = { ...currentUser.team, currentLineupIds: newIds, isLineupConfirmed: false };
                     setCurrentUser({...currentUser, team: newTeam});
                     await dbService.updateProfile(currentUser.id, newTeam);
                   }} isLocked={currentUser.team.isLineupConfirmed || settings?.isLineupLocked} votes={latestCalculatedMatchday?.votes} />
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-6 fade-in">
                   <div className="bg-orange-950 p-6 rounded-3xl text-white flex justify-between items-center shadow-xl">
                      <div><h2 className="text-2xl font-black uppercase text-amber-500 italic tracking-tighter">Mercato</h2><p className="text-[10px] font-bold text-orange-300 tracking-widest">Budget: {currentUser.team.creditsLeft} SK</p></div>
                      {!settings?.isMarketOpen && <span className="bg-red-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase italic">Mercato Chiuso</span>}
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {players.map(p => {
                        const isBought = currentUser.team.playerIds.includes(p.id);
                        return (
                          <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all ${isBought ? 'bg-amber-50 border-amber-500 shadow-md' : 'bg-white border-slate-100'}`}>
                             <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black ${ROLE_COLORS[p.role]}`}>{p.role}</div>
                                   <div><p className="font-black text-orange-950 uppercase text-[11px]">{p.name}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{p.team}</p></div>
                                </div>
                                <div className="flex items-center gap-4">
                                   <p className="font-black text-orange-950 text-sm italic">{p.price} SK</p>
                                   <button 
                                      disabled={!settings?.isMarketOpen}
                                      onClick={async () => {
                                      let newTeam;
                                      if(isBought) {
                                        newTeam = { ...currentUser.team, playerIds: currentUser.team.playerIds.filter(id => id !== p.id), currentLineupIds: currentUser.team.currentLineupIds.filter(id => id !== p.id), creditsLeft: currentUser.team.creditsLeft + p.price, isLineupConfirmed: false };
                                      } else {
                                        if(currentUser.team.creditsLeft < p.price) return alert("Budget terminato!");
                                        newTeam = { ...currentUser.team, playerIds: [...currentUser.team.playerIds, p.id], creditsLeft: currentUser.team.creditsLeft - p.price, isLineupConfirmed: false };
                                      }
                                      setCurrentUser({...currentUser, team: newTeam});
                                      await dbService.updateProfile(currentUser.id, newTeam);
                                      showNotification(isBought ? "Giocatore venduto" : "Giocatore acquistato");
                                   }} className={`w-10 h-10 rounded-xl text-white shadow-lg flex items-center justify-center ${isBought ? 'bg-red-500' : 'bg-emerald-600'} disabled:opacity-20`}>{isBought ? <Trash2 size={18}/> : <UserPlus size={18}/>}</button>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              )}

              {activeTab === 'standings' && (
                <div className="space-y-6 fade-in max-w-4xl mx-auto">
                   <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Classifica Generale</h2>
                   <div className="bg-white rounded-[40px] shadow-2xl border border-orange-100 overflow-hidden">
                      {allUsers.sort((a,b) => (b.team?.totalPoints||0) - (a.team?.totalPoints||0)).map((u, idx) => (
                         <div key={u.id} className="flex items-center justify-between p-6 border-b last:border-0 hover:bg-slate-50">
                            <div className="flex items-center gap-6">
                               <span className={`font-black text-[14px] w-10 h-10 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-amber-400 text-orange-950 rotate-12' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
                               <div><p className="font-black uppercase text-orange-950 text-[12px]">{u.team.teamName}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{u.team.managerName}</p></div>
                            </div>
                            <p className="text-2xl font-black italic text-orange-950">{u.team.totalPoints.toFixed(1)}</p>
                         </div>
                      ))}
                   </div>
                </div>
              )}

              {activeTab === 'tournament_rules' && (
                <div className="space-y-6 fade-in max-w-4xl mx-auto">
                   <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Torneo Stork League</h2>
                   <div className="bg-white p-8 rounded-[40px] shadow-xl border border-orange-100 prose prose-slate max-w-none">
                      {tournamentRules?.html_content ? <div dangerouslySetInnerHTML={{ __html: tournamentRules.html_content }} /> : <p className="italic text-slate-300">Nessun contenuto caricato dallo staff.</p>}
                   </div>
                </div>
              )}

              {activeTab === 'fantasy_rules' && (
                <div className="space-y-6 fade-in max-w-4xl mx-auto">
                   <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Regole Fantacalcio</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-[40px] p-6 shadow-lg border border-emerald-50">
                        <h3 className="text-[10px] font-black uppercase text-emerald-600 italic mb-4">Bonus (+ Punti)</h3>
                        {fantasyRules.filter(r => r.type === 'bonus').map(r => (
                          <div key={r.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                            <div><p className="font-black uppercase text-[11px] text-orange-950">{r.name}</p><p className="text-[8px] opacity-40 italic">{r.description}</p></div>
                            <span className="font-black text-emerald-600 text-sm">+{r.points}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white rounded-[40px] p-6 shadow-lg border border-red-50">
                        <h3 className="text-[10px] font-black uppercase text-red-600 italic mb-4">Malus (- Punti)</h3>
                        {fantasyRules.filter(r => r.type === 'malus').map(r => (
                          <div key={r.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                            <div><p className="font-black uppercase text-[11px] text-orange-950">{r.name}</p><p className="text-[8px] opacity-40 italic">{r.description}</p></div>
                            <span className="font-black text-red-600 text-sm">{r.points}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'special_cards' && (
                <div className="space-y-6 fade-in">
                   <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Carte Speciali Stork League</h2>
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {specialCards.map(c => (
                        <div key={c.id} className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-orange-100 aspect-[3/4.5] flex flex-col">
                           <div className="h-1/2 bg-orange-950 relative flex items-center justify-center p-4">
                              {c.image_url ? <img src={c.image_url} className="h-full w-full object-contain" /> : <Sparkles size={40} className="text-amber-500/20" />}
                           </div>
                           <div className="p-4 flex-1 flex flex-col justify-center text-center space-y-2">
                              <h3 className="font-black uppercase italic text-orange-950 text-[10px]">{c.name}</h3>
                              <div className="bg-amber-100 text-amber-700 font-black uppercase text-[7px] py-1 px-2 rounded-full inline-block">{c.effect}</div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </main>

            {/* NAV MOBILE RIPRISTINATA */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-orange-950 flex justify-around p-1 pb-10 z-[100] rounded-t-[40px] shadow-2xl border-t border-amber-500/20">
              <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24}/>} />
              <NavBtn active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} icon={<LayoutPanelLeft size={24}/>} />
              <NavBtn active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={24}/>} />
              <NavBtn active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<BarChart3 size={24}/>} />
              <NavBtn active={activeTab === 'tournament_rules'} onClick={() => setActiveTab('tournament_rules')} icon={<BookOpen size={24}/>} />
            </nav>
          </>
        )
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .concrete-texture { background-image: url("https://www.transparenttextures.com/patterns/asfalt-dark.png"); }
      `}</style>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 transition-all duration-300 ${active ? 'text-amber-500 scale-125' : 'text-white/20'}`}>{icon}</button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 rounded-3xl transition-all duration-300 ${active ? 'bg-amber-500 text-orange-950 shadow-2xl scale-105 font-black' : 'text-orange-300/30 hover:bg-white/5 font-bold'}`}>
    <span>{icon}</span>
    <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
  </button>
);

export default App;
