# Security Specification - TaskNova Firebase Security Rules

## 1. Data Invariants
1. A Task document cannot exist without a valid `userId` matching the authenticated user.
2. An Alarm document cannot exist without a valid `userId` matching the authenticated user.
3. Users can only read and write their own Tasks and Alarms.
4. User profiles (`users/{userId}`) can only be created by the matching authenticated user, and can only be updated by that user.
5. All timestamp properties (`createdAt`) must match the server timestamp (`request.time`).

## 2. The "Dirty Dozen" Payloads (Attacks that must be denied)
1. **Identity Spoofing on Create Task**: Creating a task with `userId` = "victimUID" while authenticated as "attackerUID".
2. **PII Reading Access**: Reading another user's profile information.
3. **Ghost Field Update on User Profile**: Updating user profile with field `isAdmin: true` attempting privilege escalation.
4. **Anomalous Field Size (Resource Poisoning)**: Creating a task with a title string size of 100,000 characters.
5. **Timestamp Tampering on Task Create**: Creating a task where `createdAt` is a pre-dated client timestamp instead of `request.time`.
6. **Task Hijacking via Update**: Attacking and updating `userId` field of a task document to transfer ownership of a resource.
7. **Junk Character ID Injection**: Injecting script tags or junk characters into document IDs (e.g. `tasks/<script>`).
8. **Invalid State Transition**: Skipping valid enum values for Task `category` or `priority`.
9. **No-Auth Alarm Creation**: Attempting to create an alarm document without being authenticated.
10. **State Shortcutting on Completed**: Forcing status or other terminals directly on a terminal completed state.
11. **Denial of Wallet collections query**: Running list queries without filtering by owner `userId == request.auth.uid`.
12. **Foreign Alarm Mutation**: Attempting to toggle or delete another user's scheduled alarms.

## 3. Test Cases (TDD Scenario outline)
We require that the Security Rules reject any of the listed actions.
Below, standard `allow` rules are configured to explicitly enforce:
- `request.auth.uid == userId`
- Strictly checking the size of strings such as title, time under limits (e.g., `<= 256` characters).
- Key verification of schemas for creation.
