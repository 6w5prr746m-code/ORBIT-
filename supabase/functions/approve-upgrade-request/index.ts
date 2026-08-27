// Public, unauthenticated endpoint — clicked straight from the vendor's
// notification email (notify-upgrade-request), no ORBIT login involved.
// Its entire security boundary is the unguessable `token` query param
// (an upgrade_request_approvals.approval_token, never exposed to any
// client account — see 0012_upgrade_request_approvals.sql). Because there
// is no user session here, this must run as verify_jwt = false: after
// deploying, turn OFF "Enforce JWT Verification" for this function in the
// Supabase dashboard (Edge Functions -> approve-upgrade-request -> Settings).
//
// Uses the service-role key throughout, since there is no user JWT to
// forward and organization_features has no client write policy at all —
// this function is the one deliberate, narrowly-scoped exception.

import { createClient } from 'jsr:@supabase/supabase-js@2'

function html(body: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ORBIT</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; background: #fbfaf8; color: #101113; margin: 0; padding: 24px; }
  .card { max-width: 420px; text-align: center; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { color: #5b5b5b; font-size: 14px; line-height: 1.5; }
  strong { color: #101113; }
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token) return html('<h1>Missing token</h1><p>This link is incomplete.</p>', 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: approval, error: approvalError } = await supabase
    .from('upgrade_request_approvals')
    .select('upgrade_request_id')
    .eq('approval_token', token)
    .maybeSingle()

  if (approvalError || !approval) {
    return html('<h1>Link not found</h1><p>This approval link is invalid.</p>', 404)
  }

  const { data: request, error: requestError } = await supabase
    .from('upgrade_requests')
    .select('id, status, organization_id, organizations(name)')
    .eq('id', approval.upgrade_request_id)
    .single()

  if (requestError || !request) {
    return html('<h1>Request not found</h1><p>The underlying upgrade request no longer exists.</p>', 404)
  }

  const org = Array.isArray(request.organizations) ? request.organizations[0] : request.organizations
  const orgName = org?.name ?? 'this organization'

  if (request.status === 'approved') {
    return html(`<h1>Already activated</h1><p><strong>${orgName}</strong> already has advanced permissions enabled.</p>`)
  }
  if (request.status !== 'pending') {
    return html(`<h1>Request ${request.status}</h1><p>This request is no longer pending — nothing to activate.</p>`)
  }

  const { error: featuresError } = await supabase
    .from('organization_features')
    .update({ advanced_permissions_enabled: true })
    .eq('organization_id', request.organization_id)
  if (featuresError) return html(`<h1>Something went wrong</h1><p>${featuresError.message}</p>`, 500)

  await supabase
    .from('upgrade_requests')
    .update({ status: 'approved', resolved_at: new Date().toISOString() })
    .eq('id', request.id)

  return html(`<h1>Activated ✓</h1><p>Advanced permissions are now enabled for <strong>${orgName}</strong>.</p>`)
})
