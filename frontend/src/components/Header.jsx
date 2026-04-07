import React from 'react';
import { ChevronDown, Plus, Search, Bell } from 'lucide-react';
import './Header.css';

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
    </header>
  );
};

export default Header;
