import React, { useState } from "react";
import type {
  IFile,
  IProductTypeFile,
  ISubmission,
} from "../../libs/interface";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  List,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FolderOpenFilled,
  HistoryOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { IDRFormat } from "./utilForm";
import moment from "moment";
import { BookPlus } from "lucide-react";
import Title from "antd/es/typography/Title";
const { Text } = Typography;
const { Panel } = Collapse;
import { PDFDocument } from "pdf-lib";
import useContext from "../../libs/context";

export const CollapseText = ({
  text,
  maxLength = 100,
}: {
  text: string;
  maxLength?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Jika teks lebih pendek dari batas, tampilkan langsung tanpa tombol
  if (text.length <= maxLength) {
    return <p>{text}</p>;
  }

  return (
    <div>
      <p style={{ lineHeight: "1.3", color: "#333" }}>
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            paddingLeft: "5px",
            fontWeight: "bold",
          }}
        >
          {isExpanded ? "Lihat Sedikit" : "Selengkapnya"}
        </button>
      </p>
    </div>
  );
};
export const CollapseList = ({
  items,
  initialVisible = 2,
}: {
  items: string[] | React.ReactNode[];
  initialVisible?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Tentukan item mana saja yang akan ditampilkan
  const visibleItems = isExpanded ? items : items.slice(0, initialVisible);

  return (
    <div
      style={{ padding: "5px", borderRadius: "8px", maxWidth: 300 }}
      className="text-xs"
    >
      <ul className="list-disc list-inside">
        {visibleItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {/* Tampilkan tombol hanya jika jumlah item lebih dari batas awal */}
      {items.length > initialVisible && (
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontSize: 10 }}
          className="text-blue-400 cursor-pointer"
        >
          ... {isExpanded ? "show less" : `show all (${items.length})`}
        </div>
      )}
    </div>
  );
};

