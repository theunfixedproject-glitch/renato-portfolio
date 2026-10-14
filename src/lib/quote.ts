import { priceFactor, quoteExtras, quoteTypes, quoteUrgency, type QuoteExtra, type QuoteType } from "./data";

export type QuoteInput = {
  typeIds: string[];
  /** Pagine/schermate/flussi scelti per ogni servizio selezionato. */
  units: Record<string, number>;
  extras: string[];
  urgencyId: (typeof quoteUrgency)[number]["id"];
};

export type QuoteResult = {
  types: QuoteType[];
  extras: QuoteExtra[];
  min: number;
  max: number;
  weeksMin: number;
  weeksMax: number;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Gli extra che hanno senso per i servizi scelti. */
export function availableExtras(typeIds: string[]): QuoteExtra[] {
  return quoteExtras.filter((e) => e.for === "all" || e.for.some((id) => typeIds.includes(id)));
}

export const unitsFor = (input: QuoteInput, type: QuoteType) => input.units[type.id] ?? type.includedUnits;

/** Restituisce null finché non è scelto almeno un servizio. */
export function estimateQuote(input: QuoteInput): QuoteResult | null {
  const types = quoteTypes.filter((t) => input.typeIds.includes(t.id));
  if (types.length === 0) return null;
  const urgency = quoteUrgency.find((u) => u.id === input.urgencyId) ?? quoteUrgency[1];
  const extras = availableExtras(input.typeIds).filter((e) => input.extras.includes(e.id));

  let min = 0;
  let max = 0;
  // Il servizio più lungo detta i tempi; gli altri si sovrappongono in parte.
  const durations = types.map((t) => {
    const extraUnits = Math.max(0, unitsFor(input, t) - t.includedUnits);
    min += t.base[0] + extraUnits * t.perUnit;
    max += t.base[1] + extraUnits * t.perUnit * 1.4;
    return { min: t.weeks[0], max: t.weeks[1] + extraUnits * 0.25 };
  });
  const longest = (key: "min" | "max") => Math.max(...durations.map((d) => d[key]));
  const overlap = (key: "min" | "max") => (durations.reduce((sum, d) => sum + d[key], 0) - longest(key)) * 0.5;
  let weeksMin = longest("min") + overlap("min");
  let weeksMax = longest("max") + overlap("max");

  for (const extra of extras) {
    min += extra.price[0];
    max += extra.price[1];
    weeksMax += extra.weeks;
  }

  const factor = urgency.multiplier * priceFactor;
  weeksMin = Math.max(1, Math.round(weeksMin * urgency.weekFactor));
  weeksMax = Math.max(weeksMin + 1, Math.round(weeksMax * urgency.weekFactor));

  return { types, extras, min: roundTo(min * factor, 50), max: roundTo(max * factor, 50), weeksMin, weeksMax };
}

/**
 * "1.150 €". Scritto a mano perché Intl con "it-IT" non raggruppa le migliaia
 * allo stesso modo in Node e nei browser, e il server non coinciderebbe col client.
 */
export const formatEuro = (n: number) =>
  `${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;

export function quoteSummary(input: QuoteInput, result: QuoteResult): string {
  const services = result.types.map((t) => (t.perUnit > 0 ? `${t.label} (${unitsFor(input, t)} ${t.unitLabel})` : t.label));
  const urgency = quoteUrgency.find((u) => u.id === input.urgencyId)?.label ?? "";
  return [
    `${services.length > 1 ? "Servizi" : "Servizio"}: ${services.join(", ")}`,
    result.extras.length ? `Extra: ${result.extras.map((e) => e.label).join(", ")}` : null,
    `Tempistica: ${urgency}`,
    `Stima: ${formatEuro(result.min)} – ${formatEuro(result.max)} · ${result.weeksMin}-${result.weeksMax} settimane`,
  ]
    .filter(Boolean)
    .join("\n");
}
