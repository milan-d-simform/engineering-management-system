<template>
  <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
    <!-- Search / toolbar slot -->
    <div v-if="$slots.toolbar" class="bg-white px-4 py-3 border-b border-gray-200">
      <slot name="toolbar" />
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
              :class="col.class"
            >
              {{ col.label }}
            </th>
            <th v-if="hasActions" scope="col" class="relative px-4 py-3">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-if="loading">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="px-4 py-8 text-center text-gray-500">
              <div class="flex justify-center">
                <svg class="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + (hasActions ? 1 : 0)" class="px-4 py-8 text-center text-gray-500">
              No records found.
            </td>
          </tr>
          <tr v-for="(row, i) in rows" :key="i" class="hover:bg-gray-50 transition">
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-gray-700 whitespace-nowrap"
              :class="col.class"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="(row as Record<string, unknown>)[col.key]">
                {{ (row as Record<string, unknown>)[col.key] ?? '—' }}
              </slot>
            </td>
            <td v-if="hasActions" class="px-4 py-3 text-right text-sm whitespace-nowrap">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > limit" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
      <div class="text-sm text-gray-700">
        Showing {{ (page - 1) * limit + 1 }}–{{ Math.min(page * limit, total) }} of {{ total }}
      </div>
      <div class="flex space-x-2">
        <AppButton
          variant="secondary"
          :disabled="page <= 1"
          @click="$emit('page-change', page - 1)"
        >
          ← Prev
        </AppButton>
        <AppButton
          variant="secondary"
          :disabled="page * limit >= total"
          @click="$emit('page-change', page + 1)"
        >
          Next →
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: Array<{ key: string; label: string; class?: string }>;
  rows: unknown[];
  loading?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  hasActions?: boolean;
}>();

defineEmits<{ 'page-change': [page: number] }>();
</script>
