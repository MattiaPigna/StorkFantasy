
import React, { useState, useEffect, useRef } from 'react';
import { Home, ShoppingCart, Shield, LogOut, Key, LayoutPanelLeft, BarChart3, Trash2, CheckCircle, X, Save, AlertTriangle, UserPlus, Star, Settings as SettingsIcon, ChevronLeft, PlusCircle, Search, RefreshCcw, Loader2, Zap, Edit3, Calculator, Send, Unlock, Lock, Video, Info, Camera, Upload, Award, Coffee, Pizza, Zap as ZapIcon, RotateCcw, ExternalLink, FileText, Sparkles, BookOpen, ArrowDown } from 'lucide-react';
import { ROLE_COLORS } from './constants';
import { Player, UserTeam, AppSettings, User, Role, PlayerMatchStats, Matchday, Sponsor, FantasyRule, SpecialCard, TournamentRules } from './types';
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
  
  const [ytInput, setYtInput] = useState('');
  const [marqueeInput, setMarqueeInput] = useState('');
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  const [selectedMatchday, setSelectedMatchday] = useState<Matchday | null>(null);
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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ teamName: '', managerName: '', logoUrl: '' });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loginSectionRef = useRef<HTMLDivElement>(null);

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
      
      if (currentUser) {
        const profile = await dbService.getProfile(currentUser.id);
        if (profile) {
          setCurrentUser(profile);
          setEditProfileData({ 
            teamName: profile.team.teamName, 
            managerName: profile.team.managerName, 
            logoUrl: profile.team.logo || '' 
          });
        }
      }

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
        alert("Account creato con successo! Ora puoi accedere.");
        setAuthMode('login');
      } else {
        const { user } = await dbService.signIn(authData.email, authData.password);
        if (user) {
          const profile = await dbService.getProfile(user.id);
          if (profile) setCurrentUser(profile);
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

  const handleSaveRule = async () => {
    if (!newRule.name) return;
    setActionLoading(true);
    try {
      await dbService.upsertFantasyRule(newRule);
      setNewRule({ name: '', description: '', points: 1, type: 'bonus' });
      await refreshData(false);
      showNotification("Regola salvata!");
    } catch (e) { alert("Errore salvataggio regola."); } finally { setActionLoading(false); }
  };

  const handleSaveCard = async () => {
    if (!newCard.name) return;
    setActionLoading(true);
    try {
      let url = newCard.image_url;
      if (cardImageFile) url = await dbService.uploadFile('cards', 'card-images', cardImageFile);
      await dbService.upsertSpecialCard({ ...newCard, image_url: url });
      setNewCard({ name: '', description: '', effect: '' });
      setCardImageFile(null);
      await refreshData(false);
      showNotification("Carta salvata!");
    } catch (e) { alert("Errore salvataggio carta."); } finally { setActionLoading(false); }
  };

  const handleSaveTournament = async () => {
    setActionLoading(true);
    try {
      let pdfUrl = tournamentRules?.pdf_url;
      if (tourneyPdfFile) pdfUrl = await dbService.uploadFile('rules', 'pdfs', tourneyPdfFile);
      await dbService.updateTournamentRules({ html_content: tourneyHtml, pdf_url: pdfUrl });
      await refreshData(false);
      showNotification("Regolamento aggiornato!");
    } catch (e) { alert("Errore aggiornamento regolamento."); } finally { setActionLoading(false); }
  };

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentStarters = currentUser?.team.currentLineupIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];
  const latestCalculatedMatchday = matchdays.find(m => m.status === 'calculated');
  const ytEmbedUrl = getYouTubeEmbedUrl(settings?.youtubeLiveUrl);
  const marqueeNews = settings?.marqueeText?.split('\n').filter(t => t.trim().length > 0) || [];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <Loader2 className="animate-spin text-orange-950 mb-4" size={48} />
      <p className="font-black uppercase text-[10px] tracking-widest italic text-orange-950">Lega in Caricamento...</p>
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
            <div className="w-full max-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-800/10">
              <button onClick={() => setIsAdminPath(false)} className="mb-4 flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]"><ChevronLeft size={14}/> Esci</button>
              <h1 className="text-xl font-black text-slate-900 text-center uppercase mb-6 italic">Area Admin</h1>
              <form onSubmit={(e) => { e.preventDefault(); if(adminPass === ADMIN_PASSWORD_REQUIRED) setAdminAuthenticated(true); else alert("Password Errata"); }} className="space-y-4">
                <input type="password" placeholder="Password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold border-2 border-transparent focus:border-orange-500 outline-none" required />
                <button type="submit" className="w-full py-4 bg-orange-950 text-amber-500 rounded-xl font-black uppercase text-[10px] tracking-widest">ENTRA</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-slate-100 p-4 sm:p-6 w-full">
             <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                   <h1 className="text-xl font-black uppercase italic flex items-center gap-2 text-orange-950"><SettingsIcon size={20}/> Gestione</h1>
                   <div className="flex bg-slate-200 p-1 rounded-xl gap-1 overflow-x-auto max-w-full">
                      <button onClick={() => setAdminActiveTab('matchdays')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'matchdays' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Gare</button>
                      <button onClick={() => setAdminActiveTab('players')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'players' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Giocatori</button>
                      <button onClick={() => setAdminActiveTab('rules')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'rules' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Regole Fanta</button>
                      <button onClick={() => setAdminActiveTab('cards')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'cards' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Carte Stork</button>
                      <button onClick={() => setAdminActiveTab('tournament')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'tournament' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Reg. Torneo</button>
                      <button onClick={() => setAdminActiveTab('sponsors')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'sponsors' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Sponsor</button>
                      <button onClick={() => setAdminActiveTab('settings')} className={`px-4 py-2 rounded-lg font-bold uppercase text-[9px] whitespace-nowrap ${adminActiveTab === 'settings' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Setup</button>
                   </div>
                   <button onClick={() => setAdminAuthenticated(false)} className="bg-red-50 p-3 rounded-xl text-red-500"><X size={18}/></button>
                </div>

                {adminActiveTab === 'rules' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow">
                      <h3 className="text-sm font-black uppercase mb-4">Aggiungi Regola Fantacalcio (Bonus/Malus)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" placeholder="Nome" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="p-3 rounded-xl border text-xs" />
                        <input type="text" placeholder="Descrizione" value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} className="p-3 rounded-xl border text-xs" />
                        <input type="number" step="0.5" value={newRule.points} onChange={e => setNewRule({...newRule, points: parseFloat(e.target.value)})} className="p-3 rounded-xl border text-xs" />
                        <select value={newRule.type} onChange={e => setNewRule({...newRule, type: e.target.value as any})} className="p-3 rounded-xl border text-xs">
                          <option value="bonus">Bonus (Verde)</option>
                          <option value="malus">Malus (Rosso)</option>
                        </select>
                      </div>
                      <button onClick={handleSaveRule} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest">SALVA REGOLA FANTA</button>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow overflow-hidden">
                      <table className="w-full text-left text-[10px]">
                        <thead><tr className="border-b uppercase font-black"><th>Nome</th><th>Valore</th><th>Tipo</th><th>Azioni</th></tr></thead>
                        <tbody>
                          {fantasyRules.map(r => (
                            <tr key={r.id} className="border-b">
                              <td className="p-3 font-bold">{r.name}</td>
                              <td className={`p-3 font-black ${r.type === 'bonus' ? 'text-emerald-500' : 'text-red-500'}`}>{r.points > 0 ? `+${r.points}` : r.points}</td>
                              <td className="p-3 uppercase">{r.type}</td>
                              <td className="p-3"><button onClick={() => dbService.deleteFantasyRule(r.id).then(() => refreshData())} className="text-red-500"><Trash2 size={14}/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminActiveTab === 'cards' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow">
                      <h3 className="text-sm font-black uppercase mb-4">Nuova Carta Speciale Stork League</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nome" value={newCard.name} onChange={e => setNewCard({...newCard, name: e.target.value})} className="p-3 rounded-xl border text-xs" />
                        <input type="text" placeholder="Effetto" value={newCard.effect} onChange={e => setNewCard({...newCard, effect: e.target.value})} className="p-3 rounded-xl border text-xs" />
                        <textarea placeholder="Descrizione" value={newCard.description} onChange={e => setNewCard({...newCard, description: e.target.value})} className="p-3 rounded-xl border text-xs md:col-span-2" rows={2} />
                        <div className="md:col-span-2 flex items-center gap-2">
                          <button onClick={() => cardInputRef.current?.click()} className="flex-1 py-3 bg-slate-50 border-2 border-dashed rounded-xl text-xs font-bold uppercase">{cardImageFile ? 'Immagine Selezionata' : 'Carica Immagine (Opzionale)'}</button>
                          <input type="file" ref={cardInputRef} hidden accept="image/*" onChange={e => e.target.files?.[0] && setCardImageFile(e.target.files[0])} />
                        </div>
                      </div>
                      <button onClick={handleSaveCard} className="mt-4 w-full py-3 bg-orange-950 text-amber-500 rounded-xl font-black text-[9px] uppercase tracking-widest">SALVA CARTA STORK</button>
                    </div>
                  </div>
                )}

                {adminActiveTab === 'tournament' && (
                  <div className="bg-white p-6 rounded-2xl shadow space-y-4">
                    <h3 className="text-sm font-black uppercase mb-4">Regolamento Ufficiale Torneo (Stork League)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Carica PDF Regolamento</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => tourneyInputRef.current?.click()} className="flex-1 py-3 bg-slate-50 border-2 border-dashed rounded-xl text-xs font-bold uppercase">{tourneyPdfFile ? 'PDF Selezionato' : 'Seleziona File PDF'}</button>
                          <input type="file" ref={tourneyInputRef} hidden accept="application/pdf" onChange={e => e.target.files?.[0] && setTourneyPdfFile(e.target.files[0])} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Testo HTML Regolamento</label>
                        <textarea value={tourneyHtml} onChange={e => setTourneyHtml(e.target.value)} className="w-full p-4 rounded-xl border text-xs font-mono" rows={10} placeholder="<h1>Titolo</h1><p>Paragrafo...</p>" />
                      </div>
                      <button onClick={handleSaveTournament} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest">SALVA REGOLAMENTO TORNEO</button>
                    </div>
                  </div>
                )}
                {/* Alt Tab Admin ... */}
             </div>
          </div>
        )
      ) : (
        !currentUser ? (
          /* LANDING PAGE PUBBLICA RISTRUTTURATA */
          <div className="w-full bg-[#f8f9fa] overflow-x-hidden">
            {/* HERO SECTION */}
            <header className="min-h-screen bg-[#1a0702] relative flex flex-col items-center justify-center p-6 text-center">
              <div className="absolute inset-0 opacity-10 concrete-texture" />
              <div className="relative z-10 animate-fade-in space-y-4">
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
              <button onClick={() => document.getElementById('info-sections')?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-10 animate-bounce text-amber-500/50">
                <ArrowDown size={32} />
              </button>
            </header>

            <div id="info-sections" className="space-y-0">
                {/* 1. REGOLAMENTO TORNEO STORK LEAGUE */}
                <section className="py-24 px-6 bg-white">
                  <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                      <div className="inline-block px-4 py-1.5 bg-orange-100 rounded-full text-orange-950 font-black text-[8px] uppercase tracking-widest mb-2 italic">STORK LEAGUE OFFICIAL</div>
                      <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Torneo</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Le norme ufficiali del torneo di Calcio a 5</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-2 bg-slate-50 p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 prose prose-slate max-w-none">
                          {tournamentRules?.html_content ? (
                            <div dangerouslySetInnerHTML={{ __html: tournamentRules.html_content }} />
                          ) : (
                            <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] italic">Documento in fase di caricamento...</div>
                          )}
                        </div>
                        <div className="bg-orange-950 p-10 rounded-[40px] text-white shadow-2xl flex flex-col items-center text-center">
                           <BookOpen size={48} className="text-amber-500 mb-6" />
                           <h3 className="font-black uppercase italic text-lg mb-3">Versione PDF Ufficiale</h3>
                           <p className="text-[11px] text-orange-200/60 leading-relaxed mb-8">Consulta le regole del torneo ovunque, scarica il PDF della Stork League.</p>
                           {tournamentRules?.pdf_url ? (
                             <a href={tournamentRules.pdf_url} target="_blank" className="w-full py-4 bg-amber-500 text-orange-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all">
                               DOWNLOAD PDF <ExternalLink size={14}/>
                             </a>
                           ) : (
                             <span className="text-[9px] font-black text-orange-500/50 italic uppercase tracking-widest">Prossimamente Disponibile</span>
                           )}
                        </div>
                    </div>
                  </div>
                </section>

                {/* 2. REGOLAMENTO FANTACALCIO (BONUS/MALUS) */}
                <section className="py-24 px-6 bg-[#fdfaf8]">
                  <div className="max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-2">
                      <div className="inline-block px-4 py-1.5 bg-emerald-100 rounded-full text-emerald-900 font-black text-[8px] uppercase tracking-widest mb-2 italic">FANTASTORK MECHANICS</div>
                      <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Fantacalcio</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Come vengono calcolati i punteggi del tuo team</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase text-emerald-600 italic px-6 flex items-center gap-2 tracking-widest">Bonus (+ Punti)</h3>
                          <div className="bg-white rounded-[40px] shadow-xl border border-emerald-50 overflow-hidden">
                             {fantasyRules.filter(r => r.type === 'bonus').length > 0 ? fantasyRules.filter(r => r.type === 'bonus').map(r => (
                               <div key={r.id} className="p-6 border-b border-slate-50 last:border-0 flex justify-between items-center group hover:bg-emerald-50/20 transition-all">
                                 <div><p className="font-black uppercase text-[12px] text-orange-950">{r.name}</p><p className="text-[9px] text-slate-400 italic font-medium">{r.description}</p></div>
                                 <span className="font-black text-emerald-600 text-xl">+{r.points}</span>
                               </div>
                             )) : <p className="p-12 text-center text-[11px] uppercase font-black text-slate-200 tracking-widest">Calcolo in corso...</p>}
                          </div>
                        </div>
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black uppercase text-red-600 italic px-6 flex items-center gap-2 tracking-widest">Malus (- Punti)</h3>
                          <div className="bg-white rounded-[40px] shadow-xl border border-red-50 overflow-hidden">
                             {fantasyRules.filter(r => r.type === 'malus').length > 0 ? fantasyRules.filter(r => r.type === 'malus').map(r => (
                               <div key={r.id} className="p-6 border-b border-slate-50 last:border-0 flex justify-between items-center group hover:bg-red-50/20 transition-all">
                                 <div><p className="font-black uppercase text-[12px] text-orange-950">{r.name}</p><p className="text-[9px] text-slate-400 italic font-medium">{r.description}</p></div>
                                 <span className="font-black text-red-600 text-xl">{r.points}</span>
                               </div>
                             )) : <p className="p-12 text-center text-[11px] uppercase font-black text-slate-200 tracking-widest">Calcolo in corso...</p>}
                          </div>
                        </div>
                    </div>
                  </div>
                </section>

                {/* 3. CARTE SPECIALI STORK LEAGUE */}
                <section className="py-24 px-6 bg-white overflow-hidden">
                   <div className="max-w-7xl mx-auto space-y-12">
                      <div className="text-center space-y-2">
                        <div className="inline-block px-4 py-1.5 bg-amber-100 rounded-full text-amber-900 font-black text-[8px] uppercase tracking-widest mb-2 italic">STORK LEAGUE EXCLUSIVE</div>
                        <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Carte Speciali</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potenziamenti unici per i manager della Stork League</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                         {specialCards.length > 0 ? specialCards.map(c => (
                           <div key={c.id} className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-orange-100 hover:scale-[1.08] transition-all group aspect-[3/4.2] flex flex-col relative">
                              <div className="h-[55%] bg-orange-950 relative flex items-center justify-center p-4">
                                 <div className="absolute inset-0 opacity-10 concrete-texture" />
                                 {c.image_url ? (
                                   <img src={c.image_url} className="h-full w-full object-contain relative z-10 drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)] group-hover:rotate-3 transition-transform" />
                                 ) : (
                                   <Sparkles size={40} className="text-amber-500/20" />
                                 )}
                              </div>
                              <div className="p-5 flex-1 flex flex-col justify-center text-center space-y-2">
                                 <h3 className="font-black uppercase italic text-orange-950 text-[11px] leading-tight line-clamp-2">{c.name}</h3>
                                 <div className="bg-amber-100 text-amber-700 font-black uppercase text-[8px] py-1 px-3 rounded-full inline-block tracking-tighter">{c.effect}</div>
                              </div>
                           </div>
                         )) : (
                           <div className="col-span-full py-24 text-center">
                             <Sparkles size={64} className="mx-auto mb-6 text-amber-200 animate-pulse"/> 
                             <p className="font-black uppercase text-[10px] text-slate-300 tracking-[0.4em]">In attesa del rilascio ufficiale...</p>
                           </div>
                         )}
                      </div>
                   </div>
                </section>

                {/* 4. LOGIN / REGISTRAZIONE */}
                <section ref={loginSectionRef} className="min-h-screen bg-[#1a0702] flex items-center justify-center p-6 relative">
                   <div className="absolute inset-0 opacity-10 concrete-texture" />
                   <div className="w-full max-w-sm bg-white rounded-[48px] p-8 md:p-12 shadow-2xl relative z-10 space-y-10 animate-fade-in-up border border-white/10">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-orange-950 rounded-2xl mx-auto flex items-center justify-center mb-4"><Shield className="text-amber-500" size={24}/></div>
                        <h2 className="text-3xl font-black text-orange-950 uppercase italic tracking-tighter">Entra in Azione</h2>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest italic">Gestisci il tuo team della Stork League</p>
                      </div>

                      {authError && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black flex items-center gap-3 border border-red-100 shadow-sm">
                          <AlertTriangle size={16} /> {authError}
                        </div>
                      )}

                      <form onSubmit={handleAuth} className="space-y-4">
                        {authMode === 'signup' && (
                          <div className="space-y-4 animate-fade-in">
                            <input type="text" placeholder="Nome Squadra" value={authData.teamName} onChange={e => setAuthData({...authData, teamName: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none transition-all placeholder:text-slate-300" required />
                            <input type="text" placeholder="Nome Manager" value={authData.managerName} onChange={e => setAuthData({...authData, managerName: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none transition-all placeholder:text-slate-300" required />
                          </div>
                        )}
                        <input type="email" placeholder="Email" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none transition-all placeholder:text-slate-300" required />
                        <input type="password" placeholder="Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-black border-2 border-transparent focus:border-amber-500 outline-none transition-all placeholder:text-slate-300" required />
                        
                        <div className="pt-4">
                          <button type="submit" disabled={actionLoading} className="w-full py-5 bg-orange-950 text-amber-500 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 group">
                            {actionLoading ? <Loader2 className="animate-spin" size={18}/> : (authMode === 'login' ? 'ACCEDI ORA' : 'CREA SQUADRA')}
                            <Zap size={14} className="group-hover:animate-pulse" />
                          </button>
                        </div>

                        <div className="text-center pt-4">
                           <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all">
                             {authMode === 'login' ? "NON SEI REGISTRATO? CREA UN TEAM" : "HAI GIÀ UN TEAM? ACCEDI"}
                           </button>
                        </div>
                      </form>

                      <div className="text-center pt-10 border-t border-slate-50">
                        <button type="button" onClick={() => setIsAdminPath(true)} className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] flex items-center justify-center gap-2 mx-auto hover:text-orange-950 transition-colors">
                          <Lock size={12} /> ACCESSO STAFF
                        </button>
                      </div>
                   </div>
                </section>
            </div>
          </div>
        ) : (
          /* DASHBOARD USER AUTENTICATO */
          <>
            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-orange-950 text-white flex-col z-50">
              <div className="p-10 text-center">
                <Shield size={40} className="text-amber-500 mx-auto mb-3 drop-shadow-lg" />
                <h1 className="text-xl font-black italic text-amber-500 uppercase tracking-tighter">STORKFANTASY</h1>
                <p className="text-[8px] font-black text-orange-300/40 uppercase tracking-widest mt-2">Ufficiale storkleague</p>
              </div>
              <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 px-6 mb-3">Principale</div>
                <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={20}/>} label="Home" />
                <NavItem active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} icon={<LayoutPanelLeft size={20}/>} label="Il Mio Campo" />
                <NavItem active={activeTab === 'market'} onClick={() => setActiveTab('market')} icon={<ShoppingCart size={20}/>} label="Calciomercato" />
                <NavItem active={activeTab === 'standings'} onClick={() => setActiveTab('standings')} icon={<BarChart3 size={20}/>} label="Classifica" />
                
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 px-6 mt-8 mb-3">Informazioni</div>
                <NavItem active={activeTab === 'tournament_rules'} onClick={() => setActiveTab('tournament_rules')} icon={<BookOpen size={20}/>} label="Regolamento Torneo" />
                <NavItem active={activeTab === 'fantasy_rules'} onClick={() => setActiveTab('fantasy_rules')} icon={<FileText size={20}/>} label="Regole Fantacalcio" />
                <NavItem active={activeTab === 'special_cards'} onClick={() => setActiveTab('special_cards')} icon={<Sparkles size={20}/>} label="Carte Speciali" />
              </nav>
              <div className="p-6"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/> Esci</button></div>
            </aside>

            <main className="max-w-6xl mx-auto p-4 sm:p-8 mb-24 lg:mb-0">
              {activeTab === 'home' && (
                <div className="space-y-8 fade-in">
                   <div className="bg-orange-950 rounded-[48px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
                      <div className="absolute inset-0 opacity-10 concrete-texture" />
                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                               {currentUser.team.logo ? <img src={currentUser.team.logo} className="w-full h-full object-cover rounded-xl" /> : <Shield size={32} className="text-amber-500/50" />}
                            </div>
                            <div>
                               <h2 className="text-2xl font-black italic uppercase text-amber-500 tracking-tighter">{currentUser.team.teamName}</h2>
                               <p className="text-orange-300 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">Manager: <span className="text-white">{currentUser.team.managerName}</span></p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="text-right"><p className="text-[10px] text-amber-500 uppercase font-black tracking-widest">Totale Punti</p><p className="text-4xl font-black italic">{currentUser.team.totalPoints.toFixed(1)}</p></div>
                            <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="bg-white/10 p-3 rounded-2xl text-amber-500 hover:bg-amber-500 hover:text-orange-950 transition-all shadow-lg">
                               {isEditingProfile ? <X size={20}/> : <Edit3 size={20}/>}
                            </button>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <button onClick={() => setActiveTab('tournament_rules')} className="p-8 bg-blue-600 text-white rounded-[40px] shadow-xl hover:scale-105 active:scale-95 transition-all text-left flex flex-col justify-between aspect-video sm:aspect-auto sm:h-40 border-b-8 border-blue-800 group">
                        <BookOpen size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="space-y-1">
                          <span className="font-black uppercase text-sm italic tracking-tighter block">Regolamento Torneo</span>
                          <span className="text-[9px] font-bold uppercase opacity-60">Stork League Official</span>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('fantasy_rules')} className="p-8 bg-emerald-600 text-white rounded-[40px] shadow-xl hover:scale-105 active:scale-95 transition-all text-left flex flex-col justify-between aspect-video sm:aspect-auto sm:h-40 border-b-8 border-emerald-800 group">
                        <FileText size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="space-y-1">
                          <span className="font-black uppercase text-sm italic tracking-tighter block">Regolamento Fantacalcio</span>
                          <span className="text-[9px] font-bold uppercase opacity-60">Bonus, Malus & Calcoli</span>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('special_cards')} className="p-8 bg-amber-500 text-orange-950 rounded-[40px] shadow-xl hover:scale-105 active:scale-95 transition-all text-left flex flex-col justify-between aspect-video sm:aspect-auto sm:h-40 border-b-8 border-amber-700 group">
                        <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
                        <div className="space-y-1">
                          <span className="font-black uppercase text-sm italic tracking-tighter block">Carte Speciali</span>
                          <span className="text-[9px] font-black uppercase opacity-60">Stork League Powers</span>
                        </div>
                      </button>
                   </div>
                   {/* Restante dashboard ... */}
                </div>
              )}
              {/* Altre tab dashboard ... */}
            </main>
          </>
        )
      )}
    </div>
  );
};

const SponsorCard: React.FC<{ icon: React.ReactNode; name: string; type: string; link?: string }> = ({ icon, name, type, link }) => (
  <div className="bg-white p-5 rounded-[32px] border border-orange-50 shadow-md flex items-center gap-5 hover:shadow-xl transition-all group">
    <div className="w-12 h-12 bg-orange-50 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 p-2 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="truncate flex-1"><p className="text-[11px] font-black uppercase text-orange-950 italic truncate tracking-tight leading-tight">{name}</p><p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{type}</p></div>
    {link && <a href={link} target="_blank" rel="noopener" className="text-orange-950/20 hover:text-orange-950"><ExternalLink size={12} /></a>}
  </div>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-5 transition-all duration-300 ${active ? 'text-amber-500 scale-125' : 'text-white/20'}`}>{icon}</button>
);

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all duration-300 ${active ? 'bg-amber-500 text-orange-950 shadow-2xl scale-105 font-black' : 'text-orange-300/30 hover:bg-white/5 font-bold'}`}>
    <span>{icon}</span>
    <span className="text-[11px] uppercase tracking-widest italic">{label}</span>
  </button>
);

export default App;
