import React from 'react';
import '../../styles/modal.css';

export default function Modal({ open, title, children, onClose, footer }) {
	if (!open) return null;
	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="modal-title">{title}</h3>
					<button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
				</div>
				<div className="modal-body">
					{children}
				</div>
				{footer && (
					<div className="modal-footer">
						{footer}
					</div>
				)}
			</div>
		</div>
	);
}


