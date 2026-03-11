import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
});

const FROM = process.env.MAIL_FROM || 'DRK Kennwort <noreply@drk-kennwort.de>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff">
    <div style="background:#e30613;padding:20px 30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">DRK Kennwort</h1>
    </div>
    <div style="padding:30px">${content}</div>
    <div style="padding:20px 30px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb">
      DRK Kreisverband StädteRegion Aachen e.V.<br>
      Henry-Dunant-Platz 1, 52146 Würselen
    </div>
  </div>
</body>
</html>`;
}

export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  tenantName: string;
  token: string;
}): Promise<void> {
  const link = `${APP_URL}/registrieren?token=${params.token}`;
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: `Einladung zu DRK Kennwort — ${params.tenantName}`,
    text: `${params.inviterName} hat dich eingeladen, dem Passwort-Tresor von ${params.tenantName} beizutreten.\n\nRegistriere dich hier: ${link}\n\nDer Link ist 7 Tage gültig.`,
    html: wrapHtml(`
      <h2 style="color:#212529;margin-top:0">Einladung zum Passwort-Tresor</h2>
      <p style="color:#6b7280">${params.inviterName} hat dich eingeladen, dem Passwort-Tresor von <strong>${params.tenantName}</strong> beizutreten.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="${link}" style="background:#e30613;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Jetzt registrieren</a>
      </div>
      <p style="color:#9ca3af;font-size:13px">Der Link ist 7 Tage gültig.</p>
    `),
  });
}

export async function sendMagicLinkEmail(params: {
  to: string;
  token: string;
}): Promise<void> {
  const link = `${APP_URL}/api/auth/login/magic-link/verify?token=${params.token}`;
  await transporter.sendMail({
    from: FROM,
    to: params.to,
    subject: 'Dein Anmeldelink für DRK Kennwort',
    text: `Hier ist dein Anmeldelink: ${link}\n\nDer Link ist 15 Minuten gültig. Wenn du diese E-Mail nicht angefordert hast, ignoriere sie.`,
    html: wrapHtml(`
      <h2 style="color:#212529;margin-top:0">Dein Anmeldelink</h2>
      <p style="color:#6b7280">Klicke auf den Button, um dich bei DRK Kennwort anzumelden.</p>
      <div style="text-align:center;margin:30px 0">
        <a href="${link}" style="background:#e30613;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Jetzt anmelden</a>
      </div>
      <p style="color:#9ca3af;font-size:13px">Der Link ist 15 Minuten gültig. Wenn du diese E-Mail nicht angefordert hast, ignoriere sie.</p>
    `),
  });
}
