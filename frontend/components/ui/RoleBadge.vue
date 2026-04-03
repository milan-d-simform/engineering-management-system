<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      roleStyles[role],
    ]"
  >
    {{ roleLabels[role] }}
  </span>
</template>

<script setup lang="ts">
import type { UserRole } from '~/types';

defineProps<{ role: UserRole }>();

const roleStyles: Record<UserRole, string> = {
  SUPERADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-green-100 text-green-800',
};

const roleLabels: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MEMBER: 'Member',
};
</script>
