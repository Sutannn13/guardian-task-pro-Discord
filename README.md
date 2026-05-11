# GuardianTask Pro

Bot Discord untuk manajemen tugas dan moderasi server dengan fitur lengkap untuk mengelola peringatan, tugas, dan laporan pengguna.

## Fitur

### 🛡️ Moderasi
- Sistem peringatan dengan tingkat keparahan (ringan, sedang, berat)
- Hapus pesan massal dengan filter user
- Riwayat lengkap aktivitas pengguna

### 📋 Manajemen Tugas
- Buat dan tugaskan tugas ke pengguna
- Prioritas dan deadline tugas
- Filter berdasarkan status

### 📊 Dashboard
- Statistik server lengkap
- Monitoring pelanggaran dan tugas
- Top users berdasarkan poin

### 🚨 Sistem Laporan
- Laporkan pengguna bermasalah
- Tracking status laporan
- Notifikasi ke channel laporan

## Persyaratan

- Node.js v18 atau lebih tinggi
- Discord Bot Token
- Editor kode (VS Code direkomendasikan)

## Instalasi

1. **Clone atau download project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment:**
   ```bash
   cp .env.example .env
   ```

4. **Edit file `.env`:**
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here
   ```

5. **Deploy commands:**
   ```bash
   npm run deploy
   ```

6. **Start bot:**
   ```bash
   npm start
   ```

## Struktur Project

```
guardian-task-pro/
├── src/
│   ├── commands/          # Slash commands
│   │   ├── general/       # Ping, Dashboard, Help
│   │   ├── moderation/    # Warn, Clear, LogUser
│   │   ├── task/          # AddTask, ListTasks, CompleteTask
│   │   └── report/        # ReportUser
│   ├── events/            # Discord events
│   ├── database/          # SQLite database
│   │   └── repositories/  # Data access layer
│   ├── services/          # Business logic
│   ├── utils/             # Utilities
│   └── config/            # Configuration
├── data/                  # Database storage
└── README.md
```

## Commands

### Umum
| Command | Deskripsi |
|---------|-----------|
| `/ping` | Cek latency dan status bot |
| `/dashboard` | Tampilkan statistik server |
| `/help` | Daftar semua perintah |

### Moderasi
| Command | Deskripsi | Izin |
|---------|-----------|------|
| `/warn <user> <alasan> [tingkat]` | Berikan peringatan | ModerateMembers / ManageMessages |
| `/clear <jumlah> [user]` | Hapus pesan | ManageMessages |
| `/log-user <user>` | Lihat riwayat user | ModerateMembers |

### Tugas
| Command | Deskripsi |
|---------|-----------|
| `/tambah-tugas <judul> [deskripsi]` | Tambah tugas baru |
| `/list-tugas [status]` | Daftar semua tugas |
| `/selesai-tugas <task_id>` | Tandai tugas selesai |

### Lainnya
| Command | Deskripsi |
|---------|-----------|
| `/report-user <user> <alasan>` | Laporkan pengguna |

## Database Schema

### Users
- `user_id` - Discord User ID
- `username` - Username
- `guild_id` - Server ID
- `total_warnings` - Jumlah peringatan
- `total_points` - Total poin pelanggaran

### Warnings
- `case_id` - ID case (GT-YYYY-NNNN)
- `user_id` - Target user
- `moderator_id` - Moderator yang memberikan
- `severity` - Tingkat (ringan/sedang/berat)
- `points` - Poin pelanggaran
- `reason` - Alasan

### Tasks
- `task_id` - ID tugas (TS-YYYY-NNNN)
- `title` - Judul
- `status` - Status (pending/in_progress/completed)
- `priority` - Prioritas
- `deadline` - Batas waktu
- `assignee_id` - User yang ditugaskan

### Reports
- `report_id` - ID laporan (RP-YYYY-NNNN)
- `reporter_id` - Pelapor
- `reported_user_id` - Yang dilaporkan
- `status` - Status review

## License

MIT License - Bebas digunakan untuk project apapun.