import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings as SettingsIcon,
  Database,
  Palette,
  Bell,
} from "lucide-react";

const Settings: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your Activity AI preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Data Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Export Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download all your activity data as a JSON file.
              </p>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                Export Activities
              </button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Clear Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Remove all logged activities and start fresh.
              </p>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90 transition-colors">
                Clear All Data
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Theme</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Choose your preferred color scheme.
              </p>
              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-background border rounded-md text-sm hover:bg-muted transition-colors">
                  Light
                </button>
                <button className="px-3 py-2 bg-background border rounded-md text-sm hover:bg-muted transition-colors">
                  Dark
                </button>
                <button className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                  System
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Activity Reminders</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get reminded to log your activities.
              </p>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="reminders" className="rounded" />
                <label htmlFor="reminders" className="text-sm">
                  Enable daily activity reminders
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>About</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">Activity AI v2.0</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your intelligent activity tracking assistant powered by AI.
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Built with React & Capacitor</p>
                <p>Powered by Google Gemini AI</p>
                <p>Local SQLite storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
