# RedChain Requirements Traceability

## Research problem addressed

Emergency donor searches through social media, messaging groups, calls and personal contacts can be unstructured, outdated, difficult to verify and risky for privacy. RedChain centralises the workflow while preserving controlled access to contact information.

## Functional requirements

| ID | Requirement | Implementation |
|---|---|---|
| FR-01 | User registration and authentication | Supabase email/password authentication, confirmation callback and reset password |
| FR-02 | Donor/recipient/organisation roles | `account_type` profile field and role-aware interface |
| FR-03 | Donor profile management | Blood group, availability, last donation date, radius and declaration |
| FR-04 | Malaysia location data | State/federal territory and city selection/filtering |
| FR-05 | Donor verification | Private document submission, pending/approved/rejected workflow |
| FR-06 | Emergency request submission | Structured patient initials, blood details, hospital, urgency, reason and required time |
| FR-07 | Protected requester contact | Separate `request_private_contacts` table with RLS |
| FR-08 | Donor search | Verified/available donor filtering by blood group, state and city |
| FR-09 | Emergency request discovery | Active request board and member request filters |
| FR-10 | Donor response | Verified donor offer, message and response status |
| FR-11 | Requester acceptance | Accept/decline donor response and mark request matched/fulfilled |
| FR-12 | Contact consent | Donor-controlled approve/decline contact-access request |
| FR-13 | Notifications | Verification, contact, response and request status notifications |
| FR-14 | Admin verification | Signed private document access and approval/rejection |
| FR-15 | Admin moderation | Request status control and user suspension |
| FR-16 | Announcements | Admin-created platform notices |
| FR-17 | Research evaluation | Usefulness, usability, trust, privacy and recommendation survey |
| FR-18 | Analytics | Counts and average research ratings in admin dashboard |
| FR-19 | Audit trail | Request, verification and profile access changes recorded |
| FR-20 | Presentation reset | Optional transaction cleanup script |

## Non-functional requirements

| ID | Requirement | Implementation |
|---|---|---|
| NFR-01 | Privacy | Public/private data separation and no public phone list |
| NFR-02 | Security | Row Level Security, protected admin fields and private Storage |
| NFR-03 | Usability | Responsive interface, status badges, validation and clear workflows |
| NFR-04 | Reliability | Database constraints, foreign keys, unique indexes and status transition guards |
| NFR-05 | Maintainability | Modular pages/components, central constants and documented SQL |
| NFR-06 | Traceability | Audit logs and updated timestamps |
| NFR-07 | Accessibility | Semantic labels, keyboard-usable controls and readable contrast |
| NFR-08 | Portability | Browser-based Next.js application deployed through GitHub/Vercel |
| NFR-09 | Scalability | Indexed donor, request, location, notification and audit queries |
| NFR-10 | Safety | Clinical disclaimer and public-note privacy guidance |

## Database entities

`profiles`, `private_profiles`, `donor_profiles`, `verification_documents`, `blood_requests`, `request_private_contacts`, `donor_responses`, `contact_requests`, `feedback_responses`, `announcements`, `notifications`, `audit_logs`.

## Security controls

- Authentication required for member workflows
- Safe public request projection only
- Private contact access evaluated by security-definer helper functions
- Admin role and account-status protection at database level
- Donor verification state protection at database level
- Controlled request/response status transitions
- Private verification bucket with user-folder ownership
- Signed temporary document links for administrator review
- No secret/service-role key in front-end code
