import moment from "moment";

moment.locale("id");

const generate = (record: any, selectedMonth: string | null) => {
  const sortByOsDesc = (items: any[]) =>
    [...items].sort(
      (a, b) =>
        Number(b.totalOs ?? b.sisaPokok ?? 0) -
        Number(a.totalOs ?? a.sisaPokok ?? 0),
    );

  // 1. Ambil array data instansi & segmentasi yang sudah diproses di luar (seperti getInstansiBaseData)
  const instansiData = sortByOsDesc(
    (record?.instansiData || record?.instansi_data || []) as any[],
  );
  const segmentData = sortByOsDesc(
    (record?.segmentData || record?.segment_data || []) as any[],
  );
  const instansiKolData = (record?.instansiKolData ||
    record?.instansi_kol_data ||
    instansiData) as any[];
  const segmentKolData = (record?.segmentKolData ||
    record?.segment_kol_data ||
    segmentData) as any[];
  const aoData = sortByOsDesc(
    (record?.aoData || record?.ao_data || []) as any[],
  );
  const aoKolData = (record?.aoKolData ||
    record?.ao_kol_data ||
    aoData) as any[];

  const periodeTeks = selectedMonth
    ? moment(selectedMonth).format("MMM-YY")
    : "SEMUA DATA";
  const tanggalCetak = moment().format("DD MMMM YYYY");
  const logoUrl = `${window.location.origin}/assets/logo.png`;

  // ==========================================
  // KALKULASI DINAMIS BERDASARKAN DATA MENTAH
  // ==========================================

  // Variabel Akumulasi Bagian I (Instansi)
  let tDeb1 = 0,
    tSisa1 = 0,
    tAngs1 = 0,
    tNplValue1 = 0,
    tRealizTotal = 0;

  instansiData.forEach((d) => {
    tDeb1 += d.deb || 0;
    tSisa1 += d.sisaPokok || 0;
    tAngs1 += d.angsuran || 0;
    tNplValue1 += d.nplValue || 0;
    tRealizTotal += d.realisasi || 0;
  });

  // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian I
  const globalNplGross1 = tSisa1 > 0 ? tNplValue1 / tSisa1 : 0;

  // Variabel Akumulasi Bagian II (Segmentasi)
  let tDeb2 = 0,
    tSisa2 = 0,
    tAngs2 = 0,
    tNplValue2 = 0;

  segmentData.forEach((d) => {
    tDeb2 += d.deb || 0;
    tSisa2 += d.sisaPokok || 0;
    tAngs2 += d.angsuran || 0;
    tNplValue2 += d.nplValue || 0;
  });

  // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian II
  const globalNplGross2 = tSisa2 > 0 ? tNplValue2 / tSisa2 : 0;

  // Variabel Akumulasi Bagian VI (AO)
  // Data AO dikirim dari dashboard sebagai aoKolData, dengan nama AO dari Billing.User
  let tDebAo = 0,
    tSisaAo = 0,
    tAngsAo = 0,
    tNplValueAo = 0;

  aoData.forEach((d) => {
    tDebAo += d.countTransaksi || d.deb || 0;
    tSisaAo += d.totalOs || d.sisaPokok || 0;
    tAngsAo += d.totalTagihan || d.angsuran || 0;
    tNplValueAo += d.nplValue || 0;
  });

  const globalNplGrossAo = tSisaAo > 0 ? tNplValueAo / tSisaAo : 0;

  // Menghitung total debitur realisasi & tunggakan secara riil untuk Section V
  let tDebRealisasi = 0;
  let tDebTunggakan = 0;
  instansiData.forEach((d) => {
    const deb = d.deb || 0;
    const angs = d.angsuran || 0;
    const real = d.realisasi || 0;

    if (real > 0) tDebRealisasi += deb;
    if (angs - real > 0) tDebTunggakan += deb;
  });

  // ==========================================
  // FORMATTING HANDLERS
  // ==========================================
  const formatIDR = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
      num,
    );
  };

  const formatPct = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00%";
    return (num * 100).toFixed(2) + "%";
  };

  const nplPaymentData = sortByOsDesc(
    (record?.nplPaymentData || record?.npl_payment_data || []) as any[],
  );

  let tDebNpl = 0;
  let tOsNpl = 0;
  let tTargetNpl = 0;
  let tRealisasiNpl = 0;

  nplPaymentData.forEach((d) => {
    // Pastikan properti ini sesuai dengan yang dikirim dari API / Data asal
    tDebNpl += Number(d.deb || d.debitur || 0);
    tOsNpl += Number(d.os || d.sisaPokok || 0); // <-- Gunakan d.os jika di map pakai d.os
    tTargetNpl += Number(d.target || d.angsuran || 0); // <-- Gunakan d.target jika di map pakai d.target
    tRealisasiNpl += Number(d.realisasi || d.realisasiBayar || 0);
  });

  // Hitung sisa tunggakan total
  const tOutstandingNpl = tTargetNpl - tRealisasiNpl;

  // Hitung persentase recovery total
  const tRecovery = tTargetNpl > 0 ? (tRealisasiNpl / tTargetNpl) * 100 : 0;

  // Template Reusable Header BPR
  const renderBprHeader = (titleText: string) => `
    <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
      <div>
        <div class="text-xs font-bold text-gray-500 font-sans" style="color: #1F4E78;">PT BPR HASAMITRA JAWA BARAT</div>
        <div class="text-sm font-bold text-black font-sans">${titleText.toUpperCase()}</div>
        <div class="text-xs italic text-gray-400 font-sans">PERIODE LAPORAN: ${periodeTeks.toUpperCase()}</div>
      </div>
      <div class="shrink-0">
        <img
          src="${logoUrl}"
          alt="Logo"
          style="width: 54px; height: 54px; object-fit: contain;"
        />
      </div>
    </div>
  `;

  // Template Reusable Tanda Tangan
  const renderSignatures = () => `
    <div class="mt-6 grid grid-cols-3 text-left font-sans avoidance" style="font-size: 11px;">
      <div>
        <div class="italic text-gray-500 mb-2">Depok, ${tanggalCetak}</div>
        <div class="font-bold text-gray-800">Disiapkan Oleh,</div>
        <div class="mt-20 font-bold text-black underline">Leony</div>
        <div class="text-gray-600">Admin Kredit</div>
      </div>
      <div>
        <div class="h-4 mb-2"></div>
        <div class="font-bold text-gray-800">Diperiksa Oleh,</div>
        <div class="mt-20 font-bold text-black underline">Komang Gd Ariawan</div>
        <div class="text-gray-600">Head Bisnis</div>
      </div>
      <div>
        <div class="h-4 mb-2"></div>
        <div class="font-bold text-gray-800">Disetujui Oleh,</div>
        <div class="mt-20 font-bold text-black underline">Ketut Sugiata</div>
        <div class="text-gray-600">Direktur Utama</div>
      </div>
    </div>
  `;

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        @page landscape-layout { size: A4 landscape; margin: 10mm 12mm; }
        html, body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          background-color: #ffffff;
          line-height: 1.3;
        }
        .page { width: 100%; }
        .page.landscape { page: landscape-layout; }
        .page-break { page-break-before: always; break-before: page; }
        .avoidance { page-break-inside: avoid; break-inside: avoid; }
        
        .bg-primary-dark { background-color: #1F4E78 !important; }
        .bg-primary-sub { background-color: #2F5597 !important; }
        .bg-accent-total { background-color: #FFF2CC !important; }
        .bg-zebra-even { background-color: #F2F2F2 !important; }
        .bg-share-total { background-color: #DCE6F1 !important; }
        .border-excel-light { border: 1px solid #D9D9D9 !important; }
        .border-total-top { border-top: 1px solid #000000 !important; }
        .border-total-bottom { border-bottom: 3px double #000000 !important; }

        table { border-collapse: collapse !important; width: 100%; }
        th { font-weight: bold; text-align: center; vertical-align: middle; padding: 6px 4px; font-size: 10px; }
        td { vertical-align: middle; padding: 5px 6px; }
        tbody tr:hover { background-color: #EBF5FF; }
        .subtotal-row td { background-color: #E2F0D9 !important; font-weight: bold; }
        .text-muted { color: #64748b; }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #ffffff; }
        }
      </style>
    </head>
    <body class="text-gray-900 bg-white p-2">

      <div class="page landscape">
        ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">I. KOLEKTIBILITAS BERDASARKAN INSTANSI</div>
        <table class="text-left">
          <thead>
            <tr class="bg-primary-dark text-white">
              <th class="border-excel-light text-center w-8">No</th>
              <th class="border-excel-light">Instansi / Mitra Kerja</th>
              <th class="border-excel-light text-center w-10">Kol</th>
              <th class="border-excel-light text-center w-14">Debitur</th>
              <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
              <th class="border-excel-light text-right">Angsuran Wajib</th>
              <th class="border-excel-light text-center w-24">NPL Instansi</th>
              <th class="border-excel-light text-center w-24">NPL Gross</th>
            </tr>
          </thead>
          <tbody>
            ${instansiKolData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const isSubtotal = d.rowType === "subtotal";
                const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
                const nplInstansiVal = isSubtotal
                  ? (d.nplInstansi || 0) / 100
                  : null;
                const nplGrossVal = isSubtotal ? (d.nplGross || 0) / 100 : null;

                const nplInstansiFontColor =
                  nplInstansiVal !== null && nplInstansiVal * 100 > 5
                    ? "color: #9C0006; font-weight: bold;"
                    : "";

                const nplGrossFontColor =
                  nplGrossVal !== null && nplGrossVal * 100 > 5
                    ? "color: #9C0006; font-weight: bold;"
                    : "";

                return `
                <tr class="${rowClass}">
                  <td class="border-excel-light text-center">${d.no || ""}</td>
                  <td class="border-excel-light">${d.instansi || ""}</td>
                  <td class="border-excel-light text-center">${d.kol ?? ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
                  <td class="border-excel-light text-center" style="${nplInstansiFontColor}">
  ${nplInstansiVal === null ? "" : formatPct(nplInstansiVal)}
</td>
<td class="border-excel-light text-center" style="${nplGrossFontColor}">
  ${nplGrossVal === null ? "" : formatPct(nplGrossVal)}
</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-accent-total font-bold text-black">
              <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">
  ${formatPct(globalNplGross1)}
</td>
<td class="border-excel-light border-total-top border-total-bottom text-center">
  ${formatPct(globalNplGross1)}
</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>

      <div class="page landscape page-break">
        ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT</div>
        <table class="text-left">
          <thead>
            <tr class="bg-primary-dark text-white">
              <th class="border-excel-light text-center w-8">No</th>
              <th class="border-excel-light">Segmen / Skema Kredit</th>
              <th class="border-excel-light text-center w-10">Kol</th>
              <th class="border-excel-light text-center w-14">Debitur</th>
              <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
              <th class="border-excel-light text-right">Angsuran Wajib</th>
              <th class="border-excel-light text-center w-24">NPL Gross</th>
            </tr>
          </thead>
          <tbody>
            ${segmentKolData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const isSubtotal = d.rowType === "subtotal";
                const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
                const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;

                return `
                <tr class="${rowClass}">
                  <td class="border-excel-light text-center">${d.no || ""}</td>
                  <td class="border-excel-light">${d.segmen || ""}</td>
                  <td class="border-excel-light text-center">${d.kol ?? ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
                  <td class="border-excel-light text-center">${nplVal === null ? "" : formatPct(nplVal)}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-accent-total font-bold text-black">
              <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross2)}</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>

      <div class="page page-break">
        ${renderBprHeader("LAPORAN POSISI SALDO OUTSTANDING KREDIT")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)</div>
        <table class="text-left">
          <thead>
            <tr class="text-white" style="background-color: #4F81BD;">
              <th class="border-excel-light text-center w-8">No</th>
              <th class="border-excel-light">NAMA MITRA INSTANSI</th>
              <th class="border-excel-light text-center w-16">TOTAL DEB</th>
              <th class="border-excel-light text-right">SISA POKOK (OS)</th>
              <th class="border-excel-light text-right">ANGSURAN BULANAN</th>
              <th class="border-excel-light text-center w-24">MARKET SHARE (%)</th>
            </tr>
          </thead>
          <tbody>
            ${instansiData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const sisaPokokCurrent = d.sisaPokok || 0;
                const share = tSisa1 > 0 ? sisaPokokCurrent / tSisa1 : 0;

                return `
                <tr class="${isZebra}">
                  <td class="border-excel-light text-center">${d.no || idx + 1}</td>
                  <td class="border-excel-light">${d.instansi || ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
                  <td class="border-excel-light text-center">${formatPct(share)}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-share-total font-bold text-black">
              <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>

      <div class="page page-break">
        ${renderBprHeader("LAPORAN SEGMEN DISTRIBUSI PEMASARAN")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN</div>
        <table class="text-left">
          <thead>
            <tr class="text-white" style="background-color: #4F81BD;">
              <th class="border-excel-light text-center w-8">No</th>
              <th class="border-excel-light">SEGMEN PRODUK</th>
              <th class="border-excel-light text-center w-16">TOTAL DEB</th>
              <th class="border-excel-light text-right">OS PINJAMAN</th>
              <th class="border-excel-light text-right">BEBAN ANGSURAN</th>
              <th class="border-excel-light text-center w-24">SHARE (%)</th>
            </tr>
          </thead>
          <tbody>
            ${segmentData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const sisaPokokCurrent = d.sisaPokok || 0;
                const share = tSisa2 > 0 ? sisaPokokCurrent / tSisa2 : 0;

                return `
                <tr class="${isZebra}">
                  <td class="border-excel-light text-center">${d.no || idx + 1}</td>
                  <td class="border-excel-light">${d.segmen || ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
                  <td class="border-excel-light text-center">${formatPct(share)}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-share-total font-bold text-black">
              <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>

      <div class="page landscape page-break">
        ${renderBprHeader("LAPORAN POSISI KREDIT")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">V. POSISI TAGIHAN BERDASARKAN INSTANSI</div>
        <table class="text-left" style="font-size: 10px;">
          <thead>
            <tr class="bg-primary-dark text-white">
              <th rowspan="2" class="border-excel-light text-center w-6">No</th>
              <th rowspan="2" class="border-excel-light">INSTANSI / MITRA</th>
              <th rowspan="2" class="border-excel-light text-center w-10">DEB</th>
              <th rowspan="2" class="border-excel-light text-right">SISA POKOK</th>
              <th rowspan="2" class="border-excel-light text-right">TAGIHAN TARGET</th>
              <th colspan="3" class="border-excel-light text-center bg-primary-dark">REALISASI BAYAR</th>
              <th colspan="3" class="border-excel-light text-center bg-primary-dark">SISA TUNGGAKAN</th>
            </tr>
            <tr class="text-white">
              <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
              <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
              <th class="border-excel-light text-center bg-primary-sub w-16">% / EFF</th>
              <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
              <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
              <th class="border-excel-light text-center bg-primary-sub w-16">% OB</th>
            </tr>
          </thead>
          <tbody>
            ${instansiData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const deb = d.deb || 0;
                const angs = d.angsuran || 0;
                const real = d.realisasi || 0;

                const sisaTunggakan = angs - real;
                const pctBayar = angs > 0 ? real / angs : 0;
                const pctSisa = angs > 0 ? sisaTunggakan / angs : 0;

                return `
                <tr class="${isZebra}">
                  <td class="border-excel-light text-center">${d.no || idx + 1}</td>
                  <td class="border-excel-light">${d.instansi || ""}</td>
                  <td class="border-excel-light text-center">${deb}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
                  <td class="border-excel-light text-right">${formatIDR(angs)}</td>
                  <td class="border-excel-light text-center">${real > 0 ? deb : 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(real)}</td>
                  <td class="border-excel-light text-center">${formatPct(pctBayar)}</td>
                  <td class="border-excel-light text-center">${sisaTunggakan > 0 ? deb : 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(sisaTunggakan)}</td>
                  <td class="border-excel-light text-center">${formatPct(pctSisa)}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-accent-total font-bold text-black">
              <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL KONSOLIDASI TAGIHAN</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebRealisasi}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tRealizTotal)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct(tRealizTotal / tAngs1) : "0.00%"}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebTunggakan}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1 - tRealizTotal)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct((tAngs1 - tRealizTotal) / tAngs1) : "0.00%"}</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>

      <div class="page landscape page-break">
        ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}
        
        <div class="text-xs font-bold mb-2" style="color: #1F4E78;">VI. KOLEKTIBILITAS BERDASARKAN AO</div>
        <table class="text-left">
          <thead>
            <tr class="bg-primary-dark text-white">
              <th class="border-excel-light text-center w-8">No</th>
              <th class="border-excel-light">Account Officer</th>
              <th class="border-excel-light text-center w-10">Kol</th>
              <th class="border-excel-light text-center w-14">Debitur</th>
              <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
              <th class="border-excel-light text-right">Angsuran Wajib</th>
              <th class="border-excel-light text-center w-24">NPL Gross</th>
            </tr>
          </thead>
          <tbody>
            ${aoKolData
              .map((d, idx) => {
                const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                const isSubtotal = d.rowType === "subtotal";
                const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
                const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;
                const nplFontColor =
                  nplVal !== null && nplVal * 100 > 5
                    ? "color: #9C0006; font-weight: bold;"
                    : "";

                return `
                <tr class="${rowClass}">
                  <td class="border-excel-light text-center">${d.no || ""}</td>
                  <td class="border-excel-light">${d.aoName || ""}</td>
                  <td class="border-excel-light text-center">${d.kol ?? ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
                  <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
                </tr>
              `;
              })
              .join("")}
            <tr class="bg-accent-total font-bold text-black">
              <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebAo}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisaAo)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngsAo)}</td>
              <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGrossAo)}</td>
            </tr>
          </tbody>
        </table>
        ${renderSignatures()}
      </div>
      
      <div class="page landscape page-break">
  ${renderBprHeader("LAPORAN REALISASI PEMBAYARAN TUNGGAKAN NPL")}
  
  <div class="text-xs font-bold mb-2" style="color: #1F4E78;">V. ANALISIS REALISASI PEMBAYARAN TUNGGAKAN NPL</div>
    <table class="text-left w-full">
      <thead>
        <tr class="bg-primary-dark text-white">
          <th class="border-excel-light text-center w-8">No</th>
          <th class="border-excel-light">Instansi / Mitra Kerja</th>
          <th class="border-excel-light text-center w-14">Debitur NPL</th>
          <th class="border-excel-light text-right">Sisa Pokok (OS NPL)</th>
          <th class="border-excel-light text-right">Target Tagihan NPL</th>
          <th class="border-excel-light text-right">Realisasi Bayar</th>
          <th class="border-excel-light text-right">Sisa Tunggakan (Outstanding)</th>
          <th class="border-excel-light text-center w-20">Persentase Recovery</th>
        </tr>
      </thead>
      <tbody>
        ${
          nplPaymentData.length === 0
            ? `<tr><td colspan="8" class="border-excel-light text-center text-muted italic py-4">Tidak ada data pembayaran NPL periode ini</td></tr>`
            : nplPaymentData
                .map((d, idx) => {
                  const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
                  return `
                <tr class="${isZebra}">
                  <td class="border-excel-light text-center">${d.no || idx + 1}</td>
                  <td class="border-excel-light">${d.instansi || ""}</td>
                  <td class="border-excel-light text-center">${d.deb || 0}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.os)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.target)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.realisasi)}</td>
                  <td class="border-excel-light text-right">${formatIDR(d.outstanding)}</td>
                  <td class="border-excel-light text-center font-bold" style="${d.recovery > 50 ? "color: #2E7D32;" : "color: #C62828;"}">
                    ${d.recovery}%
                  </td>
                </tr>
              `;
                })
                .join("")
        }
        
        <tr class="bg-accent-total font-bold text-black">
          <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI NPL</td>
          <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebNpl}</td>
          <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tOsNpl)}</td>
          <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tTargetNpl)}</td>
          <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tRealisasiNpl)}</td>
          <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tOutstandingNpl)}</td>
          <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(tRecovery)}</td>
        </tr>
      </tbody>
    </table>
    
    ${renderSignatures()}
  </div>

    </body>
  </html>
  `;

  return html;
};

export const printKredit = (record: any, selectedMonth: string | null) => {
  // Parsing base data sebelum dikirim ke engine pencetak HTML
  // Pastikan parameter 'record' di sini berisi struktur dasar array data Anda
  const htmlContent = generate(record, selectedMonth);

  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon aktifkan izin popup browser Anda.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();

  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 600);
  };
};

// import moment from "moment";

// moment.locale("id");

// const generate = (record: any, selectedMonth: string | null) => {
//   // 1. Ambil array data instansi & segmentasi yang sudah diproses di luar (seperti getInstansiBaseData)
//   const instansiData = (record?.instansiData ||
//     record?.instansi_data ||
//     []) as any[];
//   const segmentData = (record?.segmentData ||
//     record?.segment_data ||
//     []) as any[];
//   const instansiKolData = (record?.instansiKolData ||
//     record?.instansi_kol_data ||
//     instansiData) as any[];
//   const segmentKolData = (record?.segmentKolData ||
//     record?.segment_kol_data ||
//     segmentData) as any[];
//   const aoData = (record?.aoData || record?.ao_data || []) as any[];
//   const aoKolData = (record?.aoKolData ||
//     record?.ao_kol_data ||
//     aoData) as any[];

//   const periodeTeks = selectedMonth
//     ? moment(selectedMonth).format("MMM-YY")
//     : "SEMUA DATA";
//   const tanggalCetak = moment().format("DD MMMM YYYY");

//   // ==========================================
//   // KALKULASI DINAMIS BERDASARKAN DATA MENTAH
//   // ==========================================

//   // Variabel Akumulasi Bagian I (Instansi)
//   let tDeb1 = 0,
//     tSisa1 = 0,
//     tAngs1 = 0,
//     tNplValue1 = 0,
//     tRealizTotal = 0;

//   instansiData.forEach((d) => {
//     tDeb1 += d.deb || 0;
//     tSisa1 += d.sisaPokok || 0;
//     tAngs1 += d.angsuran || 0;
//     tNplValue1 += d.nplValue || 0;
//     tRealizTotal += d.realisasi || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian I
//   const globalNplGross1 = tSisa1 > 0 ? tNplValue1 / tSisa1 : 0;

//   // Variabel Akumulasi Bagian II (Segmentasi)
//   let tDeb2 = 0,
//     tSisa2 = 0,
//     tAngs2 = 0,
//     tNplValue2 = 0;

//   segmentData.forEach((d) => {
//     tDeb2 += d.deb || 0;
//     tSisa2 += d.sisaPokok || 0;
//     tAngs2 += d.angsuran || 0;
//     tNplValue2 += d.nplValue || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian II
//   const globalNplGross2 = tSisa2 > 0 ? tNplValue2 / tSisa2 : 0;

//   // Variabel Akumulasi Bagian VI (AO)
//   // Data AO dikirim dari dashboard sebagai aoKolData, dengan nama AO dari Billing.User
//   let tDebAo = 0,
//     tSisaAo = 0,
//     tAngsAo = 0,
//     tNplValueAo = 0;

//   aoData.forEach((d) => {
//     tDebAo += d.countTransaksi || d.deb || 0;
//     tSisaAo += d.totalOs || d.sisaPokok || 0;
//     tAngsAo += d.totalTagihan || d.angsuran || 0;
//     tNplValueAo += d.nplValue || 0;
//   });

//   const globalNplGrossAo = tSisaAo > 0 ? tNplValueAo / tSisaAo : 0;

//   // Menghitung total debitur realisasi & tunggakan secara riil untuk Section V
//   let tDebRealisasi = 0;
//   let tDebTunggakan = 0;
//   instansiData.forEach((d) => {
//     const deb = d.deb || 0;
//     const angs = d.angsuran || 0;
//     const real = d.realisasi || 0;

//     if (real > 0) tDebRealisasi += deb;
//     if (angs - real > 0) tDebTunggakan += deb;
//   });

//   // ==========================================
//   // FORMATTING HANDLERS
//   // ==========================================
//   const formatIDR = (num: number | undefined | null) => {
//     if (num === undefined || num === null) return "0";
//     return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
//       num,
//     );
//   };

//   const formatPct = (num: number | undefined | null) => {
//     if (num === undefined || num === null || isNaN(num)) return "0.00%";
//     return (num * 100).toFixed(2) + "%";
//   };

//   // Template Reusable Header BPR
//   const renderBprHeader = (titleText: string) => `
//     <div class="mb-4">
//       <div class="text-xs font-bold text-gray-500 font-sans" style="color: #1F4E78;">PT BPR HASAMITRA JAWA BARAT</div>
//       <div class="text-sm font-bold text-black font-sans">${titleText.toUpperCase()}</div>
//       <div class="text-xs italic text-gray-400 font-sans">PERIODE LAPORAN: ${periodeTeks.toUpperCase()}</div>
//     </div>
//   `;

//   // Template Reusable Tanda Tangan
//   const renderSignatures = () => `
//     <div class="mt-6 grid grid-cols-3 text-left font-sans avoidance" style="font-size: 11px;">
//       <div>
//         <div class="italic text-gray-500 mb-2">Depok, ${tanggalCetak}</div>
//         <div class="font-bold text-gray-800">Disiapkan Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Leony</div>
//         <div class="text-gray-600">Admin Kredit</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Diperiksa Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Komang Gd Ariawan</div>
//         <div class="text-gray-600">Head Bisnis</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Disetujui Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Ketut Sugiata</div>
//         <div class="text-gray-600">Direktur Utama</div>
//       </div>
//     </div>
//   `;

//   const html = `
//   <!doctype html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <meta name="viewport" content="width=device-width,initial-scale=1" />
//       <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
//       <style>
//         @page { size: A4 portrait; margin: 12mm 15mm; }
//         @page landscape-layout { size: A4 landscape; margin: 10mm 12mm; }
//         html, body {
//           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//           font-size: 11px;
//           background-color: #ffffff;
//           line-height: 1.3;
//         }
//         .page { width: 100%; }
//         .page.landscape { page: landscape-layout; }
//         .page-break { page-break-before: always; break-before: page; }
//         .avoidance { page-break-inside: avoid; break-inside: avoid; }

//         .bg-primary-dark { background-color: #1F4E78 !important; }
//         .bg-primary-sub { background-color: #2F5597 !important; }
//         .bg-accent-total { background-color: #FFF2CC !important; }
//         .bg-zebra-even { background-color: #F2F2F2 !important; }
//         .bg-share-total { background-color: #DCE6F1 !important; }
//         .border-excel-light { border: 1px solid #D9D9D9 !important; }
//         .border-total-top { border-top: 1px solid #000000 !important; }
//         .border-total-bottom { border-bottom: 3px double #000000 !important; }

//         table { border-collapse: collapse !important; width: 100%; }
//         th { font-weight: bold; text-align: center; vertical-align: middle; padding: 6px 4px; font-size: 10px; }
//         td { vertical-align: middle; padding: 5px 6px; }
//         tbody tr:hover { background-color: #EBF5FF; }
//         .subtotal-row td { background-color: #E2F0D9 !important; font-weight: bold; }
//         .text-muted { color: #64748b; }

//         @media print {
//           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #ffffff; }
//         }
//       </style>
//     </head>
//     <body class="text-gray-900 bg-white p-2">

//       <div class="page landscape">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">I. KOLEKTIBILITAS BERDASARKAN INSTANSI</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Instansi / Mitra Kerja</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;
//                 const nplFontColor =
//                   nplVal !== null && nplVal * 100 > 5
//                     ? "color: #9C0006; font-weight: bold;"
//                     : "";

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross1)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Segmen / Skema Kredit</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross2)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN POSISI SALDO OUTSTANDING KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">NAMA MITRA INSTANSI</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">SISA POKOK (OS)</th>
//               <th class="border-excel-light text-right">ANGSURAN BULANAN</th>
//               <th class="border-excel-light text-center w-24">MARKET SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa1 > 0 ? sisaPokokCurrent / tSisa1 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN SEGMEN DISTRIBUSI PEMASARAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">SEGMEN PRODUK</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">OS PINJAMAN</th>
//               <th class="border-excel-light text-right">BEBAN ANGSURAN</th>
//               <th class="border-excel-light text-center w-24">SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa2 > 0 ? sisaPokokCurrent / tSisa2 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">V. POSISI TAGIHAN BERDASARKAN INSTANSI</div>
//         <table class="text-left" style="font-size: 10px;">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th rowspan="2" class="border-excel-light text-center w-6">No</th>
//               <th rowspan="2" class="border-excel-light">INSTANSI / MITRA</th>
//               <th rowspan="2" class="border-excel-light text-center w-10">DEB</th>
//               <th rowspan="2" class="border-excel-light text-right">SISA POKOK</th>
//               <th rowspan="2" class="border-excel-light text-right">TAGIHAN TARGET</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">REALISASI BAYAR</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">SISA TUNGGAKAN</th>
//             </tr>
//             <tr class="text-white">
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% / EFF</th>
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% OB</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const deb = d.deb || 0;
//                 const angs = d.angsuran || 0;
//                 const real = d.realisasi || 0;

//                 const sisaTunggakan = angs - real;
//                 const pctBayar = angs > 0 ? real / angs : 0;
//                 const pctSisa = angs > 0 ? sisaTunggakan / angs : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${deb}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(angs)}</td>
//                   <td class="border-excel-light text-center">${real > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(real)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctBayar)}</td>
//                   <td class="border-excel-light text-center">${sisaTunggakan > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaTunggakan)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctSisa)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL KONSOLIDASI TAGIHAN</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebRealisasi}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct(tRealizTotal / tAngs1) : "0.00%"}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebTunggakan}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1 - tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct((tAngs1 - tRealizTotal) / tAngs1) : "0.00%"}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">VI. KOLEKTIBILITAS BERDASARKAN AO</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Account Officer</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${aoKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;
//                 const nplFontColor =
//                   nplVal !== null && nplVal * 100 > 5
//                     ? "color: #9C0006; font-weight: bold;"
//                     : "";

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.aoName || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebAo}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisaAo)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngsAo)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGrossAo)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//     </body>
//   </html>
//   `;

//   return html;
// };

// export const printKredit = (record: any, selectedMonth: string | null) => {
//   // Parsing base data sebelum dikirim ke engine pencetak HTML
//   // Pastikan parameter 'record' di sini berisi struktur dasar array data Anda
//   const htmlContent = generate(record, selectedMonth);

//   const w = window.open("", "_blank");
//   if (!w) {
//     alert("Popup diblokir. Mohon aktifkan izin popup browser Anda.");
//     return;
//   }

//   w.document.open();
//   w.document.write(htmlContent);
//   w.document.close();

//   w.onload = function () {
//     setTimeout(() => {
//       w.print();
//     }, 600);
//   };
// };

// import moment from "moment";

// moment.locale("id");

// const generate = (record: any, selectedMonth: string | null) => {
//   // 1. Ambil array data instansi & segmentasi yang sudah diproses di luar (seperti getInstansiBaseData)
//   const instansiData = (record?.instansiData ||
//     record?.instansi_data ||
//     []) as any[];
//   const segmentData = (record?.segmentData ||
//     record?.segment_data ||
//     []) as any[];
//   const instansiKolData = (record?.instansiKolData ||
//     record?.instansi_kol_data ||
//     instansiData) as any[];
//   const segmentKolData = (record?.segmentKolData ||
//     record?.segment_kol_data ||
//     segmentData) as any[];

//   const periodeTeks = selectedMonth
//     ? moment(selectedMonth).format("MMM-YY")
//     : "SEMUA DATA";
//   const tanggalCetak = moment().format("DD MMMM YYYY");

//   // ==========================================
//   // KALKULASI DINAMIS BERDASARKAN DATA MENTAH
//   // ==========================================

//   // Variabel Akumulasi Bagian I (Instansi)
//   let tDeb1 = 0,
//     tSisa1 = 0,
//     tAngs1 = 0,
//     tNplValue1 = 0,
//     tRealizTotal = 0;

//   instansiData.forEach((d) => {
//     tDeb1 += d.deb || 0;
//     tSisa1 += d.sisaPokok || 0;
//     tAngs1 += d.angsuran || 0;
//     tNplValue1 += d.nplValue || 0;
//     tRealizTotal += d.realisasi || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian I
//   const globalNplGross1 = tSisa1 > 0 ? tNplValue1 / tSisa1 : 0;

//   // Variabel Akumulasi Bagian II (Segmentasi)
//   let tDeb2 = 0,
//     tSisa2 = 0,
//     tAngs2 = 0,
//     tNplValue2 = 0;

//   segmentData.forEach((d) => {
//     tDeb2 += d.deb || 0;
//     tSisa2 += d.sisaPokok || 0;
//     tAngs2 += d.angsuran || 0;
//     tNplValue2 += d.nplValue || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian II
//   const globalNplGross2 = tSisa2 > 0 ? tNplValue2 / tSisa2 : 0;

//   // Menghitung total debitur realisasi & tunggakan secara riil untuk Section V
//   let tDebRealisasi = 0;
//   let tDebTunggakan = 0;
//   instansiData.forEach((d) => {
//     const deb = d.deb || 0;
//     const angs = d.angsuran || 0;
//     const real = d.realisasi || 0;

//     if (real > 0) tDebRealisasi += deb;
//     if (angs - real > 0) tDebTunggakan += deb;
//   });

//   // ==========================================
//   // FORMATTING HANDLERS
//   // ==========================================
//   const formatIDR = (num: number | undefined | null) => {
//     if (num === undefined || num === null) return "0";
//     return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
//       num,
//     );
//   };

//   const formatPct = (num: number | undefined | null) => {
//     if (num === undefined || num === null || isNaN(num)) return "0.00%";
//     return (num * 100).toFixed(2) + "%";
//   };

//   // Template Reusable Header BPR
//   const renderBprHeader = (titleText: string) => `
//     <div class="mb-4">
//       <div class="text-xs font-bold text-gray-500 font-sans" style="color: #1F4E78;">PT BPR HASAMITRA JAWA BARAT</div>
//       <div class="text-sm font-bold text-black font-sans">${titleText.toUpperCase()}</div>
//       <div class="text-xs italic text-gray-400 font-sans">PERIODE LAPORAN: ${periodeTeks.toUpperCase()}</div>
//     </div>
//   `;

//   // Template Reusable Tanda Tangan
//   const renderSignatures = () => `
//     <div class="mt-6 grid grid-cols-3 text-left font-sans avoidance" style="font-size: 11px;">
//       <div>
//         <div class="italic text-gray-500 mb-2">Depok, ${tanggalCetak}</div>
//         <div class="font-bold text-gray-800">Disiapkan Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Leony</div>
//         <div class="text-gray-600">Admin Kredit</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Diperiksa Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Komang Gd Ariawan</div>
//         <div class="text-gray-600">Head Bisnis</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Disetujui Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Ketut Sugiata</div>
//         <div class="text-gray-600">Direktur Utama</div>
//       </div>
//     </div>
//   `;

//   const html = `
//   <!doctype html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <meta name="viewport" content="width=device-width,initial-scale=1" />
//       <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
//       <style>
//         @page { size: A4 portrait; margin: 12mm 15mm; }
//         @page landscape-layout { size: A4 landscape; margin: 10mm 12mm; }
//         html, body {
//           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//           font-size: 11px;
//           background-color: #ffffff;
//           line-height: 1.3;
//         }
//         .page { width: 100%; }
//         .page.landscape { page: landscape-layout; }
//         .page-break { page-break-before: always; break-before: page; }
//         .avoidance { page-break-inside: avoid; break-inside: avoid; }

//         .bg-primary-dark { background-color: #1F4E78 !important; }
//         .bg-primary-sub { background-color: #2F5597 !important; }
//         .bg-accent-total { background-color: #FFF2CC !important; }
//         .bg-zebra-even { background-color: #F2F2F2 !important; }
//         .bg-share-total { background-color: #DCE6F1 !important; }
//         .border-excel-light { border: 1px solid #D9D9D9 !important; }
//         .border-total-top { border-top: 1px solid #000000 !important; }
//         .border-total-bottom { border-bottom: 3px double #000000 !important; }

//         table { border-collapse: collapse !important; width: 100%; }
//         th { font-weight: bold; text-align: center; vertical-align: middle; padding: 6px 4px; font-size: 10px; }
//         td { vertical-align: middle; padding: 5px 6px; }
//         tbody tr:hover { background-color: #EBF5FF; }
//         .subtotal-row td { background-color: #E2F0D9 !important; font-weight: bold; }
//         .text-muted { color: #64748b; }

//         @media print {
//           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #ffffff; }
//         }
//       </style>
//     </head>
//     <body class="text-gray-900 bg-white p-2">

//       <div class="page landscape">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">I. KOLEKTIBILITAS BERDASARKAN INSTANSI</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Instansi / Mitra Kerja</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal =
//                   isSubtotal && d.nplGross ? d.nplGross / 100 : null;
//                 const nplFontColor =
//                   nplVal !== null && nplVal * 100 > 5
//                     ? "color: #9C0006; font-weight: bold;"
//                     : "";

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross1)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Segmen / Skema Kredit</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal =
//                   isSubtotal && d.nplGross ? d.nplGross / 100 : null;

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross2)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN POSISI SALDO OUTSTANDING KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">NAMA MITRA INSTANSI</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">SISA POKOK (OS)</th>
//               <th class="border-excel-light text-right">ANGSURAN BULANAN</th>
//               <th class="border-excel-light text-center w-24">MARKET SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa1 > 0 ? sisaPokokCurrent / tSisa1 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN SEGMEN DISTRIBUSI PEMASARAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">SEGMEN PRODUK</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">OS PINJAMAN</th>
//               <th class="border-excel-light text-right">BEBAN ANGSURAN</th>
//               <th class="border-excel-light text-center w-24">SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa2 > 0 ? sisaPokokCurrent / tSisa2 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">V. POSISI TAGIHAN BERDASARKAN INSTANSI</div>
//         <table class="text-left" style="font-size: 10px;">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th rowspan="2" class="border-excel-light text-center w-6">No</th>
//               <th rowspan="2" class="border-excel-light">INSTANSI / MITRA</th>
//               <th rowspan="2" class="border-excel-light text-center w-10">DEB</th>
//               <th rowspan="2" class="border-excel-light text-right">SISA POKOK</th>
//               <th rowspan="2" class="border-excel-light text-right">TAGIHAN TARGET</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">REALISASI BAYAR</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">SISA TUNGGAKAN</th>
//             </tr>
//             <tr class="text-white">
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% / EFF</th>
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% OB</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const deb = d.deb || 0;
//                 const angs = d.angsuran || 0;
//                 const real = d.realisasi || 0;

