export const ensureUtcIso = (value: string) => {
  if (!value) return value
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(value)) return value
  return `${value}Z`
}

export const parseApiDateTime = (value: string | null | undefined) =>
  value ? new Date(ensureUtcIso(value)) : null

export const toUtcIsoFromLocal = (date: string, time = "00:00") =>
  new Date(`${date}T${time}:00`).toISOString()

export const localTodayInputValue = (now = new Date()) => {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const formatRelativeTime = (
  value: string | null | undefined,
  nowMs = Date.now(),
) => {
  const date = value ? parseApiDateTime(value) : null
  if (!date || Number.isNaN(date.getTime())) return ""

  const deltaSeconds = Math.round((date.getTime() - nowMs) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.345, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ]

  let valueInUnit = deltaSeconds
  for (const [limit, unit] of ranges) {
    if (Math.abs(valueInUnit) < limit) return formatter.format(Math.round(valueInUnit), unit)
    valueInUnit /= limit
  }
  return formatter.format(Math.round(valueInUnit), "year")
}
