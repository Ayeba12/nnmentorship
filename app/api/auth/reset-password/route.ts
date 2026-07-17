import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mailer } from '@/lib/mail';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-build-url.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://navymentor.ng';

    // 1. Generate recovery link from Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${origin}/auth/reset-password`,
      },
    });

    if (error) {
      // If user doesn't exist, we still return success to prevent user enumeration attacks (best security practice)
      console.warn('Supabase generateLink error:', error.message);
      return NextResponse.json({ success: true });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      throw new Error('Failed to generate recovery link');
    }

    // 2. Dispatch custom HTML reset password email via Resend
    await mailer.sendResetPasswordEmail(cleanEmail, actionLink);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Password recovery error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send recovery email' }, { status: 500 });
  }
}
