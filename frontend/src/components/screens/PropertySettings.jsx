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

const SortableGroup = ({ id, group, props, onEdit, onDelete, onDragEndProps }) => {
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
    <div ref={setNodeRef} style={style} className="property-group-card">
      <div className="group-header">
        <div className="group-title-area">
          <button className="group-drag-handle" {...attributes} {...listeners}>
            <GripVertical size={16} />
          </button>
          <h3>{group}</h3>
          <span className="count-badge">{props.length} campos</span>
        </div>
      </div>
      <div className="props-table-wrapper">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndProps}>
          <SortableContext items={props.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <table className="props-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Rótulo (Label)</th>
                  <th>Nome Interno</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {props.map(prop => (
                  <SortableItem key={prop.id} id={prop.id} isSystem={prop.is_system}>
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
                        <button className="icon-btn delete" onClick={() => onDelete(prop)} title="Excluir">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </SortableItem>
                ))}
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
  const [activeTab, setActiveTab] = useState('contact');
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [propsRes, groupsRes] = await Promise.all([
        fetch(`http://localhost:8000/properties/?entity_type=${activeTab}`),
        fetch('http://localhost:8000/properties/groups')
      ]);
      const propsData = await propsRes.json();
      const groupsData = await groupsRes.json();
      setProperties(propsData);
      setGroups(groupsData);
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
    setFormData({ name: '', label: '', type: 'text', group: defaultGroup.name, group_id: defaultGroup.id, options: '' });
    setSelectedProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prop) => {
    setModalType('edit');
    setFormData({
      name: prop.name, label: prop.label, type: prop.type, group: prop.group, group_id: prop.group_id, options: prop.options || ''
    });
    setSelectedProperty(prop);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalGroupId = formData.group_id;
      
      // Se o nome do grupo mudou ou é novo, verificar se já existe ou criar
      const existingGroup = groups.find(g => g.name === formData.group);
      if (!existingGroup) {
        const groupRes = await fetch('http://localhost:8000/properties/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.group })
        });
        const newGroup = await groupRes.json();
        finalGroupId = newGroup.id;
        setGroups(prev => [...prev, newGroup]);
      } else {
        finalGroupId = existingGroup.id;
      }

      const submissionData = { ...formData, group_id: finalGroupId, entity_type: activeTab };
      const url = modalType === 'create' 
        ? 'http://localhost:8000/properties/' 
        : `http://localhost:8000/properties/${selectedProperty.id}`;
      
      const response = await fetch(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) throw new Error('Falha ao salvar');
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEndGroups = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex(g => g.id === active.id);
    const newIndex = groups.findIndex(g => g.id === over.id);
    const newGroups = arrayMove(groups, oldIndex, newIndex);
    setGroups(newGroups);

    // Persistir ordem
    const orders = newGroups.map((g, index) => ({ id: g.id, order: index }));
    await fetch('http://localhost:8000/properties/groups/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
  };

  const handleDragEndProps = async (event, groupId) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const gProps = properties.filter(p => p.group_id === groupId);
    const otherProps = properties.filter(p => p.group_id !== groupId);
    
    const oldIndex = gProps.findIndex(p => p.id === active.id);
    const newIndex = gProps.findIndex(p => p.id === over.id);
    const reorderedGroupProps = arrayMove(gProps, oldIndex, newIndex);
    
    // Atualizar ordens locais para persistência
    const reorderedWithOrders = reorderedGroupProps.map((p, i) => ({ ...p, order: i }));
    const newProperties = [...otherProps, ...reorderedWithOrders];
    setProperties(newProperties);

    // Persistir ordem
    const orders = reorderedWithOrders.map(p => ({ id: p.id, order: p.order }));
    await fetch('http://localhost:8000/properties/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orders)
    });
  };

  const groupedProps = useMemo(() => {
    return groups.reduce((acc, g) => {
      acc[g.id] = properties.filter(p => p.group_id === g.id).sort((a, b) => a.order - b.order);
      return acc;
    }, {});
  }, [properties, groups]);

  if (loading) return <div className="loading-container"><RefreshCw className="spinner" /><p>Carregando...</p></div>;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-info">
          <h2>Definições de Propriedades</h2>
          <p>Gerencie os campos personalizados. Arraste para reordenar grupos e campos.</p>
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Nova Propriedade
        </button>
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
      </div>

      <div className="scroll-vessel">
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
          <div className="form-group">
            <label>Grupo (Escolha ou digite um novo)</label>
            <input list="group-options" type="text" required value={formData.group} 
              onChange={e => setFormData({...formData, group: e.target.value})} />
            <datalist id="group-options">
              {groups.map(g => <option key={g.id} value={g.name} />)}
            </datalist>
          </div>
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

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir">
        <div className="delete-confirm">
          <p>Excluir <strong>{selectedProperty?.label}</strong>?</p>
          <div className="form-actions">
            <button onClick={() => setIsDeleteModalOpen(false)}>Não</button>
            <button onClick={async () => {
              setIsDeleting(true);
              await fetch(`http://localhost:8000/properties/${selectedProperty.id}`, { method: 'DELETE' });
              setIsDeleteModalOpen(false);
              setIsDeleting(false);
              fetchAll();
            }}>Sim, Excluir</button>
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
      `}</style>
    </div>
  );
};

export default PropertySettings;
