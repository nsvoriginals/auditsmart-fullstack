// Minimal type declarations for `diff@5` (ships ESM without bundled .d.ts).
// Covers the surface used by lib/workspace/ai.ts (diffLines).
declare module "diff" {
  export interface Change {
    value: string;
    count?: number;
    added?: boolean;
    removed?: boolean;
  }
  export function diffLines(oldStr: string, newStr: string, options?: unknown): Change[];
  export function diffChars(oldStr: string, newStr: string, options?: unknown): Change[];
  export function diffWords(oldStr: string, newStr: string, options?: unknown): Change[];
}
