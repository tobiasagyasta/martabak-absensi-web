import { useEffect, useRef, useState } from "react";
import { Camera, UserPlus } from "lucide-react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import { AbsenTab, DaftarTab } from "./attendance";
import { AppShell, PublicTabs } from "./components";
import { COLORS, DASHBOARD_PIN, DASHBOARD_SESSION_KEY, OUTLETS } from "./constants";
import { DashboardGate, DashboardTab } from "./dashboard";
import { compressImage, exportAbsensiExcel, fmtJam, fmtTanggal, fmtTanggalKey } from "./utils";

const PUBLIC_TABS = [
  { key: "absen", label: "Absen", icon: Camera },
  { key: "daftar", label: "Daftar Chef", icon: UserPlus },
];

export default function App() {
  const isDashboardPage = window.location.pathname === "/dashboard";
  const [tab, setTab] = useState("absen");
  const [chefs, setChefs] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");

  const [regNama, setRegNama] = useState("");
  const [regHp, setRegHp] = useState("");
  const [regOutlet, setRegOutlet] = useState(OUTLETS[0]);
  const [regAlamat, setRegAlamat] = useState("");

  const [absChefId, setAbsChefId] = useState("");
  const [absTipe, setAbsTipe] = useState("Masuk");
  const [absFoto, setAbsFoto] = useState("");
  const [absBusy, setAbsBusy] = useState(false);
  const [successRecord, setSuccessRecord] = useState(null);
  const fileRef = useRef(null);

  const [fOutlet, setFOutlet] = useState("Semua");
  const [fTanggal, setFTanggal] = useState("");
  const [confirmDelId, setConfirmDelId] = useState("");
  const [dashboardPin, setDashboardPin] = useState("");
  const [dashboardUnlocked, setDashboardUnlocked] = useState(
    () => sessionStorage.getItem(DASHBOARD_SESSION_KEY) === "true"
  );

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
      (snap) => setAbsensi(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
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
    const nama = regNama.trim();
    const noHp = regHp.trim();
    if (!nama || !noHp) {
      setToast("Nama dan No. HP wajib diisi");
      return;
    }

    try {
      await addDoc(collection(db, "chefs"), {
        nama,
        noHp,
        outlet: regOutlet,
        alamat: regAlamat.trim(),
        tanggalDaftar: fmtTanggal(new Date()),
        tanggalDaftarSort: Date.now(),
      });
      setRegNama("");
      setRegHp("");
      setRegAlamat("");
      setToast(`${nama} terdaftar di outlet ${regOutlet}`);
    } catch (err) {
      console.error(err);
      setToast("Gagal menyimpan data, cek koneksi/konfigurasi Firebase");
    }
  }

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const chef = chefs.find((c) => c.id === absChefId);
    setAbsBusy(true);
    try {
      const dataUrl = await compressImage(file, {
        stamp: {
          type: absTipe,
          outlet: chef?.outlet,
        },
      });
      setAbsFoto(dataUrl);
    } catch (err) {
      console.error(err);
      setToast("Gagal memproses foto, coba lagi");
    } finally {
      setAbsBusy(false);
    }
  }

  async function handleAbsen(e) {
    e.preventDefault();
    if (!absChefId) {
      setToast("Pilih chef terlebih dahulu");
      return;
    }
    if (absTipe === "Masuk" && !absFoto) {
      setToast("Foto wajib diupload untuk absen masuk");
      return;
    }

    const chef = chefs.find((c) => c.id === absChefId);
    if (!chef) return;
    const alreadySubmittedType = absensiHariIni.some((r) => r.chefId === chef.id && r.tipe === absTipe);
    if (alreadySubmittedType) {
      setToast(`Absen ${absTipe} hari ini sudah tercatat`);
      return;
    }

    const now = new Date();
    try {
      const attendanceRecord = {
        chefId: chef.id,
        namaChef: chef.nama,
        outlet: chef.outlet,
        tanggal: fmtTanggal(now),
        tanggalKey: fmtTanggalKey(now),
        jam: fmtJam(now),
        tipe: absTipe,
        foto: absTipe === "Masuk" ? absFoto : "",
        waktuSort: now.getTime(),
      };
      await addDoc(collection(db, "absensi"), attendanceRecord);
      setAbsFoto("");
      setAbsChefId("");
      if (fileRef.current) fileRef.current.value = "";
      setSuccessRecord(attendanceRecord);
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

  function exportExcel() {
    if (filtered.length === 0) {
      setToast("Tidak ada data untuk diexport");
      return;
    }
    exportAbsensiExcel({ filtered, chefs, todayKey });
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

  const todayKey = fmtTanggalKey(new Date());
  const hadirHariIni = new Set(absensi.filter((r) => r.tanggalKey === todayKey).map((r) => r.chefId)).size;
  const absensiHariIni = absensi.filter((r) => r.tanggalKey === todayKey);
  const filtered = absensi
    .filter((r) => (fOutlet === "Semua" ? true : r.outlet === fOutlet))
    .filter((r) => (fTanggal ? r.tanggalKey === fTanggal : true));
  const chefsByOutlet = OUTLETS.map((outlet) => ({
    outlet,
    count: chefs.filter((c) => c.outlet === outlet).length,
  }));

  return (
    <AppShell isDashboardPage={isDashboardPage} toast={toast}>
      {!isDashboardPage && <PublicTabs tab={tab} setTab={setTab} tabs={PUBLIC_TABS} />}
      {!ready ? (
        <p className="text-center text-sm" style={{ color: COLORS.muted }}>Menghubungkan ke database...</p>
      ) : isDashboardPage && !dashboardUnlocked ? (
        <DashboardGate dashboardPin={dashboardPin} setDashboardPin={setDashboardPin} unlockDashboard={unlockDashboard} />
      ) : isDashboardPage ? (
        <DashboardTab {...{ chefs, absensi, filtered, fOutlet, setFOutlet, fTanggal, setFTanggal, exportExcel, hadirHariIni, confirmDelId, setConfirmDelId, deleteRecord, lockDashboard }} />
      ) : tab === "daftar" ? (
        <DaftarTab {...{ regNama, setRegNama, regHp, setRegHp, regOutlet, setRegOutlet, regAlamat, setRegAlamat, handleDaftar, chefs, chefsByOutlet }} />
      ) : (
        <AbsenTab {...{ chefs, absensiHariIni, absChefId, setAbsChefId, absTipe, setAbsTipe, absFoto, setAbsFoto, absBusy, handleFoto, handleAbsen, fileRef, successRecord, setSuccessRecord }} />
      )}
    </AppShell>
  );
}
