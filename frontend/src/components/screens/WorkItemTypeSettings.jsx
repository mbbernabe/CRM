import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import './WorkItemTypeSettings.css';

// --- Sortable Components ---

const SortableField = ({ id, field, onRemove, onChange, groups }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`field-row ${isDragging ? 'dragging' : ''}`}>
      <div className="drag-handle" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>
      
      <div className="field-config-inputs">
        <div className="field-main">
          <input 
            type="text" className="hs-input hs-input-sm" required
            value={field.label}
            onChange={e => onChange('label', e.target.value)}
            placeholder="Nome do campo (Ex: Valor)"
          />
          <select 
            className="hs-select hs-select-sm"
            value={field.field_type}
            onChange={e => onChange('field_type', e.target.value)}
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
              onChange={e => onChange('group_id', e.target.value ? (isNaN(e.target.value) ? e.target.value : parseInt(e.target.value)) : null)}
          >
              <option value="">Sem Grupo</option>
              {groups.map((g, gi) => (
                  <option key={gi} value={g.id || `temp-${gi}`}>{g.name || `Grupo #${gi + 1}`}</option>
              ))}
          </select>
        </div>

        {['select', 'multiselect'].includes(field.field_type) && (
            <div className="options-input">
                <label>Opções do Campo</label>
                <OptionsManager 
                    value={field.options}
                    onChange={val => onChange('options', val)}
                />
            </div>
        )}
        
        <div className="field-footer">
            <label className="hs-checkbox field-required-check">
                <input 
                type="checkbox" 
                checked={field.required}
                onChange={e => onChange('required', e.target.checked)}
                />
                <span>Obrigatório</span>
            </label>
            <span className="field-slug-preview">ID: {field.name}</span>
        </div>
      </div>

      <button type="button" className="field-remove" onClick={onRemove}>
        <X size={16} />
      </button>
    </div>
  );
};

