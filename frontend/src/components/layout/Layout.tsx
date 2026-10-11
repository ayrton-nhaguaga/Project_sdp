import { NavLink, Outlet } from 'react-router-dom';
import {
  Cloud,
  LayoutDashboard,
  ArrowLeftRight,
  Shapes,
  ArrowUpRight,
  Layers3,
} from 'lucide-react';
export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand">
          <span className="brand-icon">
            <Cloud size={24} />
          </span>
          <span>
            Cloud<span className="brand-light">Expense</span>
          </span>
        </NavLink>
        <div className="workspace-label">ESPAÇO PESSOAL</div>
        <nav aria-label="Navegação principal">
          <NavLink to="/" end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/transactions">
            <ArrowLeftRight size={20} />
            Transacções
          </NavLink>
          <NavLink to="/categories">
            <Shapes size={20} />
            Categorias
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="cloud-note">
            <span className="cloud-note-icon">
              <Layers3 size={20} />
            </span>
            <strong>
              Pequenas funções.
              <br />
              Grandes possibilidades.
            </strong>
            <p>Uma aplicação construída na cloud, executada sob demanda.</p>
            <NavLink to="/#architecture">
              Conhecer a arquitectura <ArrowUpRight size={15} />
            </NavLink>
          </div>
          <div className="demo-profile">
            <span>CE</span>
            <div>
              <strong>Demonstração académica</strong>
              <small>Ambiente partilhado · MZN</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            As suas finanças, <strong>com clareza.</strong>
          </span>
          <span className="demo-pill">
            <i />
            Modo demonstração
          </span>
        </header>
        <main id="main-content">
          <Outlet />
        </main>
        <footer className="footer">
          <span>CloudExpense © {new Date().getFullYear()}</span>
          <span>Construído com React + Cloudflare</span>
        </footer>
      </div>
    </div>
  );
}
