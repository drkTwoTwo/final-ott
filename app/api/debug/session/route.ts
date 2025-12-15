import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { ok: false, stage: 'auth.getUser', error: userError.message },
        { status: 200 }
      );
    }

    if (!user) {
      return NextResponse.json({ ok: true, user: null, profile: null }, { status: 200 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profileError
          ? { error: profileError.message }
          : {
              role: profile?.role ?? null,
            },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, stage: 'handler', error: err?.message ?? 'Unknown error' },
      { status: 200 }
    );
  }
}
