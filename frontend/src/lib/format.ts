export function formatCurrency(value: number, currency = 'ADO'): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

export function formatTime(value: number | Date): string {
  const date = typeof value === 'number' ? new Date(value * 1000) : value
  return date.toLocaleString()
}

export function formatHash(value: number): string {
  const units = ['H', 'KH', 'MH', 'GH', 'TH', 'PH'] as const
  let n = value
  let i = 0
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000
    i++
  }
  return `${n.toFixed(2)} ${units[i]}`
}
