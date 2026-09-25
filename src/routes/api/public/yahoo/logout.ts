import { createFileRoute } from "@tanstack/react-router";
import { clearCookieStrings } from "@/lib/yahoo.server";

export const Route = createFileRoute("/api/public/yahoo/logout")({
  server: {
    handlers: {
      GET: async () => {
        const headers = new Headers({ Location: "/" });
        for (const c of clearCookieStrings()) headers.append("Set-Cookie", c);
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
