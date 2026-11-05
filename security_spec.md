# Security Specification & Test Matrix

## 1. Data Invariants
- **Private Data Isolation**: A user can only read and write their own `/users/{userId}` document.
- **Daily Activity Integrity**: Activities in `/activities/{activityId}` must have `userId == request.auth.uid`. A user can only create, edit, or delete their own activities.
- **Public Directory Limitation**: `/publicProfiles/{userId}` only exposes `displayName`, `photoURL`, `email` and cannot be modified by anyone except the authenticated user matching `userId`.
- **Connections Mutual Gate**: A connection `/connections/{connectionId}` can only be created by `request.auth.uid == requesterId`. The status can only transition to `'accepted'` or `'declined'` if `request.auth.uid == targetId`.
- **Ranking Data Privacy**: Users can only read monthly progress of others if they are connected and status is `'accepted'`, or their own monthly progress.
- **Strict Keys & Size Limits**: All incoming payloads must satisfy length limits and required types.

## 2. The "Dirty Dozen" Malicious Payloads (Must be REJECTED)
1. **Payload 1 (Identity Spoofing in Activity)**: User A tries to create an activity with `userId: "user_B"`.
2. **Payload 2 (Ghost Field Attack in Profile)**: User sends `isAdmin: true` or `role: "admin"` inside `/users/{userId}`.
3. **Payload 3 (Unauthorized Status Transition)**: User A creates a connection directly with `status: "accepted"`.
4. **Payload 4 (Self-Accept Hack)**: User A (requester) attempts to update `status` from `'pending'` to `'accepted'`.
5. **Payload 5 (Unauthenticated Activity Write)**: Unauthenticated request (`request.auth == null`) attempting to write to `/activities/act_1`.
6. **Payload 6 (Resource Poisoning)**: Sending a `notes` field with 10,000 characters to exhaust database capacity.
7. **Payload 7 (Snooping Private User Document)**: User B attempts `get()` on `/users/{userA_id}`.
8. **Payload 8 (Negative Exercise Counts)**: Attempting to log `-500` pull-ups or negative running kilometers.
9. **Payload 9 (Cross-User Activity Deletion)**: User B attempts to delete `/activities/{activityId_owned_by_A}`.
10. **Payload 10 (Non-Allowed Keys Injection)**: Adding extra rogue properties like `{ "bypass": true }` to `/monthlyProgress`.
11. **Payload 11 (ID Path Variable Poisoning)**: Submitting a 500-character string or SQL-injection style chars in `{userId}`.
12. **Payload 12 (Target Hijacking in Connection)**: User A attempts to edit a connection where neither `userA` nor `userB` is User A.
