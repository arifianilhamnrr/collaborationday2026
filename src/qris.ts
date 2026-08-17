export function qrisWithAmount(payload: string, amount: number): string {
  if (!Number.isInteger(amount) || amount < 1 || amount > 999_999_999) throw new Error('Nominal QRIS tidak valid');
  const fields = parseQris(payload.trim());
  if (!fields.some((field) => field.tag === '00' && field.value === '01') || !fields.some((field) => field.tag === '53' && field.value === '360')) throw new Error('Payload QRIS tidak valid');
  const withoutDynamic = fields.filter((field) => !['01', '54', '63'].includes(field.tag));
  const initiationIndex = Math.max(1, withoutDynamic.findIndex((field) => field.tag === '26'));
  withoutDynamic.splice(initiationIndex, 0, { tag: '01', value: '12' });
  const countryIndex = withoutDynamic.findIndex((field) => field.tag === '58');
  if (countryIndex < 0) throw new Error('Payload QRIS tidak memiliki country code');
  withoutDynamic.splice(countryIndex, 0, { tag: '54', value: String(amount) });
  const content = withoutDynamic.map(encodeField).join('') + '6304';
  return content + crc16Ccitt(content);
}

function parseQris(payload: string): Array<{ tag: string; value: string }> {
  const fields: Array<{ tag: string; value: string }> = [];
  for (let offset = 0; offset < payload.length;) {
    const tag = payload.slice(offset, offset + 2);
    const lengthText = payload.slice(offset + 2, offset + 4);
    const length = Number(lengthText);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText) || offset + 4 + length > payload.length) throw new Error('Struktur payload QRIS tidak valid');
    fields.push({ tag, value: payload.slice(offset + 4, offset + 4 + length) });
    offset += 4 + length;
  }
  return fields;
}

function encodeField(field: { tag: string; value: string }): string {
  if (field.value.length > 99) throw new Error('Field QRIS terlalu panjang');
  return `${field.tag}${String(field.value.length).padStart(2, '0')}${field.value}`;
}

function crc16Ccitt(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
