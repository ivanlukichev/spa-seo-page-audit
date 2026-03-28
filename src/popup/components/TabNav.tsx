import { TABS } from "../../shared/constants";

interface TabNavProps {
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="SEO analysis tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-button ${activeTab === tab.id ? "tab-button-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
