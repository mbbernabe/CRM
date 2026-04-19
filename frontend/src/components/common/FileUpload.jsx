import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect, accept = ".csv", maxFileSize = 10 * 1024 * 1024 }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    setError(null);
    
    if (!selectedFile) return false;

    // Check extension
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (!accept.includes(extension)) {
      setError(`Formato inválido. Use apenas: ${accept}`);
      return false;
    }

    // Check size
    if (selectedFile.size > maxFileSize) {
      setError(`Arquivo muito grande. Máximo permitido: ${maxFileSize / (1024 * 1024)}MB`);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="file-upload-container">
      <div 
        className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''} ${error ? 'error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="file-input"
          accept={accept}
          onChange={handleChange}
        />

        {!file ? (
          <div className="upload-prompt">
            <div className="icon-wrapper">
              <Upload size={32} />
            </div>
            <h3>Arraste o arquivo para cá</h3>
            <p>ou</p>
            <button type="button" className="hs-button-secondary" onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
                Escolher Arquivo
            </button>
            <p className="file-hint">Suporta arquivos {accept} até {maxFileSize / (1024 * 1024)}MB</p>
          </div>
        ) : (
          <div className="file-info-active">
            <div className="file-icon">
              <FileText size={40} color="var(--hs-blue)" />
            </div>
            <div className="file-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile(); }}>
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error-msg animate-in">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
