import React from "react";
import { Toaster } from "react-hot-toast";
import {
  Menu,
  Home,
  TrendingUp,
  Settings as SettingsIcon,
  SquareChartGantt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { setupNotifications } from "@/utils/notifications";
import { Link, useNavigate, Outlet } from "@tanstack/react-router";
import { getLastActivityTimestamp } from "@/lib/logsActions";
import { startSessionAndNotify } from "@/utils/sessionNotifier";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setupNotifications(navigate, getLastActivityTimestamp);
  }, [navigate]);

  // Session reset handled explicitly by UI interactions via `startSessionAndNotify()`.

  const navigation = [
    { path: "/", name: "Home", icon: Home },
    { path: "/timeline", name: "Timeline", icon: SquareChartGantt },
    { path: "/trends", name: "Trends", icon: TrendingUp },
    { path: "/settings", name: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col w-full px-3 max-h-screen">
      <Toaster position="bottom-right" />

      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60  app-header">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              onClick={() => {
                try {
                  startSessionAndNotify();
                } catch (e) {
                  console.error("Error starting session from logo click", e);
                }
              }}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.svg" alt="Activity AI Logo" className="h-6 w-6" />
              <span className="font-semibold">Activity AI</span>
            </Link>
          </div>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-full w-full " />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full">
              <SheetTitle className="sr-only">Main Menu</SheetTitle>
              <div className="flex flex-col space-y-4 mt-6 pt-[80px]">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        try {
                          if (item.path === "/") startSessionAndNotify();
                        } catch (e) {
                          console.error("Error starting session from menu", e);
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xl">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden md:flex items-center space-x-1">
            {navigation.slice(1).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center space-x-2"
                >
                  <Button variant="ghost" size="sm">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-y-scroll flex flex-col h-full">
        <Outlet />
      </main>
    </div>
  );
}
