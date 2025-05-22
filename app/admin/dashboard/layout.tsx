"use client";
import React from "react";
import "../../globals.css";
import "@mantine/core/styles.css";
import {
  AppShell,
  Burger,
  Group,
  MantineProvider,
  Text,
} from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { MdOutlineCategory, MdSpaceDashboard } from "react-icons/md";
import { IoListCircleSharp } from "react-icons/io5";
import { FaTable, FaStar, FaFilm, FaLayerGroup } from "react-icons/fa";
import { BsPatchPlus } from "react-icons/bs";
import { RiCoupon3Fill, RiSendPlaneFill } from "react-icons/ri"; 
import { VscGraph } from "react-icons/vsc";
import { FaRegRectangleList, FaUsers } from "react-icons/fa6";
import { ImUsers } from "react-icons/im";
import { BiLogOut } from "react-icons/bi";
import { IconAlertCircle } from "@tabler/icons-react";
import Link from "next/link";
import { ModalsProvider } from "@mantine/modals";
import Logo from "@/components/Logo";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import dynamic from "next/dynamic";

// Use dynamic import to prevent server-side rendering errors with notifications
const CancellationRequestNotifier = dynamic(
  () => import("@/components/admin/orders/CancellationRequestNotifier"),
  { ssr: false }
);

// Define the navigation items structure
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

// Define the navigation structure with sections
interface NavSection {
  title?: string;
  items: NavItemProps[];
}

