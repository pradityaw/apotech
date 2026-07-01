import type { ReactNode } from "react";
import { Fragment } from "react";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: Crumb[];
  recordType?: string;
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ breadcrumbs, recordType, title, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && (
                  <li className="breadcrumb-sep" aria-hidden="true">
                    /
                  </li>
                )}
                <li>
                  {crumb.href ? <a href={crumb.href}>{crumb.label}</a> : <span>{crumb.label}</span>}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>
      )}

      <div className="page-header-row">
        <div>
          {recordType && <div className="page-header-eyebrow">{recordType}</div>}
          <h1 className="page-header-title">{title}</h1>
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
