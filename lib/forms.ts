export type LoginFormState = {
  error: string | null;
};

export type ScanErrorReason =
  | "invalid"
  | "inactive"
  | "misconfigured"
  | "needs_check_in"
  | "scan_limit"
  | "not_started"
  | "expired"
  | "unauthenticated"
  | "unexpected";

export type ScanFormState =
  | {
      status: "error";
      message: string;
      /** Transient failures (network, server) can be retried safely. */
      retryable: boolean;
      reason: ScanErrorReason;
    }
  | { status: "checked-in"; eventName: string; alreadyCheckedIn: boolean }
  | {
      status: "collected";
      alreadyCollected: boolean;
      eventName: string;
      badge: {
        eventBadgeId: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        room: string | null;
        xpAwarded: number;
      };
      /** Filled when this scan took the attendee to a new global level. */
      levelUp?: {
        level: number;
        name: string;
        minXp: number;
      };
    };
