import * as XLSX from "xlsx";

export function compressImage(file, { maxWidth = 720, quality = 0.7, stamp = {} } = {}) {
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
        drawTimestampStamp(ctx, canvas, stamp);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function drawTimestampStamp(ctx, canvas, stamp) {
  const now = stamp.date || new Date();
  const tanggal = fmtTanggal(now);
  const jam = fmtJam(now);
  const type = stamp.type || "Masuk";
  const outlet = stamp.outlet || "Martabak Pecenongan 78";
  const title = `ABSEN ${type.toUpperCase()} · ${outlet}`;
  const detail = `${tanggal} · ${jam} WIB`;
  const padding = Math.max(12, Math.round(canvas.width * 0.028));
  const titleSize = Math.max(15, Math.round(canvas.width * 0.036));
  const detailSize = Math.max(12, Math.round(canvas.width * 0.03));
  const gap = Math.max(5, Math.round(canvas.width * 0.012));
  const boxHeight = padding * 2 + titleSize + detailSize + gap;
  const y = canvas.height - boxHeight;

  ctx.save();
  ctx.fillStyle = "rgba(36, 26, 18, 0.78)";
  ctx.fillRect(0, y, canvas.width, boxHeight);
  ctx.fillStyle = "#F2C94C";
  ctx.font = `700 ${titleSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(title, padding, y + padding, canvas.width - padding * 2);
  ctx.fillStyle = "#FBF3E7";
  ctx.font = `600 ${detailSize}px Arial, sans-serif`;
  ctx.fillText(detail, padding, y + padding + titleSize + gap, canvas.width - padding * 2);
  ctx.restore();
}

export function fmtTanggal(d) {
  return d.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function fmtTanggalKey(d) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
}

export function fmtJam(d) {
  return d.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportAbsensiExcel({ filtered, chefs, startDate, endDate }) {
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
  const suffix = startDate === endDate ? startDate : `${startDate}_sd_${endDate}`;
  XLSX.writeFile(wb, `Absensi_Martabak78_${suffix}.xlsx`);
}
