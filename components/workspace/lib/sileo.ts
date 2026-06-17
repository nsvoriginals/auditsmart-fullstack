// sileo → sonner shim
// The ported Sentinel OS workspace calls `sileo.success({ title, description })`.
// AuditSmart already ships `sonner`, so we map the sileo API onto sonner's `toast`
// instead of pulling in a second toast library / second <Toaster>.
"use client";

import { toast } from "sonner";
import { Toaster as SonnerToaster } from "sonner";

type SileoArgs =
  | string
  | {
      title?: string;
      description?: string;
    };

function normalize(args: SileoArgs): { message: string; description?: string } {
  if (typeof args === "string") return { message: args };
  return { message: args.title ?? "", description: args.description };
}

export const sileo = {
  success: (args: SileoArgs) => {
    const { message, description } = normalize(args);
    return toast.success(message, { description });
  },
  error: (args: SileoArgs) => {
    const { message, description } = normalize(args);
    return toast.error(message, { description });
  },
  warning: (args: SileoArgs) => {
    const { message, description } = normalize(args);
    return toast.warning(message, { description });
  },
  info: (args: SileoArgs) => {
    const { message, description } = normalize(args);
    return toast(message, { description });
  },
  message: (args: SileoArgs) => {
    const { message, description } = normalize(args);
    return toast(message, { description });
  },
};

// Re-export sonner's Toaster so existing `import { Toaster } from "sileo"` keeps working.
export const Toaster = SonnerToaster;

export default sileo;
