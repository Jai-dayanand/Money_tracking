const hasIntl =
  typeof Intl !== "undefined" &&
  typeof Intl.NumberFormat === "function" &&
  typeof Intl.DateTimeFormat === "function";

export function formatCurrency(value: number) {
  const amount = Number.isFinite(value) ? value : 0;

  if (hasIntl) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(amount);
  }

  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  const [whole, fraction] = absolute.toFixed(2).split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${sign}$${withCommas}.${fraction}`;
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

export function getMonthGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
