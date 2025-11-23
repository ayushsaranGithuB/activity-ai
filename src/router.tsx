import { Router, Route } from "@tanstack/react-router";
import Chat from "@/screens/Chat";
import Logs from "@/screens/Logs";
import Trends from "@/screens/Trends";
import Settings from "@/screens/Settings";

export const router = new Router({
  routeTree: [
    {
      path: "/",
      element: <Chat />,
    },
    {
      path: "/chat",
      element: <Chat />,
    },
    {
      path: "/logs",
      element: <Logs />,
    },
    {
      path: "/trends",
      element: <Trends />,
    },
    {
      path: "/settings",
      element: <Settings />,
    },
  ],
});
