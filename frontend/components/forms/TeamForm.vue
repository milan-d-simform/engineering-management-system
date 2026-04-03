<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <AppInput v-model="form.name" label="Team Name" required :error="errors.name" />
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        v-model="form.description"
        rows="3"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="Team description (optional)"
      />
    </div>
    <AlertMessage v-if="submitError" :message="submitError" variant="error" />
    <div class="flex justify-end space-x-3 pt-2">
      <AppButton type="button" variant="secondary" @click="$emit('cancel')">Cancel</AppButton>
      <AppButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Update Team' : 'Create Team' }}</AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Team, CreateTeamPayload, UpdateTeamPayload } from '~/types';

const props = defineProps<{ team?: Team | null }>();
const emit = defineEmits<{
  submit: [payload: CreateTeamPayload | UpdateTeamPayload];
  cancel: [];
}>();

const isEdit = computed(() => !!props.team);
const isSubmitting = ref(false);
const submitError = ref('');
const errors = ref<Record<string, string>>({});

const form = reactive({
  name: props.team?.name ?? '',
  description: props.team?.description ?? '',
});

function validate() {
  errors.value = {};
  if (!form.name) errors.value.name = 'Required';
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validate()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    emit('submit', {
      name: form.name,
      description: form.description || undefined,
    });
  } catch (err: unknown) {
    submitError.value = err instanceof Error ? err.message : 'Submission failed';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
