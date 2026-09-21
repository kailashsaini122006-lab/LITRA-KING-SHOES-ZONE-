import React from 'react';

export const StatCard = ({ title, value, icon: Icon, accent = '#eab308', bg = 'rgba(234, 179, 8, 0.15)', prefix = '' }) => {
  return (
    <div
      className="stat-card"
      style={{
        '--stat-accent': accent,
        '--stat-bg': bg,
      }}
    >
      <div className="stat-icon">
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-info">
        <h4>{title}</h4>
        <div className="stat-value">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
};
