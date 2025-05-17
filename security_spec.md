# Security Specification for BillaraAI

## Data Invariants
1. A user can only access their own profile and settings.
2. Invoices and Clients belong to a specific User (userId) and can only be managed by that user.
3. An invoice can be made "Public" by copying it to the `publicInvoices` collection.
4. Public invoices are read-only for everyone but cannot be deleted or modified by non-owners.
5. Users cannot claim to be someone else (uid mismatch).

## The Dirty Dozen Payloads (Targeting Firestore)

1. **Identity Theft**: Create an invoice with `userId: "attacker_id"` in `victim_id`'s subcollection.
2. **Access Escalation**: Read `users/victim_id/invoices/secret_inv` as `attacker_id`.
3. **Public Poisoning**: Modify a document in `publicInvoices/some_id` by an unauthenticated user.
4. **Shadow Field Injection**: Update an invoice adding `isPremium: true` to a user profile.
5. **Orphaned Writes**: Create a client without a corresponding user document.
6. **Immutable Field Break**: Change `createdAt` on an existing invoice.
7. **Negative Billing**: Set `unitPrice` or `quantity` to a negative number.
8. **Resource Exhaustion**: Send a 1MB string as the `invoiceNumber`.
9. **Status Fast-track**: Update a `Draft` invoice directly to `Paid` without going through `Sent`.
10. **ID Poisoning**: Use a 2KB junk string as the document ID for a new client.
11. **Bulk Exfiltration**: Attempt to list all invoices in `publicInvoices` without IDs.
12. **PII Leak**: Access `users/victim_id` to get their business address or email.

## Test Runner (Logic verification)
See `firestore.rules.test.ts` for detailed assertions.
