import React from "react";

interface BrutalistConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const BrutalistConfirmModal: React.FC<BrutalistConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-background border-4 border-foreground p-6 max-w-sm w-full shadow-brutal text-center animate-fade-in text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-heading text-xl uppercase mb-3">{title}</h3>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            className="btn-brutal-secondary px-4 py-2 text-sm shadow-none"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-brutal px-4 py-2 text-sm shadow-none ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : ""
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrutalistConfirmModal;
