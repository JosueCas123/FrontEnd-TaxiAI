import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

// Native label is sufficient for the two explicitly associated login inputs.
export function Label({ className = '', ...props }: ComponentProps<'label'>) {
  return <label data-slot="label" className={cn('mb-2 block text-sm font-medium text-foreground', className)} {...props} />
}
