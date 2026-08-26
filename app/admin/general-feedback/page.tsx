import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';
import GeneralFeedbackClient from './GeneralFeedbackClient';

export default async function AdminGeneralFeedbackPage() {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY
  );

  let feedbacks: any[] = [];
  let error: string | null = null;

  try {
    const { data, error: fErr } = await supabaseAdmin
      .from('general_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (fErr) {
      if (fErr.code === 'PGRST205' || fErr.code === '42P01') {
        error = "general_feedback table not found.";
      } else {
        error = `Failed to load feedback: ${fErr.message}`;
      }
    } else {
      feedbacks = data || [];
    }
  } catch (err: any) {
    error = err.message;
  }

  return <GeneralFeedbackClient feedbacks={feedbacks} error={error} />;
}
