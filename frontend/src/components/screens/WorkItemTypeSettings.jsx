import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw
} from 'lucide-react';
import Modal from '../common/Modal';
import { ToastProvider } from '../common/Toast';
import './WorkItemTypeSettings.css';

const WorkItemTypeSettings = () => {
    return (
        <ToastProvider>
             {(addToast) => <WorkItemTypeSettingsInner addToast={addToast} />}
        </ToastProvider>
    );
};

const WorkItemTypeSettingsInner = ({ addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedType, setSelectedType] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'Package',
    color: '#0091ae',
    field_definitions: []
  });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/workitems/types');
      if (!res.ok) throw new Error('Erro ao buscar tipos de objetos');
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setFormData({
      name: '',
      label: '',
      icon: 'Package',
      color: '#0091ae',
      field_definitions: [
        { name: 'priority', label: 'Prioridade', field_type: 'select', options: ['Baixa', 'Média', 'Alta'], required: false, order: 0 }
      ]
    });
    setSelectedType(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (type) => {
    setModalType('edit');
    setSelectedType(type);
    setFormData({
      name: type.name,
      label: type.label,
      icon: type.icon || 'Package',
      color: type.color || '#0091ae',
      field_definitions: [...(type.field_definitions || [])]
    });
    setIsModalOpen(true);
  };

  const handleAddField = () => {
    setFormData({
      ...formData,
      field_definitions: [
        ...formData.field_definitions,
        { name: '', label: '', field_type: 'text', options: [], required: false, order: formData.field_definitions.length }
      ]
    });
  };

  const handleRemoveField = (index) => {
    setFormData({
      ...formData,
      field_definitions: formData.field_definitions.filter((_, i) => i !== index)
    });
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...formData.field_definitions];
    newFields[index] = { ...newFields[index], [field]: value };
    
    // Auto-generate name slug from label if empty
    if (field === 'label' && !newFields[index].id && !newFields[index].name) {
        newFields[index].name = value.toLowerCase()
            .replace(/ /g, '_')
            .replace(/[^\w-]+/g, '');
    }
    
    setFormData({ ...formData, field_definitions: newFields });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = modalType === 'create' 
        ? 'http://localhost:8000/workitems/types'
        : `http://localhost:8000/workitems/types/${selectedType.id}`;
      
      const res = await fetchWithAuth(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erro ao salvar tipo de objeto');
      }

      setIsModalOpen(false);
      fetchTypes();
      addToast(`Tipo de objeto ${modalType === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/types/${selectedType.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erro ao excluir tipo');
      }
      setIsDeleteModalOpen(false);
      fetchTypes();
      addToast('Tipo de objeto excluído com sucesso');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getFieldIcon = (type) => {
    switch (type) {
        case 'text': return <AlignLeft size={14} />;
        case 'textarea': return <AlignLeft size={14} />;
        case 'number': return <Hash size={14} />;
        case 'date': return <Calendar size={14} />;
        case 'select': return <ListIcon size={14} />;
        case 'multiselect': return <ListIcon size={14} />;
        case 'boolean': return <CheckSquare size={14} />;
        case 'currency': return <DollarSign size={14} />;
        default: return <AlignLeft size={14} />;
    }
  };

  if (loading) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando tipos de objetos...</p>
    </div>
  );

  return (
    <div className="type-settings-container">
      <div className="settings-header-box">
        <div className="header-info">
          <h2>Tipos de Objetos</h2>
          <p>Defina as entidades e propriedades que trafegarão nas suas pipelines genéricas.</p>
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Criar Novo Tipo
        </button>
      </div>

      <div className="types-grid">
        {types.length === 0 ? (
           <div className="empty-types">
              <Settings2 size={48} className="empty-icon" />
              <p>Nenhum tipo customizado criado ainda.</p>
              <button className="hs-button-link" onClick={handleOpenCreate}>Comece criando o primeiro tipo de objeto</button>
           </div>
        ) : (
          types.map(type => (
            <div key={type.id} className="type-card">
              <div className="type-card-body">
                 <div className="type-icon-circle" style={{ backgroundColor: type.color + '20', color: type.color }}>
                    <Code size={20} />
                 </div>
                 <div className="type-info">
                    <h3>{type.label}</h3>
                    <span className="type-slug">{type.name}</span>
                    <span className="fields-count">{type.field_definitions?.length || 0} campos definidos</span>
                 </div>
              </div>
              <div className="type-card-actions">
                 <button className="icon-button" onClick={() => handleOpenEdit(type)} title="Editar"><Edit size={16} /></button>
                 <button className="icon-button delete" onClick={() => { setSelectedType(type); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Configurar Novo Tipo de Objeto' : `Editar ${formData.label}`}
        size="large"
      >
        <form onSubmit={handleSave} className="type-form">
          <div className="form-sections">
            <div className="form-section main-config">
              <h4 className="section-title">Informações Básicas</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="hs-label">Rótulo Exibido (Display Name)</label>
                  <input 
                    type="text" className="hs-input" required
                    value={formData.label}
                    onChange={e => {
                        const val = e.target.value;
                        setFormData({
                            ...formData, 
                            label: val,
                            name: modalType === 'create' ? val.toLowerCase().replace(/ /g, '_').replace(/[^\w-]+/g, '') : formData.name
                        });
                    }}
                    placeholder="Ex: Oportunidade, Chamado..."
                  />
                </div>
                <div className="form-group">
                  <label className="hs-label">Identificador Interno (Slug)</label>
                  <input 
                    type="text" className="hs-input" required disabled={modalType === 'edit'}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="ex: oportunidade_vendas"
                  />
                  <small>Usado na API. Não pode ser alterado após a criação.</small>
                </div>
                <div className="form-group">
                    <label className="hs-label">Cor de Identificação</label>
                    <div className="color-input-wrapper">
                        <input 
                            type="color" className="color-picker"
                            value={formData.color}
                            onChange={e => setFormData({...formData, color: e.target.value})}
                        />
                        <span className="color-code">{formData.color}</span>
                    </div>
                </div>
              </div>
            </div>

            <div className="form-section fields-config">
               <div className="section-header">
                 <h4 className="section-title">Propriedades do Objeto (Campos Customizados)</h4>
                 <button type="button" className="hs-button-link" onClick={handleAddField}>+ Adicionar Campo</button>
               </div>
               
               <div className="fields-builder">
                 {formData.field_definitions.map((field, idx) => (
                   <div key={idx} className="field-row">
                      <div className="drag-handle"><GripVertical size={14} /></div>
                      
                      <div className="field-config-inputs">
                        <div className="field-main">
                            <input 
                            type="text" className="hs-input hs-input-sm" required
                            value={field.label}
                            onChange={e => handleFieldChange(idx, 'label', e.target.value)}
                            placeholder="Nome do campo (Ex: Valor)"
                            />
                            <select 
                            className="hs-select hs-select-sm"
                            value={field.field_type}
                            onChange={e => handleFieldChange(idx, 'field_type', e.target.value)}
                            >
                            <option value="text">Texto Curto</option>
                            <option value="textarea">Texto Longo</option>
                            <option value="number">Número</option>
                            <option value="currency">Moeda</option>
                            <option value="date">Data</option>
                            <option value="select">Seleção Única</option>
                            <option value="boolean">Sim/Não (Toggle)</option>
                            </select>
                        </div>

                        {['select', 'multiselect'].includes(field.field_type) && (
                            <div className="options-input">
                                <label>Opções (separadas por ponto e vírgula)</label>
                                <input 
                                    type="text" className="hs-input hs-input-sm"
                                    placeholder="Opção 1; Opção 2..."
                                    value={Array.isArray(field.options) ? field.options.join('; ') : field.options}
                                    onChange={e => handleFieldChange(idx, 'options', e.target.value.split(';').map(o => o.trim()))}
                                />
                            </div>
                        )}
                        
                        <div className="field-footer">
                            <label className="hs-checkbox field-required-check">
                                <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={e => handleFieldChange(idx, 'required', e.target.checked)}
                                />
                                <span>Obrigatório</span>
                            </label>
                            <span className="field-slug-preview">ID: {field.name}</span>
                        </div>
                      </div>

                      <button type="button" className="field-remove" onClick={() => handleRemoveField(idx)}>
                        <X size={16} />
                      </button>
                   </div>
                 ))}
                 
                 {formData.field_definitions.length === 0 && (
                     <div className="no-fields-alert">
                         <AlertCircle size={20} />
                         <p>Adicione pelo menos um campo para que os itens deste tipo possam ter dados.</p>
                     </div>
                 )}
               </div>
            </div>
          </div>

          <div className="form-actions sticky-footer">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="hs-button-primary" disabled={isSaving}>
                {isSaving ? 'Salvando...' : modalType === 'create' ? 'Criar Tipo' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Tipo de Objeto">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir o tipo <strong>{selectedType?.label}</strong>?</p>
           <p className="subtext">Isso poderá causar erros em itens e pipelines que já utilizam este tipo.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkItemTypeSettings;
