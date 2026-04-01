import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Shield, RefreshCw, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';

const PropertySettings = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text',
    group: 'Outros',
    options: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/properties/');
      if (!response.ok) throw new Error('Falha ao buscar propriedades');
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleOpenCreate = () => {
    setModalType('create');
    setFormData({ name: '', label: '', type: 'text', group: 'Outros', options: '' });
    setSelectedProperty(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prop) => {
    setModalType('edit');
    setFormData({
      name: prop.name,
      label: prop.label,
      type: prop.type,
      group: prop.group,
      options: prop.options || ''
    });
    setSelectedProperty(prop);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (prop) => {
    setSelectedProperty(prop);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = modalType === 'create' 
        ? 'http://localhost:8000/properties/' 
        : `http://localhost:8000/properties/${selectedProperty.id}`;
      
      const response = await fetch(url, {
        method: modalType === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao salvar propriedade');
      }

      setIsModalOpen(false);
      fetchProperties();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProperty) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:8000/properties/${selectedProperty.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Falha ao excluir propriedade');
      }
      setIsDeleteModalOpen(false);
      fetchProperties();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Agrupar e ordenar propriedades
  const groupedProps = properties.reduce((acc, prop) => {
    if (!acc[prop.group]) acc[prop.group] = [];
    acc[prop.group].push(prop);
    return acc;
  }, {});

  if (loading) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando propriedades...</p>
      <style jsx>{`
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: var(--hs-text-secondary); }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-info">
          <h2>Definições de Propriedades</h2>
          <p>Gerencie os campos personalizados dos seus contatos.</p>
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          <Plus size={16} style={{ marginRight: '8px' }} /> Nova Propriedade
        </button>
      </div>

      <div className="groups-list">
        {Object.keys(groupedProps).sort().map(group => (
          <div key={group} className="property-group-card">
            <div className="group-header">
              <h3>{group}</h3>
              <span className="count-badge">{groupedProps[group].length} campos</span>
            </div>
            <div className="props-table-wrapper">
              <table className="props-table">
                <thead>
                  <tr>
                    <th>Rótulo (Label)</th>
                    <th>Nome Interno</th>
                    <th>Tipo</th>
                    <th>Opções</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedProps[group].map(prop => (
                    <tr key={prop.id} className={prop.is_system ? 'system-prop' : ''}>
                      <td>
                        <div className="label-cell">
                          {prop.label}
                          {prop.is_system && <Shield size={12} className="system-icon" title="Propriedade de Sistema" />}
                        </div>
                      </td>
                      <td><code>{prop.name}</code></td>
                      <td>
                        <span className={`type-badge ${prop.type}`}>
                          {
                            prop.type === 'email' ? 'E-mail' : 
                            prop.type === 'text' ? 'Texto' : 
                            prop.type === 'textarea' ? 'Texto Longo' :
                            prop.type === 'boolean' ? 'Checkbox' :
                            prop.type === 'currency' ? 'Moeda' :
                            prop.type === 'select' ? 'Seleção' :
                            prop.type === 'multiselect' ? 'Multi-seleção' :
                            prop.type === 'date' ? 'Data' :
                            prop.type === 'url' ? 'URL/Link' : prop.type
                          }
                        </span>
                      </td>
                      <td>
                        <div className="options-preview">
                          {prop.options ? prop.options.split(';').join(', ') : '-'}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button className="icon-btn edit" onClick={() => handleOpenEdit(prop)} title="Editar">
                          <Edit size={14} />
                        </button>
                        {!prop.is_system && (
                          <button className="icon-btn delete" onClick={() => handleOpenDelete(prop)} title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'create' ? 'Nova Propriedade' : 'Editar Propriedade'}
      >
        <form onSubmit={handleSubmit} className="prop-form">
          <div className="form-group">
            <label>Nome Interno (ID)</label>
            <input 
              type="text" 
              disabled={modalType === 'edit'}
              required
              placeholder="ex: cpf_contato"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_')})}
            />
            {modalType === 'create' && <small>Este nome é usado internamente e não pode ser mudado depois.</small>}
          </div>
          <div className="form-group">
            <label>Rótulo (O que aparece na tela)</label>
            <input 
              type="text" 
              required
              placeholder="ex: CPF"
              value={formData.label}
              onChange={e => setFormData({...formData, label: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Grupo / Categoria</label>
            <input 
              type="text" 
              required
              placeholder="ex: Documentos ou Endereço"
              value={formData.group}
              onChange={e => setFormData({...formData, group: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Tipo de Dado</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <optgroup label="Texto">
                <option value="text">Texto Simples</option>
                <option value="textarea">Texto Multilinha (Área de Texto)</option>
              </optgroup>
              <optgroup label="Seleção">
                <option value="select">Lista de Seleção (Única)</option>
                <option value="multiselect">Lista de Múltipla Seleção (Checkboxes)</option>
                <option value="boolean">Checkbox Simples (Booleano)</option>
              </optgroup>
              <optgroup label="Especiais">
                <option value="email">E-mail</option>
                <option value="currency">Moeda (R$)</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
                <option value="url">URL / Link</option>
              </optgroup>
            </select>
          </div>

          {(formData.type === 'select' || formData.type === 'multiselect') && (
            <div className="form-group">
              <label>Opções da Lista</label>
              <textarea 
                required
                placeholder="Digite as opções separadas por ponto e vírgula (;). Ex: Ouro;Prata;Bronze"
                value={formData.options}
                onChange={e => setFormData({...formData, options: e.target.value})}
                rows={3}
              />
              <small>Separe as opções usando <strong>;</strong></small>
            </div>
          )}
          
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="hs-button-primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Propriedade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Deletar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Propriedade"
      >
        <div className="delete-confirm">
          <AlertCircle size={40} color="#dc2626" style={{ marginBottom: '16px' }} />
          <p>Tem certeza que deseja excluir <strong>{selectedProperty?.label}</strong>?</p>
          <p className="warning">Isso removerá os dados deste campo em TODOS os contatos.</p>
          
          <div className="form-actions">
            <button type="button" className="hs-button-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </button>
            <button className="hs-button-danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .settings-container { padding: 32px; max-width: 1000px; margin: 0 auto; }
        .settings-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .header-info h2 { font-size: 24px; font-weight: 700; color: #2d3e50; margin-bottom: 4px; }
        .header-info p { color: #516f90; font-size: 14px; }

        .groups-list { display: flex; flex-direction: column; gap: 24px; }
        .property-group-card { background: white; border: 1px solid #cbd6e2; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .group-header { background: #f5f8fa; padding: 12px 20px; border-bottom: 1px solid #cbd6e2; display: flex; justify-content: space-between; align-items: center; }
        .group-header h3 { font-size: 16px; font-weight: 700; color: #2d3e50; }
        .count-badge { font-size: 12px; color: #516f90; background: #eaf0f6; padding: 2px 8px; border-radius: 10px; }

        .props-table { width: 100%; border-collapse: collapse; }
        .props-table th { text-align: left; padding: 12px 20px; font-size: 11px; text-transform: uppercase; color: #516f90; border-bottom: 1px solid #eaf0f6; }
        .props-table td { padding: 12px 20px; font-size: 14px; border-bottom: 1px solid #eaf0f6; }
        .props-table tr:last-child td { border-bottom: none; }
        
        .label-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #0091ae; }
        .system-icon { color: #516f90; opacity: 0.7; }
        code { background: #f5f8fa; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #2d3e50; }
        
        .options-preview { font-size: 11px; color: #516f90; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle; }
        .type-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .type-badge.text { background: #e0f2fe; color: #0369a1; }
        .type-badge.email { background: #dcfce7; color: #15803d; }
        .type-badge.number { background: #fef9c3; color: #854d0e; }
        .type-badge.textarea { background: #f3f4f6; color: #374151; }
        .type-badge.boolean { background: #fef3c7; color: #92400e; }
        .type-badge.currency { background: #ecfdf5; color: #065f46; }
        .type-badge.select, .type-badge.multiselect { background: #ede9fe; color: #5b21b6; }
        .type-badge.date { background: #dbeafe; color: #1e40af; }
        .type-badge.url { background: #fdf2f8; color: #9d174d; }

        .actions-cell { display: flex; gap: 8px; }
        .icon-btn { background: none; border: none; color: #516f90; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { background: #f5f8fa; }
        .icon-btn.edit:hover { color: #0091ae; }
        .icon-btn.delete:hover { color: #dc2626; background: #fef2f2; }

        .system-prop { background: #fafbfc; }

        /* Forms */
        .prop-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 14px; font-weight: 600; color: #2d3e50; }
        .form-group input, .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #cbd6e2; border-radius: 4px; font-size: 14px; }
        .form-group textarea { font-family: inherit; resize: vertical; }
        .form-group small { font-size: 12px; color: #516f90; margin-top: 4px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }

        .delete-confirm { text-align: center; }
        .delete-confirm p { font-size: 16px; margin-bottom: 8px; }
        .delete-confirm .warning { color: #dc2626; font-size: 14px; font-weight: 600; }

        .hs-button-primary { background: #ff7a59; color: white; border: none; padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; display: flex; align-items: center; }
        .hs-button-secondary { background: white; border: 1px solid #cbd6e2; padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; }
        .hs-button-danger { background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 3px; font-weight: 600; cursor: pointer; }

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PropertySettings;
