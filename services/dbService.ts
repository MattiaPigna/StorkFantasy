
import { createClient } from '@supabase/supabase-js';
import { User, Player, AppSettings, UserTeam, PlayerMatchStats, Matchday, Sponsor } from "../types";

const SUPABASE_URL = "https://bquvdggddgjyvtkrwyca.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_s4vUV91k50Jl3UCwtgU19w_ffxaM6C1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const dbService = {
  async signOut() {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setTimeout(() => {
        window.location.href = '/'; 
      }, 100);
    } catch (e) {
      console.error("SignOut Error:", e);
      window.location.reload();
    }
  },

  async signUp(email: string, password: string, profileData: { teamName: string, managerName: string }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        team_name: profileData.teamName,
        manager_name: profileData.managerName,
        credits: 250,
        points: 0,
        player_ids: [],
        lineup_ids: [],
        is_lineup_confirmed: false
      } as any);
      if (profileError) throw profileError;
    }
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id,
        email: '', 
        team: {
          teamName: data.team_name || 'Senza Nome',
          managerName: data.manager_name || 'Manager',
          playerIds: data.player_ids || [],
          currentLineupIds: data.lineup_ids || [],
          creditsLeft: data.credits ?? 250,
          totalPoints: Number(data.points) || 0,
          logo: data.logo_url,
          isLineupConfirmed: data.is_lineup_confirmed || false
        }
      };
    } catch (e) {
      return null;
    }
  },

  async uploadFile(bucket: string, folder: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async updateProfile(userId: string, team: UserTeam) {
    const updateData = {
      team_name: team.teamName,
      manager_name: team.managerName,
      player_ids: team.playerIds,
      lineup_ids: team.currentLineupIds,
      credits: team.creditsLeft,
      points: team.totalPoints,
      logo_url: team.logo,
      is_lineup_confirmed: team.isLineupConfirmed
    };
    const { error } = await supabase.from('profiles').update(updateData as any).eq('id', userId);
    if (error) throw error;
  },

  async confirmLineup(userId: string, matchdayNumber: number, lineupIds: string[]) {
    await supabase.from('profiles').update({
      lineup_ids: lineupIds,
      is_lineup_confirmed: true
    } as any).eq('id', userId);

    const { error } = await supabase.from('lineup_history').upsert({
      user_id: userId,
      matchday_number: matchdayNumber,
      player_ids: lineupIds,
      points_earned: 0
    } as any, { onConflict: 'user_id, matchday_number' });

    if (error) throw error;
  },

  async getAllProfiles(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('points', { ascending: false });
      if (error) return [];
      return (data || []).map(d => ({
        id: d.id, email: '',
        team: { 
          teamName: d.team_name || 'Senza Nome', 
          managerName: d.manager_name || 'Manager', 
          playerIds: d.player_ids || [], 
          currentLineupIds: d.lineup_ids || [], 
          creditsLeft: d.credits ?? 0, 
          totalPoints: Number(d.points) || 0, 
          logo: d.logo_url,
          isLineupConfirmed: !!d.is_lineup_confirmed
        }
      }));
    } catch (e) {
      return [];
    }
  },

  async getPlayers(): Promise<Player[]> {
    try {
      const { data, error } = await supabase.from('players').select('*').order('name');
      if (error) return [];
      return (data || []).map(p => ({ ...p, goals: 0, assists: 0 }));
    } catch (e) {
      return [];
    }
  },

  async upsertPlayer(player: Partial<Player>) {
    const { error } = await supabase.from('players').upsert({
      id: player.id || crypto.randomUUID(),
      name: player.name,
      team: player.team,
      role: player.role,
      price: player.price,
      status: 'available'
    } as any);
    if (error) throw error;
  },

  async deletePlayer(id: string) {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  async getSponsors(): Promise<Sponsor[]> {
    try {
      const { data, error } = await supabase.from('sponsors').select('*').order('name');
      if (error) return [];
      return (data || []).map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        logo_url: s.logo_url
      }));
    } catch (e) { return []; }
  },

  async upsertSponsor(s: Partial<Sponsor>) {
    const { error } = await supabase.from('sponsors').upsert(s as any);
    if (error) throw error;
  },

  async deleteSponsor(id: string) {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) throw error;
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
      if (error || !data) {
        return { leagueName: 'Lega Stork', isMarketOpen: true, isLineupLocked: false, marketDeadline: '', currentMatchday: 1, youtubeLiveUrl: '', marqueeText: '' };
      }
      return {
        leagueName: data.league_name || 'Lega Stork',
        isMarketOpen: data.is_market_open ?? true,
        isLineupLocked: data.is_lineup_locked ?? false,
        marketDeadline: '',
        currentMatchday: data.current_matchday || 1,
        youtubeLiveUrl: data.youtube_live_url || '',
        marqueeText: data.marquee_text || ''
      };
    } catch (e) {
      return { leagueName: 'Lega Stork', isMarketOpen: true, isLineupLocked: false, marketDeadline: '', currentMatchday: 1, youtubeLiveUrl: '', marqueeText: '' };
    }
  },

  async updateSettings(s: AppSettings) {
    const payload: any = {
      id: 1,
      league_name: s.leagueName,
      is_market_open: s.isMarketOpen,
      is_lineup_locked: s.isLineupLocked,
      current_matchday: s.currentMatchday,
      youtube_live_url: s.youtubeLiveUrl,
      marquee_text: s.marqueeText
    };
    const { error } = await supabase.from('settings').upsert(payload);
    if (error) throw error;
  },

  async getMatchdays(): Promise<Matchday[]> {
    try {
      const { data, error } = await supabase.from('matchdays').select('*').order('number', { ascending: false });
      if (error) return [];
      return (data || []).map(m => ({
          id: m.id,
          number: m.number,
          status: m.status,
          votes: m.votes || {}
      }));
    } catch { return []; }
  },

  async createMatchday(number: number) {
    const { error } = await supabase.from('matchdays').insert({
        number: number,
        status: 'open',
        votes: {}
    } as any);
    if (error) throw error;
  },

  async deleteMatchday(matchdayId: number) {
    const { data: matchday, error: fetchErr } = await supabase.from('matchdays').select('*').eq('id', matchdayId).single();
    if (fetchErr || !matchday) return;

    if (matchday.status === 'calculated') {
      const { data: histories } = await supabase.from('lineup_history').select('*').eq('matchday_number', matchday.number);
      if (histories) {
        for (const h of histories) {
          const { data: pData } = await supabase.from('profiles').select('points').eq('id', h.user_id).single();
          if (pData) {
            const newPoints = Math.max(0, (Number(pData.points) || 0) - (Number(h.points_earned) || 0));
            await supabase.from('profiles').update({ points: newPoints } as any).eq('id', h.user_id);
          }
        }
      }
    }

    await supabase.from('lineup_history').delete().eq('matchday_number', matchday.number);
    await supabase.from('matchdays').delete().eq('id', matchdayId);
  },

  async saveMatchdayVotes(matchdayId: number, votes: Record<string, PlayerMatchStats>, status?: 'open' | 'calculated') {
    const updateData: any = { votes };
    if (status) updateData.status = status;
    const { error } = await supabase.from('matchdays').update(updateData).eq('id', matchdayId);
    if (error) throw error;
  },

  async calculateMatchday(matchdayId: number, stats: Record<string, PlayerMatchStats>) {
    const { data: matchday, error: mErr } = await supabase.from('matchdays').select('*').eq('id', matchdayId).single();
    if (mErr || !matchday) throw new Error("Giornata non trovata");

    const { data: histories, error: histErr } = await supabase.from('lineup_history').select('*').eq('matchday_number', matchday.number);
    if (histErr) throw histErr;
    if (!histories || histories.length === 0) throw new Error("Nessuna formazione consegnata.");

    for (const history of histories) {
      let matchdayTotal = 0;
      const pIds = history.player_ids || [];

      pIds.forEach((pid: string) => {
        const s = stats[pid] || { voto: 0, goals: 0, assists: 0, ownGoals: 0, yellowCard: false, redCard: false, extraPoints: 0 };
        const pPoints = (Number(s.voto) || 0) + 
                       (Number(s.goals) * 3) + 
                       (Number(s.assists) * 1) - 
                       (Number(s.ownGoals) * 2) - 
                       (s.yellowCard ? 0.5 : 0) - 
                       (s.redCard ? 1 : 0) + 
                       (Number(s.extraPoints) || 0);
        matchdayTotal += pPoints;
      });

      await supabase.from('lineup_history').update({ points_earned: matchdayTotal } as any).eq('id', history.id);

      const { data: prof } = await supabase.from('profiles').select('points').eq('id', history.user_id).single();
      if (prof) {
        await supabase.from('profiles').update({ 
          points: (Number(prof.points) || 0) + matchdayTotal,
          is_lineup_confirmed: false 
        } as any).eq('id', history.user_id);
      }
    }

    await supabase.from('matchdays').update({ votes: stats, status: 'calculated' } as any).eq('id', matchdayId);
    
    const settings = await this.getSettings();
    await this.updateSettings({ ...settings, currentMatchday: matchday.number + 1 });
    return true;
  },

  async resetAllStandings() {
    await supabase.from('profiles').update({ points: 0, is_lineup_confirmed: false } as any).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('lineup_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('matchdays').update({ status: 'open', votes: {} } as any).neq('id', 0);
  }
};
