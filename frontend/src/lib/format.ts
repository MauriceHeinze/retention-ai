const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('en-GB')

export function formatDate(isoDate: string) {
  const date = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : dateFormatter.format(date)
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount)
}

export function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function formatPercent(value: number) {
  return `${value}%`
}
