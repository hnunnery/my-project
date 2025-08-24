import Image from 'next/image'

const footerNavigation = {
  solutions: [
    { name: 'Hosting', href: '#' },
    { name: 'Data services', href: '#' },
    { name: 'Uptime monitoring', href: '#' },
    { name: 'Enterprise services', href: '#' },
    { name: 'Analytics', href: '#' },
  ],
  support: [
    { name: 'Submit ticket', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Guides', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Jobs', href: '#' },
    { name: 'Press', href: '#' },
  ],
  legal: [
    { name: 'Terms of service', href: '#' },
    { name: 'Privacy policy', href: '#' },
    { name: 'License', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="relative mx-auto mt-32 max-w-7xl px-6 lg:px-8">
      <div className="border-t border-gray-900/10 py-16 sm:py-24 lg:py-32 dark:border-white/10">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <Image
            alt="Company name"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            className="h-9 dark:hidden"
            width={36}
            height={36}
          />
          <Image
            alt="Company name"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            className="h-9 not-dark:hidden"
            width={36}
            height={36}
          />
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Solutions</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.solutions.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.support.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm/6 font-semibold text-gray-900 dark:text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {footerNavigation.legal.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className="text-sm/6 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

