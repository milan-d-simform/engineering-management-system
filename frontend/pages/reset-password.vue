<template>
  <NuxtLayout name="auth">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Reset your password</h2>
      <div v-if="!token">
        <AlertMessage message="Invalid or missing reset token. Please request a new link." variant="error" />
        <div class="mt-4 text-center">
          <NuxtLink to="/forgot-password" class="text-sm text-indigo-600 hover:text-indigo-500">Request new link</NuxtLink>
        </div>
      </div>
      <div v-else-if="success">
        <AlertMessage message="Password reset successfully! You can now log in." variant="success" />
        <div class="mt-4 text-center">
          <NuxtLink to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">Go to login</NuxtLink>
        </div>
      </div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <AppInput
          v-model="password"
          label="New Password"
          type="password"
          required
          hint="Min 8 chars with uppercase, lowercase, number, and special character"
          :error="errors.password"
        />
        <AppInput
          v-model="confirmPassword"
          label="Confirm New Password"
          type="password"
          required
          :error="errors.confirm"
        />
        <AlertMessage v-if="apiError" :message="apiError" variant="error" />
        <AppButton type="submit" class="w-full" :loading="loading">Reset password</AppButton>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const token = computed(() => route.query.token as string | undefined);
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const success = ref(false);
const apiError = ref('');
const errors = ref<Record<string, string>>({});

async function handleSubmit() {
  errors.value = {};
  if (password.value.length < 8) {
    errors.value.password = 'Password must be at least 8 characters';
    return;
  }
  if (password.value !== confirmPassword.value) {
    errors.value.confirm = 'Passwords do not match';
    return;
  }
  loading.value = true;
  apiError.value = '';
  try {
    const config = useRuntimeConfig();
    const response = await fetch(`${config.public.apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, newPassword: password.value }),
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || 'Reset failed');
    }
    success.value = true;
  } catch (err: unknown) {
    apiError.value = err instanceof Error ? err.message : 'Reset failed';
  } finally {
    loading.value = false;
  }
}
</script>
