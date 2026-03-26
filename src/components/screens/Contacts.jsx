import React from 'react';
import { Search, Filter, MoreHorizontal, User } from 'lucide-react';

const Contacts = () => {
  const contacts = [
    { name: 'João Silva', email: 'joao.silva@acme.com', phone: '(11) 98888-7777', status: 'Ativo', owner: 'Eu' },
    { name: 'Maria Souza', email: 'm.souza@globex.corp', phone: '(21) 97777-6666', status: 'Ativo', owner: 'Eu' },
    { name: 'Roberto Alves', email: 'roberto@initech.net', phone: '(31) 96666-5555', status: 'Inativo', owner: 'André Lima' },
    { name: 'Ana Oliveira', email: 'ana.o@stark.com', phone: '(11) 95555-4444', status: 'Ativo', owner: 'Eu' },
    { name: 'Carlos Santos', email: 'c.santos@wayne.com', phone: '(11) 94444-3333', status: 'Em Prospecção', owner: 'Eu' },
  ];

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
            {contacts.map((contact, i) => (
              <tr key={i}>
                <td>
                  <div className="contact-cell">
                    <div className="avatar">{contact.name[0]}</div>
                    {contact.name}
                  </div>
                </td>
                <td>{contact.email}</td>
                <td>{contact.phone}</td>
                <td>
                  <span className={`status-badge ${contact.status.toLowerCase().replace(' ', '-')}`}>
                    {contact.status}
                  </span>
                </td>
                <td>{contact.owner}</td>
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
