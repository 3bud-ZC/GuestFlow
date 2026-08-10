import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LocaleProvider, useLocale } from '../lib/i18n/LocaleProvider';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a test component to access context
const TestComponent = () => {
  const { locale, setLocale, t } = useLocale();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <button onClick={() => setLocale('ar')}>Set AR</button>
      <button onClick={() => setLocale('en')}>Set EN</button>
    </div>
  );
};

describe('LocaleProvider & RTL', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    document.documentElement.dir = '';
    document.documentElement.lang = '';
    
    // Mock window.location.reload
    delete (window as any).location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
    
    // Clear cookies
    document.cookie = 'gf-locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  });

  it('sets dir="rtl" when locale is "ar"', () => {
    render(
      <LocaleProvider initialLocale="ar">
        <TestComponent />
      </LocaleProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('sets dir="ltr" when locale is "en"', () => {
    render(
      <LocaleProvider initialLocale="en">
        <TestComponent />
      </LocaleProvider>
    );

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('writes gf-locale cookie when setLocale is called', () => {
    const { getByText } = render(
      <LocaleProvider initialLocale="en">
        <TestComponent />
      </LocaleProvider>
    );

    fireEvent.click(getByText('Set AR'));
    
    expect(document.cookie).toContain('gf-locale=ar');
    expect(window.location.reload).toHaveBeenCalled();
  });
});
