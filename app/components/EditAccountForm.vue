<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useDatabase } from '~/composables/useDatabase'

const props = defineProps<{
  account: {
    id: string
    name: string
    bank: string
    category: string
    owner: string
    type: 'asset' | 'liability'
    latestBalance: number
  }
}>()

const emit = defineEmits(['close', 'saved'])

const { updateAccount } = useNetWorth()

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
  owner: z.string().min(1, 'Owner is required')
})

type Schema = z.output<typeof schema>

// Initialize state with account data
const state = reactive({
  name: props.account.name,
  bank: props.account.bank,
  category: props.account.category,
  owner: props.account.owner
})

// Watch for account changes to update form
watch(() => props.account, (newAccount) => {
  state.name = newAccount.name
  state.bank = newAccount.bank
  state.category = newAccount.category
  state.owner = newAccount.owner
}, { deep: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await updateAccount(props.account.id, event.data)
  emit('saved')
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

    <div class="flex justify-end gap-2">
      <UButton label="Cancel" color="neutral" variant="ghost" @click="$emit('close')" />
      <UButton type="submit" label="Save Changes" color="primary" />
    </div>
  </UForm>
</template>
