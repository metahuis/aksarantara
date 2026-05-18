'use client';

/**
 * Project-flavored Dialog primitive — thin wrapper over @radix-ui/react-dialog.
 *
 * Radix handles: focus trap, ESC to dismiss, click-outside, ARIA roles, body scroll lock.
 * We supply: token-driven styling, plain-CSS data-state animations, mobile-safe sizing.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent title="Hapus peran?" description="Pengguna akan kehilangan akses.">
 *       <DialogFooter>
 *         <DialogClose asChild>
 *           <button className="btn-ghost sm">Batal</button>
 *         </DialogClose>
 *         <button className="btn-primary sm akr-btn-destructive" onClick={onConfirm}>
 *           Hapus
 *         </button>
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 */

import * as RDialog from '@radix-ui/react-dialog';

export function Dialog({ open, onOpenChange, children }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RDialog.Root>
  );
}

export function DialogTrigger({ children, asChild = true }) {
  return <RDialog.Trigger asChild={asChild}>{children}</RDialog.Trigger>;
}

export function DialogContent({ children, title, description, size = 'sm' }) {
  return (
    <RDialog.Portal>
      <RDialog.Overlay className="akr-dialog-backdrop" />
      <RDialog.Content className={`akr-dialog akr-dialog-${size}`}>
        {title && (
          <RDialog.Title className="akr-dialog-title">{title}</RDialog.Title>
        )}
        {description ? (
          <RDialog.Description className="akr-dialog-desc">{description}</RDialog.Description>
        ) : (
          // Radix warns if Description is missing — provide a visually-hidden fallback.
          <RDialog.Description className="akr-sr-only">{title || 'Dialog'}</RDialog.Description>
        )}
        <div className="akr-dialog-body">{children}</div>
      </RDialog.Content>
    </RDialog.Portal>
  );
}

export function DialogFooter({ children }) {
  return <div className="akr-dialog-footer">{children}</div>;
}

export function DialogClose({ children, asChild = true }) {
  return <RDialog.Close asChild={asChild}>{children}</RDialog.Close>;
}
