'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';

export interface AdminTabItem {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export interface AdminTabsProps {
  tabs: AdminTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function AdminTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: AdminTabsProps) {
  return (
    <div className={`admin-tabs ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`admin-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={16} />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="admin-tab-badge">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