//                 const sisaTunggakan = angs - real;
//                 const pctBayar = angs > 0 ? real / angs : 0;
//                 const pctSisa = angs > 0 ? sisaTunggakan / angs : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${deb}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(angs)}</td>
//                   <td class="border-excel-light text-center">${real > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(real)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctBayar)}</td>
//                   <td class="border-excel-light text-center">${sisaTunggakan > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaTunggakan)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctSisa)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL KONSOLIDASI TAGIHAN</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebRealisasi}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct(tRealizTotal / tAngs1) : "0.00%"}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebTunggakan}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1 - tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct((tAngs1 - tRealizTotal) / tAngs1) : "0.00%"}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//     </body>
//   </html>
//   `;

//   return html;
// };

// export const printKredit = (record: any, selectedMonth: string | null) => {
//   // Parsing base data sebelum dikirim ke engine pencetak HTML
//   // Pastikan parameter 'record' di sini berisi struktur dasar array data Anda
//   const htmlContent = generate(record, selectedMonth);

//   const w = window.open("", "_blank");
//   if (!w) {
//     alert("Popup diblokir. Mohon aktifkan izin popup browser Anda.");
//     return;
//   }

//   w.document.open();
//   w.document.write(htmlContent);
//   w.document.close();

//   w.onload = function () {
//     setTimeout(() => {
//       w.print();
//     }, 600);
//   };
// };

