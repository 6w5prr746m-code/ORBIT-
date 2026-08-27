// Sends (or resends) invitation emails via Resend. This is the only place
// the Resend API key ever exists — it's read from a server-side secret
// (RESEND_API_KEY, set with `supabase secrets set`), never shipped to the
// browser. Deploy with: supabase functions deploy send-invitation-emails
//
// The caller's Authorization header is forwarded to a Supabase client, so
// every read/write here runs as that user and is bound by the same RLS
// policies as the rest of the app (invitations_select/write in
// 0010_invitations.sql) — no service-role key needed.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface InvitationRow {
  id: string
  email: string
  token: string
  status: string
  organizations: { name: string } | { name: string }[] | null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Not authenticated' }, 401)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'RESEND_API_KEY is not configured on this project' }, 500)

  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
  const fromAddress = Deno.env.get('RESEND_FROM') ?? 'ORBIT <onboarding@resend.dev>'

  let invitationIds: string[]
  try {
    const body = await req.json()
    invitationIds = Array.isArray(body.invitationIds) ? body.invitationIds : []
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (invitationIds.length === 0) return json({ error: 'invitationIds is required' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('id, email, token, status, organizations(name)')
    .in('id', invitationIds)

  if (error) return json({ error: error.message }, 400)
  if (!invitations || invitations.length === 0) return json({ error: 'No matching invitations' }, 404)

  const results: { id: string; ok: boolean; error?: string }[] = []

  for (const inv of invitations as unknown as InvitationRow[]) {
    if (inv.status !== 'pending') {
      results.push({ id: inv.id, ok: false, error: 'Not pending' })
      continue
    }

    const org = Array.isArray(inv.organizations) ? inv.organizations[0] : inv.organizations
    const orgName = org?.name ?? 'your organization'
    const link = `${siteUrl}/invite/${inv.token}`

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: inv.email,
        subject: `You're invited to join ${orgName} on ORBIT`,
        html: `<p>You've been invited to join <strong>${orgName}</strong> on ORBIT.</p><p><a href="${link}">Accept your invitation</a></p><p>If you weren't expecting this, you can ignore this email.</p>`,
      }),
    })

    if (!emailResponse.ok) {
      results.push({ id: inv.id, ok: false, error: await emailResponse.text() })
      continue
    }

    await supabase.from('invitations').update({ last_sent_at: new Date().toISOString() }).eq('id', inv.id)
    results.push({ id: inv.id, ok: true })
  }

  return json({ results }, 200)
})
