import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// ─── ICS Calendar Attachment Generator ───────────────────────────────────────
function generateICS(params: {
  uid: string;
  summary: string;
  description: string;
  location: string;
  startTime: number; // UTC ms
  endTime: number;   // UTC ms
  organizerName: string;
  organizerEmail: string;
  guestName: string;
  guestEmail: string;
  cancelUrl: string;
  rescheduleUrl: string;
}): string {
  const fmt = (ms: number) => {
    const d = new Date(ms);
    return d.toISOString().replace(/[-:]/g, "").replace(".000", "");
  };
  const escape = (s: string) => s.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AXIOM CRM//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}@axiomcrm.com`,
    `DTSTAMP:${fmt(Date.now())}Z`,
    `DTSTART:${fmt(params.startTime)}Z`,
    `DTEND:${fmt(params.endTime)}Z`,
    `SUMMARY:${escape(params.summary)}`,
    `DESCRIPTION:${escape(params.description + `\\n\\nCancel: ${params.cancelUrl}\\nReschedule: ${params.rescheduleUrl}`)}`,
    params.location ? `LOCATION:${escape(params.location)}` : "",
    `ORGANIZER;CN=${escape(params.organizerName)}:mailto:${params.organizerEmail}`,
    `ATTENDEE;CN=${escape(params.guestName)};RSVP=TRUE:mailto:${params.guestEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Meeting reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

// ─── Email Transporter ────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpPort === 465,
    auth: ENV.smtpUser
      ? { user: ENV.smtpUser, pass: ENV.smtpPass }
      : undefined,
  });
}

// ─── Send Booking Confirmation ────────────────────────────────────────────────
export async function sendBookingConfirmation(params: {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  meetingName: string;
  startTime: number;
  endTime: number;
  timezone: string;
  location?: string;
  cancelToken: string;
  rescheduleToken: string;
  origin: string;
}): Promise<void> {
  const cancelUrl = `${params.origin}/cancel/${params.cancelToken}`;
  const rescheduleUrl = `${params.origin}/reschedule/${params.rescheduleToken}`;

  const startDate = new Date(params.startTime);
  const endDate = new Date(params.endTime);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: params.timezone,
  });
  const timeStr = `${startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: params.timezone,
  })} – ${endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: params.timezone,
  })} (${params.timezone})`;

  const icsContent = generateICS({
    uid: `booking-${params.bookingId}`,
    summary: `${params.meetingName} with ${params.hostName}`,
    description: `Your meeting with ${params.hostName} has been confirmed.`,
    location: params.location ?? "",
    startTime: params.startTime,
    endTime: params.endTime,
    organizerName: params.hostName,
    organizerEmail: params.hostEmail,
    guestName: params.guestName,
    guestEmail: params.guestEmail,
    cancelUrl,
    rescheduleUrl,
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">✓ You're Booked!</div>
          <div style="color:rgba(255,255,255,.85);margin-top:6px;font-size:15px">Your meeting has been confirmed</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="margin:0 0 24px;color:#374151;font-size:16px">Hi <strong>${params.guestName}</strong>,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px">Your meeting with <strong>${params.hostName}</strong> is confirmed. Here are the details:</p>
          <!-- Meeting card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px">
            <tr><td style="padding:20px 24px">
              <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:16px">${params.meetingName}</div>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px;width:100px">📅 Date</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px">⏰ Time</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500">${timeStr}</td>
                </tr>
                ${params.location ? `<tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px">📍 Location</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500">${params.location}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 0;color:#6b7280;font-size:14px">👤 Host</td>
                  <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:500">${params.hostName}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <!-- Calendar attachment note -->
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px 16px">
            📎 A calendar invite (.ics) is attached to this email. Open it to add this meeting to your calendar.
          </p>
          <!-- Action buttons -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr>
              <td align="center" style="padding-right:8px">
                <a href="${rescheduleUrl}" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;font-weight:600;font-size:14px;border-radius:8px;text-decoration:none">Reschedule</a>
              </td>
              <td align="center" style="padding-left:8px">
                <a href="${cancelUrl}" style="display:inline-block;padding:12px 24px;background:#fff;color:#6b7280;font-weight:600;font-size:14px;border-radius:8px;text-decoration:none;border:1px solid #e5e7eb">Cancel Meeting</a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
            Your data is handled in accordance with our privacy policy.<br>
            You may request deletion at any time by replying to this email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center">
          <span style="color:#9ca3af;font-size:12px">Powered by AXIOM CRM</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: ENV.smtpFrom,
    to: `"${params.guestName}" <${params.guestEmail}>`,
    subject: `✓ Confirmed: ${params.meetingName} with ${params.hostName} on ${dateStr}`,
    html,
    attachments: [
      {
        filename: "meeting.ics",
        content: icsContent,
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });
}

