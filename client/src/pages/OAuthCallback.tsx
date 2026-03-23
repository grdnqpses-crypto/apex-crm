/**
 * OAuthCallback.tsx
 *
 * This page is the redirect_uri for OAuth flows (Salesforce, Zoho, Keap, Constant Contact).
 * It extracts the authorization code from the URL, posts it to the parent window,
 * and closes itself.
 *
 * URL format: /oauth-callback?code=XXX&state=crm_name
 */

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function OAuthCallback() {
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing authorization...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state"); // Contains the CRM name
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || error || "Authorization was denied.");
      // Notify parent of failure
      if (window.opener) {
        window.opener.postMessage(
          { type: "axiom_oauth_callback", error, errorDescription },
          window.location.origin
        );
      }
      // Close after showing the error briefly
      setTimeout(() => window.close(), 3000);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received. Please try again.");
      setTimeout(() => window.close(), 3000);
      return;
    }

    // Success — send the code to the parent window
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "axiom_oauth_callback",
          code,
          crm: state || "unknown",
        },
        window.location.origin
      );
      setStatus("success");
      setMessage("Authorization successful! Closing window...");
      setTimeout(() => window.close(), 1500);
    } else {
      // No opener — user navigated directly or popup was blocked
      setStatus("error");
      setMessage("This page should only be opened as a popup. Please return to the migration wizard.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Connecting...</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Connected!</h1>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Authorization Failed</h1>
            <p className="text-sm text-gray-500">{message}</p>
            <button
              onClick={() => window.close()}
              className="text-sm text-orange-600 hover:underline"
            >
              Close this window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
