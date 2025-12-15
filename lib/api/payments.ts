// Client-side payment API utilities
// Only initiates payment - payment creation & verification happens server-side (Edge Functions)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!SUPABASE_ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

export interface CreatePaymentParams {
  plan_id: string;
  quantity?: number;
  guest_email?: string;
  phone_number?: string;
  success_url: string;
  cancel_url: string;
  token?: string;
}

export interface CreatePaymentResponse {
  order_id: string;
  payment_id: string;
  payment_url: string;
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResponse> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are not configured. ' +
      'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const url = `${SUPABASE_URL}/functions/v1/create-payment`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  // Optional auth for logged-in users
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }

  const payload = {
    plan_id: params.plan_id,
    quantity: params.quantity ?? 1,
    guest_email: params.guest_email,
    phone_number: params.phone_number,
    success_url: params.success_url,
    cancel_url: params.cancel_url,
  };

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Network error calling create-payment Edge Function', {
      url,
      payload,
    });

    throw new Error(
      `Failed to connect to payment service. ` +
      `Please check your internet connection and try again.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Payment request failed (HTTP ${response.status})`;

    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data as CreatePaymentResponse;
}

export async function verifyPayment(
  orderId: string,
  token?: string
): Promise<{ status: string; verified: boolean }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are not configured. ' +
      'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const url = `${SUPABASE_URL}/functions/v1/verify-payment`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ order_id: orderId }),
    });
  } catch {
    throw new Error(
      `Failed to connect to payment verification service.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Payment verification failed (HTTP ${response.status})`;

    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}
