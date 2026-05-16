# Security Specification - GoWithFlow

## Data Invariants
1. A **User** profile must exist before joining a session.
2. A **Session** must have a unique `joinCode` and an assigned `hostId`.
3. A **Member** can only be created within a session if waitlisted slots are available (slots 1-5).
4. Only the **Host** of a session can start it (status LOBBY -> ACTIVE).
5. Both **Host** and the **Active Speaker** can progress turns (update `turnIndex`).
6. Only the **Active Speaker** can mark their turn as "Synced" (which increments `turnIndex`).
7. When the final turn is synced, the session `status` must transition to `COMPLETED`.
8. **Assessments** can only be created by members of the same session for the current active speaker.

## The "Dirty Dozen" Payloads (Attack Vectors)
1. **Identity Spoofing**: Attempt to create a session with `hostId` set to a different user's UID.
2. **Privilege Escalation**: A non-host member attempts to update session `status` to `ACTIVE` or `CANCELLED`.
3. **Ghost Writes**: Attempt to update `turnIndex` when it's not your turn and you aren't the host.
4. **Shadow Membership**: Attempt to join a session with a `slot` number > `maxMembers`.
5. **PII Leak**: An unauthenticated user attempts to list all users' mobile numbers.
6. **Relational Orphan**: Create a member doc for a session that does not exist.
7. **Resource Exhaustion**: Send a `fullName` that is 1MB in size.
8. **Terminal State Bypass**: Attempt to update `turnIndex` on a session that is already `COMPLETED`.
9. **Fake Assessment**: Create an assessment for a session you are not a member of.
10. **ID Poisoning**: Use a 2KB junk string as a `sessionId`.
11. **Negative Progression**: Attempt to set `turnIndex` to a value lower than the current one.
12. **Author Forgery**: Create a member doc where `userId` does not match your `auth.uid`.

## Test Runner Strategy
- Verify that `isOwner()` is strictly enforced for user profiles.
- Verify that `isValidId()` blocks oversized or malicious IDs.
- Verify `affectedKeys().hasOnly()` blocks "Ghost Fields" in session updates.
