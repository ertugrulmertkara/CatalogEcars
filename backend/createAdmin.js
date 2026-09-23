require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDb = require("./db");

// Kullanım: .env dosyasına ADMIN_PASSWORD=... ekleyip "node createAdmin.js" çalıştırın.
// Şifre koda yazılmaz; aksi halde GitHub'daki herkes süper admin şifresini görür.
async function createAdmin() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error("HATA: .env dosyasında en az 8 karakterlik ADMIN_PASSWORD tanımlayın.");
    process.exit(1);
  }

  await connectDb();
  try {
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      // Eski script admin'i rolsüz (yani 'user') oluşturuyordu; rolünü düzelt
      if (existingAdmin.role !== "superadmin") {
        existingAdmin.role = "superadmin";
        await existingAdmin.save();
        console.log("Mevcut admin kullanıcısının rolü superadmin olarak güncellendi.");
      } else {
        console.log("Admin kullanıcısı zaten mevcut.");
      }
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ username: "admin", password: hashedPassword, role: "superadmin" });
    console.log("Başarılı! 'admin' kullanıcısı superadmin rolüyle oluşturuldu.");
  } catch (error) {
    console.error("Hata:", error);
  }
  process.exit();
}

createAdmin();
