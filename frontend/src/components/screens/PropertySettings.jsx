import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Plus, Edit, Trash2, Shield, RefreshCw, AlertCircle, GripVertical } from 'lucide-react';
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
      <td className="drag-handle-cell">
        <button className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={14} />
        </button>
      </td>
      {children}
    </tr>
  );
};

const SortableGroup = ({ id, group, props, onEdit, onDelete, onDragEndProps, onRenameGroup, isGlobalMode }) => {
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
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div ref={isGlobalMode ? null : setNodeRef} style={style} className="property-group-card">
      {!isGlobalMode && (
        <div className="group-header">
          <div className="group-title-area">
            <button className="group-drag-handle" {...attributes} {...listeners}>
              <GripVertical size={16} />
            </button>
            <h3>{group}</h3>
            <button className="icon-btn edit-group-btn" onClick={() => onRenameGroup(id, group)} title="Renomear Grupo">
              <Edit size={14} />
            </button>
            <span className="count-badge">{props.length} campos</span>
          </div>
        </div>
      )}
      {isGlobalMode && (
         <div className="group-header">
            <h3>Pool Global de Propriedades</h3>
            <span className="count-badge">{props.length} campos (Sem agrupamento)</span>
         </div>
      )}
      <div className="props-table-wrapper">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndProps}>
          <SortableContext items={props.map(p => p.id)} strategy={verticalListSortingStrategy}>
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
                    <SortableItem key={prop.id} id={prop.id} isSystem={prop.is_system}>
                      {content}
                    </SortableItem>
                  );
                })}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

// --- Main Component ---

