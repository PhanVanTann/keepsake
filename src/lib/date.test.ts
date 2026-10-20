/// <reference types="jest" />

import dayjs from 'dayjs';

import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
  const now = dayjs('2026-10-18T13:00:00+07:00');

  it('dưới 1 phút', () => {
    expect(formatRelativeTime('2026-10-18T12:59:30+07:00', now)).toBe('Vừa xong');
  });

  it('theo phút', () => {
    expect(formatRelativeTime('2026-10-18T12:48:00+07:00', now)).toBe('12 phút trước');
  });

  it('theo giờ', () => {
    expect(formatRelativeTime('2026-10-18T10:00:00+07:00', now)).toBe('3 giờ trước');
  });

  it('hôm qua', () => {
    expect(formatRelativeTime('2026-10-17T13:00:00+07:00', now)).toBe('Hôm qua');
  });

  it('quá 1 tuần thì hiện ngày', () => {
    expect(formatRelativeTime('2026-10-01T13:00:00+07:00', now)).toBe('01.10.2026');
  });
});
