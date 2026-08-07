"use client";

import { useState, type ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  content?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  items,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  className = "",
}: TabsProps) {
  const [internalTab, setInternalTab] = useState<string>(
    defaultTab || (items.length > 0 ? items[0].id : "")
  );

  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;

  const handleTabClick = (id: string) => {
    if (controlledActiveTab === undefined) {
      setInternalTab(id);
    }
    if (onChange) {
      onChange(id);
    }
  };

  const activeItem = items.find((item) => item.id === currentTab);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation List */}
      <div className="flex border-b border-border">
        {items.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:border-border hover:text-ink"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge ? <span>{tab.badge}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      {activeItem && activeItem.content ? (
        <div className="mt-4">{activeItem.content}</div>
      ) : null}
    </div>
  );
}
