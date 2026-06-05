import type { Metadata } from "next";
import { PageHeader } from "../../components/page-header";

export const metadata: Metadata = {
  title: "BPOM Verification - ApoTech",
  description: "Verify BPOM 2D DataMatrix codes for product authenticity."
};

export default function BpomVerifyPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Compliance" }, { label: "BPOM Verify" }]}
        recordType="Compliance"
        title="Product Verification"
        actions={
          <>
            <button className="cta secondary">Enter manually</button>
            <button className="cta">Scan code</button>
          </>
        }
      />

      <section className="hero">
        <div className="panel hero-copy">
          <div className="eyebrow">BPOM Verification</div>
          <h1>Verify product authenticity</h1>
          <p className="lede">
            Scan or enter BPOM 2D DataMatrix codes to verify product authenticity against official BPOM databases before accepting goods.
          </p>
        </div>

        <aside className="panel compliance-card" aria-label="Verification form">
          <div>
            <div className="eyebrow">Verify</div>
            <h2>DataMatrix code</h2>
          </div>
          <div className="workflow-row">
            <div>
              <strong>Raw DataMatrix</strong>
              <p>Paste or scan the full code</p>
            </div>
            <input
              type="text"
              placeholder="01012345678901231725123110AB123"
              style={{
                padding: "7px 10px",
                borderRadius: "2px",
                border: "1px solid var(--line)",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                width: "200px"
              }}
            />
          </div>
          <div className="workflow-row">
            <div>
              <strong>GTIN</strong>
              <p>Extracted from code</p>
            </div>
            <span className="badge info">Auto-extracted</span>
          </div>
          <div className="workflow-row">
            <div>
              <strong>Batch number</strong>
              <p>Extracted from code</p>
            </div>
            <span className="badge info">Auto-extracted</span>
          </div>
          <div className="workflow-row">
            <div>
              <strong>Expiry date</strong>
              <p>Extracted from code</p>
            </div>
            <span className="badge info">Auto-extracted</span>
          </div>
        </aside>
      </section>

      <section className="grid" aria-label="Verification results">
        <div className="panel tile">
          <h2>Verification status</h2>
          <p>Authenticity check result</p>
          <strong>Valid</strong>
        </div>
        <div className="panel tile">
          <h2>Product name</h2>
          <p>Matched from GTIN</p>
          <strong>Amoxicillin 500mg</strong>
        </div>
        <div className="panel tile">
          <h2>Registration</h2>
          <p>BPOM registration number</p>
          <strong>MD 1234567890123</strong>
        </div>
        <div className="panel tile">
          <h2>Checked at</h2>
          <p>Timestamp of verification</p>
          <strong>Now</strong>
        </div>
      </section>
    </>
  );
}
