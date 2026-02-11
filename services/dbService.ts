
import { createClient } from '@supabase/supabase-js';
import { User, Player, AppSettings, UserTeam, PlayerMatchStats, Matchday, Sponsor, FantasyRule, SpecialCard, TournamentRules } from "../types";

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
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        team_name: profileData.teamName,
        manager_name: profileData.managerName,
        credits: 250,
        points: 0,
        player_ids: [],
        lineup_ids: [],
        is_lineup_confirmed: false
      }, { onConflict: 'id' });
      
      if (profileError) console.error("Errore creazione profilo:", profileError.message);
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`[Storage] ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Upload failed:", error.message);
      throw error;
    }
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
    const { error: profileErr } = await supabase.from('profiles').update({
      lineup_ids: lineupIds,
      is_lineup_confirmed: true
    } as any).eq('id', userId);
    if (profileErr) throw profileErr;

    const { error: historyErr } = await supabase.from('lineup_history').upsert({
      user_id: userId,
      matchday_number: matchdayNumber,
      player_ids: lineupIds,
      points_earned: 0
    } as any, { onConflict: 'user_id, matchday_number' });

    if (historyErr) throw historyErr;
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
      return (data || []).map(p => ({ ...p, status: p.status || 'available', goals: 0, assists: 0 }));
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
      status: player.status || 'available'
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
        name: s.name || 'Sponsor',
        type: s.type || '',
        logo_url: s.logo_url || '',
        link_url: s.link_url || ''
      }));
    } catch (e) { return []; }
  },

  async upsertSponsor(s: Partial<Sponsor>) {
    const payload: any = { name: s.name, type: s.type || '', logo_url: s.logo_url, link_url: s.link_url || '' };
    if (s.id) payload.id = s.id;
    const { error } = await supabase.from('sponsors').upsert(payload);
    if (error) throw error;
  },

  async deleteSponsor(id: string) {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) throw error;
  },

  async getFantasyRules(): Promise<FantasyRule[]> {
    const { data, error } = await supabase.from('fantasy_rules').select('*').order('type', { ascending: false });
    if (error) return [];
    return data;
  },

  async upsertFantasyRule(rule: Partial<FantasyRule>) {
    const payload = { ...rule };
    if (!payload.id) payload.id = crypto.randomUUID();
    const { error } = await supabase.from('fantasy_rules').upsert(payload);
    if (error) throw error;
  },

  async deleteFantasyRule(id: string) {
    const { error } = await supabase.from('fantasy_rules').delete().eq('id', id);
    if (error) throw error;
  },

  async getSpecialCards(): Promise<SpecialCard[]> {
    const { data, error } = await supabase.from('special_cards').select('*').order('name');
    if (error) return [];
    return data;
  },

  async upsertSpecialCard(card: Partial<SpecialCard>) {
    const payload = { ...card };
    if (!payload.id) payload.id = crypto.randomUUID();
    const { error } = await supabase.from('special_cards').upsert(payload);
    if (error) throw error;
  },

  async deleteSpecialCard(id: string) {
    const { error } = await supabase.from('special_cards').delete().eq('id', id);
    if (error) throw error;
  },

  async getTournamentRules(): Promise<TournamentRules | null> {
    const { data, error } = await supabase.from('tournament_rules').select('*').eq('id', 1).maybeSingle();
    if (error) return null;
    return data;
  },

  async upsertTournamentRules(rules: Partial<TournamentRules>) {
    const { error } = await supabase.from('tournament_rules').upsert({ id: 1, ...rules });
    if (error) throw error;
  },

  async getSettings(): Promise<AppSettings | null> {
    const { data, error } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (error) return null;
    if (!data) return null;
    return {
      leagueName: data.league_name,
      isMarketOpen: data.is_market_open,
      isLineupLocked: data.is_lineup_locked,
      marketDeadline: data.market_deadline,
      currentMatchday: data.current_matchday,
      youtubeLiveUrl: data.youtube_live_url,
      marqueeText: data.marquee_text
    };
  },

  async upsertSettings(settings: AppSettings) {
    const { error } = await supabase.from('settings').upsert({
      id: 1,
      league_name: settings.leagueName,
      is_market_open: settings.isMarketOpen,
      is_lineup_locked: settings.isLineupLocked,
      market_deadline: settings.marketDeadline,
      current_matchday: settings.currentMatchday,
      youtube_live_url: settings.youtubeLiveUrl,
      marquee_text: settings.marqueeText
    } as any);
    if (error) throw error;
  },

  async getMatchdays(): Promise<Matchday[]> {
    const { data, error } = await supabase.from('matchdays').select('*').order('number', { ascending: true });
    if (error) return [];
    return data.map(m => ({
      id: m.id,
      number: m.number,
      status: m.status,
      votes: m.votes || {},
      created_at: m.created_at
    }));
  },

  async createMatchday(number: number) {
    const { error } = await supabase.from('matchdays').insert({
      number,
      status: 'open',
      votes: {}
    } as any);
    if (error) throw error;
  },

  async saveMatchdayVotes(matchdayId: number, votes: Record<string, PlayerMatchStats>, status: string = 'open') {
    const { error } = await supabase.from('matchdays').update({
      votes,
      status
    } as any).eq('id', matchdayId);
    if (error) throw error;
  },

  async calculateMatchday(matchdayId: number, votes: Record<string, PlayerMatchStats>) {
    await this.saveMatchdayVotes(matchdayId, votes, 'calculated');
    const profiles = await this.getAllProfiles();
    
    for (const profile of profiles) {
      const lineup = profile.team.currentLineupIds;
      let matchdayPoints = 0;
      for (const pid of lineup) {
        const stats = votes[pid];
        if (stats && stats.voto > 0) {
          const score = (stats.voto || 0) + 
                       (stats.goals * 3) + 
                       (stats.assists * 1) - 
                       (stats.ownGoals * 2) - 
                       (stats.yellowCard ? 0.5 : 0) - 
                       (stats.redCard ? 1 : 0) + 
                       (stats.extraPoints || 0);
          matchdayPoints += score;
        }
      }
      
      const newTotalPoints = profile.team.totalPoints + matchdayPoints;
      await supabase.from('profiles').update({
        points: newTotalPoints,
        is_lineup_confirmed: false
      } as any).eq('id', profile.id);

      const matchdayResult = await supabase.from('matchdays').select('number').eq('id', matchdayId).single();
      if (matchdayResult.data) {
        await supabase.from('lineup_history').upsert({
          user_id: profile.id,
          matchday_number: matchdayResult.data.number,
          player_ids: lineup,
          points_earned: matchdayPoints
        } as any, { onConflict: 'user_id, matchday_number' });
      }
    }

    const currentSettings = await this.getSettings();
    if (currentSettings) {
      const nextMatchday = currentSettings.currentMatchday + 1;
      await this.upsertSettings({ ...currentSettings, currentMatchday: nextMatchday });
    }
  },

  async deleteMatchday(id: number) {
    const { error } = await supabase.from('matchdays').delete().eq('id', id);
    if (error) throw error;
  },

  async resetAllStandings() {
    await supabase.from('profiles').update({
      points: 0,
      credits: 250,
      player_ids: [],
      lineup_ids: [],
      is_lineup_confirmed: false
    } as any).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('lineup_history').delete().neq('id', 0);
    await supabase.from('settings').update({ current_matchday: 1, is_market_open: true, is_lineup_locked: false } as any).eq('id', 1);
    await supabase.from('matchdays').delete().neq('id', 0);
  }
};
