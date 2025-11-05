import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import AppLayout from '../shared/components/AppLayout';
import InicioPage from '../pages/InicioPage';
import PerfilPage from '../pages/PerfilPage';
import IncapacidadesPage from '../pages/IncapacidadesPage';
import HistorialPage from '../pages/HistorialPage';
import IncapacidadesRechazadasPage from '../pages/IncapacidadesRechazadasPage';
import AdminLayout from '../shared/components/AdminLayout';
import AdminGuard from '../shared/components/AdminGuard';
import AdminHomePage from '../pages/admin/AdminHomePage';
import AdminHomeInicio from '../pages/admin/Inicio';
import AdminParametrosPage from '../pages/admin/AdminParametrosPage';
import AdminIncapacidadesTramiteDeEps from '../pages/admin/AdminIncapacidadesTramiteDeEps';
import AdminIncapacidadesNuevas from '../pages/admin/AdminIncapacidadesNuevas';
import AdminIncapacidadesRechazadas from '../pages/admin/AdminIncapacidadesRechazadas';
import AdminIncapacidadesHistorial from '../pages/admin/AdminIncapacidadesHistorial';
import AdminEstadisticasIncapacidades from '../pages/admin/AdminEstadisticasIncapacidades';
import AdminRegistrarIncapacidad from '../pages/admin/AdminRegistrarIncapacidad';
import AdminMisIncapacidadesRechazadas from '../pages/admin/AdminMisIncapacidadesRechazadas';
// import AdminIncapacidadesRechazadas from '../pages/admin/AdminIncapacidadesRechazadas';
import AdminUsuariosPage from '../pages/admin/AdminUsuariosPage';
import AdminCrearUsuarios from '../pages/admin/AdminCrearUsuarios';
import ArchivosPage from '../pages/ArchivosPage';
import DescargasPage from '../pages/DescargasPage';
import AdminTiposIncapacidadPage from '../pages/admin/AdminTiposIncapacidadPage';
import AdminRelacionPage from '../pages/admin/AdminRelacionPage';
import PruebaUploadImagen from '../pages/pruebas/PruebaUploadImagen';
import AdminHistorialMisIncapacidades from '../pages/admin/AdminHistorialMisIncapacidades';

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas sin sidebar */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />

      {/* Rutas con layout y sidebar persistente */}
      <Route element={<AppLayout />}>
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/incapacidades" element={<IncapacidadesPage />} />
        <Route path="/historial" element={<HistorialPage />} />
        <Route path="/incapacidades-rechazadas" element={<IncapacidadesRechazadasPage />} />
        <Route path="/archivos" element={<ArchivosPage />} />
        <Route path="/descargas" element={<DescargasPage />} />
        <Route path="/prueba" element={<PruebaUploadImagen />} />
      </Route>

      {/* Admin protegido */}
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
        <Route path="/admin/inicio" element={<AdminHomeInicio />} />
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/parametros" element={<AdminParametrosPage />} />
        <Route path="/admin/tipos-incapacidad" element={<AdminTiposIncapacidadPage />} />
        <Route path="/admin/archivos" element={<ArchivosPage />} />
        <Route path="/admin/relacion" element={<AdminRelacionPage />} />
        <Route path="/admin/incapacidades-tramite-de-eps" element={<AdminIncapacidadesTramiteDeEps />} />
        <Route path="/admin/incapacidades-Nuevas" element={<AdminIncapacidadesNuevas />} />
        <Route path="/admin/incapacidades-rechazadas" element={<AdminIncapacidadesRechazadas />} />
        <Route path="/admin/incapacidades-historial" element={<AdminIncapacidadesHistorial />} />
        <Route path="/admin/estadisticas-incapacidades" element={<AdminEstadisticasIncapacidades />} />
        {/* Página de rechazadas se integra en Incapacidades pendientes */}
        <Route path="/admin/registrar-incapacidad" element={<AdminRegistrarIncapacidad />} />
        <Route path="/admin/mis-incapacidades-rechazadas" element={<AdminMisIncapacidadesRechazadas />} />
        <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        <Route path="/admin/crear-usuarios" element={<AdminCrearUsuarios />} />
        <Route path="/admin/historial-mis-incapacidades" element={<AdminHistorialMisIncapacidades />} />
        <Route path="/admin/descargas" element={<DescargasPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
