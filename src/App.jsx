import { useEffect, useRef, useState } from "react";
import { Camera, UserPlus } from "lucide-react";
import { browserLocalPersistence, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { AbsenTab, DaftarTab } from "./attendance";
import { AppShell, PublicTabs } from "./components";
import { COLORS, OUTLETS } from "./constants";
import { DashboardLogin, DashboardTab } from "./dashboard";
import { compressImage, exportAbsensiExcel, fmtJam, fmtTanggal, fmtTanggalKey } from "./utils";

const PUBLIC_TABS = [
  { key: "absen", label: "Absen", icon: Camera },
  { key: "daftar", label: "Daftar Chef", icon: UserPlus },
];

const INITIAL_PARTNER_EMAIL = "billy@mp78.com";
const INITIAL_PARTNER_NAME = "Billy Yosafat";

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
  const [fTanggal, setFTanggal] = useState(() => fmtTanggalKey(new Date()));
  const [exportStartDate, setExportStartDate] = useState(() => fmtTanggalKey(new Date()));
  const [exportEndDate, setExportEndDate] = useState(() => fmtTanggalKey(new Date()));
  const [showExportRange, setShowExportRange] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [confirmDelId, setConfirmDelId] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [partnerUser, setPartnerUser] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => console.error("auth persistence error:", err));
    return onAuthStateChanged(auth, (user) => {
      setPartnerUser(user);
      setPartnerProfile(null);
      setPartnerReady(!user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!partnerUser) return;

    let cancelled = false;
    async function loadPartnerProfile() {
      setPartnerReady(false);
      try {
        const partnerRef = doc(db, "partners", partnerUser.uid);
        const partnerSnap = await getDoc(partnerRef);
        if (partnerSnap.exists()) {
          if (!cancelled) setPartnerProfile({ id: partnerSnap.id, ...partnerSnap.data() });
          return;
        }

        if (partnerUser.email?.toLowerCase() !== INITIAL_PARTNER_EMAIL) {
          await signOut(auth);
          if (!cancelled) setLoginError("Akun partner belum terdaftar.");
          return;
        }

        const initialPartner = {
          name: INITIAL_PARTNER_NAME,
          email: INITIAL_PARTNER_EMAIL,
          outlets: OUTLETS,
        };
        await setDoc(partnerRef, initialPartner);
        if (!cancelled) setPartnerProfile({ id: partnerUser.uid, ...initialPartner });
      } catch (err) {
        console.error("partner profile error:", err);
        await signOut(auth);
        if (!cancelled) setLoginError("Gagal membuka data partner.");
      } finally {
        if (!cancelled) setPartnerReady(true);
      }
    }

    loadPartnerProfile();
    return () => {
      cancelled = true;
    };
  }, [partnerUser]);

  useEffect(() => {
    if (isDashboardPage && !partnerProfile) return;

    setReady(false);
    const todayKey = fmtTanggalKey(new Date());
    const assignedOutlets = partnerProfile?.outlets || [];
    if (isDashboardPage && assignedOutlets.length === 0) {
      setChefs([]);
      setAbsensi([]);
      setReady(true);
      return;
    }
    const chefsQuery = isDashboardPage
      ? query(collection(db, "chefs"), where("outlet", "in", assignedOutlets), orderBy("tanggalDaftarSort", "desc"))
      : query(collection(db, "chefs"), orderBy("tanggalDaftarSort", "desc"));
    const absensiQuery = isDashboardPage
      ? query(collection(db, "absensi"), where("outlet", "in", assignedOutlets), where("tanggalKey", "==", fTanggal || todayKey), orderBy("waktuSort", "desc"))
      : query(collection(db, "absensi"), where("tanggalKey", "==", todayKey), orderBy("waktuSort", "desc"));

    const unsubChefs = onSnapshot(
      chefsQuery,
      (snap) => {
        setChefs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setReady(true);
      },
      (err) => {
        console.error("chefs listener error:", err);
        setToast("Gagal memuat data chef. Cek index/rules Firestore.");
        setReady(true);
      }
    );
    const unsubAbsensi = onSnapshot(
      absensiQuery,
      (snap) => setAbsensi(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error("absensi listener error:", err);
        setToast("Gagal memuat data absensi. Cek index/rules Firestore.");
        setReady(true);
      }
    );
    return () => {
      unsubChefs();
      unsubAbsensi();
    };
  }, [fTanggal, isDashboardPage, partnerProfile]);

  useEffect(() => {
    if (!isDashboardPage || !partnerProfile) return;
    const allowedOutlets = partnerProfile.outlets || [];
    if (allowedOutlets.length === 0) return;
    if (fOutlet !== "Semua" && !allowedOutlets.includes(fOutlet)) setFOutlet("Semua");
  }, [fOutlet, isDashboardPage, partnerProfile]);

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
    setExportStartDate(fTanggal || todayKey);
    setExportEndDate(fTanggal || todayKey);
    setShowExportRange(true);
  }

  async function downloadExcelForRange(e) {
    e.preventDefault();
    if (!exportStartDate || !exportEndDate) {
      setToast("Pilih tanggal awal dan akhir export");
      return;
    }
    if (exportStartDate > exportEndDate) {
      setToast("Tanggal awal tidak boleh lewat dari tanggal akhir");
      return;
    }

    setExportBusy(true);
    try {
      const exportOutlets = fOutlet === "Semua" ? dashboardOutlets : [fOutlet];
      const exportQuery = query(
        collection(db, "absensi"),
        where("outlet", "in", exportOutlets),
        where("tanggalKey", ">=", exportStartDate),
        where("tanggalKey", "<=", exportEndDate),
        orderBy("tanggalKey", "asc"),
        orderBy("waktuSort", "asc")
      );
      const exportSnap = await getDocs(exportQuery);
      const exportRows = exportSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (exportRows.length === 0) {
        setToast("Tidak ada data untuk diexport");
        return;
      }
      exportAbsensiExcel({ filtered: exportRows, chefs, startDate: exportStartDate, endDate: exportEndDate });
      setShowExportRange(false);
    } catch (err) {
      console.error("export query error:", err);
      setToast("Gagal export. Cek index/rules Firestore.");
    } finally {
      setExportBusy(false);
    }
  }

  async function handlePartnerLogin(e) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err) {
      console.error(err);
      setLoginError("Email atau password tidak valid.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function logoutDashboard() {
    try {
      await signOut(auth);
      setConfirmDelId("");
    } catch (err) {
      console.error(err);
      setToast("Gagal logout, coba lagi");
    }
  }

  const todayKey = fmtTanggalKey(new Date());
  const hadirHariIni = new Set(absensi.filter((r) => r.tanggalKey === todayKey).map((r) => r.chefId)).size;
  const absensiHariIni = absensi.filter((r) => r.tanggalKey === todayKey);
  const dashboardOutlets = partnerProfile?.outlets || OUTLETS;
  const filtered = absensi
    .filter((r) => (isDashboardPage ? dashboardOutlets.includes(r.outlet) : true))
    .filter((r) => (fOutlet === "Semua" ? true : r.outlet === fOutlet))
    .filter((r) => (fTanggal ? r.tanggalKey === fTanggal : true));
  const chefsByOutlet = OUTLETS.map((outlet) => ({
    outlet,
    count: chefs.filter((c) => c.outlet === outlet).length,
  }));

  return (
    <AppShell isDashboardPage={isDashboardPage} toast={toast} partnerUser={partnerUser} logoutDashboard={logoutDashboard}>
      {!isDashboardPage && <PublicTabs tab={tab} setTab={setTab} tabs={PUBLIC_TABS} />}
      {isDashboardPage && (!authReady || (partnerUser && !partnerReady)) ? (
        <p className="text-center text-sm" style={{ color: COLORS.muted }}>Menghubungkan ke database...</p>
      ) : isDashboardPage && !partnerUser ? (
        <DashboardLogin {...{ loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginBusy, loginError, handlePartnerLogin }} />
      ) : !ready ? (
        <p className="text-center text-sm" style={{ color: COLORS.muted }}>Menghubungkan ke database...</p>
      ) : isDashboardPage ? (
        <DashboardTab {...{ chefs, absensi, filtered, fOutlet, setFOutlet, fTanggal, setFTanggal, exportExcel, exportStartDate, setExportStartDate, exportEndDate, setExportEndDate, showExportRange, setShowExportRange, downloadExcelForRange, exportBusy, hadirHariIni, confirmDelId, setConfirmDelId, deleteRecord, logoutDashboard, partnerUser, partnerProfile, dashboardOutlets }} />
      ) : tab === "daftar" ? (
        <DaftarTab {...{ regNama, setRegNama, regHp, setRegHp, regOutlet, setRegOutlet, regAlamat, setRegAlamat, handleDaftar, chefs, chefsByOutlet }} />
      ) : (
        <AbsenTab {...{ chefs, absensiHariIni, absChefId, setAbsChefId, absTipe, setAbsTipe, absFoto, setAbsFoto, absBusy, handleFoto, handleAbsen, fileRef, successRecord, setSuccessRecord }} />
      )}
    </AppShell>
  );
}
