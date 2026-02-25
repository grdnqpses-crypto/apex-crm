import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Remove any platform-injected banners (billing notices, etc.)
(function removePlatformBanners() {
  const remove = () => {
    const root = document.getElementById('root');
    if (!root) return;
    Array.from(document.body.children).forEach(child => {
      if (child !== root && child.tagName !== 'SCRIPT' && child.tagName !== 'LINK' && child.tagName !== 'STYLE') {
        (child as HTMLElement).style.display = 'none';
        (child as HTMLElement).style.height = '0';
        (child as HTMLElement).style.overflow = 'hidden';
      }
    });
  };
  remove();
  // Run again after a short delay in case banners are injected after load
  setTimeout(remove, 100);
  setTimeout(remove, 500);
  setTimeout(remove, 1500);
  // Also observe for dynamically injected elements
  const observer = new MutationObserver(() => remove());
  observer.observe(document.body, { childList: true });
})();

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
