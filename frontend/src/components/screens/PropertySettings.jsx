import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Plus, Edit, Trash2, Shield, RefreshCw, AlertCircle, GripVertical, Search, X } from 'lucide-react';
import './PropertySettings.css';
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
import { ToastProvider } from '../common/Toast';

// --- Sortable Components ---

const SortableItem = ({ id, children, isSystem }) => {
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
    background: isDragging ? '#f5f8fa' : (isSystem ? '#fafbfc' : 'white')
  };

  return (
    <tr ref={setNodeRef} style={style} className={isSystem ? 'system-prop' : ''}>
      {!isSystem && (
        <td className="drag-handle-cell">
          <button className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={14} />
          </button>
        </td>
      )}
      {isSystem && <td className="drag-handle-cell"></td>}
      {children}
    </tr>
  );
};

const SortableGroup = ({ id, group, props, onEdit, onDelete, onRenameGroup, isGlobalMode }) => {
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
    <div ref={isGlobalMode ? null : setNodeRef} style={style} className="property-group-card">
      <div className="group-header">
        <div className="group-title-area">
          {!isGlobalMode && (
            <button className="group-drag-handle" {...attributes} {...listeners}>
              <GripVertical size={16} />
            </button>
          )}
          {isGlobalMode ? (
            <h3>Pool Global de Propriedades</h3>
          ) : (
            <input 
              className="inline-group-input"
              value={group}
              onChange={(e) => onRenameGroup(id, e.target.value)}
              title="Clique para renomear"
            />
          )}
          <span className="count-badge">{props.length} campos</span>
        </div>
      </div>
      <div className="props-table-wrapper hs-scroll-x">
        <SortableContext items={props.map(p => `prop-${p.id}`)} strategy={verticalListSortingStrategy}>
          <table className="props-table">
            <thead>
              <tr>
                {!isGlobalMode && <th style={{ width: '30px' }}></th>}
                <th>Rótulo (Label)</th>
                <th>Nome Interno</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {props.map(prop => {
                const content = (
                  <>
                    <td className="drag-handle-cell">
                      {!prop.is_system && !isGlobalMode && (
                        <SortableHandle id={`prop-${prop.id}`} />
                      )}
                    </td>
                    <td>
                      <div className="label-cell">
                        {prop.label}
                        {prop.is_system && <Shield size={12} className="system-icon" title="Propriedade de Sistema" />}
                      </div>
                    </td>
                    <td><code>{prop.name}</code></td>
                    <td>
                      <span className={`type-badge ${prop.type}`}>
                        {prop.type}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="icon-btn edit" onClick={() => onEdit(prop)} title="Editar">
                        <Edit size={14} />
                      </button>
                      {!prop.is_system && (
                        <button className="icon-btn delete" onClick={() => onDelete(prop)} title={isGlobalMode ? "Excluir Globalmente" : "Desvincular"}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </>
                );
                
                if (isGlobalMode) {
                   return (
                     <tr key={prop.id} className={prop.is_system ? 'system-prop' : ''}>
                       {content}
                     </tr>
                   );
                }

                return (
                  <SortableItem key={prop.id} id={`prop-${prop.id}`} isSystem={prop.is_system}>
                    {content}
                  </SortableItem>
                );
              })}
            </tbody>
          </table>
        </SortableContext>
      </div>
    </div>
  );
};

const SortableHandle = ({ id }) => {
    const { attributes, listeners } = useSortable({ id });
    return (
        <button className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={14} />
        </button>
    );
};
;

// --- Options Manager Component ---

const OptionsManager = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const options = useMemo(() => value ? value.split(';').filter(x => x) : [], [value]);

  const addOption = () => {
    if (!inputValue.trim()) return;
    if (options.includes(inputValue.trim())) {
      setInputValue('');
      return;
    }
    onChange([...options, inputValue.trim()].join(';'));
    setInputValue('');
  };

  const removeOption = (opt) => {
    onChange(options.filter(x => x !== opt).join(';'));
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
          className="hs-input"
        />
        <button type="button" className="hs-button-secondary hs-button-sm" onClick={addOption}>
          <Plus size={14} />
        </button>
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

// --- Main Component ---

const PropertySettings = () => {
  return (
    <ToastProvider>
      <PropertySettingsInner />
    </ToastProvider>
  );
};

const PropertySettingsInner = () => {
  const { addToast } = useToast();
  const { fetchWithAuth } = useAuth();
  // ... rest of the code ...
  const [activeTab, setActiveTab] = useState('contact'); // contact, company, global
  const [properties, setProperties] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '', label: '', type: 'text', group: 'Outros', group_id: null, options: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [otherProperties, setOtherProperties] = useState([]);
  const [selectedPropsToShare, setSelectedPropsToShare] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermShare, setSearchTermShare] = useState('');
  const [selectedGroupShare, setSelectedGroupShare] = useState('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (activeTab === 'global') {
        const res = await fetchWithAuth('http://localhost:8000/properties/definitions');
        const data = await res.json();
        setProperties(data);
        setGroups([]);
      } else {
        const [groupsRes, propsRes] = await Promise.all([
          fetchWithAuth('http://localhost:8000/properties/groups'),
          fetchWithAuth(`http://localhost:8000/properties/entity/${activeTab}`)
        ]);
        const groupsData = await groupsRes.json();
        const propsData = await propsRes.json();
        
        setGroups(groupsData);
        setProperties(propsData.map(link => ({
          ...link.property_def,
          link_id: link.id,
          group_id: link.group_id,
          order: link.order,
          is_required: link.is_required
        })));
      }
    } catch (err) {
      console.error("Erro ao carregar propriedades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAll(); 
  }, [activeTab]);

  const groupedProps = useMemo(() => {
    let baseProps = properties;
    if (searchTerm) {
      baseProps = baseProps.filter(p => 
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeTab === 'global') return { 'global': baseProps };
    
    return groups.reduce((acc, g) => {
      const filteredGroupProps = baseProps.filter(p => p.group_id === g.id).sort((a, b) => a.order - b.order);
      if (!searchTerm || filteredGroupProps.length > 0) {
        acc[g.id] = filteredGroupProps;
      }
      return acc;
    }, {});
  }, [properties, groups, activeTab, searchTerm]);

  const handleOpenCreate = () => {
    setModalType('create');
    const defaultGroup = groups[0] || { name: 'Outros', id: null };
    setFormData({ name: '', label: '', type: 'text', group: defaultGroup.name || 'Outros', group_id: defaultGroup.id, options: '' });
    setSelectedProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prop) => {
    setModalType('edit');
    const matchedGroup = groups.find(g => g.id === prop.group_id);
    setFormData({
      name: prop.name, label: prop.label, type: prop.type, 
      group: matchedGroup ? matchedGroup.name : 'Outros', 
      group_id: prop.group_id, options: prop.options || ''
    });
    setSelectedProperty(prop);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalGroupId = formData.group_id;
      
      if (activeTab !== 'global') {
         const existingGroup = groups.find(g => g.name === formData.group);
         if (!existingGroup) {
           const groupRes = await fetchWithAuth('http://localhost:8000/properties/groups', {
             method: 'POST',
             body: JSON.stringify({ name: formData.group })
           });
           const newGroup = await groupRes.json();
           finalGroupId = newGroup.id;
         } else {
           finalGroupId = existingGroup.id;
         }
      }

      if (modalType === 'create') {
        const globalRes = await fetchWithAuth('http://localhost:8000/properties/definitions', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ name: formData.name, label: formData.label, type: formData.type, options: formData.options })
        });
        const newGlobalProp = await globalRes.json();
        if (!globalRes.ok) throw new Error(newGlobalProp.detail || "Erro ao criar");

        if (activeTab !== 'global') {
           await fetchWithAuth(`http://localhost:8000/properties/entity/${activeTab}/link`, {
             method: 'POST',
             body: JSON.stringify({ property_id: newGlobalProp.id, group_id: finalGroupId, order: 0 })
           });
        }
      } else {
         await fetchWithAuth(`http://localhost:8000/properties/definitions/${selectedProperty.id}`, {
           method: 'PUT',
           body: JSON.stringify({ name: formData.name, label: formData.label, type: formData.type, options: formData.options })
         });
         
         if (activeTab !== 'global' && selectedProperty.link_id) {
           await fetchWithAuth(`http://localhost:8000/properties/entity/link/${selectedProperty.link_id}`, {
             method: 'PUT',
             body: JSON.stringify({ group_id: finalGroupId, is_required: selectedProperty.is_required })
           });
         }
      }

      setIsModalOpen(false);
      fetchAll();
      addToast(`Propriedade ${modalType === 'create' ? 'criada' : 'atualizada'} com sucesso!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenShare = async () => {
    try {
      // Carregar todas as globais + os links da OUTRA entidade para saber os grupos
      const otherEntity = activeTab === 'contact' ? 'company' : 'contact';
      const [globalRes, otherLinksRes] = await Promise.all([
        fetchWithAuth(`http://localhost:8000/properties/definitions`),
        fetchWithAuth(`http://localhost:8000/properties/entity/${otherEntity}`)
      ]);
      
      const allGlobalProps = await globalRes.json();
      const otherLinks = await otherLinksRes.json();
      
      // Filtrar as que já estão vinculadas na entidade atual
      const availableToShare = allGlobalProps.filter(p => !properties.some(linked => linked.id === p.id) && !p.is_system);
      
      // Mapear propriedades para seus grupos na outra entidade (se existirem)
      const propsWithGroupInfo = availableToShare.map(p => {
        const link = otherLinks.find(l => l.property_id === p.id);
        return {
          ...p,
          other_group: link && link.group ? link.group.name : 'Outros',
          other_group_id: link ? link.group_id : null
        };
      });

      setOtherProperties(propsWithGroupInfo);
      setSelectedPropsToShare([]);
      setSearchTermShare('');
      setSelectedGroupShare('all');
      setIsShareModalOpen(true);
    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar propriedades para vínculo', 'error');
    }
  };

  const filteredOtherProps = useMemo(() => {
    let result = otherProperties;
    if (searchTermShare) {
      const term = searchTermShare.toLowerCase();
      result = result.filter(p => p.label.toLowerCase().includes(term) || p.name.toLowerCase().includes(term));
    }
    if (selectedGroupShare !== 'all') {
      result = result.filter(p => p.other_group === selectedGroupShare);
    }
    return result;
  }, [otherProperties, searchTermShare, selectedGroupShare]);

  const otherGroups = useMemo(() => {
     const groupsSet = new Set(otherProperties.map(p => p.other_group));
     return Array.from(groupsSet).sort();
  }, [otherProperties]);

  const toggleSelectGroup = (groupName) => {
    const groupProps = otherProperties.filter(p => p.other_group === groupName).map(p => p.id);
    const allSelected = groupProps.every(id => selectedPropsToShare.includes(id));
    
    if (allSelected) {
      // Remove todos do grupo
      setSelectedPropsToShare(prev => prev.filter(id => !groupProps.includes(id)));
    } else {
      // Adiciona todos do grupo (sem duplicar)
      setSelectedPropsToShare(prev => [...new Set([...prev, ...groupProps])]);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (selectedPropsToShare.length === 0) return;
    setIsSaving(true);
    try {
      const groupToUse = groups[0] ? groups[0].id : null;
      for (let pId of selectedPropsToShare) {
         await fetchWithAuth(`http://localhost:8000/properties/entity/${activeTab}/link`, {
            method: 'POST',
            body: JSON.stringify({ property_id: pId, group_id: groupToUse, order: 0 })
         });
      }
      setIsShareModalOpen(false);
      fetchAll();
      addToast(`${selectedPropsToShare.length} propriedades vinculadas com sucesso!`);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameGroup = async (id, newName) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: newName } : g));
    try {
      await fetchWithAuth(`http://localhost:8000/properties/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName })
      });
    } catch (err) {
      console.error("Erro ao renomear grupo:", err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. Reordenação de Grupos
    if (active.id.toString().startsWith('group-') && over.id.toString().startsWith('group-')) {
        const oldId = parseInt(active.id.toString().replace('group-', ''));
        const overId = parseInt(over.id.toString().replace('group-', ''));
        
        const oldIndex = groups.findIndex(g => g.id === oldId);
        const newIndex = groups.findIndex(g => g.id === overId);
        
        const newGroups = arrayMove(groups, oldIndex, newIndex);
        setGroups(newGroups);

        const orders = newGroups.map((g, index) => ({ id: g.id, order: index }));
        await fetchWithAuth('http://localhost:8000/properties/groups/reorder', {
            method: 'POST',
            body: JSON.stringify(orders)
        });
        return;
    }

    // 2. Reordenação de Propriedades
    if (active.id.toString().startsWith('prop-')) {
        const activeId = parseInt(active.id.toString().replace('prop-', ''));
        const property = properties.find(p => p.id === activeId);
        if (!property) return;

        let targetGroupId = property.group_id;
        let isOverAnotherProp = over.id.toString().startsWith('prop-');

        if (isOverAnotherProp) {
            const overPropId = parseInt(over.id.toString().replace('prop-', ''));
            const overProp = properties.find(p => p.id === overPropId);
            targetGroupId = overProp ? overProp.group_id : targetGroupId;
        } else if (over.id.toString().startsWith('group-')) {
            targetGroupId = parseInt(over.id.toString().replace('group-', ''));
        }

        // Se mudou de grupo, atualizar vínculo no backend
        if (targetGroupId !== property.group_id) {
            try {
                await fetchWithAuth(`http://localhost:8000/properties/entity/link/${property.link_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ group_id: targetGroupId, is_required: property.is_required })
                });
                // Atualizar localmente
                setProperties(prev => prev.map(p => p.id === activeId ? { ...p, group_id: targetGroupId } : p));
            } catch (err) {
                console.error("Erro ao mover propriedade:", err);
            }
        }

        // Se houver reordenação (mesmo grupo ou após mover de grupo)
        if (isOverAnotherProp) {
            const overPropId = parseInt(over.id.toString().replace('prop-', ''));
            const groupProps = properties.filter(p => p.group_id === targetGroupId).sort((a, b) => a.order - b.order);
            
            const oldIndex = groupProps.findIndex(p => p.id === activeId);
            const newIndex = groupProps.findIndex(p => p.id === overPropId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newGroupProps = arrayMove(groupProps, oldIndex, newIndex);
                
                // Atualizar estado local para refletir a nova ordem no grupo
                setProperties(prev => {
                    const others = prev.filter(p => p.group_id !== targetGroupId || !newGroupProps.some(np => np.id === p.id));
                    return [...others, ...newGroupProps];
                });

                // Salvar ordens no backend
                const orders = newGroupProps.map((p, index) => ({ id: p.link_id, order: index }));
                await fetchWithAuth(`http://localhost:8000/properties/entity/reorder`, {
                    method: 'POST',
                    body: JSON.stringify(orders)
                });
            }
        }
    }
  };

  if (loading) return <div className="loading-container"><RefreshCw className="spinner" /><p>Carregando...</p></div>;

  return (
    <div className="settings-container">
      <div className="settings-header flex-column-mobile">
        <div className="header-left flex-column-mobile">
          <h2>Definições de Propriedades</h2>
          <div className="search-container">
             <div className="search-input-wrapper">
               <Search size={16} className="search-icon" />
               <input 
                 type="text" 
                 placeholder="Pesquisar propriedades..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="hs-input search-input"
               />
               {searchTerm && (
                  <button className="clear-search-btn" onClick={() => setSearchTerm('')}><X size={14} /></button>
               )}
             </div>
          </div>
        </div>
        <div className="header-actions flex-wrap w-full-mobile">
          {activeTab !== 'global' && (
             <button className="hs-button-secondary" onClick={handleOpenShare}>
               Vincular Existente
             </button>
          )}
          <button className="hs-button-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Nova Propriedade
          </button>
        </div>
      </div>

      <div className="tabs-container hs-scroll-x">
        <button 
          className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`} 
          onClick={() => setActiveTab('contact')}
        >
          Contatos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`} 
          onClick={() => setActiveTab('company')}
        >
          Empresas
        </button>
        <button 
          className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`} 
          onClick={() => setActiveTab('global')}
        >
          Central Global
        </button>
      </div>

      <div className="scroll-vessel">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {activeTab === 'global' ? (
             <div className="groups-list">
               <SortableGroup 
                    id="global" 
                    group="Global" 
                    props={groupedProps['global'] || []}
                    onEdit={handleOpenEdit}
                    onDelete={(p) => { setSelectedProperty(p); setIsDeleteModalOpen(true); }}
                    isGlobalMode={true}
                  />
             </div>
          ) : (
            <SortableContext items={groups.map(g => `group-${g.id}`)} strategy={verticalListSortingStrategy}>
              <div className="groups-list">
                {groups.map(g => {
                  const groupProps = groupedProps[g.id];
                  if (!groupProps) return null;
                  
                  return (
                    <SortableGroup 
                      key={g.id} 
                      id={`group-${g.id}`} 
                      group={g.name} 
                      props={groupProps}
                      onEdit={handleOpenEdit}
                      onDelete={(p) => { setSelectedProperty(p); setIsDeleteModalOpen(true); }}
                      onRenameGroup={handleRenameGroup}
                      isGlobalMode={false}
                    />
                  );
                })}
                {searchTerm && Object.keys(groupedProps).length === 0 && (
                  <div className="no-results">
                    <AlertCircle size={48} />
                    <p>Nenhuma propriedade encontrada para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            </SortableContext>
          )}
        </DndContext>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Propriedade">
        <form onSubmit={handleSubmit} className="prop-form">
          {modalType === 'edit' && (
            <div className="form-group">
              <label>Nome Interno</label>
              <input type="text" className="hs-input" disabled value={formData.name} />
            </div>
          )}
          <div className="form-group">
            <label>Rótulo</label>
            <input 
              type="text" 
              className="hs-input" 
              required 
              value={formData.label} 
              onChange={e => {
                const label = e.target.value;
                const update = { label };
                if (modalType === 'create') {
                  update.name = slugify(label);
                }
                setFormData(prev => ({...prev, ...update}));
              }} 
            />
          </div>
          {activeTab !== 'global' && (
             <div className="form-group">
               <label>Grupo (Escolha ou digite um novo)</label>
               <input list="group-options" className="hs-input" type="text" required value={formData.group} 
                 onChange={e => setFormData({...formData, group: e.target.value})} />
               <datalist id="group-options">
                 {groups.map(g => <option key={g.id} value={g.name} />)}
               </datalist>
             </div>
          )}
          <div className="form-group">
            <label>Tipo de Dado</label>
            <select className="hs-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="text">Texto</option>
              <option value="textarea">Texto Longo</option>
              <option value="select">Seleção (Dropdown)</option>
              <option value="multiselect">Multi-seleção</option>
              <option value="email">E-mail</option>
              <option value="date">Data</option>
              <option value="number">Número</option>
              <option value="currency">Moeda</option>
              <option value="boolean">Booleano (Sim/Não)</option>
            </select>
          </div>
          {(formData.type === 'select' || formData.type === 'multiselect') && (
            <div className="form-group">
              <label>Opções (Separadas por ponto e vírgula)</label>
              <OptionsManager value={formData.options} onChange={val => setFormData({...formData, options: val})} />
            </div>
          )}
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="hs-button-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Propriedade'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        <div className="delete-confirm">
          <p>Tem certeza que deseja {activeTab === 'global' ? 'excluir permanentemente' : 'desvincular'} a propriedade <strong>{selectedProperty?.label}</strong>?</p>
          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button className="hs-button-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
            <button className="hs-button-primary" style={{ background: '#dc2626', border: '1px solid #dc2626' }} 
              onClick={async () => {
              setIsDeleting(true);
              try {
                if (activeTab === 'global') {
                   await fetchWithAuth(`http://localhost:8000/properties/definitions/${selectedProperty.id}`, { method: 'DELETE' });
                } else {
                   await fetchWithAuth(`http://localhost:8000/properties/entity/link/${selectedProperty.link_id}`, { method: 'DELETE' });
                }
                setIsDeleteModalOpen(false);
                fetchAll();
                addToast(`Propriedade ${activeTab === 'global' ? 'excluída' : 'desvinculada'} com sucesso!`);
              } catch (err) {
                addToast(err.message, 'error');
              } finally {
                setIsDeleting(false);
              }
            }}>Sim, Confirmar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Vincular Propriedades Existentes" size="large">
        <div className="share-modal-content">
          <p className="share-intro">Selecione propriedades já cadastradas no sistema para adicionar ao grupo <strong>{groups.find(g => g.id === formData.group_id)?.name || 'Outros'}</strong> de <strong>{activeTab === 'contact' ? 'Contatos' : 'Empresas'}</strong>.</p>
          
          <div className="share-filters">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Buscar por rótulo..." 
                value={searchTermShare}
                onChange={e => setSearchTermShare(e.target.value)}
              />
            </div>
            <select 
              className="hs-select filter-select"
              value={selectedGroupShare}
              onChange={e => setSelectedGroupShare(e.target.value)}
            >
              <option value="all">Todos os Grupos</option>
              {otherGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="share-groups-list">
            {otherGroups.filter(g => selectedGroupShare === 'all' || selectedGroupShare === g).map(groupName => {
              const groupProps = filteredOtherProps.filter(p => p.other_group === groupName);
              if (groupProps.length === 0) return null;
              
              const isAllSelected = groupProps.every(p => selectedPropsToShare.includes(p.id));

              return (
                <div key={groupName} className="share-group-section">
                  <div className="share-group-header">
                    <h4>{groupName}</h4>
                    <button 
                      type="button" 
                      className={`hs-button-link ${isAllSelected ? 'selected' : ''}`}
                      onClick={() => toggleSelectGroup(groupName)}
                    >
                      {isAllSelected ? 'Desmarcar Grupo' : 'Selecionar Grupo'}
                    </button>
                  </div>
                  <div className="share-props-grid">
                    {groupProps.map(prop => (
                      <label key={prop.id} className={`share-prop-card ${selectedPropsToShare.includes(prop.id) ? 'selected' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={selectedPropsToShare.includes(prop.id)}
                          onChange={() => {
                            setSelectedPropsToShare(prev => 
                              prev.includes(prop.id) ? prev.filter(id => id !== prop.id) : [...prev, prop.id]
                            );
                          }}
                        />
                        <div className="prop-info">
                          <span className="prop-label">{prop.label}</span>
                          <span className="prop-name">{prop.name}</span>
                        </div>
                        <span className="prop-type-badge">{prop.type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {filteredOtherProps.length === 0 && (
              <div className="no-share-results">
                <AlertCircle size={32} />
                <p>Nenhuma propriedade encontrada para o filtro selecionado.</p>
              </div>
            )}
          </div>
          
          <div className="form-actions sticky-footer">
            <button className="hs-button-secondary" onClick={() => setIsShareModalOpen(false)}>Cancelar</button>
            <button 
              className="hs-button-primary" 
              onClick={handleShareSubmit} 
              disabled={selectedPropsToShare.length === 0 || isSaving}
            >
              {isSaving ? 'Vinculando...' : `Vincular ${selectedPropsToShare.length} ${selectedPropsToShare.length === 1 ? 'Propriedade' : 'Propriedades'}`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


export default PropertySettings;
