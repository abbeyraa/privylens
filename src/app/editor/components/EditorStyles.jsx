"use client";

export default function EditorStyles() {
  return (
    <style jsx global>{`
      @keyframes detailFlash {
        0% {
          background-color: #eff6ff;
          border-color: #bfdbfe;
          box-shadow: 0 12px 24px -16px rgba(59, 130, 246, 0.6);
        }
        100% {
          background-color: #ffffff;
          border-color: #e5e5e5;
          box-shadow: none;
        }
      }

      .detail-flash {
        animation: detailFlash 500ms ease-out;
      }

      @keyframes detailSlide {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .detail-content {
        animation: detailSlide 220ms ease-out;
      }

      .detail-title {
        animation: detailFade 200ms ease-out;
      }

      @keyframes detailFade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes groupFlash {
        0% {
          background-color: #dbeafe;
        }
        100% {
          background-color: #f9fafb;
        }
      }

      .group-added {
        animation: groupFlash 700ms ease-out;
      }

      @keyframes toastPop {
        0% {
          opacity: 0;
          transform: translateY(-6px);
        }
        15% {
          opacity: 1;
          transform: translateY(0);
        }
        85% {
          opacity: 1;
          transform: translateY(0);
        }
        100% {
          opacity: 0;
          transform: translateY(-6px);
        }
      }

      .toast-pop {
        animation: toastPop 1.2s ease-out;
      }

      @keyframes toastPopSmooth {
        0% {
          opacity: 0;
          transform: translateY(-2px) scale(0.98);
        }
        60% {
          opacity: 1;
          transform: translateY(0) scale(1.01);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .toast-pop-smooth {
        animation: toastPopSmooth 320ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      @keyframes menuPop {
        from {
          opacity: 0;
          transform: translateY(6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .menu-pop {
        animation: menuPop 160ms ease-out;
      }

      .is-dragging {
        opacity: 0.45;
        transform: scale(0.98);
      }

      .drop-target {
        box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.35);
        background: rgba(59, 130, 246, 0.04);
      }
    `}</style>
  );
}
