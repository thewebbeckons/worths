/**
 * Network Status Composable
 *
 * Provides reactive network status detection for offline-first PWA.
 * Uses @vueuse/core's useOnline for cross-browser compatibility.
 */

export function useNetworkStatus() {
  const isOnline = useOnline()
  const wasOffline = ref(false)

  // Track when we were offline to show "back online" feedback
  watch(isOnline, (online) => {
    if (online && wasOffline.value) {
      wasOffline.value = false
    } else if (!online) {
      wasOffline.value = true
    }
  })

  return {
    isOnline: readonly(isOnline),
    wasOffline: readonly(wasOffline)
  }
}
