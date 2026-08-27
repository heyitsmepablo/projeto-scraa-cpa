import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme';

describe('ThemeService', () => {
  let service: ThemeService;
  let matchMediaListeners: ((e: MediaQueryListEvent) => void)[] = [];

  const setupMatchMedia = (matches = false) => {
    matchMediaListeners = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn().mockImplementation((event: string, cb: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            matchMediaListeners.push(cb);
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('p-dark', 'dark');
    setupMatchMedia(false);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('p-dark', 'dark');
    matchMediaListeners = [];
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with dark mode when localStorage contains "dark"', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(true);
      expect(document.documentElement.classList.contains('p-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize with light mode when localStorage contains "light"', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(false);
      expect(document.documentElement.classList.contains('p-dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should initialize with OS preference (dark) when localStorage is empty', () => {
      setupMatchMedia(true);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(true);
      expect(document.documentElement.classList.contains('p-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should initialize with OS preference (light) when localStorage is empty', () => {
      setupMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(false);
      expect(document.documentElement.classList.contains('p-dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Theme mutation and persistence', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);
    });

    it('should toggle theme from light to dark', () => {
      service.setDarkMode(false);
      expect(service.isDarkMode()).toBe(false);

      service.toggleTheme();

      expect(service.isDarkMode()).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('p-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should toggle theme from dark to light', () => {
      service.setDarkMode(true);
      expect(service.isDarkMode()).toBe(true);

      service.toggleTheme();

      expect(service.isDarkMode()).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
      expect(document.documentElement.classList.contains('p-dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should set dark mode explicitly via setDarkMode(true)', () => {
      service.setDarkMode(true);

      expect(service.isDarkMode()).toBe(true);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('p-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should set light mode explicitly via setDarkMode(false)', () => {
      service.setDarkMode(true);
      service.setDarkMode(false);

      expect(service.isDarkMode()).toBe(false);
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
      expect(document.documentElement.classList.contains('p-dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('OS Preference Change Listener', () => {
    it('should update theme when OS color scheme changes if localStorage is empty', () => {
      setupMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(false);

      // Simulate OS switching to dark mode
      matchMediaListeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );

      expect(service.isDarkMode()).toBe(true);
      expect(document.documentElement.classList.contains('p-dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not override user preference on OS color scheme change if localStorage is set', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
      setupMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      service = TestBed.inject(ThemeService);

      expect(service.isDarkMode()).toBe(false);

      // Simulate OS switching to dark mode
      matchMediaListeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );

      // User preference should be respected
      expect(service.isDarkMode()).toBe(false);
      expect(document.documentElement.classList.contains('p-dark')).toBe(false);
    });
  });
});
