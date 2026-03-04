
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { Player, User, Matchday, Sponsor, FantasyRule, SpecialCard, TournamentRules, AppSettings, PlayerMatchStats } from './types';
import { dbService, supabase } from './services/dbService';
import { getAISuggestion } from './services/geminiService';

// Import Views
import { LandingView } from './views/LandingView';
import { AdminView } from './views/AdminView';
import { DashboardView } from './views/DashboardView';

const ADMIN_PASSWORD_REQUIRED = "stork2025";
const STORAGE_BUCKET = "stork_fantasy";

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

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

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

  const loginSectionRef = useRef<HTMLElement>(null);
  const pwaGuideRef = useRef<HTMLElement>(null);
  const rulesSectionRef = useRef<HTMLElement>(null);
  const cardsSectionRef = useRef<HTMLElement>(null);
  const [aiTip, setAiTip] = useState<string>('Caricamento scout...');

  const [ytInput, setYtInput] = useState('');
  const [marqueeInput, setMarqueeInput] = useState('');

  const scrollToLogin = () => loginSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToPwaGuide = () => pwaGuideRef.current?.scrollIntoView({ behavior: 'smooth' });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    console.log("Starting data refresh...");
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Data refresh timed out after 10 seconds")), 10000)
    );

    try {
      const promises = [
        { name: 'players', promise: dbService.getPlayers() },
        { name: 'settings', promise: dbService.getSettings() },
        { name: 'profiles', promise: dbService.getAllProfiles() },
        { name: 'matchdays', promise: dbService.getMatchdays() },
        { name: 'sponsors', promise: dbService.getSponsors() },
        { name: 'rules', promise: dbService.getFantasyRules() },
        { name: 'cards', promise: dbService.getSpecialCards() },
        { name: 'tournament', promise: dbService.getTournamentRules() }
      ];

      const results = await Promise.race([
        Promise.allSettled(promises.map(p => p.promise)),
        timeoutPromise
      ]) as any;

      if (Array.isArray(results)) {
        results.forEach((result, index) => {
          const name = promises[index].name;
          if (result.status === 'fulfilled') {
            const val = result.value;
            if (name === 'players') setPlayers(val || []);
            if (name === 'settings' && val) {
              setSettings(val);
              setYtInput(val.youtubeLiveUrl || '');
              setMarqueeInput(val.marqueeText || '');
            }
            if (name === 'profiles') setAllUsers(val || []);
            if (name === 'matchdays') setMatchdays(val || []);
            if (name === 'sponsors') setSponsors(val || []);
            if (name === 'rules') setFantasyRules(val || []);
            if (name === 'cards') setSpecialCards(val || []);
            if (name === 'tournament') {
              setTournamentRules(val || null);
              if (val) setTourneyHtml(val.html_content || '');
            }
          } else {
            console.error(`Failed to load ${name}:`, result.reason);
          }
        });
      }

      // Default settings if failed
      if (!settings) {
        setSettings({
          leagueName: 'Stork League',
          isMarketOpen: true,
          isLineupLocked: false,
          marketDeadline: '',
          currentMatchday: 1,
          marqueeText: ''
        });
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await dbService.getProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      }
      console.log("Data refresh process finished.");
    } catch (err: any) {
      console.error("Refresh error:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handleBeforeInstallPrompt = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) setIsAppInstalled(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await dbService.getProfile(session.user.id);
        if (profile) setCurrentUser(profile);
      } else if (event === 'SIGNED_OUT') setCurrentUser(null);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser && activeTab === 'home') {
      getAISuggestion().then(tip => setAiTip(tip));
    }
  }, [currentUser, activeTab]);

  const handleInstallAction = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsAppInstalled(true);
      }
    } else {
      scrollToPwaGuide();
    }
  };

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
    } catch (err: any) { setAuthError(err.message || "Errore autenticazione."); }
    finally { setActionLoading(false); }
  };

  const handleLogout = async () => {
    await dbService.signOut();
    setCurrentUser(null);
  };

  const handleSaveVotes = async (isCalculated: boolean = false) => {
    if (!selectedMatchday) return;
    setActionLoading(true);
    try {
      if (isCalculated) {
        await dbService.calculateMatchday(selectedMatchday.id, matchdayVotes);
        showNotification("Giornata calcolata!");
      } else {
        await dbService.saveMatchdayVotes(selectedMatchday.id, matchdayVotes, 'open');
        showNotification("Voti salvati!");
      }
      setSelectedMatchday(null);
      refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const updateVote = (playerId: string, field: keyof PlayerMatchStats, value: any) => {
    const current = matchdayVotes[playerId] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
    setMatchdayVotes({ ...matchdayVotes, [playerId]: { ...current, [field]: value } });
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setActionLoading(true);
    try {
      await dbService.upsertSettings({ ...settings, youtubeLiveUrl: ytInput, marqueeText: marqueeInput });
      showNotification("Impostazioni salvate!");
      await refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleSaveTournament = async () => {
    setActionLoading(true);
    try {
       let pdfUrl = tournamentRules?.pdf_url || '';
       if(tourneyPdfFile) pdfUrl = await dbService.uploadFile(STORAGE_BUCKET, 'rules', tourneyPdfFile);
       await dbService.upsertTournamentRules({ html_content: tourneyHtml, pdf_url: pdfUrl });
       setTourneyPdfFile(null); 
       showNotification("Regolamento Aggiornato");
       await refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleClearTournament = async () => {
    if (!confirm("Sei sicuro di voler rimuovere il regolamento (HTML e PDF)?")) return;
    setActionLoading(true);
    try {
       await dbService.upsertTournamentRules({ html_content: '', pdf_url: '' });
       setTourneyHtml('');
       setTourneyPdfFile(null);
       showNotification("Regolamento rimosso");
       await refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleAddSponsor = async () => {
    setActionLoading(true);
    try {
      let logoUrl = newSponsor.logo_url || '';
      if (sponsorLogoFile) logoUrl = await dbService.uploadFile(STORAGE_BUCKET, 'sponsors', sponsorLogoFile);
      await dbService.upsertSponsor({ ...newSponsor, logo_url: logoUrl });
      setNewSponsor({ name: '', type: '', link_url: '' });
      setSponsorLogoFile(null);
      showNotification("Sponsor aggiunto!");
      await refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleAddCard = async () => {
    setActionLoading(true);
    try {
      let imgUrl = newCard.image_url || '';
      if (cardImageFile) imgUrl = await dbService.uploadFile(STORAGE_BUCKET, 'cards', cardImageFile);
      await dbService.upsertSpecialCard({ ...newCard, image_url: imgUrl });
      setNewCard({ name: '', description: '', effect: '' });
      setCardImageFile(null);
      showNotification("Carta aggiunta!");
      await refreshData(false);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a0702] flex flex-col items-center justify-center p-8">
      <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
      <p className="font-black uppercase text-[10px] tracking-widest italic text-amber-500/50">Lega in Caricamento...</p>
    </div>
  );

  const showDashboard = currentUser && !isAdminPath;
  const currentStarters = currentUser?.team.currentLineupIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];
  const latestCalculatedMatchday = matchdays.find(m => m.status === 'calculated');
  const ytEmbedUrl = getYouTubeEmbedUrl(settings?.youtubeLiveUrl);

  return (
    <div className={`min-h-screen bg-[#f8f9fa] relative font-sans w-full ${showDashboard ? 'pb-24 lg:pb-0 lg:pl-64 pt-16 lg:pt-0' : ''}`}>
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-white px-6 py-2 rounded-full font-bold uppercase text-[10px] shadow-xl flex items-center gap-2">
          <CheckCircle size={14} /> {notification}
        </div>
      )}

      {isAdminPath ? (
        <AdminView 
          adminAuthenticated={adminAuthenticated} setAdminAuthenticated={setAdminAuthenticated}
          adminPass={adminPass} setAdminPass={setAdminPass} adminActiveTab={adminActiveTab}
          setAdminActiveTab={setAdminActiveTab} setIsAdminPath={setIsAdminPath}
          ADMIN_PASSWORD_REQUIRED={ADMIN_PASSWORD_REQUIRED} selectedMatchday={selectedMatchday}
          setSelectedMatchday={setSelectedMatchday} matchdayVotes={matchdayVotes}
          setMatchdayVotes={setMatchdayVotes} players={players} matchdays={matchdays}
          sponsors={sponsors} fantasyRules={fantasyRules} specialCards={specialCards}
          settings={settings} setSettings={setSettings} tourneyHtml={tourneyHtml}
          setTourneyHtml={setTourneyHtml} tourneyPdfFile={tourneyPdfFile}
          setTourneyPdfFile={setTourneyPdfFile} tourneyInputRef={tourneyInputRef}
          sponsorLogoFile={sponsorLogoFile} setSponsorLogoFile={setSponsorLogoFile}
          sponsorInputRef={sponsorInputRef} newSponsor={newSponsor} setNewSponsor={setNewSponsor}
          newPlayer={newPlayer} setNewPlayer={setNewPlayer} newRule={newRule} setNewRule={setNewRule}
          newCard={newCard} setNewCard={setNewCard} cardImageFile={cardImageFile}
          setCardImageFile={setCardImageFile} cardInputRef={cardInputRef}
          actionLoading={actionLoading} refreshData={refreshData} handleSaveVotes={handleSaveVotes}
          handleSaveSettings={handleSaveSettings} handleSaveTournament={handleSaveTournament}
          handleClearTournament={handleClearTournament}
          handleAddSponsor={handleAddSponsor} handleAddCard={handleAddCard} updateVote={updateVote}
          ytInput={ytInput} setYtInput={setYtInput} marqueeInput={marqueeInput} setMarqueeInput={setMarqueeInput}
        />
      ) : (
        !currentUser ? (
          <LandingView 
            settings={settings} sponsors={sponsors} fantasyRules={fantasyRules}
            specialCards={specialCards} tournamentRules={tournamentRules}
            authMode={authMode} setAuthMode={setAuthMode} authData={authData}
            setAuthData={setAuthData} authError={authError} actionLoading={actionLoading}
            handleAuth={handleAuth} isAppInstalled={isAppInstalled}
            deferredPrompt={deferredPrompt} handleInstallAction={handleInstallAction}
            scrollToLogin={scrollToLogin} setIsAdminPath={setIsAdminPath}
            loginSectionRef={loginSectionRef} pwaGuideRef={pwaGuideRef}
            rulesSectionRef={rulesSectionRef} cardsSectionRef={cardsSectionRef}
          />
        ) : (
          <DashboardView 
            currentUser={currentUser} activeTab={activeTab} setActiveTab={setActiveTab}
            settings={settings} players={players} allUsers={allUsers}
            matchdays={matchdays} sponsors={sponsors} fantasyRules={fantasyRules}
            specialCards={specialCards} tournamentRules={tournamentRules}
            handleLogout={handleLogout} ytEmbedUrl={ytEmbedUrl} aiTip={aiTip}
            currentStarters={currentStarters} latestCalculatedMatchday={latestCalculatedMatchday}
            refreshData={refreshData} showNotification={showNotification}
            setCurrentUser={setCurrentUser}
          />
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

export default App;
