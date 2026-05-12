# GuardianTask Pro v2

Bot Discord untuk moderasi server dan manajemen tugas dengan **Smart Penalty & Auto Moderation System**.

## Fitur Baru v2

### 🛡️ Smart Penalty System
- Setiap user memiliki penalty point mulai dari 0
- Warning secara otomatis menambah penalty point
- Sistem SP1/SP2 dengan threshold berbeda
- Auto decay point setiap 3 jam jika tidak ada pelanggaran
- Auto kick atau rekomendasi kick saat threshold final tercapai

### 🤖 Auto Moderation
- Deteksi kata kasar secara otomatis (configurable per guild)
- Penalty point otomatis saat terdeteksi
- Hapus pesan secara otomatis (configurable)
- Log ke mod channel

### ⭐ Good Report System
- User bisa melaporkan perilaku baik orang lain
- Laporan harus disetujui moderator
- Approved report mengurangi penalty point target

## Persyaratan

- Node.js v18 atau lebih tinggi
- Discord Bot Token dengan **Message Content Intent** aktif
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
   MOD_LOG_CHANNEL_ID=channel_id_for_logs
   ```

5. **Enable Message Content Intent:**
   - Buka [Discord Developer Portal](https://discord.com/developers/applications)
   - Pilih aplikasi bot Anda
   - Buka tab "Bot"
   - Scroll ke bagian "Privileged Gateway Intents"
   - Aktifkan **Message Content Intent**

6. **Deploy commands:**
   ```bash
   npm run deploy
   ```

7. **Start bot:**
   ```bash
   npm start
   ```

## Konfigurasi Auto Moderation

Di file `.env`:

```env
# Enable auto moderation
AUTO_MOD_ENABLED=true

# Auto kick user at SP2 (false = recommend only)
AUTO_KICK_ENABLED=false

# Penalty thresholds
PENALTY_NORMAL_THRESHOLD=30
PENALTY_SP_THRESHOLD=20

# Decay settings
PENALTY_DECAY_HOURS=3
PENALTY_DECAY_POINTS=2

# Good report
GOOD_REPORT_REDUCTION_POINTS=3
BAD_WORD_DEFAULT_POINTS=3

# Auto delete bad word messages
AUTO_DELETE_BAD_WORD_MESSAGE=true
```

## Cara Kerja Penalty System

### Flow Penalty

```
0 points ──────────────────────────────────────────────────►
     │
     │ User melanggar
     ▼
+points ──────────────────────────────────────────────────►
     │
     │ Threshold tercapai?
     ▼
     ├─ NO ──► 0 points (reset) + SP1 issued
     │
     └─ YES ──┐
              │
              │ SP1 aktif, threshold 20
              ▼
         0 points (reset) + SP2 issued
              │
              │ Threshold tercapai lagi?
              ▼
         ├─ AUTO_KICK_ENABLED=true ──► KICK!
         │
         └─ AUTO_KICK_ENABLED=false ──► Kick Recommendation
