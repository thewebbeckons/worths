<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { OwnerType } from '~/types/db'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'complete'): void
}>()

const {
  updateProfile,
  addAccount,
  addCategory,
  categories
} = useOnboarding()

const toast = useToast()

const currentSlide = ref(0)
const totalSlides = 4

const colorOptions = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
type ColorOption = typeof colorOptions[number]

const colorClassMap: Record<ColorOption, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
  neutral: 'bg-neutral'
}

const profileState = reactive({
  userName: '',
  userColor: 'primary' as ColorOption,
  spouseName: '',
  spouseColor: 'secondary' as ColorOption
})

const accountState = reactive({
  name: '',
  bank: '',
  category: '',
  owner: 'me' as OwnerType,
  initialBalance: 0
})

const categoryState = reactive({
  name: '',
  type: 'asset' as 'asset' | 'liability'
})

const isSavingProfile = ref(false)
const isSavingAccount = ref(false)
const isSavingCategory = ref(false)

const categoryOptions = computed(() => categories.value.map(c => c.name))

const ownerOptions = computed(() => {
  const options: { value: OwnerType, label: string }[] = [
    { value: 'me', label: profileState.userName || 'Me' }
  ]
  if (profileState.spouseName) {
    options.push({ value: 'spouse', label: profileState.spouseName })
    options.push({ value: 'joint', label: 'Joint' })
  }
  return options
})

watch(categoryOptions, (options) => {
  if (options.length > 0 && !accountState.category) {
    accountState.category = options[0] || ''
  }
}, { immediate: true })

function goNext() {
  if (currentSlide.value < totalSlides - 1) {
    currentSlide.value++
  }
}

