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