export const DetailSubmission = ({
  record,
  open,
  setOpen,
}: {
  record: ISubmission;
  open: boolean;
  setOpen: Function;
}) => {
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={
        <Space>
          <FileTextOutlined style={{ color: "#1890ff" }} />
          <span>DETAIL PERMOHONAN #{record.id}</span>
        </Space>
      }
      width={1000}
      footer={[]}
      style={{ top: 10 }}
    >
      <div style={{ padding: "10px 0" }}>
        {/* ROW 1: STATUS UTAMA & JAMINAN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <Card size="small" className="bg-light">
            <Text type="secondary">Total Nilai Permohonan (Value)</Text>
            <Title level={3} style={{ margin: 0, color: "#0958d9" }}>
              Rp. {IDRFormat(record.value)}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">{record.Product?.ProductType?.name}</Tag>
              <Badge status="processing" text={record.Product?.name} />
            </Space>
            <div></div>
            <Space style={{ marginTop: 8 }}>
              <Tag color="blue">No Lemari/Laci : </Tag>
              <Badge status="processing" text={record.drawer_code || "-"} />
            </Space>
          </Card>

          <Card
            size="small"
            title="Status Permohonan"
            styles={{
              header: {
                fontSize: "12px",
                background: record.is_active ? "#f6ffed" : "#fff7e6",
              },
            }}
            style={{
              border: record.is_active
                ? "1px solid #b7eb8f"
                : "1px solid #ffd591",
            }}
          >
            <Space
              direction="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              {record.is_active ? (
                <Tag color="success" icon={<SafetyCertificateOutlined />}>
                  AKTIF
                </Tag>
              ) : (
                <Tag color="warning" icon={<HistoryOutlined />}>
                  PENDING
                </Tag>
              )}
            </Space>
          </Card>
          <Card
            size="small"
            title="Status Jaminan"
            styles={{
              header: {
                fontSize: "12px",
                background: record.guarantee_status ? "#f6ffed" : "#fff7e6",
              },
            }}
            style={{
              border: record.guarantee_status
                ? "1px solid #b7eb8f"
                : "1px solid #ffd591",
            }}
          >
            <Space
              orientation="vertical"
              align="center"
              style={{ width: "100%" }}
            >
              {record.guarantee_status ? (
                <Tag color="success" icon={<SafetyCertificateOutlined />}>
                  SELESAI
                </Tag>
              ) : (
                <Tag color="warning" icon={<HistoryOutlined />}>
                  PENDING
                </Tag>
              )}
            </Space>
          </Card>
        </div>

        {/* ROW 2: DETAIL DEBITUR & ACCOUNT */}
        <Divider titlePlacement="left" plain>
          <UserOutlined /> Data Debitur
        </Divider>
        <Descriptions bordered size="small" column={{ xl: 2, xs: 1 }}>
          <Descriptions.Item label="Nama Lengkap">
            **{record.Debitur?.fullname}**
          </Descriptions.Item>
          <Descriptions.Item label="NIK / KTP">
            {record.Debitur?.nik}
          </Descriptions.Item>
          <Descriptions.Item label="Nomor CIF">
            `{record.Debitur?.cif || "-"}`
          </Descriptions.Item>
          <Descriptions.Item label="Tempat, Tanggal Lahir">
            {`${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}`}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat">
            {record.Debitur.address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="No Telepon">
            {record.Debitur.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {record.Debitur.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Pemohon">
            {record.Debitur.SubmissionType.name}
          </Descriptions.Item>
        </Descriptions>

        <Divider titlePlacement="left" plain>
          <div className="flex gap-2 items-center">
            <BookPlus size={15} /> Data Permohonan
          </div>
        </Divider>
        <Descriptions bordered size="small" column={{ xl: 2, xs: 1 }}>
          <Descriptions.Item label="Nama Lengkap">
            **{record.Debitur?.fullname}**
          </Descriptions.Item>
          <Descriptions.Item label="NIK / KTP">
            {record.Debitur?.nik}
          </Descriptions.Item>
          <Descriptions.Item label="Nomor CIF">
            `{record.Debitur?.cif || "-"}`
          </Descriptions.Item>
          <Descriptions.Item label="Tempat, Tanggal Lahir">
            {`${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}`}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat">
            {record.Debitur.address || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="No Telepon">
            {record.Debitur.phone || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {record.Debitur.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Jenis Pemohon">
            {record.Debitur.SubmissionType.name}
          </Descriptions.Item>
        </Descriptions>

        {/* ROW 3: DAFTAR FILE DIGITAL */}
        <Divider titlePlacement="left" plain>
          <FilePdfOutlined /> Dokumen Elektronik (E-Files)
        </Divider>
        <FileArchiveSection record={record} />

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Petugas EArsip: **{record.User?.fullname}**
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export const FileArchiveSection = ({ record }: { record: any }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const { user, hasAccess } = useContext((state: any) => state);

  // Fungsi untuk membuka preview PDF
  const handlePreview = async (
    url: string,
    name: string,
    type: string,
    ptypefile?: string,
  ) => {
    if (ptypefile) {
      const allFiles = await MergePDFs(
        record.Product?.ProductType?.ProductTypeFile.find(
          (t: IProductTypeFile) => t.id === ptypefile,
        )?.Files.map((f: IFile) => f.url),
      );
      console.log({ allFiles });
      console.log({
        url,
        name,
        type,
        ptypefile,
        urls: record.Product?.ProductType?.ProductTypeFile.find(
          (t: IProductTypeFile) => t.name === ptypefile,
        )?.Files.map((f: IFile) => f.url),
      });
      setCurrentFile({ url: allFiles || "", name, type });
    } else {
      setCurrentFile({ url, name, type });
    }
    setPreviewOpen(true);
  };

  const productFiles =
    record.Product?.ProductType?.ProductTypeFile.map((p: IProductTypeFile) => {
      return {
        ...p,
        ...(p.type === "pdf" &&
          p.Files.length !== 0 && {
            Files: p.Files &&
              p.Files.length !== 0 && [
                {
                  id: p.id + "1",
                  name: "Semua File",
                  allow_download: "",
                  url: "",
                },
                ...p.Files,
              ],
          }),
      };
    }) || [];

  if (productFiles.length === 0)
    return <Empty description="Tidak ada kategori dokumen" />;

  return (
    <div style={{ marginTop: 16 }}>
      <Collapse
        defaultActiveKey={[0]}
        expandIconPlacement="start"
        ghost
        className="archive-collapse"
      >
        {productFiles.map((category: IProductTypeFile, idx: number) => (
          <Panel
            header={
              <Space>
                <FolderOpenFilled style={{ color: "#faad14" }} />
                <Text strong>{category.name}</Text>
                <Badge
                  count={category.Files?.length || 0}
                  showZero
                  color="#0958d9"
                  size="small"
                />
              </Space>
            }
            key={idx}
            style={{
              marginBottom: 10,
              background: "#fafafa",
              borderRadius: "8px",
            }}
          >
            <List
              grid={{ gutter: 12, column: 2 }}
              dataSource={category.Files}
              renderItem={(file: IFile) => (
                <List.Item style={{ marginBottom: 8 }}>
                  <Card
                    size="small"
                    hoverable
                    styles={{ body: { padding: 12 } }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {/* Avatar / Icon */}
                        <Avatar
                          shape="square"
                          icon={<FilePdfOutlined />}
                          style={{
                            backgroundColor: "#fff1f0",
                            color: "#ff4d4f",
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        />

                        {/* Nama File */}
                        <Text
                          ellipsis={{ tooltip: file.name }}
                          style={{ fontSize: "13px", fontWeight: 500 }}
                        >
                          {file.name}
                        </Text>
                      </div>

                      <div className="flex gap-1">
                        <Tooltip title="Preview PDF">
                          <Button
                            // type="link" // Gunakan link agar lebih hemat ruang
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() =>
                              handlePreview(
                                file.url,
                                file.name,
                                category.type,
                                file.name === "Semua File"
                                  ? category.id
                                  : undefined,
                              )
                            }
                          ></Button>
                        </Tooltip>
                        {user &&
                          (file.allow_download.split(",").includes(user.id) ||
                            hasAccess(
                              "/app/earsip/submission",
                              "download",
                            )) && (
                            <Tooltip title="Download PDF">
                              <Button
                                size="small"
                                icon={<PrinterOutlined />}
                              ></Button>
                            </Tooltip>
                          )}
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Panel>
        ))}
      </Collapse>

      {/* Modal untuk Preview PDF */}
      <Modal
        title={currentFile?.name}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        styles={{ body: { height: "80vh", padding: 0 } }}
        destroyOnHidden
      >
        {currentFile && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#f0f0f0",
            }}
            onContextMenu={(e) => e.preventDefault()} // Mematikan klik kanan pada kontainer luar
          >
            {currentFile.type === "video" ||
            currentFile.url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#000",
                }}
              >
                <source src={currentFile.url} type="video/mp4" />
                Browser Anda tidak mendukung tag video.
              </video>
            ) : currentFile.type === "image" ||
              currentFile.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
              <img
                src={currentFile.url}
                alt={currentFile.name}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <iframe
                src={`${currentFile.url}#toolbar=0`}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="File Preview"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export const MergePDFs = async (urls: string[]) => {
  if (!urls || urls.length === 0) return null;
  if (urls.length === 1) return urls[0];

  try {
    const mergedPdf = await PDFDocument.create();

    for (const url of urls) {
      // 1. Ambil data PDF dari URL
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal mengambil PDF dari: ${url}`);

      const fileArrayBuffer = await response.arrayBuffer();

      // 2. Load dan copy halaman
      const pdf = await PDFDocument.load(fileArrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // 3. Simpan dan buat Blob URL
    const pdfBytes = await mergedPdf.save();
    const pdfBuffer = new Uint8Array(pdfBytes); // Solusi error TypeScript sebelumnya
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error merging PDFs:", error);
    return null;
  }
};
