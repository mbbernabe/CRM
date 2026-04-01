import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, User, RefreshCw, Trash2, Edit, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../common/Modal';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [propertyDefinitions, setPropertyDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [selectedContact, setSelectedContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
    properties: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:8000/contacts/');
      if (!response.ok) throw new Error('Falha ao buscar contatos');
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('http://localhost:8000/properties/');
      if (!response.ok) throw new Error('Falha ao buscar definições de propriedades');
      const data = await response.json();
      setPropertyDefinitions(data);
      // Expandir todos os grupos por padrão
      const groups = [...new Set(data.map(p => p.group))];
      setExpandedGroups(['Endereço', 'Documentos', 'E-mails', ...groups]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchContacts(), fetchProperties()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      status: 'active',
      properties: {} 
    });
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact) => {
    setModalType('edit');
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      status: contact.status,
      properties: contact.properties || {}
    });
    setSelectedContact(contact);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenDelete = (contact) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!selectedContact) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:8000/contacts/${selectedContact.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir contato');
      setIsDeleteModalOpen(false);
      fetchContacts();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = modalType === 'create' 
        ? 'http://localhost:8000/contacts/' 
        : `http://localhost:8000/contacts/${selectedContact.id}`;
      
      const response = await fetch(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao salvar contato');
      }

      setIsModalOpen(false);
      fetchContacts();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePropertyChange = (propName, value) => {
    setFormData(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propName]: value
      }
    }));
  };

  const toggleGroup = (group) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  // Agrupar propriedades dinâmicas
  const groupedProperties = propertyDefinitions.reduce((acc, prop) => {
    if (!acc[prop.group]) acc[prop.group] = [];
    acc[prop.group].push(prop);
    return acc;
  }, {});

  if (loading) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando contatos e configurações...</p>
      <style jsx>{`
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: var(--hs-text-secondary); }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="contacts-container">
      <div className="table-header">
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Filtrar contatos..." />
          </div>
          <button className="hs-button-secondary">
            <Filter size={16} />
            Filtros
          </button>
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          + Criar Contato
        </button>
      </div>

      <div className="table-wrapper">
        <table className="hs-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email Adicional</th>
              <th>Status</th>
              <th>Cidade/UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <div className="contact-cell">
                    <div className="avatar">{contact.name ? contact.name[0] : 'U'}</div>
                    <div className="name-stack">
                      <span className="main-name">{contact.name}</span>
                      <span className="sub-email">{contact.email}</span>
                    </div>
                  </div>
                </td>
                <td>{contact.properties?.email_profissional || contact.properties?.email_pessoal || '-'}</td>
                <td>
                  <span className={`status-badge ${contact.status.toLowerCase().replace(' ', '-')}`}>
                    {contact.status === 'active' ? 'Ativo' : 
                     contact.status === 'inactive' ? 'Inativo' : 
                     contact.status === 'prospect' ? 'Em Prospecção' : contact.status}
                  </span>
                </td>
                <td>
                  {contact.properties?.cidade ? `${contact.properties.cidade}${contact.properties.estado ? ' / ' + contact.properties.estado : ''}` : '-'}
                </td>
                <td className="actions-cell">
                  <div className="actions-menu-wrapper">
                    <button 
                      className="icon-button" 
                      onClick={() => setActiveMenu(activeMenu === contact.id ? null : contact.id)}
                    >
                      < MoreHorizontal size={16} />
                    </button>
                    {activeMenu === contact.id && (
                      <div className="dropdown-menu">
                        <button onClick={() => handleOpenEdit(contact)}>
                          <Edit size={14} /> Editar
                        </button>
                        <button onClick={() => handleOpenDelete(contact)} className="delete-btn">
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Novo Contato' : 'Editar Contato'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-sections-container">
            {/* Seção Fixa: Informações Básicas */}
            <div className="form-section">
              <h3 className="section-title">Informações Básicas</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input 
                    type="text" required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="form-group">
                  <label>Email Principal</label>
                  <input 
                    type="email" required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Telefone Principal</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="prospect">Em Prospecção</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Seções Dinâmicas baseadas em PropertyDefinitions */}
            {Object.keys(groupedProperties).map(group => (
              <div key={group} className="form-section dynamic">
                <button 
                  type="button" 
                  className="section-toggle"
                  onClick={() => toggleGroup(group)}
                >
                  {expandedGroups.includes(group) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  {group}
                </button>
                
                {expandedGroups.includes(group) && (
                  <div className="form-grid">
                    {groupedProperties[group].map(prop => {
                      const currentValue = formData.properties[prop.name] || '';
                      
                      const renderField = () => {
                        switch(prop.type) {
                          case 'textarea':
                            return (
                              <textarea 
                                value={currentValue}
                                onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                placeholder={`Digite o ${prop.label.toLowerCase()}...`}
                                rows={3}
                              />
                            );
                          case 'boolean':
                            return (
                              <div className="checkbox-wrapper">
                                <label className="hs-checkbox">
                                  <input 
                                    type="checkbox" 
                                    checked={currentValue === 'true' || currentValue === true}
                                    onChange={e => handlePropertyChange(prop.name, e.target.checked ? 'true' : 'false')}
                                  />
                                  <span>Sim</span>
                                </label>
                              </div>
                            );
                          case 'currency':
                            return (
                              <div className="currency-input-wrapper">
                                <span className="currency-prefix">R$</span>
                                <input 
                                  type="number" step="0.01"
                                  value={currentValue}
                                  onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                  placeholder="0,00"
                                />
                              </div>
                            );
                          case 'select':
                            const options = prop.options ? prop.options.split(';') : [];
                            return (
                              <select 
                                value={currentValue}
                                onChange={e => handlePropertyChange(prop.name, e.target.value)}
                              >
                                <option value="">Selecione...</option>
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            );
                          case 'multiselect':
                            const multiOptions = prop.options ? prop.options.split(';') : [];
                            const selectedValues = currentValue ? currentValue.split(',') : [];
                            const toggleValue = (val) => {
                              const newValues = selectedValues.includes(val)
                                ? selectedValues.filter(v => v !== val)
                                : [...selectedValues, val];
                              handlePropertyChange(prop.name, newValues.join(','));
                            };
                            return (
                              <div className="multiselect-group">
                                {multiOptions.map(opt => (
                                  <label key={opt} className="hs-checkbox">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedValues.includes(opt)}
                                      onChange={() => toggleValue(opt)}
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            );
                          default:
                            return (
                              <input 
                                type={prop.type === 'email' ? 'email' : prop.type === 'date' ? 'date' : prop.type === 'url' ? 'url' : 'text'} 
                                value={currentValue}
                                onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                placeholder={`Digite o ${prop.label.toLowerCase()}...`}
                              />
                            );
                        }
                      };

                      return (
                        <div key={prop.name} className={`form-group ${prop.type === 'textarea' || prop.type === 'multiselect' ? 'full-width' : ''}`}>
                          <label>{prop.label}</label>
                          {renderField()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions sticky-footer">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="hs-button-primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Contato'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="delete-confirm-content">
          <div className="alert-icon">
            <AlertCircle size={48} color="#dc2626" />
          </div>
          <p>Você tem certeza que deseja excluir o contato <strong>{selectedContact?.name}</strong>?</p>
          <p className="sub-text">Esta ação não pode ser desfeita.</p>
          
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="hs-button-danger" 
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .contacts-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; height: 100%; }
        .table-header { display: flex; justify-content: space-between; align-items: center; }
        .header-actions { display: flex; gap: 12px; }
        .search-box { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid var(--hs-border); padding: 6px 12px; border-radius: var(--hs-radius); width: 300px; }
        .search-box input { border: none; outline: none; font-size: 14px; width: 100%; }
        
        /* HubSpot Buttons */
        .hs-button-primary { background: var(--hs-orange); color: white; border: none; padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; transition: filter 0.2s; }
        .hs-button-primary:hover { filter: brightness(1.1); }
        .hs-button-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .hs-button-secondary { background: white; border: 1px solid var(--hs-border); padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; }
        .hs-button-secondary:hover { background: #f5f8fa; }

        .hs-button-danger { background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .hs-button-danger:hover { background: #b91c1c; }

        .table-wrapper { background: white; border: 1px solid var(--hs-border-light); border-radius: var(--hs-radius); box-shadow: var(--hs-shadow); overflow: visible; }
        .hs-table { width: 100%; border-collapse: collapse; text-align: left; }
        .hs-table th { background: var(--hs-bg-main); padding: 12px 16px; font-size: 12px; text-transform: uppercase; color: var(--hs-text-secondary); border-bottom: 1px solid var(--hs-border-light); }
        .hs-table td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--hs-border-light); }
        
        .contact-cell { display: flex; align-items: center; gap: 10px; }
        .name-stack { display: flex; flex-direction: column; }
        .main-name { font-weight: 600; color: var(--hs-blue); }
        .sub-email { font-size: 12px; color: var(--hs-text-secondary); }
        .avatar { width: 32px; height: 32px; background: #eaf0f6; color: var(--hs-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; }
        
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }
        .status-badge.prospect { background: #fef9c3; color: #854d0e; }

        .actions-cell { position: relative; }
        .icon-button { background: none; border: none; color: var(--hs-text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; }
        .icon-button:hover { background: #f5f8fa; }
        
        /* Form Sections */
        .form-sections-container { display: flex; flex-direction: column; gap: 24px; padding-bottom: 20px; }
        .form-section { border-bottom: 1px solid #eaf0f6; padding-bottom: 20px; }
        .form-section:last-child { border-bottom: none; }
        .section-title { font-size: 16px; font-weight: 700; color: #2d3e50; margin-bottom: 16px; }
        .section-toggle { width: 100%; display: flex; align-items: center; gap: 8px; background: #f5f8fa; border: none; padding: 10px; font-size: 14px; font-weight: 700; color: #2d3e50; cursor: pointer; text-align: left; border-radius: 4px; margin-bottom: 12px; }
        .section-toggle:hover { background: #eaf0f6; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #516f90; }
        .form-group input, .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #cbd6e2; border-radius: 3px; font-size: 14px; }
        .form-group textarea { font-family: inherit; resize: vertical; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #0091ae; box-shadow: 0 0 0 2px rgba(0, 145, 174, 0.2); }
        
        .hs-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #2d3e50; padding: 4px 0; }
        .hs-checkbox input { width: 16px !important; height: 16px !important; margin: 0; cursor: pointer; }
        
        .currency-input-wrapper { position: relative; display: flex; align-items: center; }
        .currency-prefix { position: absolute; left: 12px; color: #516f90; font-weight: 600; font-size: 14px; }
        .currency-input-wrapper input { padding-left: 35px !important; width: 100%; }
        
        .multiselect-group { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #cbd6e2; }
        
        .sticky-footer { position: sticky; bottom: 0; background: white; padding-top: 16px; border-top: 1px solid #eaf0f6; margin-top: 12px; display: flex; justify-content: flex-end; gap: 12px; }

        /* Actions Menu */
        .actions-menu-wrapper { position: relative; display: flex; justify-content: center; }
        .dropdown-menu { position: absolute; top: 100%; right: 0; background: white; border: 1px solid var(--hs-border); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 10; min-width: 120px; display: flex; flex-direction: column; padding: 4px; gap: 2px; }
        .dropdown-menu button { background: none; border: none; padding: 8px 12px; text-align: left; font-size: 13px; color: var(--hs-text-primary); cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 2px; }
        .dropdown-menu button:hover { background: #f5f8fa; color: var(--hs-blue); }
        .dropdown-menu button.delete-btn:hover { background: #fef2f2; color: #dc2626; }

        /* Delete Confirmation */
        .delete-confirm-content { text-align: center; }
        .alert-icon { margin-bottom: 16px; }
        .delete-confirm-content p { font-size: 16px; color: #2d3e50; margin-bottom: 8px; }
        .sub-text { font-size: 14px; color: #516f90; }
      `}</style>
    </div>
  );
};

export default Contacts;
