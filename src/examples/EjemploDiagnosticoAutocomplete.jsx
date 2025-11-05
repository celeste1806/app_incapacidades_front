import React, { useState } from 'react';
import DiagnosticoAutocomplete from '../components/DiagnosticoAutocomplete';

/**
 * Ejemplo de uso del componente DiagnosticoAutocomplete
 * 
 * Características principales:
 * - Autocompletado inteligente mientras escribes
 * - Búsqueda por código (A000) o descripción
 * - Navegación con teclado (↑↓ Enter Esc)
 * - Botón para limpiar selección
 * - Resaltado de términos coincidentes
 * - Límite de resultados para mejor rendimiento
 * - Responsive y accesible
 */

const EjemploDiagnosticoAutocomplete = () => {
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState('');
  
  // Datos de ejemplo (en tu app vendrán del backend)
  const diagnosticosEjemplo = [
    {
      id_parametrohijo: 1,
      nombre: 'A000',
      descripcion: 'COLERA DEBIDO A VIBRIO CHOLERAE O1, BIOTIPO CHOLERAE'
    },
    {
      id_parametrohijo: 2,
      nombre: 'A010',
      descripcion: 'FIEBRE TIFOIDEA'
    },
    {
      id_parametrohijo: 3,
      nombre: 'A020',
      descripcion: 'ENTERITIS DEBIDA A SALMONELLA'
    },
    {
      id_parametrohijo: 4,
      nombre: 'B001',
      descripcion: 'TUBERCULOSIS PULMONAR'
    },
    {
      id_parametrohijo: 5,
      nombre: 'C001',
      descripcion: 'NEOPLASIA MALIGNA DE ESTOMAGO'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Ejemplo de DiagnosticoAutocomplete</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Diagnóstico:
        </label>
        
        <DiagnosticoAutocomplete
          value={diagnosticoSeleccionado}
          onChange={setDiagnosticoSeleccionado}
          diagnosticos={diagnosticosEjemplo}
          placeholder="Buscar por código (A000) o descripción..."
          required={true}
          showCodeFirst={true}
          maxResults={5}
        />
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h4>Información de uso:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Escribe cualquier carácter</strong> para comenzar la búsqueda</li>
          <li><strong>Busca por código:</strong> A000, A010, B001...</li>
          <li><strong>Busca por descripción:</strong> cólera, fiebre, tuberculosis...</li>
          <li><strong>Navega con teclado:</strong> ↑↓ para moverte, Enter para seleccionar</li>
          <li><strong>Limpia:</strong> Haz clic en la ✕ o borra todo el texto</li>
          <li><strong>Cierra:</strong> Presiona Esc o haz clic fuera</li>
        </ul>
      </div>

      {diagnosticoSeleccionado && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h4>Diagnóstico seleccionado:</h4>
          <p><strong>ID:</strong> {diagnosticoSeleccionado}</p>
          <p><strong>Información:</strong> {diagnosticosEjemplo.find(d => d.id_parametrohijo == diagnosticoSeleccionado)?.descripcion}</p>
        </div>
      )}
    </div>
  );
};

export default EjemploDiagnosticoAutocomplete;

