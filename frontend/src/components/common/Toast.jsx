import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Aguarda animação de saída
  };

  const icons = {
    success: <CheckCircle className="toast-icon success" size={18} />,
    error: <XCircle className="toast-icon error" size={18} />,
    warning: <AlertCircle className="toast-icon warning" size={18} />,
    info: <Info className="toast-icon info" size={18} />,
  };

  return (
    <div className={`toast-container ${type} ${isExiting ? 'exit' : 'enter'}`}>
      <div className="toast-content">
        {icons[type]}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={handleClose}>
        <X size={14} />
      </button>

      <style jsx>{`
        .toast-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          min-width: 300px;
          max-width: 450px;
          border-left: 4px solid transparent;
          pointer-events: auto;
          margin-bottom: 8px;
        }
        
        .toast-container.success { border-left-color: #10b981; }
        .toast-container.error { border-left-color: #ef4444; }
        .toast-container.warning { border-left-color: #f59e0b; }
        .toast-container.info { border-left-color: #3b82f6; }

        .toast-content { display: flex; align-items: center; gap: 12px; }
        .toast-message { font-size: 14px; font-weight: 500; color: #1f2937; }
        
        .toast-icon.success { color: #10b981; }
        .toast-icon.error { color: #ef4444; }
        .toast-icon.warning { color: #f59e0b; }
        .toast-icon.info { color: #3b82f6; }

        .toast-close {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          transition: background 0.2s;
        }
        .toast-close:hover { background: #f3f4f6; color: #4b5563; }

        .enter { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .exit { animation: slideOutRight 0.3s ease-in forwards; }

        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children(addToast)}
      <div className="toast-portal">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
      <style jsx>{`
        .toast-portal {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          pointer-events: none;
        }
      `}</style>
    </>
  );
};

export default Toast;
