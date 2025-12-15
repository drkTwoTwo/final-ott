// Client-side utilities for calling Supabase Edge Functions
// Works in Vercel + production + local

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!SUPABASE_ANON_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface CallEdgeFunctionOptions {
  method?: HttpMethod;
  body?: any;
  token?: string;
  queryParams?: Record<string, string>;
}

export async function callEdgeFunction(
  functionName: string,
  options: CallEdgeFunctionOptions = {}
) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment variables are not configured. ' +
      'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const { method = 'GET', body, token, queryParams } = options;

  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  // IMPORTANT:
  // - apikey is ALWAYS required
  // - Authorization header ONLY when user token exists
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error('Network error calling Edge Function', {
      functionName,
      url: url.toString(),
      method,
    });

    throw new Error(
      `Failed to connect to Edge Function "${functionName}". ` +
      `Check your internet connection and try again.`
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
      `Edge Function error (HTTP ${response.status})`;

    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = data;
    throw error;
  }

  return data;
}

/* ===========================
   PUBLIC FUNCTIONS
=========================== */

export function getProductsWithPlans() {
  return callEdgeFunction('get-products-with-plans');
}

export function getProductBySlug(slug: string) {
  return callEdgeFunction('get-product-by-slug', {
    queryParams: { slug },
  });
}

/* ===========================
   ORDER FUNCTIONS
=========================== */

export function createOrder(
  data: {
    plan_id: string;
    quantity?: number;
    guest_email?: string;
  },
  token?: string
) {
  return callEdgeFunction('create-order', {
    method: 'POST',
    body: data,
    token,
  });
}

/* ===========================
   ADMIN FUNCTIONS
=========================== */

export function adminCreateProduct(data: any, token: string) {
  return callEdgeFunction('admin-create-product', {
    method: 'POST',
    body: data,
    token,
  });
}

export function adminUpdateProduct(id: string, data: any, token: string) {
  return callEdgeFunction('admin-update-product', {
    method: 'PUT',
    body: data,
    token,
    queryParams: { id },
  });
}

export function adminDeleteProduct(id: string, token: string) {
  return callEdgeFunction('admin-delete-product', {
    method: 'DELETE',
    token,
    queryParams: { id },
  });
}

export function adminCreatePlan(data: any, token: string) {
  return callEdgeFunction('admin-create-plan', {
    method: 'POST',
    body: data,
    token,
  });
}

export function adminUpdatePlan(id: string, data: any, token: string) {
  return callEdgeFunction('admin-update-plan', {
    method: 'PUT',
    body: data,
    token,
    queryParams: { id },
  });
}

export function adminGetOrders(
  token: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  const queryParams: Record<string, string> = {};

  if (filters?.status) queryParams.status = filters.status;
  if (filters?.limit) queryParams.limit = String(filters.limit);
  if (filters?.offset) queryParams.offset = String(filters.offset);

  return callEdgeFunction('admin-get-orders', {
    token,
    queryParams,
  });
}
