<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Sidebar -->
    <div class="fixed inset-y-0 left-0 w-64 bg-indigo-900 text-white flex flex-col z-30">
      <div class="flex items-center justify-center h-16 bg-indigo-800 px-4">
        <span class="text-xl font-bold">⚙️ EMS</span>
      </div>
      <nav class="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
        <NuxtLink
          to="/dashboard"
          class="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
          active-class="bg-indigo-700"
        >
          🏠 Dashboard
        </NuxtLink>
        <template v-if="authStore.isSuperAdmin">
          <NuxtLink
            to="/dashboard/teams"
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
            active-class="bg-indigo-700"
          >
            👥 Teams
          </NuxtLink>
          <NuxtLink
            to="/dashboard/users"
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
            active-class="bg-indigo-700"
          >
            🧑‍💼 Users
          </NuxtLink>
        </template>
        <template v-if="authStore.isAdmin && !authStore.isSuperAdmin">
          <NuxtLink
            to="/dashboard/team-members"
            class="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
            active-class="bg-indigo-700"
          >
            👥 Team Members
          </NuxtLink>
        </template>
        <NuxtLink
          to="/dashboard/profile"
          class="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
          active-class="bg-indigo-700"
        >
          👤 My Profile
        </NuxtLink>
      </nav>
      <!-- User info + logout -->
      <div class="p-4 border-t border-indigo-700">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ authStore.currentUser?.firstName }} {{ authStore.currentUser?.lastName }}</p>
            <RoleBadge :role="authStore.currentUser?.role ?? 'MEMBER'" class="mt-0.5" />
          </div>
        </div>
        <button
          class="mt-3 w-full text-left text-sm text-indigo-300 hover:text-white transition"
          @click="handleLogout"
        >
          🚪 Logout
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="ml-64">
      <header class="bg-white shadow-sm h-16 flex items-center px-6">
        <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
      </header>
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const route = useRoute();

const pageTitle = computed(() => {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/teams': 'Teams',
    '/dashboard/users': 'All Users',
    '/dashboard/team-members': 'Team Members',
    '/dashboard/profile': 'My Profile',
  };
  return map[route.path] ?? 'Dashboard';
});

const userInitials = computed(() => {
  const u = authStore.currentUser;
  if (!u) return '?';
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
});

async function handleLogout() {
  await authStore.logoutFromServer();
  navigateTo('/login');
}
</script>
