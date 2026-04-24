import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Save, AlertCircle, ChevronDown, Check, X, Star, Calendar } from 'lucide-react';
import WorkItemHistoryPanel from './WorkItemHistoryPanel';
import WorkItemLinksPanel from './WorkItemLinksPanel';
import { validateEmail, validateCPF, maskCPF, maskPhone, maskCEP, validateCEP } from '../../utils/validation';
import './WorkItemModal.css';

// --- Sub-component: MultiSelect Tags ---
const MultiSelectTags = ({ options, value = [], onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const toggleOption = (opt) => {
        const newValue = value.includes(opt)
            ? value.filter(v => v !== opt)
            : [...value, opt];
        onChange(newValue);
    };

    return (
        <div className="multiselect-tags-container">
            <div className="multiselect-tags-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="selected-tags">
                    {value.length === 0 ? <span className="placeholder">Selecione...</span> : 
                        value.map(v => (
                            <span key={v} className="tag-chip">
                                {v} <X size={10} onClick={(e) => { e.stopPropagation(); toggleOption(v); }} />
                            </span>
                        ))
                    }
                </div>
                <ChevronDown size={16} />
            </div>
            {isOpen && (
                <div className="multiselect-dropdown">
                    {options.map(opt => (
                        <div 
                            key={opt} 
                            className={`dropdown-item ${value.includes(opt) ? 'selected' : ''}`}
                            onClick={() => toggleOption(opt)}
                        >
                            {opt} {value.includes(opt) && <Check size={14} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

  const [recurrence, setRecurrence] = useState({
    enabled: false,
    frequency: 'daily',
    interval: 1,
    weekdays: [] // [0,1,2,3,4,5,6] onde 0 = Domingo
  });

  useEffect(() => {
    if (isOpen) {
      if (!types.length) fetchTypes();
      if (!users.length) fetchUsers();
      
      // Inicializar formulário
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

        // Carregar recorrência apenas uma vez ao abrir
        if (initialData.recurrence_config) {
          setRecurrence({
            enabled: true,
            weekdays: [],
            ...initialData.recurrence_config
          });
        } else {
          setRecurrence({ enabled: false, frequency: 'daily', interval: 1, weekdays: [] });
        }
      } else {
        const defaultTypeId = pipeline?.type_id || (types.length ? types[0].id : '');
        setFormData({
          title: '',
          description: '',
          type_id: defaultTypeId,
          stage_id: pipeline?.stages?.[0]?.id || '',
          owner_id: '',
          custom_fields: {}
        });
        setRecurrence({ enabled: false, frequency: 'daily', interval: 1, weekdays: [] });
      }
    }
  }, [isOpen, initialData]); // Removido types e pipeline das dependências de reset de estado

  // Efeito separado para sincronizar o tipo selecionado quando os tipos carregarem
  useEffect(() => {
    if (isOpen && types.length > 0) {
      const typeId = formData.type_id || pipeline?.type_id;
      if (typeId) {
        const found = types.find(t => t.id === Number(typeId));
        if (found) setSelectedType(found);
      } else if (types.length > 0) {
        setSelectedType(types[0]);
      }
    }
  }, [isOpen, types, formData.type_id]);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/workitems/types');
      const data = await res.json();
      setTypes(data);
    } catch (err) {
      addToast("Erro ao carregar tipos de itens", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!user?.workspace_id) return;
    try {
      const res = await fetchWithAuth(`/workspaces/${user.workspace_id}/users`);
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
        pipeline_id: pipeline.id || pipeline.pipeline_id,
        recurrence_config: recurrence.enabled ? { 
          frequency: recurrence.frequency, 
          interval: parseInt(recurrence.interval),
          weekdays: recurrence.frequency === 'weekly' ? recurrence.weekdays : []
        } : null
      };
      
      // Validações Especiais
      if (selectedType && selectedType.field_definitions) {
        for (const field of selectedType.field_definitions) {
           const val = formData.custom_fields[field.name];
           if (!val) continue;

           if (field.field_type === 'email' && !validateEmail(val)) {
             throw new Error(`O campo ${field.label} deve ser um e-mail válido.`);
           }
           if (field.field_type === 'cpf' && !validateCPF(val)) {
             throw new Error(`O campo ${field.label} deve conter um CPF válido.`);
           }
           if (field.field_type === 'cep' && !validateCEP(val)) {
             throw new Error(`O campo ${field.label} deve conter um CEP válido.`);
           }
        }
      }

      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `/workitems/${formData.id}` 
        : '/workitems';

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
    if (!selectedType) return null;
    const definitions = selectedType.field_definitions || [];
    const processedFields = new Set();
    
    // Identificar pares de datas para renderizar como Range (Início e Entrega/Fim)
    // Usamos aliases comuns para garantir que funcione em diferentes versões de tipos de tarefas
    const startField = definitions.find(f => 
      ['start_date', 'data_inicio', 'inicio', 'data_de_inicio'].includes(f.name.toLowerCase())
    );
    const dueField = definitions.find(f => 
      ['due_date', 'data_entrega', 'entrega', 'prazo_final', 'data_de_entrega'].includes(f.name.toLowerCase())
    );

    const fieldsToRender = [];

    // Se ambos existirem, criamos um bloco de range
    if (startField && dueField) {
      const startVal = formData.custom_fields[startField.name] || '';
      const dueVal = formData.custom_fields[dueField.name] || '';

      fieldsToRender.push(
        <div key="smart-date-range" className="form-group">
          <label>Prazo (Início e Entrega)</label>
          <div className="date-range-picker">
            <div className="range-input">
              <label className="sub-label">Início</label>
              <input 
                type="date" 
                className="hs-input"
                value={startVal}
                onChange={e => handleFieldChange(startField.name, e.target.value)}
              />
            </div>
            <div className="range-separator">até</div>
            <div className="range-input">
              <label className="sub-label">Entrega</label>
              <input 
                type="date" 
                className="hs-input"
                value={dueVal}
                onChange={e => handleFieldChange(dueField.name, e.target.value)}
              />
            </div>
          </div>
        </div>
      );
      processedFields.add(startField.name);
      processedFields.add(dueField.name);
    }

    const dynamicFields = definitions.map(field => {
      if (processedFields.has(field.name)) return null;

      const val = formData.custom_fields[field.name] || '';
      const options = Array.isArray(field.options) ? field.options : 
                     (typeof field.options === 'string' ? field.options.split(';') : []);

      return (
        <div key={field.id} className="form-group">
          <label>{field.label} {field.required && <span className="required">*</span>}</label>
          
          {field.field_type === 'textarea' ? (
            <textarea 
              className="hs-input"
              required={field.required}
              value={val}
              onChange={e => handleFieldChange(field.name, e.target.value)}
            />
          ) : field.field_type === 'select' ? (
            <select 
              className="hs-input" 
              required={field.required}
              value={val}
              onChange={e => handleFieldChange(field.name, e.target.value)}
            >
              <option value="">Selecione...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : field.field_type === 'multiselect' ? (
            field.displayMode === 'tags' ? (
                <MultiSelectTags 
                    options={options} 
                    value={Array.isArray(val) ? val : (val ? val.split(';') : [])}
                    onChange={newVal => handleFieldChange(field.name, newVal.join(';'))}
                />
            ) : (
                <div className="checkbox-group">
                    {options.map(opt => (
                        <label key={opt} className="hs-checkbox">
                            <input 
                                type="checkbox"
                                checked={Array.isArray(val) ? val.includes(opt) : (val ? val.split(';').includes(opt) : false)}
                                onChange={e => {
                                    const current = Array.isArray(val) ? val : (val ? val.split(';') : []);
                                    const next = e.target.checked 
                                        ? [...current, opt]
                                        : current.filter(v => v !== opt);
                                    handleFieldChange(field.name, next.join(';'));
                                }}
                            />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
            )
          ) : field.field_type === 'cpf' ? (
            <input 
              type="text"
              className="hs-input"
              required={field.required}
              value={maskCPF(val)}
              onChange={e => handleFieldChange(field.name, maskCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
          ) : field.field_type === 'cep' ? (
            <input 
              type="text"
              className="hs-input"
              required={field.required}
              value={maskCEP(val)}
              onChange={e => handleFieldChange(field.name, maskCEP(e.target.value))}
              placeholder="00000-000"
            />
          ) : field.field_type === 'phone' ? (
            <input 
              type="text"
              className="hs-input"
              required={field.required}
              value={maskPhone(val)}
              onChange={e => handleFieldChange(field.name, maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          ) : field.name === 'is_important' ? (
            <div 
              className={`important-toggle-modal ${val ? 'active' : ''}`}
              onClick={() => handleFieldChange(field.name, !val)}
            >
              <Star size={24} fill={val ? '#ff7a59' : 'none'} color={val ? '#ff7a59' : '#cbd5e0'} />
              <span>Marcar como Importante</span>
            </div>
          ) : field.field_type === 'date' ? (
            <div className="input-with-icon">
              <Calendar size={16} className="field-icon" />
              <input 
                type="date"
                className="hs-input"
                required={field.required}
                value={val}
                onChange={e => handleFieldChange(field.name, e.target.value)}
              />
            </div>
          ) : field.field_type === 'date_range' ? (
            <div className="date-range-picker">
              <div className="range-input">
                <label className="sub-label">Início</label>
                <input 
                  type="date" 
                  className="hs-input"
                  value={val.split(';')[0] || ''}
                  onChange={e => {
                    const parts = val.split(';');
                    handleFieldChange(field.name, `${e.target.value};${parts[1] || ''}`);
                  }}
                />
              </div>
              <div className="range-separator">até</div>
              <div className="range-input">
                <label className="sub-label">Entrega</label>
                <input 
                  type="date" 
                  className="hs-input"
                  value={val.split(';')[1] || ''}
                  onChange={e => {
                    const parts = val.split(';');
                    handleFieldChange(field.name, `${parts[0] || ''};${e.target.value}`);
                  }}
                />
              </div>
            </div>
          ) : (
            <input 
              type={field.field_type === 'number' ? 'number' : field.field_type === 'email' ? 'email' : 'text'}
              className="hs-input"
              required={field.required}
              value={val}
              onChange={e => handleFieldChange(field.name, e.target.value)}
            />
          )}
        </div>
      );
    });

    return (
      <>
        {fieldsToRender}
        {dynamicFields}
      </>
    );
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
                    disabled={!!pipeline?.type_id && !initialData} // Bloqueia se vier de uma pipeline específica
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

        <div className="recurrence-section">
           <label className="recurrence-toggle hs-checkbox">
              <input 
                type="checkbox" 
                checked={recurrence.enabled} 
                onChange={e => setRecurrence(r => ({ ...r, enabled: e.target.checked }))} 
              />
              <span>Tarefa Recorrente</span>
           </label>
           
           {recurrence.enabled && (
             <div className="recurrence-options">
                <span className="recurrence-label">Repetir a cada</span>
                <input 
                  type="number" 
                  className="hs-input recurrence-interval"
                  min="1" 
                  value={recurrence.interval} 
                  onChange={e => setRecurrence(r => ({ ...r, interval: e.target.value }))}
                />
                <select 
                  className="hs-input recurrence-freq"
                  value={recurrence.frequency}
                  onChange={e => setRecurrence(r => ({ ...r, frequency: e.target.value }))}
                >
                  <option value="daily">Dia(s)</option>
                  <option value="weekly">Semana(s)</option>
                  <option value="monthly">Mês(es)</option>
                  <option value="yearly">Ano(s)</option>
                </select>
                <div className="recurrence-help">
                  <AlertCircle size={14} />
                  <span>Uma nova tarefa será criada automaticamente ao concluir esta.</span>
                </div>

                {recurrence.frequency === 'weekly' && (
                  <div className="weekday-selector">
                    <p className="sub-label">Repetir nos dias:</p>
                    <div className="weekday-buttons">
                      {[
                        { label: 'D', full: 'Domingo' },
                        { label: 'S', full: 'Segunda-feira' },
                        { label: 'T', full: 'Terça-feira' },
                        { label: 'Q', full: 'Quarta-feira' },
                        { label: 'Q', full: 'Quinta-feira' },
                        { label: 'S', full: 'Sexta-feira' },
                        { label: 'S', full: 'Sábado' }
                      ].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          title={day.full}
                          className={`weekday-btn ${recurrence.weekdays.includes(index) ? 'selected' : ''}`}
                          onClick={() => {
                            const newWeekdays = recurrence.weekdays.includes(index)
                              ? recurrence.weekdays.filter(d => d !== index)
                              : [...recurrence.weekdays, index].sort();
                            setRecurrence(r => ({ ...r, weekdays: newWeekdays }));
                          }}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
           )}
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
             <WorkItemLinksPanel workItemId={initialData.id} addToast={addToast} />
             <WorkItemHistoryPanel workItemId={initialData.id} addToast={addToast} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WorkItemModal;
