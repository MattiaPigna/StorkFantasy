
import React from 'react';
import { Home, ShoppingCart, Shield, LayoutPanelLeft, BarChart3, LogOut, Video, Sparkles, Zap as ZapIcon, Trash2, UserPlus, BookOpen, FileText } from 'lucide-react';
import { MarqueeBanner } from '../components/MarqueeBanner';
import { Pitch } from '../components/Pitch';
import { User, AppSettings, Player, Matchday, Sponsor, FantasyRule, SpecialCard, TournamentRules } from '../types';
import { ROLE_COLORS } from '../constants';
import { dbService } from '../services/dbService';

interface DashboardViewProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  settings: AppSettings | null;
  players: Player[];
  allUsers: User[];
  matchdays: Matchday[];
  sponsors: Sponsor[];
  fantasyRules: FantasyRule[];
  specialCards: SpecialCard[];
  tournamentRules: TournamentRules | null;
  handleLogout: () => void;
  ytEmbedUrl: string | null;
  aiTip: string;
  currentStarters: Player[];
  latestCalculatedMatchday: Matchday | undefined;
  refreshData: () => void;
  showNotification: (msg: string) => void;
  setCurrentUser: (u: User) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser, activeTab, setActiveTab, settings, players, allUsers, matchdays,
  sponsors, fantasyRules, specialCards, tournamentRules, handleLogout,
  ytEmbedUrl, aiTip, currentStarters, latestCalculatedMatchday, refreshData,
  showNotification, setCurrentUser
}) => {
  
  const NavBtn = ({ tab, icon }: { tab: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveTab(tab)} className={`p-4 transition-all duration-300 ${activeTab === tab ? 'text-amber-500 scale-125' : 'text-white/20'}`}>{icon}</button>
  );

  const NavItem = ({ tab, icon, label }: { tab: string, icon: React.ReactNode, label: string }) => (
    <button onClick={() => setActiveTab(tab)} className={`w-full flex items-center gap-5 px-6 py-4 rounded-3xl transition-all duration-300 ${activeTab === tab ? 'bg-amber-500 text-orange-950 shadow-2xl scale-105 font-black' : 'text-orange-300/30 hover:bg-white/5 font-bold'}`}>
      <span>{icon}</span>
      <span className="text-[10px] uppercase tracking-widest italic">{label}</span>
    </button>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-orange-950 border-b border-amber-500/20 z-[110] flex items-center justify-between px-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-amber-500" />
          <h1 className="text-lg font-black italic text-white uppercase tracking-tighter">STORK</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-red-400 font-black uppercase text-[9px] active:scale-90 transition-transform">
          <LogOut size={16}/> ESCI
        </button>
      </header>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-orange-950 text-white flex-col z-50">
        <div className="p-10 text-center">
          <Shield size={40} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-black italic text-amber-500 uppercase tracking-tighter">STORKFANTASY</h1>
          <p className="text-[8px] font-black text-orange-300/40 uppercase tracking-widest mt-2">Ufficiale storkleague</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem tab="home" icon={<Home size={20}/>} label="Home" />
          <NavItem tab="lineup" icon={<LayoutPanelLeft size={20}/>} label="Il Mio Campo" />
          <NavItem tab="market" icon={<ShoppingCart size={20}/>} label="Calciomercato" />
          <NavItem tab="standings" icon={<BarChart3 size={20}/>} label="Classifica" />
          <NavItem tab="tournament_rules" icon={<BookOpen size={20}/>} label="Reg. Torneo" />
          <NavItem tab="fantasy_rules" icon={<FileText size={20}/>} label="Regole Fanta" />
          <NavItem tab="special_cards" icon={<Sparkles size={20}/>} label="Carte Speciali" />
        </nav>
        <div className="p-6"><button onClick={handleLogout} className="w-full p-4 rounded-2xl bg-white/5 text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/> Esci</button></div>
      </aside>

      <div className="w-full relative">
        <MarqueeBanner settings={settings} />
        <main className="max-w-6xl mx-auto p-4 sm:p-8 mb-24 lg:mb-0 relative">
          {activeTab === 'home' && (
            <div className="space-y-8 fade-in">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase flex items-center gap-2 italic text-orange-950"><Video size={16} className="text-red-600 animate-pulse"/> Stork League LIVE</h3>
                  {ytEmbedUrl ? (
                      <div className="bg-black rounded-3xl overflow-hidden aspect-video border-4 border-orange-950 shadow-2xl"><iframe className="w-full h-full" src={ytEmbedUrl} frameBorder="0" allow="autoplay; fullscreen" /></div>
                  ) : (
                      <div className="bg-white p-10 rounded-3xl shadow-lg border border-orange-100 text-center opacity-40 italic text-[10px] uppercase font-black">Nessun segnale live attivo</div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-50">
                      <h3 className="text-[10px] font-black uppercase mb-3 italic flex items-center gap-2 text-orange-950"><Sparkles className="text-amber-500" size={14} fill="currentColor" /> AI Scout Tip</h3>
                      <p className="text-[11px] font-bold text-orange-900 italic leading-relaxed">"{aiTip}"</p>
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
              
              <div className="pt-8">
                <h3 className="text-[10px] font-black uppercase mb-6 italic text-orange-950 flex items-center gap-2">Sponsor Ufficiali</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {sponsors.map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-3xl border border-orange-50 shadow-sm flex items-center justify-center">
                      <img src={s.logo_url} className="h-10 w-auto object-contain" />
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
                if(newIds.length > 5) return alert("Massimo 5 titolari!");
                const newTeam = { ...currentUser.team, currentLineupIds: newIds, isLineupConfirmed: false };
                setCurrentUser({...currentUser, team: newTeam}); await dbService.updateProfile(currentUser.id, newTeam);
              }} onSetBench={async (p) => {
                const newIds = currentUser.team.currentLineupIds.filter(id => id !== p.id);
                const newTeam = { ...currentUser.team, currentLineupIds: newIds, isLineupConfirmed: false };
                setCurrentUser({...currentUser, team: newTeam}); await dbService.updateProfile(currentUser.id, newTeam);
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
                              <button disabled={!settings?.isMarketOpen} onClick={async () => {
                                  let newTeam;
                                  if(isBought) { newTeam = { ...currentUser.team, playerIds: currentUser.team.playerIds.filter(id => id !== p.id), currentLineupIds: currentUser.team.currentLineupIds.filter(id => id !== p.id), creditsLeft: currentUser.team.creditsLeft + p.price, isLineupConfirmed: false }; }
                                  else { if(currentUser.team.creditsLeft < p.price) return alert("Budget terminato!"); newTeam = { ...currentUser.team, playerIds: [...currentUser.team.playerIds, p.id], creditsLeft: currentUser.team.creditsLeft - p.price, isLineupConfirmed: false }; }
                                  setCurrentUser({...currentUser, team: newTeam}); await dbService.updateProfile(currentUser.id, newTeam);
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
              <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Regolamento Torneo</h2>
              <div className="bg-white p-8 rounded-[40px] shadow-xl border border-orange-100 prose prose-slate max-w-none">
                  {tournamentRules?.html_content ? <div dangerouslySetInnerHTML={{ __html: tournamentRules.html_content }} /> : <p className="italic text-slate-300">Contenuto in arrivo...</p>}
              </div>
            </div>
          )}

          {activeTab === 'fantasy_rules' && (
            <div className="space-y-6 fade-in max-w-4xl mx-auto">
              <h2 className="text-2xl font-black uppercase italic text-orange-950 tracking-tighter">Regole Fantacalcio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-[40px] p-6 shadow-lg border border-emerald-50">
                    <h3 className="text-[10px] font-black uppercase text-emerald-600 italic mb-4">Bonus</h3>
                    {fantasyRules.filter(r => r.type === 'bonus').map(r => (
                      <div key={r.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                        <div><p className="font-black uppercase text-[11px] text-orange-950">{r.name}</p><p className="text-[8px] opacity-40 italic">{r.description}</p></div>
                        <span className="font-black text-emerald-600 text-sm">+{r.points}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-[40px] p-6 shadow-lg border border-red-50">
                    <h3 className="text-[10px] font-black uppercase text-red-600 italic mb-4">Malus</h3>
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
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-orange-950 flex justify-around p-1 pb-10 z-[100] rounded-t-[40px] shadow-2xl border-t border-amber-500/20">
        <NavBtn tab="home" icon={<Home size={24}/>} />
        <NavBtn tab="lineup" icon={<LayoutPanelLeft size={24}/>} />
        <NavBtn tab="market" icon={<ShoppingCart size={24}/>} />
        <NavBtn tab="standings" icon={<BarChart3 size={24}/>} />
        <NavBtn tab="tournament_rules" icon={<BookOpen size={24}/>} />
      </nav>
    </>
  );
};
