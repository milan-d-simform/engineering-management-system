<template>
  <div>
    <label v-if="label" :for="selectId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <select
      :id="selectId"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50"
      :class="{ 'border-red-300': error }"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  modelValue?: string;
  label?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();

const selectId = useId();
</script>
