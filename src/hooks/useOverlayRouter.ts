import { useCallback } from "react";

import { useQueryParam } from "@/hooks/useQueryParams";
import { useOverlayStore } from "@/stores/overlay/store";

function splitPath(path: string, prefix?: string): string[] {
  const parts = [prefix ?? "", ...path.split("/")];
  return parts.filter((v) => v.length > 0);
}

function joinPath(path: string[]): string {
  return `/${path.join("/")}`;
}

export function useInternalOverlayRouter(id: string) {
  const [route, setRoute] = useQueryParam("r");
  const transition = useOverlayStore((s) => s.transition);
  const setTransition = useOverlayStore((s) => s.setTransition);
  const setAnchorPoint = useOverlayStore((s) => s.setAnchorPoint);
  const routerActive = !!route && route.startsWith(`/${id}`);

  function makePath(path: string) {
    return joinPath(splitPath(path, id));
  }

  function navigate(path: string) {
    const oldRoute = route;
    const newRoute = joinPath(splitPath(path, id));
    setTransition({
      from: oldRoute ?? "/",
      to: newRoute,
    });
    setRoute(newRoute);
  }

  function showBackwardsTransition(path: string) {
    if (!transition) return "none";
    const current = joinPath(splitPath(path, id));

    if (current === transition.to && transition.from.startsWith(transition.to))
      return "yes";
    if (
      current === transition.from &&
      transition.to.startsWith(transition.from)
    )
      return "yes";
    return "no";
  }

  function isCurrentPage(path: string) {
    return routerActive && route === joinPath(splitPath(path, id));
  }

  function isOverlayActive() {
    return routerActive;
  }

  const close = useCallback(() => {
    setTransition(null);
    setRoute(null);
  }, [setRoute, setTransition]);

  const open = useCallback(() => {
    const anchor = document.getElementById(`__overlayRouter::${id}`);
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setAnchorPoint({
        h: rect.height,
        w: rect.width,
        x: rect.x,
        y: rect.y,
      });
    } else {
      setAnchorPoint(null);
    }

    setTransition(null);
    setRoute(`/${id}`);
  }, [id, setRoute, setTransition, setAnchorPoint]);

  return {
    showBackwardsTransition,
    isCurrentPage,
    isOverlayActive,
    navigate,
    close,
    open,
    makePath,
    currentRoute: route,
  };
}

export function useOverlayRouter(id: string) {
  const router = useInternalOverlayRouter(id);
  return {
    id,
    open: router.open,
    close: router.close,
    navigate: router.navigate,
  };
}