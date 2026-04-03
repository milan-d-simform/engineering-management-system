<template>
  <div>
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ authStore.isSuperAdmin ? 'All Users' : 'Team Members' }}
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ usersStore.total }} total users
        </p>
      </div>
      <AppButton @click="showCreateModal = true">+ New User</AppButton>
    </div>

    <DataTable
      :columns="columns"
      :rows="usersStore.users"
      :loading="usersStore.isLoading"
      :total="usersStore.total"
      :page="usersStore.page"
      :limit="usersStore.limit"
      :has-actions="true"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="flex flex-wrap gap-2 items-center">
          <input
            v-model="search"
            type="search"
            placeholder="Search name, email, project..."
            class="w-56 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <!-- Team filter: SUPERADMIN only -->
          <select
            v-if="authStore.isSuperAdmin"
            v-model="filterTeam"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Teams</option>
            <option
              v-for="team in teamsStore.teams"
              :key="team._id ?? team.id"
              :value="team._id ?? team.id"
            >{{ team.name }}</option>
          </select>
          <select
            v-model="filterRole"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Roles</option>
            <option value="SUPERADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
          </select>
          <input
            v-model="filterProject"
            type="search"
            placeholder="Filter by project..."
            class="w-44 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            v-if="search || filterTeam || filterRole || filterProject"
            type="button"
            class="text-sm text-gray-500 hover:text-gray-700 underline"
            @click="clearFilters"
          >Clear</button>
        </div>
      </template>
      <template #cell-role="{ row }">
        <RoleBadge :role="(row as User).role" />
      </template>
      <template #cell-projects="{ row }">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="project in (row as User).projects"
            :key="project"
            class="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
          >{{ project }}</span>
          <span v-if="!(row as User).projects?.length" class="text-xs text-gray-400">—</span>
        </div>
      </template>
      <template #cell-isActive="{ row }">
        <StatusToggle
          :model-value="(row as User).isActive"
          @update:model-value="(val) => handleToggleActive(row as User, val)"
        />
      </template>
      <template #cell-fullName="{ row }">
        {{ (row as User).firstName }} {{ (row as User).lastName }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end space-x-2">
          <AppButton variant="ghost" @click="openEdit(row as User)">Edit</AppButton>
          <AppButton variant="secondary" @click="openResetPassword(row as User)">Reset Pwd</AppButton>
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit User Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal || editUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-4">
          <h3 class="text-lg font-semibold mb-4">{{ editUser ? 'Edit User' : 'Create User' }}</h3>
          <AlertMessage v-if="modalError" :message="modalError" variant="error" class="mb-4" />
          <UserForm
            :user="editUser"
            :teams="teamsStore.teams"
            :show-role="authStore.isSuperAdmin"
            :show-team="authStore.isSuperAdmin"
            @submit="handleUserSubmit"
            @cancel="closeModals"
          />
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="resetPwdUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Reset Password for {{ resetPwdUser.firstName }}</h3>
          <AppInput
            v-model="newPassword"
            label="New Password"
            type="password"
            required
            :error="pwdError"
          />
          <AlertMessage v-if="resetError" :message="resetError" variant="error" class="mt-3" />
          <div class="flex justify-end space-x-3 mt-4">
            <AppButton variant="secondary" @click="resetPwdUser = null">Cancel</AppButton>
            <AppButton :loading="resettingPwd" @click="handleResetPassword">Reset</AppButton>
          </div>
        </div>
      </div>
    </Teleport>

    <AlertMessage v-if="successMsg" :message="successMsg" variant="success" class="mt-4" />
    <AlertMessage v-if="errorMsg" :message="errorMsg" variant="error" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import type { User, CreateUserPayload, UpdateUserPayload } from '~/types';

const authStore = useAuthStore();
const usersStore = useUsersStore();
const teamsStore = useTeamsStore();

const showCreateModal = ref(false);
const editUser = ref<User | null>(null);
const resetPwdUser = ref<User | null>(null);
const newPassword = ref('');
const pwdError = ref('');
const resetError = ref('');
const resettingPwd = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const modalError = ref('');
const search = ref('');
const filterRole = ref('');
const filterProject = ref('');
const filterTeam = ref('');

function currentFilters(page = 1) {
  return {
    page,
    search: search.value || undefined,
    role: filterRole.value || undefined,
    project: filterProject.value || undefined,
    teamId: filterTeam.value || undefined,
  };
}

// Single reactive watcher — fires whenever any filter ref changes.
// Short debounce batches simultaneous changes (e.g. clearFilters, default team set on mount).
let filterTimer: ReturnType<typeof setTimeout>;
watch([search, filterRole, filterProject, filterTeam], () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => usersStore.fetchUsers(currentFilters(1)), 300);
});

function clearFilters() {
  search.value = '';
  filterRole.value = '';
  filterProject.value = '';
  filterTeam.value = teamsStore.teams[0]?._id ?? teamsStore.teams[0]?.id ?? '';
  // watcher above will fire and refetch
}

onMounted(async () => {
  if (authStore.isSuperAdmin) {
    await teamsStore.fetchTeams();
    // Set default to first team — the watcher will trigger the first fetch
    filterTeam.value = teamsStore.teams[0]?._id ?? teamsStore.teams[0]?.id ?? '';
  } else {
    await usersStore.fetchUsers(currentFilters(1));
  }
});

const columns = [
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'projects', label: 'Projects' },
  { key: 'isActive', label: 'Active' },
];

function openEdit(user: User) {
  editUser.value = user;
}

function openResetPassword(user: User) {
  resetPwdUser.value = user;
  newPassword.value = '';
  pwdError.value = '';
  resetError.value = '';
}

function closeModals() {
  showCreateModal.value = false;
  editUser.value = null;
  modalError.value = '';
}

async function handleUserSubmit(payload: CreateUserPayload | UpdateUserPayload) {
  modalError.value = '';
  try {
    if (editUser.value) {
      await usersStore.updateUser(editUser.value._id ?? editUser.value.id, payload as UpdateUserPayload);
      successMsg.value = 'User updated successfully';
    } else {
      await usersStore.createUser(payload as CreateUserPayload);
      successMsg.value = 'User created successfully';
    }
    closeModals();
    setTimeout(() => (successMsg.value = ''), 3000);
  } catch (err: unknown) {
    modalError.value = err instanceof Error ? err.message : 'Action failed';
  }
}

async function handleToggleActive(user: User, isActive: boolean) {
  try {
    await usersStore.toggleActivation(user._id ?? user.id, isActive);
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to update status';
  }
}

async function handleResetPassword() {
  pwdError.value = '';
  if (newPassword.value.length < 8) {
    pwdError.value = 'Password must be at least 8 characters';
    return;
  }
  resettingPwd.value = true;
  resetError.value = '';
  try {
    await usersStore.resetPassword(resetPwdUser.value!._id ?? resetPwdUser.value!.id, newPassword.value);
    resetPwdUser.value = null;
    successMsg.value = 'Password reset successfully';
    setTimeout(() => (successMsg.value = ''), 3000);
  } catch (err: unknown) {
    resetError.value = err instanceof Error ? err.message : 'Reset failed';
  } finally {
    resettingPwd.value = false;
  }
}

function handlePageChange(page: number) {
  usersStore.fetchUsers(currentFilters(page));
}
</script>
