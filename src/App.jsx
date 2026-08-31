import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ChefHat,
  UserPlus,
  Camera,
  LayoutDashboard,
  Download,
  Trash2,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  ImagePlus,
  LogIn,
  LogOut,
} from "lucide-react";

const OUTLETS = [
  "Jambu Dua",
  "Cisarua",
  "Ciawi",
  "Taman Yasmin",
  "Ciomas",
  "Marunda",
  "Bantar Kemang",
  "Cipanas",
  "Sentul",
  "Parahyangan",
];

const COLORS = {
  espresso: "#241A12",
  espressoLight: "#3A2A1B",
  amber: "#D98E2B",
  amberDark: "#B5711C",
  cheese: "#F2C94C",
  cream: "#FBF3E7",
  chili: "#B23A24",
  ink: "#241A12",
  muted: "#8A7A68",
  line: "#E7DCC8",
};

const DASHBOARD_PIN = import.meta.env.VITE_DASHBOARD_PIN || "1234";
const DASHBOARD_SESSION_KEY = "martabak-dashboard-access";

function compressImage(file, maxWidth = 480, quality = 0.62) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmtTanggal(d) {
  return d.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function fmtTanggalKey(d) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}
function fmtJam(d) {
  return d.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [tab, setTab] = useState("absen");
  const isDashboardPage = window.location.pathname === "/dashboard";
  const [chefs, setChefs] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [dashboardPin, setDashboardPin] = useState("");
  const [dashboardUnlocked, setDashboardUnlocked] = useState(
    () => sessionStorage.getItem(DASHBOARD_SESSION_KEY) === "true"
  );

  const [regNama, setRegNama] = useState("");
  const [regHp, setRegHp] = useState("");
  const [regOutlet, setRegOutlet] = useState(OUTLETS[0]);
  const [regAlamat, setRegAlamat] = useState("");

  const [absChefId, setAbsChefId] = useState("");
  const [absTipe, setAbsTipe] = useState("Masuk");
  const [absFoto, setAbsFoto] = useState("");
  const [absBusy, setAbsBusy] = useState(false);
  const fileRef = useRef(null);

  const [fOutlet, setFOutlet] = useState("Semua");
  const [fTanggal, setFTanggal] = useState("");
  const [confirmDelId, setConfirmDelId] = useState("");

  // Realtime sync dengan Firestore: semua outlet melihat data yang sama secara langsung.
  useEffect(() => {
    const unsubChefs = onSnapshot(
      query(collection(db, "chefs"), orderBy("tanggalDaftarSort", "desc")),
      (snap) => {
        setChefs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setReady(true);
      },
      (err) => console.error("chefs listener error:", err)
    );
    const unsubAbsensi = onSnapshot(
      query(collection(db, "absensi"), orderBy("waktuSort", "desc")),
      (snap) => {
        setAbsensi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("absensi listener error:", err)
    );
    return () => {
      unsubChefs();
      unsubAbsensi();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleDaftar(e) {
    e.preventDefault();
    if (!regNama.trim() || !regHp.trim()) {
      setToast("Nama dan No. HP wajib diisi");
      return;
    }
    try {
      await addDoc(collection(db, "chefs"), {
        nama: regNama.trim(),
        noHp: regHp.trim(),
        outlet: regOutlet,
        alamat: regAlamat.trim(),
        tanggalDaftar: fmtTanggal(new Date()),
        tanggalDaftarSort: Date.now(),
      });
      setRegNama("");
      setRegHp("");
      setRegAlamat("");
      setToast(`${regNama.trim()} terdaftar di outlet ${regOutlet}`);
    } catch (err) {
      console.error(err);
      setToast("Gagal menyimpan data, cek koneksi/konfigurasi Firebase");
    }
  }

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAbsBusy(true);
    try {
      const dataUrl = await compressImage(file);
      setAbsFoto(dataUrl);
    } catch (err) {
      setToast("Gagal memproses foto, coba lagi");
    }
    setAbsBusy(false);
  }

  async function handleAbsen(e) {
    e.preventDefault();
    if (!absChefId) {
      setToast("Pilih chef terlebih dahulu");
      return;
    }
    if (!absFoto) {
      setToast("Foto wajib diupload untuk absen");
      return;
    }
    const chef = chefs.find((c) => c.id === absChefId);
    if (!chef) return;
    const now = new Date();
    try {
      await addDoc(collection(db, "absensi"), {
        chefId: chef.id,
        namaChef: chef.nama,
        outlet: chef.outlet,
        tanggal: fmtTanggal(now),
        tanggalKey: fmtTanggalKey(now),
        jam: fmtJam(now),
        tipe: absTipe,
        foto: absFoto,
        waktuSort: now.getTime(),
      });
      setAbsFoto("");
      setAbsChefId("");
      if (fileRef.current) fileRef.current.value = "";
      setToast(`Absen ${absTipe} tercatat untuk ${chef.nama}`);
    } catch (err) {
      console.error(err);
      setToast("Gagal menyimpan absen, cek koneksi/konfigurasi Firebase");
    }
  }

  async function deleteRecord(id) {
    try {
      await deleteDoc(doc(db, "absensi", id));
    } catch (err) {
      console.error(err);
      setToast("Gagal menghapus data");
    }
    setConfirmDelId("");
  }

  const todayKey = fmtTanggalKey(new Date());
  const hadirHariIni = new Set(
    absensi.filter((r) => r.tanggalKey === todayKey).map((r) => r.chefId)
  ).size;

  const filtered = absensi
    .filter((r) => (fOutlet === "Semua" ? true : r.outlet === fOutlet))
    .filter((r) => (fTanggal ? r.tanggalKey === fTanggal : true));

  function exportExcel() {
    if (filtered.length === 0) {
      setToast("Tidak ada data untuk diexport");
      return;
    }
    const rowsAbsen = filtered.map((r, i) => ({
      No: i + 1,
      "Nama Chef": r.namaChef,
      Outlet: r.outlet,
      Tanggal: r.tanggal,
      Jam: r.jam,
      "Jenis Absen": r.tipe,
    }));
    const rowsChef = chefs.map((c, i) => ({
      No: i + 1,
      "Nama Chef": c.nama,
      "No HP": c.noHp,
      Outlet: c.outlet,
      Alamat: c.alamat,
      "Tanggal Daftar": c.tanggalDaftar,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsAbsen), "Absensi");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsChef), "Data Chef");
    XLSX.writeFile(wb, `Absensi_Martabak78_${todayKey}.xlsx`);
  }

  function unlockDashboard(e) {
    e.preventDefault();
    if (dashboardPin === DASHBOARD_PIN) {
      sessionStorage.setItem(DASHBOARD_SESSION_KEY, "true");
      setDashboardUnlocked(true);
      setDashboardPin("");
      return;
    }
    setToast("PIN dashboard salah");
  }

  function lockDashboard() {
    sessionStorage.removeItem(DASHBOARD_SESSION_KEY);
    setDashboardUnlocked(false);
  }

  const chefsByOutlet = OUTLETS.map((o) => ({
    outlet: o,
    count: chefs.filter((c) => c.outlet === o).length,
  }));

  return (
    <div
      style={{
        background: COLORS.cream,
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: COLORS.ink,
        paddingBottom: 40,
      }}
    >
      <style>{`
        .ticket { position: relative; background: white; border: 1px solid ${COLORS.line}; border-radius: 14px; }
        .ticket::before, .ticket::after {
          content: ''; position: absolute; width: 16px; height: 16px;
          background: ${COLORS.cream}; border-radius: 50%; top: 50%; margin-top: -8px;
        }
        .ticket::before { left: -9px; }
        .ticket::after { right: -9px; }
        .ticket-divider { border-top: 2px dashed ${COLORS.line}; }
        .display-font { font-family: 'Space Grotesk', sans-serif; }
        .mono-font { font-family: 'JetBrains Mono', monospace; }
        input:focus, select:focus { outline: 2px solid ${COLORS.amber}; outline-offset: 1px; }
      `}</style>

      <div style={{ background: COLORS.espresso }} className="px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div style={{ background: COLORS.amber }} className="rounded-xl p-2 flex items-center justify-center">
              <ChefHat size={22} color={COLORS.espresso} />
            </div>
            <div>
              <h1 className="display-font font-bold uppercase leading-none" style={{ color: COLORS.cream, fontSize: 18, letterSpacing: 0.5 }}>
                Martabak Pecenongan 78
              </h1>
              <p className="mono-font" style={{ color: COLORS.amber, fontSize: 11, marginTop: 3 }}>
                sistem absensi dapur · 10 outlet
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isDashboardPage && (
        <div className="max-w-md mx-auto px-4 -mt-3">
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: COLORS.espressoLight }}>
            {[
              { key: "absen", label: "Absen", icon: Camera },
              { key: "daftar", label: "Daftar Chef", icon: UserPlus },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: active ? COLORS.amber : "transparent", color: active ? COLORS.espresso : COLORS.cream }}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={`${isDashboardPage ? "max-w-3xl" : "max-w-md"} mx-auto px-4 mt-4`}>
        {!ready ? (
          <p className="text-center text-sm" style={{ color: COLORS.muted }}>Menghubungkan ke database...</p>
        ) : isDashboardPage && !dashboardUnlocked ? (
          <DashboardGate dashboardPin={dashboardPin} setDashboardPin={setDashboardPin} unlockDashboard={unlockDashboard} />
        ) : isDashboardPage ? (
          <DashboardTab {...{ chefs, absensi, filtered, fOutlet, setFOutlet, fTanggal, setFTanggal, exportExcel, hadirHariIni, confirmDelId, setConfirmDelId, deleteRecord, lockDashboard }} />
        ) : tab === "daftar" ? (
          <DaftarTab {...{ regNama, setRegNama, regHp, setRegHp, regOutlet, setRegOutlet, regAlamat, setRegAlamat, handleDaftar, chefs, chefsByOutlet }} />
        ) : (
          <AbsenTab {...{ chefs, absChefId, setAbsChefId, absTipe, setAbsTipe, absFoto, setAbsFoto, absBusy, handleFoto, handleAbsen, fileRef }} />
        )}
      </div>

      {toast && (
        <div className="fixed left-1/2 bottom-6 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg" style={{ background: COLORS.espresso, color: COLORS.cream, maxWidth: "90%" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function Section({ title, eyebrow }) {
  return (
    <div className="mb-4">
      {eyebrow && <p className="mono-font uppercase" style={{ color: COLORS.amberDark, fontSize: 11, letterSpacing: 1 }}>{eyebrow}</p>}
      {title && <h2 className="display-font font-bold" style={{ fontSize: 18, color: COLORS.ink }}>{title}</h2>}
    </div>
  );
}

function DashboardGate({ dashboardPin, setDashboardPin, unlockDashboard }) {
  return (
    <div className="rounded-3xl p-5 shadow-sm" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="rounded-2xl p-3" style={{ background: COLORS.espresso, color: COLORS.cheese }}>
          <LayoutDashboard size={22} />
        </div>
        <div>
          <p className="mono-font uppercase" style={{ color: COLORS.amberDark, fontSize: 11, letterSpacing: 1 }}>Akses terbatas</p>
          <h2 className="display-font font-bold" style={{ fontSize: 22, color: COLORS.ink }}>Dashboard Admin</h2>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
        Masukkan PIN sementara untuk melihat rekap absensi. Login permanen bisa ditambahkan nanti.
      </p>
      <form onSubmit={unlockDashboard} className="space-y-3">
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>PIN Dashboard</label>
          <input
            value={dashboardPin}
            onChange={(e) => setDashboardPin(e.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="Masukkan PIN"
            className="w-full mt-1 px-3 py-3 rounded-xl text-sm"
            style={{ border: `1px solid ${COLORS.line}` }}
          />
        </div>
        <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: COLORS.espresso, color: COLORS.cream }}>
          Masuk Dashboard
        </button>
        <a href="/" className="block text-center text-xs font-semibold" style={{ color: COLORS.amberDark }}>
          Kembali ke halaman absen
        </a>
      </form>
    </div>
  );
}

function DaftarTab({ regNama, setRegNama, regHp, setRegHp, regOutlet, setRegOutlet, regAlamat, setRegAlamat, handleDaftar, chefs, chefsByOutlet }) {
  return (
    <div>
      <Section eyebrow="Registrasi" title="Data Diri Chef" />
      <form onSubmit={handleDaftar} className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Nama Lengkap</label>
          <input value={regNama} onChange={(e) => setRegNama(e.target.value)} placeholder="cth. Budi Santoso" className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>No. HP / WhatsApp</label>
          <input value={regHp} onChange={(e) => setRegHp(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="numeric" className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Outlet</label>
          <select value={regOutlet} onChange={(e) => setRegOutlet(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm bg-white" style={{ border: `1px solid ${COLORS.line}` }}>
            {OUTLETS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Alamat (opsional)</label>
          <textarea value={regAlamat} onChange={(e) => setRegAlamat(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ background: COLORS.espresso, color: COLORS.cream }}>
          <UserPlus size={16} /> Daftarkan Chef
        </button>
      </form>

      <Section eyebrow={`${chefs.length} chef terdaftar`} title="Sebaran per Outlet" />
      <div className="grid grid-cols-2 gap-2">
        {chefsByOutlet.map((o) => (
          <div key={o.outlet} className="rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
            <span className="text-xs font-medium" style={{ color: COLORS.ink }}>{o.outlet}</span>
            <span className="mono-font text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: COLORS.cheese, color: COLORS.espresso }}>{o.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbsenTab({ chefs, absChefId, setAbsChefId, absTipe, setAbsTipe, absFoto, setAbsFoto, absBusy, handleFoto, handleAbsen, fileRef }) {
  const grouped = OUTLETS.map((o) => ({ outlet: o, list: chefs.filter((c) => c.outlet === o) })).filter((g) => g.list.length > 0);
  return (
    <div>
      <Section eyebrow="Kehadiran" title="Absen Chef" />
      <form onSubmit={handleAbsen} className="rounded-2xl p-4 space-y-3" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
        {chefs.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.muted }}>Belum ada chef terdaftar. Silakan daftar dulu di tab "Daftar Chef".</p>
        ) : (
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Pilih Chef</label>
            <select value={absChefId} onChange={(e) => setAbsChefId(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl text-sm bg-white" style={{ border: `1px solid ${COLORS.line}` }}>
              <option value="">— pilih nama —</option>
              {grouped.map((g) => (
                <optgroup key={g.outlet} label={g.outlet}>
                  {g.list.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Jenis Absen</label>
          <div className="flex gap-2 mt-1">
            {[{ v: "Masuk", icon: LogIn }, { v: "Pulang", icon: LogOut }].map((t) => {
              const Icon = t.icon;
              const active = absTipe === t.v;
              return (
                <button type="button" key={t.v} onClick={() => setAbsTipe(t.v)} className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1" style={{ background: active ? COLORS.amber : COLORS.cream, color: COLORS.espresso, border: `1px solid ${active ? COLORS.amber : COLORS.line}` }}>
                  <Icon size={14} /> {t.v}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Foto Bukti Kehadiran</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" id="foto-input" />
          {!absFoto ? (
            <label htmlFor="foto-input" className="mt-1 w-full flex flex-col items-center justify-center gap-1 py-6 rounded-xl text-sm cursor-pointer" style={{ border: `2px dashed ${COLORS.line}`, color: COLORS.muted }}>
              <ImagePlus size={20} />
              {absBusy ? "Memproses foto..." : "Ambil / Upload Foto"}
            </label>
          ) : (
            <div className="mt-1 relative w-28 h-28">
              <img src={absFoto} alt="preview" className="w-28 h-28 object-cover rounded-xl" style={{ border: `1px solid ${COLORS.line}` }} />
              <button type="button" onClick={() => setAbsFoto("")} className="absolute -top-2 -right-2 rounded-full p-1" style={{ background: COLORS.chili, color: "white" }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <button type="submit" disabled={chefs.length === 0} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ background: COLORS.espresso, color: COLORS.cream, opacity: chefs.length === 0 ? 0.5 : 1 }}>
          <CheckCircle2 size={16} /> Catat Absen {absTipe}
        </button>
      </form>
    </div>
  );
}

function DashboardTab({ chefs, absensi, filtered, fOutlet, setFOutlet, fTanggal, setFTanggal, exportExcel, hadirHariIni, confirmDelId, setConfirmDelId, deleteRecord, lockDashboard }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <Section eyebrow="Ringkasan" title="Dashboard Absensi" />
        <div className="flex gap-2">
          <a href="/" className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ border: `1px solid ${COLORS.line}`, color: COLORS.muted, background: "white" }}>Halaman Absen</a>
          <button onClick={lockDashboard} className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap" style={{ background: COLORS.espresso, color: COLORS.cream }}>Kunci</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[{ label: "Chef Terdaftar", val: chefs.length }, { label: "Hadir Hari Ini", val: hadirHariIni }, { label: "Total Catatan", val: absensi.length }].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: COLORS.espresso }}>
            <p className="mono-font font-bold" style={{ color: COLORS.cheese, fontSize: 20 }}>{s.val}</p>
            <p style={{ color: COLORS.cream, fontSize: 10 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {["Semua", ...OUTLETS].map((o) => (
          <button key={o} onClick={() => setFOutlet(o)} className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: fOutlet === o ? COLORS.amber : "white", color: COLORS.espresso, border: `1px solid ${fOutlet === o ? COLORS.amber : COLORS.line}` }}>
            {o}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input type="date" value={fTanggal} onChange={(e) => setFTanggal(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}`, background: "white" }} />
        {fTanggal && <button onClick={() => setFTanggal("")} className="px-3 rounded-xl text-xs font-semibold" style={{ border: `1px solid ${COLORS.line}`, color: COLORS.muted }}>Reset</button>}
      </div>
      <button onClick={exportExcel} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4" style={{ background: COLORS.chili, color: "white" }}>
        <Download size={16} /> Download Excel ({filtered.length} data)
      </button>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: COLORS.muted }}>Belum ada catatan absensi untuk filter ini.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="ticket px-4 py-3 mx-1">
              <div className="flex gap-3">
                <img src={r.foto} alt={r.namaChef} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" style={{ border: `1px solid ${COLORS.line}` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate" style={{ color: COLORS.ink }}>{r.namaChef}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: r.tipe === "Masuk" ? COLORS.amber : COLORS.espressoLight, color: r.tipe === "Masuk" ? COLORS.espresso : COLORS.cream }}>{r.tipe}</span>
                  </div>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: COLORS.muted }}><MapPin size={11} /> {r.outlet}</p>
                  <div className="ticket-divider my-2" />
                  <div className="flex items-center justify-between">
                    <p className="mono-font text-xs flex items-center gap-1" style={{ color: COLORS.ink }}><Clock size={11} /> {r.tanggal} · {r.jam}</p>
                    {confirmDelId === r.id ? (
                      <span className="flex gap-1">
                        <button onClick={() => deleteRecord(r.id)} className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: COLORS.chili, color: "white" }}>Hapus</button>
                        <button onClick={() => setConfirmDelId("")} className="text-[10px] font-bold px-2 py-1 rounded" style={{ border: `1px solid ${COLORS.line}` }}>Batal</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelId(r.id)}><Trash2 size={14} color={COLORS.muted} /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
