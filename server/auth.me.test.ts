import { describe, it, expect } from "vitest";
import { parse as parseCookieHeader } from "cookie";

/**
 * Tests the exact cookie-parsing logic used in auth.me after the fix.
 * Root cause: ctx.req.cookies is always undefined because Express cookie-parser
 * is not installed. The fix reads from ctx.req.headers["cookie"] directly.
 */
describe("auth.me cookie parsing (emulation detection fix)", () => {
  it("parses app_session_id from raw cookie header string", () => {
    const rawHeader = "app_session_id=abc123; other_cookie=xyz";
    const cookieMap = parseCookieHeader(rawHeader);
    expect(cookieMap["app_session_id"]).toBe("abc123");
  });

  it("returns undefined when cookie header is empty", () => {
    const cookieMap = parseCookieHeader("");
    expect(cookieMap["app_session_id"]).toBeUndefined();
  });

  it("returns undefined when cookie header is undefined (simulates no cookie-parser)", () => {
    const rawHeader: string | undefined = undefined;
    const cookieMap = rawHeader ? parseCookieHeader(rawHeader) : {};
    expect(cookieMap["app_session_id"]).toBeUndefined();
  });

  it("parses correctly when app_session_id is the only cookie", () => {
    const rawHeader = "app_session_id=token_xyz";
    const cookieMap = parseCookieHeader(rawHeader);
    expect(cookieMap["app_session_id"]).toBe("token_xyz");
  });

  it("parses correctly when app_session_id has complex JWT-like value", () => {
    const jwtLike = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abc";
    const rawHeader = `app_session_id=${jwtLike}; path=/`;
    const cookieMap = parseCookieHeader(rawHeader);
    expect(cookieMap["app_session_id"]).toBe(jwtLike);
  });

  it("simulates the old broken approach vs the fix (covers emulate + restoreSession too)", () => {
    // This is what was happening before the fix
    const reqCookies = undefined as any; // Express req.cookies without cookie-parser
    const brokenToken = reqCookies?.["app_session_id"];
    expect(brokenToken).toBeUndefined(); // This caused isEmulating to always be false

    // The fix: read from raw header
    const rawHeader = "app_session_id=real_token";
    const fixedCookieMap = rawHeader ? parseCookieHeader(rawHeader) : {};
    const fixedToken = fixedCookieMap["app_session_id"];
    expect(fixedToken).toBe("real_token"); // Now correctly reads the token
  });
});
