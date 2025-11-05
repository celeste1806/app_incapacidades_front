import React from 'react';
import PerfilPage from '../PerfilPage';

export default function AdminHomePage() {
  // Reutiliza el mismo formulario de perfil del usuario
  return <PerfilPage lockCargo={true} lockCorreo={true} lockTipoEmpleador={true} forceEditNombre={false} renderReadOnlyAsText={true} />;
}


