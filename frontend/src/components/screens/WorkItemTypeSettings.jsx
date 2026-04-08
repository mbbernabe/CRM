import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw
} from 'lucide-react';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import './WorkItemTypeSettings.css';

// --- Utils ---
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');
};

// --- Options Manager ---
const OptionsManager = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const options = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(';').map(o => o.trim()).filter(x => x);
  }, [value]);

  const addOption = () => {
    if (!inputValue.trim()) return;
    if (options.includes(inputValue.trim())) {
      setInputValue('');
      return;
    }
    const newOptions = [...options, inputValue.trim()];
    onChange(newOptions);
    setInputValue('');
  };

  const removeOption = (opt) => {
    const newOptions = options.filter(x => x !== opt);
    onChange(newOptions);
  };

  return (
    <div className="options-manager">
      <div className="options-list">
        {options.map((opt, i) => (
          <div key={i} className="option-chip">
            <span>{opt}</span>
            <button type="button" onClick={() => removeOption(opt)}><X size={12} /></button>
          </div>
        ))}
      </div>
      <div className="option-input-group">
        <input 
          type="text" 
          placeholder="Adicionar opção..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
          className="hs-input hs-input-sm"
        />
        <button type="button" className="hs-button-secondary hs-button-sm" onClick={addOption}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

const WorkItemTypeSettings = () => {
  const { addToast } = useToast();
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
    field_definitions: [],
    field_groups: []
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
      ],
      field_groups: []
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
      field_definitions: [...(type.field_definitions || [])],
      field_groups: [...(type.field_groups || [])]
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
        newFields[index].name = slugify(value);
    }
    
    setFormData({ ...formData, field_definitions: newFields });
  };

  const handleAddGroup = () => {
    setFormData({
        ...formData,
        field_groups: [
            ...formData.field_groups,
            { name: '', order: formData.field_groups.length }
        ]
    });
  };

  const handleRemoveGroup = (index) => {
    const groupToRemove = formData.field_groups[index];
    setFormData({
        ...formData,
        field_groups: formData.field_groups.filter((_, i) => i !== index),
        field_definitions: formData.field_definitions.map(f => 
            f.group_id === groupToRemove.id ? { ...f, group_id: null } : f
        )
    });
  };

  const handleGroupChange = (index, value) => {
    const newGroups = [...formData.field_groups];
    newGroups[index] = { ...newGroups[index], name: value };
    setFormData({ ...formData, field_groups: newGroups });
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
                 {!type.is_system && (
                   <button className="icon-button delete" onClick={() => { setSelectedType(type); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={16} /></button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

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
                <div className="hs-form-group">
                  <label className="hs-label">Rótulo Exibido (Display Name)</label>
                  <input 
                    type="text" className="hs-input" required
                    value={formData.label}
                    onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                            ...prev, 
                            label: val,
                            name: modalType === 'create' ? slugify(val) : prev.name
                        }));
                    }}
                    placeholder="Ex: Oportunidade, Chamado..."
                  />
                </div>
                <div className="hs-form-group">
                    <label className="hs-label">Cor de Identificação</label>
                    <div className="color-input-wrapper">
                        <input 
                            type="color" 
                            className="color-picker-input"
                            value={formData.color || '#0091ae'}
                            onInput={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        />
                        <code className="color-code-display">{formData.color || '#0091ae'}</code>
                    </div>
                </div>
              </div>
            </div>

            <div className="form-section groups-config">
              <div className="section-header">
                <h4 className="section-title">Grupos de Campos</h4>
                <button type="button" className="hs-button-link" onClick={handleAddGroup}>+ Adicionar Grupo</button>
              </div>
              <div className="groups-list">
                {formData.field_groups.map((group, idx) => (
                    <div key={idx} className="group-row">
                        <input 
                            type="text" className="hs-input hs-input-sm" 
                            value={group.name} placeholder="Nome do Grupo (ex: Pessoal)"
                            onChange={e => handleGroupChange(idx, e.target.value)}
                        />
                        <button type="button" className="icon-button danger" onClick={() => handleRemoveGroup(idx)}><Trash2 size={14} /></button>
                    </div>
                ))}
                {formData.field_groups.length === 0 && <p className="empty-text">Sem grupos. Os campos serao exibidos em uma lista unica.</p>}
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
                            <option value="multiselect">Seleção Múltipla</option>
                            <option value="email">E-mail</option>
                            <option value="cpf">CPF</option>
                            <option value="cep">CEP</option>
                            <option value="phone">Telefone</option>
                            <option value="boolean">Sim/Não (Toggle)</option>
                            </select>

                            <select 
                                className="hs-select hs-select-sm"
                                value={field.group_id || ''}
                                onChange={e => handleFieldChange(idx, 'group_id', e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Sem Grupo</option>
                                {formData.field_groups.map((g, gi) => (
                                    <option key={gi} value={g.id || `temp-${gi}`}>{g.name || `Grupo #${gi + 1}`}</option>
                                ))}
                            </select>
                        </div>

                        {['select', 'multiselect'].includes(field.field_type) && (
                            <div className="options-input">
                                <label>Opções do Campo</label>
                                <OptionsManager 
                                    value={field.options}
                                    onChange={val => handleFieldChange(idx, 'options', val)}
                                />
                                {field.field_type === 'multiselect' && (
                                    <div className="display-mode-config">
                                        <label className="hs-label">Exibição do Multiselect:</label>
                                        <div className="radio-group">
                                            <label className="hs-radio">
                                                <input 
                                                    type="radio" 
                                                    name={`displayMode-${idx}`} 
                                                    value="checkbox"
                                                    checked={field.displayMode !== 'tags'}
                                                    onChange={() => handleFieldChange(idx, 'displayMode', 'checkbox')}
                                                />
                                                <span>Checkboxes</span>
                                            </label>
                                            <label className="hs-radio">
                                                <input 
                                                    type="radio" 
                                                    name={`displayMode-${idx}`} 
                                                    value="tags"
                                                    checked={field.displayMode === 'tags'}
                                                    onChange={() => handleFieldChange(idx, 'displayMode', 'tags')}
                                                />
                                                <span>Tags (Dropdown)</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
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
