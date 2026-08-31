import { CheckCircle2, ImagePlus, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { COLORS, OUTLETS } from "./constants";
import { Section } from "./components";

export function DaftarTab({ regNama, setRegNama, regHp, setRegHp, regOutlet, setRegOutlet, regAlamat, setRegAlamat, handleDaftar, chefs, chefsByOutlet }) {
  return (
    <div>
      <Section eyebrow="Registrasi" title="Data Diri Chef" />
      <form onSubmit={handleDaftar} className="rounded-2xl p-4 space-y-3 shadow-sm" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Nama Lengkap</label>
          <input value={regNama} onChange={(e) => setRegNama(e.target.value)} placeholder="cth. Budi Santoso" className="w-full mt-1 px-3 py-3 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>No. HP / WhatsApp</label>
          <input value={regHp} onChange={(e) => setRegHp(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="numeric" className="w-full mt-1 px-3 py-3 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Outlet</label>
          <select value={regOutlet} onChange={(e) => setRegOutlet(e.target.value)} className="w-full mt-1 px-3 py-3 rounded-xl text-sm bg-white" style={{ border: `1px solid ${COLORS.line}` }}>
            {OUTLETS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Alamat (opsional)</label>
          <textarea value={regAlamat} onChange={(e) => setRegAlamat(e.target.value)} rows={2} className="w-full mt-1 px-3 py-3 rounded-xl text-sm" style={{ border: `1px solid ${COLORS.line}` }} />
        </div>
        <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ background: COLORS.espresso, color: COLORS.cream }}>
          <UserPlus size={16} /> Daftarkan Chef
        </button>
      </form>

      <div className="mt-6">
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
    </div>
  );
}

export function AbsenTab({ chefs, absChefId, setAbsChefId, absTipe, setAbsTipe, absFoto, setAbsFoto, absBusy, handleFoto, handleAbsen, fileRef }) {
  const grouped = OUTLETS.map((o) => ({ outlet: o, list: chefs.filter((c) => c.outlet === o) })).filter((g) => g.list.length > 0);
  const selectedChef = chefs.find((c) => c.id === absChefId);
  const canSubmit = chefs.length > 0 && !absBusy;

  function clearFoto() {
    setAbsFoto("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <Section eyebrow="Kehadiran" title="Absen Chef" />
      <form onSubmit={handleAbsen} className="rounded-2xl p-4 space-y-4 shadow-sm" style={{ background: "white", border: `1px solid ${COLORS.line}` }}>
        {chefs.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.muted }}>Belum ada chef terdaftar. Silakan daftar dulu di tab "Daftar Chef".</p>
        ) : (
          <div>
            <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Pilih Chef</label>
            <select value={absChefId} onChange={(e) => setAbsChefId(e.target.value)} className="w-full mt-1 px-3 py-3 rounded-xl text-sm bg-white" style={{ border: `1px solid ${COLORS.line}` }}>
              <option value="">Pilih nama chef</option>
              {grouped.map((g) => (
                <optgroup key={g.outlet} label={g.outlet}>
                  {g.list.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}
                </optgroup>
              ))}
            </select>
            {selectedChef && (
              <p className="text-xs mt-2 px-3 py-2 rounded-xl" style={{ color: COLORS.espresso, background: COLORS.cream }}>
                Outlet: <span className="font-semibold">{selectedChef.outlet}</span>
              </p>
            )}
          </div>
        )}
        <div>
          <label className="text-xs font-semibold" style={{ color: COLORS.muted }}>Jenis Absen</label>
          <div className="flex gap-2 mt-1">
            {[{ v: "Masuk", icon: LogIn }, { v: "Pulang", icon: LogOut }].map((t) => {
              const Icon = t.icon;
              const active = absTipe === t.v;
              return (
                <button type="button" key={t.v} onClick={() => setAbsTipe(t.v)} className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1" style={{ background: active ? COLORS.amber : COLORS.cream, color: COLORS.espresso, border: `1px solid ${active ? COLORS.amber : COLORS.line}` }}>
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
            <label htmlFor="foto-input" className="mt-1 w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl text-sm cursor-pointer" style={{ border: `2px dashed ${COLORS.line}`, color: COLORS.muted, background: COLORS.cream }}>
              <ImagePlus size={24} />
              <span className="font-semibold">{absBusy ? "Memproses foto..." : "Ambil / Upload Foto"}</span>
              <span className="text-xs">Gunakan kamera belakang agar foto lebih jelas.</span>
            </label>
          ) : (
            <div className="mt-1 flex items-center gap-3">
              <div className="relative w-28 h-28">
                <img src={absFoto} alt="preview" className="w-28 h-28 object-cover rounded-xl" style={{ border: `1px solid ${COLORS.line}` }} />
                <button type="button" onClick={clearFoto} className="absolute -top-2 -right-2 rounded-full p-1" style={{ background: COLORS.chili, color: "white" }}>
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs" style={{ color: COLORS.muted }}>Foto siap dikirim. Jika kurang jelas, hapus lalu ambil ulang.</p>
            </div>
          )}
        </div>
        <button type="submit" disabled={!canSubmit} className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2" style={{ background: COLORS.espresso, color: COLORS.cream, opacity: canSubmit ? 1 : 0.5 }}>
          <CheckCircle2 size={16} /> Catat Absen {absTipe}
        </button>
      </form>
    </div>
  );
}
