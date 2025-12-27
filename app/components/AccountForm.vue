<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useDatabase } from '~/composables/useDatabase'

const props = defineProps<{
  onSuccess?: () => void
}>()

const emit = defineEmits(['close'])

const { addAccount } = useNetWorth()

const categories = ['TFSA', 'RRSP', 'Cash', 'Loan', 'Mortgage', 'Credit Card', 'Securities']

const { owners } = useDatabase()
const ownerOptions = computed(() => {
  if (owners.value.length > 0) {
    return owners.value.map(o => o.name)
  }
  return ['Me', 'Joint', 'Spouse']
})

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bank: z.string().min(1, 'Bank is required'),
  category: z.string().min(1, 'Category is required'),
  owner: z.string().min(1, 'Owner is required'),
  initialBalance: z.number()
})

type Schema = z.output<typeof schema>

const state = reactive({
  name: '',
  bank: '',
  category: categories[0],
  owner: 'Me',
  initialBalance: 0
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await addAccount(event.data)
  // Reset form or close modal
  state.name = ''
  state.bank = ''
  state.initialBalance = 0
  
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
      <USelect v-model="state.category" :items="categories" />
    </UFormField>

    <UFormField label="Owner" name="owner">
      <USelect v-model="state.owner" :items="ownerOptions" />
    </UFormField>

    <UFormField label="Initial Balance" name="initialBalance">
      <UInputNumber v-model="state.initialBalance" :format-options="{ style: 'currency', currency: 'USD' }" :step="0.01" />
    </UFormField>

    <div class="flex justify-end gap-2">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="$emit('close')" />
      <UButton type="submit" label="Add Account" color="primary" />
    </div>
  </UForm>
</template>
