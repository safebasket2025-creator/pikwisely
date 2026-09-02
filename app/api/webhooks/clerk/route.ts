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
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as unknown as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    
    // If they were migrated, their Supabase ID is in public_metadata
    // Since we're moving to TEXT ids, we can just use the Clerk ID directly,
    // OR if you want to keep the old ID, you can use public_metadata.supabase_id
    const primaryEmail = email_addresses[0]?.email_address;
    
    // Check if user already exists (in case they signed up before migration or we are updating)
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', primaryEmail)
      .single();

    if (existingUser) {
      // User exists from old Supabase auth but signed up via Clerk (missed migration window)
      // Update their ID to the new Clerk ID so they retain their credits & history
      console.log(`[Webhook] Relinking unmigrated user: ${primaryEmail} | Old ID: ${existingUser.id} -> New ID: ${id}`);
      
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ id: id })
        .eq('email', primaryEmail);

      if (error) {
        console.error('Error updating existing profile ID:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Create new profile using the Clerk ID as the ID (because we altered the column to TEXT)
      const { error } = await supabaseAdmin.from('profiles').insert({
        id: id,
        email: primaryEmail,
        full_name: `${first_name || ''} ${last_name || ''}`.trim(),
      });

      if (error) {
        console.error('Error creating profile for new Clerk user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
