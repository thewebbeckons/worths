<script setup lang="ts">
import { z } from 'zod'
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  preselectedAccountId?: string
}>()

const emit = defineEmits(['close', 'saved'])

const { accounts, updateBalance } = useNetWorth()

const schema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  balance: z.number(),
  date: z.custom<DateValue>().optional()
})

type Schema = z.output<typeof schema>

// Build account options for select
const accountOptions = computed(() => {
  return accounts.value.map(account => ({
    label: `${account.name} (${account.bank})`,
    value: account.id
  }))
})

// Get today's date as CalendarDate
const todayDate = today(getLocalTimeZone())

const state = reactive<{ accountId: string, balance: number, date: DateValue }>({
  accountId: props.preselectedAccountId || '',
  balance: 0,
  date: todayDate
})

// Initialize balance if account is preselected
if (props.preselectedAccountId) {
  const account = accounts.value.find(a => a.id === props.preselectedAccountId)
  if (account) {
    state.balance = account.latestBalance
  }
}

// When account is selected, pre-fill with current balance
watch(() => state.accountId, (newId) => {
  const account = accounts.value.find(a => a.id === newId)
  if (account) {
    state.balance = account.latestBalance
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Convert CalendarDate to string format yyyy-mm-dd
  const dateStr = state.date
    ? `${state.date.year}-${String(state.date.month).padStart(2, '0')}-${String(state.date.day).padStart(2, '0')}`
    : new Date().toISOString().slice(0, 10)

  await updateBalance(event.data.accountId, event.data.balance, dateStr)

  // Reset form
  state.accountId = ''
  state.balance = 0
  state.date = todayDate

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
      label="Account"
      name="accountId"
    >
      <USelect
        v-model="state.accountId"
        :items="accountOptions"
        placeholder="Select an account"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="New Balance"
      name="balance"
    >
      <UInputNumber
        v-model="state.balance"
        :format-options="{ style: 'currency', currency: 'USD' }"
        :step="0.01"
      />
    </UFormField>

    <UFormField
      label="Date"
      name="date"
    >
      <UInputDate
        v-model="state.date"
        type="date"
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
        label="Update Balance"
        color="primary"
        :disabled="!state.accountId"
      />
    </div>
  </UForm>
</template>
