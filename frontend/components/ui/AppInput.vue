<template>
  <div>
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
      :class="{ 'border-red-300 focus:border-red-500 focus:ring-red-500': error }"
      v-bind="$attrs"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-if="hint && !error" class="mt-1 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    hint?: string;
    autocomplete?: string;
  }>(),
  { type: 'text' },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const inputId = useId();
</script>