// import moment from "moment";

// moment.locale("id");

// const generate = (record: any, selectedMonth: string | null) => {
//   const sortByOsDesc = (items: any[]) =>
//     [...items].sort(
//       (a, b) =>
//         Number(b.totalOs ?? b.sisaPokok ?? 0) -
//         Number(a.totalOs ?? a.sisaPokok ?? 0),
//     );

//   // 1. Ambil array data instansi & segmentasi yang sudah diproses di luar (seperti getInstansiBaseData)
//   const instansiData = sortByOsDesc(
//     (record?.instansiData || record?.instansi_data || []) as any[],
//   );
//   const segmentData = sortByOsDesc(
//     (record?.segmentData || record?.segment_data || []) as any[],
//   );
//   const instansiKolData = (record?.instansiKolData ||
//     record?.instansi_kol_data ||
//     instansiData) as any[];
//   const segmentKolData = (record?.segmentKolData ||
//     record?.segment_kol_data ||
//     segmentData) as any[];
//   const aoData = sortByOsDesc(
//     (record?.aoData || record?.ao_data || []) as any[],
//   );
//   const aoKolData = (record?.aoKolData ||
//     record?.ao_kol_data ||
//     aoData) as any[];

//   const periodeTeks = selectedMonth
//     ? moment(selectedMonth).format("MMM-YY")
//     : "SEMUA DATA";
//   const tanggalCetak = moment().format("DD MMMM YYYY");

