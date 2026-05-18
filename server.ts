import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Mock Database for Ijasah Module ---
  let dokumenIjasah: any[] = [];
  let statusKelulusan: any[] = [];
  let rekapNas: any[] = [];
  let konfigurasiIjasah: any[] = [
    { key_name: "IJASAH_API_URL", key_value: "https://api.example.com/ijasah" }
  ];
  let profilSekolah: any = {
    nama_sekolah: "SD NEGERI CONTOH",
    npsn: "12345678",
    alamat: "Jl. Raya Pendidikan No. 123",
    desa_kelurahan: "Pendidikan",
    kecamatan: "Cerdas",
    kabupaten_kota: "Smart City",
    provinsi: "Jawa Barat",
    kode_pos: "12345",
    nama_kepala_sekolah: "DRS. H. MULYONO, M.PD",
    nip_kepala_sekolah: "197001011995011001",
    logo_path: null,
    ttd_kepala_sekolah_path: null
  };
  let mataPelajaran: any[] = [
    { id: 1, kode_mapel: "PAI", nama_mapel: "Pendidikan Agama dan Budi Pekerti", kelompok: "A", kkm: 75 },
    { id: 2, kode_mapel: "PPKN", nama_mapel: "Pendidikan Pancasila dan Kewarganegaraan", kelompok: "A", kkm: 75 },
    { id: 3, kode_mapel: "IND", nama_mapel: "Bahasa Indonesia", kelompok: "A", kkm: 75 },
    { id: 4, kode_mapel: "MAT", nama_mapel: "Matematika", kelompok: "A", kkm: 75 },
    { id: 5, kode_mapel: "IPA", nama_mapel: "Ilmu Pengetahuan Alam", kelompok: "A", kkm: 75 },
    { id: 6, kode_mapel: "IPS", nama_mapel: "Ilmu Pengetahuan Sosial", kelompok: "A", kkm: 75 },
    { id: 7, kode_mapel: "SBDP", nama_mapel: "Seni Budaya dan Prakarya", kelompok: "B", kkm: 75 },
    { id: 8, kode_mapel: "PJOK", nama_mapel: "Pendidikan Jasmani Olahraga dan Kesehatan", kelompok: "B", kkm: 75 }
  ];
  let nilaiRaporFull: any[] = [];
  let prestasiSiswa: any[] = [];
  let tahunAjaran: any[] = [
    { id: 1, tahun: "2023/2024", semester: "Ganjil", is_active: 0 },
    { id: 2, tahun: "2023/2024", semester: "Genap", is_active: 1 }
  ];

  // Helper student data for validation (must match the academy routes)
  const masterSiswa = [
    { nis: "1603", nisn: "3130811571", nama: "AFIFAH NURUL KEISYA" },
    { nis: "1604", nisn: "3131011572", nama: "AHMAD ZAKI YUSWAN" },
    { nis: "1605", nisn: "3131211573", nama: "ALVIRA RIZQIAH NURHASANAH" },
    { nis: "1606", nisn: "3131411574", nama: "ALYA NABILA" },
    { nis: "1607", nisn: "3131611575", nama: "ANGLING DHARMA" },
    { nis: "1608", nisn: "3131811576", nama: "ARJUNA RASYID PUTRA" },
    { nis: "1609", nisn: "3132011577", nama: "AZZEYAAN SHAFIA SETIO" },
    { nis: "1610", nisn: "3132211578", nama: "BAGAS PUTRA PRAMUDYA" },
    { nis: "1611", nisn: "3132411579", nama: "DHINO MULYA PRAKOSO" },
    { nis: "1612", nisn: "3132611580", nama: "ELYSIA VANIA REMU" },
  ];

  // ==========================================
  // API IJASAH ENDPOINTS
  // ==========================================
  
  // 0. Health Check
  app.get("/api/ijasah", (req, res) => {
    res.json({
      status: 'sukses',
      pesan: 'API Modul E-Ijazah V1 Aktif dan Berjalan',
      statistik: {
        total_dokumen_tercetak: dokumenIjasah.length,
        total_siswa_diproses: statusKelulusan.length,
        total_siswa_lulus: statusKelulusan.filter(s => s.status_kelulusan === 'Lulus').length
      }
    });
  });

  // 1. Dokumen Kelulusan
  app.get("/api/ijasah/dokumen", (req, res) => {
    const { siswa_id, jenis_dokumen } = req.query;
    let filtered = [...dokumenIjasah];
    
    if (siswa_id) filtered = filtered.filter(d => d.siswa_id === siswa_id);
    if (jenis_dokumen) filtered = filtered.filter(d => d.jenis_dokumen === jenis_dokumen);

    const mapped = filtered.map(dok => {
      const s = masterSiswa.find(m => m.nis === dok.siswa_id);
      return {
        ...dok,
        nama_lengkap: s?.nama || 'Tidak Ditemukan',
        nisn: s?.nisn || '-',
        nis: s?.nis || dok.siswa_id
      };
    });
    res.json({ status: 'sukses', data: mapped });
  });

  app.post("/api/ijasah/dokumen", (req, res) => {
    const { siswa_id, jenis_dokumen, file_path, qr_code_hash, is_generated } = req.body;
    if (!siswa_id || !jenis_dokumen) return res.status(400).json({ status: 'error', pesan: 'Siswa ID (NIS) dan Jenis Dokumen wajib diisi' });
    
    if (!masterSiswa.find(s => s.nis === siswa_id)) {
      return res.status(404).json({ status: 'error', pesan: 'Data siswa (NIS) tidak ditemukan di database Akademik' });
    }

    const id = uuidv4();
    const newDok = {
      id,
      siswa_id,
      jenis_dokumen,
      file_path: file_path || '',
      qr_code_hash: qr_code_hash || '',
      is_generated: is_generated ? 1 : 0,
      generated_at: is_generated ? new Date() : null
    };
    dokumenIjasah.push(newDok);
    res.json({ status: 'sukses', pesan: 'Dokumen berhasil ditambahkan', data: { id } });
  });

  app.put("/api/ijasah/dokumen/:id", (req, res) => {
    const { id } = req.params;
    const { file_path, qr_code_hash, is_generated } = req.body;
    const idx = dokumenIjasah.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ status: 'error', pesan: 'Dokumen tidak ditemukan' });

    if (file_path !== undefined) dokumenIjasah[idx].file_path = file_path;
    if (qr_code_hash !== undefined) dokumenIjasah[idx].qr_code_hash = qr_code_hash;
    if (is_generated !== undefined) {
      dokumenIjasah[idx].is_generated = is_generated ? 1 : 0;
      if (is_generated) dokumenIjasah[idx].generated_at = new Date();
    }
    res.json({ status: 'sukses', pesan: 'Dokumen berhasil diupdate' });
  });

  app.delete("/api/ijasah/dokumen/:id", (req, res) => {
    const { id } = req.params;
    const initialLen = dokumenIjasah.length;
    dokumenIjasah = dokumenIjasah.filter(d => d.id !== id);
    if (dokumenIjasah.length === initialLen) return res.status(404).json({ status: 'error', pesan: 'Dokumen tidak ditemukan' });
    res.json({ status: 'sukses', pesan: 'Dokumen berhasil dihapus' });
  });

  // 2. Status Kelulusan
  app.get("/api/ijasah/status", (req, res) => {
    const mapped = statusKelulusan.map(kel => {
      const s = masterSiswa.find(m => m.nis === kel.siswa_id);
      return {
        ...kel,
        nama_lengkap: s?.nama || 'Tidak Ditemukan',
        nisn: s?.nisn || '-',
        nis: s?.nis || kel.siswa_id
      };
    });
    res.json({ status: 'sukses', data: mapped });
  });

  app.post("/api/ijasah/status", (req, res) => {
    const { siswa_id, status_kelulusan, no_seri_ijazah, tanggal_yudisium, keterangan } = req.body;
    if (!siswa_id) return res.status(400).json({ status: 'error', pesan: 'Siswa ID (NIS) wajib diisi' });

    if (!masterSiswa.find(s => s.nis === siswa_id)) {
      return res.status(404).json({ status: 'error', pesan: 'Data siswa tidak ditemukan di database Akademik' });
    }

    const idx = statusKelulusan.findIndex(s => s.siswa_id === siswa_id);
    if (idx > -1) {
      statusKelulusan[idx] = { ...statusKelulusan[idx], status_kelulusan, no_seri_ijazah, tanggal_yudisium, keterangan };
      res.json({ status: 'sukses', pesan: 'Status kelulusan diupdate' });
    } else {
      statusKelulusan.push({ id: uuidv4(), siswa_id, status_kelulusan: status_kelulusan || 'Belum Diproses', no_seri_ijazah, tanggal_yudisium, keterangan });
      res.json({ status: 'sukses', pesan: 'Status kelulusan ditambahkan' });
    }
  });

  // 3. Rekap NAS
  app.get("/api/ijasah/rekap-nas/:siswa_id", (req, res) => {
    const { siswa_id } = req.params;
    // Mapel mock reference
    const mockMapels: Record<number, {nama: string, kelompok: string}> = {
      1: { nama: "Bahasa Indonesia", kelompok: "A" },
      2: { nama: "Matematika", kelompok: "A" }
    };

    const filtered = rekapNas.filter(r => r.siswa_id === siswa_id).map(r => ({
      ...r,
      nama_mapel: mockMapels[r.mapel_id]?.nama || 'Unknown',
      kelompok: mockMapels[r.mapel_id]?.kelompok || 'A'
    }));
    res.json({ status: 'sukses', data: filtered });
  });

  app.post("/api/ijasah/rekap-nas", (req, res) => {
    const { siswa_id, mapel_id, rata_rata_rapor, nilai_ujian_sekolah, nilai_akhir } = req.body;
    if (!siswa_id || !mapel_id) return res.status(400).json({ status: 'error', pesan: 'Siswa ID (NIS) dan Mapel ID wajib' });
    
    if (!masterSiswa.find(s => s.nis === siswa_id)) return res.status(404).json({ status: 'error', pesan: 'Data siswa tidak ditemukan di database Akademik' });

    const idx = rekapNas.findIndex(r => r.siswa_id === siswa_id && r.mapel_id === mapel_id);
    if (idx > -1) {
      rekapNas[idx] = { ...rekapNas[idx], rata_rata_rapor, nilai_ujian_sekolah, nilai_akhir };
    } else {
      rekapNas.push({ id: rekapNas.length + 1, siswa_id, mapel_id, rata_rata_rapor, nilai_ujian_sekolah, nilai_akhir });
    }
    res.json({ status: 'sukses', pesan: 'Nilai NAS berhasil disimpan' });
  });

  // 4. Konfigurasi
  app.get("/api/ijasah/config", (req, res) => {
    res.json({ status: 'sukses', data: konfigurasiIjasah });
  });

  app.post("/api/ijasah/config", (req, res) => {
    const { key_name, key_value } = req.body;
    if (!key_name) return res.status(400).json({ status: 'error', pesan: 'Key Name wajib diisi' });
    
    const idx = konfigurasiIjasah.findIndex(c => c.key_name === key_name);
    if (idx > -1) {
      konfigurasiIjasah[idx].key_value = key_value;
    } else {
      konfigurasiIjasah.push({ key_name, key_value });
    }
    res.json({ status: 'sukses', pesan: `Konfigurasi ${key_name} berhasil disimpan` });
  });

  // 5. Data Sekolah
  app.get("/api/ijasah/sekolah", (req, res) => {
    res.json({ status: 'sukses', data: profilSekolah });
  });

  app.post("/api/ijasah/sekolah", (req, res) => {
    const { nama_sekolah, npsn } = req.body;
    if (!nama_sekolah || !npsn) return res.status(400).json({ status: 'error', pesan: 'Nama Sekolah dan NPSN wajib diisi' });
    profilSekolah = { ...profilSekolah, ...req.body };
    res.json({ status: 'sukses', pesan: 'Profil sekolah berhasil disimpan' });
  });

  // 6. Mata Pelajaran
  app.get("/api/ijasah/mapel", (req, res) => {
    res.json({ status: 'sukses', data: mataPelajaran });
  });

  app.post("/api/ijasah/mapel", (req, res) => {
    const { nama_mapel, kelompok, kkm, kode_mapel } = req.body;
    if (!nama_mapel) return res.status(400).json({ status: 'error', pesan: 'Nama Mapel wajib diisi' });
    const newMapel = {
      id: mataPelajaran.length + 1,
      kode_mapel,
      nama_mapel,
      kelompok: kelompok || 'A',
      kkm: kkm || 75
    };
    mataPelajaran.push(newMapel);
    res.json({ status: 'sukses', pesan: 'Mata pelajaran ditambahkan', data: { id: newMapel.id } });
  });

  app.put("/api/ijasah/mapel/:id", (req, res) => {
    const { id } = req.params;
    const { nama_mapel, kelompok, kkm, kode_mapel } = req.body;
    const idx = mataPelajaran.findIndex(m => String(m.id) === String(id));
    if (idx === -1) return res.status(404).json({ status: 'error', pesan: 'Mata pelajaran tidak ditemukan' });
    
    if (nama_mapel) mataPelajaran[idx].nama_mapel = nama_mapel;
    if (kelompok) mataPelajaran[idx].kelompok = kelompok;
    if (kkm !== undefined) mataPelajaran[idx].kkm = kkm;
    if (kode_mapel !== undefined) mataPelajaran[idx].kode_mapel = kode_mapel;
    
    res.json({ status: 'sukses', pesan: 'Mata pelajaran berhasil diupdate' });
  });

  app.delete("/api/ijasah/mapel/:id", (req, res) => {
    const { id } = req.params;
    mataPelajaran = mataPelajaran.filter(m => String(m.id) !== String(id));
    res.json({ status: 'sukses', pesan: 'Mapel berhasil dihapus' });
  });

  // 7. Pengolahan Nilai Rapor
  app.get("/api/ijasah/nilai-rapor/:siswa_id", (req, res) => {
    const { siswa_id } = req.params;
    const filtered = nilaiRaporFull.filter(n => n.siswa_id === siswa_id).map(n => {
      const m = mataPelajaran.find(mp => mp.id === n.mapel_id);
      return {
        ...n,
        nama_mapel: m?.nama_mapel || 'Unknown',
        kelompok: m?.kelompok || 'A',
        kkm: m?.kkm || 75
      };
    });
    res.json({ status: 'sukses', data: filtered });
  });

  app.post("/api/ijasah/nilai-rapor", (req, res) => {
    const { siswa_id, mapel_id, semester, nilai_pengetahuan, nilai_keterampilan } = req.body;
    if (!siswa_id || !mapel_id || !semester) return res.status(400).json({ status: 'error', pesan: 'Siswa ID, Mapel ID, dan Semester wajib diisi' });
    
    if (!masterSiswa.find(s => s.nis === siswa_id)) return res.status(404).json({ status: 'error', pesan: 'Siswa (NIS) tidak ditemukan di Akademik' });

    const idx = nilaiRaporFull.findIndex(n => n.siswa_id === siswa_id && n.mapel_id === mapel_id && n.semester === semester);
    if (idx > -1) {
      nilaiRaporFull[idx] = { ...nilaiRaporFull[idx], nilai_pengetahuan, nilai_keterampilan };
    } else {
      nilaiRaporFull.push({ id: nilaiRaporFull.length + 1, siswa_id, mapel_id, semester, nilai_pengetahuan, nilai_keterampilan });
    }
    res.json({ status: 'sukses', pesan: 'Nilai rapor berhasil disimpan' });
  });

  // 8. Prestasi Siswa
  app.get("/api/ijasah/prestasi/:siswa_id", (req, res) => {
    const { siswa_id } = req.params;
    const filtered = prestasiSiswa.filter(p => p.siswa_id === siswa_id);
    res.json({ status: 'sukses', data: filtered });
  });

  app.post("/api/ijasah/prestasi", (req, res) => {
    const { siswa_id, nama_prestasi, jenis_prestasi, tingkat, tahun, keterangan } = req.body;
    if (!siswa_id || !nama_prestasi) return res.status(400).json({ status: 'error', pesan: 'Siswa ID dan Nama Prestasi wajib' });
    
    if (!masterSiswa.find(s => s.nis === siswa_id)) return res.status(404).json({ status: 'error', pesan: 'Siswa (NIS) tidak ditemukan di Akademik' });

    const newPrestasi = {
      id: prestasiSiswa.length + 1,
      siswa_id,
      nama_prestasi,
      jenis_prestasi: jenis_prestasi || 'Akademik',
      tingkat: tingkat || 'Sekolah',
      tahun: tahun || new Date().getFullYear().toString(),
      keterangan
    };
    prestasiSiswa.push(newPrestasi);
    res.json({ status: 'sukses', pesan: 'Prestasi ditambahkan', data: { id: newPrestasi.id } });
  });

  app.delete("/api/ijasah/prestasi/:id", (req, res) => {
    const { id } = req.params;
    prestasiSiswa = prestasiSiswa.filter(p => String(p.id) !== String(id));
    res.json({ status: 'sukses', pesan: 'Prestasi berhasil dihapus' });
  });

  // 9. Tahun Ajaran
  app.get("/api/ijasah/tahun-ajaran", (req, res) => {
    res.json({ status: 'sukses', data: tahunAjaran.sort((a,b) => b.id - a.id) });
  });

  app.get("/api/ijasah/tahun-ajaran/aktif", (req, res) => {
    const aktif = tahunAjaran.find(t => t.is_active === 1);
    if (!aktif) return res.json({ status: 'sukses', data: null, pesan: 'Belum ada tahun ajaran yang diset aktif' });
    res.json({ status: 'sukses', data: aktif });
  });

  app.post("/api/ijasah/tahun-ajaran", (req, res) => {
    const { tahun, semester, is_active } = req.body;
    if (!tahun || !semester) return res.status(400).json({ status: 'error', pesan: 'Tahun dan Semester wajib diisi' });

    if (is_active) {
      tahunAjaran.forEach(t => t.is_active = 0);
    }

    const newTahun = {
      id: tahunAjaran.length > 0 ? Math.max(...tahunAjaran.map(t => t.id)) + 1 : 1,
      tahun,
      semester,
      is_active: is_active ? 1 : 0
    };
    tahunAjaran.push(newTahun);
    res.json({ status: 'sukses', pesan: 'Tahun ajaran ditambahkan', data: { id: newTahun.id } });
  });

  app.put("/api/ijasah/tahun-ajaran/:id/aktif", (req, res) => {
    const { id } = req.params;
    const idx = tahunAjaran.findIndex(t => String(t.id) === String(id));
    if (idx === -1) return res.status(404).json({ status: 'error', pesan: 'Tahun ajaran tidak ditemukan' });

    tahunAjaran.forEach(t => t.is_active = 0);
    tahunAjaran[idx].is_active = 1;

    res.json({ status: 'sukses', pesan: 'Tahun ajaran berhasil diaktifkan' });
  });

  app.delete("/api/ijasah/tahun-ajaran/:id", (req, res) => {
    const { id } = req.params;
    const item = tahunAjaran.find(t => String(t.id) === String(id));
    
    if (item && item.is_active === 1) {
      return res.status(400).json({ status: 'error', pesan: 'Tidak dapat menghapus tahun ajaran yang sedang aktif!' });
    }

    const initialLen = tahunAjaran.length;
    tahunAjaran = tahunAjaran.filter(t => String(t.id) !== String(id));
    
    if (tahunAjaran.length === initialLen) return res.status(404).json({ status: 'error', pesan: 'Tahun ajaran tidak ditemukan' });
    res.json({ status: 'sukses', pesan: 'Tahun ajaran berhasil dihapus' });
  });

  // --- End of Ijasah endpoints ---

  // Generic Proxy Endpoint to solve CORS issues
  app.post("/api/proxy", async (req, res) => {
    const { url, method, body, headers } = req.body;
    try {
      const response = await fetch(url, {
        method: method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, message: "Proxy Error: " + err.message });
    }
  });

  // Mock API Routes (Existing)
  app.post("/api/jbsuser/login", (req, res) => {
    const { nip, password } = req.body;
    
    if (nip === "2335621999" && password === "331075") {
      res.json({
        success: true,
        user: {
          nip: "2335621999",
          nama: "MOH. MUROKIBU W.M",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Murokib", // Placeholder since base64 is too long
          is_finance: 1,
          level: 2
        }
      });
    } else if (nip === "admin" && password === "admin") {
      res.json({
        success: true,
        user: {
          nip: "admin",
          nama: "Administrator",
          foto: null,
          is_finance: 1,
          level: 1
        }
      });
    } else {
      res.status(401).json({ success: false, message: "NIP atau Password salah" });
    }
  });

  app.get("/api/stats", (req, res) => {
    res.json({
      totalSiswa: 450,
      lulus: 120,
      belumDiproses: 330,
      grafikTren: [
        { tahun: '2021', lulus: 98 },
        { tahun: '2022', lulus: 105 },
        { tahun: '2023', lulus: 115 },
        { tahun: '2024', lulus: 120 },
      ]
    });
  });

  app.get("/api/siswa", (req, res) => {
    res.json([
      { id: '1', nisn: '0012345678', nama: 'Budi Santoso', kelas: 'XII-IPA-1', status: 'Lulus' },
      { id: '2', nisn: '0012345679', nama: 'Ani Wijaya', kelas: 'XII-IPA-1', status: 'Belum Diproses' },
      { id: '3', nisn: '0012345680', nama: 'Candra Pratama', kelas: 'XII-IPS-2', status: 'Tidak Lulus' },
    ]);
  });

  app.get("/api/jbsakad/kelas", (req, res) => {
    res.json({
      "status": "sukses",
      "source": "redis",
      "total": 13,
      "data": [
        {
          "idkelas": 188,
          "nama_kelas": "1A",
          "wali_kelas": "AMIRUN NISA",
          "hp_wali": "087878562830"
        },
        {
          "idkelas": 189,
          "nama_kelas": "1B",
          "wali_kelas": "IKA RAKHMAWATI",
          "hp_wali": "085817586840"
        },
        {
          "idkelas": 198,
          "nama_kelas": "2A",
          "wali_kelas": "ERNAWATI",
          "hp_wali": "085771619271"
        },
        {
          "idkelas": 199,
          "nama_kelas": "2B",
          "wali_kelas": "MARDIAH",
          "hp_wali": "089685314275"
        },
        {
          "idkelas": 196,
          "nama_kelas": "3A",
          "wali_kelas": "SYARIFAH NURJANAH",
          "hp_wali": "085716432910"
        },
        {
          "idkelas": 197,
          "nama_kelas": "3B",
          "wali_kelas": "ARIYAH",
          "hp_wali": "089650530215"
        },
        {
          "idkelas": 194,
          "nama_kelas": "4A",
          "wali_kelas": "SABA",
          "hp_wali": "08567672837"
        },
        {
          "idkelas": 195,
          "nama_kelas": "4B",
          "wali_kelas": "HERI KISWANTO",
          "hp_wali": "081513864491"
        },
        {
          "idkelas": 192,
          "nama_kelas": "5A",
          "wali_kelas": "SITI JUARIYAH",
          "hp_wali": "085287932381"
        },
        {
          "idkelas": 193,
          "nama_kelas": "5B",
          "wali_kelas": "DESI ARYANI",
          "hp_wali": "085899404504"
        },
        {
          "idkelas": 190,
          "nama_kelas": "6A",
          "wali_kelas": "MOH. MUROKIBU W.M",
          "hp_wali": "085959719450"
        },
        {
          "idkelas": 191,
          "nama_kelas": "6B",
          "wali_kelas": "FANNY FAJRIAH",
          "hp_wali": "089627901411"
        },
        {
          "idkelas": 200,
          "nama_kelas": "AMES",
          "wali_kelas": "ERWIN OKI FAUZI",
          "hp_wali": "085959719450"
        }
      ]
    });
  });

  app.get("/api/jbsakad/siswa/kelas/:idkelas", (req, res) => {
    const { idkelas } = req.params;
    res.json({
      status: "sukses",
      source: "mysql",
      data: [
        {
          nis: "1603",
          nisn: "3130811571",
          nama: "AFIFAH NURUL KEISYA",
          pinsiswa: "55756",
          hportu: "081316321078",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Afifah"
        },
        {
          nis: "1604",
          nisn: "3131011572",
          nama: "AHMAD ZAKI YUSWAN",
          pinsiswa: "99702",
          hportu: "08995650496",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad"
        },
        {
          nis: "1605",
          nisn: "3131211573",
          nama: "ALVIRA RIZQIAH NURHASANAH",
          pinsiswa: "20333",
          hportu: "087781320699",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alvira"
        },
        {
          nis: "1606",
          nisn: "3131411574",
          nama: "ALYA NABILA",
          pinsiswa: "72553",
          hportu: "082338081669",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alya"
        },
        {
          nis: "1607",
          nisn: "3131611575",
          nama: "ANGLING DHARMA",
          pinsiswa: "40867",
          hportu: "089501010101",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Angling"
        },
        {
          nis: "1608",
          nisn: "3131811576",
          nama: "ARJUNA RASYID PUTRA",
          pinsiswa: "31334",
          hportu: "081291971662",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjuna"
        },
        {
          nis: "1609",
          nisn: "3132011577",
          nama: "AZZEYAAN SHAFIA SETIO",
          pinsiswa: "66726",
          hportu: "085726279026",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Azzeyaan"
        },
        {
          nis: "1610",
          nisn: "3132211578",
          nama: "BAGAS PUTRA PRAMUDYA",
          pinsiswa: "69564",
          hportu: "085771665366",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bagas"
        },
        {
          nis: "1611",
          nisn: "3132411579",
          nama: "DHINO MULYA PRAKOSO",
          pinsiswa: "93493",
          hportu: "081280479120",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dhino"
        },
        {
          nis: "1612",
          nisn: "3132611580",
          nama: "ELYSIA VANIA REMU",
          pinsiswa: "20485",
          hportu: "085776559108",
          foto: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elysia"
        }
      ]
    });
  });

  app.get("/api/jbsakad/nilairapor/siswa/:nis/semester/:semester", (req, res) => {
    const { nis, semester } = req.params;
    res.json({
      status: "sukses",
      data: [
        { nama_mapel: "Pendidikan Agama dan Budi Pekerti", nilai_pengetahuan: 88, nilai_keterampilan: 90 },
        { nama_mapel: "Pendidikan Pancasila dan Kewarganegaraan", nilai_pengetahuan: 85, nilai_keterampilan: 86 },
        { nama_mapel: "Bahasa Indonesia", nilai_pengetahuan: 92, nilai_keterampilan: 88 },
        { nama_mapel: "Matematika", nilai_pengetahuan: 78, nilai_keterampilan: 80 },
        { nama_mapel: "Ilmu Pengetahuan Alam", nilai_pengetahuan: 82, nilai_keterampilan: 84 },
        { nama_mapel: "Ilmu Pengetahuan Sosial", nilai_pengetahuan: 86, nilai_keterampilan: 85 },
        { nama_mapel: "Seni Budaya dan Prakarya", nilai_pengetahuan: 90, nilai_keterampilan: 92 },
        { nama_mapel: "Pendidikan Jasmani Olahraga dan Kesehatan", nilai_pengetahuan: 88, nilai_keterampilan: 90 }
      ]
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
