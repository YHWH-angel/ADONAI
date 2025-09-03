export const PAGES = [
  'dashboard',
  'wallet',
  'mining',
  'network',
  'settings',
] as const

export type Page = (typeof PAGES)[number]
