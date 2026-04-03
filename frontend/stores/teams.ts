import { defineStore } from 'pinia';
import type { Team, User, CreateTeamPayload, UpdateTeamPayload } from '~/types';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    teams: [] as Team[],
    selectedTeam: null as Team | null,
    teamMembers: [] as User[],
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchTeams() {
      this.isLoading = true;
      this.error = null;
      try {
        const api = useApi();
        this.teams = await api.get<Team[]>('/teams');
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch teams';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchTeam(id: string) {
      this.isLoading = true;
      try {
        const api = useApi();
        this.selectedTeam = await api.get<Team>(`/teams/${id}`);
        return this.selectedTeam;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch team';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createTeam(payload: CreateTeamPayload) {
      const api = useApi();
      const team = await api.post<Team>('/teams', payload);
      this.teams.unshift(team);
      return team;
    },

    async updateTeam(id: string, payload: UpdateTeamPayload) {
      const api = useApi();
      const updated = await api.patch<Team>(`/teams/${id}`, payload);
      const idx = this.teams.findIndex((t) => t._id === id || t.id === id);
      if (idx !== -1) this.teams[idx] = updated;
      return updated;
    },

    async assignAdmin(teamId: string, userId: string) {
      const api = useApi();
      return api.post(`/teams/${teamId}/assign-admin`, { userId });
    },

    async fetchTeamMembers(teamId: string) {
      this.isLoading = true;
      try {
        const api = useApi();
        this.teamMembers = await api.get<User[]>(`/teams/${teamId}/members`);
        return this.teamMembers;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
