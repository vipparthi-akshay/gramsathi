import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8003';

const errorRate = new Rate('errors');
const uploadDuration = new Trend('document_upload_duration');
const ocrDuration = new Trend('ocr_processing_duration');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    errors: ['rate<0.01'],
    document_upload_duration: ['p(95)<5000'],
    ocr_processing_duration: ['p(95)<5000'],
  },
};

const TOKEN = __ENV.AUTH_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJyb2xlIjoiY2l0aXplbiIsInR5cGUiOiJhY2Nlc3MifQ.test';

const DOCUMENT_TYPES = [
  'aadhaar',
  'income_certificate',
  'land_record',
  'bank_passbook',
  'other',
];

function generateTestFile(sizeKB = 50) {
  const size = sizeKB * 1024;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let content = '';
  for (let i = 0; i < size; i++) {
    content += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return content;
}

export default function () {
  group('Document Upload and OCR', function () {
    const citizenId = `citizen-${__VU}`;
    const docType = DOCUMENT_TYPES[Math.floor(Math.random() * DOCUMENT_TYPES.length)];

    const fileContent = generateTestFile(Math.floor(Math.random() * 100) + 10);

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    let body = '';
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="citizen_id"\r\n\r\n';
    body += `${citizenId}\r\n`;
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="document_type"\r\n\r\n';
    body += `${docType}\r\n`;
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="test_document.jpg"\r\n';
    body += 'Content-Type: image/jpeg\r\n\r\n';
    body += fileContent;
    body += `\r\n--${boundary}--\r\n`;

    const uploadResp = http.post(`${BASE_URL}/api/v1/documents/upload`, body, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${TOKEN}`,
      },
      tags: { name: 'document_upload' },
    });

    uploadDuration.add(uploadResp.timings.duration);

    const uploadOk = check(uploadResp, {
      'Upload status is 201': (r) => r.status === 201,
      'Upload returns document id': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined;
        } catch (e) {
          return false;
        }
      },
      'Upload duration < 5s': (r) => r.timings.duration < 5000,
    });

    if (!uploadOk) {
      errorRate.add(1);
    }

    if (uploadOk) {
      const uploadBody = JSON.parse(uploadResp.body);

      if (uploadBody.ocr_result) {
        ocrDuration.add(uploadResp.timings.duration);

        check(uploadResp, {
          'OCR has extracted fields': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.ocr_result.extracted_fields !== undefined;
            } catch (e) {
              return false;
            }
          },
          'OCR has confidence score': (r) => {
            try {
              const body = JSON.parse(r.body);
              return body.ocr_result.confidence !== undefined;
            } catch (e) {
              return false;
            }
          },
        });
      }
    }
  });

  sleep(1);
}
