import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
  deleteDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAlIF2ctS3KRSVv-l1k3f834mKFUZQDGog",
  authDomain: "buku-hutang-6a352.firebaseapp.com",
  projectId: "buku-hutang-6a352",
  storageBucket: "buku-hutang-6a352.firebasestorage.app",
  messagingSenderId: "1045855636743",
  appId: "1:1045855636743:web:059cf2ce28d3188db3c9a2",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colRef = collection(db, "pelanggan");

// --- FUNGSI TAMBAH PELANGGAN ---
window.tambahPelanggan = async () => {
  const namaInput = document.getElementById("nama");
  const alamatInput = document.getElementById("alamat");

  if (namaInput.value && alamatInput.value) {
    try {
      await addDoc(colRef, {
        nama: namaInput.value,
        alamat: alamatInput.value,
        total_hutang: 0,
        createdAt: new Date(),
      });
      namaInput.value = "";
      alamatInput.value = "";
    } catch (e) {
      alert("Gagal simpan: " + e.message);
    }
  } else {
    alert("Nama dan Alamat harus diisi!");
  }
  namaInput.value("");
};

// --- FUNGSI UPDATE HUTANG / BAYAR ---
window.updateHutang = async (id, tipe) => {
  const pesan =
    tipe === "tambah" ? "Tambah hutang sebesar:" : "Bayar hutang sebesar:";
  const nominal = prompt(pesan);

  if (nominal && !isNaN(nominal)) {
    const nominalInt = parseInt(nominal);
    const docRef = doc(db, "pelanggan", id);
    const nilai = tipe === "tambah" ? nominalInt : -nominalInt;

    try {
      // 1. Update Total di data Pelanggan
      await updateDoc(docRef, {
        total_hutang: increment(nilai),
      });

      // 2. Catat riwayat ke Sub-Collection 'transaksi'
      const transRef = collection(db, "pelanggan", id, "transaksi");
      await addDoc(transRef, {
        tanggal: new Date(),
        nominal: nominalInt,
        tipe: tipe, // 'tambah' atau 'bayar'
      });

      alert("Transaksi tercatat!");
    } catch (e) {
      alert("Gagal: " + e.message);
    }
  }
};

// --- FUNGSI LIHAT RIWAYAT ---
window.lihatRiwayat = async (id, nama) => {
  const transRef = collection(db, "pelanggan", id, "transaksi");
  const qTrans = query(transRef, orderBy("tanggal", "desc"));
  const querySnapshot = await getDocs(qTrans);

  let riwayatTeks = `RIWAYAT HUTANG: ${nama}\n------------------\n`;

  if (querySnapshot.empty) {
    riwayatTeks += "Belum ada catatan transaksi.";
  } else {
    querySnapshot.forEach((doc) => {
      const t = doc.data();
      const tgl = t.tanggal.toDate().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const jam = t.tanggal
        .toDate()
        .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const simbol = t.tipe === "tambah" ? "(+) Hutang" : "(-) Bayar";
      riwayatTeks += `${tgl} [${jam}] : ${simbol} Rp ${t.nominal.toLocaleString()}\n`;
    });
  }

  alert(riwayatTeks); // Munculkan di popup sederhana dulu
};

window.hapusPelanggan = async (id, nama) => {
  const konfirmasi = confirm(
    `Hapus pelanggan "${nama}"? Semua catatan hutangnya akan hilang permanen.`,
  );

  if (konfirmasi) {
    try {
      const docRef = doc(db, "pelanggan", id);
      await deleteDoc(docRef);
      alert("Pelanggan berhasil dihapus.");
    } catch (e) {
      alert("Gagal menghapus: " + e.message);
    }
  }
};

// --- FUNGSI KIRIM WHATSAPP ---
window.kirimWA = (nama, total) => {
  const pesan = `Halo ${nama}, mau mengingatkan catatan di Toko kami. Total hutang saat ini: Rp ${total.toLocaleString()}. Mohon segera diselesaikan ya, terima kasih! 🙏`;
  const url = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
};

// --- FUNGSI PENCARIAN (FILTER) ---
window.filterPelanggan = () => {
    const input = document.getElementById('cariNama').value.toLowerCase();
    const listData = document.getElementById('listData');
    const kartu = listData.getElementsByClassName('kartu-pelanggan');

    for (let i = 0; i < kartu.length; i++) {
        // Ambil teks nama dari h3 di dalam kartu
        const nama = kartu[i].getElementsByTagName("h3")[0].innerText.toLowerCase();
        
        if (nama.indexOf(input) > -1) {
            kartu[i].style.display = ""; // Tampilkan jika cocok
        } else {
            kartu[i].style.display = "none"; // Sembunyikan jika tidak cocok
        }
    }
};

// --- TAMPILKAN DATA SECARA REAL-TIME ---
const q = query(colRef, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  const listData = document.getElementById("listData");
  listData.innerHTML = "";

  if (snapshot.empty) {
    listData.innerHTML =
      '<p class="text-center text-gray-400 mt-10">Belum ada data pelanggan.</p>';
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    const id = doc.id;
    const warnaHutang =
      data.total_hutang > 0 ? "text-red-600" : "text-green-600";
    const borderHutang =
      data.total_hutang > 0 ? "border-red-500" : "border-green-500";

    listData.innerHTML += `
            <div class="kartu-pelanggan bg-white p-4 rounded-xl shadow-sm mb-3 border-l-4 ${borderHutang}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-800 uppercase text-sm">${data.nama}</h3>
                        <p class="text-xs text-gray-400 mb-2">${data.alamat}</p>
                        <p class="text-xl font-mono font-bold ${warnaHutang}">
                            Rp ${data.total_hutang.toLocaleString()}
                        </p>
                    </div>

                    <div class="flex flex-col gap-2 min-w-[100px]">
                        <button onclick="updateHutang('${id}', 'tambah')" 
                            class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            + Hutang
                        </button>
                        <button onclick="updateHutang('${id}', 'bayar')" 
                            class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                            Bayar
                        </button>
                        
                        <button onclick="lihatRiwayat('${id}', '${data.nama}')" 
                            class="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300">
                            Riwayat
                        </button>
                        
                        <button onclick="kirimWA('${data.nama}', ${data.total_hutang})" 
                            class="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm text-center">
                            WA Tagihan
                        </button>
                        
                        <button onclick="hapusPelanggan('${id}', '${data.nama}')" 
                            class="mt-1 text-red-400 hover:text-red-700 text-[10px] font-semibold uppercase text-center">
                            Hapus Pelanggan
                        </button>
                    </div>
                </div>
            </div>
        `;
  });
});

// Register Service Worker untuk PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
  });
}