//   // ==========================================
//   // KALKULASI DINAMIS BERDASARKAN DATA MENTAH
//   // ==========================================

//   // Variabel Akumulasi Bagian I (Instansi)
//   let tDeb1 = 0,
//     tSisa1 = 0,
//     tAngs1 = 0,
//     tNplValue1 = 0,
//     tRealizTotal = 0;

//   instansiData.forEach((d) => {
//     tDeb1 += d.deb || 0;
//     tSisa1 += d.sisaPokok || 0;
//     tAngs1 += d.angsuran || 0;
//     tNplValue1 += d.nplValue || 0;
//     tRealizTotal += d.realisasi || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian I
//   const globalNplGross1 = tSisa1 > 0 ? tNplValue1 / tSisa1 : 0;

//   // Variabel Akumulasi Bagian II (Segmentasi)
//   let tDeb2 = 0,
//     tSisa2 = 0,
//     tAngs2 = 0,
//     tNplValue2 = 0;

//   segmentData.forEach((d) => {
//     tDeb2 += d.deb || 0;
//     tSisa2 += d.sisaPokok || 0;
//     tAngs2 += d.angsuran || 0;
//     tNplValue2 += d.nplValue || 0;
//   });

//   // Hitung Nilai Akhir NPL Gross Konsolidasi Bagian II
//   const globalNplGross2 = tSisa2 > 0 ? tNplValue2 / tSisa2 : 0;

