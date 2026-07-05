import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8002';

const errorRate = new Rate('errors');
const chatDuration = new Trend('chat_duration');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 300 },
    { duration: '30s', target: 500 },
    { duration: '1m', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.02'],
    chat_duration: ['p(95)<3000'],
  },
};

const MESSAGES = [
  'मुझे किसान योजना के बारे में बताओ',
  'What schemes are available for farmers?',
  'मैं आवेदन कैसे करूं?',
  'How to apply for government schemes?',
  'मेरे आवेदन की स्थिति क्या है?',
  'Track my application status',
  'मैं शिकायत दर्ज करना चाहता हूं',
  'I want to file a complaint',
  'क्या मैं पात्र हूं?',
  'Am I eligible for schemes?',
];

const INTENTS = [
  'scheme_discovery',
  'scheme_discovery',
  'application_help',
  'application_help',
  'status_check',
  'status_check',
  'complaint',
  'complaint',
  'eligibility_check',
  'eligibility_check',
];

export default function () {
  group('AI Chat Session', function () {
    const sessionId = `load-test-${__VU}-${Date.now()}`;
    const citizenId = `citizen-${__VU}`;

    for (let msgIdx = 0; msgIdx < 5; msgIdx++) {
      const msgIndex = Math.floor(Math.random() * MESSAGES.length);
      const message = MESSAGES[msgIndex];
      const intent = INTENTS[msgIndex];

      const payload = JSON.stringify({
        message: message,
        conversation_id: msgIdx === 0 ? undefined : sessionId,
        language: Math.random() > 0.5 ? 'hi' : 'en',
        citizen_id: citizenId,
      });

      const resp = http.post(`${BASE_URL}/api/v1/ai/chat`, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'ai_chat' },
      });

      chatDuration.add(resp.timings.duration);

      const ok = check(resp, {
        'Chat response status is 200': (r) => r.status === 200,
        'Chat has response text': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.response !== undefined && body.response.length > 0;
          } catch (e) {
            return false;
          }
        },
        'Chat response duration < 3s': (r) => r.timings.duration < 3000,
      });

      if (!ok) {
        errorRate.add(1);
      }

      sleep(Math.random() * 2 + 1);
    }
  });

  sleep(2);
}
