import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, User, RefreshCw } from 'lucide-react';

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/contacts/');
      if (!response.ok) throw new Error('Falha ao bscar contatos');
      const data = await response.json();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  if (loading) return (
    <div className="loading-container">
      <RefreshCw size={40} className="spinner" />
      <p>Carregando contatos...</p>
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: var(--hs-text-secondary);
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>Erro: {error}</p>
      <button onClick={fetchContacts} className="hs-button-secondary">Tentar Novamente</button>
      <style jsx>{`
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          color: #ef4444;
        }
      `}</style>
    </div>
  );

  return (
    <div className="contacts-container">
      <div className="table-header">
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Filtrar contatos..." />
          </div>
          <button className="hs-button-secondary">
            <Filter size={16} />
            Filtros
          </button>
        </div>
        <button className="hs-button-primary">+ Criar Contato</button>
      </div>

      <div className="table-wrapper">
        <table className="hs-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Proprietário</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <div className="contact-cell">
                    <div className="avatar">{contact.name ? contact.name[0] : 'U'}</div>
                    {contact.name}
                  </div>
                </td>
                <td>{contact.email}</td>
                <td>{contact.phone || '-'}</td>
                <td>
                  <span className={`status-badge ${contact.status.toLowerCase().replace(' ', '-')}`}>
                    {contact.status === 'active' ? 'Ativo' : contact.status}
                  </span>
                </td>
                <td>{contact.owner || 'Eu'}</td>
                <td><MoreHorizontal size={16} className="more-icon" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .contacts-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-actions {
          display: flex;
          gap: 12px;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid var(--hs-border);
          padding: 6px 12px;
          border-radius: var(--hs-radius);
          width: 300px;
        }
        .search-box input {
          border: none;
          outline: none;
          font-size: 14px;
          width: 100%;
        }
        .hs-button-secondary {
          background: white;
          border: 1px solid var(--hs-border);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: var(--hs-radius);
          font-weight: 500;
          font-size: 14px;
        }
        .table-wrapper {
          background: white;
          border: 1px solid var(--hs-border-light);
          border-radius: var(--hs-radius);
          box-shadow: var(--hs-shadow);
          overflow: hidden;
        }
        .hs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .hs-table th {
          background: var(--hs-bg-main);
          padding: 12px 16px;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--hs-text-secondary);
          border-bottom: 1px solid var(--hs-border-light);
        }
        .hs-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--hs-border-light);
        }
        .contact-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--hs-blue);
        }
        .avatar {
          width: 28px;
          height: 28px;
          background: #eaf0f6;
          color: var(--hs-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-badge.ativo { background: #dcfce7; color: #166534; }
        .status-badge.inativo { background: #f3f4f6; color: #4b5563; }
        .status-badge.em-prospecção { background: #fef9c3; color: #854d0e; }
        .more-icon { color: var(--hs-text-secondary); cursor: pointer; }
      `}</style>
    </div>
  );
};

export default Contacts;
