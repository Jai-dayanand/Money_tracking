const hasIntl =
  typeof Intl !== "undefined" &&
  typeof Intl.NumberFormat === "function" &&
  typeof Intl.DateTimeFormat === "function";

const localeByCurrency: Record<string, string> = {
  USD: "en-US",
  INR: "en-IN",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE"
};

export function formatCurrency(value: number, currency = "USD") {
  const amount = Number.isFinite(value) ? value : 0;
  const normalizedCurrency = currency.trim().toUpperCase();

  if (hasIntl) {
    try {
      return new Intl.NumberFormat(localeByCurrency[normalizedCurrency] ?? "en-US", {
        style: "currency",
        currency: normalizedCurrency,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      // Fallback for unsupported/invalid currency codes.
    }
  }

  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  const [whole, fraction] = absolute.toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}${normalizedCurrency} ${withCommas}.${fraction}`;
}

export function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (hasIntl) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(date);
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = months[date.getMonth()] ?? "";
  const day = date.getDate();

  return monthLabel ? `${monthLabel} ${day}` : value;
}

export function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
