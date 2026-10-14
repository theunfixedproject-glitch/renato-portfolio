import { quoteExtras, quoteTypes, quoteUrgency, type QuoteType } from "./data";

export type QuoteInput = {
  typeId: string;
  units: number;
  extras: string[];
  urgencyId: (typeof quoteUrgency)[number]["id"];
};

export type QuoteResult = {
  type: QuoteType;
  min: number;
  max: number;
  weeksMin: number;
  weeksMax: number;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function estimateQuote(input: QuoteInput): QuoteResult {
  const type = quoteTypes.find((t) => t.id === input.typeId) ?? quoteTypes[0];
  const urgency = quoteUrgency.find((u) => u.id === input.urgencyId) ?? quoteUrgency[1];
  const extras = quoteExtras.filter((e) => input.extras.includes(e.id));

  const extraUnits = Math.max(0, input.units - type.includedUnits);
  let min = type.base[0] + extraUnits * type.perUnit;
  let max = type.base[1] + extraUnits * type.perUnit * 1.4;
  let weeksMin = type.weeks[0];
  let weeksMax = type.weeks[1] + extraUnits * 0.25;

  for (const extra of extras) {
    min += extra.price[0];
    max += extra.price[1];
    weeksMax += extra.weeks;
  }

  min *= urgency.multiplier;
  max *= urgency.multiplier;
  weeksMin = Math.max(1, Math.round(weeksMin * urgency.weekFactor));
  weeksMax = Math.max(weeksMin + 1, Math.round(weeksMax * urgency.weekFactor));

  return { type, min: roundTo(min, 50), max: roundTo(max, 50), weeksMin, weeksMax };
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
  const extras = quoteExtras.filter((e) => input.extras.includes(e.id)).map((e) => e.label);
  const urgency = quoteUrgency.find((u) => u.id === input.urgencyId)?.label ?? "";
  return [
    `Progetto: ${result.type.label}`,
    result.type.perUnit > 0 ? `${result.type.unitLabel[0].toUpperCase()}${result.type.unitLabel.slice(1)}: ${input.units}` : null,
    extras.length ? `Extra: ${extras.join(", ")}` : null,
    `Tempistica: ${urgency}`,
    `Stima: ${formatEuro(result.min)} – ${formatEuro(result.max)} · ${result.weeksMin}-${result.weeksMax} settimane`,
  ]
    .filter(Boolean)
    .join("\n");
}
