"use client";

import { X } from "lucide-react";

export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
