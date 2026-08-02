// Parser/writer CSV minimal (RFC 4180-ish) dipakai oleh
// generate-lokasi-suggestions.ts dan seed-lokasi-ref.ts. Tidak ada dependency
// eksternal untuk ini di package.json, jadi ditulis sendiri secukupnya —
// bukan untuk dipakai di luar dua skrip itu.

export function toCsvField(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsvRow(fields: string[]): string {
  return fields.map(toCsvField).join(",");
}

export function toCsv(header: string[], rows: string[][]): string {
  return [toCsvRow(header), ...rows.map(toCsvRow)].join("\r\n") + "\r\n";
}

/** Parse teks CSV jadi array baris (masing-masing array kolom mentah). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }

  // baris terakhir tanpa newline penutup
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Parse CSV dengan header baris pertama -> array of objects. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  return body.map((r) => {
    const rec: Record<string, string> = {};
    header.forEach((key, idx) => {
      rec[key] = r[idx] ?? "";
    });
    return rec;
  });
}
