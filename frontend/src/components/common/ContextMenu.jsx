import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

const ContextMenu = ({ x, y, options, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Catch-all scroll to close (opcional mas bom para UX)
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, { capture: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [onClose]);

  if (!x && !y) return null;

  return (
    <div 
      className="context-menu" 
      ref={menuRef} 
      style={{ top: y, left: x }}
    >
      {options.map((option, idx) => (
        <div 
          key={idx} 
          className={`context-menu-item ${option.variant || ''}`} 
          onClick={(e) => {
            e.stopPropagation();
            option.onClick();
            onClose();
          }}
        >
          {option.icon && <span className="menu-icon">{option.icon}</span>}
          <span>{option.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
