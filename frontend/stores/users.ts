import { defineStore } from 'pinia';
import type { User, PaginatedResponse, CreateUserPayload, UpdateUserPayload } from '~/types';

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [] as User[],
    selectedUser: null as User | null,
    total: 0,
    page: 1,
    limit: 10,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchUsers(params?: { page?: number; limit?: number; search?: string; role?: string; project?: string; teamId?: string }) {
      this.isLoading = true;
      this.error = null;
      try {
        const api = useApi();
        const result = await api.get<PaginatedResponse<User>>('/users', {
          page: params?.page ?? this.page,
          limit: params?.limit ?? this.limit,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.role ? { role: params.role } : {}),
          ...(params?.project ? { project: params.project } : {}),
          ...(params?.teamId ? { teamId: params.teamId } : {}),
        });
        this.users = result.data;
        this.total = result.total;
        this.page = result.page;
        this.limit = result.limit;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch users';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUser(id: string) {
      this.isLoading = true;
      try {
        const api = useApi();
        this.selectedUser = await api.get<User>(`/users/${id}`);
        return this.selectedUser;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch user';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createUser(payload: CreateUserPayload) {
      const api = useApi();
      const user = await api.post<User>('/users', payload);
      this.users.unshift(user);
      this.total++;
      return user;
    },

    async updateUser(id: string, payload: UpdateUserPayload) {
      const api = useApi();
      const updated = await api.patch<User>(`/users/${id}`, payload);
      const idx = this.users.findIndex((u) => u._id === id || u.id === id);
      if (idx !== -1) this.users[idx] = updated;
      return updated;
    },

    async toggleActivation(id: string, isActive: boolean) {
      const api = useApi();
      const updated = await api.patch<User>(`/users/${id}/activate`, { isActive });
      const idx = this.users.findIndex((u) => u._id === id || u.id === id);
      if (idx !== -1) this.users[idx] = updated;
      return updated;
    },

    async resetPassword(id: string, newPassword: string) {
      const api = useApi();
      await api.patch(`/users/${id}/reset-password`, { newPassword });
    },
  },
});
