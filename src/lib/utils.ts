// Only string classes are needed by the locally reduced shadcn/ui controls.
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
