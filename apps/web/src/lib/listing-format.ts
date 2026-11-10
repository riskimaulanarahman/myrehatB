// Display helpers for listing cards. They take nullable input on purpose: the API type says
// `whatsapp: string` and `price: string`, but that is only a compile-time promise. A row from the
// externally provided `listing` table, or a response shaped by another API (e.g. `contactWa`
// instead of `whatsapp`), can still deliver null/undefined at runtime.

// Formats the stored decimal string (e.g. "250000.5") without converting it to a float.
export function formatPrice(price: string | null | undefined) {
  if (!price) {
    return "-";
  }
  const [whole = "0", fraction] = price.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}${fraction ? `.${fraction.padEnd(2, "0")}` : ""}`;
}

// Returns the wa.me link for a WhatsApp number, or null when there is no usable number.
export function getWhatsAppLink(whatsapp: string | null | undefined) {
  const label = whatsapp ?? "";
  const digits = label.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  return { label, href: `https://wa.me/${digits}` };
}
