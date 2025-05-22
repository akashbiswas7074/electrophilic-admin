"use client";
import { Button, Burger, Drawer } from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import Logo from "./Logo";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";

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
      <span className={isActive ? "font-semibold" : ""}>{label}</span>
    </Link>
  );
}

export default Navbar;
