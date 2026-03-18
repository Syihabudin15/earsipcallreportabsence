import type { IMenu } from "./interface";

export const MenuPermission = (
  items: IMenu[],
  allowedKeys: string[],
): any[] => {
  return items
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = MenuPermission(item.children, allowedKeys);
        const { need_access, ...c } = item;

        if (filteredChildren.length > 0) {
          return {
            ...c,
            children: filteredChildren,
          };
        }
      }
      const { need_access, ...rt } = item;
      const isAllowed = !item.need_access
        ? true
        : allowedKeys.includes(item.path);
      if (isAllowed) {
        return rt;
      }

      return null;
    })
    .filter(Boolean) as any[];
};