// Create the navigation structure
const navigationItems: NavSection[] = [
  {
    items: [
      {
        href: "/admin/dashboard",
        icon: <MdSpaceDashboard size={20} />,
        label: "Admin Dashboard"
      },
      {
        href: "/admin/dashboard/send-coupon",
        icon: <RiCoupon3Fill size={20} />,
        label: "Send Coupon to User"
      },
      {
        href: "/admin/dashboard/send-email",
        icon: <RiSendPlaneFill size={20} />,
        label: "Send Custom Email"
      }
    ]
  },
  {
    title: "Offers & Reviews",
    items: [
      {
        href: "/admin/dashboard/topbars",
        icon: <FaTable size={20} />,
        label: "Topbar Offers"
      },
      {
        href: "/admin/dashboard/homescreenoffers",
        icon: <FaTable size={20} />,
        label: "Home Screen Offers"
      },
      {
        href: "/admin/dashboard/reviews",
        icon: <FaStar size={20} />,
        label: "Product Reviews"
      }
    ]
  },
  {
    title: "User Management",
    items: [
      {
        href: "/admin/dashboard/users",
        icon: <ImUsers size={20} />,
        label: "Users"
      },
      {
        href: "/admin/dashboard/vendors",
        icon: <FaUsers size={20} />,
        label: "Vendors"
      },
      {
        href: "/admin/dashboard/coupons",
        icon: <RiCoupon3Fill size={20} />,
        label: "Coupons"
      }
    ]
  },
  {
    title: "Orders",
    items: [
      {
        href: "/admin/dashboard/orders",
        icon: <IoListCircleSharp size={20} />,
        label: "Orders"
      },
      {
        href: "/admin/dashboard/orders/cancellation-requests",
        icon: <IconAlertCircle size={18} />,
        label: "Cancellation Requests"
      }
    ]
  },
  {
    title: "Products",
    items: [
      {
        href: "/admin/dashboard/product/all/tabular",
        icon: <FaTable size={20} />,
        label: "All Products"
      },
      {
        href: "/admin/dashboard/product/create",
        icon: <BsPatchPlus size={20} />,
        label: "Create Product"
      }
    ]
  },
  {
    title: "Categories",
    items: [
      {
        href: "/admin/dashboard/categories",
        icon: <MdOutlineCategory size={20} />,
        label: "Categories"
      },
      {
        href: "/admin/dashboard/subCategories",
        icon: <MdOutlineCategory size={20} className="rotate-180" />,
        label: "Sub Categories"
      }
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/admin/dashboard/analytics/order",
        icon: <VscGraph size={20} />,
        label: "Order Analytics"
      }
    ]
  },
  {
    title: "Banners",
    items: [
      {
        href: "/admin/dashboard/banners/website",
        icon: <FaRegRectangleList size={20} />,
        label: "Website Banners"
      },
      {
        href: "/admin/dashboard/banners/metrics",
        icon: <VscGraph size={20} />,
        label: "Banner Analytics"
      },
      {
        href: "/admin/dashboard/banners/app",
        icon: <FaRegRectangleList size={20} />,
        label: "App Banners"
      }
    ]
  },
  {
    title: "Customization",
    items: [
      {
        href: "/admin/dashboard/website-logos",
        icon: <FaRegRectangleList size={20} />,
        label: "Website Logos"
      },
      {
        href: "/admin/dashboard/site-footer",
        icon: <FaRegRectangleList size={20} />,
        label: "Site Footer"
      },
      {
        href: "/admin/dashboard/featuredyoutube",
        icon: <FaFilm size={20} />,
        label: "Featured Video"
      },
      {
        href: "/admin/dashboard/website-sections/category-sections",
        icon: <FaLayerGroup size={20} />,
        label: "Category Sections"
      },
      {
        href: "/admin/dashboard/website-sections",
        icon: <FaLayerGroup size={20} />,
        label: "Website Sections"
      },
      {
        href: "/admin/dashboard/homepage-sections",
        icon: <FaLayerGroup size={20} />,
        label: "Homepage Sections"
      },
      {
        href: "/admin/dashboard/hero-sections",
        icon: <FaLayerGroup size={20} />,
        label: "Hero Sections"
      },
      {
        href: "/admin/dashboard/navbar-links",
        icon: <FaLayerGroup size={20} />,
        label: "Navbar Sections"
      }
    ]
  }
];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST'
      });
      if (response.ok) {
        router.push('/admin/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };  
  
  const NavItem = ({ href, icon, label }: NavItemProps) => (
    <Link href={href} className="block w-full">
      <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
        <div className="min-w-[28px] h-[28px] flex items-center justify-center rounded-lg bg-blue-100/50 text-blue-600">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 truncate">
          {label}
        </span>
      </div>
    </Link>
  );
  
  const NavSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="mb-6">
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 py-2 mb-1">
          {title}
        </div>
      )}
      <div className="space-y-1 px-2">{children}</div>
    </div>
  );
  return (
    <MantineProvider>
      <ModalsProvider>
        <AppShell
          header={{ height: { base: 60, sm: 70 } }}
          navbar={{
            width: { base: 200, sm: 250, lg: 280 },
            breakpoint: "sm",
            collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
          }}
          padding={{ base: "sm", sm: "md", lg: "lg" }}
          transitionDuration={500}
          className="min-h-screen"
        >          <AppShell.Header className="border-b border-gray-200 glass-effect shadow-sm">
            <Group h="100%" px={{ base: "sm", sm: "md" }} className="justify-between">
              <Group gap="sm">
                {/* Desktop burger menu */}
                <Burger
                  opened={desktopOpened}
                  onClick={toggleDesktop}
                  visibleFrom="sm"
                  size="sm"
                  className="flex-shrink-0 text-gray-700"
                />
                {/* Logo */}
                <div className="flex-shrink-0">
                  <Logo className="h-7 sm:h-8" />
                </div>
                <div className="flex flex-col justify-center">
                  <Text className="font-medium text-gray-800 text-sm sm:text-base hidden xs:block">Admin Portal</Text>
                  <Text className="text-xs text-gray-500 hidden sm:block">Management Dashboard</Text>
                </div>
              </Group>
              
              {/* Header right content */}
              <div className="flex items-center gap-3">                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Menu className="h-4 w-4" />
                      <span>Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white border-r border-gray-200 w-full max-w-xs p-0">
                    <SheetHeader className="p-4 border-b">
                      <div className="flex items-center">
                        <Logo className="h-6 mr-2" />
                        <SheetTitle className="text-lg">Admin Menu</SheetTitle>
                      </div>
                    </SheetHeader>
                    <div className="p-0 overflow-auto h-[calc(100vh-80px)]">
                      {/* Mobile Nav Items */}
                      <div className="flex flex-col">
                        {navigationItems.map((section, sectionIndex) => (
                          <div key={`mobile-section-${sectionIndex}`} className="mb-2">
                            {section.title && (
                              <div className="px-4 py-2 bg-blue-50/30">
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                  {section.title}
                                </div>
                              </div>
                            )}
                            {section.items.map((item, itemIndex) => (
                              <NavItem 
                                key={`mobile-item-${sectionIndex}-${itemIndex}`}
                                href={item.href} 
                                icon={item.icon}
                                label={item.label} 
                              />
                            ))}
                          </div>
                        ))}
                        
                        <div className="p-4 mt-4">
                          <Button onClick={handleLogout} variant="destructive" className="w-full">
                            <BiLogOut size={16} className="mr-2" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Button 
                  onClick={handleLogout} 
                  variant="outline" 
                  className="hidden md:flex"
                  size="sm"
                >
                  <BiLogOut size={16} className="mr-2" />
                  Logout
                </Button>
              </div>
            </Group>
          </AppShell.Header>

          <AppShell.Navbar className="bg-white border-r border-gray-200 overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-6 py-2">
                {/* Generate navigation sections and items dynamically */}
                {navigationItems.map((section, index) => (
                  <NavSection key={`section-${index}`} title={section.title}>
                    {section.items.map((item, itemIndex) => (
                      <NavItem 
                        key={`item-${index}-${itemIndex}`}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                      />
                    ))}
                  </NavSection>
                ))}
              </div>
              
              <div className="pt-6 border-t border-gray-200 mt-4">
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 transition-colors duration-200 cursor-pointer text-red-600 mx-2"
                >
                  <div className="min-w-[28px] h-[28px] flex items-center justify-center rounded-lg bg-red-100">
                    <BiLogOut size={18} />
                  </div>
                  <span className="text-sm font-medium">
                    Logout
                  </span>
                </div>
              </div>
            </div>
          </AppShell.Navbar>

          <AppShell.Main className="bg-gray-50/80">
            <div className="max-w-[2000px] mx-auto">
              {children}
            </div>
          </AppShell.Main>
        </AppShell>
        
        {/* Add the CancellationRequestNotifier */}
        <CancellationRequestNotifier />
        
        {/* Add Toaster for notifications */}
        <Toaster />
      </ModalsProvider>
    </MantineProvider>
  );
}
