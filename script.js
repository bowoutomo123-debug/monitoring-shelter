
const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
const TOPIC = "ta/shelter_nav_2026/kelompok01/data";

// Elemen website
const koneksiEl = document.getElementById("koneksi");
const waktuEl = document.getElementById("waktu");
const suhuEl = document.getElementById("suhu");
const kelembapanEl = document.getElementById("kelembapan");
const pintuEl = document.getElementById("pintu");
const airEl = document.getElementById("air");
const peringatanEl = document.getElementById("peringatan");

// Menghubungkan website ke MQTT
koneksiEl.textContent = "Status koneksi: Menghubungkan...";

const client = mqtt.connect(BROKER_URL, {
    clientId: "website_shelter_" +
        Math.random().toString(16).slice(2, 10),
    connectTimeout: 10000,
    reconnectPeriod: 3000
});

// Ketika berhasil terhubung
client.on("connect", function () {
    koneksiEl.textContent = "Status koneksi: Terhubung ke MQTT";
    koneksiEl.style.color = "green";

    client.subscribe(TOPIC, function (err) {
        if (err) {
            koneksiEl.textContent = "Gagal berlangganan topik MQTT";
            koneksiEl.style.color = "red";
        }
    });
});

// Ketika koneksi terputus atau gagal
client.on("reconnect", function () {
    koneksiEl.textContent = "Status koneksi: Menghubungkan ulang...";
    koneksiEl.style.color = "orange";
});

client.on("error", function (err) {
    console.error("Kesalahan MQTT:", err);
    koneksiEl.textContent = "Status koneksi: Terjadi kesalahan";
    koneksiEl.style.color = "red";
});

// Menerima data dari ESP32
client.on("message", function (topic, message) {
    const data = message.toString().trim();
    console.log("Data MQTT:", data);

    // Format data: suhu,kelembapan,pintu,air
    const nilai = data.split(",");

    if (nilai.length !== 4) {
        peringatanEl.textContent =
            "Format data sensor tidak sesuai.";
        return;
    }

    const suhu = Number(nilai[0]);
    const kelembapan = Number(nilai[1]);
    const pintu = Number(nilai[2]);
    const air = Number(nilai[3]);

    if (![suhu, kelembapan, pintu, air].every(Number.isFinite)) {
        peringatanEl.textContent =
            "Data sensor tidak valid.";
        return;
    }

    suhuEl.textContent = suhu.toFixed(1) + " °C";
    kelembapanEl.textContent = kelembapan.toFixed(1) + " %";

    // Asumsi: nilai pintu 1 = tertutup, 0 = terbuka
    pintuEl.textContent = pintu === 1 ? "Tertutup" : "Terbuka";
    pintuEl.style.color = pintu === 1 ? "green" : "red";

    // Ambang simulasi: nilai air >= 2500 dianggap tinggi
    airEl.textContent = air >= 2500 ? "Terdeteksi" : "Normal";
    airEl.style.color = air >= 2500 ? "red" : "green";

    // Peringatan kondisi shelter
    const peringatan = [];

    if (suhu >= 35) {
        peringatan.push("Suhu tinggi");
    }

    if (kelembapan >= 80) {
        peringatan.push("Kelembapan tinggi");
    }

    if (pintu === 0) {
        peringatan.push("Pintu terbuka");
    }

    if (air >= 2500) {
        peringatan.push("Potensi genangan air");
    }

    if (peringatan.length > 0) {
        peringatanEl.textContent =
            "PERINGATAN: " + peringatan.join(", ");
        peringatanEl.style.color = "red";
    } else {
        peringatanEl.textContent =
            "Kondisi shelter normal berdasarkan ambang simulasi.";
        peringatanEl.style.color = "green";
    }

    waktuEl.textContent =
        "Pembaruan terakhir: " + new Date().toLocaleTimeString("id-ID");
});
