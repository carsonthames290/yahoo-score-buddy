import { createFileRoute } from "@tanstack/react-router";
import { authorizeUrl, redirectUri, yahooConfig } from "@/lib/yahoo.server";

export const Route = createFileRoute("/api/public/yahoo/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientId } = yahooConfig();
        if (!clientId) {
          return new Response("Yahoo app not configured yet.", { status: 503 });
        }
        const uri = redirectUri(request.url);
        const headers = new Headers({ Location: authorizeUrl(clientId, uri) });
        // ?setup=1 asks the callback page to show the refresh token (owner setup).
        if (new URL(request.url).searchParams.get("setup") === "1") {
          headers.append("Set-Cookie", "yahoo_setup=1; Path=/api/public/yahoo/callback; Max-Age=600; HttpOnly; SameSite=Lax");
        }
        return new Response(null, {
          status: 302,
          headers,
        });
      },
    },
  },
});
