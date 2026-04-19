import React, { useState, useEffect } from 'react';
import { Link2, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './WorkItemLinksPanel.css';

const WorkItemLinksPanel = ({ workItemId, addToast }) => {
    const { fetchWithAuth } = useAuth();
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (workItemId) {
            fetchLinks();
        }
    }, [workItemId]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`http://localhost:8000/workitems/${workItemId}/links`);
            if (res.ok) {
                const data = await res.json();
                setLinks(data);
            }
        } catch (err) {
            console.error("Erro ao carregar vínculos:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetchWithAuth(`http://localhost:8000/workitems/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                // Filter out current item from results
                setSearchResults(data.filter(item => item.id !== workItemId));
            }
        } catch (err) {
            console.error("Erro na busca:", err);
        } finally {
            setSearching(false);
        }
    };

    const addLink = async (targetId) => {
        try {
            const res = await fetchWithAuth(`http://localhost:8000/workitems/${workItemId}/links`, {
                method: 'POST',
                body: JSON.stringify({ target_item_id: targetId })
            });

            if (res.ok) {
                addToast("Vínculo criado com sucesso!", "success");
                setIsSearching(false);
                setSearchQuery('');
                setSearchResults([]);
                fetchLinks();
            } else {
                const err = await res.json();
                addToast(err.detail || "Erro ao criar vínculo", "error");
            }
        } catch (err) {
            addToast("Erro na conexão com o servidor", "error");
        }
    };

    const removeLink = async (targetId) => {
        if (!window.confirm("Deseja realmente remover este vínculo?")) return;

        try {
            const res = await fetchWithAuth(`http://localhost:8000/workitems/${workItemId}/links/${targetId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                addToast("Vínculo removido", "success");
                fetchLinks();
            }
        } catch (err) {
            addToast("Erro ao remover vínculo", "error");
        }
    };

    // Group links by type
    const groupedLinks = links.reduce((acc, link) => {
        const type = link.type_label || 'Outros';
        if (!acc[type]) acc[type] = [];
        acc[type].push(link);
        return acc;
    }, {});

    return (
        <div className="links-panel">
            <div className="links-header">
                <h4>Vínculos</h4>
                <button 
                    className="add-link-btn"
                    onClick={() => setIsSearching(!isSearching)}
                >
                    {isSearching ? 'Cancelar' : <><Plus size={14} /> Adicionar</>}
                </button>
            </div>

            {isSearching && (
                <div className="link-search-container">
                    <div className="relative">
                        <input 
                            type="text"
                            className="link-search-input"
                            placeholder="Buscar item pelo título..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                        {searching && <Loader2 size={16} className="absolute right-3 top-2 animate-spin text-gray-400" />}
                    </div>
                    
                    {searchResults.length > 0 && (
                        <div className="link-search-results">
                            {searchResults.map(result => (
                                <div 
                                    key={result.id} 
                                    className="search-result-item"
                                    onClick={() => addLink(result.id)}
                                >
                                    <Link2 size={14} className="text-gray-400" />
                                    <div>
                                        <div className="text-sm font-medium">{result.title}</div>
                                        <div className="text-xs text-gray-500">{result.type_label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                        <div className="link-search-results p-3 text-center text-sm text-gray-500">
                            Nenhum item encontrado.
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-cyan-600" size={24} />
                </div>
            ) : links.length === 0 ? (
                <div className="no-links">
                    Nenhum vínculo registrado para este item.
                </div>
            ) : (
                <div className="links-list">
                    {Object.keys(groupedLinks).map(type => (
                        <div key={type} className="link-group">
                            <span className="link-group-title">{type} ({groupedLinks[type].length})</span>
                            {groupedLinks[type].map(link => (
                                <div key={link.id} className="link-item">
                                    <div className="link-info">
                                        <div 
                                            className="link-icon-wrapper"
                                            style={{ backgroundColor: link.type_color || '#0091ae' }}
                                        >
                                            <Link2 size={14} />
                                        </div>
                                        <span className="link-title" title={link.title}>{link.title}</span>
                                    </div>
                                    <button 
                                        className="remove-link-btn"
                                        onClick={() => removeLink(link.id)}
                                        title="Remover vínculo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkItemLinksPanel;
