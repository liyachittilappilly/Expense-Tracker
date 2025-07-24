import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Expense Tracker. All rights reserved.
        </p>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="#" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
} 