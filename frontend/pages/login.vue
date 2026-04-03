<template>
  <NuxtLayout name="auth">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h2>
      <form class="space-y-5" @submit.prevent="handleLogin">
        <AppInput
          v-model="form.email"
          label="Email address"
          type="email"
          required
          autocomplete="email"
          :error="errors.email"
        />
        <AppInput
          v-model="form.password"
          label="Password"
          type="password"
          required
          autocomplete="current-password"
          :error="errors.password"
        />
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <NuxtLink to="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </NuxtLink>
          </div>
        </div>
        <AlertMessage v-if="authStore.error" :message="authStore.error" variant="error" />
        <AppButton type="submit" class="w-full" :loading="authStore.isLoading">
          Sign in
        </AppButton>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const authStore = useAuthStore();
const form = reactive({ email: '', password: '' });
const errors = ref<Record<string, string>>({});

async function handleLogin() {
  errors.value = {};
  if (!form.email) { errors.value.email = 'Email is required'; return; }
  if (!form.password) { errors.value.password = 'Password is required'; return; }

  try {
    await authStore.login({ email: form.email, password: form.password });
    navigateTo('/dashboard');
  } catch {
    // error already set in store
  }
}
</script>
