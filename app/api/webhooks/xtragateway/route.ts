import { NextResponse, type NextRequest } from 'next/server';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getEdgeFunctionUrl() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  return `${supabaseUrl}/functions/v1/xtragateway-webhook`;
}

function getEdgeFunctionHeaders(request: NextRequest, bodyPresent: boolean) {
  const apikey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const headers = new Headers();
  headers.set('apikey', apikey);
  headers.set('authorization', `Bearer ${apikey}`);

  const contentType = request.headers.get('content-type');
  if (bodyPresent && contentType) {
    headers.set('content-type', contentType);
  }

  const signature =
    request.headers.get('x-xtragateway-signature') ||
    request.headers.get('x-signature');
  if (signature) {
    headers.set('x-xtragateway-signature', signature);
  }

  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const upstream = await fetch(getEdgeFunctionUrl(), {
      method: 'GET',
      headers: getEdgeFunctionHeaders(request, false),
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Webhook proxy error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const upstream = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: getEdgeFunctionHeaders(request, true),
      body: rawBody,
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Webhook proxy error' },
      { status: 500 }
    );
  }
}
