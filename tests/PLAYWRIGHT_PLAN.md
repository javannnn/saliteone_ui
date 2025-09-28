# Playwright E2E Plan (SaliteOne)

## Scenarios

1) Member: Update profile → add child → set tithe → status shows
- Login as member
- Go to My Membership → Profile: update phone, save
- Family: add child (DOB today-10y), expect row appears
- Status & Tithe: set amount/method → expect saved toast; status card visible

2) Volunteer: Submit log → chart updates
- Login as volunteer
- Volunteer Hub → Services Provided: add log (today, Ushering, 2h)
- Hours & Impact: expect last month bar >= 2h

3) Team Leader: Approve log → volunteer sees Approved
- Login as TL
- Team Leader → Approvals: select group, approve first submitted log
- Volunteer login → Services Provided: row shows Approved

4) Team Leader: Assign task → close task
- TL: Team Tasks: select group, select volunteer, assign task
- Volunteer: Volunteer Hub → My To-Dos: see task, close → task disappears

5) Admin: Approve volunteer request → promote → generate password
- Admin: Volunteers → Requests: Approve; Promote to System User; Generate Password → captures credentials

## Setup
- Seed users/roles and sample volunteers/groups in test fixtures.
- Use environment vars for credentials.

## Notes
- Use data-testids for stable selectors (add where necessary).
- Run tests serially initially to avoid race conditions.
