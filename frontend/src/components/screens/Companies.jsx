import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import GenericBoard from '../common/GenericBoard';
import { Search, Filter, MoreHorizontal, Building2, RefreshCw, Trash2, Edit, AlertCircle, ChevronDown, ChevronRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import './Companies.css';

const Companies = () => {
  const { addToast } = useToast();
  return <CompaniesInner addToast={addToast} />;
};

const CompaniesInner = ({ addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [propertyDefinitions, setPropertyDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContactIdToLink, setSelectedContactIdToLink] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'
  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState(null);
  
  // Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    status: 'active',
    stage_id: null,
    properties: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);

  const fetchCompanies = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/companies/');
      if (!response.ok) throw new Error('Falha ao buscar empresas');
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/properties/entity/company');
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
      setExpandedGroups(['Informações da Empresa', ...groups]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContactsList = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/contacts/');
      if (response.ok) {
        const data = await response.json();
        setAllContacts(data);
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
        const companyPipelines = data.filter(p => p.entity_type === 'company');
        setPipelines(companyPipelines);
        if (companyPipelines.length > 0 && !activePipelineId) {
          setActivePipelineId(companyPipelines[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar pipelines:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanies(), 
        fetchProperties(), 
        fetchContactsList(), 
        fetchPipelines()
      ]);
    } catch (err) {
      console.error("Erro ao carregar dados de empresas:", err);
      setError("Falha ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setFormData({ 
      name: '', 
      domain: '', 
      status: 'active',
      stage_id: activePipeline?.stages[0]?.id || null,
      properties: {} 
    });
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (company) => {
    setModalType('edit');
    setFormData({
      name: company.name,
      domain: company.domain || '',
      status: company.status,
      stage_id: company.stage_id,
      properties: company.properties || {}
    });
    setSelectedCompany(company);
    setIsModalOpen(true);
    setActiveMenu(null);
  };

  const handleOpenDelete = (company) => {
    setSelectedCompany(company);
    setIsDeleteModalOpen(true);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!selectedCompany) return;
    setIsDeleting(true);
    try {
      const response = await fetchWithAuth(`http://localhost:8000/companies/${selectedCompany.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao excluir empresa');
      fetchCompanies();
      addToast('Empresa excluída com sucesso!');
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
        ? 'http://localhost:8000/companies/' 
        : `http://localhost:8000/companies/${selectedCompany.id}`;
      
      const response = await fetchWithAuth(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao salvar empresa');
      }

      setIsModalOpen(false);
      fetchCompanies();
      addToast(`Empresa ${modalType === 'create' ? 'criada' : 'atualizada'} com sucesso!`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkContact = async () => {
    if (!selectedContactIdToLink || !selectedCompany) return;
    setIsLinking(true);
    try {
      const response = await fetchWithAuth(`http://localhost:8000/companies/${selectedCompany.id}/contacts/${selectedContactIdToLink}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao vincular contato');
      await fetchCompanies();
      
      const updatedResponse = await fetchWithAuth(`http://localhost:8000/companies/${selectedCompany.id}`);
      if (updatedResponse.ok) {
        const updatedCompany = await updatedResponse.json();
        setSelectedCompany(updatedCompany);
      }
      setSelectedContactIdToLink('');
      addToast('Contato vinculado com sucesso!');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkContact = async (contactId) => {
    if (!selectedCompany) return;
    if (!window.confirm('Tem certeza que deseja desvincular este contato?')) return;
    try {
      const response = await fetchWithAuth(`http://localhost:8000/companies/${selectedCompany.id}/contacts/${contactId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao desvincular contato');
      await fetchCompanies();
      
      const updatedResponse = await fetchWithAuth(`http://localhost:8000/companies/${selectedCompany.id}`);
      if (updatedResponse.ok) {
        const updatedCompany = await updatedResponse.json();
        setSelectedCompany(updatedCompany);
      }
      addToast('Contato desvinculado.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleMoveCompany = async (companyId, stageId) => {
    try {
      const response = await fetchWithAuth('http://localhost:8000/pipelines/move', {
        method: 'POST',
        body: JSON.stringify({
          entity_type: 'company',
          entity_id: companyId,
          stage_id: stageId
        })
      });
      if (!response.ok) throw new Error('Falha ao mover empresa');
      
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, stage_id: stageId } : c));
      addToast('Empresa movida com sucesso');
    } catch (err) {
      addToast(err.message, 'error');
      fetchCompanies();
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

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(term) || 
      (company.domain && company.domain.toLowerCase().includes(term)) ||
      (company.contacts && company.contacts.some(c => c.name.toLowerCase().includes(term)))
    );
  }, [companies, searchTerm]);

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
      <p>Carregando empresas e configurações...</p>
    </div>
  );

  return (
    <div className="companies-container">
      <div className="table-header flex-column-mobile">
        <div className="header-actions flex-wrap">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filtrar empresas..." 
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
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          + Criar Empresa
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="hs-scroll-x">
          <table className="hs-table">
            <thead>
              <tr>
                <th>Empresa / Domínio</th>
                <th>Status</th>
                <th>Setor</th>
                <th>Contatos Vinculados</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id}>
                  <td>
                    <div className="company-cell">
                      <div className="avatar">
                        {company.domain 
                          ? <img src={`https://logo.clearbit.com/${company.domain}`} alt="Logo" onError={(e)=>{e.target.onerror = null; e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} style={{width: 32, height: 32, borderRadius: 4, objectFit: 'contain'}} />
                          : null}
                        <div className="fallback-avatar" style={{display: company.domain ? 'none' : 'flex'}}>
                          <Building2 size={16} />
                        </div>
                      </div>
                      <div className="name-stack">
                        <span className="main-name">{company.name}</span>
                        <span className="sub-domain">{company.domain || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${company.status.toLowerCase().replace(' ', '-')}`}>
                      {company.status === 'active' ? 'Cliente' : 
                       company.status === 'inactive' ? 'Inativo' : 
                       company.status === 'prospect' ? 'Prospecção' : company.status}
                    </span>
                  </td>
                  <td>
                    {company.properties?.setor || company.properties?.industria || '-'}
                  </td>
                  <td>
                    {company.contacts && company.contacts.length > 0 ? (
                      <ul className="linked-list-table">
                        {company.contacts.map(cont => <li key={cont.id}>{cont.name}</li>)}
                      </ul>
                    ) : '-'}
                  </td>
                  <td className="actions-cell">
                    <div className="actions-menu-wrapper">
                      <button 
                        className="icon-button" 
                        onClick={() => setActiveMenu(activeMenu === company.id ? null : company.id)}
                      >
                        < MoreHorizontal size={16} />
                      </button>
                      {activeMenu === company.id && (
                        <div className="dropdown-menu">
                          <button onClick={() => handleOpenEdit(company)}>
                            <Edit size={14} /> Editar
                          </button>
                          <button onClick={() => handleOpenDelete(company)} className="delete-btn">
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
          items={filteredCompanies}
          entityType="company"
          onMove={handleMoveCompany}
        />
      )}

      {/* Modal de Criar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Nova Empresa' : 'Editar Empresa'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="company-form">
          <div className="form-sections-container">
            {/* Seção Fixa: Informações Básicas */}
            <div className="form-section">
              <h3 className="section-title">Informações Básicas</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label className="hs-label">Nome da Empresa <span className="required-indicator">*</span></label>
                  <input 
                    type="text" className="hs-input" required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Globex Corp"
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Domínio da Empresa</label>
                  <input 
                    type="text" className="hs-input"
                    value={formData.domain}
                    onChange={e => setFormData({...formData, domain: e.target.value})}
                    placeholder="ex: globex.com"
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Status</label>
                  <select 
                    className="hs-select"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Cliente</option>
                    <option value="prospect">Prospecção</option>
                    <option value="inactive">Inativo</option>
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

            {/* Seções Dinâmicas */}
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
            
            {modalType === 'edit' && selectedCompany && (
              <div className="form-section relations">
                <h3 className="section-title">Contatos Vinculados</h3>
                <div className="relations-list">
                  {selectedCompany.contacts && selectedCompany.contacts.length > 0 ? (
                    selectedCompany.contacts.map(cont => (
                      <div key={cont.id} className="relation-item">
                        <div className="relation-info">
                          <div className="avatar small-avatar">{cont.name ? cont.name[0] : 'U'}</div>
                          <span>{cont.name}</span>
                        </div>
                        <button 
                          type="button" 
                          className="unlink-btn" 
                          onClick={() => handleUnlinkContact(cont.id)}
                        >
                          Desvincular
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="no-relations">Nenhum contato vinculado a esta empresa ainda.</p>
                  )}
                </div>
                
                <div className="link-action">
                  <select 
                    value={selectedContactIdToLink} 
                    onChange={e => setSelectedContactIdToLink(e.target.value)}
                    className="link-select"
                  >
                    <option value="">Selecione um contato para vincular...</option>
                    {allContacts
                      .filter(c => !(selectedCompany.contacts || []).some(linked => linked.id === c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                      ))
                    }
                  </select>
                  <button 
                    type="button" 
                    className="hs-button-secondary link-btn"
                    onClick={handleLinkContact}
                    disabled={!selectedContactIdToLink || isLinking}
                  >
                    {isLinking ? 'Vinculando...' : 'Vincular Contato'}
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
              {isSaving ? 'Salvando...' : 'Salvar Empresa'}
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
          <p>Você tem certeza que deseja excluir a empresa <strong>{selectedCompany?.name}</strong>?</p>
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

    </div>
  );
};

export default Companies;
