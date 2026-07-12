const STORAGE_KEY = 'worths-onboarding-complete'

const isOpen = ref(false)
const isComplete = ref(false)
let initialized = false

function checkOnboardingComplete(): boolean {
  if (import.meta.server) return true
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

function setOnboardingComplete(): void {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, 'true')
  isComplete.value = true
}

function clearOnboardingComplete(): void {
  if (import.meta.server) return
  localStorage.removeItem(STORAGE_KEY)
  isComplete.value = false
}

export function useOnboarding() {
  const { accounts, isReady, updateProfile, addAccount, addCategory, categories } = useDatabase()

  async function initialize() {
    if (initialized) return
    initialized = true

    if (import.meta.server) return

    await new Promise<void>((resolve) => {
      const stop = watch(isReady, (ready) => {
        if (ready) {
          stop()
          resolve()
        }
      }, { immediate: true })
    })

    const storedComplete = checkOnboardingComplete()
    const hasData = accounts.value.length > 0

    isComplete.value = storedComplete || hasData

    if (!isComplete.value) {
      isOpen.value = true
    }
  }

  function startOnboarding() {
    isOpen.value = true
  }

  function completeOnboarding() {
    setOnboardingComplete()
    isOpen.value = false
  }

  function skipOnboarding() {
    setOnboardingComplete()
    isOpen.value = false
  }

  function resetOnboarding() {
    clearOnboardingComplete()
    isComplete.value = false
  }

  if (import.meta.client && !initialized) {
    initialize()
  }

  return {
    isOpen,
    isComplete,
    isReady,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    updateProfile,
    addAccount,
    addCategory,
    categories,
    accounts
  }
}
