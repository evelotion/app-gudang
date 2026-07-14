// src/lib/mappings.ts

/**
 * MAPPING COA (CHART OF ACCOUNTS)
 * Sesuai dengan pembukuan Jurnal.
 */
export const COA_MAP: Record<string, { aset: string; akm: string }> = {
  'Komputer': { aset: '1311304', akm: '1312304' },
  'Mesin Kantor Gol I': { aset: '1311302', akm: '1312302' },
  'Perabot Kantor Gol I': { aset: '1311303', akm: '1312303' },
  'Mesin Kantor Gol II': { aset: '1311402', akm: '1312402' },
  'Perabot Kantor Gol II': { aset: '1311403', akm: '1312403' },
};

/**
 * MAPPING PENGELOMPOKAN JURNAL
 * Menyatukan beberapa golongan aplikasi menjadi 1 golongan jurnal (sesuai template)
 */
export const GOLONGAN_JURNAL_MAP: Record<string, string> = {
  'Komputer': 'Komputer',
  'Mesin Kantor': 'Mesin Kantor Gol I',
  'Alat Perlengkapan Lainnya': 'Mesin Kantor Gol I',
  'Perabot Kantor': 'Perabot Kantor Gol I',
  // Aset Non-Inventaris akan dilewati oleh filter di exportJournal
};

/**
 * MAPPING KODE CABANG & SINGKATAN (Dari File "kode cabang 2.xlsx")
 */
