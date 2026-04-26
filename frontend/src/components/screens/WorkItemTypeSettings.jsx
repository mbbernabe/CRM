import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, Edit, Trash2, Save, X, Settings2, Code, 
  Palette, Type, List as ListIcon, CheckSquare, 
  AlignLeft, Hash, Calendar, DollarSign, GripVertical, AlertCircle, RefreshCw, ChevronDown, ChevronRight,
  BookOpen, Download, Table, Search, ArrowUpDown, ArrowUp, ArrowDown
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
import FieldImportModal from '../common/FieldImportModal';
import './WorkItemTypeSettings.css';

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};


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
            <option value="date">Data Simples</option>
            <option value="date_range">Prazo (Início e Fim)</option>
            <option value="select">Seleção Única</option>
            <option value="multiselect">Seleção Múltipla</option>
            <option value="email">E-mail</option>
            <option value="cpf">CPF</option>
            <option value="cnpj">CNPJ</option>
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


// --- Utils ---
// slugify já está definido no topo do arquivo

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
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isImporting, setIsImporting] = useState(null); // ID of template being imported
  const [isImportingField, setIsImportingField] = useState(null);
  const [typeUpdates, setTypeUpdates] = useState({}); // { typeId: { diffs: [], template: {} } }
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncingType, setSyncingType] = useState(null);
  const [selectedSyncFields, setSelectedSyncFields] = useState([]); // List of source_field_ids
  const [isApplyingSync, setIsApplyingSync] = useState(false);
  const [isSuggestedLibraryOpen, setIsSuggestedLibraryOpen] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [isFieldImportModalOpen, setIsFieldImportModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('visual'); // 'visual' | 'table'
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

  // Types filtering and view mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleListColumns, setVisibleListColumns] = useState(['label', 'field_count', 'actions']);
  const [listColumnWidths, setListColumnWidths] = useState({
    label: 300,
    name: 200,
    field_count: 150,
    actions: 100
  });
  const [listSort, setListSort] = useState({ key: 'label', direction: 'asc' });
  const [isListColumnPickerOpen, setIsListColumnPickerOpen] = useState(false);
  const [listSelectedIds, setListSelectedIds] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: 'Package',
    color: '#0091ae',
    field_definitions: [],
    field_groups: []
  });

  const checkUpdatesForTypes = async (typesList) => {
    const updates = {};
    const checks = typesList
        .filter(t => t.source_type_id)
        .map(type =>
            fetchWithAuth(`http://localhost:8000/workitems/types/${type.id}/updates`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data && data.updates_available) {
                        updates[type.id] = data;
                    }
                })
                .catch(err => {
                    console.error(`Erro ao verificar atualizações para ${type.label}:`, err);
                })
        );
    await Promise.all(checks);
    setTypeUpdates(updates);
  };

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/workitems/types');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Erro ao buscar tipos de objetos');
      }
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        setTypes([]);
        return;
      }
      
      setTypes(data);
      checkUpdatesForTypes(data);
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

  const handleOpenLibrary = async () => {
    setIsLibraryOpen(true);
    setLoadingTemplates(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/workitems/templates');
      if (!res.ok) throw new Error('Erro ao buscar biblioteca');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleImportTemplate = async (templateId) => {
    setIsImporting(templateId);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/import-template/${templateId}`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Erro ao importar modelo');
      
      addToast('Modelo importado com sucesso!');
      setIsLibraryOpen(false);
      fetchTypes();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsImporting(null);
    }
  };

  const handleOpenSuggestedLibrary = async () => {
    if (!selectedType) return;
    setIsSuggestedLibraryOpen(true);
    setLoadingSuggested(true);
    try {
        const res = await fetchWithAuth(`http://localhost:8000/workitems/types/${selectedType.id}/suggested-fields`);
        if (!res.ok) throw new Error('Erro ao buscar campos sugeridos');
        const data = await res.json();
        setSuggestedFields(data);
    } catch (err) {
        addToast(err.message, 'error');
    } finally {
        setLoadingSuggested(false);
    }
  };

  const handleImportSuggestedField = async (fieldId) => {
    setIsImportingField(fieldId);
    try {
        const res = await fetchWithAuth(`http://localhost:8000/workitems/types/${selectedType.id}/import-field/${fieldId}`, {
            method: 'POST'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Erro ao importar campo');
        }
        
        const newField = await res.json();
        
        // Atualizar o formulário local para que o campo apareça imediatamente
        setFormData(prev => ({
            ...prev,
            field_definitions: [...prev.field_definitions, newField]
        }));

        // Remover da lista de sugestões
        setSuggestedFields(prev => prev.filter(f => f.id !== fieldId));
        
        addToast(`Campo '${newField.label}' importado com sucesso!`);
        
        // Se a lista de sugestões ficar vazia, fecha o modal
        if (suggestedFields.length <= 1) {
            setIsSuggestedLibraryOpen(false);
        }

        // Refresh types list in background to sync
        fetchTypes();
    } catch (err) {
        addToast(err.message, 'error');
    } finally {
        setIsImportingField(null);
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
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIndices.length} campos?`)) return;

    setFormData({
        ...formData,
        field_definitions: formData.field_definitions.filter((_, i) => !selectedIndices.includes(i))
    });
    setSelectedIndices([]);
    addToast(`${selectedIndices.length} campos excluídos com sucesso.`, 'success');
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

        // Tratamento especial para grupos
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

  const filteredTypes = useMemo(() => {
    let result = [...types];
    
    if (searchQuery) {
        const search = searchQuery.toLowerCase();
        result = result.filter(t => 
            t.label.toLowerCase().includes(search) || 
            t.name.toLowerCase().includes(search)
        );
    }

    const { key, direction } = listSort;
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
  }, [types, searchQuery, listSort]);

  // Redimensionamento de Colunas
  const startResize = (e, column, type = 'field') => {
    e.preventDefault();
    let startWidth = 0;
    if (type === 'field') startWidth = columnWidths[column];
    else if (type === 'list') startWidth = listColumnWidths[column];

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
        } else if (isResizing.type === 'list') {
            setListColumnWidths(prev => ({ ...prev, [isResizing.column]: newWidth }));
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
    
    // Validar nomes únicos no frontend
    const fieldNames = formData.field_definitions.map(f => f.name.toLowerCase());
    const uniqueNames = new Set(fieldNames);
    if (uniqueNames.size !== fieldNames.length) {
        const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
        addToast(`Existem campos com nomes duplicados: ${[...new Set(duplicates)].join(', ')}. Use nomes únicos (IDs Internos).`, 'error');
        return;
    }

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
    if (!selectedType) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/types/${selectedType.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Erro ao excluir tipo de objeto');
      }
      setIsDeleteModalOpen(false);
      fetchTypes();
      addToast('Tipo de objeto excluído com sucesso!');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplySync = async () => {
    if (selectedSyncFields.length === 0) return;
    setIsApplyingSync(true);
    try {
        const res = await fetchWithAuth(`http://localhost:8000/workitems/types/${syncingType.id}/sync`, {
            method: 'POST',
            body: JSON.stringify({ source_field_ids: selectedSyncFields })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.detail || 'Erro ao sincronizar');
        }

        addToast('Sincronização aplicada com sucesso!');
        setIsSyncModalOpen(false);
        fetchTypes(); // Recarregar tudo
    } catch (err) {
        addToast(err.message, 'error');
    } finally {
        setIsApplyingSync(false);
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

    // 2. Mapear campos para os IDs dos grupos (novos ou existentes)
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
    
    addToast(`${importedFields.length} campos adicionados ao rascunho.`);
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

  const totalUpdates = typeUpdates ? Object.keys(typeUpdates).length : 0;

  const safeColor = (color) => {
    if (!color || typeof color !== 'string') return '#0091ae';
    return color.startsWith('#') ? color : `#${color}`;
  };

  const safeAlphaColor = (color, alpha = '20') => {
    const base = safeColor(color);
    return `${base}${alpha}`;
  };

  return (
    <div className="type-settings-container">
      {totalUpdates > 0 && (
          <div className="sync-banner">
              <div className="banner-content">
                  <RefreshCw size={18} className="banner-icon" />
                  <span>Há <strong>{totalUpdates}</strong> tipos de objetos com atualizações disponíveis na Biblioteca Global.</span>
              </div>
          </div>
      )}
      <div className="settings-header-box">
        <div className="header-info">
          <h2>Tipos de Objetos</h2>
          <p>Defina as entidades e propriedades que trafegarão nas suas pipelines genéricas.</p>
        </div>
        <div className="header-actions-group">
          <button className="hs-button-secondary" onClick={handleOpenLibrary}>
            <BookOpen size={16} /> Biblioteca de Modelos
          </button>
          <button className="hs-button-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Criar Novo Tipo
          </button>
        </div>
      </div>

      <div className="library-toolbar">
          <div className="search-box">
              <Search size={16} />
              <input 
                  type="text" 
                  placeholder="Pesquisar tipos de objetos..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
          <div className="view-toggles">
              <button 
                  className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Visão em Cards"
              >
                  <Palette size={16} />
              </button>
              <button 
                  className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Visão em Lista"
              >
                  <ListIcon size={16} />
              </button>
          </div>
          {viewMode === 'list' && (
              <>
                  <div className="column-picker-wrapper">
                      <button 
                          className={`hs-button-secondary hs-button-sm ${isListColumnPickerOpen ? 'active' : ''}`}
                          onClick={() => setIsListColumnPickerOpen(!isListColumnPickerOpen)}
                      >
                          <Settings2 size={14} /> Colunas
                      </button>
                      {isListColumnPickerOpen && (
                          <div className="column-picker-dropdown">
                              <div className="picker-header">Exibir Colunas</div>
                              <div className="picker-options">
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={visibleListColumns.includes('checkbox')} 
                                          onChange={() => setVisibleListColumns(prev => prev.includes('checkbox') ? prev.filter(c => c !== 'checkbox') : [...prev, 'checkbox'])}
                                      />
                                      Seleção
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={visibleListColumns.includes('label')} 
                                          onChange={() => setVisibleListColumns(prev => prev.includes('label') ? prev.filter(c => c !== 'label') : [...prev, 'label'])}
                                      />
                                      Nome do Tipo
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={visibleListColumns.includes('name')} 
                                          onChange={() => setVisibleListColumns(prev => prev.includes('name') ? prev.filter(c => c !== 'name') : [...prev, 'name'])}
                                      />
                                      Identificador
                                  </label>
                                  <label className="column-picker-item">
                                      <input 
                                          type="checkbox" 
                                          checked={visibleListColumns.includes('field_count')} 
                                          onChange={() => setVisibleListColumns(prev => prev.includes('field_count') ? prev.filter(c => c !== 'field_count') : [...prev, 'field_count'])}
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

      <div className={`library-content ${viewMode}-view`}>
        {filteredTypes.length === 0 ? (
           <div className="empty-types">
              {searchQuery ? <Search size={48} className="empty-icon" /> : <Settings2 size={48} className="empty-icon" />}
              <p>{searchQuery ? `Nenhum tipo de objeto encontrado para "${searchQuery}"` : "Nenhum tipo customizado criado ainda."}</p>
              {!searchQuery && <button className="hs-button-link" onClick={handleOpenCreate}>Comece criando o primeiro tipo de objeto</button>}
           </div>
        ) : viewMode === 'grid' ? (
          <div className="types-grid">
           {filteredTypes.map((type) => {
            if (!type) return null;
            return (
              <div key={type.id || Math.random()} className="type-card">
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
                    {type.id && typeUpdates && typeUpdates[type.id] && (
                        <button 
                           className="icon-button notification animate-pulse" 
                           onClick={(e) => {
                               e.stopPropagation();
                               setSyncingType(type);
                               if (typeUpdates[type.id]?.diffs) {
                                  setSelectedSyncFields(typeUpdates[type.id].diffs.map(d => d.source_field_id));
                               } else {
                                  setSelectedSyncFields([]);
                               }
                               setIsSyncModalOpen(true);
                           }}
                           title="Atualizações disponíveis"
                           style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', marginRight: '8px' }}
                        >
                           <RefreshCw size={16} color="#f97316" />
                        </button>
                    )}
                   <button className="icon-button" onClick={() => handleOpenEdit(type)} title="Editar"><Edit size={16} /></button>
                   {!type.is_system && (
                     <button className="icon-button delete" onClick={() => { setSelectedType(type); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={16} /></button>
                   )}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="types-list" style={{ overflowX: 'auto' }}>
             <table className="hs-table" style={{ tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
                <thead>
                    <tr>
                        {visibleListColumns.includes('checkbox') && (
                            <th style={{ width: listColumnWidths.checkbox || 50 }}>
                                <input 
                                    type="checkbox" 
                                    checked={listSelectedIds.length === filteredTypes.length && filteredTypes.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) setListSelectedIds(filteredTypes.map(t => t.id));
                                        else setListSelectedIds([]);
                                    }}
                                />
                            </th>
                        )}
                        {visibleListColumns.includes('label') && (
                            <th style={{ width: listColumnWidths.label }}>
                                <div className="th-content" onClick={() => setListSort({ key: 'label', direction: listSort.key === 'label' && listSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Nome do Tipo {listSort.key === 'label' && (listSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'label', 'list')} />
                            </th>
                        )}
                        {visibleListColumns.includes('name') && (
                            <th style={{ width: listColumnWidths.name }}>
                                <div className="th-content" onClick={() => setListSort({ key: 'name', direction: listSort.key === 'name' && listSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Identificador {listSort.key === 'name' && (listSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'name', 'list')} />
                            </th>
                        )}
                        {visibleListColumns.includes('field_count') && (
                            <th style={{ width: listColumnWidths.field_count }}>
                                <div className="th-content" onClick={() => setListSort({ key: 'field_count', direction: listSort.key === 'field_count' && listSort.direction === 'asc' ? 'desc' : 'asc' })}>
                                    Campos {listSort.key === 'field_count' && (listSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                                <div className="resizer" onMouseDown={e => startResize(e, 'field_count', 'list')} />
                            </th>
                        )}
                        {visibleListColumns.includes('actions') && (
                            <th style={{ width: listColumnWidths.actions || 100, textAlign: 'right' }}>Ações</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {filteredTypes.map(type => (
                        <tr key={type.id} className={listSelectedIds.includes(type.id) ? 'selected' : ''}>
                            {visibleListColumns.includes('checkbox') && (
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={listSelectedIds.includes(type.id)}
                                        onChange={() => setListSelectedIds(prev => prev.includes(type.id) ? prev.filter(id => id !== type.id) : [...prev, type.id])}
                                    />
                                </td>
                            )}
                            {visibleListColumns.includes('label') && (
                                <td>
                                    <div className="list-item-name">
                                        <div className="type-icon-mini" style={{ color: type.color }}>
                                            <Code size={14} />
                                        </div>
                                        <strong>{type.label}</strong>
                                    </div>
                                </td>
                            )}
                            {visibleListColumns.includes('name') && <td><code>{type.name}</code></td>}
                            {visibleListColumns.includes('field_count') && <td>{type.field_definitions?.length || 0} campos</td>}
                            {visibleListColumns.includes('actions') && (
                                <td style={{ textAlign: 'right' }}>
                                    <div className="list-actions">
                                        {type.id && typeUpdates && typeUpdates[type.id] && (
                                            <button 
                                               className="icon-button notification animate-pulse" 
                                               onClick={(e) => {
                                                   e.stopPropagation();
                                                   setSyncingType(type);
                                                   if (typeUpdates[type.id]?.diffs) {
                                                      setSelectedSyncFields(typeUpdates[type.id].diffs.map(d => d.source_field_id));
                                                   } else {
                                                      setSelectedSyncFields([]);
                                                   }
                                                   setIsSyncModalOpen(true);
                                               }}
                                               title="Atualizações disponíveis"
                                               style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', marginRight: '8px' }}
                                            >
                                               <RefreshCw size={14} color="#f97316" />
                                            </button>
                                        )}
                                        <button className="icon-button" onClick={() => handleOpenEdit(type)} title="Editar"><Edit size={14} /></button>
                                        {!type.is_system && (
                                            <button className="icon-button delete" onClick={() => { setSelectedType(type); setIsDeleteModalOpen(true); }} title="Excluir"><Trash2 size={14} /></button>
                                        )}
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
        title={modalType === 'create' ? 'Configurar Novo Tipo de Objeto' : `Editar ${formData.label}`}
        size="large"
      >
        <form onSubmit={handleSave} className="type-form">
          <div className="modal-tabs">
            <button 
                type="button"
                className={`modal-tab ${activeModalTab === 'visual' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('visual')}
            >
                <Palette size={16} /> Editor Visual
            </button>
            <button 
                type="button"
                className={`modal-tab ${activeModalTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('table')}
            >
                <Table size={16} /> Lista de Campos
            </button>
          </div>

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
              {activeModalTab === 'visual' && (
                <div className="form-section layout-builder">
               <div className="section-header">
                 <h4 className="section-title">Estrutura do Objeto (Grupos e Campos)</h4>
                 <div className="section-actions">
                   <button type="button" className="hs-button-link" onClick={() => setIsFieldImportModalOpen(true)} style={{ marginRight: '15px' }}>
                     <Download size={14} /> Importar CSV
                   </button>
                   <button type="button" className="hs-button-link" onClick={handleOpenSuggestedLibrary} style={{ marginRight: '15px' }}>
                     <BookOpen size={14} /> Adicionar da Biblioteca
                   </button>
                   <button type="button" className="hs-button-link" onClick={handleAddGroup}>+ Criar Novo Grupo</button>
                 </div>
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
              )}
              {activeModalTab === 'table' && (
                <div className="field-table-container">
                 <div className="form-section field-table-view animate-in">
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
                                         title="Excluir todos os campos selecionados"
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
                             <button type="button" className="hs-button-link" onClick={() => setIsFieldImportModalOpen(true)}>
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
                                             <p>Nenhum campo encontrado para "{tableSearch}"</p>
                                         </td>
                                     </tr>
                                 )}
                             </tbody>
                         </table>
                     </div>
                 </div>
                </div>
               )}
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

      <Modal 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        title="Biblioteca de Modelos Globais"
        size="large"
      >
        <div className="template-library">
          <p className="library-intro">Escolha um modelo pronto para importar para seu workspace. Você poderá personalizá-lo livremente após a importação.</p>
          
          {loadingTemplates ? (
            <div className="library-loading">
              <RefreshCw size={24} className="spinner" />
              <span>Carregando biblioteca...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="library-empty">
              <AlertCircle size={32} />
              <p>Nenhum modelo disponível no momento.</p>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map(tmpl => (
                <div key={tmpl.id} className="template-card-lite">
                   <div className="tmpl-icon" style={{ backgroundColor: tmpl.color + '20', color: tmpl.color }}>
                      <Code size={18} />
                   </div>
                   <div className="tmpl-info">
                      <h4>{tmpl.label}</h4>
                      <p>{tmpl.field_definitions?.length || 0} campos inclusos</p>
                   </div>
                   {tmpl.is_installed ? (
                     <div className="installed-badge">
                       <CheckSquare size={14} /> Instalado
                     </div>
                   ) : (
                     <button 
                       className="hs-button-secondary hs-button-sm" 
                       onClick={() => handleImportTemplate(tmpl.id)}
                       disabled={isImporting === tmpl.id}
                     >
                       {isImporting === tmpl.id ? 'Importando...' : <><Download size={14} /> Importar</>}
                     </button>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isSuggestedLibraryOpen}
        onClose={() => setIsSuggestedLibraryOpen(false)}
        title="Campos Sugeridos pela Biblioteca"
        size="medium"
      >
        <div className="suggested-fields-library">
            <p className="library-intro">Estes campos foram definidos no modelo global e estão disponíveis para importação imediata.</p>
            
            {loadingSuggested ? (
                <div className="library-loading">
                    <RefreshCw size={24} className="spinner" />
                    <span>Buscando sugestões...</span>
                </div>
            ) : suggestedFields.length === 0 ? (
                <div className="library-empty">
                    <CheckSquare size={32} />
                    <p>Todos os campos globais já estão instalados para este objeto.</p>
                </div>
            ) : (
                <div className="suggested-list">
                    {suggestedFields.map(field => (
                        <div key={field.id} className="suggested-field-item">
                            <div className="field-info">
                                <div className="field-type-icon">
                                    {field.field_type === 'number' ? <Hash size={16} /> : <AlignLeft size={16} />}
                                </div>
                                <div className="field-text">
                                    <span className="field-label">{field.label}</span>
                                    <span className="field-group-name">{field.group_id || 'Geral'}</span>
                                </div>
                            </div>
                            <button 
                                type="button"
                                className="hs-button-secondary hs-button-sm"
                                onClick={() => handleImportSuggestedField(field.id)}
                                disabled={isImportingField === field.id}
                            >
                                {isImportingField === field.id ? 'Importando...' : 'Adicionar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
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

      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title={`Sincronizar Atualizações: ${syncingType?.label}`}
        size="medium"
      >
        <div className="sync-modal-content">
            <p className="intro" style={{ marginBottom: '15px', color: 'var(--hs-text-secondary)' }}>
                Os seguintes campos foram alterados no modelo global <strong>{typeUpdates[syncingType?.id]?.template_name}</strong>. 
                Selecione quais deseja atualizar localmente:
            </p>
            
            <div className="diff-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                {typeUpdates[syncingType?.id]?.diffs.map((diff, idx) => (
                    <div key={idx} className="diff-item" style={{ border: '1px solid var(--hs-border)', borderRadius: '8px', padding: '12px' }}>
                        <label className="hs-checkbox" style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={selectedSyncFields.includes(diff.source_field_id)}
                                onChange={e => {
                                    if (e.target.checked) setSelectedSyncFields([...selectedSyncFields, diff.source_field_id]);
                                    else setSelectedSyncFields(selectedSyncFields.filter(id => id !== diff.source_field_id));
                                }}
                                style={{ marginTop: '3px', marginRight: '10px' }}
                            />
                            <div className="diff-details" style={{ flex: 1 }}>
                                <span className="diff-label" style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>{diff.field_label}</span>
                                <div className="diff-changes" style={{ fontSize: '12px', color: 'var(--hs-text-light)' }}>
                                    {Object.entries(diff.changes).map(([key, change]) => (
                                        <div key={key} className="change-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span className="attr" style={{ color: 'var(--hs-text-secondary)', minWidth: '80px' }}>{key}:</span>
                                            <span className="old" style={{ textDecoration: 'line-through', color: 'var(--hs-red)' }}>{String(change.local)}</span>
                                            <ChevronRight size={10} />
                                            <span className="new" style={{ color: 'var(--hs-green)', fontWeight: '500' }}>{String(change.global)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </label>
                    </div>
                ))}
            </div>

            <div className="sync-warning" style={{ marginTop: '20px', padding: '12px', backgroundColor: '#fff9e6', border: '1px solid #ffeeba', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <AlertCircle size={20} color="#856404" />
                <span style={{ fontSize: '13px', color: '#856404' }}>A sincronização atualizará as configurações do campo selecionado. Dados existentes não serão perdidos, mas o comportamento do formulário pode mudar.</span>
            </div>

            <div className="actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="hs-button-secondary" onClick={() => setIsSyncModalOpen(false)}>Cancelar</button>
                <button 
                    className="hs-button-primary" 
                    onClick={handleApplySync}
                    disabled={isApplyingSync || selectedSyncFields.length === 0}
                >
                    {isApplyingSync ? 'Sincronizando...' : 'Aplicar Atualizações Selecionadas'}
                </button>
            </div>
        </div>
      </Modal>

      <FieldImportModal 
        isOpen={isFieldImportModalOpen}
        onClose={() => setIsFieldImportModalOpen(false)}
        onFieldsImported={handleFieldsImported}
      />
    </div>
  );
};

export default WorkItemTypeSettings;
