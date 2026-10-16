import { MAX_ATTEMPTS, mailJobSchema, outcomeOf } from './mail-outcome.js';

describe('outcomeOf', () => {
  it('2xx → sent', () => {
    expect(outcomeOf(200, 1)).toBe('sent');
    expect(outcomeOf(201, 1)).toBe('sent');
  });

  it.each([429, 500, 503, 'network'] as const)('%s khi còn lượt → retry', (status) => {
    for (const attempt of [1, 2, 3]) expect(outcomeOf(status, attempt)).toBe('retry');
  });

  it.each([429, 500, 'network'] as const)('%s ở lần cuối → dead', (status) => {
    expect(outcomeOf(status, MAX_ATTEMPTS)).toBe('dead');
  });

  it.each([400, 401, 403])('4xx khác (%s) → dead ngay', (status) => {
    expect(outcomeOf(status, 1)).toBe('dead');
  });

  it('1 lần đầu + 3 retry', () => {
    expect(MAX_ATTEMPTS).toBe(4);
  });
});

describe('mailJobSchema', () => {
  it('job hợp lệ', () => {
    const job = { to: 'a@x.com', subject: 'S', html: '<p>x</p>', attempt: 1 };
    expect(mailJobSchema.parse(job)).toEqual(job);
  });

  it.each([
    { subject: 'S', html: 'h', attempt: 1 },
    { to: 'a@x.com', subject: 'S', html: 'h', attempt: 0 },
    { to: 'a@x.com', subject: 'S', html: 'h', attempt: 1.5 },
  ])('thiếu to / attempt không phải số nguyên dương → lỗi', (job) => {
    expect(mailJobSchema.safeParse(job).success).toBe(false);
  });
});
