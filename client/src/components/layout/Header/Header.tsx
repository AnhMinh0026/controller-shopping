interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "PRODUCTS", href: "#products" },
  { label: "FEATURES", href: "#features" },
  { label: "3D TECH", href: "#3d-tech" },
];

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
        <a href="/" aria-label="Flydigi home" className="flex items-center">
          <img
            src="/images/logos/Flydigilogo.avif"
            alt="Flydigi"
            className="h-8 w-auto object-contain md:h-10"
          />
        </a>

        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-10">
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-xs font-medium tracking-widest text-white transition-colors hover:text-brand"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="rounded-full border border-brand bg-transparent px-5 py-2 text-xs font-semibold tracking-widest text-brand transition-colors duration-300 hover:bg-brand hover:text-black"
        >
          PRE-ORDER
        </button>
      </div>
    </header>
  );
}
