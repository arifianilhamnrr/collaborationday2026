type ReceiptData = {
  receiptNumber: string;
  participantName: string;
  participantCode: string;
  eventTitle: string;
  eventTheme: string;
  venue: string;
  amount: number;
  paymentMethod: string;
  verifiedAt: string;
};

function pdfText(value: string): string {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function rupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}

export function generateReceiptPdf(data: ReceiptData): Uint8Array {
  const lines = [
    ['COLLABORATION DAY 2026', 24, 72, 760],
    ['KUITANSI ELEKTRONIK', 12, 72, 733],
    [`NO. ${data.receiptNumber}`, 10, 392, 733],
    ['LUNAS', 28, 410, 665],
    ['Diterima dari', 9, 72, 650],
    [data.participantName, 15, 72, 628],
    [`Kode peserta: ${data.participantCode}`, 9, 72, 608],
    ['Untuk pembayaran', 9, 72, 560],
    [data.eventTitle, 15, 72, 538],
    [data.eventTheme, 10, 72, 518],
    [`Lokasi: ${data.venue}`, 9, 72, 494],
    ['Nominal', 9, 72, 438],
    [rupiah(data.amount), 24, 72, 407],
    [`Metode: ${data.paymentMethod}`, 9, 72, 382],
    [`Diverifikasi: ${data.verifiedAt}`, 9, 72, 362],
    ['Dokumen ini diterbitkan secara elektronik oleh sistem resmi Collaboration Day.', 8, 72, 116],
    ['Simpan kuitansi ini sebagai bukti pembayaran yang sah.', 8, 72, 101],
  ] as const;
  const stream = [
    '0.024 0.039 0.216 rg 0 0 595 842 re f',
    '0.961 0.949 0.914 rg 20 20 555 802 re f',
    '0.216 0.341 0.651 RG 4 w 48 340 499 1 re S',
    '0.514 0.369 0.710 rg 390 632 145 70 re f',
    '1 1 1 rg BT /F1 28 Tf 410 665 Td (LUNAS) Tj ET',
    ...lines.filter((line) => line[0] !== 'LUNAS').map(([text, size, x, y]) => `0.024 0.039 0.216 rg BT /F1 ${size} Tf ${x} ${y} Td (${pdfText(text)}) Tj ET`),
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${new TextEncoder().encode(stream).byteLength} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(new TextEncoder().encode(pdf).byteLength); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = new TextEncoder().encode(pdf).byteLength;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