const SortableGroupPanel = ({ id, group, fields, onAddField, onRemoveGroup, onGroupChange, onRemoveField, onFieldChange, allGroups }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`group-panel ${isDragging ? 'dragging' : ''}`}>
      <div className="group-panel-header">
        <div className="group-header-left">
          <div className="group-drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </div>
          {id === 'unassigned' ? (
            <h4 className="group-panel-title">Campos Gerais (Sem Grupo)</h4>
          ) : (
            <input 
              type="text" 
              className="group-title-input" 
              value={group.name} 
              onChange={(e) => onGroupChange(e.target.value)}
              placeholder="Nome do Grupo..."
            />
          )}
          <span className="fields-badge">{fields.length} campos</span>
        </div>
        <div className="group-header-actions">
           <button type="button" className="hs-button-link hs-button-sm" onClick={onAddField}>
             <Plus size={14} /> Adicionar Campo
           </button>
           {id !== 'unassigned' && (
             <button type="button" className="icon-button danger" onClick={onRemoveGroup} title="Remover Grupo">
               <Trash2 size={14} />
             </button>
           )}
        </div>
      </div>
      
      <div className="group-panel-content">
        <SortableContext items={fields.map(f => `field-${f.originalIndex}`)} strategy={verticalListSortingStrategy}>
          {fields.map((field, idx) => (
            <SortableField 
              key={`field-${field.originalIndex}`}
              id={`field-${field.originalIndex}`}
              field={field}
              groups={allGroups}
              onRemove={() => onRemoveField(field.originalIndex)}
              onChange={(key, val) => onFieldChange(field.originalIndex, key, val)}
            />
          ))}
          {fields.length === 0 && (
            <div className="empty-group-placeholder">
              Puxe campos para cá ou clique em "Adicionar Campo"
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

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

  const handleAddField = (groupId = null) => {
    setFormData({
      ...formData,
      field_definitions: [
        ...formData.field_definitions,
        { 
          name: '', 
          label: '', 
          field_type: 'text', 
          options: [], 
          required: false, 
          order: formData.field_definitions.length,
          group_id: groupId
        }
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
            { id: `temp-${Date.now()}`, name: '', order: formData.field_groups.length }
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
        let errorMessage = 'Erro ao salvar tipo de objeto';
        
        if (typeof error.detail === 'string') {
            errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
            // FastAPI Pydantic Validation Errors
            errorMessage = error.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(' | ');
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // 1. Reordenação de Grupos
    if (active.id.toString().startsWith('group-') && over.id.toString().startsWith('group-')) {
        const oldIndex = parseInt(active.id.toString().split('-')[1]);
        const newIndex = parseInt(over.id.toString().split('-')[1]);
        if (oldIndex !== newIndex) {
            const newGroups = arrayMove(formData.field_groups, oldIndex, newIndex)
                .map((g, i) => ({ ...g, order: i }));
            setFormData({ ...formData, field_groups: newGroups });
        }
        return;
    }

    // 2. Reordenação/Movimentação de campos
    if (active.id.toString().startsWith('field-')) {
        const activeIdx = parseInt(active.id.toString().split('-')[1]);
        
        let overId = over.id.toString();
        let targetGroupId = null;
        let isOverAnotherField = overId.startsWith('field-');
        
        if (isOverAnotherField) {
            const overIdx = parseInt(overId.split('-')[1]);
            targetGroupId = formData.field_definitions[overIdx].group_id;
        } else if (overId.startsWith('group-')) {
            const groupIdx = parseInt(overId.split('-')[1]);
            targetGroupId = formData.field_groups[groupIdx].id || formData.field_groups[groupIdx].name;
        } else if (overId === 'unassigned') {
            targetGroupId = null;
        }

        let newDefs = [...formData.field_definitions];
        
        // Se mudou de grupo
        if (newDefs[activeIdx].group_id !== targetGroupId) {
            newDefs[activeIdx] = { ...newDefs[activeIdx], group_id: targetGroupId };
        }
        
        // Se houver reordenação (sobre outro campo)
        if (isOverAnotherField) {
            const overIdx = parseInt(overId.split('-')[1]);
            if (activeIdx !== overIdx) {
                newDefs = arrayMove(newDefs, activeIdx, overIdx);
            }
        }
        
        // Atualizar propriedade 'order' para todos os campos
        const finalDefs = newDefs.map((f, i) => ({ ...f, order: i }));
        setFormData({ ...formData, field_definitions: finalDefs });
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
              <div className="form-section layout-builder">
               <div className="section-header">
                 <h4 className="section-title">Estrutura do Objeto (Grupos e Campos)</h4>
                 <button type="button" className="hs-button-link" onClick={handleAddGroup}>+ Criar Novo Grupo</button>
               </div>
               
               <div className="groups-container">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                   <SortableContext items={formData.field_groups.map((_, i) => `group-${i}`)} strategy={verticalListSortingStrategy}>
                     
                     {/* Render Groups */}
                     {formData.field_groups.map((group, gIdx) => {
                       const groupId = group.id || `temp-${gIdx}`;
                       const groupFields = formData.field_definitions
                         .map((f, i) => ({ ...f, originalIndex: i }))
                         .filter(f => f.group_id === groupId || f.group_id === group.name); // Fallback p/ o nome se id não existir ainda
                       
                       return (
                         <SortableGroupPanel 
                           key={`group-${gIdx}`}
                           id={`group-${gIdx}`}
                           group={group}
                           fields={groupFields}
                           allGroups={formData.field_groups}
                           onAddField={() => handleAddField(groupId)}
                           onRemoveGroup={() => handleRemoveGroup(gIdx)}
                           onGroupChange={(val) => handleGroupChange(gIdx, val)}
                           onRemoveField={handleRemoveField}
                           onFieldChange={handleFieldChange}
                         />
                       );
                     })}

                     {/* Unassigned Fields Group */}
                     {(() => {
                        const unassignedFields = formData.field_definitions
                          .map((f, i) => ({ ...f, originalIndex: i }))
                          .filter(f => !f.group_id);
                        
                        return (
                          <SortableGroupPanel 
                            id="unassigned"
                            group={{ name: 'Geral' }}
                            fields={unassignedFields}
                            allGroups={formData.field_groups}
                            onAddField={() => handleAddField(null)}
                            onRemoveGroup={() => {}}
                            onGroupChange={() => {}}
                            onRemoveField={handleRemoveField}
                            onFieldChange={handleFieldChange}
                          />
                        );
                     })()}

                   </SortableContext>
                 </DndContext>
               </div>
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
