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
        return new Response(null, {
          status: 302,
          headers: { Location: authorizeUrl(clientId, uri) },
        });
      },
    },
  },
});
