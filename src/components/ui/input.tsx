import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Input({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 rounded-lg border border-slate-400 bg-white px-3 py-2 text-base text-foreground outline-none selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
