<template>
  <div>
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900">Teams</h2>
        <p class="text-sm text-gray-500 mt-1">Create and manage engineering teams</p>
      </div>
      <AppButton @click="showCreateModal = true">+ New Team</AppButton>
    </div>

    <DataTable
      :columns="columns"
      :rows="teamsStore.teams"
      :loading="teamsStore.isLoading"
      :has-actions="true"
    >
      <template #cell-createdBy="{ row }">
        {{ getCreatedByName(row as Team) }}
      </template>
      <template #cell-createdAt="{ row }">
        {{ formatDate((row as Team).createdAt) }}
      </template>
      <template #actions="{ row }">
        <div class="flex items-center justify-end space-x-2">
          <AppButton variant="ghost" @click="viewMembers(row as Team)">Members</AppButton>
          <AppButton variant="secondary" @click="openEdit(row as Team)">Edit</AppButton>
          <AppButton variant="ghost" @click="openAssignAdmin(row as Team)">Assign Admin</AppButton>
        </div>
      </template>
    </DataTable>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal || editTeam" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold mb-4">{{ editTeam ? 'Edit Team' : 'Create Team' }}</h3>
          <TeamForm
            :team="editTeam"
            @submit="handleTeamSubmit"
            @cancel="closeModals"
          />
        </div>
      </div>

      <!-- Team Members Modal -->
      <div v-if="membersTeam" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">{{ membersTeam.name }} — Members</h3>
            <AppButton variant="secondary" @click="membersTeam = null">Close</AppButton>
          </div>
          <div v-if="teamsStore.isLoading" class="text-center py-4 text-gray-500">Loading...</div>
          <div v-else-if="!teamsStore.teamMembers.length" class="text-center py-4 text-gray-500">No members yet.</div>
          <ul v-else class="divide-y divide-gray-200">
            <li v-for="member in teamsStore.teamMembers" :key="member._id" class="py-3 flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900">{{ member.firstName }} {{ member.lastName }}</p>
                <p class="text-sm text-gray-500">{{ member.email }}</p>
              </div>
              <RoleBadge :role="member.role" />
            </li>
          </ul>
        </div>
      </div>

      <!-- Assign Admin Modal -->
      <div v-if="assignAdminTeam" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Assign Admin to {{ assignAdminTeam.name }}</h3>
          <AppSelect
            v-model="selectedUserId"
            label="Select User"
            :options="userOptions"
            placeholder="Choose a user..."
          />
          <AlertMessage v-if="assignError" :message="assignError" variant="error" class="mt-3" />
          <div class="flex justify-end space-x-3 mt-4">
            <AppButton variant="secondary" @click="assignAdminTeam = null">Cancel</AppButton>
            <AppButton :loading="assigning" @click="handleAssignAdmin">Assign</AppButton>
          </div>
        </div>
      </div>
    </Teleport>

    <AlertMessage v-if="successMsg" :message="successMsg" variant="success" class="mt-4" />
    <AlertMessage v-if="errorMsg" :message="errorMsg" variant="error" class="mt-4" />
  </div>
</template>

<script setup lang="ts">
import type { Team, CreateTeamPayload, UpdateTeamPayload } from '~/types';

const teamsStore = useTeamsStore();
const usersStore = useUsersStore();

const showCreateModal = ref(false);
const editTeam = ref<Team | null>(null);
const membersTeam = ref<Team | null>(null);
const assignAdminTeam = ref<Team | null>(null);
const selectedUserId = ref('');
const assigning = ref(false);
const assignError = ref('');
const successMsg = ref('');
const errorMsg = ref('');

onMounted(async () => {
  await Promise.all([teamsStore.fetchTeams(), usersStore.fetchUsers()]);
});

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'createdAt', label: 'Created' },
];

const userOptions = computed(() =>
  usersStore.users.map((u) => ({
    value: u._id ?? u.id,
    label: `${u.firstName} ${u.lastName} (${u.email})`,
  })),
);

function getCreatedByName(team: Team) {
  if (typeof team.createdBy === 'object' && team.createdBy) {
    const u = team.createdBy as { firstName: string; lastName: string };
    return `${u.firstName} ${u.lastName}`;
  }
  return '—';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function openEdit(team: Team) {
  editTeam.value = team;
  showCreateModal.value = false;
}

function closeModals() {
  showCreateModal.value = false;
  editTeam.value = null;
}

async function handleTeamSubmit(payload: CreateTeamPayload | UpdateTeamPayload) {
  try {
    if (editTeam.value) {
      await teamsStore.updateTeam(editTeam.value._id ?? editTeam.value.id, payload);
      successMsg.value = 'Team updated successfully';
    } else {
      await teamsStore.createTeam(payload as CreateTeamPayload);
      successMsg.value = 'Team created successfully';
    }
    closeModals();
    setTimeout(() => (successMsg.value = ''), 3000);
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Action failed';
    setTimeout(() => (errorMsg.value = ''), 3000);
  }
}

async function viewMembers(team: Team) {
  membersTeam.value = team;
  await teamsStore.fetchTeamMembers(team._id ?? team.id);
}

function openAssignAdmin(team: Team) {
  assignAdminTeam.value = team;
  selectedUserId.value = '';
  assignError.value = '';
}

async function handleAssignAdmin() {
  if (!selectedUserId.value || !assignAdminTeam.value) return;
  assigning.value = true;
  assignError.value = '';
  try {
    await teamsStore.assignAdmin(assignAdminTeam.value._id ?? assignAdminTeam.value.id, selectedUserId.value);
    assignAdminTeam.value = null;
    successMsg.value = 'Admin assigned successfully';
    setTimeout(() => (successMsg.value = ''), 3000);
  } catch (err: unknown) {
    assignError.value = err instanceof Error ? err.message : 'Failed to assign admin';
  } finally {
    assigning.value = false;
  }
}
</script>
