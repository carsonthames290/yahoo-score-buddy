import { createFileRoute } from "@tanstack/react-router";
import { cookieStrings, exchangeCode, redirectUri } from "@/lib/yahoo.server";

export const Route = createFileRoute("/api/public/yahoo/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) {
          return new Response(null, { status: 302, headers: { Location: "/?error=denied" } });
        }
        try {
          const tokens = await exchangeCode(code, redirectUri(request.url));
          // One-time owner setup: show the refresh token so it can be saved server-side.
          // Also shown on demand via ?setup=1 (e.g. after rotating Yahoo app credentials).
          const forceSetup = url.searchParams.get("setup") === "1";
          if (!process.env["YAHOO_REFRESH_TOKEN"] || forceSetup) {
            const esc = tokens.refresh_token.replace(/[<>&"]/g, "");
            const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#111;color:#eee;padding:24px;max-width:640px;margin:auto"><h2>Almost done</h2><p>Copy this code and paste it into the secure form in chat:</p><textarea readonly style="width:100%;height:120px;font-family:monospace" onclick="this.select()">${esc}</textarea><p><a href="/" style="color:#7f7">Back to site</a></p></body>`;
            const headers = new Headers({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
            for (const c of cookieStrings(tokens)) headers.append("Set-Cookie", c);
            return new Response(html, { headers });
          }
          const headers = new Headers({ Location: "/" });
          for (const c of cookieStrings(tokens)) headers.append("Set-Cookie", c);
          return new Response(null, { status: 302, headers });
        } catch {
          return new Response(null, { status: 302, headers: { Location: "/?error=auth" } });
        }
      },
    },
  },
});
