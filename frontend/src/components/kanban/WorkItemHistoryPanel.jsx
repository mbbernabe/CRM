import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, RefreshCcw, Send, CheckCircle2, Filter, Edit3, User } from 'lucide-react';
import './WorkItemHistoryPanel.css';

const WorkItemHistoryPanel = ({ workItemId, addToast }) => {
  const { fetchWithAuth } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter States
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'NOTE', 'EDIT', 'STAGE'
  const [filterUser, setFilterUser] = useState('');

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, [workItemId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/${workItemId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        throw new Error('Falha ao carregar histórico');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`http://localhost:8000/workitems/${workItemId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: note })
      });
      if (!res.ok) throw new Error('Falha ao adicionar nota');
      
      setNote('');
      fetchHistory();
      addToast('Nota adicionada com sucesso!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  // Derive unique users from history
  const historyUsers = useMemo(() => {
    const usersMap = new Map();
    history.forEach(h => {
      if (!usersMap.has(h.changed_by)) {
        usersMap.set(h.changed_by, { id: h.changed_by, name: h.changed_by_name || 'Sistema' });
      }
    });
    return Array.from(usersMap.values()).filter(u => u.name !== 'Sistema');
  }, [history]);

  // Derived filtered history
  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      // 1. User Filter
      if (filterUser && String(h.changed_by) !== filterUser) return false;

      // 2. Type Filter Logic
      const isStageChange = h.from_stage_id !== h.to_stage_id;
      const isEdit = !isStageChange && h.notes && (h.notes.startsWith('Edições realizadas:') || h.notes.startsWith('Atribuído para') || h.notes.startsWith('Dono removido'));
      const isNote = !isStageChange && !isEdit && h.notes;

      if (filterType === 'NOTE' && !isNote) return false;
      if (filterType === 'EDIT' && !isEdit) return false;
      if (filterType === 'STAGE' && !isStageChange) return false;

      return true;
    });
  }, [history, filterType, filterUser]);

  return (
    <div className="workitem-history-panel">
      <div className="history-header">
        <h4 className="section-title">Atividades & Notas</h4>
        <button className="refresh-btn" onClick={fetchHistory} title="Atualizar histórico">
          <RefreshCcw size={14} className={loading && history.length > 0 ? "spin" : ""} />
        </button>
      </div>

      <form className="add-note-form" onSubmit={handleAddNote}>
        <div className="note-input-wrapper">
          <MessageSquare size={16} className="note-icon" />
          <textarea
            placeholder="Adicione uma nota ou observação..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            rows={2}
          />
        </div>
        <div className="note-actions">
          <button type="submit" className="hs-button-primary note-submit-btn" disabled={submitting || !note.trim()}>
            {submitting ? 'Adicionando...' : <><Send size={14} /> Salvar Nota</>}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="history-filters">
          <div className="filter-pills">
            <button className={`pill-btn ${filterType === 'ALL' ? 'active' : ''}`} onClick={() => setFilterType('ALL')}>Todas</button>
            <button className={`pill-btn ${filterType === 'NOTE' ? 'active' : ''}`} onClick={() => setFilterType('NOTE')}><MessageSquare size={12}/> Notas</button>
            <button className={`pill-btn ${filterType === 'STAGE' ? 'active' : ''}`} onClick={() => setFilterType('STAGE')}><Filter size={12}/> Pipeline</button>
            <button className={`pill-btn ${filterType === 'EDIT' ? 'active' : ''}`} onClick={() => setFilterType('EDIT')}><Edit3 size={12}/> Edições</button>
          </div>
          {historyUsers.length > 0 && (
            <div className="filter-user-select">
              <User size={14} className="filter-user-icon" />
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="hs-input-sm">
                <option value="">Qualquer Usuário</option>
                {historyUsers.map(u => (
                  <option key={u.id || 'sistema'} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="timeline-container">
        {loading && history.length === 0 ? (
          <div className="timeline-empty">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="timeline-empty">Nenhuma atividade registrada ainda.</div>
        ) : filteredHistory.length === 0 ? (
          <div className="timeline-empty">Nenhuma atividade encontrada com estes filtros.</div>
        ) : (
          <div className="timeline">
            {filteredHistory.map((h, i) => {
              const isStageChange = h.from_stage_id !== h.to_stage_id;
              const isEdit = !isStageChange && h.notes && (h.notes.startsWith('Edições realizadas:') || h.notes.startsWith('Atribuído para') || h.notes.startsWith('Dono removido'));
              const isNote = !isStageChange && !isEdit && h.notes;
              
              return (
                <div key={h.id || i} className={`timeline-item ${isNote ? 'is-note' : isEdit ? 'is-edit' : ''}`}>
                  <div className="timeline-marker">
                    {isNote ? <MessageSquare size={12} /> : isEdit ? <Edit3 size={12} /> : <CheckCircle2 size={12} />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className="author">{h.changed_by_name || 'Sistema'}</span>
                      <span className="time">{formatDateTime(h.changed_at)}</span>
                    </div>

                    {isNote ? (
                      <div className="timeline-bubble note-bubble">
                        <p>{h.notes}</p>
                      </div>
                    ) : isEdit ? (
                      <div className="timeline-body edit-body">
                        <p>{h.notes}</p>
                      </div>
                    ) : (
                      <div className="timeline-body">
                        {h.from_stage_name ? (
                          <>Moveu de <strong>{h.from_stage_name}</strong> para <strong>{h.to_stage_name}</strong></>
                        ) : (
                          <>Moveu para <strong>{h.to_stage_name}</strong></>
                        )}
                        {h.notes && <p className="timeline-reason">Motivo: {h.notes}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkItemHistoryPanel;
