import moment from "moment";
import type { IUser } from "../../../libs/interface";
import { calculatePayroll } from "../libs";
import { IDRFormat } from "../utilForm";

moment.locale("id");

const generate = (record: IUser) => {
  const temp = calculatePayroll(record);

  const totalPotongan =
    temp.deductionPay +
    temp.alphaPay +
    temp.latePay +
    temp.fastLeaveDeduction +
    temp.pph +
    temp.tt_deductionPay;

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 13px;
          color: #333333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .slip-container {
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 8px;
          max-width: 800px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-label {
          width: 112px;
          color: #6b7280;
        }

        .amount-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .amount-row span:first-child {
          color: #4b5563;
        }

        .amount-value {
          text-align: right;
          white-space: nowrap;
        }

        .attendance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px dashed #e5e7eb;
        }

        .attendance-row:last-child {
          border-bottom: none;
        }

        .attendance-value {
          min-width: 36px;
          text-align: center;
          font-weight: 700;
          color: #111827;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 2px 8px;
        }

        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }

        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }

          .slip-container {
            box-shadow: none !important;
          }
        }
      </style>
    </head>

    <body class="bg-gray-50 py-8 px-4">
      <div class="slip-container bg-white shadow-sm">

        <!-- HEADER -->
        <div class="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 class="text-xl font-bold tracking-wide text-gray-900">
            REKAP ABSENSI
          </h1>
          <p class="text-sm text-gray-600 mt-1 uppercase font-semibold">
            Periode: ${moment().format("MMMM YYYY")}
          </p>
        </div>

        <!-- INFORMASI KARYAWAN -->
        <div class="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div class="space-y-1">
            <div class="flex">
              <span class="info-label">Nama Lengkap</span>
              <span class="mr-2">:</span>
              <span class="font-medium text-gray-800">${record.fullname || "-"}</span>
            </div>

            <div class="flex">
              <span class="info-label">NIP</span>
              <span class="mr-2">:</span>
              <span class="text-gray-800">${record.nip || "-"}</span>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex">
              <span class="info-label">Jabatan</span>
              <span class="mr-2">:</span>
              <span class="text-gray-800">${record.Position?.name || "-"}</span>
            </div>

            <div class="flex">
              <span class="info-label">Status PTKP</span>
              <span class="mr-2">:</span>
              <span class="text-gray-800 font-semibold">${record.ptkp || "-"}</span>
            </div>
          </div>
        </div>

        <!-- RINGKASAN ABSENSI UTAMA -->
        <div class="border border-gray-300 rounded-md bg-gray-50 p-4 mb-6">
          <h3 class="section-title mb-3 border-b pb-2">
            Ringkasan Absensi
          </h3>

          <div class="grid grid-cols-4 gap-3 text-center">
            <div class="bg-white border border-gray-200 rounded-md p-3">
              <p class="text-xs text-gray-500 font-semibold uppercase">Hadir</p>
              <p class="text-lg font-bold text-green-700 mt-1">${temp.hadir.length}</p>
            </div>

            <div class="bg-white border border-gray-200 rounded-md p-3">
              <p class="text-xs text-gray-500 font-semibold uppercase">Alpha</p>
              <p class="text-lg font-bold text-red-700 mt-1">${temp.alpha.length}</p>
            </div>

            <div class="bg-white border border-gray-200 rounded-md p-3">
              <p class="text-xs text-gray-500 font-semibold uppercase">Cuti</p>
              <p class="text-lg font-bold text-blue-700 mt-1">${temp.cuti.length}</p>
            </div>

            <div class="bg-white border border-gray-200 rounded-md p-3">
              <p class="text-xs text-gray-500 font-semibold uppercase">Sakit</p>
              <p class="text-lg font-bold text-yellow-700 mt-1">${temp.sakit.length}</p>
            </div>
          </div>
        </div>

        <!-- RINCIAN PENDAPATAN & POTONGAN -->
        <div class="grid grid-cols-2 gap-6 items-start mb-6">

          <!-- KOLOM PENDAPATAN -->
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <div class="bg-green-600 text-white px-3 py-2 font-bold text-sm">
              PENDAPATAN
            </div>

            <div class="p-3 space-y-2">
              <div class="amount-row">
                <span>Gaji Pokok</span>
                <span class="amount-value font-medium">${IDRFormat(temp.salary)}</span>
              </div>

              ${temp.allowance
                .map(
                  (a) => `
                  <div class="amount-row">
                    <span>${a.name}</span>
                    <span class="amount-value">
                      ${IDRFormat(
                        a.nominal_type === "RUPIAH"
                          ? a.nominal
                          : record.salary * (a.nominal / 100),
                      )}
                    </span>
                  </div>
                `,
                )
                .join("")}

              ${temp.insentif
                .map(
                  (a) => `
                  <div class="amount-row">
                    <span>${a.name}</span>
                    <span class="amount-value">
                      ${IDRFormat(
                        a.nominal_type === "RUPIAH"
                          ? a.nominal
                          : record.salary * (a.nominal / 100),
                      )}
                    </span>
                  </div>
                `,
                )
                .join("")}

              <div class="amount-row">
                <span>Lemburan</span>
                <span class="amount-value">${IDRFormat(temp.lemburPay)}</span>
              </div>

              <div class="amount-row border-t pt-2 mt-2 font-bold text-gray-800">
                <span>Total Pendapatan</span>
                <span class="amount-value">${IDRFormat(temp.grossSalary)}</span>
              </div>
            </div>
          </div>

          <!-- KOLOM POTONGAN -->
          <div class="border border-gray-200 rounded-md overflow-hidden">
            <div class="bg-red-600 text-white px-3 py-2 font-bold text-sm">
              POTONGAN
            </div>

            <div class="p-3 space-y-2">
              ${temp.deduction
                .map(
                  (a) => `
                  <div class="amount-row">
                    <span>${a.name}</span>
                    <span class="amount-value text-red-600">
                      -${IDRFormat(
                        a.nominal_type === "RUPIAH"
                          ? a.nominal
                          : record.salary * (a.nominal / 100),
                      )}
                    </span>
                  </div>
                `,
                )
                .join("")}

              ${temp.tt_deduction
                .map(
                  (a) => `
                  <div class="amount-row">
                    <span>${a.name}</span>
                    <span class="amount-value text-red-600">
                      -${IDRFormat(
                        a.nominal_type === "RUPIAH"
                          ? a.nominal
                          : record.salary * (a.nominal / 100),
                      )}
                    </span>
                  </div>
                `,
                )
                .join("")}

              <div class="amount-row">
                <span>Pot. Alpha</span>
                <span class="amount-value text-red-600">-${IDRFormat(temp.alphaPay)}</span>
              </div>

              <div class="amount-row">
                <span>Terlambat</span>
                <span class="amount-value text-red-600">-${IDRFormat(temp.latePay)}</span>
              </div>

              <div class="amount-row">
                <span>Pulang Awal</span>
                <span class="amount-value text-red-600">-${IDRFormat(temp.fastLeaveDeduction)}</span>
              </div>

              <div class="amount-row border-b pb-2 mb-1">
                <span>PPh21</span>
                <span class="amount-value text-red-600">-${IDRFormat(temp.pph)}</span>
              </div>

              <div class="amount-row font-bold text-red-700 mt-2">
                <span>Total Potongan</span>
                <span class="amount-value">-${IDRFormat(totalPotongan)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TAKE HOME PAY -->
        <div class="bg-gray-800 text-white rounded-md p-4 flex justify-between items-center mb-6 shadow-inner">
          <span class="text-sm font-bold uppercase tracking-wider">
            Total Gaji Diterima
          </span>
          <span class="text-xl font-extrabold text-yellow-400">
            ${IDRFormat(temp.takeHome)}
          </span>
        </div>

        <!-- LAMPIRAN DETAIL ABSENSI -->
        <div class="border border-gray-300 rounded-md bg-gray-50 p-4">
          <h3 class="section-title mb-3 border-b pb-2">
            Lampiran Detail Absensi
          </h3>

          <div class="grid grid-cols-2 gap-x-8 gap-y-1">
            <div>
              <div class="attendance-row">
                <span>Hadir</span>
                <span class="attendance-value">${temp.hadir.length}</span>
              </div>

              <div class="attendance-row">
                <span>Perjalanan Dinas</span>
                <span class="attendance-value">${temp.perdin.length}</span>
              </div>

              <div class="attendance-row">
                <span>Lembur</span>
                <span class="attendance-value">${temp.lembur.length}</span>
              </div>

              <div class="attendance-row">
                <span>Terlambat</span>
                <span class="attendance-value">${temp.late.length}</span>
              </div>
            </div>

            <div>
              <div class="attendance-row">
                <span>Pulang Awal</span>
                <span class="attendance-value">${temp.fastleave.length}</span>
              </div>

              <div class="attendance-row">
                <span>Alpha</span>
                <span class="attendance-value">${temp.alpha.length}</span>
              </div>

              <div class="attendance-row">
                <span>Cuti</span>
                <span class="attendance-value">${temp.cuti.length}</span>
              </div>

              <div class="attendance-row">
                <span>Sakit</span>
                <span class="attendance-value">${temp.sakit.length}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- TANDA TANGAN -->
        <div class="mt-8 flex justify-end text-center text-xs text-gray-500">
          <div>
            <p>${moment().format("DD MMMM YYYY")}</p>
            <p class="mt-16 border-t border-gray-400 pt-1 w-40 mx-auto font-medium text-gray-700">
              Tim Pengelola Payroll
            </p>
          </div>
        </div>

      </div>
    </body>
  </html>
  `;

  return html;
};

export const printPayrol = (record: IUser) => {
  const htmlContent = generate(record);

  const w = window.open("", "_blank");

  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();

  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 200);
  };
};
