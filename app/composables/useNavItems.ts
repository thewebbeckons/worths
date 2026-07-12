import type { NavigationMenuItem } from '@nuxt/ui'

export const useNavItems = () => {
  const route = useRoute()

  return computed<NavigationMenuItem[]>(() => [
    {
      label: 'Summary',
      icon: 'i-lucide-layout-dashboard',
      to: '/',
      active: route.path === '/'
    },
    {
      label: 'Accounts',
      icon: 'i-lucide-wallet',
      to: '/accounts',
      active: route.path.startsWith('/accounts')
    },
    {
      label: 'Trends',
      icon: 'i-lucide-trending-up',
      to: '/trends',
      active: route.path.startsWith('/trends')
    }
  ])
}
