import { create } from "zustand";
import type { IPermission, IUser } from "./interface";
import { menus } from "./list_app";
import { MenuPermission } from "./helper";

const useContext = create((set) => ({
  user: localStorage.getItem("user")
    ? (JSON.parse(localStorage.getItem("user") || "{}") as IUser)
    : null,
  token: localStorage.getItem("token") || null,

  login: (userData: IUser, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    set({ user: userData, token: token });
  },

  logout: () => {
    window.location.replace("/");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({ user: null, token: null });
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

export default useContext;
