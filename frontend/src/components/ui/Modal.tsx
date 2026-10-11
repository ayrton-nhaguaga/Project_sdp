import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Modal({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      if (!busyRef.current) close.current();
    };
    element.addEventListener('cancel', cancel);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.removeEventListener('cancel', cancel);
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog ref={dialog} className="modal" aria-labelledby="modal-title">
      <div className="modal-heading">
        <div>
          <span className="eyebrow">CLOUDEXPENSE</span>
          <h2 id="modal-title">{title}</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
