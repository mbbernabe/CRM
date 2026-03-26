import React from 'react';
import { ChevronDown, Plus, Search, Bell } from 'lucide-react';

const Header = ({ pipelines, activePipeline, onPipelineChange }) => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Negócios</h1>
        
        <div className="pipeline-selector">
          <select 
            value={activePipeline.id} 
            onChange={(e) => onPipelineChange(e.target.value)}
            className="hs-select"
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="select-icon" />
        </div>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={18} />
          <input type="text" placeholder="Pesquisar negócios..." />
        </div>
        
        <button className="icon-btn">
          <Bell size={20} />
        </button>

        <button className="hs-button-primary">
          <Plus size={16} />
          <span>Criar Negócio</span>
        </button>
      </div>

      <style jsx>{`
        .header {
          height: var(--header-height);
          background: var(--hs-white);
          border-bottom: 1px solid var(--hs-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .header-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--hs-text-primary);
        }

        .pipeline-selector {
          position: relative;
          display: flex;
          align-items: center;
        }

        .hs-select {
          appearance: none;
          background: var(--hs-bg-main);
          border: 1px solid var(--hs-border);
          border-radius: var(--hs-radius);
          padding: 6px 32px 6px 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--hs-text-primary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }

        .hs-select:hover {
          border-color: var(--hs-blue);
        }

        .select-icon {
          position: absolute;
          right: 10px;
          pointer-events: none;
          color: var(--hs-text-secondary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--hs-bg-main);
          border: 1px solid var(--hs-border-light);
          padding: 6px 12px;
          border-radius: var(--hs-radius);
          width: 240px;
          color: var(--hs-text-secondary);
        }

        .search-bar input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
          color: var(--hs-text-primary);
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--hs-text-secondary);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hs-button-primary {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </header>
  );
};

export default Header;
