export function resendFrom() {
  return process.env.RESEND_FROM || "Downstream <onboarding@resend.dev>";
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail({ to, subject, html, text, headers }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "missing-key" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: [to],
      subject,
      html,
      text,
      headers,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    return { ok: false, reason: body.slice(0, 400) };
  }
  return { ok: true };
}
