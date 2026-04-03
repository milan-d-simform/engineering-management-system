<template>
  <div v-if="show" :class="['rounded-md p-4', variantStyles[variant]]">
    <div class="flex">
      <div class="flex-shrink-0 text-lg">{{ icons[variant] }}</div>
      <div class="ml-3">
        <p class="text-sm font-medium">{{ message }}</p>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <button @click="$emit('dismiss')" class="inline-flex rounded-md p-1.5 hover:opacity-75 focus:outline-none">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
    show?: boolean;
    dismissible?: boolean;
  }>(),
  { variant: 'info', show: true, dismissible: false },
);

defineEmits<{ dismiss: [] }>();

const variantStyles = {
  success: 'bg-green-50 text-green-800',
  error: 'bg-red-50 text-red-800',
  warning: 'bg-yellow-50 text-yellow-800',
  info: 'bg-blue-50 text-blue-800',
};

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};
</script>
