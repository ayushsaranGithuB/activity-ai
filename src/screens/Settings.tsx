import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Settings as SettingsIcon,
  Database,
  Bell,
  Bug,
  ChartBarStacked,
  LoaderCircle,
  Copy,
} from "lucide-react";
import { sendNotification } from "@/utils/notifications";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import { LocalNotifications } from "@capacitor/local-notifications";
import { storage } from "@/agent/tools";
import { recategorizeActivities } from "@/agent/agent";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import ConfirmRecategorizeModal from "@/components/ui/ConfirmRecategorizeModal";
import BottomNavBar from "@/components/ui/BottomNavBar";

const doRecategorize = async () => {
  try {
    const id = toast.loading(
      "Recategorizing activities — this may take a few minutes..."
    );
    const result = await recategorizeActivities();
    toast.dismiss(id);
    if (result.success) {
      toast.success(
        `Recategorization complete! ${result.recategorized} activities updated. ${result.errors} errors.`
      );
    } else {
      toast.error("Recategorization failed. Please try again.");
    }
  } catch (error) {
    console.error("Recategorization error:", error);
    toast.error(
      "Recategorization failed. Please check the console for details."
    );
  }
};

const Settings: React.FC = () => {
  const [recategorizeModalOpen, setRecategorizeModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<string | null>(null);

  const exportDatabase = async () => {
    setIsExporting(true);
    try {
      const activities = await storage.getAllActivities();
      const categories = await storage.getAllCategories();

      const data = {
        activities,
        categories,
      };

      // Instead of triggering a file download (which can fail on Android
      // due to file permissions), show the data in a modal so the user
      // can view, scroll, and copy the JSON.
      setExportData(JSON.stringify(data, null, 2));
      setExportModalOpen(true);
    } catch (error) {
      console.error("Failed to export database:", error);
      toast.error("Failed to export database. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Activity AI preferences
          </p>
        </div>

        <div className="grid gap-6 ">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartBarStacked className="h-5 w-5" />
                <span>Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/*  Notification Settings ------------------------------------------ */}

              <div className="p-4 rounded-lg  bg-neutral-900">
                <div className=" flex justify-between items-center">
                  <h4 className="font-medium mb-2">Edit Categories</h4>
                  <Link
                    to="/settings/categories"
                    className="text-sm text-primary border px-2 py-1 rounded-md"
                  >
                    Edit
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage your activity categories.
                </p>
              </div>

              <div className="p-4 rounded-lg  bg-neutral-900">
                <h4 className="font-medium mb-2">Recategorize Activities</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use AI to recategorize all your existing activities with
                  better, more specific categories.
                </p>
                <Button
                  variant={"outline"}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors cursor-pointer"
                  onClick={() => setRecategorizeModalOpen(true)}
                >
                  Recategorize All Activities
                </Button>
                <ConfirmRecategorizeModal
                  open={recategorizeModalOpen}
                  onClose={() => setRecategorizeModalOpen(false)}
                  onConfirm={doRecategorize}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="h-5 w-5" />
                <span>Debug</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/*  Notification Settings ------------------------------------------ */}

              <div className="p-4 rounded-lg  bg-neutral-900">
                <div className=" flex justify-between items-center">
                  <h4 className="font-medium mb-2">Notificaions</h4>
                  {/* Slider to enable/disable notifications */}
                  <Switch
                    onCheckedChange={
                      // toggle notifications permissions
                      async (checked) => {
                        const permission =
                          await LocalNotifications.requestPermissions();
                        if (checked && permission.display !== "granted") {
                          toast.error("Notifications permission not granted");
                          return;
                        }
                      }
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  enable or disable app notifications.
                </p>
              </div>

              {/* Test Notification ------------------------------------------ */}
              <div className="p-4 rounded-lg  bg-neutral-900">
                <h4 className="font-medium mb-2">Test Notification</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Send a test notification to ensure notifications are working.
                </p>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors border cursor-pointer"
                  onClick={() => {
                    sendNotification(
                      "Test Notification",
                      "This is a test notification from Activity AI!"
                    );
                  }}
                >
                  Send Test Notification
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg  bg-neutral-900">
                <h4 className="font-medium mb-2">Export Data</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all your activity data as a JSON file.
                </p>
                <Button
                  variant={"outline"}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                  onClick={exportDatabase}
                >
                  Export Activities
                  <LoaderCircle
                    className={`ml-2 h-4 w-4 animate-spin ${
                      isExporting ? "inline-block" : "hidden"
                    }`}
                  />
                </Button>
              </div>

              <div className="p-4 rounded-lg  bg-neutral-900">
                <h4 className="font-medium mb-2">Clear Data</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Remove all logged activities and start fresh.
                </p>
                <Button
                  variant={"outline"}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90 transition-colors"
                >
                  Clear All Data
                </Button>
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
              <div className="p-4 rounded-lg  bg-neutral-900">
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

          <Card className="border-0">
            <CardHeader>
              <h3 className="flex items-center space-x-2">
                <SettingsIcon className="h-5 w-5" />
                <span>About</span>
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg  bg-neutral-900">
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
      <BottomNavBar activePath="/settings" />
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setExportModalOpen(false)}
          />

          <div className="relative w-[95%] max-w-3xl mx-auto bg-neutral-800 border rounded-md p-4 z-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium">Exported Database</h2>
                <p className="text-sm text-muted-foreground">
                  JSON view of your activities and categories
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="inline-flex items-center px-3 py-1 rounded bg-primary text-primary-foreground text-sm"
                  onClick={async () => {
                    try {
                      if (!exportData) return;
                      await navigator.clipboard.writeText(exportData);
                      toast.success("JSON copied to clipboard");
                    } catch (err) {
                      console.error("Copy failed", err);
                      toast.error("Failed to copy JSON");
                    }
                  }}
                  title="Copy JSON"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </button>

                <button
                  className="px-3 py-1 rounded bg-muted text-sm"
                  onClick={() => setExportModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="max-h-[60vh] overflow-auto bg-neutral-900 rounded p-3 text-xs font-mono whitespace-pre-wrap">
                {exportData ? (
                  <pre className="text-xs">{exportData}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No data to show
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
