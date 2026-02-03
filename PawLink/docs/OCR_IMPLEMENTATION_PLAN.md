# OCR Implementation Plan for PawLink Verification

## Overview

This document outlines the implementation plan for integrating AI-powered OCR (Optical Character Recognition) into the PawLink user verification flow. The OCR system will automatically extract information from Philippine government-issued IDs, reducing manual data entry and improving user experience.

---

## Phase 1: UI/UX Redesign (COMPLETED)

### Components Created

| Component | Location | Description |
|-----------|----------|-------------|
| `StepperProgress.tsx` | `components/verification/` | Visual step indicator with icons, animations |
| `IdTypeSelector.tsx` | `components/verification/` | Modal-based ID type picker with descriptions |
| `DocumentUploader.tsx` | `components/verification/` | Camera/gallery picker with preview + scanning state |
| `AutoFilledInput.tsx` | `components/verification/` | Floating label input with AI auto-fill badge |
| `OcrLoadingOverlay.tsx` | `components/verification/` | Full-screen AI scanning animation |
| `ocrService.ts` | `services/` | OCR API client stub (ready for backend) |

### Files Updated

- `IdVerificationStep.tsx` - Complete redesign with OCR integration hooks
- `LicensedBreederStep.tsx` - Redesigned with new components
- `ShooterCertificateStep.tsx` - Redesigned with new components
- `verify.tsx` - Uses new StepperProgress component

---

## Phase 2: Python OCR Microservice

### Technology Stack

| Component | Technology | Reason |
|-----------|------------|--------|
| Web Framework | FastAPI | Fast, async, automatic OpenAPI docs |
| OCR Engine | PaddleOCR | Best accuracy for structured documents, free |
| Image Processing | OpenCV | Preprocessing for better OCR results |
| Containerization | Docker | Easy deployment, consistent environment |

### Service Architecture

```
ocr-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry
│   ├── config.py            # Configuration settings
│   ├── routers/
│   │   ├── __init__.py
│   │   └── ocr.py           # OCR endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ocr_engine.py    # PaddleOCR wrapper
│   │   ├── id_parser.py     # Philippine ID field extraction
│   │   └── preprocessing.py # Image preprocessing (OpenCV)
│   └── models/
│       ├── __init__.py
│       └── schemas.py       # Pydantic request/response models
├── tests/
│   ├── __init__.py
│   ├── test_ocr.py
│   └── sample_ids/          # Test images (DO NOT COMMIT REAL IDs)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### API Endpoints

#### POST `/api/ocr/extract`

Extract information from an ID document image.

**Request:**
```
Content-Type: multipart/form-data

image: <file>           # Required: Image file (JPG, PNG)
id_type: string         # Optional: Hint for parser (drivers_license, national_id, etc.)
```

**Response:**
```json
{
  "success": true,
  "confidence": 0.92,
  "extracted_fields": {
    "full_name": "JUAN DELA CRUZ",
    "id_number": "N01-23-456789",
    "birthdate": "1990-01-15",
    "issue_date": "2023-06-20",
    "expiration_date": "2028-06-20",
    "address": "123 SAMPLE ST, QUEZON CITY"
  },
  "raw_text": "REPUBLIKA NG PILIPINAS...",
  "id_type_detected": "national_id",
  "processing_time_ms": 1250
}
```

**Error Response:**
```json
{
  "success": false,
  "confidence": 0,
  "extracted_fields": {},
  "error": "Could not detect text in image. Please ensure the ID is clearly visible."
}
```

#### GET `/api/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ocr_engine": "paddleocr",
  "gpu_available": false
}
```

### Supported Philippine IDs

| ID Type | Key | Fields to Extract |
|---------|-----|-------------------|
| Driver's License | `drivers_license` | Name, License No, Birthdate, Issue Date, Expiration, Address, Restrictions |
| Philippine National ID (PhilSys) | `national_id` | Name, PSN, Birthdate, Address, Blood Type |
| UMID | `umid` | Name, CRN, Birthdate, Issue Date |
| SSS ID | `sss_id` | Name, SSS No, Birthdate |
| PhilHealth ID | `philhealth_id` | Name, PhilHealth No, Birthdate |
| PRC ID | `prc_id` | Name, Registration No, Profession, Issue Date, Expiration |

### ID Parsing Logic

Each ID type has specific patterns and layouts. The parser will:

1. **Detect ID Type** (if not provided)
   - Look for keywords: "REPUBLIKA NG PILIPINAS", "DRIVER'S LICENSE", "PHILSYS", etc.
   - Analyze document layout and structure

2. **Extract Fields** based on ID type
   - Use regex patterns for ID numbers
   - Use layout analysis for name/address blocks
   - Parse dates in multiple formats (MM/DD/YYYY, DD-MM-YYYY, etc.)

3. **Validate Extracted Data**
   - Check ID number format matches expected pattern
   - Verify dates are valid
   - Calculate confidence score

### Sample Parser Implementation

```python
# app/services/id_parser.py

