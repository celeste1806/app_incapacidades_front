import React, { useEffect, useState } from 'react';
import { getArchivosCatalog, createArchivoCatalog, updateArchivoCatalog, deleteArchivo } from '../services/archivos';
import Modal from '../shared/components/Modal';
import '../styles/admin-parametros.css';
import '../styles/admin-pages-blue.css';

function ArchivoForm({ initialValue, onSubmit, onCancel, submitting, showEstado = false }) {
    const [form, setForm] = useState({ nombre: initialValue?.nombre || '', descripcion: initialValue?.descripcion || '', estado: initialValue?.estado ?? true });

	function handleChange(e) {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	}

	function submit(e) {
		e.preventDefault();
		onSubmit({ ...form });
	}

	return (
		<form onSubmit={submit} className="admin-form-grid">
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
				<button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>Guardar</button>
			</div>
		</form>
	);
}

export default function ArchivosPage() {
	const [rows, setRows] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [showModal, setShowModal] = useState(false);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState(null);

	useEffect(() => {
		(async () => {
			setLoading(true); setError('');
			try {
				const data = await getArchivosCatalog();
				setRows(Array.isArray(data) ? data : []);
			} catch (e) { setError(e.message); }
			finally { setLoading(false); }
		})();
	}, []);

async function reloadAll() {
	setLoading(true); setError('');
	try {
		const data = await getArchivosCatalog();
		setRows(Array.isArray(data) ? data : []);
	} catch (e) { setError(e.message); }
	finally { setLoading(false); }
}

async function handleCreate(values) {
    if (!values) return;
		setSaving(true); setError('');
		try {
        await createArchivoCatalog(values);
			setShowModal(false);
        await reloadAll();
		} catch (e) {
			setError(e.message);
		} finally { setSaving(false); }
	}

	async function handleDelete(id) {
		const ok = window.confirm('¿Eliminar archivo?');
		if (!ok) return;
		setLoading(true); setError('');
		try {
			await deleteArchivo(id);
			setRows(prev => prev.filter(a => ((a.id_archivo ?? a.id) !== id)));
		} catch (e) {
			setError(e.message);
		} finally { setLoading(false); }
	}

	return (
		<div className="admin-pages-container">
			<h1 className="admin-pages-title">ARCHIVOS</h1>
			<div className="admin-pages-content">

			{error && <div className="admin-error"><h1>ARCHIVOS</h1><p>{error}</p></div>}
			{loading && <div className="admin-loading"><h1>ARCHIVOS</h1><p>Cargando...</p></div>}

			<table className="admin-table">
				<thead>
					<tr>
						<th>ID</th>
						<th>Nombre</th>
						<th>Descripción</th>
						<th>Estado</th>
						<th>
							Acciones
							<button
								className="admin-btn admin-btn-success admin-btn-sm"
								onClick={() => { setEditing(null); setShowModal(true); }}
								style={{ marginLeft: 8 }}
							>
								Agregar
							</button>
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 && (
						<tr><td colSpan={4} className="muted" style={{ padding: 16 }}>Sin archivos</td></tr>
					)}
                    {rows.map(a => (
                        <tr key={a.id_archivo || a.id} className={(editing && (editing.id_archivo ?? editing.id) === (a.id_archivo ?? a.id)) ? 'row-editing' : undefined}>
							<td>{a.id_archivo ?? a.id}</td>
							<td>{a.nombre}</td>
							<td>{a.descripcion ?? ''}</td>
							<td>{(a.estado === false || a.estado === 0) ? 'Inactivo' : 'Activo'}</td>
                            <td>
                                <button className="admin-btn admin-btn-dark admin-btn-sm" style={{ marginRight: 8 }} onClick={() => { setEditing(a); setShowModal(true); }}>Editar</button>
                                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(a.id_archivo ?? a.id)}>Eliminar</button>
                            </td>
						</tr>
					))}
				</tbody>
			</table>

            <Modal open={showModal} title={editing ? 'Editar archivo' : 'Agregar archivo'} onClose={() => setShowModal(false)}>
                <div className="admin-card">
                    <div className="admin-card-header">{editing ? 'Editar archivo' : 'Agregar archivo'}</div>
                    <ArchivoForm
                        initialValue={editing}
                        onSubmit={async (values) => {
						if (editing) {
							setSaving(true); setError('');
							try {
								const id = editing.id_archivo ?? editing.id;
								await updateArchivoCatalog(id, values);
								setShowModal(false);
								await reloadAll();
							} catch (e) { setError(e.message); }
							finally { setSaving(false); }
						} else {
							await handleCreate(values);
						}
                    }}
                        onCancel={() => setShowModal(false)}
                        submitting={saving}
                        showEstado={!!editing}
                    />
                </div>
			</Modal>
			</div>
		</div>
	);
}


