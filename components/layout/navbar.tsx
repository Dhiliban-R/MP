'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuTrigger, 
  NavigationMenuContent 
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  LogOut, 
  Menu, 
  X,
  Home,
  Info,
  Mail,
  HelpCircle,
  UserCircle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavLink = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

// Simplified navbar - only essential public links
const navLinks: NavLink[] = [
  { href: "/", label: "Home", icon: <Home className="h-4 w-4 mr-2" /> },
  { href: "/donations", label: "Browse Donations", icon: <HelpCircle className="h-4 w-4 mr-2" /> },
];

export function Navbar() {
  const authContext = useAuth();
  const user = authContext?.user;
  const signOut = authContext?.signOut;
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-b border-white/30 z-50 layout-transition shadow-lg ${scrolled ? 'py-2' : 'py-3'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold text-gray-900 tracking-tight">FDMS</span>
            <p className="text-xs text-gray-500 -mt-1">Food Donation System</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link: NavLink) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === link.href
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* User Menu or Login Button */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                      <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/${user.role}/dashboard`} className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${user.role}/profile`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {user && <div className="mr-2"><NotificationBell /></div>}
          <Button 
            variant={mobileMenuOpen ? "default" : "outline"} 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="shadow-sm"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-white/30 py-4 px-4 shadow-lg mobile-menu animate-in slide-in-from-top-5 duration-300">
          <div className="flex flex-col space-y-3">
            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-700 hover:bg-primary/10 border border-gray-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* User-specific Links */}
            {user ? (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.displayName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/${user.role}/dashboard`}
                    className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary/10 border border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    href={`/${user.role}/profile`}
                    className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary/10 border border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </div>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 w-full mt-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 mt-2 border-t border-gray-100 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="w-full">
                    <Button className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