import re
from typing import Dict, Optional
from datetime import datetime

class PhilippineIdParser:
    """Parser for Philippine government-issued IDs"""
    
    # ID number patterns
    PATTERNS = {
        'national_id': r'[A-Z]\d{2}-\d{2}-\d{6}',  # N01-23-456789
        'drivers_license': r'[A-Z]\d{2}-\d{2}-\d{6}',
        'sss_id': r'\d{2}-\d{7}-\d',  # 12-3456789-0
        'umid': r'\d{4}-\d{7}-\d',  # 1234-5678901-2
        'philhealth_id': r'\d{2}-\d{9}-\d',  # 12-123456789-0
        'prc_id': r'\d{7}',  # 1234567
    }
    
    def parse(self, raw_text: str, id_type: Optional[str] = None) -> Dict:
        """Extract fields from OCR text"""
        
        # Detect ID type if not provided
        if not id_type:
            id_type = self._detect_id_type(raw_text)
        
        # Extract based on ID type
        if id_type == 'national_id':
            return self._parse_national_id(raw_text)
        elif id_type == 'drivers_license':
            return self._parse_drivers_license(raw_text)
        # ... other ID types
        
        return {}
    
    def _detect_id_type(self, text: str) -> str:
        """Detect ID type from text content"""
        text_upper = text.upper()
        
        if 'PHILSYS' in text_upper or 'PHILIPPINE IDENTIFICATION' in text_upper:
            return 'national_id'
        elif 'DRIVER' in text_upper and 'LICENSE' in text_upper:
            return 'drivers_license'
        elif 'SSS' in text_upper or 'SOCIAL SECURITY' in text_upper:
            return 'sss_id'
        # ... more detection logic
        
        return 'unknown'
    
    def _parse_national_id(self, text: str) -> Dict:
        """Parse Philippine National ID"""
        result = {}
        
        # Extract PSN (Philippine Statistics Number)
        psn_match = re.search(self.PATTERNS['national_id'], text)
        if psn_match:
            result['id_number'] = psn_match.group()
        
        # Extract name (usually in uppercase, multiple words)
        # This is simplified - real implementation needs more sophisticated parsing
        name_pattern = r'(?:NAME|PANGALAN)[:\s]*([A-Z\s,]+)'
        name_match = re.search(name_pattern, text.upper())
        if name_match:
            result['full_name'] = name_match.group(1).strip()
        
        # Extract birthdate
        date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
        dates = re.findall(date_pattern, text)
        if dates:
            result['birthdate'] = self._parse_date(dates[0])
        
        return result
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to ISO format"""
        formats = ['%m/%d/%Y', '%d-%m-%Y', '%m/%d/%y', '%d/%m/%Y']
        
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        return None
```

### Dockerfile

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and PaddleOCR
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download PaddleOCR models on build
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(use_angle_cls=True, lang='en')"

# Copy application
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
paddlepaddle==2.6.0
paddleocr==2.7.0
opencv-python-headless==4.9.0.80
Pillow==10.2.0
pydantic==2.5.3
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  ocr-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=INFO
      - MAX_IMAGE_SIZE_MB=10
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Phase 3: Laravel API Integration

### New Controller

Create `app/Http/Controllers/OcrController.php`:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrController extends Controller
{
    private string $ocrServiceUrl;

    public function __construct()
    {
        $this->ocrServiceUrl = config('services.ocr.url');
    }

    /**
     * Extract information from ID document
     */
    public function extract(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:10240', // 10MB max
            'id_type' => 'nullable|string',
        ]);

        try {
            $image = $request->file('image');
            
            $response = Http::timeout(30)
                ->attach('image', file_get_contents($image->path()), $image->getClientOriginalName())
                ->post("{$this->ocrServiceUrl}/api/ocr/extract", [
                    'id_type' => $request->input('id_type'),
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::error('OCR service error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'OCR service temporarily unavailable',
            ], 503);

        } catch (\Exception $e) {
            Log::error('OCR extraction failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to process image',
            ], 500);
        }
    }

    /**
     * Check OCR service health
     */
    public function health()
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->ocrServiceUrl}/api/health");

            return response()->json([
                'ocr_service' => $response->successful() ? 'healthy' : 'unhealthy',
                'details' => $response->json(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'ocr_service' => 'unreachable',
                'error' => $e->getMessage(),
            ], 503);
        }
    }
}
```

### Routes

Add to `routes/api.php`:

```php
// OCR Routes
Route::prefix('ocr')->group(function () {
    Route::post('/extract', [OcrController::class, 'extract'])
        ->middleware('auth:sanctum');
    Route::get('/health', [OcrController::class, 'health']);
});
```

### Configuration

Add to `config/services.php`:

```php
'ocr' => [
    'url' => env('OCR_SERVICE_URL', 'http://localhost:8000'),
],
```

Add to `.env`:

```
OCR_SERVICE_URL=http://localhost:8000
```

---

## Phase 4: Deployment

### Option A: DigitalOcean Droplet (Recommended - Cheapest)

**Estimated Cost: ~$6/month**

1. Create a Droplet:
   - Size: Basic, 1GB RAM / 1 CPU ($6/month)
   - Image: Docker on Ubuntu 22.04
   - Region: SGP1 (Singapore) - closest to Philippines

2. Deploy:
   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip
   
   # Clone or copy the ocr-service folder
   git clone your-repo
   cd ocr-service
   
   # Build and run
   docker-compose up -d
   ```

3. Configure firewall:
   ```bash
   ufw allow 8000/tcp
   ```

4. Set up Nginx reverse proxy (optional, for HTTPS):
   ```nginx
   server {
       listen 443 ssl;
       server_name ocr.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option B: DigitalOcean App Platform

**Estimated Cost: ~$12/month (Basic tier)**

1. Create App from GitHub repo
2. Set build command: `docker build -t ocr-service .`
3. Set run command: `docker run -p 8000:8000 ocr-service`
4. Configure environment variables

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `INFO` |
| `MAX_IMAGE_SIZE_MB` | Max upload size | `10` |
| `CORS_ORIGINS` | Allowed origins | `https://pawlink-app.com` |

---

## Phase 5: Frontend Integration

### Update Environment

Add to `.env` or `config/env.ts`:

```typescript
export const OCR_SERVICE_URL = process.env.EXPO_PUBLIC_OCR_SERVICE_URL || '';
```

### Update ocrService.ts

The service is already stubbed. Update the `OCR_SERVICE_URL` to point to the deployed service:

```typescript
const OCR_SERVICE_URL = "https://ocr.yourdomain.com";
// or via Laravel proxy
const OCR_SERVICE_URL = "https://pawlink-app.ondigitalocean.app/api";
```

---

## Testing Plan

### Unit Tests

1. **ID Parser Tests**
   - Test each ID type with sample text
   - Test date parsing with various formats
   - Test confidence calculation

2. **OCR Engine Tests**
   - Test with clear images
   - Test with blurry images
   - Test with rotated images

### Integration Tests

1. **API Tests**
   - Test file upload endpoint
   - Test error handling (invalid image, timeout)
   - Test rate limiting

2. **End-to-End Tests**
   - Upload real (anonymized) ID images
   - Verify extracted fields match expected values

### Test Data

Create anonymized test IDs with:
- Fake names: "JUAN DELA CRUZ", "MARIA SANTOS"
- Fake ID numbers following correct format
- Valid date formats

**IMPORTANT: Never use real ID documents for testing!**

---

## Security Considerations

1. **Data Privacy**
   - Never log full ID images or extracted PII
   - Delete uploaded images immediately after processing
   - Use HTTPS for all communications

2. **Rate Limiting**
   - Limit requests per user/IP
   - Prevent abuse of OCR service

3. **Input Validation**
   - Validate file types (only images)
   - Limit file size (10MB max)
   - Sanitize extracted text

4. **Access Control**
   - Require authentication for OCR endpoints
   - Log all OCR requests for audit

---

## Cost Summary

| Component | Monthly Cost |
|-----------|--------------|
| PaddleOCR | Free (Apache 2.0) |
| DigitalOcean Droplet (1GB) | $6 |
| **Total** | **~$6/month** |

---

## Implementation Timeline

| Week | Tasks |
|------|-------|
| Week 1 | Set up FastAPI project, integrate PaddleOCR |
| Week 2 | Build ID parsers for all 6 ID types |
| Week 3 | Dockerize, deploy to DigitalOcean, Laravel integration |
| Week 4 | Testing, bug fixes, monitoring setup |

---

## Monitoring & Maintenance

1. **Health Checks**
   - Monitor `/api/health` endpoint
   - Set up alerts for downtime

2. **Logging**
   - Log processing times
   - Log error rates by ID type
   - Track confidence scores over time

3. **Updates**
   - Keep PaddleOCR updated for improved accuracy
   - Add new ID types as needed
   - Tune parsers based on real-world data

---

## Future Enhancements

1. **GPU Acceleration**
   - Use GPU-enabled droplet for faster processing
   - Reduces latency from ~2s to ~500ms

2. **Selfie Verification**
   - Compare ID photo with user selfie
   - Face matching for identity verification

3. **Document Quality Check**
   - Detect blurry images before OCR
   - Guide user to retake photo

4. **Multi-language Support**
   - Support IDs with Filipino text
   - Handle mixed English/Filipino content

---

*Last Updated: February 3, 2026*
*Version: 1.0*
