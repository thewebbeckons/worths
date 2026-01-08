<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'
import type { DbCategory } from '~/types/db'

const { 
  profile, 
  categories,
  updateProfile, 
  deleteCategory,
  isReady 
} = useDatabase()

const toast = useToast()

// Color options (Nuxt UI semantic colors)
const colorOptions = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
type ColorOption = typeof colorOptions[number]

// Profile form state
const userName = ref('')
const userColor = ref<ColorOption>('primary')
const spouseName = ref('')
const spouseColor = ref<ColorOption>('secondary')
const isEditingProfile = ref(false)

// Initialize form from profile when loaded
watch(profile, (newProfile) => {
  if (newProfile) {
    userName.value = newProfile.userName || ''
    userColor.value = (newProfile.userColor as ColorOption) || 'primary'
    spouseName.value = newProfile.spouseName || ''
    spouseColor.value = (newProfile.spouseColor as ColorOption) || 'secondary'
  }
}, { immediate: true })

const hasProfile = computed(() => !!profile.value?.userName)
const hasSpouse = computed(() => !!profile.value?.spouseName)

const onSaveProfile = async () => {
  try {
    await updateProfile({
      userName: userName.value || undefined,
      userColor: userColor.value,
      spouseName: spouseName.value || undefined,
      spouseColor: spouseColor.value
    })
    isEditingProfile.value = false
    toast.add({ title: 'Profile saved successfully', color: 'success' })
  } catch (error) {
    toast.add({ title: 'Failed to save profile', color: 'error', description: String(error) })
  }
}

// Category Management
const isCategoryModalOpen = ref(false)
const editingCategory = ref<DbCategory | null>(null)

function openCategoryModal(category?: DbCategory) {
  editingCategory.value = category || null
  isCategoryModalOpen.value = true
}

const categoryToDelete = ref<DbCategory | null>(null)
const isDeleteCategoryModalOpen = ref(false)

function confirmDeleteCategory(category: DbCategory) {
  categoryToDelete.value = category
  isDeleteCategoryModalOpen.value = true
}

async function onDeleteCategory() {
  if (!categoryToDelete.value?.id) return
  try {
    await deleteCategory(categoryToDelete.value.id)
    toast.add({ title: 'Category deleted', color: 'success' })
    isDeleteCategoryModalOpen.value = false
    categoryToDelete.value = null
  } catch (error) {
    toast.add({ title: 'Error', description: String(error), color: 'error' })
  }
}
</script>

