/** Evento con cui il preventivo rapido precompila il form contatti. */
export const PREFILL_EVENT = "portfolio:prefill-contact";

/** Valore del campo "Tipo di progetto" quando dal preventivo arrivano più servizi insieme. */
export const MULTI_SERVICE_LABEL = "Più servizi insieme";

export type PrefillDetail = { type: string; message: string };
