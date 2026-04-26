import React from 'react';
import { 
  Calendar, Mail, Phone, MapPin, Hash, DollarSign, Info
} from 'lucide-react';
import { formatters } from '../../utils/formatters';
import { fetchAddressFromCEP } from '../../utils/cepService';

const DynamicFormField = ({ prop, value, onChange, onAutofill }) => {
  const label = prop.label || prop.name;
  const isRequired = prop.is_required || prop.required;
  const type = prop.type || prop.field_type;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea 
            className="hs-input w-full" 
            value={value || ''}
            onChange={e => onChange(prop.name, e.target.value)}
            required={isRequired}
            placeholder={`Digite ${label.toLowerCase()}...`}
            rows={3}
          />
        );
      case 'select':
        const options = prop.options ? (typeof prop.options === 'string' ? prop.options.split(';') : prop.options) : [];
        return (
          <select 
            className="hs-select w-full" 
            value={value || ''}
            onChange={e => onChange(prop.name, e.target.value)}
            required={isRequired}
          >
            <option value="">Selecione...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'multiselect':
        const multiOptions = prop.options ? (typeof prop.options === 'string' ? prop.options.split(';') : prop.options) : [];
        const selectedValues = value ? (typeof value === 'string' ? value.split(',') : value) : [];
        const toggleValue = (val) => {
          const newValues = selectedValues.includes(val)
            ? selectedValues.filter(v => v !== val)
            : [...selectedValues, val];
          onChange(prop.name, newValues.join(','));
        };
        return (
          <div className="multiselect-group flex flex-wrap gap-2">
            {multiOptions.map(opt => (
              <label key={opt} className="hs-checkbox flex items-center gap-2 bg-gray-50 px-2 py-1 rounded">
                <input 
                  type="checkbox" 
                  checked={selectedValues.includes(opt)}
                  onChange={() => toggleValue(opt)}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'boolean':
        return (
          <div className="checkbox-wrapper">
            <label className="hs-checkbox flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={value === true || value === 'true'}
                onChange={e => onChange(prop.name, e.target.checked ? 'true' : 'false')}
              />
              <span className="text-sm">Sim</span>
            </label>
          </div>
        );
      case 'date':
        return (
          <div className="input-with-icon">
            <Calendar size={16} className="field-icon" />
            <input 
              type="date"
              className="hs-input w-full"
              value={value || ''}
              onChange={e => onChange(prop.name, e.target.value)}
              required={isRequired}
            />
          </div>
        );
      case 'date_range':
        const [start, end] = (value || '').split(';');
        return (
          <div className="date-range-picker-dynamic flex items-end gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Início</span>
              <input 
                type="date" 
                className="hs-input w-full text-sm"
                value={start || ''}
                onChange={e => onChange(prop.name, `${e.target.value};${end || ''}`)}
              />
            </div>
            <span className="mb-2 text-gray-300 font-bold">→</span>
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fim</span>
              <input 
                type="date" 
                className="hs-input w-full text-sm"
                value={end || ''}
                onChange={e => onChange(prop.name, `${start || ''};${e.target.value}`)}
              />
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="input-with-icon">
            <Mail size={16} className="field-icon" />
            <input 
              type="email"
              className="hs-input w-full"
              value={value || ''}
              onChange={e => onChange(prop.name, e.target.value)}
              required={isRequired}
              placeholder="exemplo@email.com"
            />
          </div>
        );
      case 'cnpj':
      case 'cpf':
      case 'phone':
      case 'cep':
      case 'currency':
        const Icon = type === 'phone' ? Phone : 
                     type === 'cep' ? MapPin : 
                     type === 'currency' ? DollarSign : Hash;
        const formatter = formatters[type];
        
        const handleChange = async (e) => {
          const rawValue = e.target.value;
          const formatted = formatter(rawValue);
          onChange(prop.name, formatted);
          
          if (type === 'cep' && onAutofill) {
             const cleanCEP = rawValue.replace(/\D/g, '');
             if (cleanCEP.length === 8) {
                const address = await fetchAddressFromCEP(cleanCEP);
                if (address) {
                   onAutofill({
                      logradouro: address.logradouro,
                      bairro: address.bairro,
                      cidade: address.localidade,
                      estado: address.uf
                   });
                }
             }
          }
        };

        return (
          <div className="input-with-icon">
            <Icon size={16} className="field-icon" />
            <input 
              type="text"
              className="hs-input w-full"
              value={value || ''}
              onChange={handleChange}
              required={isRequired}
              placeholder={label}
            />
          </div>
        );
      case 'number':
        return (
            <input 
              type="number"
              className="hs-input w-full"
              value={value || ''}
              onChange={e => onChange(prop.name, e.target.value)}
              required={isRequired}
              placeholder={`Digite ${label.toLowerCase()}...`}
            />
          );
      default:
        return (
          <input 
            type="text"
            className="hs-input w-full"
            value={value || ''}
            onChange={e => onChange(prop.name, e.target.value)}
            required={isRequired}
            placeholder={`Digite ${label.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <div className={`hs-form-group ${type === 'textarea' || type === 'multiselect' ? 'full-width' : ''}`}>
      <label className="hs-label">
        {label}
        {isRequired && <span className="required-indicator">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};

export default DynamicFormField;
