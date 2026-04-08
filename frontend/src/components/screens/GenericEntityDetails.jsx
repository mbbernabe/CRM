import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Mail, Phone, Calendar, 
  ChevronDown, ChevronRight, Save, X, 
  AlertCircle, GripVertical, Plus, Info
} from 'lucide-react';
import './GenericEntityDetails.css';

const GenericEntityDetails = ({ 
  item, 
  itemType, 
  onSave, 
  onCancel,
  isSaving = false
}) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    custom_fields: item?.custom_fields || {}
  });
  const [expandedGroups, setExpandedGroups] = useState([]);

  // Initialize expanded groups with all group IDs
  useEffect(() => {
    if (itemType?.field_groups) {
      setExpandedGroups(itemType.field_groups.map(g => g.id || g.name));
    }
  }, [itemType]);

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [fieldName]: value
      }
    }));
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Group fields by their group_id
  const fieldsByGroup = itemType?.field_definitions?.reduce((acc, field) => {
    const groupId = field.group_id || 'unassigned';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(field);
    return acc;
  }, {}) || {};

  const renderFieldInput = (field) => {
    const value = formData.custom_fields[field.name] || '';
    
    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea 
            className="hs-input" 
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            rows={3}
          />
        );
      case 'select':
        return (
          <select 
            className="hs-select" 
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            required={field.required}
          >
            <option value="">Selecione...</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'boolean':
        return (
            <label className="hs-toggle">
                <input 
                    type="checkbox" 
                    checked={value === true || value === 'true'}
                    onChange={e => handleFieldChange(field.name, e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">{value ? 'Sim' : 'Não'}</span>
            </label>
        );
      default:
        return (
          <input 
            type={field.field_type === 'number' ? 'number' : 'text'}
            className="hs-input"
            value={value}
            onChange={e => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            placeholder={`Digite ${field.label}...`}
          />
        );
    }
  };

  return (
    <form className="generic-entity-details" onSubmit={handleSubmit}>
      <header className="details-header">
        <div className="header-main">
          <div className="entity-icon" style={{ backgroundColor: itemType?.color + '20', color: itemType?.color }}>
            {itemType?.name === 'contact' ? <User size={24} /> : <Building2 size={24} />}
          </div>
          <div className="title-area">
            <input 
              type="text" 
              className="title-input" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder={`Nome do ${itemType?.label}...`}
              required
            />
            <span className="type-badge">{itemType?.label}</span>
          </div>
        </div>
      </header>

      <div className="details-body">
        <div className="details-section main-info">
            <h3 className="section-title"><Info size={16} /> Informações Principais</h3>
            <div className="hs-form-group">
                <label className="hs-label">Descrição / Notas</label>
                <textarea 
                    className="hs-input" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Adicione notas ou uma descrição curta..."
                    rows={2}
                />
            </div>
        </div>

        {/* Dynamic Groups */}
        {itemType?.field_groups?.map(group => (
          <div key={group.id} className="details-section group-section">
            <button 
              type="button" 
              className="group-header"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="group-title">
                {expandedGroups.includes(group.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <span>{group.name}</span>
              </div>
              <span className="field-count">{fieldsByGroup[group.id]?.length || 0} campos</span>
            </button>
            
            {expandedGroups.includes(group.id) && (
              <div className="group-content">
                <div className="fields-grid">
                  {fieldsByGroup[group.id]?.map(field => (
                    <div key={field.id} className="hs-form-group">
                      <label className="hs-label">
                        {field.label}
                        {field.required && <span className="required-indicator">*</span>}
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
                  {(!fieldsByGroup[group.id] || fieldsByGroup[group.id].length === 0) && (
                    <p className="empty-group-text">Nenhum campo neste grupo.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Unassigned Fields */}
        {fieldsByGroup['unassigned']?.length > 0 && (
          <div className="details-section group-section">
             <button type="button" className="group-header" onClick={() => toggleGroup('unassigned')}>
                <div className="group-title">
                    {expandedGroups.includes('unassigned') ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span>Outros Dados</span>
                </div>
             </button>
             {expandedGroups.includes('unassigned') && (
                <div className="group-content">
                    <div className="fields-grid">
                        {fieldsByGroup['unassigned'].map(field => (
                            <div key={field.id} className="hs-form-group">
                                <label className="hs-label">{field.label}</label>
                                {renderFieldInput(field)}
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>
        )}
      </div>

      <footer className="details-footer">
        <button type="button" className="hs-button-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="hs-button-primary" disabled={isSaving}>
          <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </footer>
    </form>
  );
};

export default GenericEntityDetails;
