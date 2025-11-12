import React from 'react';
import PerfilPage from '../PerfilPage';

export default function AdminHomePage() {
  // Reutiliza el mismo formulario de perfil del usuario, permitiendo editar el nombre
  return (
    <PerfilPage
      lockCargo={true}
      lockCorreo={true}
      lockTipoEmpleador={true}
      forceEditNombre={true}
      renderReadOnlyAsText={false}
    />
  );
}


