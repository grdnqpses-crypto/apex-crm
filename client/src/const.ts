export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// All login/signup happens on the public MarketingHome page — the single entry point.
export const getLoginUrl = (_returnPath?: string) => {
  return "/";
};
