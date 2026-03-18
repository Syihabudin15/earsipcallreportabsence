// FUNCTION & UTILS
export interface IActionPage<T> {
  upsert: boolean;
  delete: boolean;
  process: boolean;
  record: T | undefined;
}

export interface IPageProps<T> {
  page: number;
  limit: number;
  search: string;
  total: number;
  data: T[];
  [key: string]: any;
}

export interface IMenu {
  path: string;
  name: string;
  icon?: string | React.ReactNode;
  need_access: boolean;
  children?: IMenu[];
}

// UTIL MODEL
export interface IPermission {
  path: string;
  access: string[];
}

// MODEL

export interface IRole {
  id: string;
  name: string;
  data_status: "ALL" | "USER";
  permission: IPermission[];

  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IPosition {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  User: IUser[];
}
export interface IUser {
  id: string;
  fullname: string;
  Role: IRole;
  Position: IPosition;
}
export interface IDebitur {
  id: string;
  fullname: string;
  nik: string;
  cif: string;
  birthplace: string;
  birthdate: Date;
  address: string;
  phone: string;
  email: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface ISubType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur[];
}
export interface IProductType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  ProductTypeFile: IProductTypeFile[];
}
export interface IProductTypeFile {
  id: string;
  name: string;
  type: "image" | "video" | "pdf";
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Files: IFile[];
}
export interface IFile {
  id: string;
  name: string;
  url: string;
  allow_download: string;

  created_at: Date;
}

export interface IProduct {
  id: string;
  name: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  ProductType: IProductType;
  productTypeId: string;
}
