require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDb = require("./db");

async function createAdmin() {
  await connectDb();
  try {
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("Admin kullanıcısı zaten mevcut.");
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);

    await User.create({ username: "admin", password: hashedPassword });
    console.log("Başarılı! Admin kullanıcısı (admin / 123456) oluşturuldu.");
  } catch (error) {
    console.error("Hata:", error);
  }
  process.exit();
}

createAdmin();
