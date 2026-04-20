import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw, ChevronDown, ChevronRight,
  ShieldCheck, Table, Download, Search, ArrowUpDown, ArrowUp, ArrowDown
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
import FieldImportModal from '../common/FieldImportModal';
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
      <div className="drag-handle" {...attributes} {...listeners} title="Arraste para reordenar este campo">
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

      <button type="button" className="field-remove" onClick={onRemove} title="Remover este campo">
        <X size={16} />
      </button>
    </div>
  );
};

const SortableGroupPanel = ({ id, group, fields, onAddField, onRemoveGroup, onGroupChange, onRemoveField, onFieldChange, allGroups }) => {
  const [isExpanded, setIsExpanded] = useState(true);
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
    <div ref={setNodeRef} style={style} className={`group-panel ${isDragging ? 'dragging' : ''} ${!isExpanded ? 'collapsed' : ''}`}>
      <div className="group-panel-header">
        <div className="group-header-left">
          <div className="group-drag-handle" {...attributes} {...listeners} title="Arraste para reordenar este grupo">
            <GripVertical size={16} />
          </div>
          <button 
            type="button" 
            className="group-collapse-toggle" 
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Recolher Grupo" : "Expandir Grupo"}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {id === 'unassigned' ? (
            <h4 className="group-panel-title" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
                Campos Gerais (Sem Grupo)
            </h4>
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
           {isExpanded && (
             <button type="button" className="hs-button-link hs-button-sm" onClick={onAddField}>
               <Plus size={14} /> Adicionar Campo
             </button>
           )}
           {id !== 'unassigned' && (
             <button type="button" className="icon-button danger" onClick={onRemoveGroup} title="Remover Grupo">
               <Trash2 size={14} />
             </button>
           )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="group-panel-content animate-in">
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
      )}
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
  const [isDeletePipelineModalOpen, setIsDeletePipelineModalOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Library filtering and view mode
  const [libraryViewMode, setLibraryViewMode] = useState('grid'); // 'grid' | 'list'
  const [librarySearch, setLibrarySearch] = useState('');
  const [libVisibleColumns, setLibVisibleColumns] = useState(['label', 'field_count', 'actions']);
  const [libColumnWidths, setLibColumnWidths] = useState({
    label: 300,
    name: 200,
    field_count: 150,
    actions: 100
  });
  const [libSort, setLibSort] = useState({ key: 'label', direction: 'asc' });
  const [isLibColumnPickerOpen, setIsLibColumnPickerOpen] = useState(false);
  const [libSelectedIds, setLibSelectedIds] = useState([]);
  const [isLibBulkDeleteModalOpen, setIsLibBulkDeleteModalOpen] = useState(false);
  
  // Pipelines filtering and view mode (inside modal)
  const [pipelineViewMode, setPipelineViewMode] = useState('grid');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipeVisibleColumns, setPipeVisibleColumns] = useState(['name', 'stage_count', 'actions']);
  const [pipeColumnWidths, setPipeColumnWidths] = useState({
    name: 300,
    stage_count: 150,
    actions: 100
  });
  const [pipeSort, setPipeSort] = useState({ key: 'name', direction: 'asc' });
  const [isPipeColumnPickerOpen, setIsPipeColumnPickerOpen] = useState(false);
  const [pipeSelectedIds, setPipeSelectedIds] = useState([]);
  const [isPipeBulkDeleteModalOpen, setIsPipeBulkDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'Package',
    color: '#0091ae',
    field_definitions: [],
    field_groups: []
  });

  const [activeModalTab, setActiveModalTab] = useState('fields'); // 'fields' | 'pipelines'
  const [tableSort, setTableSort] = useState({ key: 'order', direction: 'asc' });
  const [tableSearch, setTableSearch] = useState('');
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 40,
    label: 250,
    name: 180,
    field_type: 120,
    group: 150,
    required: 100,
    actions: 80
  });
  const [isResizing, setIsResizing] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(['label', 'field_type', 'group', 'required', 'actions']);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
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
      const res = await fetchWithAuth('/admin/templates');
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
    // Limpar seleção ao remover
    setSelectedIndices(prev => prev.filter(idx => idx !== index).map(idx => idx > index ? idx - 1 : idx));
  };

   const handleBulkDelete = () => {
    if (selectedIndices.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    setFormData({
        ...formData,
        field_definitions: formData.field_definitions.filter((_, i) => !selectedIndices.includes(i))
    });
    setSelectedIndices([]);
    setLibSelectedIds([]);
    setPipeSelectedIds([]);
    addToast(`${selectedIndices.length} campos excluídos com sucesso.`, 'success');
  };

  const handleLibBulkDelete = async () => {
    setIsDeleting(true);
    try {
        const results = await Promise.all(
            libSelectedIds.map(id => fetchWithAuth(`http://localhost:8000/admin/templates/${id}`, { method: 'DELETE' }))
        );
        const successes = results.filter(r => r.ok).length;
        if (successes > 0) {
            addToast(`${successes} modelos excluídos da biblioteca`, 'success');
            fetchTemplates();
            setLibSelectedIds([]);
            setIsLibBulkDeleteModalOpen(false);
        } else {
            addToast("Erro ao excluir modelos selecionados", "error");
        }
    } catch (err) {
        addToast(err.message, "error");
    } finally {
        setIsDeleting(false);
    }
  };

  const handlePipeBulkDelete = async () => {
    setIsDeleting(true);
    try {
        const results = await Promise.all(
            pipeSelectedIds.map(id => fetchWithAuth(`http://localhost:8000/pipelines/${id}`, { method: 'DELETE' }))
        );
        const successes = results.filter(r => r.ok).length;
        if (successes > 0) {
            addToast(`${successes} pipelines de template removidas`, 'success');
            fetchTemplatePipelines(selectedTemplate.id);
            setPipeSelectedIds([]);
            setIsPipeBulkDeleteModalOpen(false);
        } else {
            addToast("Erro ao excluir pipelines selecionadas", "error");
        }
    } catch (err) {
        addToast(err.message, "error");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleSortTable = (key) => {
    setTableSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
        setSelectedIndices(filteredAndSortedFields.map(f => f.originalIndex));
    } else {
        setSelectedIndices([]);
    }
  };

  const toggleSelectField = (originalIndex) => {
    setSelectedIndices(prev => 
        prev.includes(originalIndex) 
            ? prev.filter(i => i !== originalIndex) 
            : [...prev, originalIndex]
    );
  };

  const filteredAndSortedFields = useMemo(() => {
    let result = formData.field_definitions.map((f, i) => ({ ...f, originalIndex: i }));

    // Filtro
    if (tableSearch) {
        const search = tableSearch.toLowerCase();
        result = result.filter(f => {
            const groupName = formData.field_groups.find(g => g.id === f.group_id)?.name || 'Geral';
            const optionsStr = Array.isArray(f.options) ? f.options.join(' ') : (f.options || '');
            
            return f.label.toLowerCase().includes(search) || 
                   f.name.toLowerCase().includes(search) ||
                   f.field_type.toLowerCase().includes(search) ||
                   groupName.toLowerCase().includes(search) ||
                   optionsStr.toLowerCase().includes(search);
        });
    }

    // Ordenação
    const { key, direction } = tableSort;
    result.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (key === 'group') {
            valA = formData.field_groups.find(g => g.id === a.group_id)?.name || 'Geral';
            valB = formData.field_groups.find(g => g.id === b.group_id)?.name || 'Geral';
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [formData.field_definitions, formData.field_groups, tableSort, tableSearch]);

  const filteredLibrary = useMemo(() => {
    let result = [...templates];
    
    if (librarySearch) {
        const search = librarySearch.toLowerCase();
        result = result.filter(t => 
            t.label.toLowerCase().includes(search) || 
            t.name.toLowerCase().includes(search)
        );
    }

    const { key, direction } = libSort;
    result.sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';
        if (key === 'field_count') {
            valA = a.field_definitions?.length || 0;
            valB = b.field_definitions?.length || 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [templates, librarySearch, libSort]);

  const filteredPipelines = useMemo(() => {
    let result = [...templatePipelines];
    
    if (pipelineSearch) {
        const search = pipelineSearch.toLowerCase();
        result = result.filter(p => 
            p.name.toLowerCase().includes(search)
        );
    }

    const { key, direction } = pipeSort;
    result.sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';
        if (key === 'stage_count') {
            valA = a.stages?.length || 0;
            valB = b.stages?.length || 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [templatePipelines, pipelineSearch, pipeSort]);

  // Redimensionamento de Colunas
  const startResize = (e, column, type = 'field') => {
    e.preventDefault();
    let startWidth = 0;
    if (type === 'field') startWidth = columnWidths[column];
    else if (type === 'library') startWidth = libColumnWidths[column];
    else if (type === 'pipeline') startWidth = pipeColumnWidths[column];

    setIsResizing({
        column,
        type,
        startX: e.pageX,
        startWidth: startWidth
    });
  };

  useEffect(() => {
    if (!isResizing) return;

    const doResize = (e) => {
        const diff = e.pageX - isResizing.startX;
        const newWidth = Math.max(50, isResizing.startWidth + diff);
        
        if (isResizing.type === 'field') {
            setColumnWidths(prev => ({ ...prev, [isResizing.column]: newWidth }));
        } else if (isResizing.type === 'library') {
            setLibColumnWidths(prev => ({ ...prev, [isResizing.column]: newWidth }));
        } else if (isResizing.type === 'pipeline') {
            setPipeColumnWidths(prev => ({ ...prev, [isResizing.column]: newWidth }));
        }
    };

    const stopResize = () => setIsResizing(null);

    window.addEventListener('mousemove', doResize);
    window.addEventListener('mouseup', stopResize);
    return () => {
        window.removeEventListener('mousemove', doResize);
        window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

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
        ? '/admin/templates'
        : `/admin/templates/${selectedTemplate.id}`;
      
      const res = await fetchWithAuth(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const error = await res.json();
        let errorMessage = 'Erro ao salvar modelo global';
        
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
      const res = await fetchWithAuth(`/admin/templates/${selectedTemplate.id}`, {
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

  const handleFieldsImported = (importedFields) => {
    // 1. Identificar novos grupos necessários
    const existingGroupNames = formData.field_groups.map(g => g.name);
    const newGroups = [...formData.field_groups];
    
    const importedGroups = [...new Set(importedFields.map(f => f.group_name).filter(g => g))];
    
    importedGroups.forEach(gName => {
        if (!existingGroupNames.includes(gName)) {
            newGroups.push({ id: `temp-${Date.now()}-${Math.random()}`, name: gName, order: newGroups.length });
        }
    });

    // 2. Mapear campos para os IDs dos grupos
    const finalFields = importedFields.map((f, i) => {
        const group = newGroups.find(g => g.name === f.group_name);
        return {
            label: f.label,
            name: f.name || slugify(f.label),
            field_type: f.field_type || 'text', // Mapear 'field_type' vindo do modal
            group_id: group ? group.id : null,
            order: formData.field_definitions.length + i,
            required: false,
            options: []
        };
    });

    setFormData(prev => ({
        ...prev,
        field_groups: newGroups,
        field_definitions: [...prev.field_definitions, ...finalFields]
    }));
    
    addToast(`${importedFields.length} campos adicionados ao rascunho do modelo global.`);
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

      <div className="library-toolbar">
          <div className="search-box">
              <Search size={16} />
              <input 
                  type="text" 
                  placeholder="Pesquisar na biblioteca global..." 
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
              />
          </div>
          <div className="view-toggles">
              <button 
                  className={`view-toggle ${libraryViewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setLibraryViewMode('grid')}
                  title="Visão em Cards"
              >
                  <Palette size={16} />
              </button>
              <button 
                  className={`view-toggle ${libraryViewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setLibraryViewMode('list')}
                  title="Visão em Lista"
              >
                  <ListIcon size={16} />
              </button>
          </div>
          {libraryViewMode === 'list' && (
              <>
                  {libSelectedIds.length > 0 && (
                      <button className="hs-button-danger hs-button-sm" onClick={() => setIsLibBulkDeleteModalOpen(true)}>
                          <Trash2 size={14} /> Excluir ({libSelectedIds.length})
                      </button>
                  )}
                  <div className="column-picker-wrapper">
                      <button 
                          className={`hs-button-secondary hs-button-sm ${isLibColumnPickerOpen ? 'active' : ''}`}
                          onClick={() => setIsLibColumnPickerOpen(!isLibColumnPickerOpen)}
                      >
                          <Settings2 size={14} /> Colunas
                      </button>
                      {isLibColumnPickerOpen && (
                          <div className="column-picker-dropdown">
                              <div className="picker-header">Exibir Colunas</div>
                              <div className="picker-options">
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={libVisibleColumns.includes('checkbox')} 
                                          onChange={() => setLibVisibleColumns(prev => prev.includes('checkbox') ? prev.filter(c => c !== 'checkbox') : [...prev, 'checkbox'])}
                                      />
                                      Seleção
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={libVisibleColumns.includes('label')} 
                                          onChange={() => setLibVisibleColumns(prev => prev.includes('label') ? prev.filter(c => c !== 'label') : [...prev, 'label'])}
                                      />
                                      Nome do Modelo
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={libVisibleColumns.includes('name')} 
                                          onChange={() => setLibVisibleColumns(prev => prev.includes('name') ? prev.filter(c => c !== 'name') : [...prev, 'name'])}
                                      />
                                      Identificador
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={libVisibleColumns.includes('field_count')} 
                                          onChange={() => setLibVisibleColumns(prev => prev.includes('field_count') ? prev.filter(c => c !== 'field_count') : [...prev, 'field_count'])}
                                      />
                                      Total de Campos
                                  </label>
                              </div>
                          </div>
                      )}
                  </div>
              </>
          )}
      </div>

      <div className={`library-content ${libraryViewMode}-view`}>
        {filteredLibrary.length === 0 ? (
           <div className="empty-types">
              {librarySearch ? <Search size={48} className="empty-icon" /> : <Settings2 size={48} className="empty-icon" />}
              <p>{librarySearch ? `Nenhum modelo encontrado para "${librarySearch}"` : "Nenhum modelo global criado ainda."}</p>
              {!librarySearch && <button className="hs-button-link" onClick={handleOpenCreate}>Criar o primeiro modelo da biblioteca</button>}
           </div>
        ) : libraryViewMode === 'grid' ? (
          <div className="types-grid">
            {filteredLibrary.map(tmpl => (
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
            ))}
          </div>
        ) : (
          <div className="types-list" style={{ overflowX: 'auto' }}>
             <table className="hs-table" style={{ tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
                <thead>
                    <tr>
                        {libVisibleColumns.includes('checkbox') && (
                            <th style={{ width: libColumnWidths.checkbox || 50 }}>
                                <input 
                                    type="checkbox" 
                                    checked={libSelectedIds.length === filteredLibrary.length && filteredLibrary.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setLibSelectedIds(filteredLibrary.map(t => t.id));
                                        else setLibSelectedIds([]);
                                    }}
                                />
                            </th>
                        )}
                        {libVisibleColumns.includes('label') && (
                            <th style={{ width: libColumnWidths.label }}>
                                <div className="th-content" onClick={() => setLibSort({ key: 'label', direction: libSort.key === 'label' && libSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Nome do Modelo {libSort.key === 'label' && (libSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'label', 'library')} />
                            </th>
                        )}
                        {libVisibleColumns.includes('name') && (
                            <th style={{ width: libColumnWidths.name }}>
                                <div className="th-content" onClick={() => setLibSort({ key: 'name', direction: libSort.key === 'name' && libSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Identificador {libSort.key === 'name' && (libSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'name', 'library')} />
                            </th>
                        )}
                        {libVisibleColumns.includes('field_count') && (
                            <th style={{ width: libColumnWidths.field_count }}>
                                <div className="th-content" onClick={() => setLibSort({ key: 'field_count', direction: libSort.key === 'field_count' && libSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Campos {libSort.key === 'field_count' && (libSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'field_count', 'library')} />
                            </th>
                        )}
                        {libVisibleColumns.includes('actions') && (
                            <th style={{ width: libColumnWidths.actions || 100, textAlign: 'right' }}>Ações</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {filteredLibrary.map(tmpl => (
                        <tr key={tmpl.id} className={libSelectedIds.includes(tmpl.id) ? 'selected' : ''}>
                            {libVisibleColumns.includes('checkbox') && (
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={libSelectedIds.includes(tmpl.id)}
                                        onChange={() => setLibSelectedIds(prev => prev.includes(tmpl.id) ? prev.filter(id => id !== tmpl.id) : [...prev, tmpl.id])}
                                    />
                                </td>
                            )}
                            {libVisibleColumns.includes('label') && (
                                <td>
                                    <div className="list-item-name">
                                        <div className="type-icon-mini" style={{ color: tmpl.color }}>
                                            <Code size={14} />
                                        </div>
                                        <strong>{tmpl.label}</strong>
                                    </div>
                                </td>
                            )}
                            {libVisibleColumns.includes('name') && <td><code>{tmpl.name}</code></td>}
                            {libVisibleColumns.includes('field_count') && <td>{tmpl.field_definitions?.length || 0} campos</td>}
                            {libVisibleColumns.includes('actions') && (
                                <td style={{ textAlign: 'right' }}>
                                    <div className="list-actions">
                                        <button className="icon-button" onClick={() => handleOpenEdit(tmpl)} title="Editar"><Edit size={14} /></button>
                                        <button className="icon-button delete" onClick={() => { setSelectedTemplate(tmpl); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
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
                <Palette size={16} /> Editor Visual
            </button>
            <button 
                className={`modal-tab ${activeModalTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('table')}
            >
                <Table size={16} /> Lista de Campos
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

        <form onSubmit={handleSave} className="type-form">
            <div className="form-sections">
                {activeModalTab === 'fields' && (
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
                                    <button type="button" className="hs-button-link" onClick={() => setIsMassImportOpen(true)}>Importar CSV (Drag & Drop)</button>
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
                )}

                {activeModalTab === 'table' && (
                    <div className="form-section field-table-view animate-in" style={{ padding: '0 20px' }}>
                        <div className="table-toolbar">
                            <div className="table-toolbar-left">
                                <div className="table-search-wrapper" title="Busca por Rótulo, Nome Interno, Tipo, Grupo e Opções">
                                    <Search size={16} className="table-search-icon" />
                                    <input 
                                        type="text" 
                                        className="table-search-input" 
                                        placeholder="Buscar campos..."
                                        value={tableSearch}
                                        onChange={e => setTableSearch(e.target.value)}
                                    />
                                </div>
                                
                                {selectedIndices.length > 0 && (
                                    <div className="table-bulk-actions">
                                        <span className="bulk-actions-label">{selectedIndices.length} selecionados</span>
                                        <button 
                                            type="button" 
                                            className="hs-button-danger hs-button-sm"
                                            onClick={handleBulkDelete}
                                            title="Excluir permanentemente todos os campos selecionados"
                                        >
                                            <Trash2 size={14} /> Excluir em Lote
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="column-picker-wrapper">
                                <button 
                                    type="button" 
                                    className="hs-button-secondary hs-button-sm"
                                    onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                                    title="Escolher colunas exibidas"
                                >
                                    <Settings2 size={14} /> Colunas
                                </button>
                                {isColumnPickerOpen && (
                                    <>
                                        <div className="column-picker-overlay" onClick={() => setIsColumnPickerOpen(false)} />
                                        <div className="column-picker-dropdown animate-in">
                                            <div className="picker-header">Colunas da Tabela</div>
                                            <div className="picker-options">
                                                {[
                                                    { key: 'label', label: 'Rótulo (Label)' },
                                                    { key: 'name', label: 'Nome Interno' },
                                                    { key: 'field_type', label: 'Tipo' },
                                                    { key: 'group', label: 'Grupo' },
                                                    { key: 'required', label: 'Obrigatório' }
                                                ].map(col => (
                                                    <label key={col.key} className="column-picker-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={visibleColumns.includes(col.key)}
                                                            onChange={e => {
                                                                if (e.target.checked) setVisibleColumns([...visibleColumns, col.key]);
                                                                else setVisibleColumns(visibleColumns.filter(c => c !== col.key));
                                                            }}
                                                        />
                                                        <span>{col.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="section-actions">
                                <button type="button" className="hs-button-link" onClick={() => setIsMassImportOpen(true)}>
                                    <Download size={14} /> Importar CSV
                                </button>
                            </div>
                        </div>

                        <div className="table-vessel hs-scroll-x">
                            <table className="hs-table-lite" style={{ tableLayout: 'fixed', width: 'auto', minWidth: '100%' }}>
                                <thead>
                                    <tr>
                                        <th className="col-checkbox" style={{ width: columnWidths.checkbox }}>
                                            <input 
                                                type="checkbox" 
                                                onChange={toggleSelectAll}
                                                checked={filteredAndSortedFields.length > 0 && filteredAndSortedFields.every(f => selectedIndices.includes(f.originalIndex))}
                                            />
                                        </th>
                                        {[
                                            { key: 'label', label: 'Rótulo (Label)' },
                                            { key: 'name', label: 'Nome Interno' },
                                            { key: 'field_type', label: 'Tipo' },
                                            { key: 'group', label: 'Grupo' },
                                            { key: 'required', label: 'Obrigatório' },
                                            { key: 'actions', label: 'Ações', sortable: false }
                                        ].filter(col => visibleColumns.includes(col.key)).map((col) => (
                                            <th 
                                                key={col.key}
                                                className={`${col.sortable !== false ? 'sortable' : ''} ${tableSort.key === col.key ? 'active-sort' : ''}`}
                                                style={{ width: columnWidths[col.key] }}
                                                onClick={() => col.sortable !== false && handleSortTable(col.key)}
                                            >
                                                <div className="header-content">
                                                    {col.label}
                                                    {col.sortable !== false && (
                                                        <span className="sort-icon">
                                                            {tableSort.key === col.key ? (
                                                                tableSort.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                            ) : <ArrowUpDown size={14} />}
                                                        </span>
                                                    )}
                                                </div>
                                                <div 
                                                    className={`resizer ${isResizing?.column === col.key ? 'resizing' : ''}`} 
                                                    onMouseDown={(e) => startResize(e, col.key)}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedFields.map((field) => (
                                        <tr key={field.originalIndex} className={selectedIndices.includes(field.originalIndex) ? 'row-selected' : ''}>
                                            <td className="col-checkbox">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIndices.includes(field.originalIndex)}
                                                    onChange={() => toggleSelectField(field.originalIndex)}
                                                />
                                            </td>
                                            {visibleColumns.includes('label') && (
                                                <td>
                                                    <input 
                                                        type="text" className="hs-input-compact" 
                                                        value={field.label} 
                                                        onChange={e => handleFieldChange(field.originalIndex, 'label', e.target.value)}
                                                    />
                                                </td>
                                            )}
                                            {visibleColumns.includes('name') && <td><code>{field.name}</code></td>}
                                            {visibleColumns.includes('field_type') && <td>{field.field_type}</td>}
                                            {visibleColumns.includes('group') && <td>{formData.field_groups.find(g => g.id === field.group_id)?.name || 'Geral'}</td>}
                                            {visibleColumns.includes('required') && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={field.required} 
                                                        onChange={e => handleFieldChange(field.originalIndex, 'required', e.target.checked)}
                                                    />
                                                </td>
                                            )}
                                            {visibleColumns.includes('actions') && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <button type="button" className="icon-button danger" onClick={() => handleRemoveField(field.originalIndex)} title="Excluir este campo">
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {filteredAndSortedFields.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="empty-filter-results">
                                                <Search size={32} opacity={0.2} />
                                                <p>Nenhum campo encontrado no modelo global para "{tableSearch}"</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeModalTab === 'pipelines' && (
                    <div className="template-pipelines-section">
                        <div className="section-header">
                            <div className="header-info">
                                <h4>Pipelines Predefinidas</h4>
                                <p className="subtext">Configure fluxos que estarão disponíveis para importação quando este modelo for usado.</p>
                            </div>
                            <button type="button" className="hs-button-secondary hs-button-sm" onClick={() => {
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

                        <div className="pipelines-toolbar">
                            <div className="search-box-sm">
                                <Search size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Filtrar pipelines..." 
                                    value={pipelineSearch}
                                    onChange={e => setPipelineSearch(e.target.value)}
                                />
                            </div>
                            <div className="view-toggles-sm">
                                <button 
                                    className={`view-toggle-sm ${pipelineViewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setPipelineViewMode('grid')}
                                >
                                    <Palette size={14} />
                                </button>
                                <button 
                                    className={`view-toggle-sm ${pipelineViewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setPipelineViewMode('list')}
                                >
                                    <ListIcon size={14} />
                                </button>
                            </div>
                            {pipelineViewMode === 'list' && (
                                <>
                                    {pipeSelectedIds.length > 0 && (
                                        <button className="hs-button-danger hs-button-xs" style={{ marginLeft: '12px' }} onClick={() => setIsPipeBulkDeleteModalOpen(true)}>
                                            <Trash2 size={12} /> Excluir ({pipeSelectedIds.length})
                                        </button>
                                    )}
                                    <div className="column-picker-wrapper-sm">
                                        <button 
                                            className={`hs-button-secondary hs-button-xs ${isPipeColumnPickerOpen ? 'active' : ''}`}
                                            onClick={() => setIsPipeColumnPickerOpen(!isPipeColumnPickerOpen)}
                                        >
                                            <Settings2 size={12} /> Colunas
                                        </button>
                                        {isPipeColumnPickerOpen && (
                                            <div className="column-picker-dropdown-sm">
                                                <div className="picker-header">Exibir Colunas</div>
                                                <div className="picker-options">
                                                    <label className="column-picker-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={pipeVisibleColumns.includes('checkbox')} 
                                                            onChange={() => setPipeVisibleColumns(prev => prev.includes('checkbox') ? prev.filter(c => c !== 'checkbox') : [...prev, 'checkbox'])}
                                                        />
                                                        Seleção
                                                    </label>
                                                    <label className="column-picker-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={pipeVisibleColumns.includes('name')} 
                                                            onChange={() => setPipeVisibleColumns(prev => prev.includes('name') ? prev.filter(c => c !== 'name') : [...prev, 'name'])}
                                                        />
                                                        Nome da Pipeline
                                                    </label>
                                                    <label className="column-picker-item">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={pipeVisibleColumns.includes('stage_count')} 
                                                            onChange={() => setPipeVisibleColumns(prev => prev.includes('stage_count') ? prev.filter(c => c !== 'stage_count') : [...prev, 'stage_count'])}
                                                        />
                                                        Total de Estágios
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={`pipelines-container ${pipelineViewMode}-view`}>
                            {filteredPipelines.length === 0 ? (
                                <div className="empty-pipelines">
                                    <RefreshCw size={32} />
                                    <p>{pipelineSearch ? `Nenhuma pipeline encontrada para "${pipelineSearch}"` : "Nenhuma pipeline configurada para este modelo."}</p>
                                </div>
                            ) : pipelineViewMode === 'grid' ? (
                                <div className="pipelines-grid">
                                    {filteredPipelines.map((p, idx) => (
                                        <div key={p.id || idx} className="pipeline-template-card">
                                            <div className="card-info">
                                                <h5>{p.name}</h5>
                                                <span>{p.stages?.length || 0} estágios</span>
                                            </div>
                                            <div className="card-actions">
                                                <button type="button" className="icon-button" onClick={() => {
                                                    setCurrentPipelineIndex(idx);
                                                    setPipelineFormData({
                                                        id: p.id,
                                                        name: p.name,
                                                        stages: [...p.stages]
                                                    });
                                                    setIsPipelineModalOpen(true);
                                                }}><Edit size={14} /></button>
                                                <button type="button" className="icon-button danger" onClick={() => {
                                                    setPipelineToDelete(p);
                                                    setIsDeletePipelineModalOpen(true);
                                                }}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="pipelines-list-compact" style={{ overflowX: 'auto' }}>
                                    <table className="hs-table-compact" style={{ tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
                                        <thead>
                                            <tr>
                                                {pipeVisibleColumns.includes('checkbox') && (
                                                    <th style={{ width: 40 }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={pipeSelectedIds.length === filteredPipelines.length && filteredPipelines.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setPipeSelectedIds(filteredPipelines.map(p => p.id));
                                                                else setPipeSelectedIds([]);
                                                            }}
                                                        />
                                                    </th>
                                                )}
                                                {pipeVisibleColumns.includes('name') && (
                                                    <th style={{ width: pipeColumnWidths.name }}>
                                                        <div className="th-content" onClick={() => setPipeSort({ key: 'name', direction: pipeSort.key === 'name' && pipeSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                            Nome da Pipeline {pipeSort.key === 'name' && (pipeSort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                                                        </div>
                                                        <div className="resizer" onMouseDown={e => startResize(e, 'name', 'pipeline')} />
                                                    </th>
                                                )}
                                                {pipeVisibleColumns.includes('stage_count') && (
                                                    <th style={{ width: pipeColumnWidths.stage_count }}>
                                                        <div className="th-content" onClick={() => setPipeSort({ key: 'stage_count', direction: pipeSort.key === 'stage_count' && pipeSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                                            Estágios {pipeSort.key === 'stage_count' && (pipeSort.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                                                        </div>
                                                        <div className="resizer" onMouseDown={e => startResize(e, 'stage_count', 'pipeline')} />
                                                    </th>
                                                )}
                                                {pipeVisibleColumns.includes('actions') && (
                                                    <th style={{ width: pipeColumnWidths.actions, textAlign: 'right' }}>Ações</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPipelines.map((p, idx) => (
                                                <tr key={p.id || idx} className={pipeSelectedIds.includes(p.id) ? 'selected' : ''}>
                                                    {pipeVisibleColumns.includes('checkbox') && (
                                                        <td>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={pipeSelectedIds.includes(p.id)}
                                                                onChange={() => setPipeSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                                                            />
                                                        </td>
                                                    )}
                                                    {pipeVisibleColumns.includes('name') && <td><strong>{p.name}</strong></td>}
                                                    {pipeVisibleColumns.includes('stage_count') && <td>{p.stages?.length || 0} estágios</td>}
                                                    {pipeVisibleColumns.includes('actions') && (
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div className="list-actions">
                                                                <button type="button" className="icon-button" onClick={() => {
                                                                    setCurrentPipelineIndex(idx);
                                                                    setPipelineFormData({
                                                                        id: p.id,
                                                                        name: p.name,
                                                                        stages: [...p.stages]
                                                                    });
                                                                    setIsPipelineModalOpen(true);
                                                                }}><Edit size={12} /></button>
                                                                <button type="button" className="icon-button danger" onClick={() => {
                                                                    setPipelineToDelete(p);
                                                                    setIsDeletePipelineModalOpen(true);
                                                                }}><Trash2 size={12} /></button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="form-actions sticky-footer">
                <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="hs-button-primary" disabled={isSaving}>
                    {isSaving ? 'Salvando...' : modalType === 'create' ? 'Criar Modelo' : 'Salvar Modelo'}
                </button>
            </div>
        </form>

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

      <Modal isOpen={isLibBulkDeleteModalOpen} onClose={() => setIsLibBulkDeleteModalOpen(false)} title="Excluir Modelos em Massa">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir <strong>{libSelectedIds.length}</strong> modelos da biblioteca global?</p>
           <p className="subtext">Esta ação é irreversível e removerá os modelos de futuras importações.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsLibBulkDeleteModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={handleLibBulkDelete} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão em Massa'}
              </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isPipeBulkDeleteModalOpen} onClose={() => setIsPipeBulkDeleteModalOpen(false)} title="Excluir Pipelines em Massa">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir <strong>{pipeSelectedIds.length}</strong> pipelines de template?</p>
           <p className="subtext">Esta ação removerá as definições de fluxo para este modelo permanentemente.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsPipeBulkDeleteModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={handlePipeBulkDelete} disabled={isDeleting}>
                  {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão em Massa'}
              </button>
           </div>
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

      <Modal isOpen={isDeletePipelineModalOpen} onClose={() => setIsDeletePipelineModalOpen(false)} title="Excluir Pipeline de Template">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir a pipeline <strong>{pipelineToDelete?.name}</strong> deste modelo?</p>
           <p className="subtext">Esta ação removerá a predefinição deste fluxo para novas importações.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsDeletePipelineModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={async () => {
                  setIsDeleting(true);
                  try {
                      const res = await fetchWithAuth(`http://localhost:8000/pipelines/${pipelineToDelete.id}`, { method: 'DELETE' });
                      if (res.ok) {
                          addToast("Pipeline de template removida");
                          setIsDeletePipelineModalOpen(false);
                          fetchTemplatePipelines(selectedTemplate.id);
                      } else {
                          const err = await res.json();
                          addToast(err.detail || "Erro ao excluir pipeline", "error");
                      }
                  } catch (err) {
                      addToast(err.message, "error");
                  } finally {
                      setIsDeleting(false);
                  }
              }} disabled={isDeleting}>
                  {isDeleting ? 'Removendo...' : 'Confirmar Exclusão'}
              </button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Excluir Campos em Massa">
        <div className="delete-confirm">
           <AlertCircle size={48} className="danger-icon" />
           <p>Tem certeza que deseja excluir <strong>{selectedIndices.length}</strong> campos deste modelo global?</p>
           <p className="subtext">Esta ação removerá as definições permanentemente deste rascunho de modelo.</p>
           <div className="actions">
              <button className="hs-button-secondary" onClick={() => setIsBulkDeleteModalOpen(false)}>Cancelar</button>
              <button className="hs-button-danger" onClick={confirmBulkDelete}>
                  Confirmar Exclusão em Massa
              </button>
           </div>
        </div>
      </Modal>

      <FieldImportModal 
        isOpen={isMassImportOpen}
        onClose={() => setIsMassImportOpen(false)}
        onFieldsImported={handleFieldsImported}
      />
    </div>
  );
};

export default AdminTemplates;
