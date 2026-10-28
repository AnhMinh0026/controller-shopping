import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_black" | "filled_blue";
      size?: "large" | "medium" | "small";
      shape?: "pill" | "rectangular";
      width?: number;
      text?: "signin_with" | "signup_with" | "continue_with";
    },
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID = "google-identity-services-sdk";

export default function GoogleAuthButton({
  onCredential,
  disabled = false,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  const clientId = (
    import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  )?.trim();

  useEffect(() => {
    if (!clientId) return;

    const initGoogleButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            onCredential(response.credential);
          }
        },
      });

      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: containerRef.current.clientWidth || 360,
        text: "continue_with",
      });
    };

    const existingScript = document.getElementById(
      GOOGLE_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      initGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    document.head.appendChild(script);
  }, [clientId, onCredential]);

  if (clientId) {
    return (
      <div
        ref={containerRef}
        className={`flex w-full justify-center ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setFallbackMessage(
            "Add VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env to enable live Google OAuth.",
          )
        }
        className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleLogo />
        <span>Continue with Google</span>
      </button>

      {fallbackMessage && (
        <p className="mt-2 text-center text-[11px] leading-relaxed text-amber-300/90">
          {fallbackMessage}
        </p>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-2 3l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.8 8 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.6z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.6l3.3 2.6c.8-2.5 3.1-4.3 5.8-4.3z"
      />
    </svg>
  );
}

