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
type EStatus = "APPROVED" | "REJECTED" | "PENDING";

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

export interface IComments {
  name: string;
  date: Date;
  comment: string;
}
export interface IActivities {
  date: Date;
  name: string;
  activities: string;
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
export interface IAbsence {
  id: string;
  method: string;
  check_in: Date | null;
  check_out: Date | null;
  geo_in: string | null;
  geo_out: string | null;
  absence_status: "HADIR" | "TERLAMBAT" | "CUTI" | "PERDIN" | "SAKIT";
  description: string | null;

  created_at: Date;
  updated_at: Date;
  userId: string;
  User?: IUser;
}
export interface IGuestBookType {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IParticipant {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  guestBookId: string;
}
export interface IGuestBook {
  id: string;
  name: string;
  date: Date;
  status_come: "AKANDATANG" | "TELAHDATANG";
  description: string | null;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  gBookTypeId: string;
  GbookType: IGuestBookType;
  participants: IParticipant[];
}
export interface IPermitFileDetail {
  id: string;
  submissionId: string;
  permitFileId: string;
  Submission?: ISubmission;
}
export interface IPermitFile {
  id: string;
  action: string;
  description: string | null;
  permit_status: "PENDING" | "APPROVED" | "REJECTED";
  process_at: Date | null;
  requesterId: string;
  approverId: string | null;
  Requester?: IUser;
  Approver?: IUser;
  PermitFileDetail: IPermitFileDetail[];
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IUser {
  id: string;
  fullname: string;
  nik: string | null;
  nip: string | null;
  phone: string | null;
  email: string | null;
  username: string | null;
  password: string | null;
  salary: number;
  ptkp: string;
  absence_method: "BUTTON" | "FACE";
  face: string | null;
  photo: string | null;
  Role: IRole;
  Position: IPosition;
  Absence: IAbsence[];
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
  SubmissionType: ISubType;
  Visit: IVisit[];
  Submissions: ISubmission[];
  submissionTypeId: string;
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
  Product: IProduct[];
}
export interface IProductTypeFile {
  id: string;
  name: string;
  type: "image" | "video" | "pdf";
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Files: IFile[];
  productTypeId: string;
}
export interface IFile {
  id: string;
  name: string;
  url: string;
  allow_download: string;
  submissionId: string | null;
  productTypeFileId: string | null;
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
  Submission: ISubmission[];
}
export interface ISubmission {
  id: string;
  purpose: string | null;
  coments: IComments[];
  account_number: string | null;
  activities: IActivities[];
  value: number;
  guarantee_status: boolean;
  drawer_code: string;

  is_active: boolean;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur;
  Product: IProduct;
  User: IUser;
  Files: IFile[];
  debiturId: string;
  productId: string;
  userId: string;
  // PermitFileDetail PermitFileDetail[]
}

export interface IVisitCategory {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
  Visit: IVisit[];
}

export interface IVisitStatus {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface IVisitPurpose {
  id: string;
  name: string;
  description: string;
  status: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IVisit {
  id: string;
  date: Date;
  value: number;
  summary?: string;
  coments?: IComments[];
  date_action?: Date;
  geo?: string;
  files?: IFileVisit[];
  next_action?: string;
  approve_status: EStatus;

  status: boolean;
  created_at: Date;
  updated_at: Date;
  Debitur: IDebitur;
  User: IUser;
  VisitCategory: IVisitCategory;
  VisitStatus: IVisitStatus; // Di schema Anda bernama 'Visit' (relation name)
  VisitPurpose: IVisitPurpose; // Di schema Anda bernama 'Visit' (relation name)
  debiturId: string;
  userId: string;
  visitCategoryId: string;
  visitStatusId: string;
  visitPurposeId: string;
}

export interface IFileVisit {
  name: string;
  url: string;
}
