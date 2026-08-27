// Emails the vendor (ORBIT's own team) whenever a client requests the
// advanced-permissions add-on, so it can be actioned for billing. Reuses
// the same RESEND_API_KEY secret as send-invitation-emails. Deploy with:
// supabase functions deploy notify-upgrade-request
//
// The caller's Authorization header is forwarded to a Supabase client, so
// the read below runs as that user and is bound by the normal RLS policy
// (upgrade_requests_select in 0011_advanced_permissions_upsell.sql) — no
// service-role key needed.

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Not authenticated' }, 401)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'RESEND_API_KEY is not configured on this project' }, 500)

  const vendorEmail = Deno.env.get('VENDOR_EMAIL')
  if (!vendorEmail) return json({ error: 'VENDOR_EMAIL is not configured on this project' }, 500)

  const fromAddress = Deno.env.get('RESEND_FROM') ?? 'ORBIT <onboarding@resend.dev>'

  let upgradeRequestId: string | undefined
  try {
    const body = await req.json()
    upgradeRequestId = body.upgradeRequestId
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }
  if (!upgradeRequestId) return json({ error: 'upgradeRequestId is required' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: request, error } = await supabase
    .from('upgrade_requests')
    .select('id, note, organization_id, organizations(name)')
    .eq('id', upgradeRequestId)
    .single()

  if (error || !request) return json({ error: error?.message ?? 'Upgrade request not found' }, 404)

  const { data: userData } = await supabase.auth.getUser()
  const requesterEmail = userData?.user?.email ?? 'unknown'

  const org = Array.isArray(request.organizations) ? request.organizations[0] : request.organizations
  const orgName = org?.name ?? 'Unknown organization'

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: vendorEmail,
      subject: `Upgrade request: advanced permissions — ${orgName}`,
      html: `
        <p><strong>${orgName}</strong> requested the advanced permissions add-on.</p>
        <p>Requested by: ${requesterEmail}</p>
        ${request.note ? `<p>Note: ${request.note}</p>` : ''}
        <p>Organization id: <code>${request.organization_id}</code></p>
        <p>Once billing is sorted, enable it by running in the Supabase SQL editor:</p>
        <pre>update organization_features set advanced_permissions_enabled = true where organization_id = '${request.organization_id}';</pre>
      `,
    }),
  })

  if (!emailResponse.ok) return json({ error: await emailResponse.text() }, 502)

  return json({ ok: true }, 200)
})