//   // Variabel Akumulasi Bagian VI (AO)
//   // Data AO dikirim dari dashboard sebagai aoKolData, dengan nama AO dari Billing.User
//   let tDebAo = 0,
//     tSisaAo = 0,
//     tAngsAo = 0,
//     tNplValueAo = 0;

//   aoData.forEach((d) => {
//     tDebAo += d.countTransaksi || d.deb || 0;
//     tSisaAo += d.totalOs || d.sisaPokok || 0;
//     tAngsAo += d.totalTagihan || d.angsuran || 0;
//     tNplValueAo += d.nplValue || 0;
//   });

//   const globalNplGrossAo = tSisaAo > 0 ? tNplValueAo / tSisaAo : 0;

//   // Menghitung total debitur realisasi & tunggakan secara riil untuk Section V
//   let tDebRealisasi = 0;
//   let tDebTunggakan = 0;
//   instansiData.forEach((d) => {
//     const deb = d.deb || 0;
//     const angs = d.angsuran || 0;
//     const real = d.realisasi || 0;

//     if (real > 0) tDebRealisasi += deb;
//     if (angs - real > 0) tDebTunggakan += deb;
//   });

//   // ==========================================
//   // FORMATTING HANDLERS
//   // ==========================================
//   const formatIDR = (num: number | undefined | null) => {
//     if (num === undefined || num === null) return "0";
//     return new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0 }).format(
//       num,
//     );
//   };

