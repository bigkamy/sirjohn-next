/** Return shape shared by Server Actions that drive a form through useActionState. */
export type FormState =
  | {
      error?: string;
      message?: string;
      fieldErrors?: Partial<Record<string, string[]>>;
      values?: Record<string, string>;
    }
  | undefined;
