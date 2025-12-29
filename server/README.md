Global Tracker - Server

After recent updates the server supports server-side PDF exports for company people (uses pdfkit).

Setup
1. Install dependencies:
   cd server && npm install

2. Start the server (development):
   npm run dev

New API
- GET /api/v1/companies/:id/export?format=pdf
  - Protected: requires admin authentication
  - Response: a generated PDF containing the company's people and embedded photos (if available)

Security
- Export, upload and password-change endpoints are rate-limited to reduce the risk of abuse.
- Content-sniffing and allowed file extensions are used for uploaded photos.

Developer utilities
- Several maintenance scripts exist in `server/utils` (e.g., `listUsers.js`, `setUsers.js`, `resetPasswords.js`). These are gated in production by the `DEV_UTILS_ALLOWED` environment variable. Set `DEV_UTILS_ALLOWED=true` only in trusted environments when you intend to run these tools.
