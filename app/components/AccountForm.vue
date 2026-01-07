<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useDatabase } from '~/composables/useDatabase'
import type { OwnerType } from '~/types/db'

const props = defineProps<{
  onSuccess?: () => void
}>()

const emit = defineEmits(['close'])

const { addAccount } = useNetWorth()

const { profile, categories: dbCategories } = useDatabase()

// Convert categories to select items (category names)
const categoryOptions = computed(() => dbCategories.value.map(c => c.name))

// Owner options based on profile configuration
const ownerOptions = computed(() => {
  const options: { value: OwnerType; label: string }[] = [
    { value: 'me', label: profile.value?.userName || 'Me' }
  ]
  
  if (profile.value?.spouseName) {
    options.push({ value: 'spouse', label: profile.value.spouseName })
    options.push({ value: 'joint', label: 'Joint' })
  }
  
  return options
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bank: z.string().min(1, 'Bank is required'),
  category: z.string().min(1, 'Category is required'),
  owner: z.enum(['me', 'spouse', 'joint'] as const),
  initialBalance: z.number()
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  bank: '',
  category: '',
  owner: 'me' as OwnerType,
  initialBalance: 0
})

// Separate notes state (not part of zod schema since it's optional HTML content)
const notes = ref('')

// Set default category when categories load
watch(categoryOptions, (options) => {
  if (options.length > 0 && !state.category) {
    state.category = options[0] || ''
  }
}, { immediate: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await addAccount({
    ...event.data,
    notes: notes.value || undefined
  })
  // Reset form or close modal
  state.name = ''
  state.bank = ''
  state.initialBalance = 0
  state.owner = 'me'
  notes.value = ''
  
  if (props.onSuccess) {
    props.onSuccess()
  }
  emit('close')
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Account Name" name="name">
      <UInput v-model="state.name" placeholder="e.g. Chase Checking" />
    </UFormField>

    <UFormField label="Bank" name="bank">
      <UInput v-model="state.bank" placeholder="e.g. Chase, Wells Fargo" />
    </UFormField>

    <UFormField label="Category" name="category">
      <USelect v-model="state.category" :items="categoryOptions" class="w-42" />
    </UFormField>

    <UFormField label="Owner" name="owner">
      <USelect 
        v-model="state.owner" 
        :items="ownerOptions"
        value-key="value"
        label-key="label"
        class="w-32"
      />
    </UFormField>

    <UFormField label="Initial Balance" name="initialBalance">
      <UInputNumber v-model="state.initialBalance" :format-options="{ style: 'currency', currency: 'USD' }" :step="0.01" />
    </UFormField>

    <UFormField label="Notes" name="notes" hint="Optional">
      <UEditor 
        v-model="notes"
        content-type="html"
        placeholder="Add notes about this account (e.g. GIC matures Sept. 28th)"
        :ui="{ 
          root: 'border border-default rounded-md',
          content: 'py-4',
          base: 'min-h-[120px]'
        }"
      />
    </UFormField>

    <div class="flex justify-end gap-2">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="$emit('close')" />
      <UButton type="submit" label="Add Account" color="primary" />
    </div>
  </UForm>
</template>
