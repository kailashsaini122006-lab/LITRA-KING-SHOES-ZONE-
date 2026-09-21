import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ title, onMenuToggle }) => {
  const { adminUser } = useAuth();

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <h1 className="page-heading">{title}</h1>
      </div>

      <div className="header-right">
        <div className="admin-badge">
          <span className="status-dot"></span>
          <ShieldCheck size={16} color="var(--primary)" />
          <span style={{ fontWeight: 600 }}>{adminUser?.name || 'Owner Admin'}</span>
        </div>
      </div>
    </header>
  );
};
