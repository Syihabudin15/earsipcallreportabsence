import { DeleteOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { Button, Card, Image, Modal } from "antd";
import imageCompression from "browser-image-compression";
import type { IFileVisit } from "../../libs/interface";
import { useState, useRef } from "react";
import api from "../../libs/api";

export const InputFileUploadVisitAuto = ({
  files = [],
  onFilesChange,
  filetype = "image/*",
}: {
  files?: IFileVisit[];
  onFilesChange: (files: IFileVisit[]) => void;
  filetype?: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<IFileVisit | null>(null);

  // Detect if mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  };

  // Generate auto filename with timestamp
  const generateFileName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const fileNumber = (files.length + 1).toString().padStart(3, "0");

    return `Foto_${year}${month}${day}_${hours}${minutes}${seconds}_${fileNumber}`;
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const options = {
        maxSizeMB: 1, // Maksimal hasil jadi 1MB
        maxWidthOrHeight: 1280, // Resolusi cukup untuk web/laporan
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const formData = new FormData();
      formData.append("file", compressedFile, compressedFile.name);

      const res = await api.request({
        url: `${import.meta.env.VITE_API_URL}/file`,
        method: "POST",
        data: formData,
      });

      const autoFileName = generateFileName();
      const newFile: IFileVisit = {
        name: autoFileName,
        url: res.data.url,
      };

      onFilesChange([...files, newFile]);
    } catch (err) {
      console.error("Upload error:", err);
      Modal.error({
        title: "Error Upload",
        content: "Gagal mengupload file. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.currentTarget.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      handleUpload(file);
      // Reset input
      event.currentTarget.value = "";
    }
  };

  const handleDelete = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* File Input - Hidden */}
      <input
        ref={fileInputRef}
        type="file"
        accept={filetype}
        capture={isMobile() ? "environment" : undefined}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {/* Upload Button */}
      <Button
        type="primary"
        size="large"
        onClick={triggerFileInput}
        loading={loading}
        icon={<PlusCircleOutlined />}
        block
      >
        {isMobile() ? "Ambil Foto" : "Upload Foto"}
      </Button>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {files.map((file, index) => (
            <Card
              key={index}
              size="small"
              hoverable
              className="cursor-pointer"
              onClick={() => setPreviewFile(file)}
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div className="relative w-full aspect-square">
                <Image
                  src={file.url}
                  alt={file.name}
                  preview={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Button
                  size="small"
                  danger
                  type="primary"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "4px 8px",
                    fontSize: "10px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={file.name}
                >
                  {file.name}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <Modal
          title={previewFile.name}
          open={!!previewFile}
          onCancel={() => setPreviewFile(null)}
          footer={null}
          width="80%"
          style={{ top: 20 }}
        >
          <Image
            src={previewFile.url}
            alt={previewFile.name}
            style={{ width: "100%" }}
          />
        </Modal>
      )}
    </div>
  );
};