const PropertySettings = () => {
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
  const [isRenameGroupModalOpen, setIsRenameGroupModalOpen] = useState(false);
  const [selectedGroupForRename, setSelectedGroupForRename] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [otherProperties, setOtherProperties] = useState([]);
  const [selectedPropsToShare, setSelectedPropsToShare] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchAll = async () => {
    try {
      setLoading(true);
      if (activeTab === 'global') {
        const propsRes = await fetch('http://localhost:8000/properties/global');
        const propsData = await propsRes.json();
        setProperties(propsData);
        setGroups([]); // Sem grupos no global
      } else {
        const [propsRes, groupsRes] = await Promise.all([
          fetch(`http://localhost:8000/properties/entity/${activeTab}`),
          fetch('http://localhost:8000/properties/groups')
        ]);
        const linksData = await propsRes.json();
        const groupsData = await groupsRes.json();
        
        const mappedProps = linksData.map(link => ({
          ...link.property_def,
          link_id: link.id,
          group_id: link.group_id,
          order: link.order,
          is_required: link.is_required
        }));
        setProperties(mappedProps);
        setGroups(groupsData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [activeTab]);

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
      
      // Lógica de grupo apenas se não for global
      if (activeTab !== 'global') {
         const existingGroup = groups.find(g => g.name === formData.group);
         if (!existingGroup) {
           const groupRes = await fetch('http://localhost:8000/properties/groups', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ name: formData.group })
           });
           const newGroup = await groupRes.json();
           finalGroupId = newGroup.id;
         } else {
           finalGroupId = existingGroup.id;
         }
      }

      if (modalType === 'create') {
        const globalRes = await fetch('http://localhost:8000/properties/global', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ name: formData.name, label: formData.label, type: formData.type, options: formData.options })
        });
        const newGlobalProp = await globalRes.json();
        if (!globalRes.ok) throw new Error(newGlobalProp.detail || "Erro ao criar");

        if (activeTab !== 'global') {
           await fetch(`http://localhost:8000/properties/entity/${activeTab}/link`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ property_id: newGlobalProp.id, group_id: finalGroupId, order: 0 })
           });
        }
      } else {
         // Edição de Rótulo/Tipo Globalmente
         await fetch(`http://localhost:8000/properties/global/${selectedProperty.id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ label: formData.label, type: formData.type, options: formData.options })
         });
         
         // Atualização do vínculo se estivermos na aba de entidade
         if (activeTab !== 'global' && selectedProperty.link_id) {
           await fetch(`http://localhost:8000/properties/entity/link/${selectedProperty.link_id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ group_id: finalGroupId })
           });
         }
      }

      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenRenameGroup = (id, currentName) => {
    setSelectedGroupForRename(id);
    setNewGroupName(currentName);
    setIsRenameGroupModalOpen(true);
  };
  
  const handleRenameGroupSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/properties/groups/${selectedGroupForRename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      });
      if (!res.ok) throw new Error('Falha ao renomear grupo');
      setIsRenameGroupModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenShare = async () => {
    try {
      const res = await fetch(`http://localhost:8000/properties/global`);
      const allProps = await res.json();
      
      const availableToShare = allProps.filter(p => !properties.some(linked => linked.id === p.id) && !p.is_system);
      setOtherProperties(availableToShare);
      setSelectedPropsToShare([]);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (selectedPropsToShare.length === 0) return;
    setIsSaving(true);
    try {
      const groupToUse = groups[0] ? groups[0].id : null;
      for (let pId of selectedPropsToShare) {
         await fetch(`http://localhost:8000/properties/entity/${activeTab}/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ property_id: pId, group_id: groupToUse, order: 0 })
         });
      }
      setIsShareModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShareSelection = (id) => {
    setSelectedPropsToShare(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDragEndGroups = async (event) => {
    if (activeTab === 'global') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex(g => g.id === active.id);
    const newIndex = groups.findIndex(g => g.id === over.id);
    const newGroups = arrayMove(groups, oldIndex, newIndex);
    setGroups(newGroups);

    const orders = newGroups.map((g, index) => ({ id: g.id, order: index }));
    await fetch('http://localhost:8000/properties/groups/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
  };

  const handleDragEndProps = async (event, groupId) => {
    if (activeTab === 'global') return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gProps = properties.filter(p => p.group_id === groupId);
    const otherProps = properties.filter(p => p.group_id !== groupId);
    
    const oldIndex = gProps.findIndex(p => p.id === active.id);
    const newIndex = gProps.findIndex(p => p.id === over.id);
    const reorderedGroupProps = arrayMove(gProps, oldIndex, newIndex);
    
    const reorderedWithOrders = reorderedGroupProps.map((p, i) => ({ ...p, order: i }));
    const newProperties = [...otherProps, ...reorderedWithOrders];
    setProperties(newProperties);

    const orders = reorderedWithOrders.map(p => ({ id: p.link_id, order: p.order }));
    await fetch('http://localhost:8000/properties/entity/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
  };

  const groupedProps = useMemo(() => {
    if (activeTab === 'global') return { 'global': properties };
    return groups.reduce((acc, g) => {
      acc[g.id] = properties.filter(p => p.group_id === g.id).sort((a, b) => a.order - b.order);
      return acc;
    }, {});
  }, [properties, groups, activeTab]);

  if (loading) return <div className="loading-container"><RefreshCw className="spinner" /><p>Carregando...</p></div>;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-info">
          <h2>Definições de Propriedades</h2>
          <p>
            {activeTab === 'global' ? 
             "Central global de propriedades. Aqui não há divisão de grupos, todas as propriedades estão listadas." :
             `Gerencie os campos personalizados. Arraste para reordenar grupos e campos no módulo.`}
          </p>
        </div>
        <div className="header-actions">
          {activeTab !== 'global' && (
             <button className="hs-button-secondary" onClick={handleOpenShare}>
               Adicionar Existente
             </button>
          )}
          <button className="hs-button-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Nova Propriedade
          </button>
        </div>
      </div>

      <div className="tabs-container">
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndGroups}>
            <SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
              <div className="groups-list">
                {groups.map(g => (
                  <SortableGroup 
                    key={g.id} 
                    id={g.id} 
                    group={g.name} 
                    props={groupedProps[g.id] || []}
                    onEdit={handleOpenEdit}
                    onDelete={(p) => { setSelectedProperty(p); setIsDeleteModalOpen(true); }}
                    onDragEndProps={(e) => handleDragEndProps(e, g.id)}
                    onRenameGroup={handleOpenRenameGroup}
                    isGlobalMode={false}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Propriedade">
        <form onSubmit={handleSubmit} className="prop-form">
          <div className="form-group">
            <label>Nome Interno</label>
            <input type="text" disabled={modalType === 'edit'} required value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_')})} />
          </div>
          <div className="form-group">
            <label>Rótulo</label>
            <input type="text" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
          </div>
          {activeTab !== 'global' && (
             <div className="form-group">
               <label>Grupo (Escolha ou digite um novo)</label>
               <input list="group-options" type="text" required value={formData.group} 
                 onChange={e => setFormData({...formData, group: e.target.value})} />
               <datalist id="group-options">
                 {groups.map(g => <option key={g.id} value={g.name} />)}
               </datalist>
             </div>
          )}
          <div className="form-group">
            <label>Tipo de Dado</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="text">Texto</option>
              <option value="textarea">Texto Longo</option>
              <option value="select">Seleção</option>
              <option value="multiselect">Multi-seleção</option>
              <option value="email">E-mail</option>
              <option value="date">Data</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="hs-button-primary">{isSaving ? '...' : 'Salvar'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={activeTab === 'global' ? 'Excluir Definitivamente' : 'Desvincular Propriedade'}>
        <div className="delete-confirm">
          <p>
            {activeTab === 'global' ? 
              `ATENÇÃO: Você está prestando a excluir definitivamente a propriedade "${selectedProperty?.label}" de todo o sistema. Isso a removerá de todos os contatos e empresas vinculadas. Deseja continuar?` :
              `Desvincular a propriedade "${selectedProperty?.label}"? Ela deixará de aparecer neste módulo, mas os dados não serão apagados da base e ela continuará disponível na Central Global.`}
          </p>
          <div className="form-actions">
            <button onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
            <button onClick={async () => {
              setIsDeleting(true);
              if (activeTab === 'global') {
                 await fetch(`http://localhost:8000/properties/global/${selectedProperty.id}`, { method: 'DELETE' });
              } else {
                 await fetch(`http://localhost:8000/properties/entity/link/${selectedProperty.link_id}`, { method: 'DELETE' });
              }
              setIsDeleteModalOpen(false);
              setIsDeleting(false);
              fetchAll();
            }}>Sim, Confirmar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRenameGroupModalOpen} onClose={() => setIsRenameGroupModalOpen(false)} title="Renomear Grupo">
        <form onSubmit={handleRenameGroupSubmit} className="prop-form">
          <div className="form-group">
            <label>Nome do Grupo</label>
            <input type="text" required value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsRenameGroupModalOpen(false)}>Cancelar</button>
            <button type="submit" className="hs-button-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Adicionar Propriedade Existente">
        <div className="share-modal-content">
          <p>Selecione as propriedades globais que deseja vincular a este módulo.</p>
          <div className="share-list">
            {otherProperties.length === 0 ? (
              <p className="no-props">Não há novas propriedades globais para vincular.</p>
            ) : (
              otherProperties.map(p => (
                <label key={p.id} className="share-item">
                  <input 
                    type="checkbox" 
                    checked={selectedPropsToShare.includes(p.id)} 
                    onChange={() => toggleShareSelection(p.id)} 
                  />
                  <span>{p.label} <small>({p.type})</small></span>
                </label>
              ))
            )}
          </div>
          <div className="form-actions">
            <button className="hs-button-secondary" onClick={() => setIsShareModalOpen(false)}>Cancelar</button>
            <button className="hs-button-primary" onClick={handleShareSubmit} disabled={selectedPropsToShare.length === 0 || isSaving}>
              {isSaving ? '...' : 'Vincular Marcadas'}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .settings-container { padding: 32px; max-width: 1000px; margin: 0 auto; height: calc(100vh - 100px); display: flex; flex-direction: column; }
        .settings-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-shrink: 0; }
        .tabs-container { display: flex; gap: 16px; margin-bottom: 24px; border-bottom: 1px solid #cbd6e2; padding-bottom: 8px; flex-shrink: 0; }
        .tab-btn { background: none; border: none; font-size: 16px; font-weight: 500; color: #516f90; cursor: pointer; padding: 4px 8px; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab-btn:hover { color: #2d3e50; }
        .tab-btn.active { color: #2d3e50; border-bottom-color: #ff7a59; }
        .scroll-vessel { flex-grow: 1; overflow-y: auto; padding-right: 8px; }
        .groups-list { display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px; }
        .property-group-card { background: white; border: 1px solid #cbd6e2; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .group-header { background: #f5f8fa; padding: 12px 20px; border-bottom: 1px solid #cbd6e2; transition: background 0.2s; }
        .group-title-area { display: flex; align-items: center; gap: 12px; }
        .group-drag-handle { background: none; border: none; color: #cbd6e2; cursor: grab; padding: 4px; border-radius: 4px; }
        .group-drag-handle:hover { color: #516f90; background: #eaf0f6; }
        .edit-group-btn { background: none; border: none; color: #cbd6e2; cursor: pointer; padding: 4px; display: flex; align-items: center; border-radius: 4px; }
        .edit-group-btn:hover { color: #516f90; background: #eaf0f6; }
        .drag-handle { background: none; border: none; color: #cbd6e2; cursor: grab; display: flex; align-items: center; }
        .drag-handle:hover { color: #516f90; }
        .props-table { width: 100%; border-collapse: collapse; }
        .props-table th { text-align: left; padding: 12px 10px; font-size: 11px; text-transform: uppercase; color: #516f90; border-bottom: 1px solid #eaf0f6; }
        .props-table td { padding: 10px; border-bottom: 1px solid #eaf0f6; font-size: 14px; }
        .type-badge { font-size: 10px; background: #eaf0f6; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 700; }
        .hs-button-primary { background: #ff7a59; color: white; border: none; padding: 8px 16px; border-radius: 3px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .hs-button-secondary { background: white; border: 1px solid #cbd6e2; padding: 8px 16px; border-radius: 3px; font-weight: 600; cursor: pointer; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: #2d3e50; }
        .form-group input, .form-group select { padding: 8px; border: 1px solid #cbd6e2; border-radius: 4px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .share-modal-content p { margin-bottom: 16px; color: #516f90; }
        .share-list { max-height: 300px; overflow-y: auto; border: 1px solid #cbd6e2; border-radius: 4px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .share-item { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .share-item span { font-size: 14px; color: #2d3e50; }
        .share-item small { color: #879fb8; }
        .no-props { color: #879fb8; font-style: italic; }
      `}</style>
    </div>
  );
};

export default PropertySettings;
