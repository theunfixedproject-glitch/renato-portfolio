import { NextResponse } from "next/server";
import { profile } from "@/lib/data";

type Payload = { name?: string; email?: string; phone?: string; type?: string; message?: string; website?: string };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  let data: Payload;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  // Campo trappola compilato: è un bot. Rispondiamo ok senza inviare nulla.
  if (clean(data.website, 200)) return NextResponse.json({ ok: true });

  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  const phone = clean(data.phone, 40);
  const type = clean(data.type, 80);
  const message = clean(data.message, 5000);

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return NextResponse.json({ error: "Campi mancanti o non validi" }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  if (!apiKey || !from) {
    // Nessun servizio email configurato: il client ripiega sull'app email del visitatore.
    return NextResponse.json({ error: "Invio non configurato" }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [profile.email],
      reply_to: email,
      subject: `Nuovo contatto dal portfolio: ${type || "progetto"} — ${name}`,
      text: [`Nome: ${name}`, `Email: ${email}`, phone && `Telefono: ${phone}`, type && `Progetto: ${type}`, "", message]
        .filter((l) => l !== "")
        .join("\n"),
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Invio non riuscito" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