// ─── Send Reschedule Confirmation ─────────────────────────────────────────────
export async function sendRescheduleConfirmation(params: {
  bookingId: number;
  guestName: string;
  guestEmail: string;
  hostName: string;
  meetingName: string;
  newStartTime: number;
  newEndTime: number;
  timezone: string;
  cancelToken: string;
  rescheduleToken: string;
  origin: string;
}): Promise<void> {
  const cancelUrl = `${params.origin}/cancel/${params.cancelToken}`;
  const rescheduleUrl = `${params.origin}/reschedule/${params.rescheduleToken}`;
  const startDate = new Date(params.newStartTime);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: params.timezone,
  });
  const timeStr = `${startDate.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: params.timezone,
  })} (${params.timezone})`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: ENV.smtpFrom,
    to: `"${params.guestName}" <${params.guestEmail}>`,
    subject: `📅 Rescheduled: ${params.meetingName} with ${params.hostName}`,
    html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
  <h2 style="color:#f97316">Meeting Rescheduled</h2>
  <p>Hi <strong>${params.guestName}</strong>,</p>
  <p>Your meeting <strong>${params.meetingName}</strong> with <strong>${params.hostName}</strong> has been rescheduled to:</p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
    <div><strong>📅 ${dateStr}</strong></div>
    <div style="color:#6b7280;margin-top:4px">⏰ ${timeStr}</div>
  </div>
  <p><a href="${rescheduleUrl}" style="color:#f97316">Need to reschedule again?</a> &nbsp;|&nbsp; <a href="${cancelUrl}" style="color:#6b7280">Cancel</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="color:#9ca3af;font-size:12px">Powered by AXIOM CRM</p>
</div>`,
  });
}

// --- Send Host Notification ---
export async function sendHostNotification(params: {
  bookingId: number;
  hostName: string;
  hostEmail: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestNotes?: string;
  meetingName: string;
  startTime: number;
  endTime: number;
  timezone: string;
  location?: string;
  cancelToken: string;
  rescheduleToken: string;
  origin: string;
}): Promise<void> {
  const cancelUrl = params.origin + "/cancel/" + params.cancelToken;
  const rescheduleUrl = params.origin + "/reschedule/" + params.rescheduleToken;
  const startDate = new Date(params.startTime);
  const dateStr = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: params.timezone });
  const timeStr = startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: params.timezone }) + " - " + new Date(params.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: params.timezone }) + " (" + params.timezone + ")";
  const transporter = getTransporter();
  await transporter.sendMail({
    from: ENV.smtpFrom,
    to: params.hostName + " <" + params.hostEmail + ">",
    subject: "New Booking: " + params.meetingName + " with " + params.guestName,
    html: "<div style=font-family:sans-serif;padding:32px><h2 style=color:#f97316>New Meeting Booked</h2><p>Hi " + params.hostName + ",</p><p>" + params.guestName + " (" + params.guestEmail + ") booked: <strong>" + params.meetingName + "</strong></p><p>Date: " + dateStr + "</p><p>Time: " + timeStr + "</p>" + (params.guestPhone ? "<p>Phone: " + params.guestPhone + "</p>" : "") + (params.guestNotes ? "<p>Notes: " + params.guestNotes + "</p>" : "") + "<p><a href=" + cancelUrl + " style=color:#ef4444>Cancel</a> | <a href=" + rescheduleUrl + " style=color:#f97316>Reschedule</a></p></div>",
  });
}

// --- Send Cancellation Notification ---
export async function sendCancellationNotification(params: {
  guestName: string;
  guestEmail: string;
  hostName: string;
  hostEmail: string;
  meetingName: string;
  startTime: number;
  timezone: string;
}): Promise<void> {
  const startDate = new Date(params.startTime);
  const dateStr = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: params.timezone });
  const transporter = getTransporter();
  const recipients = [
    { name: params.guestName, email: params.guestEmail },
    ...(params.hostEmail ? [{ name: params.hostName, email: params.hostEmail }] : []),
  ];
  for (const recipient of recipients) {
    await transporter.sendMail({
      from: ENV.smtpFrom,
      to: recipient.name + " <" + recipient.email + ">",
      subject: "Cancelled: " + params.meetingName + " on " + dateStr,
      html: "<div style=font-family:sans-serif;padding:32px><h2 style=color:#6b7280>Meeting Cancelled</h2><p>Hi " + recipient.name + ",</p><p>Your meeting <strong>" + params.meetingName + "</strong> on " + dateStr + " has been cancelled.</p></div>",
    }).catch((err: any) => console.error("[CancelEmail] Failed:", err));
  }
}
