import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title, description, action }) {
  return (
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3 className="empty-state-title">{title || 'No records found'}</h3>
      <p className="empty-state-desc">{description || 'There is nothing to display in this view right now.'}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
