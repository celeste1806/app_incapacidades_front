import React, { useEffect, useRef } from 'react';
import './ScrollableModal.css';

const ScrollableModal = ({ 
  open, 
  title, 
  children, 
  onClose, 
  className = '',
  maxWidth = '90vw',
  maxHeight = '90vh'
}) => {
  const contentRef = useRef(null);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Enfocar el contenedor scroll al abrir, para que reciba eventos de rueda/teclado
  useEffect(() => {
    if (open && contentRef.current) {
      try { contentRef.current.focus(); } catch (_) {}
    }
  }, [open]);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      className="scrollable-modal-overlay"
    >
      <div 
        className={`scrollable-modal ${className}`}
        style={{ maxWidth, maxHeight }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="scrollable-modal-header">
          <h2 className="scrollable-modal-title">{title}</h2>
          <button 
            className="scrollable-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Contenido del Modal con Scroll */}
        <div 
          ref={contentRef}
          className="scrollable-modal-content"
          tabIndex={0}
        >
          {children}
          {/* espaciador pequeño para asegurar scroll final visible */}
          <div style={{ height: 16 }} />
        </div>

        {/* Footer del Modal (opcional) */}
        <div className="scrollable-modal-footer">
          <div className="scroll-indicator">
            <span className="scroll-hint">Desplázate para ver más contenido</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollableModal;
