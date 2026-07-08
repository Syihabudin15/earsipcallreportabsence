import moment from "moment";
import type { IVisit } from "../../../libs/interface";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (record: IVisit) => {
  const safeStr = (str?: string | null) => str || "-";
  const logoSrc = "/assets/logo.png";

  const commentsHtml = record.coments?.length
    ? `
      <div class="section">
        <div class="section-title">Komentar (${record.coments.length})</div>
        <div class="section-content">
          ${record.coments
            .map(
              (c) => `
            <div class="comment-item">
              <div class="comment-header">
                <strong>${safeStr(c.name)}</strong>
                <span class="text-muted">${moment(c.date).format("DD MMM YYYY HH:mm")}</span>
              </div>
              <div class="comment-body">${safeStr(c.comment)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
    : "";

  const photosHtml = record.files?.length
    ? `
      <div class="section" style="page-break-inside: avoid;">
        <div class="section-title">Foto Kunjungan (${record.files.length})</div>
        <div class="section-content photo-grid">
          ${record.files
            .map(
              (f) => `
            <div class="photo-item">
              <img src="${f.url}" alt="${f.name}" />
              <div class="photo-name">${safeStr(f.name)}</div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
    : "";

  const GeoHtml = record.geo
    ? `
      <div class="section" style="page-break-inside: avoid;">
        <div class="section-title">Lokasi Kunjungan (Maps)</div>
        <div class="section-content" style="padding: 0;">
          <iframe 
            width="100%" 
            height="250" 
            frameborder="0" 
            scrolling="no" 
            marginheight="0" 
            marginwidth="0" 
            src="https://maps.google.com/maps?q=${record.geo}&z=16&output=embed"
            style="border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; display: block;"
          ></iframe>
          <div style="padding: 10px 15px; background: #f8fafc; font-size: 11px; border-top: 1px solid #e5e7eb; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            Titik Koordinat: <strong>${record.geo}</strong>
          </div>
        </div>
      </div>`
    : "";

  return `
  <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Detail Kunjungan - ${safeStr(record.Debitur?.fullname)}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 10mm; }

        body { 
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b; 
          line-height: 1.5; 
          font-size: 11.5px; 
          margin: 0 auto; 
          padding: 20px;
          max-width: 210mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          background-color: #f1f5f9;
        }

        .document-container {
          background: #ffffff;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        * { box-sizing: border-box; }

        .header { 
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); 
          color: white; 
          padding: 16px 20px; 
          border-radius: 10px; 
          margin-bottom: 10px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .brand-logo {
          width: 75px;
          height: 75px;
          object-fit: contain;
          background: #ffffff;
          border-radius: 8px;
          padding: 6px;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .brand-title h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: 0.5px;
        }

        .brand-title p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #bfdbfe;
        }

        .header-info {
          text-align: right;
          font-size: 11px;
          color: #e0e7ff;
          flex-shrink: 0;
        }

        .header-info p {
          margin: 4px 0;
        }
        
        .header-info strong {
          color: #ffffff;
        }

        .grid { display: grid; gap: 16px; }
        .grid-1 { grid-template-columns: 1fr; }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }

        .section { 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          margin-bottom: 15px; 
          background: #fff;
          page-break-inside: avoid;
        }

        .section-title { 
          background-color: #f8fafc; 
          font-weight: 700; 
          padding: 10px 16px; 
          border-bottom: 1px solid #e2e8f0; 
          color: #0f172a; 
          font-size: 13px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-content { padding: 14px 16px; }

        .field-label { 
          font-size: 9.5px; 
          text-transform: uppercase; 
          color: #64748b; 
          font-weight: 700; 
          margin-bottom: 4px; 
          display: block;
          letter-spacing: 0.5px;
        }

        .field-value {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
        }

        .text-muted {
          color: #64748b;
          font-size: 10px;
        }
        
        .mt-1 { margin-top: 4px; }

        .badge { 
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px; 
          font-size: 10px;
          font-weight: 600;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
          color: #334155;
          margin-right: 4px;
          margin-top: 2px;
        }

        .info-box {
          background-color: #f8fafc;
          padding: 12px;
          border-radius: 8px; 
          border: 1px solid #e2e8f0;
          font-size: 11.5px;
          color: #334155;
          line-height: 1.6;
        }

        .status-box {
          border-left: 4px solid #22c55e;
          background-color: #f0fdf4;
          border-color: #bbf7d0 #bbf7d0 #bbf7d0 #22c55e;
        }

        .action-box {
          border-left: 4px solid #f97316;
          background-color: #fff7ed;
          border-color: #ffedd5 #ffedd5 #ffedd5 #f97316;
        }

        .value-highlight {
          font-size: 16px;
          font-weight: 800;
          color: #4338ca;
        }

        .comment-item { 
          border-left: 3px solid #cbd5e1;
          padding-left: 14px;
          margin-bottom: 14px; 
        }

        .comment-item:last-child {
          margin-bottom: 0;
        }

        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          gap: 10px;
        }

        .comment-header strong {
          color: #0f172a;
          font-size: 12px;
        }

        .comment-body {
          color: #475569;
          white-space: pre-wrap;
          line-height: 1.5;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }

        .photo-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 6px;
          text-align: center;
          background: #f8fafc;
        }

        .photo-item img {
          width: 100%;
          height: 180px;
          object-fit: contain;
          border-radius: 4px;
          margin-bottom: 2px;
        }

        .photo-name {
          font-size: 10px;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #475569;
        }

        .file-list {
          font-size: 10.5px;
          color: #334155;
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }

        .file-list p {
          margin: 0 0 8px;
          font-weight: 600;
          color: #0f172a;
        }

        .file-list ul {
          margin: 0;
          padding-left: 20px;
        }

        .file-list li {
          word-break: break-all;
        }
        
        .file-list a {
          color: #2563eb;
          text-decoration: none;
        }

        @media print {
          body { 
            padding: 0; 
            background-color: #ffffff; 
          }
          .document-container { 
            box-shadow: none; 
            padding: 0; 
          }
          .header { 
            box-shadow: none; 
          }
          .header,
          .section,
          .info-box,
          .badge,
          .photo-item {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          a {
            color: #1d4ed8;
            text-decoration: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="header">
          <div class="brand">
            <img src="${logoSrc}" alt="Logo" class="brand-logo" />
            <div class="brand-title">
              <h1>Laporan Detail Kunjungan</h1>
              <p>Dokumen hasil kunjungan lapangan</p>
            </div>
          </div>

          <div class="header-info">
            <p><strong>ID Kunjungan:</strong> ${safeStr(record.id?.toString())}</p>
            <p><strong>Dicetak:</strong> ${moment().format("DD MMM YYYY HH:mm")}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Informasi Debitur & Kunjungan</div>
          <div class="section-content grid grid-2">
            <div class="grid grid-1" style="gap: 16px;">
              <div>
                <span class="field-label">Nama Debitur</span>
                <div class="field-value" style="font-size: 15px;">
                  ${safeStr(record.Debitur?.fullname?.toUpperCase())}
                </div>
                <div class="text-muted mt-1">
                  NIK: ${safeStr(record.Debitur?.nik)} | CIF: ${safeStr(record.Debitur?.cif)}
                </div>
              </div>

              <div>
                <span class="field-label">Alamat Rencana Kunjungan</span>
                <div class="field-value">${safeStr(record.Debitur?.address)}</div>
              </div>

              <div class="grid grid-2">
                <div>
                  <span class="field-label">Kategori / Tujuan</span>
                  <span class="badge">${safeStr(record.VisitCategory?.name)}</span>
                  <span class="badge">${safeStr(record.VisitPurpose?.name)}</span>
                </div>

                <div>
                  <span class="field-label">Petugas Lapangan</span>
                  <div class="field-value">${safeStr(record.User?.fullname)}</div>
                </div>
              </div>
            </div>
            
            <div class="grid grid-1" style="gap: 16px;">
              <div class="grid grid-2">
                <div>
                  <span class="field-label">Tgl. Rencana</span>
                  <div class="field-value">${moment(record.date_plan).format("DD MMM YYYY")}</div>
                </div>

                <div>
                  <span class="field-label">Waktu Aktual</span>
                  <div class="field-value">${moment(record.date_action).format("DD MMM YYYY HH:mm")}</div>
                </div>
              </div>

              <div class="grid grid-2">
                <div>
                  <span class="field-label">Kontak Debitur</span>
                  <div class="field-value">📞 ${safeStr(record.Debitur?.phone)}</div>
                </div>

                <div>
                  <span class="field-label">Jenis Pemohon</span>
                  <span class="badge">${safeStr(record.Debitur?.SubmissionType?.name)}</span>
                </div>
              </div>

              <div class="grid grid-2">
                <div>
                  <span class="field-label">Nilai Tagihan</span>
                  <div class="value-highlight">Rp. ${IDRFormat(record.value || 0)}</div>
                </div>

                <div>
                  <span class="field-label">Nilai Realisasi</span>
                  <div class="value-highlight" style="color: #15803d;">
                    Rp. ${IDRFormat(record.realize_value || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Hasil Laporan</div>
          <div class="section-content">
            <span class="field-label">Ringkasan Kunjungan</span>
            <div class="info-box" style="margin-bottom: 16px;">${safeStr(record.summary)}</div>
            
            <div class="grid" style="grid-template-columns: 30% 70%;">
              <div class="info-box status-box">
                <span class="field-label" style="color: #166534;">Status Kunjungan</span>
                <div class="field-value" style="color: #15803d; font-size: 12px;">
                  ${safeStr(record.VisitStatus?.name)}
                </div>
              </div>

              <div class="info-box action-box">
                <span class="field-label" style="color: #c2410c;">Rencana Tindak Lanjut</span>
                <div class="field-value" style="color: #b45309; font-size: 12px;">
                  ${safeStr(record.next_action)}
                </div>
              </div>
            </div>
          </div>
        </div>

        ${commentsHtml}
        
        <div class="grid grid-2">
          ${GeoHtml}
          ${photosHtml}
        </div>

        ${
          record.files && record.files.length !== 0
            ? `
            <div class="file-list">
              <p>Daftar Tautan File:</p>
              <ul>
                ${(record.files || [])
                  .map(
                    (f) =>
                      `<li><strong>${safeStr(f.name)}</strong> : <a href="${f.url}" target="_blank">${f.url}</a></li>`,
                  )
                  .join("")}
              </ul>
            </div>`
            : ""
        }
      </div>
    </body>
    </html>
  `;
};

export const printDetailVisit = (record: IVisit) => {
  const htmlContent = generate(record);

  const w = window.open("", "_blank");

  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari browser Anda.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();

  w.onload = function () {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 700);
  };
};
