import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const otpSendDuration = new Trend('otp_send_duration');
const otpVerifyDuration = new Trend('otp_verify_duration');

export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 1000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    errors: ['rate<0.01'],
    otp_send_duration: ['p(95)<200'],
    otp_verify_duration: ['p(95)<200'],
  },
};

const MOBILE_PREFIXES = [
  '+91987654',
  '+91987655',
  '+91987656',
  '+91987657',
  '+91987658',
];

export default function () {
  group('OTP Send Flow', function () {
    const prefix = MOBILE_PREFIXES[Math.floor(Math.random() * MOBILE_PREFIXES.length)];
    const mobile = prefix + String(Math.floor(1000 + Math.random() * 9000));

    const sendPayload = JSON.stringify({
      mobile_number: mobile,
    });

    const sendResp = http.post(`${BASE_URL}/api/v1/auth/otp/send`, sendPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'otp_send' },
    });

    otpSendDuration.add(sendResp.timings.duration);

    const sendOk = check(sendResp, {
      'OTP send status is 200': (r) => r.status === 200,
      'OTP send response has success': (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch (e) {
          return false;
        }
      },
      'OTP send duration < 200ms': (r) => r.timings.duration < 200,
    });

    if (!sendOk) {
      errorRate.add(1);
      return;
    }

    const sendBody = JSON.parse(sendResp.body);
    const otp = sendBody.debug_otp || '123456';

    sleep(Math.random() * 2 + 1);

    const verifyPayload = JSON.stringify({
      mobile_number: mobile,
      otp: otp,
    });

    const verifyResp = http.post(`${BASE_URL}/api/v1/auth/otp/verify`, verifyPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'otp_verify' },
    });

    otpVerifyDuration.add(verifyResp.timings.duration);

    const verifyOk = check(verifyResp, {
      'OTP verify status is 200': (r) => r.status === 200,
      'OTP verify has tokens': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.access_token !== undefined && body.refresh_token !== undefined;
        } catch (e) {
          return false;
        }
      },
      'OTP verify duration < 200ms': (r) => r.timings.duration < 200,
    });

    if (!verifyOk) {
      errorRate.add(1);
    }

    if (verifyOk) {
      const verifyBody = JSON.parse(verifyResp.body);
      const authHeaders = {
        Authorization: `Bearer ${verifyBody.access_token}`,
      };

      sleep(1);

      const meResp = http.get(`${BASE_URL}/api/v1/auth/me`, {
        headers: authHeaders,
        tags: { name: 'auth_me' },
      });

      check(meResp, {
        'Profile fetch status is 200': (r) => r.status === 200,
        'Profile has mobile number': (r) => {
          try {
            return JSON.parse(r.body).mobile_number !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
    }
  });

  sleep(1);
}
