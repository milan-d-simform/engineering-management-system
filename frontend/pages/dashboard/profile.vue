<template>
  <div class="max-w-2xl mx-auto">
    <div class="bg-white rounded-xl shadow p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
          {{ initials }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">{{ authStore.currentUser?.firstName }} {{ authStore.currentUser?.lastName }}</h2>
          <RoleBadge :role="authStore.currentUser?.role ?? 'MEMBER'" />
          <p class="text-sm text-gray-500 mt-1">{{ authStore.currentUser?.email }}</p>
        </div>
      </div>

      <div v-if="!editing">
        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-sm font-medium text-gray-500">Phone</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ authStore.currentUser?.phone || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Status</dt>
            <dd class="mt-1">
              <span :class="authStore.currentUser?.isActive ? 'text-green-600' : 'text-red-600'" class="text-sm font-medium">
                {{ authStore.currentUser?.isActive ? '● Active' : '● Inactive' }}
              </span>
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-sm font-medium text-gray-500">Bio</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ authStore.currentUser?.bio || '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Member Since</dt>
            <dd class="mt-1 text-sm text-gray-900">{{ formatDate(authStore.currentUser?.createdAt ?? '') }}</dd>
          </div>
        </dl>
        <div class="mt-6">
          <AppButton @click="editing = true">Edit Profile</AppButton>
        </div>
      </div>

      <div v-else>
        <form class="space-y-4" @submit.prevent="handleUpdate">
          <div class="grid grid-cols-2 gap-4">
            <AppInput v-model="form.firstName" label="First Name" required :error="errors.firstName" />
            <AppInput v-model="form.lastName" label="Last Name" required :error="errors.lastName" />
          </div>
          <AppInput v-model="form.phone" label="Phone" type="tel" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              v-model="form.bio"
              rows="3"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <AlertMessage v-if="updateError" :message="updateError" variant="error" />
          <AlertMessage v-if="updateSuccess" message="Profile updated successfully!" variant="success" />
          <div class="flex space-x-3">
            <AppButton type="submit" :loading="updating">Save Changes</AppButton>
            <AppButton type="button" variant="secondary" @click="editing = false">Cancel</AppButton>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const usersStore = useUsersStore();
const editing = ref(false);
const updating = ref(false);
const updateError = ref('');
const updateSuccess = ref(false);
const errors = ref<Record<string, string>>({});

const form = reactive({
  firstName: authStore.currentUser?.firstName ?? '',
  lastName: authStore.currentUser?.lastName ?? '',
  phone: authStore.currentUser?.phone ?? '',
  bio: authStore.currentUser?.bio ?? '',
});

const initials = computed(() => {
  const u = authStore.currentUser;
  if (!u) return '?';
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
});

function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function handleUpdate() {
  errors.value = {};
  if (!form.firstName) { errors.value.firstName = 'Required'; return; }
  if (!form.lastName) { errors.value.lastName = 'Required'; return; }

  updating.value = true;
  updateError.value = '';
  updateSuccess.value = false;
  try {
    const userId = authStore.currentUser!._id ?? authStore.currentUser!.id;
    const updated = await usersStore.updateUser(userId, {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
    });
    authStore.updateCurrentUser(updated);
    updateSuccess.value = true;
    editing.value = false;
    setTimeout(() => (updateSuccess.value = false), 3000);
  } catch (err: unknown) {
    updateError.value = err instanceof Error ? err.message : 'Update failed';
  } finally {
    updating.value = false;
  }
}
</script>