```

### Mapping Warn ke Penalty

| Warn Level | Penalty Points |
|------------|---------------|
| Ringan     | +1            |
| Sedang     | +3            |
| Berat      | +5            |

## Command Baru

### Penalty Commands
| Command | Deskripsi | Izin |
|---------|-----------|------|
| `/penalty <user>` | Lihat penalty status user | Semua |
| `/penalty-add <user> <points> <reason>` | Tambah penalty manual | Mod+ |
| `/penalty-reduce <user> <points> <reason>` | Kurangi penalty | Mod+ |
| `/penalty-reset <user> [reset_sp] [reason]` | Reset penalty | Admin |
| `/sp-status <user>` | Lihat status SP user | Semua |

### Auto Moderation Commands
| Command | Deskripsi | Izin |
|---------|-----------|------|
| `/badword-add <word> [severity] [points]` | Tambah kata kasar | Mod+ |
| `/badword-remove <word>` | Hapus kata kasar | Mod+ |
| `/badword-list [severity]` | Lihat daftar kata kasar | Mod+ |

### Good Report Commands
| Command | Deskripsi | Izin |
|---------|-----------|------|
| `/lapor-baik <user> <reason>` | Laporkan perilaku baik | Semua |
| `/good-report-list` | Lihat laporan baik pending | Mod+ |
| `/good-report-resolve <report_id> <status>` | Setujui/tolak laporan | Mod+ |

## Command Lama (Still Works)

### Umum
| Command | Deskripsi |
|---------|-----------|
| `/ping` | Cek latency dan status bot |
| `/dashboard` | Tampilkan statistik server |
| `/help` | Daftar semua perintah |

### Moderasi
| Command | Deskripsi | Izin |
|---------|-----------|------|
| `/warn <user> <reason> [level]` | Berikan peringatan | Mod+ |
| `/clear <count> [user]` | Hapus pesan | ManageMessages |
| `/log-user <user>` | Lihat riwayat user | Mod+ |

### Tugas
| Command | Deskripsi |
|---------|-----------|
| `/tambah-tugas <title> [desc]` | Tambah tugas baru |
| `/list-tugas [status]` | Daftar semua tugas |
| `/selesai-tugas <task_id>` | Tandai tugas selesai |

### Laporan
| Command | Deskripsi |
|---------|-----------|
| `/report-user <user> <reason>` | Laporkan pengguna |

## Database Schema

### Tabel Baru

**penalty_logs**
- `penalty_id` - ID unik (PN-YYYY-NNNN)
- `user_id` - Target user
- `action_type` - Jenis aksi (BAD_WORD, SP1, SP2, DECAY, etc)
- `points_change` - Perubahan points
- `points_before/after` - State sebelum/sesudah
- `sp_level_before/after` - SP level sebelum/sesudah

**bad_words**
- `guild_id` - Server ID
- `word` - Kata kasar (case-insensitive)
- `severity` - low/medium/high
- `points` - Penalty points

**good_reports**
- `report_id` - ID unik (GR-YYYY-NNNN)
- `reporter_id` - Pelapor
- `target_user_id` - Target
- `status` - pending/approved/rejected
- `points_reduction` - Poin yang dikurangi jika approved

### Kolom Baru di Tabel users
- `penalty_points` - Poin pelanggaran saat ini
- `sp_level` - Level SP (0 = normal, 1 = SP1, 2 = SP2)
- `last_violation_at` - Waktu pelanggaran terakhir
- `last_decay_at` - Waktu decay terakhir
- `auto_mod_enabled` - Toggle auto mod per user

## Testing

1. **Deploy commands:**
   ```bash
   npm run deploy
   ```

2. **Start bot:**
   ```bash
   npm start
   ```

3. **Test auto mod:**
   ```
   /badword-add kata:badword1 severity:medium points:3
   # Kirim pesan dengan "badword1" - bot akan mendeteksi
   /penalty @user  # Cek penalty user
   ```

4. **Test SP flow:**
   ```
   # Tambahkan penalty sampai 30
   /penalty-add @user 30 "Test"
   # User akan mendapat SP1
   # Cek dengan /sp-status @user
   ```

## Struktur Project

```
guardian-task-pro/
├── src/
│   ├── commands/
│   │   ├── general/       # Ping, Dashboard, Help
│   │   ├── moderation/    # Warn, Clear, LogUser
│   │   ├── task/          # AddTask, ListTasks, CompleteTask
│   │   ├── report/        # ReportUser
│   │   ├── penalty/       # penalty, penaltyAdd, penaltyReduce, penaltyReset, spStatus
│   │   ├── automod/       # badwordAdd, badwordRemove, badwordList
│   │   └── goodReport/    # goodReportCreate, goodReportList, goodReportResolve
│   ├── events/            # Discord events (ready, interactionCreate, messageCreate)
│   ├── database/
│   │   ├── db.js
│   │   ├── schema.js      # Database schema dengan migration
│   │   └── repositories/  # Data access layer
│   ├── services/          # Business logic (penaltyService, decayScheduler, etc)
│   ├── utils/             # Utilities
│   └── config/            # Configuration
├── data/                  # Database storage
└── README.md
```

## License

MIT License - Bebas digunakan untuk project apapun.
