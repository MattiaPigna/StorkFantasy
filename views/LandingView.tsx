
import React from 'react';
import { Shield, Download, Info, ArrowDown, MousePointer2, PlusCircle, Smartphone, AlertTriangle, Loader2, Lock, ExternalLink, BookOpen, Zap, Sparkles } from 'lucide-react';
import { MarqueeBanner } from '../components/MarqueeBanner';
import { AppSettings, Sponsor, FantasyRule, SpecialCard, TournamentRules } from '../types';

interface LandingViewProps {
  settings: AppSettings | null;
  sponsors: Sponsor[];
  fantasyRules: FantasyRule[];
  specialCards: SpecialCard[];
  tournamentRules: TournamentRules | null;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authData: any;
  setAuthData: (data: any) => void;
  authError: string | null;
  actionLoading: boolean;
  handleAuth: (e: React.FormEvent) => void;
  isAppInstalled: boolean;
  deferredPrompt: any;
  handleInstallAction: () => void;
  scrollToLogin: () => void;
  setIsAdminPath: (path: boolean) => void;
  loginSectionRef: React.RefObject<HTMLElement>;
  pwaGuideRef: React.RefObject<HTMLElement>;
  rulesSectionRef: React.RefObject<HTMLElement>;
  cardsSectionRef: React.RefObject<HTMLElement>;
}

export const LandingView: React.FC<LandingViewProps> = ({
  settings, sponsors, fantasyRules, specialCards, tournamentRules,
  authMode, setAuthMode, authData, setAuthData, authError, actionLoading,
  handleAuth, isAppInstalled, deferredPrompt, handleInstallAction,
  scrollToLogin, setIsAdminPath, loginSectionRef, pwaGuideRef,
  rulesSectionRef, cardsSectionRef
}) => {
  return (
    <div className="w-full bg-[#f8f9fa] overflow-x-hidden">
      <MarqueeBanner settings={settings} />
      
      <header className="min-h-screen bg-[#1a0702] relative flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 opacity-10 concrete-texture" />
        <div className="relative z-10 space-y-4 animate-fade-in-up">
          <Shield size={64} className="text-amber-500 mx-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">STORK<span className="text-amber-500">FANTASY</span></h1>
          <p className="text-amber-600 font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs italic">Fantacalcio ufficiale della storkleague</p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={scrollToLogin} className="px-10 py-4 bg-amber-500 text-orange-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all">PARTECIPA ORA</button>
            {!isAppInstalled && (
              <button onClick={handleInstallAction} className="px-10 py-4 bg-white/10 text-amber-500 border-2 border-amber-500/50 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center gap-2">
                {deferredPrompt ? <Download size={18} /> : <Info size={18} />} 
                {deferredPrompt ? 'INSTALLA APP' : 'GUIDA APP'}
              </button>
            )}
          </div>
        </div>
        <button onClick={() => document.getElementById('pwa-guide')?.scrollIntoView({ behavior: 'smooth' })} className="absolute bottom-10 animate-bounce text-amber-500/50">
          <ArrowDown size={32} />
        </button>
      </header>

      <section ref={pwaGuideRef as any} id="pwa-guide" className="py-24 px-6 bg-[#fdfaf8]">
        <div className="max-w-5xl mx-auto space-y-12 text-center">
          <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter">Trasforma il sito in App</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-xl space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto"><MousePointer2 size={32} /></div>
              <h3 className="font-black uppercase italic text-orange-950 text-sm">1. Menu Browser</h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">Su Android clicca i tre puntini, su iPhone clicca l'icona "Condividi".</p>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-xl space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto"><PlusCircle size={32} /></div>
              <h3 className="font-black uppercase italic text-orange-950 text-sm">2. Aggiungi a Home</h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">Seleziona "Aggiungi a schermata Home" o "Installa App".</p>
            </div>
            <div className="bg-white p-10 rounded-[40px] shadow-xl space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mx-auto"><Shield size={32} /></div>
              <h3 className="font-black uppercase italic text-orange-950 text-sm">3. Inizia il Gioco</h3>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">L'icona StorkFantasy apparirà nella tua griglia delle app!</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white border-y border-orange-50">
        <div className="max-w-5xl mx-auto space-y-12">
           <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter text-center">Sponsor Ufficiali</h2>
           <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              {sponsors.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50 hover:scale-105 transition-all flex items-center justify-center">
                  <img src={s.logo_url} className="h-16 w-auto object-contain grayscale hover:grayscale-0 transition-all" alt={s.name} />
                </div>
              ))}
              {sponsors.length === 0 && <p className="text-slate-300 italic uppercase text-[10px] font-black">Nessun sponsor registrato</p>}
           </div>
        </div>
      </section>

      <section ref={rulesSectionRef as any} className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-12">
           <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter text-center">Regole Fantacalcio</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-emerald-100">
                <h3 className="text-xs font-black uppercase text-emerald-600 italic mb-6 flex items-center gap-2">
                   <Zap size={16} fill="currentColor" /> Bonus Punteggio
                </h3>
                <div className="space-y-4">
                  {fantasyRules.filter(r => r.type === 'bonus').map(r => (
                    <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <div><p className="font-black uppercase text-[11px] text-orange-950">{r.name}</p><p className="text-[9px] opacity-50 italic">{r.description}</p></div>
                      <span className="font-black text-emerald-600 text-sm">+{r.points}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[40px] p-8 shadow-sm border border-red-100">
                <h3 className="text-xs font-black uppercase text-red-600 italic mb-6 flex items-center gap-2">
                   <AlertTriangle size={16} fill="currentColor" /> Malus Punteggio
                </h3>
                <div className="space-y-4">
                  {fantasyRules.filter(r => r.type === 'malus').map(r => (
                    <div key={r.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <div><p className="font-black uppercase text-[11px] text-orange-950">{r.name}</p><p className="text-[9px] opacity-50 italic">{r.description}</p></div>
                      <span className="font-black text-red-600 text-sm">{r.points}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </section>

      <section ref={cardsSectionRef as any} className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter text-center">Carte Speciali Stork League</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {specialCards.map(c => (
                <div key={c.id} className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-orange-100 aspect-[3/4.5] flex flex-col hover:scale-105 transition-all">
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
      </section>

      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="text-4xl font-black uppercase italic text-orange-950 tracking-tighter text-center">Regolamento Ufficiale Torneo</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-orange-50 prose prose-slate max-w-none">
                {tournamentRules?.html_content ? <div dangerouslySetInnerHTML={{ __html: tournamentRules.html_content }} /> : <p className="italic text-slate-300">Documento in arrivo...</p>}
              </div>
              <div className="bg-orange-950 p-10 rounded-[40px] text-white shadow-2xl flex flex-col items-center text-center">
                 <BookOpen size={48} className="text-amber-500 mb-6" />
                 <h3 className="font-black uppercase italic text-lg mb-3">Versione PDF</h3>
                 <p className="text-[11px] text-orange-200/60 leading-relaxed mb-8">Scarica il regolamento ufficiale per la consultazione offline.</p>
                 {tournamentRules?.pdf_url && <a href={tournamentRules.pdf_url} target="_blank" className="w-full py-4 bg-amber-500 text-orange-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">DOWNLOAD PDF <ExternalLink size={14}/></a>}
              </div>
          </div>
        </div>
      </section>

      <section ref={loginSectionRef as any} className="min-h-screen bg-[#1a0702] flex items-center justify-center p-6 relative">
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
  );
};
