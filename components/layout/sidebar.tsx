'use client';

import { ReactNode } from 'react';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger
} from '@/components/ui/menubar';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAppStore } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, Users, Package, Map, Bell, Settings,
  LogOut, MenuIcon, ShoppingBag, CalendarClock, History,
  UserCircle, Home, PanelLeftOpen, PanelLeftClose, Info, Mail,
  HelpCircle, Shield, FileText, ChevronRight, Bookmark,
  Heart, Lightbulb, Settings2, User, Zap, MessageCircle, Database
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const authContext = useAuth();
  const user = authContext?.user;
  const signOut = authContext?.signOut;
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { sidebarOpen, setSidebarOpen, toggleSidebar, unreadNotificationsCount } = useAppStore();
  const [isHomePage, setIsHomePage] = useState(false);

  // Check if we're on the home page
  useEffect(() => {
    setIsHomePage(pathname === '/');
  }, [pathname]);

  // Handle sidebar state based on screen size with performance optimization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const isLargeScreen = window.innerWidth >= 1024;

        if (!isLargeScreen) {
          setIsMobileOpen(false);
        } else if (sidebarOpen === undefined) {
          setSidebarOpen(true);
        }
      }, 100); // Debounce resize events
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [setSidebarOpen, sidebarOpen]);

  // Function to handle mobile navigation
  const onNavItemClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

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

  type NavItem = {
    title: string;
    href: string;
    icon: ReactNode;
    badge?: ReactNode;
  };
  
  const renderNavItems = (): NavItem[] => {
    // Default navigation items for all users
    const defaultNavItems: NavItem[] = [
      {
        title: 'Home',
        href: '/',
        icon: <Home className="mr-2 h-4 w-4" />
      },
      {
        title: 'How It Works',
        href: '/how-it-works',
        icon: <Lightbulb className="mr-2 h-4 w-4" />
      },
      {
        title: 'About',
        href: '/about',
        icon: <Info className="mr-2 h-4 w-4" />
      },
      {
        title: 'Contact',
        href: '/contact',
        icon: <Mail className="mr-2 h-4 w-4" />
      }
    ];

    // Dashboard section for all users
    const dashboardSection: NavItem[] = [
      {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'Donor Dashboard',
        href: '/donor/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'Recipient Dashboard',
        href: '/recipient/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'Donation Page',
        href: '/donor/donations/new',
        icon: <ShoppingBag className="mr-2 h-4 w-4" />
      },
      {
        title: 'Map View',
        href: '/admin/map',
        icon: <Map className="mr-2 h-4 w-4" />
      }
    ];

    // If user is not logged in, show default items and dashboards
    if (!user) {
      return [...dashboardSection, ...defaultNavItems];
    }

    // Role-specific navigation items
    const adminNavItems: NavItem[] = [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'Donors',
        href: '/admin/donors',
        icon: <Heart className="mr-2 h-4 w-4" />
      },
      {
        title: 'Recipients',
        href: '/admin/recipients',
        icon: <Users className="mr-2 h-4 w-4" />
      },
      {
        title: 'Donations',
        href: '/admin/donations',
        icon: <Package className="mr-2 h-4 w-4" />
      },
      {
        title: 'Map View',
        href: '/admin/map',
        icon: <Map className="mr-2 h-4 w-4" />
      },
      {
        title: 'Chat',
        href: '/chat',
        icon: <MessageCircle className="mr-2 h-4 w-4" />
      },
      {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: <Bell className="mr-2 h-4 w-4" />,
        badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined
      },
      {
        title: 'Manage Users',
        href: '/admin/users',
        icon: <User className="mr-2 h-4 w-4" />
      },
      {
        title: 'Backup & Data',
        href: '/admin/backup',
        icon: <Database className="mr-2 h-4 w-4" />
      },
      {
        title: 'Profile',
        href: '/admin/profile',
        icon: <UserCircle className="mr-2 h-4 w-4" />
      }
    ];

    const donorNavItems: NavItem[] = [
      {
        title: 'Dashboard',
        href: '/donor/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'New Donation',
        href: '/donor/donations/new',
        icon: <ShoppingBag className="mr-2 h-4 w-4" />
      },
      {
        title: 'Active Donations',
        href: '/donor/donations/active',
        icon: <Package className="mr-2 h-4 w-4" />
      },
      {
        title: 'Past Donations',
        href: '/donor/donations/history',
        icon: <History className="mr-2 h-4 w-4" />
      },
      {
        title: 'Map View',
        href: '/donor/map',
        icon: <Map className="mr-2 h-4 w-4" />
      },
      {
        title: 'Chat',
        href: '/chat',
        icon: <MessageCircle className="mr-2 h-4 w-4" />
      },
      {
        title: 'Notifications',
        href: '/donor/notifications',
        icon: <Bell className="mr-2 h-4 w-4" />,
        badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined
      },
      {
        title: 'Profile',
        href: '/donor/profile',
        icon: <UserCircle className="mr-2 h-4 w-4" />
      }
    ];

    const recipientItems: NavItem[] = [
      {
        title: 'Dashboard',
        href: '/recipient/dashboard',
        icon: <LayoutDashboard className="mr-2 h-4 w-4" />
      },
      {
        title: 'Available Donations',
        href: '/recipient/donations/available',
        icon: <Package className="mr-2 h-4 w-4" />
      },
      {
        title: 'Upcoming Pickups',
        href: '/recipient/pickups/upcoming',
        icon: <CalendarClock className="mr-2 h-4 w-4" />
      },
      {
        title: 'Past Collections',
        href: '/recipient/pickups/history',
        icon: <History className="mr-2 h-4 w-4" />
      },
      {
        title: 'Map View',
        href: '/recipient/map',
        icon: <Map className="mr-2 h-4 w-4" />
      },
      {
        title: 'Chat',
        href: '/chat',
        icon: <MessageCircle className="mr-2 h-4 w-4" />
      },
      {
        title: 'Notifications',
        href: '/recipient/notifications',
        icon: <Bell className="mr-2 h-4 w-4" />,
        badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined
      },
      {
        title: 'Profile',
        href: '/recipient/profile',
        icon: <UserCircle className="mr-2 h-4 w-4" />
      }
    ];

    // Return role-specific items based on user role
    switch (user.role) {
      case 'admin':
        return [...adminNavItems, ...defaultNavItems];
      case 'donor':
        return [...donorNavItems, ...defaultNavItems];
      case 'recipient':
        return [...recipientItems, ...defaultNavItems];
      default:
        return [...dashboardSection, ...defaultNavItems];
    }
  };

  const navItems = renderNavItems();

  // Render the sidebar content
  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-white/95 backdrop-blur-md border-r border-white/30 shadow-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex flex-col gap-3 px-4 py-6 border-b border-gray-200/60 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 group transition-all duration-300",
              sidebarOpen ? "justify-start" : "justify-center w-full"
            )}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 flex-shrink-0">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div className={cn(
              "transition-all duration-300 overflow-hidden",
              sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <span className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap">FDMS</span>
              <p className="text-xs text-gray-500 -mt-1 whitespace-nowrap">Dashboard</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 hover:bg-gray-100 rounded-lg transition-all duration-300 flex-shrink-0",
              !sidebarOpen && "hidden lg:flex"
            )}
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-gray-600" />
            ) : (
              <PanelLeftOpen className="h-4 w-4 text-gray-600" />
            )}
          </Button>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 mt-2 mb-1 transition-all duration-300",
            sidebarOpen ? "justify-start" : "justify-center"
          )}>
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName} />
              <AvatarFallback className="bg-primary text-white">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "flex flex-col transition-all duration-300 overflow-hidden",
              sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <span className="font-medium text-sm truncate max-w-[150px] whitespace-nowrap">{user.displayName}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[150px] whitespace-nowrap">{user.email}</span>
            </div>
          </div>
        )}

        {/* User Role Badge */}
        {user && (
          <div className={cn(
            "mt-2 transition-all duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
          )}>
            <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-medium text-primary uppercase tracking-wider whitespace-nowrap">
                {user.role} Dashboard
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn("grid gap-1 pb-4 transition-all duration-300", sidebarOpen ? "px-3" : "px-2")}>
          {/* Check if user is not logged in to show dashboard section with separator */}
          {!user && (
            <>
              <div className={cn(
                "px-3 py-2 mb-2 transition-all duration-300",
                !sidebarOpen && "opacity-0 h-0 overflow-hidden"
              )}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Explore</h3>
              </div>
              {navItems.slice(0, 5).map((item: NavItem, index: number) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-all duration-300 group relative',
                    sidebarOpen ? 'px-3 py-3' : 'px-2 py-3 justify-center',
                    pathname === item.href
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <span className={cn(
                    'transition-colors flex-shrink-0',
                    pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && sidebarOpen && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && !sidebarOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              ))}

              <div className={cn(
                "px-3 py-2 mt-2 transition-all duration-300",
                !sidebarOpen && "opacity-0 h-0 overflow-hidden"
              )}>
                <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">GENERAL</h3>
              </div>
              {navItems.slice(5).map((item: NavItem, index: number) => (
                <Link
                  key={index + 5}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative',
                    sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'bg-transparent text-gray-700'
                  )}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={cn(
                    "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && sidebarOpen && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && !sidebarOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              ))}
            </>
          )}
          
          {/* If user is logged in, show categorized navigation items */}
          {user && (
            <>
              <div className={cn(
                "px-3 py-2 transition-all duration-300",
                !sidebarOpen && "opacity-0 h-0 overflow-hidden"
              )}>
                <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">MAIN</h3>
              </div>
              {/* Show first 3 items (usually dashboard and main features) */}
              {navItems.slice(0, 3).map((item: NavItem, index: number) => (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative',
                    sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'bg-transparent text-gray-700'
                  )}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={cn(
                    "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && sidebarOpen && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && !sidebarOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              ))}

              <div className={cn(
                "px-3 py-2 mt-2 transition-all duration-300",
                !sidebarOpen && "opacity-0 h-0 overflow-hidden"
              )}>
                <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">FEATURES</h3>
              </div>
              {/* Show items 3 to 6 (usually features) */}
              {navItems.slice(3, 6).map((item: NavItem, index: number) => (
                <Link
                  key={index + 3}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative',
                    sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'bg-transparent text-gray-700'
                  )}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={cn(
                    "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && sidebarOpen && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && !sidebarOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              ))}

              <div className={cn(
                "px-3 py-2 mt-2 transition-all duration-300",
                !sidebarOpen && "opacity-0 h-0 overflow-hidden"
              )}>
                <h3 className="text-sm font-semibold text-gray-500 whitespace-nowrap">ACCOUNT</h3>
              </div>
              {/* Show remaining items (usually account and settings) */}
              {navItems.slice(6).map((item: NavItem, index: number) => (
                <Link
                  key={index + 6}
                  href={item.href}
                  onClick={onNavItemClick}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative',
                    sidebarOpen ? 'px-3 py-2' : 'px-2 py-2 justify-center',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'bg-transparent text-gray-700'
                  )}
                  title={!sidebarOpen ? item.title : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={cn(
                    "ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap",
                    sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                  {item.badge && sidebarOpen && (
                    <Badge className="ml-auto" variant="destructive">
                      {item.badge}
                    </Badge>
                  )}
                  {item.badge && !sidebarOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Toggle Button for Collapsed State */}
      {!sidebarOpen && (
        <div className="p-2 border-t border-gray-200/60 bg-white/90 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 p-0 hover:bg-gray-100 rounded-lg"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      )}

      {/* Auth Button */}
      <div className="mt-auto p-4 border-t border-gray-200/60 bg-white/90 backdrop-blur-sm">
        {user ? (
          <Button
            variant="outline"
            className={cn(
              "w-full gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 transition-all duration-300",
              sidebarOpen ? "justify-start" : "justify-center px-2"
            )}
            onClick={handleSignOut}
            title={!sidebarOpen ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className={cn(
              "transition-all duration-300 overflow-hidden whitespace-nowrap",
              sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              Sign Out
            </span>
          </Button>
        ) : (
          <div className={cn("flex transition-all duration-300", sidebarOpen ? "flex-col gap-2" : "flex-col gap-1")}>
            <Link href="/auth/login" className="w-full">
              <Button
                variant="outline"
                className={cn(
                  "w-full transition-all duration-300",
                  sidebarOpen ? "justify-start" : "justify-center px-2"
                )}
                title={!sidebarOpen ? "Log in" : undefined}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className={cn(
                  "ml-2 transition-all duration-300 overflow-hidden whitespace-nowrap",
                  sidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  Log in
                </span>
              </Button>
            </Link>
            <Link href="/auth/register" className={cn("w-full transition-all duration-300", !sidebarOpen && "opacity-0 h-0 overflow-hidden")}>
              <Button
                variant="default"
                className="w-full justify-start"
              >
                <Zap className="mr-2 h-4 w-4" />
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  // For mobile devices, use a Sheet component
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-20 z-40 lg:hidden shadow-lg bg-white/90 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(true)}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] mt-16">
            <div className="h-[calc(100vh-4rem)] overflow-hidden">
              {renderSidebarContent()}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // For desktop, render the sidebar directly and make it visible on all pages
  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out overflow-hidden border-r border-white/30 shadow-xl',
        sidebarOpen ? 'w-64' : 'w-[70px]',
        className
      )}
    >
      {renderSidebarContent()}
    </aside>
  );
}
