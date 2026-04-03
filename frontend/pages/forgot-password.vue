<template>
  <NuxtLayout name="auth">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Forgot password</h2>
      <p class="text-sm text-gray-600 mb-6">
        Enter your email and we'll send you a reset link.
      </p>
      <div v-if="sent">
        <AlertMessage
          message="If an account exists with that email, you'll receive a reset link shortly."
          variant="success"
        />
        <div class="mt-4 text-center">
          <NuxtLink to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">Back to login</NuxtLink>
        </div>
      </div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <AppInput v-model="email" label="Email address" type="email" required :error="error" />
        <AppButton type="submit" class="w-full" :loading="loading">Send reset link</AppButton>
        <div class="text-center">
          <NuxtLink to="/login" class="text-sm text-indigo-600 hover:text-indigo-500">Back to login</NuxtLink>
        </div>
      </form>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const email = ref('');
const sent = ref(false);
const loading = ref(false);
const error = ref('');

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const config = useRuntimeConfig();
    await fetch(`${config.public.apiBaseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });
    sent.value = true; // Always show success (prevent email enumeration)
  } catch {
    error.value = 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
