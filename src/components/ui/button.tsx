import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

// Adapted from shadcn/ui: native buttons only, without Slot or unused variants.
export function Button({ className = '', variant = 'default', ...props }: ComponentProps<'button'> & { variant?: 'default' | 'ghost' }) {
  return (
    <button
      data-slot="button"
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
        variant === 'default' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-ink-950 hover:bg-slate-100',
        className,
      )}
      {...props}
    />
  )
}