//   const formatPct = (num: number | undefined | null) => {
//     if (num === undefined || num === null || isNaN(num)) return "0.00%";
//     return (num * 100).toFixed(2) + "%";
//   };

//   // Template Reusable Header BPR
//   const renderBprHeader = (titleText: string) => `
//     <div class="mb-4">
//       <div class="text-xs font-bold text-gray-500 font-sans" style="color: #1F4E78;">PT BPR HASAMITRA JAWA BARAT</div>
//       <div class="text-sm font-bold text-black font-sans">${titleText.toUpperCase()}</div>
//       <div class="text-xs italic text-gray-400 font-sans">PERIODE LAPORAN: ${periodeTeks.toUpperCase()}</div>
//     </div>
//   `;

//   // Template Reusable Tanda Tangan
//   const renderSignatures = () => `
//     <div class="mt-6 grid grid-cols-3 text-left font-sans avoidance" style="font-size: 11px;">
//       <div>
//         <div class="italic text-gray-500 mb-2">Depok, ${tanggalCetak}</div>
//         <div class="font-bold text-gray-800">Disiapkan Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Leony</div>
//         <div class="text-gray-600">Admin Kredit</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Diperiksa Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Komang Gd Ariawan</div>
//         <div class="text-gray-600">Head Bisnis</div>
//       </div>
//       <div>
//         <div class="h-4 mb-2"></div>
//         <div class="font-bold text-gray-800">Disetujui Oleh,</div>
//         <div class="mt-20 font-bold text-black underline">Ketut Sugiata</div>
//         <div class="text-gray-600">Direktur Utama</div>
//       </div>
//     </div>
//   `;

