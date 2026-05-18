'use client';

/**
 * Project-flavored Toast primitive — thin wrapper over sonner.
 *
 * Sonner handles: queue, stacking, swipe-to-dismiss, ARIA live region.
 * We supply: token-driven theming via CSS vars on [data-sonner-toaster], mobile-safe
 * placement that clears the floating bottom-nav, and a fixed API surface.
 *
 * Usage:
 *   import { toast } from '@/components/ui/Toast';
 *   toast.success('Undangan dikirim');
 *   toast.error('Gagal mengubah peran');
 *   toast.message('Diproses…');
 *   toast.promise(fetchSomething(), { loading: 'Mengirim…', success: 'Terkirim', error: 'Gagal' });
 *
 * <Toaster /> is mounted once in the root layout — do not mount it elsewhere.
 */

import { Toaster as SonnerToaster, toast } from 'sonner';

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: 'calc(102px + env(safe-area-inset-bottom, 0px))' }}
      gap={8}
      visibleToasts={4}
      duration={4000}
      toastOptions={{
        classNames: {
          toast: 'akr-toast',
          title: 'akr-toast-title',
          description: 'akr-toast-desc',
        },
      }}
    />
  );
}
