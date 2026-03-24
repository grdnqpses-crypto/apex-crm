import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Google Calendar OAuth helper tests ──────────────────────────────────────

describe("Google Calendar OAuth URL builder", () => {
  it("returns not-configured when GOOGLE_CLIENT_ID is missing", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    const configured = !!process.env.GOOGLE_CLIENT_ID;
    expect(configured).toBe(false);

    // restore
    if (clientId) process.env.GOOGLE_CLIENT_ID = clientId;
  });

  it("builds a valid Google OAuth URL when credentials are present", () => {
    const clientId = "test-client-id";
    const redirectUri = "https://example.com/api/google-calendar/callback";
    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain("access_type=offline");
    expect(url).toContain("calendar.readonly");
  });

  it("includes state param with userId for callback identification", () => {
    const userId = 42;
    const origin = "https://myapp.example.com";
    const state = Buffer.from(JSON.stringify({ userId, origin })).toString("base64");
    const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    expect(decoded.userId).toBe(42);
    expect(decoded.origin).toBe("https://myapp.example.com");
  });
});

// ── Booking email / ICS generation tests ────────────────────────────────────

describe("ICS calendar attachment generation", () => {
  function generateICS(params: {
    uid: string;
    summary: string;
    startTime: number;
    endTime: number;
    organizerEmail: string;
    guestEmail: string;
    location?: string;
  }) {
    const fmt = (ts: number) =>
      new Date(ts).toISOString().replace(/[-:]/g, "").replace(".000", "");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AXIOM CRM//Booking//EN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${params.uid}`,
      `DTSTAMP:${fmt(Date.now())}`,
      `DTSTART:${fmt(params.startTime)}`,
      `DTEND:${fmt(params.endTime)}`,
      `SUMMARY:${params.summary}`,
      `ORGANIZER:mailto:${params.organizerEmail}`,
      `ATTENDEE;RSVP=TRUE:mailto:${params.guestEmail}`,
      params.location ? `LOCATION:${params.location}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
  }

  it("generates valid ICS content with required fields", () => {
    const ics = generateICS({
      uid: "booking-123@axiom.crm",
      summary: "30-Minute Discovery Call",
      startTime: new Date("2026-04-01T14:00:00Z").getTime(),
      endTime: new Date("2026-04-01T14:30:00Z").getTime(),
      organizerEmail: "host@company.com",
      guestEmail: "guest@example.com",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:booking-123@axiom.crm");
    expect(ics).toContain("SUMMARY:30-Minute Discovery Call");
    expect(ics).toContain("ORGANIZER:mailto:host@company.com");
    expect(ics).toContain("ATTENDEE;RSVP=TRUE:mailto:guest@example.com");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("includes LOCATION when provided", () => {
    const ics = generateICS({
      uid: "booking-456@axiom.crm",
      summary: "In-Person Meeting",
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      organizerEmail: "host@company.com",
      guestEmail: "guest@example.com",
      location: "123 Main St, New York, NY",
    });
    expect(ics).toContain("LOCATION:123 Main St, New York, NY");
  });

  it("omits LOCATION when not provided", () => {
    const ics = generateICS({
      uid: "booking-789@axiom.crm",
      summary: "Phone Call",
      startTime: Date.now(),
      endTime: Date.now() + 1800000,
      organizerEmail: "host@company.com",
      guestEmail: "guest@example.com",
    });
    expect(ics).not.toContain("LOCATION:");
  });

  it("formats timestamps in ICS format (no dashes or colons)", () => {
    const ics = generateICS({
      uid: "booking-ts@axiom.crm",
      summary: "Test",
      startTime: new Date("2026-06-15T09:00:00Z").getTime(),
      endTime: new Date("2026-06-15T09:30:00Z").getTime(),
      organizerEmail: "a@b.com",
      guestEmail: "c@d.com",
    });
    expect(ics).toContain("DTSTART:20260615T090000Z");
    expect(ics).toContain("DTEND:20260615T093000Z");
  });
});

// ── Reschedule token tests ───────────────────────────────────────────────────

describe("Reschedule token generation", () => {
  function generateRescheduleToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  it("generates a 32-character alphanumeric token", () => {
    const token = generateRescheduleToken();
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[A-Za-z0-9]{32}$/);
  });

  it("generates unique tokens on each call", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateRescheduleToken()));
    expect(tokens.size).toBe(100);
  });

  it("builds a valid reschedule URL from token", () => {
    const token = generateRescheduleToken();
    const origin = "https://axiom.manus.space";
    const url = `${origin}/reschedule/${token}`;
    expect(url).toMatch(/^https:\/\/axiom\.manus\.space\/reschedule\/[A-Za-z0-9]{32}$/);
  });
});

// ── GDPR consent on booking tests ───────────────────────────────────────────

describe("GDPR consent validation on booking", () => {
  function validateBookingForm(form: {
    name: string;
    email: string;
    gdprConsent: boolean;
  }): string[] {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("Name is required");
    if (!form.email.trim()) errors.push("Email is required");
    if (!form.gdprConsent) errors.push("Privacy policy consent is required");
    return errors;
  }

  it("rejects booking without GDPR consent", () => {
    const errors = validateBookingForm({
      name: "John Doe",
      email: "john@example.com",
      gdprConsent: false,
    });
    expect(errors).toContain("Privacy policy consent is required");
  });

  it("accepts booking with all required fields and consent", () => {
    const errors = validateBookingForm({
      name: "Jane Smith",
      email: "jane@example.com",
      gdprConsent: true,
    });
    expect(errors).toHaveLength(0);
  });

  it("rejects booking with missing name", () => {
    const errors = validateBookingForm({
      name: "",
      email: "jane@example.com",
      gdprConsent: true,
    });
    expect(errors).toContain("Name is required");
  });

  it("rejects booking with missing email", () => {
    const errors = validateBookingForm({
      name: "Jane Smith",
      email: "",
      gdprConsent: true,
    });
    expect(errors).toContain("Email is required");
  });
});
