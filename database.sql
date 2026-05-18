-- Skema Database E-Ijazah Pro
-- Dialek: MySQL / PostgreSQL

-- 1. Tabel Sekolah
CREATE TABLE sekolah (
    id CHAR(36) PRIMARY KEY, -- UUID
    nama_sekolah VARCHAR(255) NOT NULL,
    npsn VARCHAR(20) UNIQUE NOT NULL,
    alamat TEXT,
    desa_kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kabupaten_kota VARCHAR(100),
    provinsi VARCHAR(100),
    kode_pos VARCHAR(10),
    nama_kepala_sekolah VARCHAR(255),
    nip_kepala_sekolah VARCHAR(50),
    logo_path VARCHAR(255),
    ttd_kepala_sekolah_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabel Pegawai (User/Guru)
CREATE TABLE pegawai (
    id CHAR(36) PRIMARY KEY,
    nip VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    level INT DEFAULT 2, -- 1: Admin, 2: Guru/Wali Kelas
    is_finance BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabel Siswa
CREATE TABLE siswa (
    id CHAR(36) PRIMARY KEY,
    nisn VARCHAR(20) UNIQUE NOT NULL,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    pinsiswa VARCHAR(10),
    hportu VARCHAR(20),
    foto TEXT, -- Base64 or URL
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    jenis_kelamin ENUM('L', 'P'),
    agama VARCHAR(50),
    nama_ayah VARCHAR(255),
    nama_ibu VARCHAR(255),
    alamat_siswa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabel Tahun Ajaran
CREATE TABLE tahun_ajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tahun VARCHAR(10) NOT NULL, -- Contoh: 2023/2024
    semester ENUM('Ganjil', 'Genap') NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Kelas
CREATE TABLE kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kelas VARCHAR(50) NOT NULL, -- Contoh: IX-A, XII-IPA-1
    tingkat INT NOT NULL, -- Contoh: 9, 12
    wali_kelas_id CHAR(36),
    tahun_ajaran_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wali_kelas_id) REFERENCES pegawai(id),
    FOREIGN KEY (tahun_ajaran_id) REFERENCES tahun_ajaran(id)
);

-- 6. Tabel Mata Pelajaran
CREATE TABLE mata_pelajaran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_mapel VARCHAR(20) UNIQUE,
    nama_mapel VARCHAR(100) NOT NULL,
    kelompok ENUM('A', 'B', 'C') DEFAULT 'A',
    kkm INT DEFAULT 75,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Nilai Rapor
CREATE TABLE nilai_rapor (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id CHAR(36),
    mapel_id INT,
    semester INT, -- 1 s/d 6
    nilai_pengetahuan DECIMAL(5,2),
    nilai_keterampilan DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id),
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id)
);

-- 8. Tabel Prestasi
CREATE TABLE prestasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id CHAR(36),
    jenis_prestasi ENUM('Akademik', 'Non-Akademik'),
    nama_prestasi VARCHAR(255),
    tingkat VARCHAR(100), -- Sekolah, Kabupaten, Provinsi, Nasional
    tahun VARCHAR(4),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id)
);

-- 9. Tabel Kelulusan
CREATE TABLE kelulusan (
    id CHAR(36) PRIMARY KEY,
    siswa_id CHAR(36) UNIQUE,
    status_kelulusan ENUM('Lulus', 'Tidak Lulus', 'Belum Diproses') DEFAULT 'Belum Diproses',
    no_seri_ijazah VARCHAR(100),
    tanggal_yudisium DATE,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id)
);

-- 10. Tabel Rekap NAS (Nilai Akhir Sekolah)
CREATE TABLE rekap_nas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    siswa_id CHAR(36),
    mapel_id INT,
    rata_rata_rapor DECIMAL(5,2),
    nilai_ujian_sekolah DECIMAL(5,2),
    nilai_akhir DECIMAL(5,2), -- (Rata Rapor * weight) + (Ujian * weight)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id),
    FOREIGN KEY (mapel_id) REFERENCES mata_pelajaran(id)
);

-- 11. Tabel Dokumen (Log Penerbitan)
CREATE TABLE dokumen_kelulusan (
    id CHAR(36) PRIMARY KEY,
    siswa_id CHAR(36),
    jenis_dokumen ENUM('E-Ijazah', 'SKL', 'Transkrip'),
    file_path TEXT,
    qr_code_hash VARCHAR(255), -- Hash untuk verifikasi validitas
    is_generated BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES siswa(id)
);

-- 12. Tabel Konfigurasi
CREATE TABLE konfigurasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    key_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contoh Hubungan (ERD Mapping):
-- Siswa (1) --- (N) Nilai Rapor
-- Siswa (1) --- (1) Kelulusan
-- Siswa (1) --- (N) Prestasi
-- Siswa (1) --- (N) Dokumen Kelulusan
-- Tahun Ajaran (1) --- (N) Kelas
-- Mata Pelajaran (1) --- (N) Nilai Rapor
-- Mata Pelajaran (1) --- (N) Rekap NAS
