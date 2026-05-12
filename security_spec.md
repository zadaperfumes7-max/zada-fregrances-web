# Security Specification - ZADA Perfumes

## Data Invariants
1. A user can only see and manage their own wishlist and orders.
2. Products, Categories, and Settings are publicly readable.
3. Only Admins can modify Products, Categories, and Settings.
4. Users cannot change their own 'role' to 'admin'.
5. Orders must be linked to the authenticated user.

## The "Dirty Dozen" Payloads (Denial Targets)
1.  **Identity Spoofing**: Creating a wishlist for another user.
2.  **Privilege Escalation**: Updating user profile to set `role: "admin"`.
3.  **Product Hijacking**: Non-admin attempting to update a product.
4.  **Order Spoofing**: Creating an order for another `userId`.
5.  **Ghost Field Injection**: Adding `isPromoted: true` to a product.
6.  **ID Poisoning**: Using a 10KB string as a `productId`.
7.  **Status Skip**: Updating an order status from "pending" to "delivered" as a customer.
8.  **Anonymous Write**: Attempting to create an order without auth.
9.  **Email Spoofing**: Attempting admin actions with unverified email.
10. **PII Leak**: Listing all users as a customer.
11. **Resource Exhaustion**: Creating a product with a 1MB name.
12. **Orphaned Order**: Creating an order for a non-existent user.

## Test Runner (Logic Definitions)
The rules must pass these logical constraints (to be implemented in firestore.rules).
