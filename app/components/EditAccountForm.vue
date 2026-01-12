<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import { useDatabase } from '~/composables/useDatabase'
import type { OwnerType } from '~/types/db'

const props = defineProps<{
  account: {
    id: string
    name: string
    bank: string
    category: string
    owner: string
    type: 'asset' | 'liability'
    latestBalance: number
    notes?: string
  }
}>()

const emit = defineEmits(['close', 'saved'])

const { updateAccount } = useNetWorth()

const categories = ['TFSA', 'RRSP', 'Cash', 'Loan', 'Mortgage', 'Credit Card', 'Investment']

const { profile } = useDatabase()

// Owner options based on profile configuration
const ownerOptions = computed(() => {
  const options: { value: OwnerType, label: string }[] = [
    { value: 'me', label: profile.value?.userName || 'Me' }
  ]

  if (profile.value?.spouseName) {
    options.push({ value: 'spouse', label: profile.value.spouseName })
    options.push({ value: 'joint', label: 'Joint' })
  }

  return options
})

// Map owner display name back to OwnerType
function getOwnerType(ownerName: string): OwnerType {
  if (ownerName === 'Joint') return 'joint'
  if (profile.value?.spouseName && ownerName === profile.value.spouseName) return 'spouse'
  return 'me'
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  bank: z.string().min(1, 'Bank is required'),
  category: z.string().min(1, 'Category is required'),
  owner: z.enum(['me', 'spouse', 'joint'] as const)
})

type Schema = z.output<typeof schema>

// Separate notes state (not part of zod schema since it's optional HTML content)
const notes = ref(props.account.notes || '')

// Initialize state with account data
const state = reactive({
  name: props.account.name,
  bank: props.account.bank,
  category: props.account.category,
  owner: getOwnerType(props.account.owner)
})

// Watch for account changes to update form
watch(() => props.account, (newAccount) => {
  state.name = newAccount.name
  state.bank = newAccount.bank
  state.category = newAccount.category
  state.owner = getOwnerType(newAccount.owner)
  notes.value = newAccount.notes || ''
}, { deep: true })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  await updateAccount(props.account.id, {
    ...event.data,
    notes: notes.value || undefined
  })
  emit('saved')
  emit('close')
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField
      label="Account Name"
      name="name"
    >
      <UInput
        v-model="state.name"
        placeholder="e.g. Chase Checking"
      />
    </UFormField>

    <UFormField
      label="Bank"
      name="bank"
    >
      <UInput
        v-model="state.bank"
        placeholder="e.g. Chase, Wells Fargo"
      />
    </UFormField>

    <UFormField
      label="Category"
      name="category"
    >
      <USelect
        v-model="state.category"
        :items="categories"
      />
    </UFormField>

    <UFormField
      label="Owner"
      name="owner"
    >
      <USelect
        v-model="state.owner"
        :items="ownerOptions"
        value-key="value"
        label-key="label"
      />
    </UFormField>

    <UFormField
      label="Notes"
      name="notes"
      hint="Optional"
    >
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
      <UButton
        label="Cancel"
        color="neutral"
        variant="ghost"
        @click="$emit('close')"
      />
      <UButton
        type="submit"
        label="Save Changes"
        color="primary"
      />
    </div>
  </UForm>
</template>
