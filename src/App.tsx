import React from "react";
import { Toaster } from "react-hot-toast";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { setupNotifications } from "@/utils/notifications";
import { clearAllNotifications } from "@/utils/notifications";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Link, useNavigate, Outlet } from "@tanstack/react-router";
import { getLastActivityTimestamp } from "@/lib/logsActions";
import { startSessionAndNotify } from "@/utils/sessionNotifier";
import navigation from "@/lib/constants/navigationLinks";

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const appStateHandleRef = React.useRef<PluginListenerHandle | null>(null);
  const resumeHandleRef = React.useRef<PluginListenerHandle | null>(null);

  React.useEffect(() => {
    setupNotifications(navigate, getLastActivityTimestamp);

    // Clear notifications if the app is opened from home screen (or resumed)
    clearAllNotifications().catch((e) =>
      console.warn("clearAllNotifications failed", e)
    );

    try {
      if (Capacitor.isNativePlatform()) {
        (async () => {
          try {
            appStateHandleRef.current = await CapacitorApp.addListener(
              "appStateChange",
              (state: { isActive: boolean }) => {
                if (state.isActive) {
                  clearAllNotifications().catch(() => {});
                }
              }
            );
            resumeHandleRef.current = await CapacitorApp.addListener(
              "resume",
              () => {
                clearAllNotifications().catch(() => {});
              }
            );
          } catch (e) {
            console.warn("Error registering Capacitor app listeners", e);
          }
        })();
      }
    } catch (err) {
      console.warn("Capacitor App listeners not available", err);
    }
    return () => {
      try {
        appStateHandleRef.current?.remove?.();
        resumeHandleRef.current?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [navigate]);

  // Session reset handled explicitly by UI interactions via `startSessionAndNotify()`.

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

      <main className="flex-1 overflow-y-scroll flex flex-col h-full thin-scrollbar">
        <Outlet />
      </main>
    </div>
  );
}
