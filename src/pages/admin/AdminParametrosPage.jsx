import React, { useEffect, useState } from 'react';
import { getParametrosPadre, getParametrosHijosByPapa, createParametro, updateParametro, deleteParametro, createParametroHijo, updateParametroHijo, deleteParametroHijo } from '../../services/parametros';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';
import Modal from '../../shared/components/Modal';

function Table({ rows, onView, onEdit, onDelete, onAdd, editingId }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Estado</th>
          <th>
            Acciones
            {onAdd && (
            <button
              onClick={onAdd}
              className="admin-btn admin-btn-success admin-btn-sm"
              style={{ marginLeft: 8 }}
            >
              Agregar
            </button>
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const rowId = r.id_parametro ?? r.id ?? r.idparametro;
          return (
          <tr
            key={rowId}
            className={editingId && editingId === rowId ? 'row-editing' : undefined}
          >
            <td>{r.nombre}</td>
            <td>{r.descripcion ?? r.description ?? ''}</td>
            <td>{(r.estado === false || r.estado === 0) ? 'Inactivo' : 'Activo'}</td>
            <td>
              <button onClick={() => onView(r)} className="admin-btn admin-btn-dark admin-btn-sm" style={{ marginRight: 8 }}>Ver</button>
              <button onClick={() => onEdit(r)} className="admin-btn admin-btn-dark admin-btn-sm" style={{ marginRight: 8 }}>Editar</button>
              <button onClick={() => onDelete(r)} className="admin-btn admin-btn-danger admin-btn-sm">Eliminar</button>
            </td>
          </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={3} className="muted" style={{ padding: 16 }}>Sin datos</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ParametroForm({ initialValue, onCancel, onSubmit, submitting, showEstado = false }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', estado: true });
  useEffect(() => {
    setForm({ nombre: initialValue?.nombre || '', descripcion: initialValue?.descripcion || initialValue?.description || '', estado: (initialValue?.estado ?? true) });
  }, [initialValue]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="admin-form-grid">
      <div className="admin-form-field">
        <label className="admin-form-label">Nombre</label>
        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className="admin-form-input" />
      </div>
      <div className="admin-form-field">
        <label className="admin-form-label">Descripción</label>
        <textarea name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} rows={3} className="admin-form-input admin-form-textarea" />
      </div>
      {showEstado && (
        <div className="admin-form-field">
          <label className="admin-form-label">Estado</label>
          <select className="admin-form-input" name="estado" value={String(form.estado)} onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value === 'true' }))}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      )}
      <div className="admin-form-actions">
        <button type="button" onClick={onCancel} className="admin-btn admin-btn-dark">Cancelar</button>
        <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

export default function AdminParametrosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [editing, setEditing] = useState(null); // objeto a editar
  const [showCreate, setShowCreate] = useState(false); // formulario de creación
  const [saving, setSaving] = useState(false);
  const [childEditing, setChildEditing] = useState(null);
  const [childShowCreate, setChildShowCreate] = useState(false);
  const [childSaving, setChildSaving] = useState(false);
  const [childPage, setChildPage] = useState(1);
  const [childPageSize, setChildPageSize] = useState(7);
  const [childSearch, setChildSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getParametrosPadre();
        if (mounted) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function handleView(row) {
    setSelected(row);
    setChildren([]);
    try {
      const padreId = row.id_parametro ?? row.id ?? row.idparametro;
      console.log('=== DEBUG handleView ===');
      console.log('Parámetro padre seleccionado:', row);
      console.log('Padre ID extraído:', padreId);
      
      const data = await getParametrosHijosByPapa(padreId);
      console.log('Datos recibidos del backend:', data);
      console.log('Total parámetros hijo:', data ? data.length : 0);
      
      setChildren(Array.isArray(data) ? data : []);
      setChildSearch('');
    } catch (e) {
      console.error('Error en handleView:', e);
      setChildren([]);
    } finally {
      setShowModal(true);
      setChildPage(1);
    }
  }

  function handleEdit(row) { setEditing(row); setShowCreate(false); setShowParentModal(true); }

  async function handleDelete(row) {
    const id = row.id_parametro ?? row.id ?? row.idparametro;
    const ok = window.confirm('¿Seguro que deseas eliminar este parámetro?');
    if (!ok) return;
    try {
      await deleteParametro(id);
      setRows((prev) => prev.filter((r) => (r.id_parametro ?? r.id ?? r.idparametro) !== id));
      if (selected && (selected.id_parametro ?? selected.id ?? selected.idparametro) === id) {
        setSelected(null);
        setChildren([]);
      }
    } catch (e) {
      alert(e.message);
    }
  }

  async function submitCreate(values) {
    setSaving(true);
    try {
      const payload = { nombre: values.nombre, descripcion: values.descripcion, estado: values.estado };
      const created = await createParametro(payload);
      setRows((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(values) {
    if (!editing) return;
    setSaving(true);
    const id = editing.id_parametro ?? editing.id ?? editing.idparametro;
    try {
      const payload = { nombre: values.nombre, descripcion: values.descripcion, estado: values.estado };
      const updated = await updateParametro(id, payload);
      setRows((prev) => prev.map((r) => ((r.id_parametro ?? r.id ?? r.idparametro) === id ? { ...r, ...updated } : r)));
      if (selected && (selected.id_parametro ?? selected.id ?? selected.idparametro) === id) {
        setSelected((prev) => prev ? { ...prev, ...updated } : prev);
      }
      setEditing(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitChildCreate(values) {
    if (!selected) return;
    setChildSaving(true);
    try {
      const padreId = selected.id_parametro ?? selected.id ?? selected.idparametro;
      
      // Enviar solo parametro_id como espera el backend
      const payload = { 
        parametro_id: padreId, 
        nombre: values.nombre, 
        descripcion: values.descripcion, 
        estado: values.estado 
      };
      
      console.log('Creando parámetro hijo con payload:', payload);
      const created = await createParametroHijo(payload);
      console.log('Parámetro hijo creado:', created);
      
      // Mostrar mensaje de éxito
      alert(`¡Se ha creado un parámetro hijo nuevo: "${created.nombre}"!`);
      
      // Recargar la lista completa de hijos para asegurar que se muestre el nuevo
      const refreshedData = await getParametrosHijosByPapa(padreId);
      setChildren(Array.isArray(refreshedData) ? refreshedData : []);
      setChildShowCreate(false);
    } catch (e) {
      console.error('Error al crear parámetro hijo:', e);
      alert(e.message);
    } finally {
      setChildSaving(false);
    }
  }

  async function submitChildEdit(values) {
    if (!childEditing) return;
    setChildSaving(true);
    const id = childEditing.id_parametrohijo ?? childEditing.id ?? childEditing.idparametrohijo;
    try {
      const payload = { nombre: values.nombre, descripcion: values.descripcion, estado: values.estado };
      const updated = await updateParametroHijo(id, payload);
      setChildren((prev) => prev.map((c) => ((c.id_parametrohijo ?? c.id ?? c.idparametrohijo) === id ? { ...c, ...updated } : c)));
      setChildEditing(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setChildSaving(false);
    }
  }

  async function handleChildDelete(row) {
    const id = row.id_parametrohijo ?? row.id ?? row.idparametrohijo;
    const ok = window.confirm('¿Seguro que deseas eliminar este detalle?');
    if (!ok) return;
    try {
      await deleteParametroHijo(id);
      setChildren((prev) => prev.filter((c) => (c.id_parametrohijo ?? c.id ?? c.idparametrohijo) !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-pages-container">
      <h1 className="admin-pages-title">PARÁMETROS</h1>
      <div className="admin-pages-content">
      {/* El formulario aparece al pulsar Agregar en el header de Acciones o al editar */}
      <Modal
        open={showParentModal && (showCreate || !!editing)}
        title={editing ? 'Editar parámetro' : 'Agregar parámetro'}
        onClose={() => { setShowCreate(false); setEditing(null); setShowParentModal(false); }}
      >
        <div className="admin-card">
          <div className="admin-card-header">{editing ? 'Editar parámetro' : 'Agregar parámetro'}</div>
          <ParametroForm
            initialValue={editing}
            onCancel={() => { setShowCreate(false); setEditing(null); setShowParentModal(false); }}
            onSubmit={editing ? submitEdit : submitCreate}
            submitting={saving}
            showEstado={!!editing}
          />
        </div>
      </Modal>
      {loading && <div className="admin-loading"><h1>PARÁMETROS</h1><p>Cargando...</p></div>}
      {error && <div className="admin-error"><h1>PARÁMETROS</h1><p>{error}</p></div>}
      {!loading && !error && (
        <Table
          rows={rows.filter((r) => {
            const name = String(r?.nombre || '').toLowerCase();
            // Ocultar "Tipo de incapacidad" o variaciones
            return !(name.includes('tipo') && name.includes('incap'));
          })}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => { setShowCreate(true); setEditing(null); setShowParentModal(true); }}
          editingId={editing ? (editing.id_parametro ?? editing.id ?? editing.idparametro) : null}
        />
      )}

      {selected && (
        <Modal
          open={showModal}
          title={`Parámetro: ${selected.nombre}`}
          onClose={() => setShowModal(false)}
          width="920px"
          footer={
            (() => {
              const lowerName = String(selected?.nombre || '').toLowerCase();
              const isTipoEmpleado = lowerName.includes('tipo emple');
              const isRol = /\brol(es)?\b/.test(lowerName);
              if (isTipoEmpleado || isRol) return null;
              return !childShowCreate && !childEditing ? (
                <button className="admin-btn admin-btn-success" onClick={() => { setChildShowCreate(true); setChildEditing(null); }}>
                  Agregar detalle
                </button>
              ) : null;
            })()
          }
        >
          {/* El formulario de detalle ahora se muestra en un modal aparte */}
          {(() => {
            const lowerName = String(selected?.nombre || '').toLowerCase();
            const showSearch = lowerName.includes('cargo') || lowerName.includes('diagnost');
            if (!showSearch) return null;
            return (
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <input
                  type="text"
                  value={childSearch}
                  onChange={(e) => { setChildSearch(e.target.value); setChildPage(1); }}
                  placeholder="🔍 Buscar por nombre o descripción..."
                  className="admin-filter-select"
                  style={{ flex: '1 1 auto', padding: '10px 12px' }}
                />
                {childSearch && (
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => { setChildSearch(''); setChildPage(1); }}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            );
          })()}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th style={{ width: '55%' }}>Descripción</th>
                {(() => {
                  const lowerName = String(selected?.nombre || '').toLowerCase();
                  const isTipoEmpleado = lowerName.includes('tipo emple');
                  const isRol = /\brol(es)?\b/.test(lowerName);
                  return (isTipoEmpleado || isRol) ? null : <th>Acciones</th>;
                })()}
              </tr>
            </thead>
            <tbody>
              {children.length === 0 && (
                <tr>
                  {(() => {
                    const lowerName = String(selected?.nombre || '').toLowerCase();
                    const isTipoEmpleado = lowerName.includes('tipo emple');
                    const isRol = /\brol(es)?\b/.test(lowerName);
                    const baseCols = 2 + ((isTipoEmpleado || isRol) ? 0 : 1);
                    return <td colSpan={baseCols} className="muted" style={{ padding: 16 }}>Sin detalles</td>;
                  })()}
                </tr>
              )}
              {(() => {
                const lowerName = String(selected?.nombre || '').toLowerCase();
                const isPaginated = lowerName.includes('cargo') || lowerName.includes('diagnost') || lowerName.includes('servicio');
                const filteredChildren = (() => {
                  if (!childSearch.trim()) return children;
                  const query = childSearch.trim().toLowerCase();
                  return children.filter((c) => {
                    const nombre = String(c.nombre || '').toLowerCase();
                    const descripcion = String(c.descripcion ?? c.description ?? '').toLowerCase();
                    return nombre.includes(query) || descripcion.includes(query);
                  });
                })();
                const totalItems = filteredChildren.length;
                const totalPages = Math.max(1, Math.ceil(totalItems / childPageSize));
                const currentPage = Math.min(childPage, totalPages);
                const start = isPaginated ? (currentPage - 1) * childPageSize : 0;
                const end = isPaginated ? start + childPageSize : undefined;
                const pageItems = isPaginated ? filteredChildren.slice(start, end) : filteredChildren;
                return pageItems.map((c) => {
                const childId = c.id_parametrohijo ?? c.id ?? c.idparametrohijo;
                const editingChildId = childEditing ? (childEditing.id_parametrohijo ?? childEditing.id ?? childEditing.idparametrohijo) : null;
                const lowerName = String(selected?.nombre || '').toLowerCase();
                const isTipoEmpleado = lowerName.includes('tipo emple');
                const isRol = /\brol(es)?\b/.test(lowerName);
                return (
                <tr
                  key={childId}
                  className={editingChildId && editingChildId === childId ? 'row-editing' : undefined}
                >
                  <td>{c.nombre}</td>
                  <td>{c.descripcion ?? c.description ?? ''}</td>
                    {(() => {
                      return (isTipoEmpleado || isRol) ? null : (
                        <td>
                          <button onClick={() => setChildEditing(c)} className="admin-btn admin-btn-dark admin-btn-sm" style={{ marginRight: 8 }}>Editar</button>
                          <button onClick={() => handleChildDelete(c)} className="admin-btn admin-btn-danger admin-btn-sm">Eliminar</button>
                        </td>
                      );
                    })()}
                </tr>
                );
                });
              })()}
            </tbody>
          </table>

          {(() => {
            const lowerName = String(selected?.nombre || '').toLowerCase();
            const isPaginated = lowerName.includes('cargo') || lowerName.includes('diagnost') || lowerName.includes('servicio');
            if (!isPaginated) return null;
            const filteredChildren = (() => {
              if (!childSearch.trim()) return children;
              const query = childSearch.trim().toLowerCase();
              return children.filter((c) => {
                const nombre = String(c.nombre || '').toLowerCase();
                const descripcion = String(c.descripcion ?? c.description ?? '').toLowerCase();
                return nombre.includes(query) || descripcion.includes(query);
              });
            })();
            const totalItems = filteredChildren.length;
            const totalPages = Math.max(1, Math.ceil(totalItems / childPageSize));
            const currentPage = Math.min(childPage, totalPages);
            if (totalPages <= 1) return null;

            // construir una paginación compacta: 1 ... (p-2) (p-1) p (p+1) (p+2) ... N
            const visiblePages = [];
            const push = (val) => visiblePages.push(val);
            const addRange = (start, end) => { for (let i = start; i <= end; i++) push(i); };
            const windowSize = 2;
            const startPage = Math.max(2, currentPage - windowSize);
            const endPage = Math.min(totalPages - 1, currentPage + windowSize);

            push(1);
            if (startPage > 2) push('...');
            addRange(startPage, endPage);
            if (endPage < totalPages - 1) push('...');
            if (totalPages > 1) push(totalPages);

            return (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  className="admin-btn admin-btn-dark admin-btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setChildPage((p) => Math.max(1, p - 1))}
                  data-badge=""
                >
                  « Anterior
                </button>
                {visiblePages.map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={`p-${p}`}
                      className={`admin-btn ${p === currentPage ? 'admin-btn-primary' : 'admin-btn-dark'} admin-btn-sm`}
                      onClick={() => setChildPage(p)}
                      style={{ minWidth: 36 }}
                      data-badge=""
                    >
                      <span>{String(p)}</span>
                    </button>
                  ) : (
                    <button
                      key={`e-${idx}`}
                      className="admin-btn admin-btn-dark admin-btn-sm"
                      disabled
                      style={{ minWidth: 36, opacity: 0.7, cursor: 'default' }}
                      data-badge=""
                    >
                      <span>…</span>
                    </button>
                  )
                ))}
                <button
                  className="admin-btn admin-btn-dark admin-btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setChildPage((p) => Math.min(totalPages, p + 1))}
                  data-badge=""
                >
                  Siguiente »
                </button>
              </div>
            );
          })()}
        </Modal>
      )}
      {/* Modal para crear/editar detalle (hijo) */}
      {(childShowCreate || childEditing) && (
        <Modal
          open={childShowCreate || !!childEditing}
          title={childEditing ? 'Editar detalle' : 'Agregar detalle'}
          onClose={() => { setChildShowCreate(false); setChildEditing(null); }}
          width="640px"
        >
          <div className="admin-card">
            <div className="admin-card-header">{childEditing ? 'Editar detalle' : 'Agregar detalle'}</div>
            <ParametroForm
              initialValue={childEditing}
              onCancel={() => { setChildShowCreate(false); setChildEditing(null); }}
              onSubmit={childEditing ? submitChildEdit : submitChildCreate}
              submitting={childSaving}
              showEstado={!!childEditing}
            />
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
}


