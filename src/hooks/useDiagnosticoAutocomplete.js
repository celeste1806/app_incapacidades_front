import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para manejar el autocompletado de diagnósticos
 */
export const useDiagnosticoAutocomplete = (diagnosticos = []) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDiagnostico, setSelectedDiagnostico] = useState(null);

  // Función para filtrar diagnósticos
  const filterDiagnosticos = useCallback((term) => {
    if (!term || term.length < 1) {
      return [];
    }

    const searchLower = term.toLowerCase();
    
    return diagnosticos.filter(diagnostico => {
      const nombre = (diagnostico.nombre || '').toLowerCase();
      const descripcion = (diagnostico.descripcion || '').toLowerCase();
      
      // Buscar en código (nombre) y descripción
      return nombre.includes(searchLower) || descripcion.includes(searchLower);
    }).slice(0, 10); // Limitar resultados para mejor rendimiento
  }, [diagnosticos]);

  // Efecto para filtrar cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.length >= 1) {
      setIsLoading(true);
      
      // Simular un pequeño delay para mejor UX
      const timeoutId = setTimeout(() => {
        const results = filterDiagnosticos(searchTerm);
        setFilteredResults(results);
        setIsLoading(false);
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredResults([]);
      setIsLoading(false);
    }
  }, [searchTerm, filterDiagnosticos]);

  // Función para buscar diagnósticos por código específico
  const buscarPorCodigo = useCallback((codigo) => {
    const diagnostico = diagnosticos.find(d => 
      (d.nombre || '').toLowerCase() === codigo.toLowerCase()
    );
    return diagnostico || null;
  }, [diagnosticos]);

  // Función para obtener el texto de display de un diagnóstico
  const getDisplayText = useCallback((diagnostico) => {
    if (!diagnostico) return '';
    return diagnostico.nombre || diagnostico.descripcion || '';
  }, []);

  // Función para obtener el texto completo de un diagnóstico
  const getFullText = useCallback((diagnostico) => {
    if (!diagnostico) return '';
    const nombre = diagnostico.nombre || '';
    const descripcion = diagnostico.descripcion || '';
    return `${nombre} - ${descripcion}`;
  }, []);

  // Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilteredResults([]);
    setSelectedDiagnostico(null);
  }, []);

  // Función para seleccionar un diagnóstico
  const selectDiagnostico = useCallback((diagnostico) => {
    setSelectedDiagnostico(diagnostico);
    setSearchTerm(getDisplayText(diagnostico));
    setFilteredResults([]);
  }, [getDisplayText]);

  return {
    searchTerm,
    setSearchTerm,
    filteredResults,
    isLoading,
    selectedDiagnostico,
    setSelectedDiagnostico,
    buscarPorCodigo,
    getDisplayText,
    getFullText,
    clearSearch,
    selectDiagnostico,
    hasResults: filteredResults.length > 0,
    totalDiagnosticos: diagnosticos.length
  };
};

export default useDiagnosticoAutocomplete;
