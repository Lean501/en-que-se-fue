const MONEY_FORMATTER = new Intl.NumberFormat("en-US")

export const MONEY_MAX_VALUE = 999_999_999_999.99
export const MONEY_INPUT_MAX_LENGTH = 18

export function formatMoneyValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0"
  }

  const fixed = Math.min(value, MONEY_MAX_VALUE).toFixed(2)
  const [integer, decimals] = fixed.split(".")
  const formattedInteger = MONEY_FORMATTER.format(Number(integer))

  return decimals === "00" ? formattedInteger : `${formattedInteger}.${decimals}`
}

export function normalizeMoneyInput(value: string): { amount: number; display: string } {
  const clean = value.replace(/,/g, "").replace(/[^\d.]/g, "")
  const [rawInteger = "", ...decimalParts] = clean.split(".")
  const integer = rawInteger.slice(0, 12)
  const amountInteger = integer.replace(/^0+(?=\d)/, "")
  const decimals = decimalParts.join("").replace(/\D/g, "").slice(0, 2)
  const amount = Number(`${amountInteger || "0"}${decimals ? `.${decimals}` : ""}`)
  const safeAmount = Math.min(amount, MONEY_MAX_VALUE)
  const displayInteger = formatIntegerInput(integer || "0")

  return {
    amount: safeAmount,
    display: decimals ? `${displayInteger}.${decimals}` : displayInteger,
  }
}

function formatIntegerInput(value: string): string {
  const normalized = value.length <= 3 ? value : value.replace(/^0+(?=\d)/, "")
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
