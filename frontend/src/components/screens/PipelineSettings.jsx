import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, GripVertical, RefreshCw, Save, X, Layout, ChevronRight, ChevronDown } from 'lucide-react';
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

// --- Sortable Stage Item ---
const SortableStage = ({ stage, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id || `temp-${stage.name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="stage-item">
      <div className="stage-drag-handle" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <div className="stage-color" style={{ backgroundColor: stage.color }}></div>
      <div className="stage-info">
        <span className="stage-name">{stage.name}</span>
        {stage.is_final && <span className="stage-badge">Final</span>}
      </div>
      <div className="stage-actions">
        <button className="icon-btn" onClick={() => onEdit(stage)}><Edit size={14} /></button>
        <button className="icon-btn delete" onClick={() => onDelete(stage)}><Trash2 size={14} /></button>
      </div>
    </div>
  );
};

// --- Main Inner Component ---
const PipelineSettingsInner = ({ addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('contact'); // contact, company, deal
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // create, edit
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    entity_type: 'contact',
    stages: []
  });

  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(null);
  const [stageFormData, setStageFormData] = useState({
    name: '',
    color: '#3182CE',
    is_final: false
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/pipelines/');
      const data = await res.json();
      setPipelines(data);
    } catch (err) {
      console.error("Erro ao carregar pipelines:", err);
      addToast("Erro ao carregar pipelines", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const filteredPipelines = pipelines.filter(p => p.entity_type === activeTab);

  const handleOpenCreate = () => {
    setModalType('create');
    setFormData({
      name: '',
      entity_type: activeTab,
      stages: [
        { name: 'Novo', order: 0, color: '#3182CE', is_final: false },
        { name: 'Em Andamento', order: 1, color: '#F6AD55', is_final: false },
        { name: 'Concluído', order: 2, color: '#38A169', is_final: true }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setModalType('edit');
    setSelectedPipeline(p);
    setFormData({
      name: p.name,
      entity_type: p.entity_type,
      stages: [...p.stages].sort((a, b) => a.order - b.order)
    });
    setIsModalOpen(true);
  };

  const handleSavePipeline = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        entity_type: formData.entity_type,
        stages: formData.stages.map((s, i) => ({ ...s, order: i }))
      };

      if (modalType === 'create') {
        const res = await fetchWithAuth('http://localhost:8000/pipelines/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao criar pipeline");
      } else {
        const res = await fetchWithAuth(`http://localhost:8000/pipelines/${selectedPipeline.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Erro ao atualizar pipeline");
      }

      setIsModalOpen(false);
      fetchPipelines();
      addToast(`Pipeline ${modalType === 'create' ? 'criada' : 'atualizada'} com sucesso!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDeletePipeline = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir esta pipeline?")) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/pipelines/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Erro ao excluir pipeline");
      fetchPipelines();
      addToast("Pipeline excluída com sucesso!");
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormData(prev => {
      const oldIndex = prev.stages.findIndex(s => (s.id || `temp-${s.name}`) === active.id);
      const newIndex = prev.stages.findIndex(s => (s.id || `temp-${s.name}`) === over.id);
      return {
        ...prev,
        stages: arrayMove(prev.stages, oldIndex, newIndex)
      };
    });
  };

  const handleOpenStageModal = (index = null) => {
    if (index !== null) {
      setCurrentStageIndex(index);
      setStageFormData(formData.stages[index]);
    } else {
      setCurrentStageIndex(null);
      setStageFormData({ name: '', color: '#CBD5E0', is_final: false });
    }
    setIsStageModalOpen(true);
  };

  const handleSaveStage = () => {
    if (currentStageIndex !== null) {
      const newStages = [...formData.stages];
      newStages[currentStageIndex] = stageFormData;
      setFormData({ ...formData, stages: newStages });
    } else {
      setFormData({ ...formData, stages: [...formData.stages, stageFormData] });
    }
    setIsStageModalOpen(false);
  };

  const removeStage = (index) => {
    setFormData({ ...formData, stages: formData.stages.filter((_, i) => i !== index) });
  };

  if (loading) return <div className="loading-container"><RefreshCw className="spinner" /><p>Carregando pipelines...</p></div>;

  return (
    <div className="pipeline-settings">
      <div className="settings-header">
        <div className="header-left">
          <h2>Configuração de Pipelines</h2>
          <p className="description">Defina os fluxos de trabalho para seus objetos no sistema.</p>
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Nova Pipeline
        </button>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`} onClick={() => setActiveTab('contact')}>Contatos</button>
        <button className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>Empresas</button>
        <button className={`tab-btn ${activeTab === 'deal' ? 'active' : ''}`} onClick={() => setActiveTab('deal')}>Negócios</button>
      </div>

      <div className="pipelines-list">
        {filteredPipelines.length === 0 ? (
          <div className="empty-state">
            <Layout size={48} />
            <p>Nenhuma pipeline configurada para {activeTab === 'deal' ? 'Negócios' : (activeTab === 'contact' ? 'Contatos' : 'Empresas')}.</p>
            <button className="hs-button-secondary" onClick={handleOpenCreate}>Criar primeira pipeline</button>
          </div>
        ) : (
          filteredPipelines.map(p => (
            <div key={p.id} className="pipeline-card">
              <div className="pipeline-card-header">
                <div className="pipeline-info">
                  <h3>{p.name}</h3>
                  <span className="pipeline-meta">{p.stages.length} estágios</span>
                </div>
                <div className="pipeline-actions">
                  <button className="hs-button-secondary hs-button-sm" onClick={() => handleOpenEdit(p)}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="hs-button-secondary hs-button-sm delete" onClick={() => handleDeletePipeline(p.id)}>
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>
              <div className="pipeline-visual-flow">
                {p.stages.sort((a,b) => a.order - b.order).map((s, idx) => (
                  <React.Fragment key={s.id}>
                    <div className="visual-stage">
                      <div className="visual-dot" style={{ backgroundColor: s.color }}></div>
                      <span>{s.name}</span>
                    </div>
                    {idx < p.stages.length - 1 && <ChevronRight size={14} className="flow-arrow" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'create' ? 'Nova Pipeline' : 'Editar Pipeline'} size="large">
        <form onSubmit={handleSavePipeline} className="pipeline-form">
          <div className="form-group">
            <label>Nome da Pipeline</label>
            <input 
              type="text" 
              className="hs-input" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Funil de Vendas Direct"
            />
          </div>
          
          <div className="stages-editor">
            <div className="editor-header">
              <label>Estágios da Pipeline</label>
              <button type="button" className="hs-button-link" onClick={() => handleOpenStageModal()}>
                <Plus size={14} /> Adicionar Estágio
              </button>
            </div>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.stages.map((s, i) => s.id || `temp-${s.name}`)} strategy={verticalListSortingStrategy}>
                <div className="stages-list">
                  {formData.stages.map((stage, index) => (
                    <SortableStage 
                      key={stage.id || `temp-${stage.name}`} 
                      stage={stage} 
                      onEdit={() => handleOpenStageModal(index)}
                      onDelete={() => removeStage(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="hs-button-primary"><Save size={16} /> Salvar Pipeline</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStageModalOpen} onClose={() => setIsStageModalOpen(false)} title="Configurar Estágio">
        <div className="stage-form">
          <div className="form-group">
            <label>Nome do Estágio</label>
            <input 
              type="text" 
              className="hs-input" 
              required 
              value={stageFormData.name} 
              onChange={e => setStageFormData({ ...stageFormData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Cor do Estágio</label>
            <div className="color-picker">
              <input 
                type="color" 
                value={stageFormData.color} 
                onChange={e => setStageFormData({ ...stageFormData, color: e.target.value })}
              />
              <input 
                type="text" 
                className="hs-input" 
                value={stageFormData.color} 
                onChange={e => setStageFormData({ ...stageFormData, color: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={stageFormData.is_final} 
                onChange={e => setStageFormData({ ...stageFormData, is_final: e.target.checked })}
              />
              <span>Este é um estágio final (Ganhos/Perdas)</span>
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsStageModalOpen(false)}>Cancelar</button>
            <button type="button" className="hs-button-primary" onClick={handleSaveStage}>Confirmar Estágio</button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .pipeline-settings {
          padding: 32px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .header-left h2 { font-size: 24px; font-weight: 700; color: var(--hs-text-primary); margin-bottom: 4px; }
        .description { color: var(--hs-text-secondary); font-size: 14px; margin-bottom: 24px; }
        
        .tabs-container { display: flex; gap: 8px; border-bottom: 1px solid var(--hs-border); margin-bottom: 32px; }
        .tab-btn { padding: 12px 24px; border: none; background: none; color: var(--hs-text-secondary); cursor: pointer; font-weight: 600; border-bottom: 3px solid transparent; }
        .tab-btn.active { color: var(--hs-blue); border-bottom-color: var(--hs-blue); }
        
        .pipelines-list { display: flex; flex-direction: column; gap: 20px; }
        .pipeline-card { background: white; border: 1px solid var(--hs-border); border-radius: 8px; padding: 20px; transition: box-shadow 0.2s; }
        .pipeline-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .pipeline-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .pipeline-info h3 { font-size: 18px; font-weight: 700; color: var(--hs-text-primary); margin-bottom: 4px; }
        .pipeline-meta { font-size: 12px; color: var(--hs-text-secondary); }
        .pipeline-actions { display: flex; gap: 8px; }
        .pipeline-actions button.delete:hover { border-color: #dc2626; color: #dc2626; }
        
        .pipeline-visual-flow { display: flex; align-items: center; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
        .visual-stage { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--hs-text-primary); white-space: nowrap; }
        .visual-dot { width: 10px; height: 10px; border-radius: 50%; }
        .flow-arrow { color: var(--hs-border); flex-shrink: 0; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px; color: var(--hs-text-secondary); text-align: center; }
        .empty-state p { margin: 16px 0 24px; font-size: 16px; }

        .pipeline-form { display: flex; flex-direction: column; gap: 24px; }
        .stages-editor { background: #f8fafc; border: 1px solid var(--hs-border); border-radius: 8px; padding: 20px; }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .editor-header label { font-weight: 600; color: var(--hs-text-primary); }
        .stages-list { display: flex; flex-direction: column; gap: 8px; }
        
        .stage-item { background: white; border: 1px solid var(--hs-border); border-radius: 6px; padding: 12px; display: flex; align-items: center; gap: 12px; }
        .stage-drag-handle { color: var(--hs-text-secondary); cursor: grab; display: flex; }
        .stage-color { width: 16px; height: 16px; border-radius: 3px; }
        .stage-info { flex: 1; display: flex; align-items: center; gap: 8px; }
        .stage-name { font-size: 14px; font-weight: 500; }
        .stage-badge { font-size: 10px; background: #edf2f7; padding: 2px 6px; border-radius: 10px; color: var(--hs-text-secondary); text-transform: uppercase; }
        .stage-actions { display: flex; gap: 4px; }
        
        .color-picker { display: flex; gap: 8px; }
        .color-picker input[type="color"] { width: 40px; height: 40px; padding: 0; border: 1px solid var(--hs-border); border-radius: 4px; overflow: hidden; cursor: pointer; }
        .checkbox-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; }
        
        .icon-btn { background: none; border: none; color: var(--hs-text-secondary); cursor: pointer; padding: 4px; border-radius: 4px; }
        .icon-btn:hover { background: #f1f5f9; color: var(--hs-blue); }
        .icon-btn.delete:hover { color: #dc2626; }
      `}</style>
    </div>
  );
};

const PipelineSettings = () => (
  <ToastProvider>
    {(addToast) => <PipelineSettingsInner addToast={addToast} />}
  </ToastProvider>
);

export default PipelineSettings;
