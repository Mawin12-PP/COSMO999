"use client";

// Reusable Global Modal Wrapper with full-screen backdrop blur and viewport centering.
// Uses React Portal to mount at the root DOM level (document.body), escaping any
// CSS transform/overflow/grid constraints of parent containers.
// Features: Full viewport coverage (100vw, 100vh), backdrop-filter: blur(4px),
// body scroll locking, escape key listener, and click-outside dismissal.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface GlobalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabelledby?: string;
  preventClose?: boolean;
}

export function GlobalModal({
  isOpen,
  onClose,
  children,
  ariaLabelledby,
  preventClose = false,
}: GlobalModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Body Scroll Lock: When any modal is open, prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss modal cleanly
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !preventClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, preventClose, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      onClick={(e) => {
        if (e.target === e.currentTarget && !preventClose) {
          onClose();
        }
      }}
      className="fixed inset-0 top-0 left-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      {/* Full-screen Backdrop with blur(4px) covering 100vw, 100vh */}
      <div
        className="fixed inset-0 top-0 left-0 w-screen h-screen bg-black/40 backdrop-blur-[4px] -z-10 transition-opacity"
        style={{
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={() => {
          if (!preventClose) {
            onClose();
          }
        }}
        aria-hidden="true"
      />

      {/* Centered Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md my-auto"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export { GlobalModal as GlobalModalWrapper };
