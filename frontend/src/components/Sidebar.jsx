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
  ChevronRight,
  GitBranch
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ activeScreen, onNavigate, isOpen, onClose }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ 'settings-group': true });
  const [isHovered, setIsHovered] = useState(false);
  const { user, workspace, logout } = useAuth();
  
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

  // ... (menuItems definition stays same)
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dashboard' },
    { icon: <GitBranch size={20} />, label: 'Processos', id: 'pipeline-board' },
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
      { label: 'Tipos de Objetos', id: 'object-types' },
    ]
  };

  const isPowerUser = user?.role === 'superadmin' || user?.role === 'admin';

  if (isPowerUser) {
    configGroup.children = configGroup.children.filter(c => c.id !== 'workspace-settings');
    configGroup.children.push({ label: 'Área de Trabalho', id: 'workspace-settings' });
    
    if (user?.role === 'superadmin') {
      configGroup.children = configGroup.children.filter(c => c.id !== 'system-settings');
      configGroup.children.push({ label: 'E-mail (SMTP)', id: 'system-settings' });
    }
    
    if (!menuItems.find(m => m.id === 'settings-group')) {
      menuItems.push(configGroup);
    }
    
    if (user?.role === 'superadmin' && !menuItems.find(m => m.id === 'admin')) {
      menuItems.push({ icon: <Shield size={20} />, label: 'Administração', id: 'admin' });
    }
  } else {
    if (!menuItems.find(m => m.id === 'settings-group')) {
      menuItems.push(configGroup);
    }
  }

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isChildActive = (item) => {
    return item.children?.some(child => child.id === activeScreen);
  };

  return (
    <aside 
      className={`sidebar ${isOpen ? 'mobile-open' : ''} ${isHovered ? 'expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {workspace?.logo_url ? (
            <img src={workspace.logo_url} alt="Logo" className="workspace-logo-img" />
          ) : (
            <div className="logo-placeholder">{workspace?.name?.charAt(0) || 'C'}</div>
          )}
          <span className="logo-text">{workspace?.name || 'CRM'}</span>
        </div>
        <button className="close-sidebar show-on-mobile" onClick={onClose}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-group">
            <div 
              className={`nav-item ${activeScreen === item.id || isChildActive(item) ? 'active' : ''}`}
              title={item.label}
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
            
            {item.children && (expandedMenus[item.id] || isHovered) && (
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
              <div className="dropdown-item" onClick={() => onNavigate('profile')}>
                <UserIcon size={16} /> <span>Meu Perfil</span>
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

    </aside>
  );
};

export default Sidebar;
