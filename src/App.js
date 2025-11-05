import './App.css';
import { Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <AuthProvider>
      <div className="App">
        {isHome && (
          <header className="App-header">
            <h1>Incapacidades</h1>
            <nav style={{ marginTop: 16 }}>
              <Link className="App-link" to="/register">Ir a Registro</Link>
              <Link className="App-link" to="/login" style={{ marginLeft: 16 }}>Iniciar Sesión</Link>
            </nav>
          </header>
        )}
        <main>
          <AppRouter />
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
