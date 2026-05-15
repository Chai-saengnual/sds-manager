# SDS Manager — API Documentation

## Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth session.

### NextAuth Endpoints

```
POST /api/auth/callback/credentials  - Login with credentials
GET  /api/auth/session              - Get current session
POST /api/auth/signout              - Sign out
```

## Dashboard

### GET /api/dashboard/stats

Get dashboard statistics.

**Response:**
```json
{
  "stats": {
    "totalProducts": 100,
    "flammableProducts": 25,
    "nonFlammableProducts": 70,
    "activeProducts": 80,
    "inactiveProducts": 20,
    "overdueReviews": 5,
    "expiringThisMonth": 10,
    "missingPdfs": 3,
    "aiAnalyzedCount": 45
  },
  "recentActivity": [...],
  "categoryDistribution": [...]
}
```

## SDS Records

### GET /api/sds

List SDS records with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `search` (string)
- `category` (string, category ID)
- `flammable` (FLAMMABLE | NON_FLAMMABLE | UNKNOWN)
- `status` (ACTIVE | INACTIVE | EXPIRED | PENDING_REVIEW)
- `overdue` (boolean)
- `missingPdf` (boolean)
- `sortBy` (productNameEn | revisionDate | followUpDate | createdAt)
- `sortOrder` (asc | desc)

**Response:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### POST /api/sds

Create a new SDS record.

**Request Body:**
```json
{
  "partNumber": "CLN-001",
  "productNameEn": "Industrial Degreaser",
  "productNameTh": "น้ำยาทำความสะอาด",
  "categoryId": "cat_xxx",
  "hazardSummary": "Causes skin irritation",
  "flammableStatus": "NON_FLAMMABLE",
  "status": "ACTIVE",
  "revisionDate": "2024-01-15T00:00:00Z",
  "followUpDate": "2025-01-15T00:00:00Z",
  "supplier": "ChemTech",
  "manufacturer": "ChemTech Inc.",
  "tags": ["degreaser", "industrial"],
  "notes": "Review annually"
}
```

### GET /api/sds/:id

Get a single SDS record.

### PUT /api/sds/:id

Update an SDS record.

### DELETE /api/sds/:id

Delete an SDS record.

## File Upload

### POST /api/sds/:id/upload

Upload a file (PDF or image) for an SDS record.

**Form Data:**
- `file` (File, required)
- `fileType` (SDS_PDF_EN | SDS_PDF_TH | PRODUCT_IMAGE)

**Response:**
```json
{
  "file": {...},
  "url": "https://storage.url/file.pdf"
}
```

## AI Analysis

### POST /api/sds/:id/analyze

Run AI analysis on uploaded SDS content.

**Request Body:**
```json
{
  "textContent": "Extracted text from PDF...",
  "analysisType": "full"
}
```

**Response:**
```json
{
  "analysisId": "analysis_xxx",
  "result": {
    "chemicalNames": [...],
    "hazardClassifications": [...],
    "ppeRecommendations": [...],
    "storageRequirements": [...],
    "firstAidInformation": [...],
    "summary": "...",
    "recommendations": [...],
    "warnings": [...],
    "confidence": 0.95
  },
  "summary": "..."
}
```

## Categories

### GET /api/categories

List all categories.

### POST /api/categories

Create a new category (Admin only).

**Request Body:**
```json
{
  "name": "Cleaning Products",
  "nameTh": "ผลิตภัณฑ์ทำความสะอาด",
  "description": "Industrial cleaning agents",
  "color": "#3b82f6",
  "icon": "spray-can"
}
```

## Audit Logs

### GET /api/audit-logs

List audit logs.

**Query Parameters:**
- `page`
- `pageSize`
- `action` (CREATE | UPDATE | DELETE | VIEW | ...)
- `userId`
- `sdsRecordId`
- `from` (date)
- `to` (date)

## Export

### GET /api/export

Export SDS records.

**Query Parameters:**
- `format` (xlsx | csv | pdf)
- `filters` (JSON encoded filter object)

**Response:**
Binary file download.