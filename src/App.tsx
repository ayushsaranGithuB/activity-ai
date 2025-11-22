import React, { useState } from "react";
import Chat from "@/screens/Chat";
import Logs from "@/screens/Logs";
import Trends from "@/screens/Trends";
import Settings from "@/screens/Settings";
import { Toaster } from "react-hot-toast";
import {
  Menu,
  X,
  Home,
  FileText,
  TrendingUp,
  Settings as SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type Screen = "home" | "logs" | "trends" | "settings";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { id: "home" as Screen, name: "Home", icon: Home, component: Chat },
    { id: "logs" as Screen, name: "Logs", icon: FileText, component: Logs },
    {
      id: "trends" as Screen,
      name: "Trends",
      icon: TrendingUp,
      component: Trends,
    },
    {
      id: "settings" as Screen,
      name: "Settings",
      icon: SettingsIcon,
      component: Settings,
    },
  ];

  const CurrentScreenComponent =
    navigation.find((nav) => nav.id === currentScreen)?.component || Chat;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased flex flex-col">
      <Toaster position="bottom-right" />

      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentScreen("home")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img src="/logo.svg" alt="Activity AI Logo" className="h-6 w-6" />
              <span className="font-semibold">Activity AI</span>
            </button>
          </div>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentScreen(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        currentScreen === item.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.slice(1).map((item) => {
              // Skip home since logo handles it
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentScreen === item.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentScreen(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <CurrentScreenComponent />
      </main>
    </div>
  );
}
