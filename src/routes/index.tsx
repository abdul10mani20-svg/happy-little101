import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => { throw redirect({ to: "/auth", search: { denied: false } }); },
  head: () => ({ meta: [{ title: "License Control" }, { name: "description", content: "Secure administration for browser extension licenses." }, { property: "og:title", content: "License Control" }, { property: "og:description", content: "Secure administration for browser extension licenses." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => null,
});
