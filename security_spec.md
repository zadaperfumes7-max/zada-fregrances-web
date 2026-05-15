# Firebase Security Specification

## 1. Data Invariants
- **Products**: Publicly readable. Only admins (specifically the developer) can create/update/delete.
- **Users**: A user can only read/write their own profile. Admin can read all.
- **Wishlists**: A user can only read/write their own wishlist.
- **Orders**: A user can create an order. A user can only read their own orders. Admin can read all orders and update status.
- **Categories/Settings/Discounts**: Publicly readable. Only admins can modify.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing - Profile**: Try to write to `/users/someone_else` as a regular user.
2. **Identity Spoofing - Wishlist**: Try to write to `/wishlists/someone_else` as a regular user.
3. **Privilege Escalation - Role**: Try to update own role to 'admin' in `/users/{uid}`.
4. **Bypassing Terminal State - Order**: Try to update an order after it is 'cancelled' or 'delivered'.
5. **Unauthorized Order View**: Try to read another user's order at `/orders/{otherId}`.
6. **Shadow Fields - Product**: Try to create a product with an extra field `isPromoted: true`.
7. **Resource Poisoning - Name**: Try to set a product name with a 2MB string.
8. **Invalid Relationship - Order**: Try to create an order referencing a non-existent product ID.
9. **Timestamp Spoofing**: Try to set `createdAt` manually to a past date.
10. **Global Write - Public Collection**: Try to delete a product as a non-admin.
11. **PII Leak**: Try to list all users as a regular user.
12. **Query Scraping**: Try to list all orders without a `userId` filter as a regular user.

## 3. Validation Helpers Logic
- `isValidId(id)`: Regex check for alphanumeric/hyphens.
- `isAdmin()`: Check if `request.auth.token.email == "zada.perfumes7@gmail.com"`.
- `isOwner(uid)`: `request.auth.uid == uid`.
