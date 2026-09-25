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
