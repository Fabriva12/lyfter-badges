export type AdminFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export const initialAdminFormState: AdminFormState = { status: "idle" };
