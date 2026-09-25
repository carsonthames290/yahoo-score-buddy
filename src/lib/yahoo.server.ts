/**
 * Server-only Yahoo Fantasy helpers: OAuth token handling + API proxying.
 */

const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const API_BASE = "https://fantasysports.yahooapis.com/fantasy/v2";

export const COOKIE_AT = "yf_at";
export const COOKIE_RT = "yf_rt";
export const COOKIE_EXP = "yf_exp";

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export function yahooConfig() {
  const clientId = process.env["YAHOO_CLIENT_ID"];
  const clientSecret = process.env["YAHOO_CLIENT_SECRET"];
  const appUrl = process.env["APP_URL"];
  return { clientId, clientSecret, appUrl };
}

export function redirectUri(requestUrl: string) {
  const { appUrl } = yahooConfig();
  const origin = appUrl?.replace(/\/$/, "") ?? new URL(requestUrl).origin;
  return `${origin}/api/public/yahoo/callback`;
}

export function authorizeUrl(clientId: string, uri: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    response_type: "code",
    language: "en-us",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function basicAuth(id: string, secret: string) {
  return "Basic " + btoa(`${id}:${secret}`);
}

export async function exchangeCode(code: string, uri: string): Promise<Tokens> {
  const { clientId, clientSecret } = yahooConfig();
  if (!clientId || !clientSecret) throw new Error("Yahoo credentials missing");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      redirect_uri: uri,
      code,
    }),
  });
  if (!res.ok) throw new Error(`Yahoo token exchange failed: ${res.status}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
  };
}

export async function refreshTokens(refreshToken: string, uri: string): Promise<Tokens> {
  const { clientId, clientSecret } = yahooConfig();
  if (!clientId || !clientSecret) throw new Error("Yahoo credentials missing");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      redirect_uri: uri,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error("SESSION_EXPIRED");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? refreshToken,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
  };
}

export function cookieStrings(t: Tokens) {
  const base = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=5184000";
  return [
    `${COOKIE_AT}=${encodeURIComponent(t.access_token)}; ${base}`,
    `${COOKIE_RT}=${encodeURIComponent(t.refresh_token)}; ${base}`,
    `${COOKIE_EXP}=${t.expires_at}; Path=/; Secure; SameSite=Lax; Max-Age=5184000`,
  ];
}

export function clearCookieStrings() {
  return [COOKIE_AT, COOKIE_RT, COOKIE_EXP].map(
    (n) => `${n}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

export function parseCookies(header: string | undefined | null) {
  const out: Record<string, string> = {};
  (header ?? "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export async function yahooGet(path: string, accessToken: string) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API_BASE}/${path}${sep}format=json`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`Yahoo API error ${res.status}`);
  return res.json();
}

/* ---------- Yahoo's odd JSON shapes ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function items(o: any): any[] {
  if (!o || typeof o !== "object") return [];
  return Object.keys(o)
    .filter((k) => /^\d+$/.test(k))
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => o[k]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flat(input: any): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (x: any) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") {
      for (const [k, v] of Object.entries(x)) {
        if (/^\d+$/.test(k)) walk(v);
        else if (out[k] === undefined) out[k] = v;
      }
    }
  };
  walk(input);
  return out;
}
