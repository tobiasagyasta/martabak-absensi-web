import * as XLSX from "xlsx";

export function compressImage(file, maxWidth = 480, quality = 0.62) {
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

export function exportAbsensiExcel({ filtered, chefs, todayKey }) {
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
