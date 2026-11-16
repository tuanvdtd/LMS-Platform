import { newSerial, SERIAL_RE } from './serial.js';

describe('newSerial', () => {
  it('đúng định dạng AL-XXXX-XXXX-XX, không có ký tự dễ nhầm', () => {
    for (let i = 0; i < 500; i++) {
      const s = newSerial();
      expect(s).toMatch(SERIAL_RE);
      expect(s.startsWith('AL-')).toBe(true);
      expect(s.slice(3)).not.toMatch(/[01ILO]/);
    }
  });
  it('các lần gọi cho mã khác nhau', () => {
    expect(new Set(Array.from({ length: 200 }, newSerial)).size).toBe(200);
  });
});

describe('SERIAL_RE', () => {
  it('từ chối mã sai định dạng', () => {
    for (const s of ['', 'AL-7K3F-92QX', 'al-7k3f-92qx-m4', 'AL-7K3F-92QX-M0', 'AL-7K3F-92QX-M4/', 'XX-7K3F-92QX-M4', '../etc']) {
      expect(s).not.toMatch(SERIAL_RE);
    }
  });
  it('vẫn nhận mã cũ tiền tố SP của chứng chỉ đã cấp', () => {
    expect('SP-7K3F-92QX-M4').toMatch(SERIAL_RE);
  });
});
