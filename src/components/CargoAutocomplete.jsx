import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../styles/autocomplete.css';

const CargoAutocomplete = ({ 
  value, 
  onChange, 
  cargos = [], 
  placeholder = "Buscar cargo...",
  required = false,
  maxResults = 10
}) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredCargos, setFilteredCargos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Normalización y deduplicación de cargos (evitar repetidos)
  const uniqueCargos = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const cargo of cargos || []) {
      const nombre = String(cargo?.nombre || '').trim().toLowerCase();
      const key = nombre;
      if (!seen.has(key) && nombre.length > 0) {
        seen.add(key);
        result.push(cargo);
      }
    }
    return result;
  }, [cargos]);

  // Inicializar el valor del input cuando cambia el value prop
  useEffect(() => {
    if (value) {
      const cargoSeleccionado = uniqueCargos.find(cargo => 
        cargo.id_parametrohijo === value || cargo.id === value
      );
      if (cargoSeleccionado) {
        setInputValue(cargoSeleccionado.nombre || '');
      }
    } else {
      setInputValue('');
    }
  }, [value, uniqueCargos]);

  // Filtrar cargos basado en el input
  useEffect(() => {
    if (inputValue.trim().length >= 1) {
      setIsLoading(true);
      
      // Simular delay para mejor UX
      const timeoutId = setTimeout(() => {
        const filtrados = uniqueCargos.filter(cargo => {
          const nombre = (cargo.nombre || '').toLowerCase();
          const busqueda = inputValue.toLowerCase();
          
          return nombre.includes(busqueda);
        }).slice(0, maxResults);
        
        setFilteredCargos(filtrados);
        setShowSuggestions(filtrados.length > 0);
        setIsOpen(filtrados.length > 0);
        setIsLoading(false);
      }, 150);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredCargos([]);
      setShowSuggestions(false);
      setIsOpen(false);
      setIsLoading(false);
    }
    setSelectedIndex(-1);
  }, [inputValue, uniqueCargos, maxResults]);

  const handleInputChange = (e) => {
    const newValue = e.target.value.toUpperCase(); // Convertir a mayúsculas
    setInputValue(newValue);
    
    // Si el usuario borra todo, limpiar la selección
    if (newValue === '') {
      onChange('');
    }
  };

  const handleCargoSelect = (cargo) => {
    setInputValue(cargo.nombre || '');
    onChange(cargo.id_parametrohijo || cargo.id);
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
          prev < filteredCargos.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCargos[selectedIndex]) {
          handleCargoSelect(filteredCargos[selectedIndex]);
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
    if (inputValue.trim().length >= 1 && filteredCargos.length > 0) {
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

  return (
    <div className="cargo-autocomplete">
      <div className="autocomplete-input-container">
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
        />
        
        {inputValue && (
          <button
            type="button"
            onClick={clearSelection}
            className="clear-button"
            title="Limpiar selección"
          >
            ✕
          </button>
        )}
        
        <div className="search-icon">
          {isLoading ? '⏳' : '🔍'}
        </div>
      </div>

      {showSuggestions && isOpen && (
        <div ref={dropdownRef} className="autocomplete-dropdown">
          {filteredCargos.length > 0 ? (
            <>
              <div className="results-header">
                <span className="results-count">
                  {filteredCargos.length} resultado{filteredCargos.length !== 1 ? 's' : ''}
                </span>
                <span className="total-count">
                  de {cargos.length} cargos
                </span>
              </div>
              <ul className="suggestions-list">
                {filteredCargos.map((cargo, index) => (
                  <li
                    key={cargo.id_parametrohijo || cargo.id}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleCargoSelect(cargo)}
                  >
                    <div className="suggestion-content">
                      <div className="cargo-nombre">
                        <span className="cargo-text">
                          {highlightMatch(cargo.nombre || '', inputValue)}
                        </span>
                      </div>
                    </div>
                    <div className="item-arrow">↵</div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <div className="no-results-text">
                No se encontraron cargos
                <br />
                <small>Intenta con otro término de búsqueda</small>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instrucciones de uso */}
      {inputValue && !isOpen && (
        <div className="usage-hints">
          <small>
            💡 Escribe al menos 1 carácter para buscar cargos
            <br />
            Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
          </small>
        </div>
      )}
    </div>
  );
};

export default CargoAutocomplete;
