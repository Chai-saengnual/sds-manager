import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cn,
  formatDate,
  formatDateThai,
  getDaysUntil,
  getDaysOverdue,
  isOverdue,
  isExpiringSoon,
  formatRelativeTime,
  truncate,
  slugify,
  getInitials,
  formatFileSize,
  generatePartNumber,
  groupBy,
  sortBy,
  downloadFile,
} from '../utils';

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      if (formatStr === 'PPP') return 'Jan 15, 2024';
      return formatStr;
    }),
    parseISO: vi.fn((date: string) => new Date(date)),
    differenceInDays: vi.fn((date: Date, _now: Date) => {
      // Mock: return 30 days for future dates, -10 for past
      const inputDate = new Date(date);
      const now = new Date('2024-01-15');
      const diff = Math.floor((inputDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    }),
    formatDistanceToNow: vi.fn(() => '2 days ago'),
  };
});

describe('cn', () => {
  it('merges class names with clsx and tailwind-merge', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('handles conditional classes', () => {
    const result = cn('base-class', false && 'conditional-class', 'another-class');
    expect(result).toBeTruthy();
  });
});

describe('formatDate', () => {
  it('returns dash for null date', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns dash for undefined date', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('formats Date object', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(result).toBeTruthy();
  });

  it('formats string date', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBeTruthy();
  });

  it('uses custom format string', () => {
    const result = formatDate(new Date('2024-01-15'), 'yyyy-MM-dd');
    expect(result).toBe('yyyy-MM-dd'); // Mocked format
  });
});

describe('formatDateThai', () => {
  it('returns dash for null date', () => {
    expect(formatDateThai(null)).toBe('-');
  });

  it('formats date in Thai locale', () => {
    const result = formatDateThai(new Date('2024-01-15'));
    expect(result).toBeTruthy();
  });
});

describe('getDaysUntil', () => {
  it('returns null for null date', () => {
    expect(getDaysUntil(null)).toBeNull();
  });

  it('returns null for undefined date', () => {
    expect(getDaysUntil(undefined)).toBeNull();
  });

  it('returns days difference for valid date', () => {
    const result = getDaysUntil(new Date('2024-02-14'));
    expect(typeof result).toBe('number');
  });
});

describe('getDaysOverdue', () => {
  it('returns null for null date', () => {
    expect(getDaysOverdue(null)).toBeNull();
  });

  it('returns null for future date', () => {
    const daysUntil = getDaysUntil(new Date('2025-01-15'));
    expect(getDaysOverdue(new Date('2025-01-15'))).toBeNull();
  });

  it('returns overdue days for past date', () => {
    // When mock returns -10, it means 10 days in the past (overdue)
    const result = getDaysOverdue(new Date('2024-01-05'));
    expect(result).toBe(10); // |daysUntil| when overdue
  });
});

describe('isOverdue', () => {
  it('returns false for null date', () => {
    expect(isOverdue(null)).toBe(false);
  });

  it('returns true for past date', () => {
    expect(isOverdue(new Date('2020-01-01'))).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isOverdue(new Date('2025-01-01'))).toBe(false);
  });
});

describe('isExpiringSoon', () => {
  it('returns false for null date', () => {
    expect(isExpiringSoon(null)).toBe(false);
  });

  it('returns false for past date', () => {
    expect(isExpiringSoon(new Date('2020-01-01'))).toBe(false);
  });

  it('returns true for date within default 30 days', () => {
    // Mock returns 30 for 30 days in future
    expect(isExpiringSoon(new Date('2024-02-14'))).toBe(true);
  });

  it('returns true for date within custom days', () => {
    expect(isExpiringSoon(new Date('2024-02-14'), 60)).toBe(true);
  });

  it('returns false for date beyond threshold', () => {
    // Mock returns 365 for 1 year in future
    expect(isExpiringSoon(new Date('2025-01-15'))).toBe(false);
  });
});

describe('formatRelativeTime', () => {
  it('returns dash for null date', () => {
    expect(formatRelativeTime(null)).toBe('-');
  });

  it('returns formatted relative time', () => {
    const result = formatRelativeTime(new Date());
    expect(result).toBe('2 days ago');
  });
});

describe('truncate', () => {
  it('returns original string if shorter than length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates string longer than length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello')).toBe('hello');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Hello@World!')).toBe('helloworld');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('Hello---World')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });
});

describe('getInitials', () => {
  it('returns initials from two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for one word', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('returns uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('limits to two characters', () => {
    expect(getInitials('John Paul Smith')).toBe('JP');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});

describe('formatFileSize', () => {
  it('returns 0 Bytes for 0', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('shows decimal precision', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});

describe('generatePartNumber', () => {
  it('generates part number with default prefix', () => {
    const result = generatePartNumber();
    expect(result).toMatch(/^SKU-[A-Z0-9]+-[A-Z0-9]{3}$/);
  });

  it('generates part number with custom prefix', () => {
    const result = generatePartNumber('CHEM');
    expect(result).toMatch(/^CHEM-[A-Z0-9]+-[A-Z0-9]{3}$/);
  });

  it('generates unique part numbers', () => {
    const result1 = generatePartNumber();
    const result2 = generatePartNumber();
    expect(result1).not.toBe(result2);
  });
});

describe('groupBy', () => {
  interface Item {
    category: string;
    name: string;
  }

  const items: Item[] = [
    { category: 'A', name: 'Item1' },
    { category: 'B', name: 'Item2' },
    { category: 'A', name: 'Item3' },
  ];

  it('groups items by key', () => {
    const result = groupBy(items, 'category');
    expect(result['A']).toHaveLength(2);
    expect(result['B']).toHaveLength(1);
  });

  it('creates empty array for missing groups', () => {
    const result = groupBy(items, 'category');
    expect(result['C']).toEqual([]);
  });
});

describe('sortBy', () => {
  interface Item {
    name: string;
    value: number;
  }

  const items: Item[] = [
    { name: 'Banana', value: 3 },
    { name: 'Apple', value: 1 },
    { name: 'Cherry', value: 2 },
  ];

  it('sorts ascending by default', () => {
    const result = sortBy(items, 'value');
    expect(result[0].name).toBe('Apple');
    expect(result[1].name).toBe('Cherry');
    expect(result[2].name).toBe('Banana');
  });

  it('sorts descending', () => {
    const result = sortBy(items, 'value', 'desc');
    expect(result[0].name).toBe('Banana');
    expect(result[2].name).toBe('Apple');
  });

  it('does not mutate original array', () => {
    const original = [...items];
    sortBy(items, 'value');
    expect(items).toEqual(original);
  });

  it('handles string sorting', () => {
    const result = sortBy(items, 'name');
    expect(result[0].name).toBe('Apple');
  });
});

describe('downloadFile', () => {
  beforeEach(() => {
    // Mock document.createElement
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };
    vi.stubGlobal('document', {
      createElement: () => mockLink,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });
  });

  it('creates and clicks download link', () => {
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };
    vi.stubGlobal('document', {
      createElement: () => mockLink,
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    });

    downloadFile('https://example.com/file.pdf', 'file.pdf');

    expect(mockLink.href).toBe('https://example.com/file.pdf');
    expect(mockLink.download).toBe('file.pdf');
    expect(mockClick).toHaveBeenCalled();
  });
});