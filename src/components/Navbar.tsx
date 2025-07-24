'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Overall' },
    { href: '/keys', label: 'Keys' },
    { href: '/users', label: 'Users' },
    { href: '/assign', label: 'Assign Key' },
    { href: '/export', label: 'Export'}
  ]

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-center space-x-8 h-16 items-center'>
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative
                  text-gray-700
                  hover:text-blue-600
                  font-medium
                  transition
                  duration-150
                  ease-in-out
                  px-3
                  py-2
                  before:absolute
                  before:left-0
                  before:-bottom-1
                  before:h-0.5
                  before:w-full
                  before:rounded-full
                  before:transition-width
                  before:duration-300
                  before:ease-in-out
                  ${isActive
                    ? 'before:bg-blue-600 before:w-full'
                    : 'before:bg-transparent before:w-0 hover:before:w-full'
                  }
                `}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
