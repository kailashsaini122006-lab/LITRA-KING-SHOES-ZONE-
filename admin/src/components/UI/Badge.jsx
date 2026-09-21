import React from 'react';

export const Badge = ({ type = 'pending', text }) => {
  const badgeMap = {
    'Order Placed': 'badge-pending',
    'Pending': 'badge-pending',
    'Confirmed': 'badge-confirmed',
    'Packed': 'badge-packed',
    'Out for Delivery': 'badge-delivery',
    'Delivered': 'badge-delivered',
    'Cancelled': 'badge-cancelled',
    'In Stock': 'badge-in-stock',
    'Out of Stock': 'badge-out-stock',
    'Paid': 'badge-delivered',
    'Failed': 'badge-cancelled'
  };

  const badgeClass = badgeMap[text] || badgeMap[type] || 'badge-pending';

  return (
    <span className={`badge ${badgeClass}`}>
      {text || type}
    </span>
  );
};
