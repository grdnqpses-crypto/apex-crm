import { useEffect } from "react";
import { useSearchParams } from "wouter";

/**
 * Email OAuth Callback Page
 * Handles OAuth callbacks from Gmail and Office 365
 * Redirects to parent window with authorization code
 */
export default function EmailOAuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (error) {
      // Send error to parent window
      window.opener?.postMessage(
        {
          type: "email_oauth_callback",
          error: error,
          errorDescription: searchParams.get("error_description"),
        },
        window.location.origin
      );
      window.close();
      return;
    }

    if (code) {
      // Determine which provider based on the URL or state
      // Gmail uses code, Office 365 uses code
      const provider = window.location.href.includes("gmail")
        ? "gmail"
        : window.location.href.includes("microsoft") || window.location.href.includes("office365")
        ? "office365"
        : "unknown";

      // Send authorization code to parent window
      window.opener?.postMessage(
        {
          type: "email_oauth_callback",
          code: code,
          provider: provider,
          state: state,
        },
        window.location.origin
      );

      // Close popup after a brief delay
      setTimeout(() => window.close(), 500);
    }
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto" />
        <p className="text-gray-600">Completing authorization...</p>
        <p className="text-sm text-gray-500">This window will close automatically</p>
      </div>
    </div>
  );
}
