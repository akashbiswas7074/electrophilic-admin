"use client";
import { Button, Burger, Drawer } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import Logo from "./Logo";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
import { lazy, Suspense } from "react";

// Lazy load heavy components
const MobileBottomNavigation = lazy(() => import("@/components/ui/mobile-bottom-navigation").then(mod => ({ default: mod.MobileBottomNavigation })));

// Loading skeleton for mobile bottom navigation
const MobileBottomNavSkeleton = () => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 animate-pulse">
    <div className="flex items-center justify-around h-16">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center justify-center flex-1 py-2">
          <div className="h-5 w-5 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-12 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const Navbar = () => {
  const [opened, { toggle, close }] = useDisclosure(false);

  const NavLinks = () => (
    <>
      <Link href={"/admin/login"}>
        <Button variant="outline" className="w-full sm:w-auto">Admin Login</Button>
      </Link>
      <Link href={"/admin/dashboard"}>
        <Button variant="outline" className="w-full sm:w-auto">Admin Dashboard</Button>
      </Link>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Logo />
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex gap-4">
              <NavLinks />
            </div>

            {/* Mobile Navigation */}
            <Burger
              opened={opened}
              onClick={toggle}
              className="sm:hidden"
              size="sm"
            />
          </div>

          {/* Mobile Menu Drawer */}
          <Drawer
            opened={opened}
            onClose={close}
            size="100%"
            position="right"
            className="sm:hidden"
          >
            <div className="flex flex-col gap-4 p-4 mt-16">
              <NavLinks />
            </div>
          </Drawer>
        </nav>
      </header>

      {/* Lazy loaded mobile bottom navigation */}
      <Suspense fallback={<MobileBottomNavSkeleton />}>
        <MobileBottomNavigation />
      </Suspense>
    </>
  );
};

interface NavItemProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  isMobile?: boolean;
  onClick?: () => void;
}

export function NavItem({ href, label, icon, active, isMobile = false, onClick }: NavItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = active || pathname === href;
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-center px-4 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-blue-50 hover:text-blue-700",
        isActive 
          ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
          : "text-gray-700",
        isMobile && "rounded-md hover:bg-blue-50/70"
      )}
    >
      {icon && <span className={cn("mr-3", isActive ? "text-blue-600" : "text-gray-500")}>{icon}</span>}
      {label}
    </Link>
  );
}

export default Navbar;
