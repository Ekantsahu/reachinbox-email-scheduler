interface SidebarProps {
  activeTab: "scheduled" | "sent";
  onTabChange: (tab: "scheduled" | "sent") => void;
  onCompose: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onCompose,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">ONB</div>

      {/* User */}
      <div className="user-card">
        <div className="user-avatar">E</div>

        <div className="user-info">
          <div className="user-name">Ekant Kumar Sahu</div>
          <div className="user-email">ekantsahu27@gmail.com</div>
        </div>

        <span className="user-chevron">⌄</span>
      </div>

      {/* Compose */}
      <button
        type="button"
        className="compose-button"
        onClick={onCompose}
      >
        Compose
      </button>

      {/* Navigation */}
      <div className="sidebar-section-title">CORE</div>

      <button
        type="button"
        className={`sidebar-nav-item ${
          activeTab === "scheduled" ? "active" : ""
        }`}
        onClick={() => onTabChange("scheduled")}
      >
        <span className="nav-icon">◷</span>
        <span>Scheduled</span>
        <span className="nav-count">12</span>
      </button>

      <button
        type="button"
        className={`sidebar-nav-item ${
          activeTab === "sent" ? "active" : ""
        }`}
        onClick={() => onTabChange("sent")}
      >
        <span className="nav-icon">➤</span>
        <span>Sent</span>
        <span className="nav-count">785</span>
      </button>
    </aside>
  );
}