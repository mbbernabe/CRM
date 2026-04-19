import React, { useState } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import { useToast } from './Toast';
import { Info, CheckCircle2, Table, ArrowRight, ListFilter } from 'lucide-react';
import './MassImportModal.css';

const FieldImportModal = ({ isOpen, onClose, onFieldsImported }) => {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedFields, setParsedFields] = useState([]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const header = lines[0].toLowerCase().split(',');
    
    // Identificar índices das colunas
    const labelIdx = header.findIndex(h => h.includes('label') || h.includes('rótulo') || h.includes('nome'));
    const nameIdx = header.findIndex(h => h.includes('name') || h.includes('id') || h.includes('slug'));
    const typeIdx = header.findIndex(h => h.includes('type') || h.includes('tipo'));
    const groupIdx = header.findIndex(h => h.includes('group') || h.includes('grupo'));

    const fields = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(',');
      
      const label = cols[labelIdx]?.trim();
      if (!label) continue;

      fields.push({
        label: label,
        name: cols[nameIdx]?.trim() || label.toLowerCase().replace(/\s+/g, '_'),
        field_type: cols[typeIdx]?.trim() || 'text',
        group_name: cols[groupIdx]?.trim() || null,
        required: false,
        options: []
      });
    }
    return fields;
  };

  const processUpload = () => {
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const fields = [];
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        if (lines.length < 2) throw new Error("Arquivo vazio ou sem cabeçalho");

        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const labelIdx = header.indexOf('label');
        const nameIdx = header.indexOf('name');
        const typeIdx = header.indexOf('type');
        const groupIdx = header.indexOf('group');

        if (labelIdx === -1) throw new Error("Coluna 'label' não encontrada no CSV.");

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            fields.push({
                label: cols[labelIdx],
                name: nameIdx !== -1 ? cols[nameIdx] : cols[labelIdx].toLowerCase().replace(/\s+/g, '_'),
                field_type: typeIdx !== -1 ? cols[typeIdx] : 'text',
                group_name: groupIdx !== -1 ? cols[groupIdx] : null,
                required: false,
                options: []
            });
        }

        setParsedFields(fields);
        setStep(2);
      } catch (err) {
        addToast({ title: 'Erro no CSV', message: err.message, type: 'error' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    onFieldsImported(parsedFields);
    setStep(3);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importação Massiva de Campos" width="650px">
      <div className="mass-import-stepper">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1. Upload</div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2. Revisão</div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3. Concluído</div>
      </div>

      <div className="mass-import-content">
        {step === 1 && (
            <div className="animate-in">
                <div className="import-header-desc">
                    <Info size={16} />
                    <p>Suba um arquivo CSV com as colunas: <strong>label, name, type, group</strong>. O sistema criará as propriedades e grupos automaticamente.</p>
                </div>
                <FileUpload onFileSelect={handleFileSelect} />
                <div className="import-actions">
                    <button className="hs-button-secondary" onClick={onClose}>Cancelar</button>
                    <button className="hs-button-primary" disabled={!file || isProcessing} onClick={processUpload}>
                        {isProcessing ? 'Lendo arquivo...' : 'Processar Campos'}
                    </button>
                </div>
            </div>
        )}

        {step === 2 && (
            <div className="animate-in">
                <div className="mapping-info">
                    <ListFilter size={20} />
                    <h3>Revisão de Campos ({parsedFields.length})</h3>
                    <p>Verifique os campos detectados antes de adicioná-los ao modelo.</p>
                </div>
                <div className="mapping-list" style={{ maxHeight: '250px' }}>
                    {parsedFields.slice(0, 10).map((f, i) => (
                        <div key={i} className="mapping-item">
                            <span className="source-col">{f.label}</span>
                            <ArrowRight size={14} className="arrow-muted" />
                            <span className="field-type-badge">{f.field_type}</span>
                        </div>
                    ))}
                    {parsedFields.length > 10 && <div className="more-indicator">... e mais {parsedFields.length - 10} campos</div>}
                </div>
                <div className="import-actions">
                    <button className="hs-button-secondary" onClick={() => setStep(1)}>Voltar</button>
                    <button className="hs-button-primary" onClick={confirmImport}>Adicionar {parsedFields.length} Campos</button>
                </div>
            </div>
        )}

        {step === 3 && (
            <div className="animate-in success-visual">
                <CheckCircle2 size={64} color="#10b981" />
                <h2>Sucesso!</h2>
                <p>{parsedFields.length} campos foram adicionados ao rascunho do seu modelo.</p>
                <div className="import-actions">
                    <button className="hs-button-primary" onClick={onClose}>Voltar ao Editor</button>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default FieldImportModal;
