import { create } from "zustand";
import type { IPermission, IUser } from "./interface";
import { menus } from "./list_app";
import { MenuPermission } from "./helper";

interface ContextState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastActivity: number;
  login: (userData: IUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken?: string) => void;
  updateActivity: () => void;
  hasAccess: (path: string, access: string) => boolean;
  getMenu: () => any;
}

const useContext = create<ContextState>((set, get) => ({
  user: localStorage.getItem("user")
    ? (JSON.parse(localStorage.getItem("user") || "{}") as IUser)
    : null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  lastActivity: Date.now(),

  login: (userData: IUser, accessToken: string, refreshToken: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({
      user: userData,
      accessToken,
      refreshToken,
      lastActivity: Date.now(),
    });

    // Start activity monitoring
    startActivityMonitoring();
  },

  logout: () => {
    // Call logout API
    const { accessToken } = get();
    if (accessToken) {
      fetch(`${import.meta.env.VITE_API_URL}/auth`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).catch(() => {}); // Ignore errors
    }

    window.location.replace("/");
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      lastActivity: Date.now(),
    });
  },

  updateTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({
      accessToken,
      refreshToken: refreshToken || get().refreshToken,
      lastActivity: Date.now(),
    });
  },

  updateActivity: () => {
    set({ lastActivity: Date.now() });
  },

  hasAccess: (path: string, access: string) => {
    const hasuser = localStorage.getItem("user");
    if (!hasuser) return false;
    const parse = JSON.parse(hasuser) as IUser;
    const userPermission = JSON.parse(
      String(parse.Role.permission) || "[]",
    ) as IPermission[];
    const permission = userPermission.find(
      (p) =>
        p.path === path ||
        `/${path.split("/")[1]}/${path.split("/")[2]}/${path.split("/")[3]}` ===
          p.path,
    );
    if (!permission) return false;
    if (permission.access.includes(access)) return true;
    return false;
  },
  getMenu: () => {
    const hasuser = localStorage.getItem("user");
    if (!hasuser) return false;
    const parse = JSON.parse(hasuser) as IUser;
    const userPermission = JSON.parse(
      String(parse.Role.permission) || "[]",
    ) as IPermission[];
    return MenuPermission(
      menus,
      userPermission.map((m) => m.path),
    );
  },
}));

// Activity monitoring and auto logout
let activityInterval: NodeJS.Timeout;
let logoutTimeout: NodeJS.Timeout;

const startActivityMonitoring = () => {
  // Clear existing timers
  if (activityInterval) clearInterval(activityInterval);
  if (logoutTimeout) clearTimeout(logoutTimeout);

  // Update activity on user interactions
  const events = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];
  const updateActivity = () => {
    useContext.getState().updateActivity();
  };

  events.forEach((event) => {
    document.addEventListener(event, updateActivity, true);
  });

  // Check for inactivity every minute
  activityInterval = setInterval(() => {
    const { lastActivity, logout } = useContext.getState();
    const now = Date.now();
    const inactiveTime = now - lastActivity;

    // Auto logout after 1 hour of inactivity
    if (inactiveTime > 60 * 60 * 1000) {
      // 1 hour
      logout();
    }
  }, 60000); // Check every minute

  // Token refresh every 50 minutes (before 1 hour expiry)
  logoutTimeout = setInterval(
    async () => {
      const { refreshToken, updateTokens, logout } = useContext.getState();
      if (refreshToken) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            updateTokens(data.accessToken);
          } else {
            // Refresh token invalid, logout
            logout();
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          logout();
        }
      }
    },
    50 * 60 * 1000,
  ); // Refresh every 50 minutes
};

// Initialize activity monitoring if user is logged in
if (localStorage.getItem("accessToken")) {
  startActivityMonitoring();
}

export default useContext;
