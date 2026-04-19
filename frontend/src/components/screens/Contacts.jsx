import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import GenericBoard from '../common/GenericBoard';
import DynamicFormField from '../common/DynamicFormField';
import { formatters } from '../../utils/formatters';
import { 
  Building2, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Upload
} from 'lucide-react';
import MassImportModal from '../common/MassImportModal';
import './Contacts.css';

const Contacts = () => {
  const { addToast } = useToast();
  return <ContactsInner addToast={addToast} />;
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
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState(null);
  
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
    stage_id: null,
    properties: {},
    company_ids: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const fetchPipelines = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/pipelines/');
      if (response.ok) {
        const data = await response.json();
        const contactPipelines = data.filter(p => p.entity_type === 'contact');
        setPipelines(contactPipelines);
        if (contactPipelines.length > 0 && !activePipelineId) {
          setActivePipelineId(contactPipelines[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar pipelines:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchContacts(), fetchProperties(), fetchCompaniesList(), fetchPipelines()]);
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
      stage_id: activePipeline?.stages[0]?.id || null,
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
      stage_id: contact.stage_id,
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

  const handleMoveContact = async (contactId, stageId) => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/pipelines/move', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'contact',
          entity_id: contactId,
          stage_id: stageId
        })
      });
      if (!response.ok) throw new Error('Falha ao mover contato');
      
      // Atualização otimista na UI
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, stage_id: stageId } : c));
      addToast('Contato movido com sucesso');
    } catch (err) {
      addToast(err.message, 'error');
      fetchContacts(); // Reverte em caso de erro
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

  const activePipeline = useMemo(() => {
    return pipelines.find(p => p.id === activePipelineId);
  }, [pipelines, activePipelineId]);

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
    </div>
  );

  return (
    <div className="contacts-container">
      <div className="table-header flex-column-mobile">
        <div className="header-actions flex-wrap">
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
          
          <div className="view-toggle">
             <button 
               className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
               onClick={() => setViewMode('list')}
               title="Ver em Lista"
             >
               <ListIcon size={16} />
             </button>
             <button 
               className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
               onClick={() => setViewMode('board')}
               title="Ver em Quadro (Kanban)"
             >
               <LayoutGrid size={16} />
             </button>
          </div>

          {viewMode === 'board' && pipelines.length > 1 && (
            <select 
              className="hs-select pipeline-select"
              value={activePipelineId}
              onChange={(e) => setActivePipelineId(parseInt(e.target.value))}
            >
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
            <button className="hs-button-secondary" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} />
              Importar
            </button>
            <button className="hs-button primary" onClick={handleOpenCreateModal}>
          + Criar Contato
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="hs-scroll-x">
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
                        <MoreHorizontal size={16} />
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
      ) : (
        <GenericBoard 
          pipeline={activePipeline}
          items={filteredContacts}
          entityType="contact"
          onMove={handleMoveContact}
        />
      )}

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
                    onChange={e => setFormData({...formData, phone: formatters.phone(e.target.value)})}
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
                <div className="form-group">
                  <label className="hs-label">Estágio na Pipeline</label>
                  <select 
                    className="hs-select"
                    value={formData.stage_id || ''}
                    onChange={e => setFormData({...formData, stage_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">Nenhum</option>
                    {pipelines.map(p => (
                      <optgroup key={p.id} label={p.name}>
                        {p.stages.sort((a,b) => a.order - b.order).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    ))}
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
                    {groupedProperties[group].map(prop => (
                      <DynamicFormField 
                        key={prop.name}
                        prop={prop}
                        value={formData.properties[prop.name] || ''}
                        onChange={handlePropertyChange}
                      />
                    ))}
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

      {isImportModalOpen && (
        <MassImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          entityType="contact"
          onComplete={fetchContacts}
        />
      )}
    </div>
  );
};

export default Contacts;
