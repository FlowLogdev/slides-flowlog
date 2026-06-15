// src/lib/email.ts
const FROM = process.env.FROM_EMAIL || 'slides@flowlog.dev'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    // No email service configured — log to console for local development
    console.log(`\n📧 [Email to ${to}]\nSubject: ${subject}\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Email failed: ${JSON.stringify(err)}`)
  }
}

const shell = (inner: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{margin:0;padding:0;background:#080b15;font-family:'Georgia',serif;}
</style></head>
<body>
<div style="max-width:520px;margin:0 auto;padding:48px 28px;background:#080b15;color:#d4cfc8;">
  <div style="border-top:3px solid #f5c800;padding-top:24px;margin-bottom:36px;">
    <span style="font-family:monospace;font-size:10px;letter-spacing:0.22em;color:#f5c800;text-transform:uppercase;">SLIDES.FLOWLOG</span>
  </div>
  ${inner}
  <div style="margin-top:48px;padding-top:20px;border-top:1px solid rgba(245,200,0,0.1);">
    <span style="font-family:monospace;font-size:9px;letter-spacing:0.18em;color:rgba(245,200,0,0.35);text-transform:uppercase;">Confidential · slides.flowlog</span>
  </div>
</div>
</body></html>`

export async function sendApprovalRequestToAdmins(
  userEmail: string,
  userId: string,
  approvalToken: string,
): Promise<void> {
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

  for (const admin of admins) {
    const base = `${APP_URL}/api/auth/approve?token=${approvalToken}&id=${userId}&admin=${encodeURIComponent(admin)}`
    const approveUrl = `${base}&action=approve`
    const rejectUrl = `${base}&action=reject`

    const html = shell(`
      <h2 style="font-size:21px;font-weight:600;margin:0 0 6px;color:#ffffff;letter-spacing:-0.3px;">New Access Request</h2>
      <p style="color:#8a8f98;font-size:14px;margin:0 0 28px;line-height:1.65;">Someone has requested access to slides.flowlog.</p>
      <div style="background:#0d1120;border:1px solid rgba(245,200,0,0.14);border-radius:8px;padding:18px 20px;margin-bottom:28px;">
        <div style="font-size:10px;color:#f5c800;font-family:monospace;letter-spacing:0.15em;margin-bottom:8px;">REQUESTING USER</div>
        <div style="font-size:16px;color:#ffffff;font-weight:500;">${userEmail}</div>
      </div>
      <p style="color:#8a8f98;font-size:13px;margin:0 0 24px;line-height:1.65;">Both administrators must approve before the user receives access. Your approval is required.</p>
      <a href="${approveUrl}" style="display:block;background:#f5c800;color:#080b15;text-align:center;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;font-family:'DM Sans',sans-serif;margin-bottom:10px;">Approve Access</a>
      <a href="${rejectUrl}" style="display:block;background:transparent;color:#6b7280;text-align:center;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:12px;font-family:'DM Sans',sans-serif;border:1px solid rgba(107,114,128,0.25);">Reject Request</a>
    `)

    await send(admin, `Access Request: ${userEmail} — slides.flowlog`, html)
  }
}

export async function sendOTP(userEmail: string, otp: string): Promise<void> {
  const html = shell(`
    <h2 style="font-size:21px;font-weight:600;margin:0 0 6px;color:#ffffff;letter-spacing:-0.3px;">Your Login Code</h2>
    <p style="color:#8a8f98;font-size:14px;margin:0 0 28px;line-height:1.65;">Use the code below to log in. It expires in 15 minutes.</p>
    <div style="background:#0d1120;border:1px solid rgba(245,200,0,0.22);border-radius:10px;padding:32px;text-align:center;margin-bottom:28px;">
      <div style="font-size:44px;font-weight:700;letter-spacing:14px;color:#f5c800;font-family:monospace;">${otp}</div>
    </div>
    <p style="color:#6b7280;font-size:12px;margin:0;line-height:1.6;">If you didn't request this, you can ignore this email. Never share your code with anyone.</p>
  `)
  await send(userEmail, 'Your slides.flowlog login code', html)
}

export async function sendAccessApproved(userEmail: string): Promise<void> {
  const html = shell(`
    <h2 style="font-size:21px;font-weight:600;margin:0 0 6px;color:#ffffff;letter-spacing:-0.3px;">Access Approved</h2>
    <p style="color:#8a8f98;font-size:14px;margin:0 0 28px;line-height:1.65;">Your request to access slides.flowlog has been approved. You can now log in.</p>
    <a href="${APP_URL}" style="display:block;background:#f5c800;color:#080b15;text-align:center;padding:14px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;font-family:'DM Sans',sans-serif;">Log in to slides.flowlog</a>
  `)
  await send(userEmail, 'Your slides.flowlog access has been approved', html)
}
