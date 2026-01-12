<script setup lang="ts">
import { useDatabase } from '~/composables/useDatabase'
import type { OwnerType } from '~/types/db'

const props = defineProps<{
  name: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ownerType?: OwnerType // If provided, used to determine if joint display is needed
}>()

const { profile } = useDatabase()

// Check if this is a joint account (either by ownerType prop or by name)
const isJoint = computed(() => {
  if (props.ownerType === 'joint') return true
  return props.name === 'Joint'
})

// Get initials from a name
function getInitials(name: string): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0]?.substring(0, 2).toUpperCase() || '?'
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// Extract initials from name (first letter of each word, max 2)
const initials = computed(() => getInitials(props.name))

// Size classes for the badge
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-6 h-6 text-xs'
    case 'sm': return 'w-8 h-8 text-xs'
    case 'md': return 'w-10 h-10 text-sm'
    case 'lg': return 'w-12 h-12 text-base'
    case 'xl': return 'w-16 h-16 text-lg'
    default: return 'w-10 h-10 text-sm' // md as default
  }
})

// Smaller size classes for joint avatar circles (about 70% of regular size)
const jointSizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-5 h-5 text-[10px]'
    case 'sm': return 'w-6 h-6 text-xs'
    case 'md': return 'w-7 h-7 text-xs'
    case 'lg': return 'w-8 h-8 text-sm'
    case 'xl': return 'w-10 h-10 text-base'
    default: return 'w-7 h-7 text-xs'
  }
})

// Overlap offset for joint avatars
const overlapClasses = computed(() => {
  switch (props.size) {
    case 'xs': return '-ml-2'
    case 'sm': return '-ml-2.5'
    case 'md': return '-ml-3'
    case 'lg': return '-ml-3.5'
    case 'xl': return '-ml-4'
    default: return '-ml-3'
  }
})

// Background color class
const bgColorClass = computed(() => {
  return `bg-${props.color || 'primary'}`
})

// User data for joint display
const userInitials = computed(() => getInitials(profile.value?.userName || 'Me'))
const spouseInitials = computed(() => getInitials(profile.value?.spouseName || 'Spouse'))
const userColorClass = computed(() => `bg-${profile.value?.userColor || 'primary'}`)
const spouseColorClass = computed(() => `bg-${profile.value?.spouseColor || 'secondary'}`)
</script>

<template>
  <!-- Joint account: show two overlapping circles -->
  <div
    v-if="isJoint"
    class="inline-flex items-center shrink-0"
  >
    <div
      class="inline-flex items-center justify-center rounded-full text-white font-medium ring-2 ring-background"
      :class="[jointSizeClasses, userColorClass]"
    >
      {{ userInitials }}
    </div>
    <div
      class="inline-flex items-center justify-center rounded-full text-white font-medium ring-2 ring-background"
      :class="[jointSizeClasses, spouseColorClass, overlapClasses]"
    >
      {{ spouseInitials }}
    </div>
  </div>

  <!-- Single owner: show single badge -->
  <div
    v-else
    class="inline-flex items-center justify-center rounded-full text-white font-medium shrink-0"
    :class="[sizeClasses, bgColorClass]"
  >
    {{ initials }}
  </div>
</template>