export const CABANG_MAP: Record<string, { code: string; abbr: string }> = {
  'KC Jatinegara': { code: '001', abbr: 'JTG' },
  'KC Mangga Dua': { code: '002', abbr: 'MGD' },
  'KC Samanhudi': { code: '003', abbr: 'SMH' },
  'KC Sunter': { code: '004', abbr: 'STR' },
  'KC Surabaya': { code: '005', abbr: 'DHA' },
  'KCP Kenari': { code: '006', abbr: 'KNR' },
  'KCP Bekasi': { code: '007', abbr: 'BKS' },
  'KCP Kelapa gading': { code: '008', abbr: 'KLG' },
  'ULS Tanah Abang': { code: '009', abbr: 'TNA' },
  'ULS Margonda Depok': { code: '010', abbr: 'DEP' },
  'ULS Darmo Surabaya': { code: '011', abbr: 'DAR' },
  'ULS Metro Pondok Indah': { code: '012', abbr: 'PDI' },
  'ULS Tangerang': { code: '013', abbr: 'TGR' },
  'ULS Bogor': { code: '014', abbr: 'BGR' },
  'ULS Veteran Surabaya': { code: '015', abbr: 'VET' },
  'ULS Sidoarjo': { code: '016', abbr: 'SDA' },
  'ULS Pasar Minggu': { code: '017', abbr: 'PSM' },
  'ULS Cimanggis': { code: '018', abbr: 'CMS' },
  'ULS Tanjung Priok': { code: '019', abbr: 'TPK' },
  'ULS Kapas Krampung': { code: '020', abbr: 'KKP' },
  'ULS Pondok Chandra': { code: '021', abbr: 'PDC' },
  'ULS Sepanjang': { code: '022', abbr: 'SPG' },
  'ULS Melawai': { code: '023', abbr: 'MLW' },
  'ULS Gudang Peluru': { code: '024', abbr: 'GDP' },
  'ULS Kemang Mansion': { code: '025', abbr: 'KMM' },
  'KCP Kranji Bekasi': { code: '026', abbr: 'MKJ' },
  'KCP Ps. Anyar Bogor': { code: '027', abbr: 'MAB' },
  'KCP Ciledug Tangerang': { code: '028', abbr: 'MCL' },
  'ULS Perak Barat (Pucang Anom)': { code: '029', abbr: 'PER' },
  'KC Semarang': { code: '030', abbr: 'SMG' },
  'ULS Juanda Bekasi': { code: '031', abbr: 'JDB' },
  'ULS Gedangan': { code: '032', abbr: 'GDG' },
  'ULS Gresik': { code: '033', abbr: 'GSI' },
  'ULS Majapahit': { code: '034', abbr: 'MJP' },
  'KC Bandung': { code: '035', abbr: 'BDG' },
  'ULS Puri Indah': { code: '036', abbr: 'PPI' },
  'KC Solo': { code: '037', abbr: 'SLO' },
  'KCP Pondok Gede': { code: '038', abbr: 'MPG' },
  'KF BUR Cibinong': { code: '039', abbr: 'CIB' }, 
  'KCP Cikarang Selatan': { code: '040', abbr: 'MCS' },
  'Sentra menteng': { code: '041', abbr: 'MTG' },
  'KCP Ciputat': { code: '042', abbr: 'MCP' },
  'KCP Depok': { code: '043', abbr: 'MDP' },
  'KCP Cileungsi': { code: '044', abbr: 'MCI' },
  'KF BUR Cikarang Utara': { code: '045', abbr: 'CKR' }, 
  'KC Yogyakarta': { code: '046', abbr: 'YOG' },
  'ULS Pluit Kencana': { code: '047', abbr: 'PLK' },
  'ULS Solo Slamet riyadi': { code: '048', abbr: 'SSR' },
  'ULS Dago/ ULS Asia Afrika': { code: '049', abbr: 'DAG' },
  'KC Medan': { code: '050', abbr: 'MDN' },
  'ULS Bintaro Utama': { code: '051', abbr: 'BTU' },
  'KCU Palembang': { code: '052', abbr: 'PLG' },
  'KCP Malang': { code: '053', abbr: 'MLG' },
  'ULS Kotabaru Parahyangan': { code: '054', abbr: 'KBP' },
  'ULS Sudirman Yogyakarta': { code: '055', abbr: 'SDY' },
  'ULS Kudus': { code: '056', abbr: 'KDS' },
  'ULS Pemuda Semarang': { code: '057', abbr: 'PMS' },
  'ULS Pandaan': { code: '058', abbr: 'PDA' },
  'ULS Buah Batu': { code: '059', abbr: 'BBT' },
  'ULS Singosaren Solo': { code: '060', abbr: 'SGN' },
  'ULS Sragen Solo': { code: '061', abbr: 'SRA' },
  'ULS Mojokerto': { code: '062', abbr: 'MJK' },
  'ULS Kepanjen': { code: '063', abbr: 'KPJ' },
  'ULS Rifai Palembang': { code: '064', abbr: 'ARV' },
  'ULS Bintaro Sek 7': { code: '065', abbr: 'BTR' },
  'KC Bandar Lampung': { code: '066', abbr: 'BDL' },
  'KC Banda Aceh': { code: '067', abbr: 'BDA' },
  'KCP Kediri': { code: '068', abbr: 'KDR' },
  'KCP Iskandar Muda': { code: '069', abbr: 'SBU' },
  'KCP Pasuruan': { code: '070', abbr: 'PSR' },
  'KC Panakkukang': { code: '071', abbr: 'PNK' },
  'KCP Lhokseomawe': { code: '072', abbr: 'LSW' },
  'ULS Bireuen': { code: '073', abbr: 'BIR' },
  'ULS Taman Pondok Indah': { code: '074', abbr: 'TPI' },
  'ULS Sudirman Palembang': { code: '075', abbr: 'SDP' },
  'KCP Banyuwangi': { code: '076', abbr: 'BWI' },
  'KCP ULS Cimahi': { code: '077', abbr: 'CMH' },
  'KCP Sungkono Surabaya': { code: '078', abbr: 'SGK' },
  'KCP Metro Lampung': { code: '079', abbr: 'MTO' },
  'ULS Arundina Cibubur': { code: '080', abbr: 'ARC' },
  'ULS Cirebon': { code: '081', abbr: 'CRB' },
  'ULS PADANG': { code: '082', abbr: 'PDG' },
  'KP': { code: '999', abbr: 'KP' },
};

/**
 * FUNGSI GET KODE & ABBREVIASI CABANG
 * Mencari nama cabang. Jika di luar mapping, otomatis di-fallback ke KP (999).
 */
export const getCabangInfo = (lokasi: string) => {
  if (!lokasi) return { code: '999', abbr: 'KP' };
  
  const locLower = lokasi.toLowerCase().trim();
  
  // Deteksi otomatis untuk Kantor Pusat / Departemen logistik dll
  if (locLower.includes('departemen') || locLower === 'kp' || locLower.includes('pusat')) {
    return { code: '999', abbr: 'KP' };
  }
  
  // Mencari dari map secara case-insensitive
  const foundKey = Object.keys(CABANG_MAP).find(k => k.toLowerCase() === locLower);
  if (foundKey) {
    return CABANG_MAP[foundKey];
  }
  
  // Fallback: Selain yang ada di mapping, masukkan ke KP
  return { code: '999', abbr: 'KP' };
};