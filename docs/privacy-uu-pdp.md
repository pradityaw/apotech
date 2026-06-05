# Privacy and UU PDP Baseline

Health data is sensitive personal data under Indonesian Law 27/2022. ApoTech should be privacy-by-default from the first release.

## Baseline Controls

- Host production data in an Indonesian region or compliant local IDC.
- Capture explicit consent at registration and for compliance reporting where applicable.
- Minimize patient data stored in dispensing records; use local references unless reporting requires more detail.
- Audit all health-data writes, exports, and compliance submissions.
- Separate connector credentials by pharmacy/tenant when required by official programs.
- Keep secrets out of source control and rotate credentials on staff/vendor changes.

## Operational Artifacts

- Data Protection Impact Assessment (DPIA) before pilot.
- DPO process and contact workflow.
- Data-subject request process for access/correction/deletion where legally applicable.
- Incident response runbook with breach assessment and notification criteria.
- Processor/subprocessor register for cloud, payment, analytics, and connector providers.

## Product Implications

Compliance dashboards should show pending/failed records without exposing unnecessary patient details. Exports must be tracked in the audit log. Production logs must avoid raw payloads that contain sensitive health or identity data.
