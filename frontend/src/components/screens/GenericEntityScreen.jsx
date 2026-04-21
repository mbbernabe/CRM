import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import { 
  Building2, User, Search, Filter, 
  MoreHorizontal, Edit, Trash2, 
  RefreshCw, List as ListIcon, LayoutGrid
} from 'lucide-react';
import GenericEntityDetails from './GenericEntityDetails';
import './GenericEntityScreen.css';

const GenericEntityScreen = ({ typeName = 'contact' }) => {
  const { fetchWithAuth, workspace } = useAuth();
  const [items, setItems] = useState([]);
  const [itemType, setItemType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchTypeInfo = async () => {
    try {
      const res = await fetchWithAuth('/workitems/types');
      if (res.ok) {
        const types = await res.json();
        const type = types.find(t => t.name === typeName);
        setItemType(type);
      }
    } catch (err) {
      console.error("Erro ao buscar informações do tipo:", err);
    }
  };

  const fetchItems = async () => {
    if (!itemType) return;
    try {
      const res = await fetchWithAuth(`/workitems/types/${itemType.id}/items`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error("Erro ao buscar itens:", err);
    }
  };

  useEffect(() => {
    setItems([]);
    fetchTypeInfo();
  }, [workspace?.id, typeName]);

  useEffect(() => {
    if (itemType) {
      fetchItems();
      setLoading(false);
    }
  }, [itemType]);

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      const url = selectedItem 
        ? `/workitems/${selectedItem.id}`
        : `/workitems`;
      
      const payload = {
        ...formData,
        type_id: itemType.id,
        pipeline_id: selectedItem?.pipeline_id || 0, // Base de dados default
        stage_id: selectedItem?.stage_id || 0
      };

      const res = await fetchWithAuth(url, {
        method: selectedItem ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchItems();
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  if (loading || !itemType) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando {typeName}...</p>
    </div>
  );

  return (
    <div className="generic-screen-container">
      <div className="screen-header">
        <div className="search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder={`Filtrar ${itemType.label.toLowerCase()}...`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="hs-button-primary" onClick={handleOpenCreate}>
          + Criar {itemType.label}
        </button>
      </div>

      <div className="items-list">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum {itemType.label.toLowerCase()} encontrado.</p>
          </div>
        ) : (
          <table className="hs-table">
            <thead>
              <tr>
                <th>Nome / Título</th>
                <th>Campos Principais</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="item-cell">
                      <div className="item-icon" style={{ color: itemType.color }}>
                         {itemType.icon === 'User' ? <User size={18} /> : <Building2 size={18} />}
                      </div>
                      <span className="item-title">{item.title}</span>
                    </div>
                  </td>
                  <td>
                    {/* Mostrar os primeiros 2 campos customizados preenchidos */}
                    <div className="custom-fields-preview">
                       {Object.entries(item.custom_fields || {}).slice(0, 2).map(([k, v]) => (
                         <span key={k} className="preview-chip">{k}: {v}</span>
                       ))}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-button" onClick={() => handleOpenEdit(item)}><Edit size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? `Editar ${itemType.label}` : `Novo ${itemType.label}`}
        size="large"
      >
        <GenericEntityDetails 
          item={selectedItem}
          itemType={itemType}
          onSave={handleSave}
          onCancel={() => setIsModalOpen(false)}
          isSaving={isSaving}
        />
      </Modal>
    </div>
  );
};

export default GenericEntityScreen;
