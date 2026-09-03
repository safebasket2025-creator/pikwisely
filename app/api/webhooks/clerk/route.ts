import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set!');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the Svix headers
  const headerPayload = await headers();
  const svix_id        = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body    = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as unknown as WebhookEvent;
  } catch (err) {
    console.error('[clerk-webhook] Signature verification failed:', err);
    return new Response('Error occured', { status: 400 });
  }

  const eventType = evt.type;
  console.log('[clerk-webhook] Received event:', eventType);

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const primaryEmail = email_addresses[0]?.email_address;
    const full_name    = `${first_name || ''} ${last_name || ''}`.trim();

    console.log(`[clerk-webhook] user.created: id=${id} email=${primaryEmail}`);

    // Check if a row already exists for this email (old UUID row from pre-migration)
    const { data: byEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', primaryEmail)
      .maybeSingle();

    if (byEmail) {
      if (byEmail.id === id) {
        // Already correct — idempotent, do nothing
        console.log(`[clerk-webhook] Profile already exists with correct ID for ${primaryEmail}`);
      } else {
        // Old UUID row — relink to new Clerk ID
        console.log(`[clerk-webhook] Relinking ${primaryEmail}: ${byEmail.id} → ${id}`);
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ id })
          .eq('email', primaryEmail);
        if (error) {
          console.error('[clerk-webhook] Relink error:', error.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    } else {
      // Brand new user — insert with ALL fields explicit (do NOT rely on DB defaults)
      console.log(`[clerk-webhook] Inserting new profile for ${primaryEmail}`);
      const { error } = await supabaseAdmin.from('profiles').insert({
        id,
        email:         primaryEmail,
        full_name,
        plan:          'free',
        reports_limit: 3,
        reports_used:  0,
      });

      if (error) {
        console.error('[clerk-webhook] Insert error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log(`[clerk-webhook] ✅ Profile created for ${id} (${primaryEmail})`);
    }
  }

  return NextResponse.json({ success: true });
}
