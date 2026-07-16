interface DetailLayoutProps {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}

export function DetailLayout({ main, sidebar }: DetailLayoutProps) {
  return (
    <div className="detail-layout">
      <div className="detail-main">{main}</div>
      <aside className="detail-sidebar" aria-label="Activity and related">
        {sidebar}
      </aside>
    </div>
  );
}
