<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-4">
      <AppInput v-model="form.firstName" label="First Name" required :error="errors.firstName" />
      <AppInput v-model="form.lastName" label="Last Name" required :error="errors.lastName" />
    </div>
    <AppInput v-model="form.email" label="Email" type="email" required :disabled="isEdit" :error="errors.email" />
    <AppInput
      v-if="!isEdit"
      v-model="form.password"
      label="Password"
      type="password"
      required
      hint="Min 8 chars, uppercase, lowercase, number, and special character"
      :error="errors.password"
    />
    <AppInput v-model="form.phone" label="Phone" type="tel" :error="errors.phone" />
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
      <textarea
        v-model="form.bio"
        rows="3"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="Brief bio..."
      />
    </div>
    <AppSelect
      v-if="showRole"
      v-model="form.role"
      label="Role"
      :options="roleOptions"
      :error="errors.role"
    />
    <AppSelect
      v-if="showTeam && teams.length"
      v-model="form.teamId"
      label="Team"
      :options="teamOptions"
      placeholder="Select a team"
      :error="errors.teamId"
    />
    <!-- Projects tag-input -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Projects</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <span
          v-for="(project, i) in form.projects"
          :key="i"
          class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-0.5 text-sm font-medium text-indigo-800"
        >
          {{ project }}
          <button type="button" class="ml-1 text-indigo-500 hover:text-indigo-700 focus:outline-none" @click="removeProject(i)">&times;</button>
        </span>
      </div>
      <div class="flex gap-2">
        <input
          v-model="projectInput"
          type="text"
          placeholder="Type a project name and press Enter"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          @keydown.enter.prevent="addProject"
          @keydown.comma.prevent="addProject"
        />
        <button
          type="button"
          class="rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          @click="addProject"
        >Add</button>
      </div>
      <p class="mt-1 text-xs text-gray-400">Press Enter or comma to add, click × to remove</p>
    </div>
    <AlertMessage v-if="submitError" :message="submitError" variant="error" />
    <div class="flex justify-end space-x-3 pt-2">
      <AppButton type="button" variant="secondary" @click="$emit('cancel')">Cancel</AppButton>
      <AppButton type="submit" :loading="isSubmitting">{{ isEdit ? 'Update User' : 'Create User' }}</AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { User, Team, CreateUserPayload, UpdateUserPayload, UserRole } from '~/types';

const props = defineProps<{
  user?: User | null;
  teams?: Team[];
  showRole?: boolean;
  showTeam?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: CreateUserPayload | UpdateUserPayload];
  cancel: [];
}>();

const isEdit = computed(() => !!props.user);
const isSubmitting = ref(false);
const submitError = ref('');
const errors = ref<Record<string, string>>({});

const form = reactive({
  firstName: props.user?.firstName ?? '',
  lastName: props.user?.lastName ?? '',
  email: props.user?.email ?? '',
  password: '',
  phone: props.user?.phone ?? '',
  bio: props.user?.bio ?? '',
  role: (props.user?.role ?? 'MEMBER') as UserRole,
  teamId: typeof props.user?.teamId === 'object' && props.user?.teamId
    ? (props.user.teamId as Team)._id
    : (props.user?.teamId as string) ?? '',
  projects: [...(props.user?.projects ?? [])],
});

const projectInput = ref('');

function addProject() {
  const val = projectInput.value.trim().replace(/,+$/, '');
  if (val && !form.projects.includes(val)) {
    form.projects.push(val);
  }
  projectInput.value = '';
}

function removeProject(index: number) {
  form.projects.splice(index, 1);
}

const roleOptions = [
  { value: 'MEMBER', label: 'Member' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPERADMIN', label: 'Super Admin' },
];

const teamOptions = computed(() =>
  (props.teams ?? []).map((t) => ({ value: t._id ?? t.id, label: t.name })),
);

function validate() {
  errors.value = {};
  if (!form.firstName) errors.value.firstName = 'Required';
  if (!form.lastName) errors.value.lastName = 'Required';
  if (!form.email) errors.value.email = 'Required';
  if (!isEdit.value && !form.password) errors.value.password = 'Required';
  return Object.keys(errors.value).length === 0;
}

async function handleSubmit() {
  if (!validate()) return;
  isSubmitting.value = true;
  submitError.value = '';
  try {
    const payload = isEdit.value
      ? {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          bio: form.bio || undefined,
          role: props.showRole ? form.role : undefined,
          teamId: props.showTeam && form.teamId ? form.teamId : undefined,
          projects: form.projects,
        }
      : {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          bio: form.bio || undefined,
          role: props.showRole ? form.role : undefined,
          teamId: props.showTeam && form.teamId ? form.teamId : undefined,
          projects: form.projects,
        };
    emit('submit', payload);
  } catch (err: unknown) {
    submitError.value = err instanceof Error ? err.message : 'Submission failed';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
