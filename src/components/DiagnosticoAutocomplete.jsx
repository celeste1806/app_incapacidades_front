import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/autocomplete.css';

const DiagnosticoAutocomplete = ({ 
  value, 
  onChange, 
  diagnosticos = [], 
  placeholder = "Buscar diagnóstico...",
  required = false,
  showCodeFirst = true,
  maxResults = 10
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredDiagnosticos, setFilteredDiagnosticos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Normalización y deduplicación de diagnósticos (evitar repetidos)
  const uniqueDiagnosticos = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const d of diagnosticos || []) {
      const code = String(d?.nombre || '').trim().toLowerCase();
      const desc = String(d?.descripcion || '').trim().toLowerCase();
      const key = `${code}|${desc}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(d);
      }
    }
    return result;
  }, [diagnosticos]);

  // Inicializar el valor del input cuando cambia el value prop
  useEffect(() => {
    if (value) {
      const diagnosticoSeleccionado = uniqueDiagnosticos.find(d => 
        d.id_parametrohijo === value || d.id === value
      );
      if (diagnosticoSeleccionado) {
        const displayText = showCodeFirst 
          ? diagnosticoSeleccionado.nombre || diagnosticoSeleccionado.descripcion || ''
          : diagnosticoSeleccionado.descripcion || diagnosticoSeleccionado.nombre || '';
        setInputValue(displayText);
      }
    } else {
      setInputValue('');
    }
  }, [value, uniqueDiagnosticos, showCodeFirst]);

  // Filtrar diagnósticos basado en el input (solo por diagnóstico/código, no por descripción)
  useEffect(() => {
    if (inputValue.trim().length >= 1) {
      setIsLoading(true);
      
      // Simular delay para mejor UX
      const timeoutId = setTimeout(() => {
        const filtrados = uniqueDiagnosticos
          .filter(diagnostico => {
            const nombre = (diagnostico.nombre || '').toLowerCase();
            const busqueda = inputValue.toLowerCase();
            return nombre.includes(busqueda);
          })
          .slice(0, maxResults);
        
        setFilteredDiagnosticos(filtrados);
        setShowSuggestions(filtrados.length > 0);
        setIsOpen(filtrados.length > 0);
        setIsLoading(false);
      }, 150);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredDiagnosticos([]);
      setShowSuggestions(false);
      setIsOpen(false);
      setIsLoading(false);
    }
    setSelectedIndex(-1);
  }, [inputValue, uniqueDiagnosticos, maxResults]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Si el usuario borra todo, limpiar la selección
    if (newValue === '') {
      onChange('');
    }
  };

  const handleDiagnosticoSelect = (diagnostico) => {
    const displayText = showCodeFirst 
      ? diagnostico.nombre || diagnostico.descripcion || ''
      : diagnostico.descripcion || diagnostico.nombre || '';
    
    setInputValue(displayText);
    onChange(diagnostico.id_parametrohijo || diagnostico.id);
    setIsOpen(false);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDiagnosticos.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredDiagnosticos[selectedIndex]) {
          handleDiagnosticoSelect(filteredDiagnosticos[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    if (inputValue.trim().length >= 1 && filteredDiagnosticos.length > 0) {
      setIsOpen(true);
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay para permitir que el click en las opciones funcione
    setTimeout(() => {
      setIsOpen(false);
      setShowSuggestions(false);
    }, 150);
  };

  const clearSelection = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  const getDiagnosticoDisplay = (diagnostico) => {
    const nombre = diagnostico.nombre || '';
    const descripcion = diagnostico.descripcion || '';
    
    if (showCodeFirst) {
      return {
        primary: nombre,
        secondary: descripcion
      };
    } else {
      return {
        primary: descripcion,
        secondary: nombre
      };
    }
  };

  return (
    <div className="diagnostico-autocomplete">
      <div className="autocomplete-input-container" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`autocomplete-input ${required && !value ? 'required' : ''}`}
          autoComplete="off"
          style={{
            paddingRight: 36,
            borderRadius: 8,
            border: '1px solid #d9d9d9',
            height: 40
          }}
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={clearSelection}
            className="clear-button"
            title="Limpiar selección"
            style={{
              position: 'absolute', right: 28, top: 8, width: 24, height: 24,
              borderRadius: 12, background: '#f5f5f5', border: '1px solid #e8e8e8',
              lineHeight: '20px', cursor: 'pointer'
            }}
          >
            ✕
          </button>
        )}
        
        <div className="search-icon" style={{ position: 'absolute', right: 6, top: 8, opacity: 0.6 }}>
          {isLoading ? '⏳' : '🔍'}
        </div>
      </div>

      {showSuggestions && isOpen && (
        <div
          ref={dropdownRef}
          className="autocomplete-dropdown"
          style={{
            marginTop: 6,
            borderRadius: 10,
            border: '1px solid #e8e8e8',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            background: '#fff',
            overflow: 'hidden'
          }}
        >
          {filteredDiagnosticos.length > 0 ? (
            <>
              <div
                className="results-header"
                style={{
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#595959',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f0f0f0',
                  background: '#fafafa'
                }}
              >
                <span className="results-count">
                  {filteredDiagnosticos.length} resultado{filteredDiagnosticos.length !== 1 ? 's' : ''}
                </span>
                <span className="total-count">
                  de {diagnosticos.length} diagnósticos
                </span>
              </div>
              <ul
                className="suggestions-list"
                style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}
              >
                {filteredDiagnosticos.map((diagnostico, index) => {
                  const display = getDiagnosticoDisplay(diagnostico);
                  return (
                    <li
                      key={diagnostico.id_parametrohijo || diagnostico.id}
                      className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleDiagnosticoSelect(diagnostico)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        background: index === selectedIndex ? '#f0f7ff' : '#fff'
                      }}
                    >
                      <div className="suggestion-content" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="diagnostico-codigo code-badge" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            className="code-chip"
                            style={{
                              background: '#f0f5ff', color: '#2f54eb',
                              border: '1px solid #adc6ff', borderRadius: 6,
                              padding: '2px 6px', fontSize: 12, fontWeight: 600,
                              minWidth: 56, textAlign: 'center'
                            }}
                          >
                            {(diagnostico.nombre || '').trim()}
                          </span>
                          <span className="code-text" style={{ color: '#434343', fontSize: 14 }}>
                            {highlightMatch(display.primary || '', inputValue)}
                          </span>
                        </div>
                      </div>
                      <div className="item-arrow" style={{ float: 'right', opacity: 0.5 }}>↵</div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="no-results" style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>
              <div className="no-results-icon" style={{ fontSize: 22, marginBottom: 6 }}>🔍</div>
              <div className="no-results-text" style={{ fontSize: 14 }}>
                No se encontraron diagnósticos
                <br />
                <small>Intenta con otro término de búsqueda</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones de uso */}
      {inputValue && !isOpen && (
        <div className="usage-hints" style={{ marginTop: 6 }}>
          <small style={{ color: '#8c8c8c' }}>
            💡 Escribe al menos 1 carácter para buscar diagnósticos
            <br />
            Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
          </small>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoAutocomplete;