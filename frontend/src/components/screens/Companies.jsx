import React from 'react';
import { Search, Filter, Globe, Building } from 'lucide-react';

const Companies = () => {
  const companies = [
    { name: 'Acme Inc.', domain: 'acme.com', location: 'São Paulo, SP', industry: 'Software', owner: 'Eu' },
    { name: 'Globex Corp', domain: 'globex.corp', location: 'Rio de Janeiro, RJ', industry: 'Manufatura', owner: 'Eu' },
    { name: 'Initech', domain: 'initech.net', location: 'Curitiba, PR', industry: 'Serviços', owner: 'André Lima' },
    { name: 'Stark Ind.', domain: 'stark.com', location: 'Nova York, NY', industry: 'Defesa', owner: 'Eu' },
    { name: 'Wayne Ent.', domain: 'wayne.com', location: 'Gotham, NJ', industry: 'Tecnologia', owner: 'Eu' },
  ];

  return (
    <div className="companies-container">
      <div className="table-header">
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Pesquisar empresas..." />
          </div>
          <button className="hs-button-secondary">
            <Filter size={16} />
            Filtros
          </button>
        </div>
        <button className="hs-button-primary">+ Criar Empresa</button>
      </div>

      <div className="table-wrapper">
        <table className="hs-table">
          <thead>
            <tr>
              <th>Nome da Empresa</th>
              <th>Domínio</th>
              <th>Localização</th>
              <th>Indústria</th>
              <th>Proprietário</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, i) => (
              <tr key={i}>
                <td>
                  <div className="company-cell">
                    <Building size={16} className="company-icon" />
                    {company.name}
                  </div>
                </td>
                <td>
                  <div className="domain-cell">
                    <Globe size={14} />
                    {company.domain}
                  </div>
                </td>
                <td>{company.location}</td>
                <td>{company.industry}</td>
                <td>{company.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .companies-container {
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
        .company-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--hs-blue);
        }
        .company-icon { color: var(--hs-text-secondary); }
        .domain-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--hs-text-secondary);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default Companies;
