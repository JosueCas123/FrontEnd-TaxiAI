import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

// Local shadcn/ui adaptation restricted to the shell mobile panel.
function Sheet(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTitle(props: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="sheet-title" {...props} />
}

function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  side?: 'left' | 'right'
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/50"
      />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        aria-describedby={undefined}
        className={cn(
          'fixed inset-y-0 z-50 flex h-svh w-72 max-w-[calc(100vw-2rem)] flex-col bg-sidebar text-sidebar-foreground shadow-xl outline-none',
          side === 'right' ? 'right-0' : 'left-0',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export { Sheet, SheetContent, SheetTitle }