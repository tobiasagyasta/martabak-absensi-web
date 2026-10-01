import { useEffect, useState } from "react";
import {
  Clock,
  Download,
  LayoutDashboard,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import { COLORS, OUTLETS } from "./constants";
import { Section } from "./components";

export function DashboardLogin({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginBusy,
  loginError,
  handlePartnerLogin,
}) {
  return (
    <div
      className="rounded-3xl p-5 sm:p-7 shadow-sm max-w-md mx-auto"
      style={{ background: "white", border: `1px solid ${COLORS.line}` }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="rounded-2xl p-3"
          style={{ background: COLORS.espresso, color: COLORS.cheese }}
        >
          <LayoutDashboard size={22} />
        </div>
        <div>
          <p
            className="mono-font uppercase"
            style={{ color: COLORS.amberDark, fontSize: 11, letterSpacing: 1 }}
          >
            Akses terbatas
          </p>
          <h2
            className="display-font font-bold"
            style={{ fontSize: 22, color: COLORS.ink }}
          >
            Login Partner
          </h2>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: COLORS.muted }}>
        Masuk dengan akun partner untuk melihat rekap absensi.
      </p>
      <form onSubmit={handlePartnerLogin} className="space-y-3">
        <div>
          <label
            className="text-xs font-semibold"
            style={{ color: COLORS.muted }}
          >
            Email
          </label>
          <input
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="partner@email.com"
            className="w-full mt-1 px-3 py-3 rounded-xl text-sm"
            style={{ border: `1px solid ${COLORS.line}` }}
            disabled={loginBusy}
            required
          />
        </div>
        <div>
          <label
            className="text-xs font-semibold"
            style={{ color: COLORS.muted }}
          >
            Password
          </label>
          <input
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Masukkan password"
            className="w-full mt-1 px-3 py-3 rounded-xl text-sm"
            style={{ border: `1px solid ${COLORS.line}` }}
            disabled={loginBusy}
            required
          />
        </div>
        {loginError && (
          <p
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: "#FCEBE7", color: COLORS.chili }}
          >
            {loginError}
          </p>
        )}
        <button
          type="submit"
          disabled={loginBusy}
          className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-70"
          style={{ background: COLORS.espresso, color: COLORS.cream }}
        >
          {loginBusy ? "Memproses..." : "Masuk Dashboard"}
        </button>
        <a
          href="/"
          className="block text-center text-xs font-semibold"
          style={{ color: COLORS.amberDark }}
        >
          Kembali ke halaman absen
        </a>
      </form>
    </div>
  );
}

