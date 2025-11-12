import React, { useEffect, useState } from 'react';
import { getRelaciones, getRelacionesPorTipo, createRelacion, deleteRelacion, deleteRelacionByComposite } from '../../services/relacion';
import { getTiposIncapacidad } from '../../services/tipoIncapacidad';
import { getArchivosCatalog } from '../../services/archivos';
import Modal from '../../shared/components/Modal';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';

function RelacionForm({ initialValue, onSubmit, onCancel, submitting, tipos, archivos }) {
  const [form, setForm] = useState(initialValue || { tipo_incapacidad_id: '', archivo_id: '' });
  function handleChange(e) { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="admin-form-grid">
      <div className="admin-form-field">
        <label className="admin-form-label">Tipo de incapacidad</label>
        <select className="admin-form-input" name="tipo_incapacidad_id" value={form.tipo_incapacidad_id} onChange={handleChange} required>
          <option value="">Seleccione</option>
          {tipos.map(t => (
            <option key={t.id_tipo_incapacidad ?? t.id} value={t.id_tipo_incapacidad ?? t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>
      <div className="admin-form-field">
        <label className="admin-form-label">Documento requerido</label>
        <select className="admin-form-input" name="archivo_id" value={form.archivo_id} onChange={handleChange} required>
          <option value="">Seleccione</option>
          {archivos.map(a => (
            <option key={a.id_archivo ?? a.id} value={a.id_archivo ?? a.id}>{a.nombre ?? a.archivo_nombre ?? a.descripcion ?? `Archivo ${a.id}`}</option>
          ))}
        </select>
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn admin-btn-dark" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </form>
  );
}

export default function AdminRelacionPage() {
  const [rows, setRows] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError('');
        const [tiposData, archivosData] = await Promise.all([ getTiposIncapacidad(), getArchivosCatalog() ]);
        setRows([]); // inicialmente sin datos hasta seleccionar tipo
        setTipos(Array.isArray(tiposData) ? tiposData : []);
        setArchivos(Array.isArray(archivosData) ? archivosData : []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function refreshByFiltro(value) {
    setLoading(true); setError('');
    try {
      if (!value) {
        setRows([]); // sin selección => sin datos
      } else if (value === '__ALL__') {
        const lista = await getRelaciones();
        setRows(Array.isArray(lista) ? lista : []);
      } else {
        const lista = await getRelacionesPorTipo(value);
        setRows(Array.isArray(lista) ? lista : []);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function onChangeFiltro(value) {
    setTipoFiltro(value);
    await refreshByFiltro(value);
  }

  async function onCreate(values) {
    setSaving(true); setError('');
    try {
      await createRelacion({
        tipo_incapacidad_id: Number(values.tipo_incapacidad_id),
        archivo_id: Number(values.archivo_id),
      });
      setShowModal(false);
      await refreshByFiltro(tipoFiltro);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function onDelete(rel) {
    const ok = window.confirm('¿Eliminar relación?');
    if (!ok) return;
    setLoading(true); setError('');
    try {
      if (rel.id_relacion || rel.id) {
        await deleteRelacion(rel.id_relacion ?? rel.id);
      } else if (rel.tipo_incapacidad_id && rel.archivo_id) {
        await deleteRelacionByComposite(rel.tipo_incapacidad_id, rel.archivo_id);
      } else {
        throw new Error('Faltan identificadores para eliminar la relación');
      }
      await refreshByFiltro(tipoFiltro);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">RELACIÓN DE DOCUMENTOS</h1>
      <div className="admin-pages-content">
      {error && <div className="admin-error"><h1>RELACIÓN DE DOCUMENTOS</h1><p>{error}</p></div>}
      <div className="admin-filter-container">
        <select className="admin-filter-select" value={tipoFiltro} onChange={(e) => onChangeFiltro(e.target.value)} style={{ width: 320 }}>
          <option value="">Seleccione el tipo</option>
          <option value="__ALL__">Todos los tipos</option>
          {tipos.map(t => (
            <option key={t.id_tipo_incapacidad ?? t.id} value={t.id_tipo_incapacidad ?? t.id}>{t.nombre}</option>
          ))}
        </select>
        <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => setShowModal(true)}>Agregar</button>
      </div>
      {loading ? (<div className="admin-loading"><h1>RELACIÓN DE DOCUMENTOS</h1><p>Cargando...</p></div>) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tipo de Incapacidad</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: 16 }}>Sin datos</td></tr>}
            {rows.map(r => {
              const key = r.id_relacion || r.id || `${r.tipo_incapacidad_id}-${r.archivo_id}`;
              const tipoToShow = r.tipo_incapacidad_nombre ?? r.tipo_incapacidad ?? r.tipo ?? '-';
              const docToShow = r.archivo_nombre ?? r.documento ?? r.archivo ?? '-';
              const canDelete = Boolean((r.id_relacion || r.id) || (r.tipo_incapacidad_id && r.archivo_id));
              return (
                <tr key={key}>
                  <td>{tipoToShow}</td>
                  <td>{docToShow}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      onClick={() => onDelete(r)}
                      disabled={!canDelete}
                      title={!canDelete ? 'No se puede eliminar esta relación desde aquí' : ''}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Modal open={showModal} title={'Agregar relación'} onClose={() => setShowModal(false)}>
        <div className="admin-card">
          <div className="admin-card-header">Agregar relación</div>
          <RelacionForm initialValue={{ tipo_incapacidad_id: tipoFiltro || '' }} onSubmit={onCreate} onCancel={() => setShowModal(false)} submitting={saving} tipos={tipos} archivos={archivos} />
        </div>
      </Modal>
      </div>
    </div>
  );
}


