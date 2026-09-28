// "use client";

// import { useEffect, type ReactNode } from "react";
// import { X } from "lucide-react";

// export type ModalSize = "sm" | "md" | "lg" | "xl";

// export interface ModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   title?: ReactNode;
//   description?: string;
//   children: ReactNode;
//   footer?: ReactNode;
//   size?: ModalSize;
//   className?: string;
// }

// const sizeClasses: Record<ModalSize, string> = {
//   sm: "max-w-sm",
//   md: "max-w-md",
//   lg: "max-w-lg",
//   xl: "max-w-2xl",
// };

// export function Modal({
//   isOpen,
//   onClose,
//   title,
//   description,
//   children,
//   footer,
//   size = "md",
//   className = "",
// }: ModalProps) {
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape" && isOpen) {
//         onClose();
//       }
//     };
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//       window.addEventListener("keydown", handleKeyDown);
//     }
//     return () => {
//       document.body.style.overflow = "";
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   return (
//     <div className="modal-panel--comportable fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       {/* Modal Dialog Box */}
//       <div
//         className={`relative z-10 w-full rounded-[6px] border border-border bg-surface shadow-lg ${sizeClasses[size]} ${className}`}
//         role="dialog"
//         aria-modal="true"
//       >
//         {/* Header */}
//         {title || description ? (
//           <div className="flex items-start justify-between border-b border-border px-5 py-4">
//             <div>
//               {title ? <h3 className="text-base font-semibold text-ink">{title}</h3> : null}
//               {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
//             </div>
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-sm p-1 text-muted hover:bg-paper hover:text-ink focus:outline-none"
//               aria-label="Close modal"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//         ) : (
//           <button
//             type="button"
//             onClick={onClose}
//             className="absolute right-4 top-4 z-20 rounded-sm p-1 text-muted hover:bg-paper hover:text-ink focus:outline-none"
//             aria-label="Close modal"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         )}

//         {/* Content Body */}
//         <div className="p-5">{children}</div>

//         {/* Footer */}
//         {footer ? (
//           <div className="flex items-center justify-end gap-2 border-t border-border bg-paper/50 px-5 py-3 rounded-b-[6px]">
//             {footer}
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  isComfortable?: boolean; // Prop baru untuk memicu .modal-panel--comfortable
}

// Catatan: Lebar default (md) akan mengikuti max-width 560px dari globals.css
// Lebar comfortable otomatis di 640px. Kelas di bawah ini hanya untuk mem-bypass 
// ukuran jika butuh modal yang sangat kecil atau sangat besar.
const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "", // Dikosongkan agar mengikuti default Layer 13
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
  isComfortable = false,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 1. Backdrop (Memakai class murni Layer 13, tanpa perlu z-50 atau bg-black manual) */}
      <div
        className="modal-backdrop backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Dialog Box (Posisi tengah diatur oleh modal-panel) */}
      <div
        className={`modal-panel border-border-[var(--color-border)] ${isComfortable ? "modal-panel--comfortable" : ""
          } ${sizeClasses[size]} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title || description ? (
          <div className="modal-panel-header flex items-start justify-between border-b border-[var(--color-border)] pb-[var(--space-md)]">
            <div className="flex flex-col gap-[var(--space-2xs)]">
              {title ? (
                <h3 className="text-heading text-ink">{title}</h3>
              ) : null}
              {description ? (
                <p className="text-caption text-muted">{description}</p>
              ) : null}
            </div>

            {/* Tombol Tutup (X) */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-[var(--space-2xs)] text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-[var(--space-md)] top-[var(--space-md)] z-20 rounded-sm p-[var(--space-2xs)] text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Content Body (Tanpa padding manual karena sudah di-handle oleh .modal-panel) */}
        <div className="text-body text-[var(--color-ink)] pt-[var(--space-sm)]">
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="modal-panel-footer border-t border-[var(--color-border)] pt-[var(--space-md)]">
            {footer}
          </div>
        ) : null}
      </div>
    </>
  );
}