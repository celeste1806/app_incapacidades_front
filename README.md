# Proyecto de Incapacidades

Aplicación web desarrollada con React para el manejo de incapacidades.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Requisitos Previos

- **Node.js**: 16.x o superior (recomendado: 18.x LTS o superior)
- **npm**: 8.x o superior (incluido con Node.js)

## Instalación y Ejecución

### Paso 1: Clonar el repositorio

```bash
git clone <URL_DE_TU_REPOSITORIO>
cd "incapacidades froend/incapacidades"
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias listadas en el `package.json`.

### Paso 3: Ejecutar la aplicación

```bash
npm start
```

La aplicación se abrirá automáticamente en [http://localhost:3000](http://localhost:3000) en tu navegador.

**Importante**: Asegúrate de que el backend esté corriendo en `http://localhost:8000` para que las peticiones API funcionen correctamente (el proxy está configurado en `package.json`).

## Dependencias del Proyecto

Este proyecto incluye las siguientes dependencias principales:

### Dependencias de Producción

- **react**: ^19.1.1 - Biblioteca principal de React
- **react-dom**: ^19.1.1 - React DOM para renderizado
- **react-router-dom**: ^6.26.2 - Enrutamiento para aplicaciones React
  - Se configuró el enrutamiento con `BrowserRouter` y una ruta `/register` para la página de registro
- **react-icons**: ^5.5.0 - Biblioteca de iconos populares para React
- **react-scripts**: 5.0.1 - Scripts y configuración de Create React App
- **web-vitals**: ^2.1.4 - Métricas de rendimiento web

### Dependencias de Desarrollo y Testing

- **@testing-library/react**: ^16.3.0 - Utilidades para testing de React
- **@testing-library/jest-dom**: ^6.8.0 - Matchers personalizados para Jest
- **@testing-library/user-event**: ^13.5.0 - Simulación de interacciones del usuario
- **@testing-library/dom**: ^10.4.1 - Utilidades de testing para DOM

### Configuración

- **Proxy**: El proyecto está configurado para hacer proxy de las peticiones a `http://localhost:8000`
  - Esto permite que las peticiones API se redirijan automáticamente al backend

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

### `npm start`

Ejecuta la aplicación en modo desarrollo.\
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para verla.

La página se recargará automáticamente cuando hagas cambios.\
También puedes ver errores de linting en la consola.

**Nota**: Asegúrate de que el backend esté corriendo en `http://localhost:8000` para que las peticiones API funcionen correctamente.

### `npm test`

Ejecuta el corredor de pruebas en modo interactivo.\
Consulta la sección sobre [ejecutar pruebas](https://facebook.github.io/create-react-app/docs/running-tests) para más información.

### `npm run build`

Construye la aplicación para producción en la carpeta `build`.\
Empaqueta React en modo producción y optimiza el build para el mejor rendimiento.

El build está minificado y los nombres de archivo incluyen los hashes.\
¡Tu aplicación está lista para ser desplegada!

Consulta la sección sobre [despliegue](https://facebook.github.io/create-react-app/docs/deployment) para más información.

### `npm run eject`

**Nota: esta es una operación irreversible. Una vez que hagas `eject`, ¡no podrás volver atrás!**

Si no estás satisfecho con las herramientas de build y las opciones de configuración, puedes hacer `eject` en cualquier momento. Este comando eliminará la dependencia única de build de tu proyecto.

En su lugar, copiará todos los archivos de configuración y las dependencias transitivas (webpack, Babel, ESLint, etc.) directamente a tu proyecto para que tengas control total sobre ellos. Todos los comandos excepto `eject` seguirán funcionando, pero apuntarán a los scripts copiados para que puedas modificarlos. En este punto, estarás por tu cuenta.

No tienes que usar nunca `eject`. El conjunto de características curadas es adecuado para despliegues pequeños y medianos, y no deberías sentirte obligado a usar esta característica. Sin embargo, entendemos que esta herramienta no sería útil si no pudieras personalizarla cuando estés listo para ello.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
