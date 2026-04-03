<template>
  <div>
    <!-- Stats cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-lg shadow p-6 flex items-center space-x-4">
        <div class="text-3xl">{{ stat.icon }}</div>
        <div>
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          <p class="text-sm text-gray-500">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Welcome card -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-2">
        Welcome back, {{ authStore.currentUser?.firstName }}! 👋
      </h2>
      <p class="text-gray-600">
        You are logged in as <RoleBadge :role="authStore.currentUser?.role ?? 'MEMBER'" class="ml-1" />.
        <span v-if="authStore.isSuperAdmin"> You have full system access.</span>
        <span v-else-if="authStore.isAdmin"> You can manage your team members.</span>
        <span v-else> You can view and update your profile.</span>
      </p>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink
          v-if="authStore.isSuperAdmin"
          to="/dashboard/teams"
          class="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
        >
          <span class="text-2xl mr-3">👥</span>
          <div>
            <p class="font-medium text-indigo-900">Manage Teams</p>
            <p class="text-sm text-indigo-600">Create and manage teams</p>
          </div>
        </NuxtLink>
        <NuxtLink
          v-if="authStore.isAdmin"
          to="/dashboard/users"
          class="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
        >
          <span class="text-2xl mr-3">🧑‍💼</span>
          <div>
            <p class="font-medium text-green-900">{{ authStore.isSuperAdmin ? 'All Users' : 'Team Members' }}</p>
            <p class="text-sm text-green-600">Manage user accounts</p>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/dashboard/profile"
          class="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
        >
          <span class="text-2xl mr-3">👤</span>
          <div>
            <p class="font-medium text-purple-900">My Profile</p>
            <p class="text-sm text-purple-600">View and update your info</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const usersStore = useUsersStore();
const teamsStore = useTeamsStore();

onMounted(async () => {
  if (authStore.isSuperAdmin) {
    await Promise.all([usersStore.fetchUsers(), teamsStore.fetchTeams()]);
  } else if (authStore.isAdmin) {
    await usersStore.fetchUsers();
  }
});

const stats = computed(() => {
  if (authStore.isSuperAdmin) {
    return [
      { icon: '🏢', label: 'Total Teams', value: teamsStore.teams.length },
      { icon: '🧑‍💼', label: 'Total Users', value: usersStore.total },
      {
        icon: '✅',
        label: 'Active Users',
        value: usersStore.users.filter((u) => u.isActive).length,
      },
    ];
  }
  if (authStore.isAdmin) {
    return [
      { icon: '👥', label: 'Team Members', value: usersStore.total },
      { icon: '✅', label: 'Active', value: usersStore.users.filter((u) => u.isActive).length },
      { icon: '🚫', label: 'Inactive', value: usersStore.users.filter((u) => !u.isActive).length },
    ];
  }
  return [
    { icon: '👤', label: 'My Profile', value: '—' },
    { icon: '📅', label: 'Member Since', value: new Date(authStore.currentUser?.createdAt ?? '').getFullYear() || '—' },
    { icon: '🎯', label: 'Projects', value: authStore.currentUser?.projects.length ?? 0 },
  ];
});
</script>
