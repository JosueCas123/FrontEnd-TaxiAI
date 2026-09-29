import type { ComponentProps, Dispatch, ReactNode, RefObject, SetStateAction } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as SlotPrimitive from '@radix-ui/react-slot'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { Sheet, SheetContent, SheetTitle } from './sheet'

export const MOBILE_SIDEBAR_ID = 'menu-panel'

const SIDEBAR_WIDTH = 'w-64'

interface SidebarContextValue {
  openMobile: boolean
  setOpenMobile: Dispatch<SetStateAction<boolean>>
  isMobile: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar debe usarse dentro de <SidebarProvider>')
  return context
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  // Al pasar a escritorio el panel modal desaparece: no debe reapacer abierto.
  useEffect(() => {
    if (!isMobile) setOpenMobile(false)
  }, [isMobile])

  const value = useMemo(
    () => ({ openMobile, setOpenMobile, isMobile, triggerRef }),
    [isMobile, openMobile, triggerRef],
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

interface SidebarProps extends ComponentProps<'aside'> {
  onCloseAutoFocus?: (evento: Event) => void
}

export function Sidebar({ className, children, onCloseAutoFocus, ...props }: SidebarProps) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          id={MOBILE_SIDEBAR_ID}
          side="left"
          onCloseAutoFocus={onCloseAutoFocus}
          className="w-72 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        'sticky top-0 hidden h-svh min-h-0 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex',
        SIDEBAR_WIDTH,
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

export function SidebarTrigger({ className, ...props }: ComponentProps<typeof Button>) {
  const { isMobile, openMobile, setOpenMobile, triggerRef } = useSidebar()

  return (
    <Button
      ref={triggerRef}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={openMobile ? 'Cerrar menú' : 'Abrir menú'}
      aria-expanded={openMobile}
      aria-controls={isMobile ? MOBILE_SIDEBAR_ID : undefined}
      className={cn('lg:hidden', className)}
      onClick={() => setOpenMobile((abierto) => !abierto)}
      {...props}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        className="h-5 w-5"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </Button>
  )
}

export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-header" className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}

export function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3', className)}
      {...props}
    />
  )
}

export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="sidebar-footer" className={cn('flex flex-col gap-2 p-4', className)} {...props} />
}

export function SidebarMenu({ className, ...props }: ComponentProps<'ul'>) {
  return <ul data-slot="sidebar-menu" className={cn('flex min-w-0 flex-col gap-1', className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>) {
  return <li data-slot="sidebar-menu-item" className={cn('min-w-0', className)} {...props} />
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}: ComponentProps<'button'> & { asChild?: boolean; isActive?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Root : 'button'
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'flex min-h-11 w-full items-center gap-2.5 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar [&>svg]:h-5 [&>svg]:w-5 [&>svg]:shrink-0',
        isActive
          ? 'bg-primary font-semibold text-primary-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className,
      )}
      {...props}
    />
  )
}
