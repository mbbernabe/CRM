import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import WorkItemBoard from '../kanban/WorkItemBoard';
import WorkItemModal from '../kanban/WorkItemModal';
import AssignWorkItemModal from '../kanban/AssignWorkItemModal';
import ContextMenu from '../common/ContextMenu';
import Modal from '../common/Modal';
import { Plus, RefreshCw, AlertCircle, Layout, Edit, UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import './PipelineBoardScreen.css';

const PipelineBoardScreenInner = ({ addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItemData, setEditItemData] = useState(null);
  const [assignItemData, setAssignItemData] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0, item: null, isOpen: false });

  const hasFetchedPipelines = useRef(false);

  const fetchPipelines = useCallback(async () => {
    if (hasFetchedPipelines.current) return;
    hasFetchedPipelines.current = true;
    try {
      const res = await fetchWithAuth('http://localhost:8000/pipelines/');
      const data = await res.json();
      setPipelines(data);
      if (data.length > 0) {
        setSelectedPipelineId(prev => prev || data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Erro ao buscar pipelines:", err);
      setError("Não foi possível carregar as pipelines.");
      setLoading(false);
    }
  }, [fetchWithAuth]);

  const fetchBoardData = useCallback(async (pipelineId) => {
    if (!pipelineId) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/board/${pipelineId}`);
      if (!res.ok) throw new Error("Erro ao carregar dados do quadro.");
      const data = await res.json();
      setBoardData(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar dados do quadro:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchBoardData(selectedPipelineId);
    }
  }, [selectedPipelineId, fetchBoardData]);

  const handleMoveItem = async (itemId, toStageId) => {
    // Optimistic update: move o item localmente antes de enviar ao backend
    const previousBoardData = boardData;
    setBoardData(prev => {
      if (!prev || !prev.stages) return prev;
      let movedItem = null;
      const newStages = prev.stages.map(stage => {
        const itemIndex = stage.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
          movedItem = { ...stage.items[itemIndex], stage_id: toStageId };
          return { ...stage, items: stage.items.filter((_, i) => i !== itemIndex) };
        }
        return stage;
      });
      if (movedItem) {
        return {
          ...prev,
          stages: newStages.map(stage =>
            stage.id === toStageId
              ? { ...stage, items: [...stage.items, movedItem] }
              : stage
          )
        };
      }
      return prev;
    });

    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/${itemId}/move`, {
        method: 'POST',
        body: JSON.stringify({ to_stage_id: toStageId })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao mover item.");
      }
      
      addToast("Item movido com sucesso!", "success");
    } catch (err) {
      addToast(err.message, "error");
      // Revert: restaura o estado anterior se falhou
      setBoardData(previousBoardData);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/${deleteConfirmItem.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Erro ao apagar item.");
      }
      addToast("Item excluído permanentemente.", "success");
      setDeleteConfirmItem(null);
      fetchBoardData(selectedPipelineId);
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleContextMenu = useCallback((e, item) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      isOpen: true
    });
  }, []);

  const openEditModal = (item) => {
    setEditItemData(item);
    setIsModalOpen(true);
  };

  const openAssignModal = (item) => {
    setAssignItemData(item);
  };

  if (error && pipelines.length > 0) {
    return (
      <div className="pipeline-board-screen">
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="hs-button-link" onClick={() => fetchBoardData(selectedPipelineId)}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-board-screen">
      <header className="board-header">
        <div className="pipeline-selector-wrapper">
          <select 
            className="pipeline-select"
            value={selectedPipelineId || ''}
            onChange={(e) => setSelectedPipelineId(Number(e.target.value))}
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            className="icon-btn" 
            onClick={() => fetchBoardData(selectedPipelineId)}
            title="Atualizar"
          >
            <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          </button>
        </div>

        <div className="board-actions">
          <button className="hs-button-primary" onClick={() => {
            setEditItemData(null);
            setIsModalOpen(true);
          }}>
            <Plus size={16} /> Novo {boardData?.item_label_singular || 'Item'}
          </button>
        </div>
      </header>

      {loading && !boardData ? (
        <div className="loading-overlay">
          <RefreshCw size={32} className="spinner" />
          <p>Carregando quadro...</p>
        </div>
      ) : pipelines.length === 0 ? (
        <div className="loading-overlay">
          <Layout size={48} />
          <p>Nenhuma pipeline configurada.</p>
          <p className="description">Vá em Configurações {'>'} Pipelines para criar uma.</p>
        </div>
      ) : (
        <WorkItemBoard 
          pipeline={boardData} 
          onMove={handleMoveItem} 
          onEdit={openEditModal}
          onContextMenu={handleContextMenu}
        />
      )}

      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
          options={[
            { 
              label: 'Editar Item', 
              icon: <Edit size={14} />, 
              onClick: () => openEditModal(contextMenu.item)
            },
            { 
              label: 'Atribuir a...', 
              icon: <UserPlus size={14} />, 
              onClick: () => openAssignModal(contextMenu.item) 
            },
            { 
              label: 'Excluir Item', 
              icon: <Trash2 size={14} />, 
              variant: 'danger', 
              onClick: () => setDeleteConfirmItem(contextMenu.item) 
            }
          ]}
        />
      )}

      <Modal
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="Confirmar Exclusão"
        size="small"
      >
        <div style={{ padding: '0 0 20px 0', fontSize: '14px', color: 'var(--hs-text)' }}>
          Tem certeza de que deseja apagar o item <strong>{deleteConfirmItem?.title}</strong>? Esta ação é irreversível.
        </div>
        <div className="form-actions">
          <button className="hs-button-secondary" onClick={() => setDeleteConfirmItem(null)}>
            Cancelar
          </button>
          <button className="hs-button-danger" onClick={handleDeleteItem}>
            Excluir Permanente
          </button>
        </div>
      </Modal>

      <WorkItemModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditItemData(null);
        }}
        pipeline={boardData}
        addToast={addToast}
        onSave={() => fetchBoardData(selectedPipelineId)}
        initialData={editItemData}
      />

      <AssignWorkItemModal
        isOpen={!!assignItemData}
        onClose={() => setAssignItemData(null)}
        initialData={assignItemData}
        onSave={() => fetchBoardData(selectedPipelineId)}
        addToast={addToast}
      />
    </div>
  );
};

const PipelineBoardScreen = () => {
  const { addToast } = useToast();
  return <PipelineBoardScreenInner addToast={addToast} />;
};

export default PipelineBoardScreen;
