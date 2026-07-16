import { Breadcrumbs, type Crumb } from "./breadcrumbs";

interface PageHeaderProps {
  breadcrumbs: Crumb[];
  title: string;
  recordType?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, recordType, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <Breadcrumbs items={breadcrumbs} />
      <div className="page-header-row">
        <div className="page-header-titles">
          {recordType && <div className="page-header-eyebrow">{recordType}</div>}
          <h1 className="page-header-title">{title}</h1>
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
