import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, MoreHorizontal, User, RefreshCw, Trash2, Edit, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from '../common/Modal';
import { ToastProvider } from '../common/Toast';
import { Building2 } from 'lucide-react';

const Contacts = () => {
  return (
    <ToastProvider>
      {(addToast) => <ContactsInner addToast={addToast} />}
    </ToastProvider>
  );
};

const ContactsInner = ({ addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [propertyDefinitions, setPropertyDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanyIdToLink, setSelectedCompanyIdToLink] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    properties: {},
    company_ids: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);

  const fetchContacts = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/contacts/');
      if (!response.ok) throw new Error('Falha ao buscar contatos');
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/properties/entity/contact');
      if (!response.ok) throw new Error('Falha ao buscar definições de propriedades');
      const data = await response.json();
      
      const mappedProps = data.map(link => ({
         ...link.property_def,
         group: link.group ? link.group.name : 'Outros',
         is_required: link.is_required
      }));

      setPropertyDefinitions(mappedProps);
      // Expandir todos os grupos por padrão
      const groups = [...new Set(mappedProps.map(p => p.group))];
      setExpandedGroups(['Endereço', 'Documentos', 'E-mails', ...groups]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompaniesList = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/companies/');
      if (response.ok) {
        const data = await response.json();
        setAllCompanies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchContacts(), fetchProperties(), fetchCompaniesList()]);
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
      properties: {},
      company_ids: []
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
      properties: contact.properties || {},
      company_ids: (contact.companies || []).map(c => c.id)
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
      const response = await fetchWithAuth(`http://localhost:8000/contacts/${selectedContact.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir contato');
      fetchContacts();
      addToast('Contato excluído com sucesso!');
    } catch (err) {
      addToast(err.message, 'error');
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
      
      // Se for edição, o backend atualiza apenas propriedades do contato, 
      // não o array de empresas (que é gerenciado pelas rotas de link/unlink exclusivas).
      // Se for criação, mandamos o array company_ids.
      const payload = { ...formData };
      if (modalType === 'edit') {
         delete payload.company_ids;
      }

      const response = await fetchWithAuth(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao salvar contato');
      }

      setIsModalOpen(false);
      fetchContacts();
      addToast(`Contato ${modalType === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkCompany = async () => {
    if (!selectedCompanyIdToLink || !selectedContact) return;
    setIsLinking(true);
    try {
      const response = await fetchWithAuth(`http://localhost:8000/contacts/${selectedContact.id}/companies/${selectedCompanyIdToLink}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao vincular empresa');
      await fetchContacts();
      
      const updatedResponse = await fetchWithAuth(`http://localhost:8000/contacts/${selectedContact.id}`);
      if (updatedResponse.ok) {
        const updatedContact = await updatedResponse.json();
        setSelectedContact(updatedContact);
      }
      setSelectedCompanyIdToLink('');
      addToast('Empresa vinculada com sucesso!');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkCompany = async (companyId) => {
    if (!selectedContact) return;
    if (!window.confirm('Tem certeza que deseja desvincular esta empresa?')) return;
    try {
      const response = await fetchWithAuth(`http://localhost:8000/contacts/${selectedContact.id}/companies/${companyId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao desvincular empresa');
      await fetchContacts();
      
      const updatedResponse = await fetchWithAuth(`http://localhost:8000/contacts/${selectedContact.id}`);
      if (updatedResponse.ok) {
        const updatedContact = await updatedResponse.json();
        setSelectedContact(updatedContact);
      }
      addToast('Empresa desvinculada.');
    } catch (err) {
      addToast(err.message, 'error');
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

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(term) || 
      contact.email.toLowerCase().includes(term) ||
      (contact.phone && contact.phone.includes(term)) ||
      (contact.companies && contact.companies.some(c => c.name.toLowerCase().includes(term)))
    );
  }, [contacts, searchTerm]);

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
            <input 
              type="text" 
              placeholder="Filtrar contatos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
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
              <th>Empresas Vinculadas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
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
                  {contact.companies && contact.companies.length > 0 ? (
                    <ul className="linked-list-table">
                      {contact.companies.map(c => <li key={c.id}>{c.name}</li>)}
                    </ul>
                  ) : '-'}
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
                  <label className="hs-label">Nome Completo <span className="required-indicator">*</span></label>
                  <input 
                    type="text" className="hs-input" required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Email Principal <span className="required-indicator">*</span></label>
                  <input 
                    type="email" className="hs-input" required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Telefone Principal</label>
                  <input 
                    type="text" className="hs-input"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Status</label>
                  <select 
                    className="hs-select"
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
                                className="hs-input w-full"
                                required={prop.is_required}
                              />
                            );
                          case 'boolean':
                            return (
                              <div className="checkbox-wrapper">
                                <label className="hs-checkbox flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={currentValue === 'true' || currentValue === true}
                                    onChange={e => handlePropertyChange(prop.name, e.target.checked ? 'true' : 'false')}
                                  />
                                  <span className="text-sm">Sim</span>
                                </label>
                              </div>
                            );
                          case 'currency':
                            return (
                              <div className="currency-input-wrapper relative">
                                <span className="currency-prefix absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                <input 
                                  type="number" step="0.01"
                                  className="hs-input w-full pl-10"
                                  value={currentValue}
                                  onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                  placeholder="0,00"
                                  required={prop.is_required}
                                />
                              </div>
                            );
                          case 'select':
                            const options = prop.options ? prop.options.split(';') : [];
                            return (
                              <select 
                                className="hs-select w-full"
                                value={currentValue}
                                onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                required={prop.is_required}
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
                              <div className="multiselect-group flex flex-wrap gap-2">
                                {multiOptions.map(opt => (
                                  <label key={opt} className="hs-checkbox flex items-center gap-2 bg-gray-50 px-2 py-1 rounded">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedValues.includes(opt)}
                                      onChange={() => toggleValue(opt)}
                                    />
                                    <span className="text-sm">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            );
                          default:
                            return (
                              <input 
                                type={prop.type === 'email' ? 'email' : prop.type === 'date' ? 'date' : prop.type === 'url' ? 'url' : 'text'} 
                                className="hs-input w-full"
                                value={currentValue}
                                onChange={e => handlePropertyChange(prop.name, e.target.value)}
                                placeholder={`Digite o ${prop.label.toLowerCase()}...`}
                                required={prop.is_required}
                              />
                            );
                        }
                      };

                      return (
                        <div key={prop.name} className={`hs-form-group ${prop.type === 'textarea' || prop.type === 'multiselect' ? 'full-width' : ''}`}>
                          <label className="hs-label">
                            {prop.label}
                            {prop.is_required && <span className="required-indicator">*</span>}
                          </label>
                          {renderField()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            {modalType === 'create' && (
              <div className="form-section relations">
                <h3 className="section-title">Vincular a Empresas</h3>
                <div className="relations-list">
                  {formData.company_ids.length > 0 ? (
                    formData.company_ids.map(cId => {
                      const comp = allCompanies.find(c => c.id === parseInt(cId));
                      return (
                        <div key={cId} className="relation-item">
                          <div className="relation-info">
                            <Building2 size={16} />
                            <span>{comp?.name || 'Empresa desconhecida'}</span>
                          </div>
                          <button 
                            type="button" 
                            className="unlink-btn" 
                            onClick={() => setFormData(prev => ({...prev, company_ids: prev.company_ids.filter(id => id !== cId)}))}
                          >
                            Remover
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-relations">Nenhuma empresa selecionada para este novo contato.</p>
                  )}
                </div>
                
                <div className="link-action">
                  <select 
                    value={selectedCompanyIdToLink} 
                    onChange={e => setSelectedCompanyIdToLink(e.target.value)}
                    className="link-select"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {allCompanies
                      .filter(c => !formData.company_ids.includes(c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
                  <button 
                    type="button" 
                    className="hs-button-secondary link-btn"
                    onClick={() => {
                       if (selectedCompanyIdToLink) {
                          setFormData(prev => ({...prev, company_ids: [...prev.company_ids, parseInt(selectedCompanyIdToLink)]}));
                          setSelectedCompanyIdToLink('');
                       }
                    }}
                    disabled={!selectedCompanyIdToLink}
                  >
                    Selecionar Empresa
                  </button>
                </div>
              </div>
            )}

            {modalType === 'edit' && selectedContact && (
              <div className="form-section relations">
                <h3 className="section-title">Empresas Vinculadas</h3>
                <div className="relations-list">
                  {selectedContact.companies && selectedContact.companies.length > 0 ? (
                    selectedContact.companies.map(comp => (
                      <div key={comp.id} className="relation-item">
                        <div className="relation-info">
                          <Building2 size={16} />
                          <span>{comp.name}</span>
                        </div>
                        <button 
                          type="button" 
                          className="unlink-btn" 
                          onClick={() => handleUnlinkCompany(comp.id)}
                        >
                          Desvincular
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-relations">Nenhuma empresa vinculada a este contato ainda.</p>
                  )}
                </div>
                
                <div className="link-action">
                  <select 
                    value={selectedCompanyIdToLink} 
                    onChange={e => setSelectedCompanyIdToLink(e.target.value)}
                    className="link-select"
                  >
                    <option value="">Selecione uma empresa para vincular...</option>
                    {allCompanies
                      .filter(c => !(selectedContact.companies || []).some(linked => linked.id === c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
                  <button 
                    type="button" 
                    className="hs-button-secondary link-btn"
                    onClick={handleLinkCompany}
                    disabled={!selectedCompanyIdToLink || isLinking}
                  >
                    {isLinking ? 'Vinculando...' : 'Vincular Empresa'}
                  </button>
                </div>
              </div>
            )}
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
        .hs-table td ul { margin: 0; padding-left: 16px; list-style-type: disc; }
        
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
        
        /* Relationships Section */
        .relations-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .relation-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #eaf0f6; border-radius: 4px; background: #fdfdfd; }
        .relation-info { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--hs-text-primary); }
        .unlink-btn { background: none; border: none; font-size: 12px; color: #dc2626; cursor: pointer; padding: 4px 8px; border-radius: 4px; }
        .unlink-btn:hover { background: #fef2f2; }
        .no-relations { font-size: 13px; color: #516f90; font-style: italic; }
        .link-action { display: flex; gap: 8px; align-items: stretch; }
        .link-select { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #cbd6e2; border-radius: 3px; font-size: 14px; background: white; }
        .link-btn { white-space: nowrap; height: auto; }
        .linked-list-table { list-style-type: none !important; padding: 0 !important; margin: 0 !important; display: flex; flex-direction: column; gap: 4px; }
        .linked-list-table li { display: inline-flex; align-items: center; background: #eaf0f6; color: var(--hs-blue); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; white-space: nowrap;}
        
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
