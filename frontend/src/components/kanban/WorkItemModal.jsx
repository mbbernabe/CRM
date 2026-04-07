import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Save, AlertCircle } from 'lucide-react';
import WorkItemHistoryPanel from './WorkItemHistoryPanel';
import './WorkItemModal.css';

const WorkItemModal = ({ isOpen, onClose, pipeline, onSave, addToast, initialData }) => {
  const { user, fetchWithAuth } = useAuth();
  const [types, setTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type_id: '',
    stage_id: '',
    owner_id: '',
    custom_fields: {}
  });

  useEffect(() => {
    if (isOpen) {
      if (!types.length) fetchTypes();
      fetchUsers();
      
      if (initialData) {
        setFormData({
          id: initialData.id,
          title: initialData.title || '',
          description: initialData.description || '',
          type_id: initialData.type_id || '',
          stage_id: initialData.stage_id || pipeline?.stages?.[0]?.id || '',
          owner_id: initialData.owner_id || '',
          custom_fields: initialData.custom_fields || {}
        });
        if (initialData.type_id && types.length) {
           setSelectedType(types.find(t => t.id === initialData.type_id) || null);
        }
      } else {
        setFormData({
          title: '',
          description: '',
          type_id: types.length ? types[0].id : '',
          stage_id: pipeline?.stages?.[0]?.id || '',
          owner_id: '',
          custom_fields: {}
        });
        if (types.length) setSelectedType(types[0]);
      }
    }
  }, [isOpen, pipeline, initialData, types]);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('http://localhost:8000/workitems/types');
      const data = await res.json();
      setTypes(data);
      if (data.length > 0) {
        setSelectedType(data[0]);
        setFormData(prev => ({ ...prev, type_id: data[0].id }));
      }
    } catch (err) {
      addToast("Erro ao carregar tipos de itens", "error");
    } finally {
      setLoading(false);
    }
  };

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

  const handleTypeChange = (typeId) => {
    const type = types.find(t => t.id === Number(typeId));
    setSelectedType(type);
    setFormData(prev => ({ ...prev, type_id: typeId, custom_fields: {} }));
  };

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: { ...prev.custom_fields, [name]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        pipeline_id: pipeline.id || pipeline.pipeline_id
      };
      
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `http://localhost:8000/workitems/${formData.id}` 
        : 'http://localhost:8000/workitems';

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(formData.id ? "Erro ao editar item." : "Erro ao criar item.");
      
      addToast(formData.id ? "Item atualizado com sucesso!" : "Item criado com sucesso!", "success");
      onSave();
      onClose();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderDynamicFields = () => {
    if (!selectedType || !selectedType.field_definitions) return null;
    
    return selectedType.field_definitions.map(field => (
      <div key={field.id} className="form-group">
        <label>{field.label} {field.required && <span className="required">*</span>}</label>
        {field.field_type === 'textarea' ? (
          <textarea 
            className="hs-input"
            required={field.required}
            value={formData.custom_fields[field.name] || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
          />
        ) : (
          <input 
            type={field.field_type === 'number' ? 'number' : 'text'}
            className="hs-input"
            required={field.required}
            value={formData.custom_fields[field.name] || ''}
            onChange={e => handleFieldChange(field.name, e.target.value)}
          />
        )}
      </div>
    ));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? `Editar ${initialData.title}` : `Novo ${pipeline?.item_label_singular || 'Item'}`}
      size={initialData ? "xlarge" : "medium"}
    >
      <div className={`workitem-modal-layout ${initialData ? 'with-history' : ''}`}>
        <form onSubmit={handleSubmit} className="pipeline-form">
        <div className="form-group">
          <label>Título / Nome</label>
          <input 
            type="text" 
            className="hs-input" 
            required 
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Contrato de Manutenção"
          />
        </div>

        <div className="form-row">
            <div className="form-group">
                <label>Tipo de Item</label>
                <select 
                    className="hs-input"
                    value={formData.type_id}
                    onChange={e => handleTypeChange(e.target.value)}
                    required
                >
                    {types.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Estágio Inicial</label>
                <select 
                    className="hs-input"
                    value={formData.stage_id}
                    onChange={e => setFormData({ ...formData, stage_id: Number(e.target.value) })}
                    required
                >
                    {pipeline?.stages?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Responsável (Dono)</label>
                <select 
                    className="hs-input"
                    value={formData.owner_id}
                    onChange={e => setFormData({ ...formData, owner_id: e.target.value === "0" ? 0 : e.target.value ? Number(e.target.value) : '' })}
                >
                    <option value="">(Atribuir a mim)</option>
                    <option value="0">(Sem Dono)</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea 
            className="hs-input"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="dynamic-fields-section">
           <h4 className="section-title">Campos Adicionais</h4>
           {loading ? <p>Carregando definições...</p> : renderDynamicFields()}
           {selectedType && selectedType.field_definitions?.length === 0 && (
               <p className="no-fields-msg">Nenhum campo customizado definido para este tipo.</p>
           )}
        </div>

        <div className="form-actions">
          <button type="button" className="hs-button-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="hs-button-primary" disabled={submitting}>
            {submitting ? 'Salvando...' : <><Save size={16} /> {formData.id ? 'Salvar Edições' : 'Criar Item'}</>}
          </button>
        </div>
        </form>

        {initialData && (
          <div className="workitem-sidebar">
             <WorkItemHistoryPanel workItemId={initialData.id} addToast={addToast} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkItemModal;
