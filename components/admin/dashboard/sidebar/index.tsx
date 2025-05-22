import { LayoutDashboard, ShoppingCart, Layers, GitMerge, Image, Package, Users, Star, Film } from 'lucide-react';

export const navLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    name: "Products",
    icon: ShoppingCart,
    subLinks: [
      { name: "All Products", href: "/admin/dashboard/product/all" },
      { name: "Create Product", href: "/admin/dashboard/product/create" },
    ],
  },
  {
    name: "Categories",
    icon: Layers,
    subLinks: [
      { name: "All Categories", href: "/admin/dashboard/category/all" },
      { name: "Create Category", href: "/admin/dashboard/category/create" },
    ],
  },
  {
    name: "Sub Categories",
    icon: GitMerge,
    subLinks: [
      {
        name: "All Sub Categories",
        href: "/admin/dashboard/subCategory/all",
      },
      {
        name: "Create Sub Category",
        href: "/admin/dashboard/subCategory/create",
      },
    ],
  },
  {
    name: "Banners",
    icon: Image,
    subLinks: [
      { name: "Website Banners", href: "/admin/dashboard/banners/website" },
      {
        name: "Home Screen Offers",
        href: "/admin/dashboard/banners/homeScreenOffers",
      },
    ],
  },
  { name: "Orders", href: "/admin/dashboard/orders", icon: Package },
  { name: "Featured Video", href: "/admin/dashboard/featuredyoutube", icon: Film }, // New link for Featured Video
];