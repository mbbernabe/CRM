import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Handshake, 
  BarChart3, 
  Settings,
  ChevronUp,
  LogOut,
  User as UserIcon,
  HelpCircle
} from 'lucide-react';

const Sidebar = ({ activeScreen, onNavigate }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dashboard' },
    { icon: <Users size={20} />, label: 'Contatos', id: 'contacts' },
    { icon: <Building2 size={20} />, label: 'Empresas', id: 'companies' },
    { icon: <Handshake size={20} />, label: 'Negócios', id: 'deals' },
    { icon: <BarChart3 size={20} />, label: 'Relatórios', id: 'reports' },
    { icon: <Settings size={20} />, label: 'Configurações', id: 'settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-placeholder">C</div>
        <span className="logo-text">CRM</span>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeScreen === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="profile-container">
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar">MB</div>
                <div className="user-info">
                  <span className="user-name">Mario Barroso</span>
                  <span className="user-email">mario@tj.rj.gov.br</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item">
                <UserIcon size={16} /> <span>Meu Perfil</span>
              </div>
              <div className="dropdown-item">
                <Settings size={16} /> <span>Configurações</span>
              </div>
              <div className="dropdown-item">
                <HelpCircle size={16} /> <span>Ajuda</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout">
                <LogOut size={16} /> <span>Sair</span>
              </div>
            </div>
          )}
          
          <div 
            className="user-profile" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar">MB</div>
            <div className="user-meta">
              <span className="user-name">Mario Barroso</span>
              <span className="user-role">Administrador</span>
            </div>
            <ChevronUp size={16} className={`chevron ${showProfileMenu ? 'open' : ''}`} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          background: var(--hs-white);
          border-right: 1px solid var(--hs-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          flex-shrink: 0;
          position: relative;
        }

        .sidebar-logo {
          padding: 24px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--hs-border-light);
        }

        .logo-placeholder {
          width: 32px;
          height: 32px;
          background: var(--hs-orange);
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }

        .logo-text {
          font-weight: 700;
          color: var(--hs-text-primary);
          font-size: 18px;
        }

        .sidebar-nav {
          padding: 16px 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--hs-radius);
          color: var(--hs-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: var(--hs-sidebar-hover);
          color: var(--hs-blue);
        }

        .nav-item.active {
          background: var(--hs-sidebar-hover);
          color: var(--hs-blue);
          font-weight: 600;
        }

        .nav-icon { display: flex; align-items: center; }

        .sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid var(--hs-border-light);
          position: relative;
        }

        .profile-container { position: relative; }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: var(--hs-radius);
          cursor: pointer;
          transition: background 0.2s;
        }

        .user-profile:hover { background: var(--hs-sidebar-hover); }

        .avatar {
          width: 32px;
          height: 32px;
          background: var(--hs-blue);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }

        .user-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .user-name { font-size: 13px; font-weight: 600; color: var(--hs-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 11px; color: var(--hs-text-secondary); }
        .chevron { color: var(--hs-text-secondary); transition: transform 0.2s; }
        .chevron.open { transform: rotate(180deg); }

        .profile-dropdown {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--hs-border);
          border-radius: var(--hs-radius);
          box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
          margin-bottom: 8px;
          padding: 8px;
          z-index: 100;
          min-width: 200px;
        }

        .dropdown-header { display: flex; align-items: center; gap: 10px; padding: 12px 8px; }
        .user-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .user-email { font-size: 11px; color: var(--hs-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dropdown-divider { height: 1px; background: var(--hs-border-light); margin: 8px 0; }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--hs-text-secondary);
          border-radius: var(--hs-radius);
          cursor: pointer;
        }

        .dropdown-item:hover { background: var(--hs-sidebar-hover); color: var(--hs-blue); }
        .dropdown-item.logout { color: #dc2626; }
        .dropdown-item.logout:hover { background: #fef2f2; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
