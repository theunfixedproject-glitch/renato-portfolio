/** Evento con cui preventivo e sezione analisi precompilano il form contatti. */
export const PREFILL_EVENT = "portfolio:prefill-contact";

/** Valore del campo "Tipo di progetto" quando dal preventivo arrivano più servizi insieme. */
export const MULTI_SERVICE_LABEL = "Più servizi insieme";

/** `raw`: il messaggio è già completo e va inserito così com'è (es. richieste di analisi). */
export type PrefillDetail = { type: string; message: string; raw?: boolean };
