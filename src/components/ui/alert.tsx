import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

export function Alert({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn('relative w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-destructive', className)}
      {...props}
    />
  )
}
