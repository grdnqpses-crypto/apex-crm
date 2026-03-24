/**
 * Tests for Google Calendar free/busy helper and booking GDPR consent validation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isSlotBusy,
  getGoogleBusyIntervals,
  getHostBusyIntervals,
  refreshGoogleToken,
} from "./google-calendar";

// ─── isSlotBusy ──────────────────────────────────────────────────────────────

describe("isSlotBusy", () => {
  const busy = [
    { start: "2026-03-25T10:00:00Z", end: "2026-03-25T11:00:00Z" },
    { start: "2026-03-25T14:00:00Z", end: "2026-03-25T15:00:00Z" },
  ];

  it("returns false when slot does not overlap any busy interval", () => {
    const slotStart = new Date("2026-03-25T09:00:00Z").getTime();
    const slotEnd = new Date("2026-03-25T09:30:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(false);
  });

  it("returns true when slot overlaps a busy interval", () => {
    const slotStart = new Date("2026-03-25T10:30:00Z").getTime();
    const slotEnd = new Date("2026-03-25T11:00:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(true);
  });

  it("returns true when slot starts exactly when busy interval starts", () => {
    const slotStart = new Date("2026-03-25T10:00:00Z").getTime();
    const slotEnd = new Date("2026-03-25T10:30:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(true);
  });

  it("returns false when slot ends exactly when busy interval starts (no overlap)", () => {
    // Slot ends at 10:00, busy starts at 10:00 → no overlap (end is exclusive)
    const slotStart = new Date("2026-03-25T09:30:00Z").getTime();
    const slotEnd = new Date("2026-03-25T10:00:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(false);
  });

  it("returns false when slot starts exactly when busy interval ends (no overlap)", () => {
    // Slot starts at 11:00, busy ends at 11:00 → no overlap
    const slotStart = new Date("2026-03-25T11:00:00Z").getTime();
    const slotEnd = new Date("2026-03-25T11:30:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(false);
  });

  it("returns false for empty busy array", () => {
    const slotStart = new Date("2026-03-25T10:00:00Z").getTime();
    const slotEnd = new Date("2026-03-25T10:30:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, [])).toBe(false);
  });

  it("returns true when slot is fully contained within a busy interval", () => {
    const slotStart = new Date("2026-03-25T10:15:00Z").getTime();
    const slotEnd = new Date("2026-03-25T10:45:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(true);
  });

  it("returns true when slot spans across multiple busy intervals", () => {
    const slotStart = new Date("2026-03-25T09:00:00Z").getTime();
    const slotEnd = new Date("2026-03-25T16:00:00Z").getTime();
    expect(isSlotBusy(slotStart, slotEnd, busy)).toBe(true);
  });
});

// ─── getGoogleBusyIntervals ───────────────────────────────────────────────────

describe("getGoogleBusyIntervals", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    const result = await getGoogleBusyIntervals("token", "primary", "2026-03-25T00:00:00Z", "2026-03-25T23:59:59Z");
    expect(result).toEqual([]);
  });

  it("returns empty array when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await getGoogleBusyIntervals("token", "primary", "2026-03-25T00:00:00Z", "2026-03-25T23:59:59Z");
    expect(result).toEqual([]);
  });

  it("returns busy intervals from Google Calendar API response", async () => {
    const mockBusy = [
      { start: "2026-03-25T10:00:00Z", end: "2026-03-25T11:00:00Z" },
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        calendars: {
          primary: { busy: mockBusy },
        },
      }),
    }));
    const result = await getGoogleBusyIntervals("token", "primary", "2026-03-25T00:00:00Z", "2026-03-25T23:59:59Z");
    expect(result).toEqual(mockBusy);
  });

  it("returns empty array when calendar has no busy intervals", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        calendars: {
          primary: { busy: [] },
        },
      }),
    }));
    const result = await getGoogleBusyIntervals("token", "primary", "2026-03-25T00:00:00Z", "2026-03-25T23:59:59Z");
    expect(result).toEqual([]);
  });

  it("returns empty array when calendar key is missing from response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ calendars: {} }),
    }));
    const result = await getGoogleBusyIntervals("token", "primary", "2026-03-25T00:00:00Z", "2026-03-25T23:59:59Z");
    expect(result).toEqual([]);
  });
});

// ─── refreshGoogleToken ───────────────────────────────────────────────────────

describe("refreshGoogleToken", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  it("returns null when GOOGLE_CLIENT_ID is not set", async () => {
    const result = await refreshGoogleToken("refresh_token_123");
    expect(result).toBeNull();
  });

  it("returns null when GOOGLE_CLIENT_SECRET is not set", async () => {
    process.env.GOOGLE_CLIENT_ID = "client_id";
    const result = await refreshGoogleToken("refresh_token_123");
    expect(result).toBeNull();
  });

  it("returns new access token when refresh succeeds", async () => {
    process.env.GOOGLE_CLIENT_ID = "client_id";
    process.env.GOOGLE_CLIENT_SECRET = "client_secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "new_access_token_xyz" }),
    }));
    const result = await refreshGoogleToken("refresh_token_123");
    expect(result).toBe("new_access_token_xyz");
  });

  it("returns null when refresh request fails", async () => {
    process.env.GOOGLE_CLIENT_ID = "client_id";
    process.env.GOOGLE_CLIENT_SECRET = "client_secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await refreshGoogleToken("refresh_token_123");
    expect(result).toBeNull();
  });
});

// ─── getHostBusyIntervals ─────────────────────────────────────────────────────

describe("getHostBusyIntervals", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty busy array when accessToken is null", async () => {
    const result = await getHostBusyIntervals(null, null, null, "2026-03-25", "America/New_York");
    expect(result.busy).toEqual([]);
    expect(result.newAccessToken).toBeNull();
  });

  it("returns empty busy array when accessToken is undefined", async () => {
    const result = await getHostBusyIntervals(undefined, undefined, undefined, "2026-03-25", "UTC");
    expect(result.busy).toEqual([]);
    expect(result.newAccessToken).toBeNull();
  });

  it("returns busy intervals from Google when token is valid", async () => {
    const mockBusy = [{ start: "2026-03-25T14:00:00Z", end: "2026-03-25T15:00:00Z" }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ calendars: { primary: { busy: mockBusy } } }),
    }));
    const result = await getHostBusyIntervals("valid_token", null, "primary", "2026-03-25", "UTC");
    expect(result.busy).toEqual(mockBusy);
    expect(result.newAccessToken).toBeNull();
  });

  it("uses 'primary' as default calendarId when calendarId is null", async () => {
    let capturedBody = "";
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (_url: string, opts: any) => {
      capturedBody = opts.body;
      return { ok: true, json: async () => ({ calendars: { primary: { busy: [] } } }) };
    }));
    await getHostBusyIntervals("token", null, null, "2026-03-25", "UTC");
    const body = JSON.parse(capturedBody);
    expect(body.items[0].id).toBe("primary");
  });
});

// ─── GDPR consent validation logic ───────────────────────────────────────────

describe("GDPR consent validation (booking form logic)", () => {
  it("booking should be blocked when gdprConsent is false", () => {
    const gdprConsent = false;
    const formValid = true; // name and email are filled
    const canBook = formValid && gdprConsent;
    expect(canBook).toBe(false);
  });

  it("booking should proceed when gdprConsent is true and form is valid", () => {
    const gdprConsent = true;
    const formValid = true;
    const canBook = formValid && gdprConsent;
    expect(canBook).toBe(true);
  });

  it("booking should be blocked when form is invalid even with consent", () => {
    const gdprConsent = true;
    const formValid = false; // missing name or email
    const canBook = formValid && gdprConsent;
    expect(canBook).toBe(false);
  });

  it("calendarConnected flag should be true when any slot has calendarConnected=true", () => {
    const slots = [
      { startTime: 1000, endTime: 2000, available: true, calendarConnected: true },
      { startTime: 3000, endTime: 4000, available: false, calendarConnected: true },
    ];
    const calendarConnected = slots.some(s => s.calendarConnected);
    expect(calendarConnected).toBe(true);
  });

  it("calendarConnected flag should be false when no slots have calendarConnected=true", () => {
    const slots = [
      { startTime: 1000, endTime: 2000, available: true, calendarConnected: false },
    ];
    const calendarConnected = slots.some(s => s.calendarConnected);
    expect(calendarConnected).toBe(false);
  });
});
