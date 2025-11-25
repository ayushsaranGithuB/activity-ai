import {
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import Chat from "@/screens/Chat";
import Timeline from "@/screens/Timeline";
import Trends from "@/screens/Trends";
import Settings from "@/screens/Settings";
import Categories from "@/screens/Categories";
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
  path: "/timeline",
  component: Timeline,
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

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/categories",
  component: Categories,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    chatRoute,
    logsRoute,
    trendsRoute,
    settingsRoute,
    categoriesRoute,
  ]),
});