export function DashboardTab({
  chefs,
  absensi,
  filtered,
  fOutlet,
  setFOutlet,
  fTanggal,
  setFTanggal,
  exportExcel,
  exportStartDate,
  setExportStartDate,
  exportEndDate,
  setExportEndDate,
  showExportRange,
  setShowExportRange,
  downloadExcelForRange,
  exportBusy,
  hadirHariIni,
  confirmDelId,
  setConfirmDelId,
  deleteRecord,
  partnerUser,
  partnerProfile,
  dashboardOutlets,
}) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <Section eyebrow="Ringkasan" title="Dashboard Absensi" />
      </div>
      {(partnerProfile?.name || partnerUser?.email) && (
        <p className="text-xs mb-4" style={{ color: COLORS.muted }}>
          Login sebagai {partnerProfile?.name || partnerUser.email}
          {partnerProfile?.email ? ` (${partnerProfile.email})` : ""}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Chef Terdaftar", val: chefs.length },
          { label: "Hadir Hari Ini", val: hadirHariIni },
          { label: "Total Catatan", val: absensi.length },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: COLORS.espresso }}
          >
            <p
              className="mono-font font-bold"
              style={{ color: COLORS.cheese, fontSize: 20 }}
            >
              {s.val}
            </p>
            <p style={{ color: COLORS.cream, fontSize: 10 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div
        className="rounded-2xl p-3 mb-4"
        style={{ background: "white", border: `1px solid ${COLORS.line}` }}
      >
        {dashboardOutlets.length === 0 && (
          <p className="text-xs mb-2" style={{ color: COLORS.chili }}>
            Partner ini belum memiliki outlet yang ditugaskan.
          </p>
        )}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {["Semua", ...dashboardOutlets].map((o) => (
            <button
              key={o}
              onClick={() => setFOutlet(o)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{
                background: fOutlet === o ? COLORS.amber : "white",
                color: COLORS.espresso,
                border: `1px solid ${fOutlet === o ? COLORS.amber : COLORS.line}`,
              }}
            >
              {o}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={fTanggal}
            onChange={(e) => setFTanggal(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm"
            style={{ border: `1px solid ${COLORS.line}`, background: "white" }}
          />
          {fTanggal !== "" && (
            <button
              onClick={() => setFTanggal("")}
              className="px-3 rounded-xl text-xs font-semibold"
              style={{
                border: `1px solid ${COLORS.line}`,
                color: COLORS.muted,
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      <button
        onClick={exportExcel}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-4"
        style={{ background: COLORS.chili, color: "white" }}
      >
        <Download size={16} /> Download Excel
      </button>
      {showExportRange && (
        <form
          onSubmit={downloadExcelForRange}
          className="rounded-2xl p-3 mb-4 space-y-3"
          style={{ background: "white", border: `1px solid ${COLORS.line}` }}
        >
          <p className="text-xs font-semibold" style={{ color: COLORS.muted }}>
            Pilih rentang tanggal untuk file Excel. Tanggal awal dan akhir ikut dihitung.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>
              Dari tanggal
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                style={{ border: `1px solid ${COLORS.line}`, background: "white" }}
                required
              />
            </label>
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>
              Sampai tanggal
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl text-sm"
                style={{ border: `1px solid ${COLORS.line}`, background: "white" }}
                required
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={exportBusy}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: COLORS.espresso, color: COLORS.cream }}
            >
              {exportBusy && <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
              {exportBusy ? "Menyiapkan Excel..." : "Download Rentang Ini"}
            </button>
            <button
              type="button"
              onClick={() => setShowExportRange(false)}
              disabled={exportBusy}
              className="px-3 rounded-xl text-xs font-semibold"
              style={{ border: `1px solid ${COLORS.line}`, color: COLORS.muted }}
            >
              Batal
            </button>
          </div>
        </form>
      )}
      <AttendanceList
        filtered={filtered}
        confirmDelId={confirmDelId}
        setConfirmDelId={setConfirmDelId}
        deleteRecord={deleteRecord}
      />
    </div>
  );
}

function AttendanceList({
  filtered,
  confirmDelId,
  setConfirmDelId,
  deleteRecord,
}) {
  const [previewRecord, setPreviewRecord] = useState(null);

  useEffect(() => {
    if (!previewRecord) return;
    function closeOnEscape(e) {
      if (e.key === "Escape") setPreviewRecord(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewRecord]);

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-center py-6" style={{ color: COLORS.muted }}>
        Belum ada catatan absensi untuk filter ini.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filtered.map((r) => (
          <div key={r.id} className="ticket px-4 py-3 mx-1">
            <div className="flex gap-3">
              {r.foto ? (
                <button
                  type="button"
                  onClick={() => setPreviewRecord(r)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 group"
                  aria-label={`Perbesar foto absen ${r.namaChef}`}
                >
                  <img
                    src={r.foto}
                    alt={r.namaChef}
                    className="w-14 h-14 object-cover"
                    style={{ border: `1px solid ${COLORS.line}` }}
                  />
                  <span
                    className="absolute inset-x-0 bottom-0 py-0.5 text-[9px] font-bold"
                    style={{
                      background: "rgba(36, 26, 18, 0.82)",
                      color: COLORS.cream,
                    }}
                  >
                    Lihat
                  </span>
                </button>
              ) : (
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center text-[10px] text-center flex-shrink-0"
                  style={{
                    border: `1px solid ${COLORS.line}`,
                    color: COLORS.muted,
                    background: COLORS.cream,
                  }}
                >
                  Tanpa foto
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: COLORS.ink }}
                  >
                    {r.namaChef}
                  </p>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background:
                        r.tipe === "Masuk"
                          ? COLORS.amber
                          : COLORS.espressoLight,
                      color:
                        r.tipe === "Masuk" ? COLORS.espresso : COLORS.cream,
                    }}
                  >
                    {r.tipe}
                  </span>
                </div>
                <p
                  className="text-xs flex items-center gap-1 mt-0.5"
                  style={{ color: COLORS.muted }}
                >
                  <MapPin size={11} /> {r.outlet}
                </p>
                <div className="ticket-divider my-2" />
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="mono-font text-xs flex items-center gap-1"
                    style={{ color: COLORS.ink }}
                  >
                    <Clock size={11} /> {r.tanggal} · {r.jam}
                  </p>
                  {confirmDelId === r.id ? (
                    <span className="flex gap-1">
                      <button
                        onClick={() => deleteRecord(r.id)}
                        className="text-[10px] font-bold px-2 py-1 rounded"
                        style={{ background: COLORS.chili, color: "white" }}
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => setConfirmDelId("")}
                        className="text-[10px] font-bold px-2 py-1 rounded"
                        style={{ border: `1px solid ${COLORS.line}` }}
                      >
                        Batal
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDelId(r.id)}
                      aria-label={`Hapus absen ${r.namaChef}`}
                    >
                      <Trash2 size={14} color={COLORS.muted} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {previewRecord && (
        <ImagePreview
          record={previewRecord}
          onClose={() => setPreviewRecord(null)}
        />
      )}
    </>
  );
}

function ImagePreview({ record, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 px-4 py-6 flex items-center justify-center"
      style={{ background: "rgba(36, 26, 18, 0.82)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: COLORS.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 p-4"
          style={{ background: COLORS.espresso, color: COLORS.cream }}
        >
          <div>
            <p className="font-bold text-sm">{record.namaChef}</p>
            <p className="text-xs opacity-80">
              {record.outlet} · {record.tanggal} · {record.jam}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2"
            style={{ background: COLORS.espressoLight }}
            aria-label="Tutup preview foto"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-3">
          <img
            src={record.foto}
            alt={`Foto absen ${record.namaChef}`}
            className="w-full max-h-[72vh] object-contain rounded-2xl"
            style={{ background: COLORS.espresso }}
          />
          <p
            className="text-xs text-center mt-3"
            style={{ color: COLORS.muted }}
          >
            Klik area gelap atau tekan Esc untuk menutup.
          </p>
        </div>
      </div>
    </div>
  );
}
