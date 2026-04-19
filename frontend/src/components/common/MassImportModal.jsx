import React, { useState } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { Info, AlertCircle, CheckCircle2, ListFilter, ArrowRight, Table } from 'lucide-react';
import './MassImportModal.css';

const MassImportModal = ({ isOpen, onClose, entityType = 'contact', onComplete }) => {
  const { fetchWithAuth } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Success
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const processUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    // Simulação de processamento para esta etapa da UI
    // No futuro, aqui chamaremos o endpoint de backend para processar o CSV
    setTimeout(() => {
        setIsProcessing(false);
        setStep(2); // Vai para mapeamento (simulado)
    }, 1500);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    // Simulação de importação final
    setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
        addToast({ title: 'Sucesso!', message: 'Importação concluída.', type: 'success' });
        if (onComplete) onComplete();
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="import-step-upload animate-in">
            <div className="import-header-desc">
                <Info size={16} />
                <p>O arquivo deve estar no formato <strong>.csv</strong> e conter os cabeçalhos das propriedades que deseja importar.</p>
            </div>
            
            <FileUpload onFileSelect={handleFileSelect} />
            
            <div className="import-actions">
                <button className="hs-button-secondary" onClick={onClose}>Cancelar</button>
                <button 
                    className="hs-button-primary" 
                    disabled={!file || isProcessing}
                    onClick={processUpload}
                >
                    {isProcessing ? 'Processando...' : 'Próximo Passo'}
                </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="import-step-mapping animate-in">
              <div className="mapping-info">
                  <Table size={20} />
                  <h3>Mapeamento de Campos</h3>
                  <p>Mapeamos as colunas do seu arquivo para as propriedades do sistema.</p>
              </div>

              <div className="mapping-list">
                  <div className="mapping-item header">
                      <span>Coluna do Arquivo</span>
                      <ArrowRight size={16} />
                      <span>Propriedade no CRM</span>
                  </div>
                  {[1, 2, 3].map(i => (
                      <div key={i} className="mapping-item">
                          <span className="source-col">Coluna_{i}</span>
                          <ArrowRight size={14} className="arrow-muted" />
                          <select className="hs-select">
                              <option>Mapear automaticamente...</option>
                              <option>Nome</option>
                              <option>Email</option>
                              <option>Telefone</option>
                          </select>
                      </div>
                  ))}
              </div>

              <div className="import-actions">
                <button className="hs-button-secondary" onClick={() => setStep(1)}>Voltar</button>
                <button 
                    className="hs-button-primary" 
                    disabled={isProcessing}
                    onClick={handleImport}
                >
                    {isProcessing ? 'Importando...' : 'Confirmar Importação'}
                </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="import-step-success animate-in">
              <div className="success-visual">
                  <CheckCircle2 size={64} color="#10b981" />
                  <h2>Pronto!</h2>
                  <p>Seus dados foram importados com sucesso.</p>
              </div>
              <div className="stats-summary">
                  <div className="stat">
                      <span className="label">Registros criados</span>
                      <span className="value">150</span>
                  </div>
                  <div className="stat">
                      <span className="label">Registros atualizados</span>
                      <span className="value">0</span>
                  </div>
              </div>
              <div className="import-actions">
                <button className="hs-button-primary" onClick={onClose}>Concluir</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Importar ${entityType === 'contact' ? 'Contatos' : 'Empresas'}`}
        width="600px"
    >
      <div className="mass-import-stepper">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1. Upload</div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2. Mapeamento</div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3. Resultado</div>
      </div>
      
      <div className="mass-import-content">
          {renderStep()}
      </div>
    </Modal>
  );
};

export default MassImportModal;
