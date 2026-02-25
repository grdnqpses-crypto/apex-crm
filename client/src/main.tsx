import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Remove platform-injected billing banners (targeted — only the first non-root div before #root)
(function removePlatformBanners() {
  const remove = () => {
    const root = document.getElementById('root');
    if (!root) return;
    // Only hide elements that appear BEFORE #root in the DOM (banners are injected at top)
    let sibling = document.body.firstElementChild;
    while (sibling && sibling !== root) {
      const el = sibling as HTMLElement;
      if (el.tagName === 'DIV' && !el.id && !el.getAttribute('data-radix-portal') && !el.getAttribute('data-state')) {
        el.style.display = 'none';
        el.style.height = '0';
        el.style.overflow = 'hidden';
      }
      sibling = sibling.nextElementSibling;
    }
  };
  remove();
  setTimeout(remove, 100);
  setTimeout(remove, 500);
  setTimeout(remove, 1500);
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
