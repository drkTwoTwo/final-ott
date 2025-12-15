'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => ReactNode;
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const items: NavItem[] = [
    {
      href: '/',
      label: 'Home',
      match: (p) => p === '/',
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          className={classNames('h-4 w-4', active ? 'text-white' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      ),
    },
    {
      href: '/products',
      label: 'Products',
      match: (p) => p === '/products' || p.startsWith('/products/'),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          className={classNames('h-4 w-4', active ? 'text-white' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 7h12" />
          <path d="M6 12h12" />
          <path d="M6 17h12" />
        </svg>
      ),
    },
    {
      href: '/support',
      label: 'Support',
      match: (p) => p === '/support' || p.startsWith('/support/'),
      icon: (active) => (
        <svg
          viewBox="0 0 24 24"
          className={classNames('h-4 w-4', active ? 'text-white' : 'text-gray-400')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 2V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="sm:hidden fixed inset-x-0 bottom-0 z-50 border-t border-gray-800 bg-black/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-3 py-1.5">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  'flex flex-col items-center justify-center gap-0.5 rounded-md py-2',
                  active ? 'text-white' : 'text-gray-400'
                )}
              >
                {item.icon(active)}
                <span className={classNames('text-[11px] leading-none font-medium', active ? 'text-white' : 'text-gray-400')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
