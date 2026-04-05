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
  HelpCircle,
  Shield,
  Globe,
  Palette,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeScreen, onNavigate }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ 'settings-group': true });
  const { user, workspace, logout } = useAuth();
  
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dashboard' },
    { icon: <Users size={20} />, label: 'Contatos', id: 'contacts' },
    { icon: <Building2 size={20} />, label: 'Empresas', id: 'companies' },
    { icon: <Handshake size={20} />, label: 'Negócios', id: 'deals' },
    { icon: <BarChart3 size={20} />, label: 'Relatórios', id: 'reports' },
  ];

  const configGroup = {
    icon: <Settings size={20} />,
    label: 'Configuração',
    id: 'settings-group',
    children: [
      { label: 'Propriedades', id: 'settings' },
      { label: 'Pipelines', id: 'pipeline-settings' },
    ]
  };

  const isPowerUser = user?.role === 'superadmin' || user?.role === 'admin';

  if (isPowerUser) {
    configGroup.children.push({ label: 'Área de Trabalho', id: 'workspace-settings' });
    
    if (user?.role === 'superadmin') {
      configGroup.children.push({ label: 'E-mail (SMTP)', id: 'system-settings' });
    }
    
    menuItems.push(configGroup);
    
    if (user?.role === 'superadmin') {
      menuItems.push({ icon: <Shield size={20} />, label: 'Administração', id: 'admin' });
    }
  } else {
    // For non-admins, if they have access to some config
    menuItems.push(configGroup);
  }

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isChildActive = (item) => {
    return item.children?.some(child => child.id === activeScreen);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        {workspace?.logo_url ? (
          <img src={workspace.logo_url} alt="Logo" className="workspace-logo-img" />
        ) : (
          <div className="logo-placeholder">{workspace?.name?.charAt(0) || 'C'}</div>
        )}
        <span className="logo-text">{workspace?.name || 'CRM'}</span>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-group">
            <div 
              className={`nav-item ${activeScreen === item.id || isChildActive(item) ? 'active' : ''}`}
              onClick={() => {
                if (item.children) {
                  toggleMenu(item.id);
                } else {
                  onNavigate(item.id);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.children && (
                <span className="chevron-icon">
                  {expandedMenus[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </div>
            
            {item.children && expandedMenus[item.id] && (
              <div className="sub-menu">
                {item.children.map(child => (
                  <div 
                    key={child.id}
                    className={`nav-item sub-item ${activeScreen === child.id ? 'active' : ''}`}
                    onClick={() => onNavigate(child.id)}
                  >
                    <span className="nav-label">{child.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="profile-container">
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="avatar">{userInitials}</div>
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-email">{user?.email}</span>
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
              <div className="dropdown-item logout" onClick={logout}>
                <LogOut size={16} /> <span>Sair</span>
              </div>
            </div>
          )}
          
          <div 
            className="user-profile" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar">{userInitials}</div>
            <div className="user-meta">
              <span className="user-name">{user?.name || 'Carregando...'}</span>
              <span className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'Usuário'}</span>
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

        .workspace-logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          border-radius: 4px;
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

        .chevron-icon {
          margin-left: auto;
          display: flex;
          color: var(--hs-text-secondary);
        }

        .sub-menu {
          margin-top: 2px;
          margin-bottom: 8px;
        }

        .sub-item {
          padding-left: 44px;
          margin-bottom: 2px;
          color: var(--hs-text-secondary);
        }

        .sub-item:hover {
          color: var(--hs-blue);
        }

        .sub-item.active {
          background: transparent;
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