//   const html = `
//   <!doctype html>
//   <html>
//     <head>
//       <meta charset="utf-8" />
//       <meta name="viewport" content="width=device-width,initial-scale=1" />
//       <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
//       <style>
//         @page { size: A4 portrait; margin: 12mm 15mm; }
//         @page landscape-layout { size: A4 landscape; margin: 10mm 12mm; }
//         html, body {
//           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//           font-size: 11px;
//           background-color: #ffffff;
//           line-height: 1.3;
//         }
//         .page { width: 100%; }
//         .page.landscape { page: landscape-layout; }
//         .page-break { page-break-before: always; break-before: page; }
//         .avoidance { page-break-inside: avoid; break-inside: avoid; }

//         .bg-primary-dark { background-color: #1F4E78 !important; }
//         .bg-primary-sub { background-color: #2F5597 !important; }
//         .bg-accent-total { background-color: #FFF2CC !important; }
//         .bg-zebra-even { background-color: #F2F2F2 !important; }
//         .bg-share-total { background-color: #DCE6F1 !important; }
//         .border-excel-light { border: 1px solid #D9D9D9 !important; }
//         .border-total-top { border-top: 1px solid #000000 !important; }
//         .border-total-bottom { border-bottom: 3px double #000000 !important; }

//         table { border-collapse: collapse !important; width: 100%; }
//         th { font-weight: bold; text-align: center; vertical-align: middle; padding: 6px 4px; font-size: 10px; }
//         td { vertical-align: middle; padding: 5px 6px; }
//         tbody tr:hover { background-color: #EBF5FF; }
//         .subtotal-row td { background-color: #E2F0D9 !important; font-weight: bold; }
//         .text-muted { color: #64748b; }

//         @media print {
//           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #ffffff; }
//         }
//       </style>
//     </head>
//     <body class="text-gray-900 bg-white p-2">

