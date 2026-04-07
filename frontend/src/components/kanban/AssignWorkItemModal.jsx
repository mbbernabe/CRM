import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { UserPlus } from 'lucide-react';

const AssignWorkItemModal = ({ isOpen, onClose, initialData, onSave, addToast }) => {
  const { user, fetchWithAuth } = useAuth();
  const [users, setUsers] = useState([]);
  const [ownerId, setOwnerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setOwnerId(initialData?.owner_id || '');
    }
  }, [isOpen, initialData]);

  const fetchUsers = async () => {
    if (!user?.workspace_id) return;
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workspaces/${user.workspace_id}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: initialData.title, // Mandatório na API atual (será ignorado na mudança de owner se não mudou, mas requer title)
        owner_id: ownerId ? Number(ownerId) : null
      };
      
      const res = await fetchWithAuth(`http://localhost:8000/workitems/${initialData.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Erro ao atribuir item.");
      
      addToast("Item atribuído com sucesso!", "success");
      onSave();
      onClose();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Atribuir ${initialData?.title}`}
      size="small"
    >
      <form onSubmit={handleSubmit}>
        <div className="hs-form-group">
          <label className="hs-label">Selecionar Responsável</label>
          <select 
            className="hs-input"
            value={ownerId}
            onChange={e => setOwnerId(e.target.value)}
          >
            <option value="">(Remover Responsável)</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="hs-button-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="hs-button-primary" disabled={submitting}>
            {submitting ? 'Salvando...' : <><UserPlus size={16} /> Atribuir</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignWorkItemModal;
