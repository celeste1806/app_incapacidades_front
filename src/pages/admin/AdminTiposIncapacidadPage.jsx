import React, { useEffect, useState } from 'react';
import { getTiposIncapacidad, createTipoIncapacidad, updateTipoIncapacidad, deleteTipoIncapacidad } from '../../services/tipoIncapacidad';
import Modal from '../../shared/components/Modal';
import '../../styles/admin-parametros.css';
import '../../styles/admin-pages-blue.css';

function TipoForm({ initialValue, onSubmit, onCancel, submitting, showEstado = false }) {
    const [form, setForm] = useState({ nombre: '', descripcion: '', estado: true });
	useEffect(() => {
		setForm({ nombre: initialValue?.nombre || '', descripcion: initialValue?.descripcion || '', estado: (initialValue?.estado ?? true) });
	}, [initialValue]);

	function handleChange(e) {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	}

	return (
		<form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="admin-form-grid">
			<div className="admin-form-field">
				<label className="admin-form-label">Nombre</label>
				<input className="admin-form-input" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
			</div>
			<div className="admin-form-field">
				<label className="admin-form-label">Descripción</label>
				<textarea className="admin-form-input admin-form-textarea" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} rows={3} />
			</div>
            {showEstado && (
                <div className="admin-form-field">
                    <label className="admin-form-label">Estado</label>
                    <select className="admin-form-input" name="estado" value={String(form.estado)} onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value === 'true' }))}>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                    </select>
                </div>
            )}
			<div className="admin-form-actions">
				<button type="button" className="admin-btn admin-btn-dark" onClick={onCancel}>Cancelar</button>
				<button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
			</div>
		</form>
	);
}

export default function AdminTiposIncapacidadPage() {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let mounted = true;
		(async () => {
			setLoading(true); setError('');
			try {
				const data = await getTiposIncapacidad();
				if (mounted) setRows(Array.isArray(data) ? data : []);
			} catch (e) {
				if (mounted) setError(e.message);
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => { mounted = false; };
	}, []);

	function openCreate() { setEditing(null); setShowModal(true); }
	function openEdit(row) { setEditing(row); setShowModal(true); }

	async function submit(values) {
		setSaving(true);
		try {
			if (editing) {
				const id = editing.id_tipo_incapacidad ?? editing.id;
				const updated = await updateTipoIncapacidad(id, values);
				setRows(prev => prev.map(r => ((r.id_tipo_incapacidad ?? r.id) === id ? { ...r, ...updated } : r)));
			} else {
				const created = await createTipoIncapacidad(values);
				setRows(prev => [created, ...prev]);
			}
			setShowModal(false); setEditing(null);
		} catch (e) {
			alert(e.message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(row) {
		const ok = window.confirm('¿Eliminar tipo de incapacidad?');
		if (!ok) return;
		try {
			const id = row.id_tipo_incapacidad ?? row.id;
			await deleteTipoIncapacidad(id);
			setRows(prev => prev.filter(r => ((r.id_tipo_incapacidad ?? r.id) !== id)));
		} catch (e) {
			alert(e.message);
		}
	}

	return (
		<div className="admin-pages-container">
			<h1 className="admin-pages-title">TIPOS DE INCAPACIDAD</h1>
			<div className="admin-pages-content">
			{error && <div className="admin-error"><h1>TIPOS DE INCAPACIDAD</h1><p>{error}</p></div>}
			{loading && <div className="admin-loading"><h1>TIPOS DE INCAPACIDAD</h1><p>Cargando...</p></div>}
			{!loading && (
				<table className="admin-table">
					<thead>
						<tr>
							<th>Nombre</th>
						<th>Descripción</th>
						<th>Estado</th>
							<th>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
									<span>Acciones</span>
									<button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => { setEditing(null); setShowModal(true); }}>Agregar</button>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 && (
							<tr><td colSpan={4} className="muted" style={{ padding: 16 }}>Sin datos</td></tr>
						)}
                        {rows.map(r => (
                            <tr key={r.id_tipo_incapacidad || r.id} className={(editing && (editing.id_tipo_incapacidad ?? editing.id) === (r.id_tipo_incapacidad ?? r.id)) ? 'row-editing' : undefined}>
								<td>{r.nombre}</td>
							<td>{r.descripcion ?? ''}</td>
							<td>{(r.estado === false || r.estado === 0) ? 'Inactivo' : 'Activo'}</td>
								<td style={{ textAlign: 'center' }}>
									<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
										<button className="admin-btn admin-btn-dark admin-btn-sm" onClick={() => openEdit(r)}>Editar</button>
										<button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(r)}>Eliminar</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

            <Modal open={showModal} title={editing ? 'Editar tipo de incapacidad' : 'Agregar tipo de incapacidad'} onClose={() => { setShowModal(false); setEditing(null); }}>
                <div className="admin-card">
                    <div className="admin-card-header">{editing ? 'Editar tipo de incapacidad' : 'Agregar tipo de incapacidad'}</div>
                    <TipoForm
                        initialValue={editing}
                        onSubmit={submit}
                        onCancel={() => { setShowModal(false); setEditing(null); }}
                        submitting={saving}
                        showEstado={!!editing}
                    />
                </div>
            </Modal>
			</div>
		</div>
	);
}


