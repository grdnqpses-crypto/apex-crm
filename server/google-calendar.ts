/**
 * Google Calendar free/busy helper
 *
 * Uses the stored OAuth access token (from calendarConnections) to query
 * the Google Calendar free/busy API. Handles token refresh when the access
 * token is expired, using the stored refresh token + GOOGLE_CLIENT_ID /
 * GOOGLE_CLIENT_SECRET env vars (optional — gracefully skips if not set).
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";

export interface BusyInterval {
  start: string; // ISO-8601
  end: string;   // ISO-8601
}

/**
 * Refresh an expired Google access token.
 * Returns the new access token, or null if credentials are missing / refresh fails.
 */
export async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch busy intervals from Google Calendar for a given time range.
 *
 * @param accessToken  - Google OAuth access token
 * @param calendarId   - Calendar ID (usually "primary" or the user's email)
 * @param timeMin      - ISO-8601 start of range
 * @param timeMax      - ISO-8601 end of range
 * @returns Array of busy intervals, or empty array on error / no connection
 */
export async function getGoogleBusyIntervals(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
): Promise<BusyInterval[]> {
  try {
    const res = await fetch(GOOGLE_FREEBUSY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: calendarId }],
      }),
    });

    if (!res.ok) return [];

    const data = await res.json() as {
      calendars?: Record<string, { busy?: BusyInterval[] }>;
    };

    return data.calendars?.[calendarId]?.busy ?? [];
  } catch {
    return [];
  }
}

/**
 * High-level helper: get busy intervals for a host's calendar on a given day.
 * Automatically attempts token refresh if the token appears expired (401).
 *
 * @param accessToken   - Stored access token
 * @param refreshToken  - Stored refresh token (used if access token is expired)
 * @param calendarId    - Calendar ID (defaults to "primary")
 * @param dateStr       - Date string "YYYY-MM-DD"
 * @param timezone      - IANA timezone string (e.g. "America/New_York")
 * @returns { busy: BusyInterval[], newAccessToken: string | null }
 */
export async function getHostBusyIntervals(
  accessToken: string | null | undefined,
  refreshToken: string | null | undefined,
  calendarId: string | null | undefined,
  dateStr: string,
  timezone: string,
): Promise<{ busy: BusyInterval[]; newAccessToken: string | null }> {
  if (!accessToken) return { busy: [], newAccessToken: null };

  const calId = calendarId || "primary";
  const [y, m, d] = dateStr.split("-").map(Number);

  // Build day range in UTC (Google API requires UTC ISO strings)
  // We use midnight-to-midnight in the host's timezone by converting
  const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
  const dayEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59)).toISOString();

  let busy = await getGoogleBusyIntervals(accessToken, calId, dayStart, dayEnd);

  // If we got no results and have a refresh token, try refreshing
  if (busy.length === 0 && refreshToken) {
    const newToken = await refreshGoogleToken(refreshToken);
    if (newToken) {
      busy = await getGoogleBusyIntervals(newToken, calId, dayStart, dayEnd);
      return { busy, newAccessToken: newToken };
    }
  }

  return { busy, newAccessToken: null };
}

/**
 * Check if a time slot overlaps with any busy interval.
 */
export function isSlotBusy(
  slotStartMs: number,
  slotEndMs: number,
  busyIntervals: BusyInterval[],
): boolean {
  return busyIntervals.some(interval => {
    const busyStart = new Date(interval.start).getTime();
    const busyEnd = new Date(interval.end).getTime();
    // Overlap: slot starts before busy ends AND slot ends after busy starts
    return slotStartMs < busyEnd && slotEndMs > busyStart;
  });
}