<template>
  <div v-if="!isReady" class="flex items-center justify-center py-20">
    <UIcon name="i-lucide-loader-2" class="animate-spin text-4xl" />
  </div>

  <ClientOnly v-else>
    <div class="space-y-8">
      <!-- Profile Section -->
      <UCard variant="outline" class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">Profile</h2>
              <p class="text-sm text-muted-foreground">Set your name and optionally add a spouse/partner.</p>
            </div>
            <UButton
              v-if="!isEditingProfile"
              icon="i-lucide-pencil"
              :label="hasProfile ? 'Edit' : 'Set up'"
              @click="isEditingProfile = true"
            />
          </div>
        </template>

        <div v-if="!isEditingProfile" class="space-y-4">
          <!-- Show current profile -->
          <div class="flex items-center gap-4">
            <OwnerBadge
              :name="profile?.userName || 'Me'"
              :color="profile?.userColor || 'primary'"
              size="md"
            />
            <div class="flex-1">
              <p class="font-medium">{{ profile?.userName || 'Your Name' }}</p>
              <p class="text-sm text-muted-foreground">{{ hasProfile ? 'Owner' : 'Not configured yet' }}</p>
            </div>
          </div>
          
          <div v-if="hasSpouse" class="flex items-center gap-4">
            <OwnerBadge
              :name="profile?.spouseName || 'Spouse'"
              :color="profile?.spouseColor || 'secondary'"
              size="md"
            />
            <div class="flex-1">
              <p class="font-medium">{{ profile?.spouseName }}</p>
              <p class="text-sm text-muted-foreground">Spouse/Partner</p>
            </div>
          </div>

          <div v-if="!hasProfile" class="py-4 text-center">
            <p class="text-sm text-muted-foreground italic">Add your name to personalize account ownership.</p>
          </div>
        </div>

        <!-- Edit form -->
        <div v-else class="space-y-6">
          <!-- Your Profile -->
          <div class="space-y-4">
            <h3 class="font-medium">Your Profile</h3>
            
            <UFormField label="Your Name">
              <UInput v-model="userName" placeholder="Enter your name" />
            </UFormField>
            
            <UFormField label="Your Color">
              <div class="flex items-center gap-4">
                <OwnerBadge :name="userName || 'You'" :color="userColor" size="lg" />
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                    :class="[
                      `bg-${color}`,
                      userColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                    ]"
                    @click="userColor = color"
                  />
                </div>
              </div>
            </UFormField>
          </div>

          <UDivider />

          <!-- Spouse/Partner -->
          <div class="space-y-4">
            <h3 class="font-medium">Spouse/Partner (Optional)</h3>
            <p class="text-sm text-muted-foreground">Add a spouse or partner to enable joint and individual account ownership.</p>
            
            <UFormField label="Spouse/Partner Name">
              <UInput v-model="spouseName" placeholder="Enter spouse/partner name" />
            </UFormField>
            
            <UFormField v-if="spouseName" label="Spouse/Partner Color">
              <div class="flex items-center gap-4">
                <OwnerBadge :name="spouseName" :color="spouseColor" size="lg" />
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="color in colorOptions"
                    :key="color"
                    type="button"
                    class="w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background"
                    :class="[
                      `bg-${color}`,
                      spouseColor === color ? 'ring-2 ring-current scale-110' : 'hover:scale-105'
                    ]"
                    @click="spouseColor = color"
                  />
                </div>
              </div>
            </UFormField>
          </div>

          <!-- Action buttons -->
          <div class="flex justify-end gap-2 pt-4">
            <UButton label="Cancel" variant="ghost" @click="isEditingProfile = false" />
            <UButton label="Save Profile" @click="onSaveProfile" />
          </div>
        </div>
      </UCard>

      <!-- Account Categories Section -->
      <UCard variant="outline" class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold">Account Categories</h2>
              <p class="text-sm text-muted-foreground">Organize your accounts by category (e.g., Investment, Savings, Credit).</p>
            </div>
            <UButton
              icon="i-lucide-plus"
              label="Add Category"
              @click="openCategoryModal()"
            />
          </div>
        </template>

        <div v-if="categories.length === 0" class="py-8 text-center">
          <UIcon name="i-lucide-folder-open" class="text-4xl text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
        </div>

        <div v-else class="divide-y divide-border">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center justify-between py-3"
          >
            <div class="flex items-center gap-3">
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
            <div class="flex items-center gap-1">
              <UButton
                icon="i-lucide-pencil"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="openCategoryModal(cat)"
              />
              <UButton
                icon="i-lucide-trash-2"
                size="sm"
                color="error"
                variant="ghost"
                @click="confirmDeleteCategory(cat)"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Category Form Modal -->
    <CategoryFormModal
      v-model:open="isCategoryModalOpen"
      :category="editingCategory"
      @saved="isCategoryModalOpen = false"
    />

    <!-- Delete Category Confirmation Modal -->
    <UModal v-model:open="isDeleteCategoryModalOpen" title="Delete Category?">
      <template #body>
        <p>Are you sure you want to delete the category <strong>{{ categoryToDelete?.name }}</strong>?</p>
        <p class="text-sm text-muted-foreground mt-2">This action cannot be undone. You can only delete categories that are not in use by any accounts.</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="isDeleteCategoryModalOpen = false" />
          <UButton
            label="Delete Category"
            color="error"
            @click="onDeleteCategory"
          />
        </div>
      </template>
    </UModal>
  </ClientOnly>
</template>
