import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return "just now" for times less than 1 minute ago', () => {
    const now = new Date();
    expect(pipe.transform(now.toISOString())).toBe('just now');
  });

  it('should return "Xm ago" for times within the last hour', () => {
    const date = new Date(Date.now() - 5 * 60000); // 5 minutes ago
    expect(pipe.transform(date.toISOString())).toBe('5m ago');
  });

  it('should return "Xh ago" for times within the last 24 hours', () => {
    const date = new Date(Date.now() - 3 * 3600000); // 3 hours ago
    expect(pipe.transform(date.toISOString())).toBe('3h ago');
  });

  it('should return "Yesterday" for times between 24h and 48h ago', () => {
    const date = new Date(Date.now() - 30 * 3600000); // 30 hours ago
    expect(pipe.transform(date.toISOString())).toBe('Yesterday');
  });

  it('should return "Xd ago" for times within the last week', () => {
    const date = new Date(Date.now() - 4 * 86400000); // 4 days ago
    expect(pipe.transform(date.toISOString())).toBe('4d ago');
  });

  it('should return "Mon DD" format for dates older than 7 days', () => {
    const date = new Date(2026, 0, 1); // Jan 1, 2026
    const result = pipe.transform(date.toISOString());
    expect(result).toBe('Jan 1');
  });
});