//       <div class="page landscape">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">I. KOLEKTIBILITAS BERDASARKAN INSTANSI</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Instansi / Mitra Kerja</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;
//                 const nplFontColor =
//                   nplVal !== null && nplVal * 100 > 5
//                     ? "color: #9C0006; font-weight: bold;"
//                     : "";

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross1)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">II. KOLEKTIBILITAS BERDASARKAN SEGMENTASI KREDIT</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Segmen / Skema Kredit</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGross2)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN POSISI SALDO OUTSTANDING KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">III. POSISI KREDIT BERDASARKAN INSTANSI (PKS)</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">NAMA MITRA INSTANSI</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">SISA POKOK (OS)</th>
//               <th class="border-excel-light text-right">ANGSURAN BULANAN</th>
//               <th class="border-excel-light text-center w-24">MARKET SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa1 > 0 ? sisaPokokCurrent / tSisa1 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page page-break">
//         ${renderBprHeader("LAPORAN SEGMEN DISTRIBUSI PEMASARAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">IV. POSISI KREDIT BERDASARKAN SEGMEN PEMASARAN</div>
//         <table class="text-left">
//           <thead>
//             <tr class="text-white" style="background-color: #4F81BD;">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">SEGMEN PRODUK</th>
//               <th class="border-excel-light text-center w-16">TOTAL DEB</th>
//               <th class="border-excel-light text-right">OS PINJAMAN</th>
//               <th class="border-excel-light text-right">BEBAN ANGSURAN</th>
//               <th class="border-excel-light text-center w-24">SHARE (%)</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${segmentData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const sisaPokokCurrent = d.sisaPokok || 0;
//                 const share = tSisa2 > 0 ? sisaPokokCurrent / tSisa2 : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.segmen || ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaPokokCurrent)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center">${formatPct(share)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-share-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL PORTOFOLIO</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb2}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs2)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">100.00%</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KREDIT")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">V. POSISI TAGIHAN BERDASARKAN INSTANSI</div>
//         <table class="text-left" style="font-size: 10px;">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th rowspan="2" class="border-excel-light text-center w-6">No</th>
//               <th rowspan="2" class="border-excel-light">INSTANSI / MITRA</th>
//               <th rowspan="2" class="border-excel-light text-center w-10">DEB</th>
//               <th rowspan="2" class="border-excel-light text-right">SISA POKOK</th>
//               <th rowspan="2" class="border-excel-light text-right">TAGIHAN TARGET</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">REALISASI BAYAR</th>
//               <th colspan="3" class="border-excel-light text-center bg-primary-dark">SISA TUNGGAKAN</th>
//             </tr>
//             <tr class="text-white">
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% / EFF</th>
//               <th class="border-excel-light text-center bg-primary-sub w-10">DEB</th>
//               <th class="border-excel-light text-right bg-primary-sub">NOMINAL</th>
//               <th class="border-excel-light text-center bg-primary-sub w-16">% OB</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${instansiData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const deb = d.deb || 0;
//                 const angs = d.angsuran || 0;
//                 const real = d.realisasi || 0;

//                 const sisaTunggakan = angs - real;
//                 const pctBayar = angs > 0 ? real / angs : 0;
//                 const pctSisa = angs > 0 ? sisaTunggakan / angs : 0;

//                 return `
//                 <tr class="${isZebra}">
//                   <td class="border-excel-light text-center">${d.no || idx + 1}</td>
//                   <td class="border-excel-light">${d.instansi || ""}</td>
//                   <td class="border-excel-light text-center">${deb}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(angs)}</td>
//                   <td class="border-excel-light text-center">${real > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(real)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctBayar)}</td>
//                   <td class="border-excel-light text-center">${sisaTunggakan > 0 ? deb : 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(sisaTunggakan)}</td>
//                   <td class="border-excel-light text-center">${formatPct(pctSisa)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="2" class="border-excel-light border-total-top border-total-bottom text-left">TOTAL KONSOLIDASI TAGIHAN</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDeb1}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisa1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebRealisasi}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct(tRealizTotal / tAngs1) : "0.00%"}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebTunggakan}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngs1 - tRealizTotal)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tAngs1 > 0 ? formatPct((tAngs1 - tRealizTotal) / tAngs1) : "0.00%"}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//       <div class="page landscape page-break">
//         ${renderBprHeader("LAPORAN POSISI KOLEKTIBILITAS PINJAMAN")}

//         <div class="text-xs font-bold mb-2" style="color: #1F4E78;">VI. KOLEKTIBILITAS BERDASARKAN AO</div>
//         <table class="text-left">
//           <thead>
//             <tr class="bg-primary-dark text-white">
//               <th class="border-excel-light text-center w-8">No</th>
//               <th class="border-excel-light">Account Officer</th>
//               <th class="border-excel-light text-center w-10">Kol</th>
//               <th class="border-excel-light text-center w-14">Debitur</th>
//               <th class="border-excel-light text-right">Sisa Pokok (OS)</th>
//               <th class="border-excel-light text-right">Angsuran Wajib</th>
//               <th class="border-excel-light text-center w-24">NPL Gross</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${aoKolData
//               .map((d, idx) => {
//                 const isZebra = idx % 2 === 1 ? "bg-zebra-even" : "";
//                 const isSubtotal = d.rowType === "subtotal";
//                 const rowClass = `${isZebra} ${isSubtotal ? "subtotal-row" : ""}`;
//                 const nplVal = isSubtotal ? (d.nplGross || 0) / 100 : null;
//                 const nplFontColor =
//                   nplVal !== null && nplVal * 100 > 5
//                     ? "color: #9C0006; font-weight: bold;"
//                     : "";

//                 return `
//                 <tr class="${rowClass}">
//                   <td class="border-excel-light text-center">${d.no || ""}</td>
//                   <td class="border-excel-light">${d.aoName || ""}</td>
//                   <td class="border-excel-light text-center">${d.kol ?? ""}</td>
//                   <td class="border-excel-light text-center">${d.deb || 0}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.sisaPokok)}</td>
//                   <td class="border-excel-light text-right">${formatIDR(d.angsuran)}</td>
//                   <td class="border-excel-light text-center" style="${nplFontColor}">${nplVal === null ? "" : formatPct(nplVal)}</td>
//                 </tr>
//               `;
//               })
//               .join("")}
//             <tr class="bg-accent-total font-bold text-black">
//               <td colspan="3" class="border-excel-light border-total-top border-total-bottom text-left">GRAND TOTAL KONSOLIDASI</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${tDebAo}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tSisaAo)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-right">${formatIDR(tAngsAo)}</td>
//               <td class="border-excel-light border-total-top border-total-bottom text-center">${formatPct(globalNplGrossAo)}</td>
//             </tr>
//           </tbody>
//         </table>
//         ${renderSignatures()}
//       </div>

//     </body>
//   </html>
//   `;

//   return html;
// };

// export const printKredit = (record: any, selectedMonth: string | null) => {
//   // Parsing base data sebelum dikirim ke engine pencetak HTML
//   // Pastikan parameter 'record' di sini berisi struktur dasar array data Anda
//   const htmlContent = generate(record, selectedMonth);

//   const w = window.open("", "_blank");
//   if (!w) {
//     alert("Popup diblokir. Mohon aktifkan izin popup browser Anda.");
//     return;
//   }

//   w.document.open();
//   w.document.write(htmlContent);
//   w.document.close();

//   w.onload = function () {
//     setTimeout(() => {
//       w.print();
//     }, 600);
//   };
// };
