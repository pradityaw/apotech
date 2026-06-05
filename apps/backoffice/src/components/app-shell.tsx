"use client";

import { useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BoxIcon,
  CartIcon,
  HomeIcon,
  LockIcon,
  MenuIcon,
  ScanIcon,
  SearchIcon,
  ShieldIcon,
  TruckIcon
} from "./icons";

type IconType = ComponentType<{ size?: number; className?: string }>;

interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface NavGroup {
  module: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    module: "Overview",
    items: [{ label: "Home", href: "/", icon: HomeIcon }]
  },
  {
    module: "Inventory",
    items: [
      { label: "Products", href: "/inventory", icon: BoxIcon },
      { label: "Stok Obat", href: "/stok-obat", icon: BoxIcon },
      { label: "Goods Receipt", href: "/goods-receipt", icon: TruckIcon }
    ]
  },
  {
    module: "Compliance",
    items: [
      { label: "BPOM Verify", href: "/bpom-verify", icon: ScanIcon },
      { label: "Reporting", href: "/compliance", icon: ShieldIcon }
    ]
  },
  {
    module: "Counter",
    items: [{ label: "POS", href: "/pos", icon: CartIcon }]
  },
  {
    module: "Governance",
    items: [{ label: "Privacy & Consent", href: "/privacy", icon: LockIcon }]
  }
];

const ORG_NAME = "Apotek Sehat Sentosa";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activePath = usePathname() ?? "/";

  return (
    <div className={`app-shell${collapsed ? " is-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Module navigation">
        <div className="sidebar-head">
          <span className="sidebar-logo" aria-hidden="true">A</span>
          <span className="sidebar-brand">ApoTech</span>
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.module}>
              <div className="nav-group-label">{group.module}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? activePath === "/"
                    : activePath.startsWith(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`nav-item${isActive ? " is-active" : ""}`}
                    title={item.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="nav-item-icon">
                      <Icon size={16} />
                    </span>
                    <span className="nav-item-label">{item.label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar" aria-label="Global">
          <button
            type="button"
            className="topbar-toggle"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            <MenuIcon size={18} />
          </button>
          <div className="topbar-org">{ORG_NAME}</div>
          <div className="topbar-search">
            <SearchIcon size={15} className="topbar-search-icon" />
            <input
              type="search"
              placeholder="Search products, batches, reports…"
              aria-label="Global search"
            />
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-btn" aria-label="Notifications">
              <BellIcon size={18} />
              <span className="icon-btn-dot" aria-hidden="true" />
            </button>
            <button type="button" className="avatar" aria-label="User menu">
              RW
            </button>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
