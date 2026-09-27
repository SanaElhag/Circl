import Link from "next/link";

const platformLinks = [
  { label: "Browse Gear",       href: "/browse" },
  { label: "Post a Listing",    href: "/post-gear" },
  { label: "How It Works",      href: "/#how" },
  { label: "For Gear Owners",   href: "/list-your-gear" },
];

const companyLinks = [
  { label: "About Us",    href: "/about" },
  { label: "Community",   href: "/community" },
  { label: "FAQs",        href: "/faqs" },
  { label: "Contact",     href: "/contact" },
];

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy",     href: "/privacy" },
  { label: "Cookie Policy",      href: "/cookies" },
  { label: "Cancellation",       href: "/cancellation" },
];

export default function Footer() {
  return (
    <footer className="bg-[#143D60]">

      {/* Main columns */}
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-4">

          {/* Column 1 — Brand */}
          <div>
            <Link href="/" className="block text-sm font-bold tracking-[0.2em] text-white uppercase mb-6">
              Circl
            </Link>
            <p className="text-sm text-gray-400 leading-loose max-w-xs">
              A peer-to-peer gear exchange built for the UFV community.
              Adventure, made accessible, one rental at a time.
            </p>

            {/* Contact — no phone line or domain yet, so just the essentials */}
            <div className="mt-8 flex flex-col gap-2.5 text-xs text-gray-500 leading-loose">
              <span>BC, Canada</span>
              <a href="mailto:circl@gmail.com" className="hover:text-gray-300 transition-colors duration-200">
                circl@gmail.com
              </a>
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">
              Platform
            </p>
            <ul className="flex flex-col gap-4">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 leading-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Company */}
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">
              Company
            </p>
            <ul className="flex flex-col gap-4">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 leading-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-6">
              Legal
            </p>
            <ul className="flex flex-col gap-4">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 leading-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom row.
          No social row here on purpose — those links pointed at instagram.com /
          tiktok.com / linkedin.com's generic homepages, not real Circl accounts.
          Add them back once real profiles exist. */}
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-center">
          <span className="text-xs text-gray-600 tracking-wide">
            © {new Date().getFullYear()} Circl. All rights reserved.
          </span>
        </div>
      </div>

    </footer>
  );
}