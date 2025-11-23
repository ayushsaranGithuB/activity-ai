import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import Chat from "@/screens/Chat";
import Logs from "@/screens/Logs";
import Trends from "@/screens/Trends";
import Settings from "@/screens/Settings";
import Layout from "@/App";

const rootRoute = createRootRoute({
  component: Layout,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Chat,
});

const logsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/logs",
  component: Logs,
});

const trendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trends",
  component: Trends,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    chatRoute,
    logsRoute,
    trendsRoute,
    settingsRoute,
  ]),
});
