import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw, ChevronDown, ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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

// Reuse the same sortable components from WorkItemTypeSettings or define locally
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
          <div className="field-checks">
            <label className="hs-checkbox field-required-check">
                <input 
                type="checkbox" 
                checked={field.required}
                onChange={e => onChange('required', e.target.checked)}
                />
                <span>Obrigatório</span>
            </label>
            <label className="hs-checkbox field-required-check">
                <input 
                type="checkbox" 
                checked={field.is_default !== false}
                onChange={e => onChange('is_default', e.target.checked)}
                />
                <span>Importação Automática</span>
            </label>
          </div>
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

const AdminTemplates = () => {
  const { addToast } = useToast();
  const { fetchWithAuth } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMassImportOpen, setIsMassImportOpen] = useState(false);
  const [massText, setMassText] = useState('');
  const [isImportingMassive, setIsImportingMassive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'Package',
    color: '#0091ae',
    field_definitions: [],
    field_groups: []
  });

  const [activeModalTab, setActiveModalTab] = useState('fields'); // 'fields' | 'pipelines'
  const [templatePipelines, setTemplatePipelines] = useState([]);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [currentPipelineIndex, setCurrentPipelineIndex] = useState(null);
  const [pipelineFormData, setPipelineFormData] = useState({
      name: '',
      stages: [
          { name: 'Novo', order: 0, color: '#3182CE', is_final: false },
          { name: 'Em Andamento', order: 1, color: '#F6AD55', is_final: false },
          { name: 'Concluído', order: 2, color: '#38A169', is_final: true }
      ]
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/admin/templates');
      if (!res.ok) throw new Error('Erro ao buscar biblioteca global');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setActiveModalTab('fields');
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
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template) => {
    setModalType('edit');
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      label: template.label,
      icon: template.icon || 'Package',
      color: template.color || '#0091ae',
      field_definitions: [...(template.field_definitions || [])],
      field_groups: [...(template.field_groups || [])]
    });
    setIsModalOpen(true);
    fetchTemplatePipelines(template.id);
  };

  const fetchTemplatePipelines = async (typeId) => {
      try {
          const res = await fetchWithAuth(`http://localhost:8000/pipelines/templates?source_type_id=${typeId}`);
          if (res.ok) {
              const data = await res.json();
              setTemplatePipelines(data);
          }
      } catch (err) {
          console.error("Erro ao buscar pipelines do template:", err);
      }
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
        ? 'http://localhost:8000/admin/templates'
        : `http://localhost:8000/admin/templates/${selectedTemplate.id}`;
      
      const res = await fetchWithAuth(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erro ao salvar modelo global');
      }

      setIsModalOpen(false);
      fetchTemplates();
      addToast(`Modelo global ${modalType === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/admin/templates/${selectedTemplate.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Erro ao excluir modelo');
      }
      setIsDeleteModalOpen(false);
      fetchTemplates();
      addToast('Modelo global excluído com sucesso');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMassImport = async () => {
    if (!massText.trim()) return;
    setIsImportingMassive(true);
    try {
        const lines = massText.split('\n').filter(l => l.trim());
        const fields = lines.map(line => {
            const [label, type, req, def] = line.split(',').map(s => s.trim());
            return {
                label,
                field_type: type || 'text',
                is_required: req?.toUpperCase() === 'S' || req === '1',
                is_default: def?.toUpperCase() === 'S' || def === '1'
            };
        });

        const res = await fetchWithAuth(`http://localhost:8000/admin/templates/${selectedTemplate.id}/import-massive`, {
            method: 'POST',
            body: JSON.stringify(fields)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Erro na importação massiva');
        }

        const result = await res.json();
        addToast(result.message);
        setIsMassImportOpen(false);
        setMassText('');
        // Recarregar os dados do template atual
        const refreshRes = await fetchWithAuth(`http://localhost:8000/admin/templates`);
        const allTemplates = await refreshRes.json();
        const updated = allTemplates.find(t => t.id === selectedTemplate.id);
        if (updated) {
            setTemplates(allTemplates);
            setFormData({
                ...formData,
                field_definitions: updated.field_definitions,
                field_groups: updated.field_groups
            });
        }
    } catch (err) {
        addToast(err.message, 'error');
    } finally {
        setIsImportingMassive(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

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
        if (newDefs[activeIdx].group_id !== targetGroupId) {
            newDefs[activeIdx] = { ...newDefs[activeIdx], group_id: targetGroupId };
        }
        if (isOverAnotherField) {
            const overIdx = parseInt(overId.split('-')[1]);
            if (activeIdx !== overIdx) {
                newDefs = arrayMove(newDefs, activeIdx, overIdx);
            }
        }
        const finalDefs = newDefs.map((f, i) => ({ ...f, order: i }));
        setFormData({ ...formData, field_definitions: finalDefs });
    }
  };

  if (loading) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando biblioteca global...</p>
    </div>
  );

  return (
    <div className="type-settings-container">
      <div className="settings-header-box">
        <div className="header-info">
          <h2><ShieldCheck size={24} style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--hs-blue)' }} /> Biblioteca Global</h2>
          <p>Gerencie os modelos de tipos de objetos disponíveis para todos os workspaces do sistema.</p>
        </div>
        <div className="header-actions-group">
          <button className="hs-button-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Novo Modelo Global
          </button>
        </div>
      </div>

      <div className="types-grid">
        {templates.length === 0 ? (
           <div className="empty-types">
              <Settings2 size={48} className="empty-icon" />
              <p>Nenhum modelo global criado ainda.</p>
              <button className="hs-button-link" onClick={handleOpenCreate}>Criar o primeiro modelo da biblioteca</button>
           </div>
        ) : (
          templates.map(tmpl => (
            <div key={tmpl.id} className="type-card">
              <div className="type-card-body">
                 <div className="type-icon-circle" style={{ backgroundColor: tmpl.color + '20', color: tmpl.color }}>
                    <Code size={20} />
                 </div>
                 <div className="type-info">
                    <h3>{tmpl.label}</h3>
                    <span className="type-slug">{tmpl.name}</span>
                    <span className="fields-count">{tmpl.field_definitions?.length || 0} campos definidos</span>
                 </div>
              </div>
              <div className="type-card-actions">
                 <button className="icon-button" onClick={() => handleOpenEdit(tmpl)} title="Editar"><Edit size={16} /></button>
                 <button className="icon-button delete" onClick={() => { setSelectedTemplate(tmpl); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Configurar Novo Modelo Global' : `Editar Modelo: ${formData.label}`}
        size="large"
      >
        <div className="modal-tabs">
            <button 
                className={`modal-tab ${activeModalTab === 'fields' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('fields')}
            >
                <ListIcon size={16} /> Estrutura & Campos
            </button>
            {modalType === 'edit' && (
                <button 
                    className={`modal-tab ${activeModalTab === 'pipelines' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('pipelines')}
                >
                    <RefreshCw size={16} /> Pipelines de Template
                </button>
            )}
        </div>

        {activeModalTab === 'fields' ? (
        <form onSubmit={handleSave} className="type-form">
          <div className="form-sections">
            <div className="form-section main-config">
              <h4 className="section-title">Informações do Modelo</h4>
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
                  <h4 className="section-title">Estrutura do Modelo (Grupos e Campos)</h4>
                  <div className="section-actions">
                    <button type="button" className="hs-button-link" onClick={() => setIsMassImportOpen(true)}>Importação Massiva</button>
                    <span className="divider">|</span>
                    <button type="button" className="hs-button-link" onClick={handleAddGroup}>+ Criar Novo Grupo</button>
                  </div>
                </div>
               
               <div className="groups-container">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                   <SortableContext items={formData.field_groups.map((_, i) => `group-${i}`)} strategy={verticalListSortingStrategy}>
                     
                     {formData.field_groups.map((group, gIdx) => {
                       const groupId = group.id || `temp-${gIdx}`;
                       const groupFields = formData.field_definitions
                         .map((f, i) => ({ ...f, originalIndex: i }))
                         .filter(f => f.group_id === groupId || f.group_id === group.name);
                       
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
                {isSaving ? 'Salvando...' : modalType === 'create' ? 'Criar Modelo' : 'Salvar Modelo'}
            </button>
          </div>
        </form>
        ) : (
            <div className="template-pipelines-section">
                <div className="section-header">
                    <div className="header-info">
                        <h4>Pipelines Predefinidas</h4>
                        <p className="subtext">Configure fluxos que estarão disponíveis para importação quando este modelo for usado.</p>
                    </div>
                    <button className="hs-button-secondary hs-button-sm" onClick={() => {
                        setCurrentPipelineIndex(null);
                        setPipelineFormData({
                            name: '',
                            stages: [
                                { name: 'Novo', order: 0, color: '#3182CE', is_final: false },
                                { name: 'Em Andamento', order: 1, color: '#F6AD55', is_final: false },
                                { name: 'Concluído', order: 2, color: '#38A169', is_final: true }
                            ]
                        });
                        setIsPipelineModalOpen(true);
                    }}>
                        <Plus size={14} /> Nova Pipeline de Template
                    </button>
                </div>

                <div className="pipelines-grid">
                    {templatePipelines.length === 0 ? (
                        <div className="empty-pipelines">
                            <RefreshCw size={32} />
                            <p>Nenhuma pipeline configurada para este modelo.</p>
                        </div>
                    ) : (
                        templatePipelines.map((p, idx) => (
                            <div key={p.id || idx} className="pipeline-template-card">
                                <div className="card-info">
                                    <h5>{p.name}</h5>
                                    <span>{p.stages?.length || 0} estágios</span>
                                </div>
                                <div className="card-actions">
                                    <button className="icon-button" onClick={() => {
                                        setCurrentPipelineIndex(idx);
                                        setPipelineFormData({
                                            id: p.id,
                                            name: p.name,
                                            stages: [...p.stages]
                                        });
                                        setIsPipelineModalOpen(true);
                                    }}><Edit size={14} /></button>
                                    <button className="icon-button danger" onClick={async () => {
                                        if (window.confirm("Remover esta pipeline do template?")) {
                                            const res = await fetchWithAuth(`http://localhost:8000/pipelines/${p.id}`, { method: 'DELETE' });
                                            if (res.ok) {
                                                addToast("Pipeline de template removida");
                                                fetchTemplatePipelines(selectedTemplate.id);
                                            }
                                        }
                                    }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </Modal>

      {/* Modal de Edição de Pipeline de Template */}
      <Modal 
        isOpen={isPipelineModalOpen} 
        onClose={() => setIsPipelineModalOpen(false)} 
        title={currentPipelineIndex !== null ? "Editar Pipeline de Template" : "Nova Pipeline de Template"}
      >
          <div className="hs-form-group">
              <label className="hs-label">Nome da Pipeline</label>
              <input 
                type="text" className="hs-input" 
                value={pipelineFormData.name} 
                onChange={e => setPipelineFormData({...pipelineFormData, name: e.target.value})}
                placeholder="Ex: Funil de Vendas Padrão"
              />
          </div>
          <div className="stages-preview" style={{ marginTop: '16px' }}>
              <label className="hs-label">Estágios ({pipelineFormData.stages.length})</label>
              <div className="stages-list-compact">
                  {pipelineFormData.stages.map((s, si) => (
                      <div key={si} className="stage-row-compact">
                          <div className="stage-color-dot" style={{ backgroundColor: s.color }}></div>
                          <input 
                            type="text" className="hs-input hs-input-sm" 
                            value={s.name} 
                            onChange={e => {
                                const newStages = [...pipelineFormData.stages];
                                newStages[si].name = e.target.value;
                                setPipelineFormData({...pipelineFormData, stages: newStages});
                            }}
                          />
                          <button className="icon-button" onClick={() => {
                              setPipelineFormData({
                                  ...pipelineFormData,
                                  stages: pipelineFormData.stages.filter((_, i) => i !== si)
                              });
                          }}><X size={14} /></button>
                      </div>
                  ))}
                  <button className="hs-button-link hs-button-sm" onClick={() => {
                      setPipelineFormData({
                          ...pipelineFormData,
                          stages: [...pipelineFormData.stages, { name: 'Novo Estágio', order: pipelineFormData.stages.length, color: '#CBD5E0', is_final: false }]
                      });
                  }}>+ Adicionar Estágio</button>
              </div>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
              <button className="hs-button-secondary" onClick={() => setIsPipelineModalOpen(false)}>Cancelar</button>
              <button className="hs-button-primary" onClick={async () => {
                  if (!pipelineFormData.name) return addToast("Nome é obrigatório", "error");
                  try {
                      const url = pipelineFormData.id 
                        ? `http://localhost:8000/pipelines/${pipelineFormData.id}`
                        : `http://localhost:8000/pipelines/`;
                      
                      const res = await fetchWithAuth(url, {
                          method: pipelineFormData.id ? 'PUT' : 'POST',
                          body: JSON.stringify({
                              ...pipelineFormData,
                              type_id: selectedTemplate.id,
                              workspace_id: null // Explicitamente template global
                          })
                      });

                      if (res.ok) {
                          addToast(`Pipeline de template ${pipelineFormData.id ? 'atualizada' : 'criada'}`);
                          setIsPipelineModalOpen(false);
                          fetchTemplatePipelines(selectedTemplate.id);
                      } else {
                          const err = await res.json();
                          addToast(err.detail || "Erro ao salvar pipeline", "error");
                      }
                  } catch (err) {
                      addToast(err.message, "error");
                  }
              }}>Salvar Pipeline</button>
          </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Modelo Global">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir o modelo <strong>{selectedTemplate?.label}</strong> da biblioteca?</p>
           <p className="subtext">Isso não afetará tipos já importados por workspaces, mas novos workspaces não poderão mais usá-lo.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo da Biblioteca...' : 'Confirmar Exclusão'}
              </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isMassImportOpen} onClose={() => setIsMassImportOpen(false)} title="Importação Massiva de Campos">
        <div className="mass-import-container">
            <p className="subtext">Cole abaixo os campos, um por linha, no formato: <br/> <strong>Rótulo, Tipo, Obrigatório(S/N), Padrão(S/N)</strong></p>
            <textarea 
                className="hs-input" 
                rows="10" 
                style={{ width: '100%', marginTop: '10px', padding: '10px', fontSize: '14px', fontFamily: 'monospace' }}
                placeholder="Ex: Telefone Celular, phone, S, N&#10;Data de Nascimento, date, N, S"
                value={massText}
                onChange={e => setMassText(e.target.value)}
            />
            <div className="actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="hs-button-secondary" onClick={() => setIsMassImportOpen(false)}>Cancelar</button>
                <button className="hs-button-primary" onClick={handleMassImport} disabled={isImportingMassive || !massText.trim()}>
                    {isImportingMassive ? 'Importando...' : 'Processar e Importar'}
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTemplates;