function goBack() {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

async function saveProfile() {
  isSavingProfile.value = true
  try {
    await updateProfile({
      userName: profileState.userName || undefined,
      userColor: profileState.userColor,
      spouseName: profileState.spouseName || undefined,
      spouseColor: profileState.spouseColor
    })
    goNext()
  } catch (error) {
    toast.add({ title: 'Failed to save profile', description: String(error), color: 'error' })
  } finally {
    isSavingProfile.value = false
  }
}

async function addNewCategory() {
  if (!categoryState.name.trim()) return
  isSavingCategory.value = true
  try {
    await addCategory(categoryState.name.trim(), categoryState.type)
    categoryState.name = ''
    categoryState.type = 'asset'
    toast.add({ title: 'Category added', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to add category', description: String(error), color: 'error' })
  } finally {
    isSavingCategory.value = false
  }
}

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bank: z.string().min(1, 'Bank is required'),
  category: z.string().min(1, 'Category is required'),
  owner: z.enum(['me', 'spouse', 'joint'] as const),
  initialBalance: z.number()
})

type AccountSchema = z.output<typeof accountSchema>

async function createAccount(event: FormSubmitEvent<AccountSchema>) {
  isSavingAccount.value = true
  try {
    await addAccount(event.data)
    completeOnboarding()
  } catch (error) {
    toast.add({ title: 'Failed to create account', description: String(error), color: 'error' })
  } finally {
    isSavingAccount.value = false
  }
}

function completeOnboarding() {
  const { completeOnboarding: complete } = useOnboarding()
  complete()
  emit('complete')
  emit('update:open', false)
}

function skipOnboarding() {
  const { skipOnboarding } = useOnboarding()
  skipOnboarding()
  emit('update:open', false)
}

const slideTitles = [
  'Welcome to Worths',
  'Set Up Your Profile',
  'Account Categories',
  'Add Your First Account'
]
</script>

<template>
  <UModal
    :open="open"
    :title="slideTitles[currentSlide]"
    :close="currentSlide > 0"
    fullscreen
    :ui="{
      content: 'max-w-xl w-full',
      body: 'p-0'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UCarousel
        v-model="currentSlide"
        :items="[{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]"
        class="w-full"
      >
        <template #default>
          <div class="w-full min-h-[400px] p-6">
            <!-- Slide 1: Welcome -->
            <div
              v-if="currentSlide === 0"
              class="flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon
                  name="i-lucide-wallet"
                  class="w-10 h-10 text-primary"
                />
              </div>
              <div class="space-y-2">
                <h2 class="text-2xl font-bold">
                  Welcome to Worths
                </h2>
                <p class="text-muted-foreground max-w-sm">
                  A privacy-focused net worth tracker. All your data stays in your browser - no accounts, no cloud, no tracking.
                </p>
              </div>
              <div class="flex flex-col gap-3 w-full max-w-xs">
                <UButton
                  label="Get Started"
                  size="lg"
                  block
                  @click="goNext"
                />
                <UButton
                  label="Skip for now"
                  variant="ghost"
                  block
                  @click="skipOnboarding"
                />
              </div>
            </div>

            <!-- Slide 2: Profile Setup -->
            <div
              v-else-if="currentSlide === 1"
              class="space-y-6"
            >
              <div class="space-y-4">
                <h3 class="font-medium">
                  Your Profile
                </h3>
                <UFormField label="Your Name">
                  <UInput
                    v-model="profileState.userName"
                    placeholder="Enter your name"
                  />
                </UFormField>
                <UFormField label="Your Color">
                  <div class="flex items-center gap-4">
                    <OwnerBadge
                      :name="profileState.userName || 'You'"
                      :color="profileState.userColor"
                      size="lg"
                    />
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="color in colorOptions"
                        :key="color"
                        type="button"
                        class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                        :class="[
                          colorClassMap[color],
                          profileState.userColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                        ]"
                        @click="profileState.userColor = color"
                      />
                    </div>
                  </div>
                </UFormField>
              </div>

              <UDivider />

              <div class="space-y-4">
                <div>
                  <h3 class="font-medium">
                    Spouse/Partner (Optional)
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Add a spouse to track joint accounts separately.
                  </p>
                </div>
                <UFormField label="Spouse/Partner Name">
                  <UInput
                    v-model="profileState.spouseName"
                    placeholder="Enter spouse/partner name"
                  />
                </UFormField>
                <UFormField
                  v-if="profileState.spouseName"
                  label="Spouse/Partner Color"
                >
                  <div class="flex items-center gap-4">
                    <OwnerBadge
                      :name="profileState.spouseName"
                      :color="profileState.spouseColor"
                      size="lg"
                    />
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="color in colorOptions"
                        :key="color"
                        type="button"
                        class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                        :class="[
                          colorClassMap[color],
                          profileState.spouseColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                        ]"
                        @click="profileState.spouseColor = color"
                      />
                    </div>
                  </div>
                </UFormField>
              </div>

              <div class="flex justify-between pt-4">
                <UButton
                  label="Back"
                  variant="ghost"
                  @click="goBack"
                />
                <div class="flex gap-2">
                  <UButton
                    label="Skip"
                    variant="ghost"
                    @click="goNext"
                  />
                  <UButton
                    label="Next"
                    :loading="isSavingProfile"
                    @click="saveProfile"
                  />
                </div>
              </div>
            </div>

            <!-- Slide 3: Categories -->
            <div
              v-else-if="currentSlide === 2"
              class="space-y-6"
            >
              <div>
                <p class="text-sm text-muted-foreground">
                  Organize your accounts by category. Default categories have been created for you.
                </p>
              </div>

              <div class="space-y-3">
                <div
                  v-for="cat in categories"
                  :key="cat.id"
                  class="flex items-center gap-3 p-3 rounded-lg bg-elevated"
                >
                  <UIcon
                    :name="cat.type === 'asset' ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
                    :class="cat.type === 'asset' ? 'text-success' : 'text-error'"
                  />
                  <span class="font-medium">{{ cat.name }}</span>
                  <UBadge
                    :color="cat.type === 'asset' ? 'success' : 'error'"
                    variant="subtle"
                    size="sm"
                  >
                    {{ cat.type === 'asset' ? 'Asset' : 'Liability' }}
                  </UBadge>
                </div>
              </div>

              <div class="space-y-3 p-4 rounded-lg border border-default">
                <h4 class="font-medium text-sm">
                  Add Custom Category
                </h4>
                <div class="flex gap-2">
                  <UInput
                    v-model="categoryState.name"
                    placeholder="e.g. Retirement"
                    class="flex-1"
                  />
                  <USelect
                    v-model="categoryState.type"
                    :items="[
                      { value: 'asset', label: 'Asset' },
                      { value: 'liability', label: 'Liability' }
                    ]"
                    class="w-32"
                  />
                  <UButton
                    icon="i-lucide-plus"
                    :loading="isSavingCategory"
                    :disabled="!categoryState.name.trim()"
                    @click="addNewCategory"
                  />
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <UButton
                  label="Back"
                  variant="ghost"
                  @click="goBack"
                />
                <UButton
                  label="Next"
                  @click="goNext"
                />
              </div>
            </div>

            <!-- Slide 4: First Account -->
            <div
              v-else-if="currentSlide === 3"
              class="space-y-6"
            >
              <p class="text-sm text-muted-foreground">
                Add your first account to start tracking your net worth. You can always add more later.
              </p>

              <UForm
                :schema="accountSchema"
                :state="accountState"
                class="space-y-4"
                @submit="createAccount"
              >
                <UFormField
                  label="Account Name"
                  name="name"
                >
                  <UInput
                    v-model="accountState.name"
                    placeholder="e.g. Chase Checking"
                  />
                </UFormField>

                <UFormField
                  label="Bank"
                  name="bank"
                >
                  <UInput
                    v-model="accountState.bank"
                    placeholder="e.g. Chase, Wells Fargo"
                  />
                </UFormField>

                <UFormField
                  label="Category"
                  name="category"
                >
                  <USelect
                    v-model="accountState.category"
                    :items="categoryOptions"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Owner"
                  name="owner"
                >
                  <USelect
                    v-model="accountState.owner"
                    :items="ownerOptions"
                    value-key="value"
                    label-key="label"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Initial Balance"
                  name="initialBalance"
                >
                  <UInputNumber
                    v-model="accountState.initialBalance"
                    :format-options="{ style: 'currency', currency: 'USD' }"
                    :step="0.01"
                    class="w-full"
                  />
                </UFormField>

                <div class="flex justify-between pt-4">
                  <UButton
                    label="Back"
                    variant="ghost"
                    type="button"
                    @click="goBack"
                  />
                  <UButton
                    type="submit"
                    label="Complete Setup"
                    :loading="isSavingAccount"
                  />
                </div>
              </UForm>

              <div class="text-center">
                <UButton
                  label="Skip for now"
                  variant="link"
                  size="sm"
                  @click="completeOnboarding"
                />
              </div>
            </div>
          </div>
        </template>
      </UCarousel>

      <!-- Slide Indicators -->
      <div class="flex justify-center gap-2 pb-6">
        <button
          v-for="i in totalSlides"
          :key="i"
          type="button"
          class="w-2 h-2 rounded-full transition-all"
          :class="currentSlide === i - 1 ? 'bg-primary w-6' : 'bg-muted hover:bg-muted-foreground/50'"
          @click="currentSlide = i - 1"
        />
      </div>
    </template>
  </UModal>
</template>
