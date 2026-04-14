import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IPermission, IUser } from "./interface";
import { menus } from "./list_app";
import { MenuPermission } from "./helper";
import api from "./api";

interface ContextState {
  user: IUser | null;
  token: string | null;
  login: (userData: IUser, token: string) => void;
  logout: () => void;
  updatetoken: () => void;
  hasAccess: (path: string, access: string) => boolean;
  getMenu: () => any;
}

const useContext = create<ContextState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (userData, token) => {
        set({ user: userData, token });
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("user-storage");
        window.location.replace("/");
      },
      hasAccess: (path, access) => {
        const { user } = get();
        if (!user) return false;
        const userPermission = JSON.parse(
          String(user.Role.permission) || "[]",
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
      updatetoken: async () => {
        const { token } = get();
        if (token) {
          await api
            .request({
              method: "GET",
              url: import.meta.env.VITE_API_URL + "/auth",
            })
            .then((res) => {
              if (res.status === 200) {
                set({ token: res.data.token, user: res.data.data });
              } else {
                set({ user: null, token: null });
                localStorage.removeItem("user-storage");
                window.location.replace("/");
              }
            })
            .catch(() => {
              set({ user: null, token: null });
              localStorage.removeItem("user-storage");
              window.location.replace("/");
            });
        }
      },
      getMenu: () => {
        const { user } = get();
        if (!user) return [];
        const userPermission = JSON.parse(
          String(user.Role.permission) || "[]",
        ) as IPermission[];
        return MenuPermission(
          menus,
          userPermission.map((m) => m.path),
        );
      },
    }),
    {
      name: "user-storage",
    },
  ),
);

export default useContext;
