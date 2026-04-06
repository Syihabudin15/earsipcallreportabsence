import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Input, Select, Upload, Tooltip, type UploadProps } from "antd";
import type { IFile, IFileVisit } from "../../libs/interface";
import { useState } from "react";
import api from "../../libs/api";

export const IDRFormat = (number: number) => {
  const temp = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: "decimal",
    currency: "IDR",
  }).format(number);
  return temp;
};

export const IDRToNumber = (str: string) => {
  return parseInt(str.replace(/\D/g, ""));
};

export const InputUtil = ({
  label,
  value,
  onchage,
  disabled,
  type,
  options,
  prefix,
  suffix,
}: {
  label: string | React.ReactNode;
  value?: any;
  onchage?: Function;
  disabled?: boolean;
  type: "text" | "number" | "option" | "area" | "date";
  options?: { label: string; value: any }[];
  prefix?: any;
  suffix?: any;
}) => {
  const handleType = (type: "text" | "number" | "option" | "area" | "date") => {
    switch (type) {
      case "number": {
        return (
          <Input
            type={"number"}
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(Number(e.target.value))}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
          />
        );
      }
      case "date": {
        return (
          <Input
            type={"date"}
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(e.target.value)}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
          />
        );
      }
      case "option": {
        return (
          <Select
            style={{ width: "100%" }}
            value={value}
            onChange={(e) => onchage && onchage(e)}
            disabled={disabled}
            options={options}
            showSearch
            optionFilterProp={"label"}
            prefix={prefix}
            suffix={suffix}
          />
        );
      }
      case "area": {
        return (
          <Input.TextArea
            value={value}
            onChange={(e) => onchage && onchage(String(e.target.value))}
            disabled={disabled}
          />
        );
      }
      default: {
        return (
          <Input
            width={"100%"}
            value={value}
            onChange={(e) => onchage && onchage(String(e.target.value))}
            disabled={disabled}
            prefix={prefix}
            suffix={suffix}
          />
        );
      }
    }
  };
  return (
    <div className="flex flex-col">
      <p>{label}</p>
      {handleType(type)}
    </div>
  );
};

export const InputFileUpload = ({
  record,
  onchange,
  ondelete,
  filetype,
  canDelete = true,
}: {
  record: IFile;
  onchange: Function;
  ondelete: Function;
  filetype: string;
  canDelete?: boolean;
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      })
      .then((res) => onchange({ ...record, url: res.data.url }))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
    setLoading(false);
  };

  const getAcceptType = (type: string) => {
    switch (type) {
      case "image":
        return "image/*"; // Semua jenis gambar (jpg, png, webp, dll)
      case "video":
        return "video/*"; // Semua jenis video (mp4, mov, avi, dll)
      case "pdf":
        return ".pdf,application/pdf";
      default:
        return "*";
    }
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false; // prevent automatic upload
    },
    showUploadList: false, // sembunyikan default list
    accept: getAcceptType(filetype),
  };

  return (
    <div className="flex gap-2 items-center">
      <Input
        size="small"
        value={record.name}
        onChange={(e) => onchange({ ...record, name: e.target.value })}
      />
      {record.url ? (
        <Tooltip
          title={
            canDelete
              ? "Hapus file"
              : "Perlu membuat permohonan penghapusan file terlebih dahulu"
          }
        >
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => ondelete()}
            loading={loading}
            disabled={!canDelete}
          ></Button>
        </Tooltip>
      ) : (
        <Upload {...props}>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            type="primary"
            disabled={!record.name}
            loading={loading}
          ></Button>
        </Upload>
      )}
    </div>
  );
};

export const InputFileUploadVisit = ({
  record,
  onchange,
  ondelete,
  filetype,
}: {
  record: IFileVisit;
  onchange: Function;
  ondelete: Function;
  filetype: string;
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    await api
      .request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      })
      .then((res) => onchange({ ...record, url: res.data.url }))
      .catch((err) => {
        console.log(err);
        alert(err);
      });
    setLoading(false);
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false; // prevent automatic upload
    },
    showUploadList: false, // sembunyikan default list
    accept: filetype,
  };

  return (
    <div className="flex gap-2">
      <Input
        size="small"
        value={record.name}
        onChange={(e) => onchange({ ...record, name: e.target.value })}
      />
      {record.url ? (
        <Button
          size="small"
          icon={<DeleteOutlined />}
          danger
          onClick={() => ondelete()}
          loading={loading}
        ></Button>
      ) : (
        <Upload {...props}>
          <Button
            size="small"
            icon={<PlusCircleOutlined />}
            type="primary"
            disabled={!record.name}
            loading={loading}
          ></Button>
        </Upload>
      )}
    </div>
  );
};
