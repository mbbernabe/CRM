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
  ChevronLeft,
  GitBranch,
  CheckCircle2,
  Home as HomeIcon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
import WorkspaceSwitcher from './common/WorkspaceSwitcher';

const Sidebar = ({ activeScreen, onNavigate, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ 'settings-group': true });
  const { user, workspace, logout } = useAuth();
  
  const userInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

  // Buscar role no workspace atual
  const currentMembership = user?.memberships?.find(m => m.workspace_id === workspace?.id);
  const currentRole = currentMembership?.role || 'user';
  const isPowerUser = currentRole === 'superadmin' || currentRole === 'admin';

  const menuItems = [
    { icon: <HomeIcon size={20} />, label: 'Início', id: 'home' },
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', id: 'dashboard' },
    { icon: <CheckCircle2 size={20} />, label: 'Minhas Tarefas', id: 'tasks' },
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

  if (isPowerUser) {
    configGroup.children = configGroup.children.filter(c => c.id !== 'workspace-settings');
    configGroup.children.push({ label: 'Área de Trabalho', id: 'workspace-settings' });
    configGroup.children.push({ label: 'Membros & Convites', id: 'workspace-members' });
    
    if (currentRole === 'superadmin') {
      configGroup.children = configGroup.children.filter(c => c.id !== 'system-settings');
      configGroup.children.push({ label: 'E-mail (SMTP)', id: 'system-settings' });
    }
    
    if (!menuItems.find(m => m.id === 'settings-group')) {
      menuItems.push(configGroup);
    }
    
    if (currentRole === 'superadmin') {
      const adminGroup = {
        icon: <Shield size={20} />,
        label: 'Administração',
        id: 'admin-group',
        children: [
          { label: 'Usuários', id: 'admin' },
          { label: 'Biblioteca Global', id: 'admin-templates' },
        ]
      };
      if (!menuItems.find(m => m.id === 'admin-group')) {
        menuItems.push(adminGroup);
      }
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

  const sidebarClasses = [
    'sidebar',
    isOpen ? 'mobile-open' : '',
    isCollapsed ? 'collapsed' : ''
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClasses}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-placeholder">C</div>
          {!isCollapsed && <span className="logo-text">CRM Premium</span>}
        </div>
        
        <button 
          className="collapse-toggle hide-on-mobile" 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <button className="close-sidebar show-on-mobile" onClick={onClose}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-label">Contexto</div>}
        <WorkspaceSwitcher isCollapsed={isCollapsed} />
        <div className="sidebar-divider" />
        
        {menuItems.map((item) => (
          <div key={item.id} className="menu-group">
            <div 
              className={`nav-item ${activeScreen === item.id || isChildActive(item) ? 'active' : ''}`}
              data-tooltip={isCollapsed && !item.children ? item.label : undefined}
              onClick={() => {
                if (item.children) {
                  if (!isCollapsed) toggleMenu(item.id);
                } else {
                  onNavigate(item.id);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
              {item.children && !isCollapsed && (
                <span className="chevron-icon">
                  {expandedMenus[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              )}
            </div>
            
            {item.children && (
              <div className={`sub-menu ${isCollapsed ? 'popout' : ''} ${expandedMenus[item.id] || isCollapsed ? 'visible' : ''}`}>
                {isCollapsed && <div className="popout-header">{item.label}</div>}
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
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="avatar-img-small" />
                ) : (
                  <div className="avatar">{userInitials}</div>
                )}
                <div className="user-info">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-email">{user?.email}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={() => {
                onNavigate('profile');
                setShowProfileMenu(false);
              }}>
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
            data-tooltip={isCollapsed ? user?.name : undefined}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="avatar-img-small" />
            ) : (
              <div className="avatar">{userInitials}</div>
            )}
            {!isCollapsed && (
              <div className="user-meta">
                <span className="user-name">{user?.name || 'Carregando...'}</span>
                <span className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'Usuário'}</span>
              </div>
            )}
            {!isCollapsed && <ChevronUp size={16} className={`chevron ${showProfileMenu ? 'open' : ''}`} />}
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
