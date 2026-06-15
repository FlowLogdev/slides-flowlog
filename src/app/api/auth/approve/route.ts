import { NextRequest, NextResponse } from 'next/server'
import { findUserByApprovalToken, approveUser, rejectUser } from '@/lib/db'
import { sendAccessApproved } from '@/lib/email'

function page(title: string, body: string, gold = true): NextResponse {
  const accent = gold ? '#f5c800' : '#e74c3c'
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — slides.flowlog</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#080b15;color:#d4cfc8;font-family:'Georgia',serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{max-width:480px;width:100%;padding:48px 36px;text-align:center}
    .rule{height:3px;background:${accent};margin-bottom:28px;border-radius:1px}
    .label{font-family:monospace;font-size:10px;letter-spacing:0.22em;color:${accent};text-transform:uppercase;margin-bottom:20px}
    h1{font-size:24px;font-weight:600;color:#ffffff;margin-bottom:14px;letter-spacing:-0.3px}
    p{color:#8a8f98;font-size:15px;line-height:1.65}
    .foot{margin-top:48px;font-family:monospace;font-size:9px;letter-spacing:0.18em;color:rgba(245,200,0,0.3);text-transform:uppercase}
  </style>
</head>
<body>
  <div class="card">
    <div class="rule"></div>
    <div class="label">slides.flowlog</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <p style="margin-top:28px;font-size:12px;color:#4b5563">You can close this window.</p>
    <div class="foot">Confidential · slides.flowlog</div>
  </div>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token') || ''
  const adminEmail = searchParams.get('admin') || ''
  const userId = searchParams.get('id') || ''
  const action = searchParams.get('action') || 'approve'

  if (!token || !adminEmail || !userId) {
    return page('Invalid Link', 'This approval link is missing required parameters.', false)
  }

  const user = await findUserByApprovalToken(token)
  if (!user || user.id !== userId) {
    return page('Invalid Link', 'This link is invalid or has already been used.', false)
  }

  if (user.status === 'rejected') {
    return page('Already Rejected', `The request for ${user.email} has already been rejected.`, false)
  }

  if (action === 'reject') {
    await rejectUser(userId)
    return page('Request Rejected', `Access for ${user.email} has been denied.`, false)
  }

  // Approve
  const updated = await approveUser(userId, adminEmail)
  if (!updated) {
    return page('Error', 'Something went wrong. Please try again.', false)
  }

  if (updated.status === 'approved') {
    try {
      await sendAccessApproved(updated.email)
    } catch (err) {
      console.error('[approve] Failed to notify user:', err)
    }
    return page('Access Granted', `${updated.email} has been approved and notified by email.`)
  }

  const admins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  const remaining = admins.filter(a => !updated.approvals.includes(a))
  return page('Approval Recorded', `Your approval for ${updated.email} has been recorded. Awaiting: ${remaining.join(', ')}.`)
}
