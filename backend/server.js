require("dotenv").config(); // .env dosyasındaki şifreleri okumayı sağlar
const connectDb = require("./db"); // db.js dosyamızı projeye dahil ettik

const express = require("express"); // hazır bir express çağırır
const cors = require("cors");
const mongoose = require("mongoose");
const Car = require("./models/Car");
const User = require("./models/User"); // YENİ: Kullanıcı modeli
const bcrypt = require("bcryptjs");   // YENİ: Şifre hashleme aracı
const jwt = require("jsonwebtoken");  // YENİ: Token oluşturucu

const app = express(); //express i kurduk 
connectDb();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.listen(PORT, function(){
    console.log("Sunucu Çalışıyor: http://localhost:" + PORT);
});

// --- AUTHENTICATION (GÜVENLİK) ROUTE'LARI ---
// Sabit (koda yazılmış) bir anahtar GitHub'da herkes tarafından görülür ve sahte token üretilebilir.
// Bu yüzden anahtar sadece .env / Render ortam değişkeninden okunur, yoksa sunucu hiç başlamaz.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("HATA: JWT_SECRET ortam değişkeni tanımlı değil. .env dosyasına veya Render ayarlarına ekleyin.");
  process.exit(1);
}

// Kayıt ekranından seçilebilecek roller. superadmin sadece createAdmin.js ile oluşturulur.
const SELF_ASSIGNABLE_ROLES = ["user", "dealer"];
const CAR_STATUSES = ["catalog", "shortlist", "testDrive", "rejected"];
// İstemciden gelen body'de sadece bu alanlar kabul edilir (ownerId, _id gibi alanlar dışarıdan değiştirilemez)
const CAR_FIELDS = ["brand", "model", "year", "bodyType", "drivetrain", "range", "battery", "price", "status", "imageUrl", "link", "note"];

function pickCarFields(body) {
  const data = {};
  CAR_FIELDS.forEach(function (field) {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
}

// Arama metnindeki özel regex karakterlerini (. * + ? vb.) etkisiz hale getirir
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 1. Kayıt (Register) Route'u
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Kullanıcı adı en az 3 karakter olmalı." });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Şifre en az 6 karakter olmalı." });
    }
    if (role !== undefined && !SELF_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: "Geçersiz hesap türü." });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) return res.status(409).json({ error: "Bu kullanıcı adı zaten alınmış." });

    // Şifreyi şifreleme (Bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ username: username.trim(), password: hashedPassword, role: role || 'user' });
    res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu." });
  } catch (error) {
    res.status(500).json({ error: "Kayıt sırasında sunucu hatası oluştu." });
  }
});

// 2. Giriş (Login) Route'u ve JWT Dağıtımı
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    // {"$ne": null} gibi obje gönderilerek yapılan NoSQL injection denemelerini engeller
    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Hatalı kullanıcı adı veya şifre!" });
    }

    // Veritabanında kullanıcıyı ara
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Hatalı kullanıcı adı veya şifre!" });

    // Girilen şifre ile veritabanındaki şifreli (hashed) halini karşılaştır
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Hatalı kullanıcı adı veya şifre!" });

    // Şifre doğruysa "Kimlik Kartı" (JWT Token) üret (Rol bilgisi de var)
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: "1d" } // 1 gün geçerli
    );

    res.json({ token, message: "Başarıyla giriş yapıldı!", role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası!" });
  }
});
// JWT Doğrulama Ara Yazılımı (Middleware)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// 3. Kişisel Liste Getirme Route'u
app.get("/api/users/me/list", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    res.json(user.personalList);
  } catch (error) {
    res.status(500).json({ error: "Liste getirilemedi" });
  }
});

// 4. Kişisel Liste Güncelleme Route'u
app.post("/api/users/me/list", authenticateToken, async (req, res) => {
  try {
    const { carId, status } = req.body;
    if (!mongoose.isValidObjectId(carId)) return res.status(400).json({ error: "Geçersiz araç ID'si." });
    if (!CAR_STATUSES.includes(status)) return res.status(400).json({ error: "Geçersiz durum." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    // Araç listede var mı?
    const index = user.personalList.findIndex(item => item.carId.toString() === carId);
    if (index > -1) {
      user.personalList[index].status = status;
    } else {
      user.personalList.push({ carId, status });
    }
    
    await user.save();
    res.json({ message: "Kişisel liste güncellendi." });
  } catch (error) {
    res.status(500).json({ error: "Liste güncellenemedi" });
  }
});
// ----------------------------------------
app.get("/api/cars", async function(req, res)
  {
  const {bodyType , status , sort, order , brand , drivetrain, minPrice, maxPrice , minRange, maxRange, search} = req.query;

  const filter= {};

  // ARAMA KUTUSU MANTIĞI (Marka veya model içinde Case-Insensitive arama yapar)
  if (typeof search === "string" && search.trim() !== "") {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { brand: { $regex: safeSearch, $options: "i" } },
      { model: { $regex: safeSearch, $options: "i" } }
    ];
  }

  if(bodyType && bodyType !== "all") filter.bodyType = bodyType;
  if(status && status !== "all") filter.status = status;
  if(brand && brand !== "all") filter.brand = brand;
  if(drivetrain && drivetrain !== "all") filter.drivetrain = drivetrain;
  const priceFilter = {};

  if (minPrice !== undefined && minPrice !== "") {
    priceFilter.$gte = Number(minPrice);
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    priceFilter.$lte = Number(maxPrice);
  }

  if (Object.keys(priceFilter).length > 0) {
    filter.price = priceFilter;
  }

  const rangeFilter = {};

  if (minRange !== undefined && minRange !== "") {
    rangeFilter.$gte = Number(minRange);
  }

  if (maxRange !== undefined && maxRange !== "") {
    rangeFilter.$lte = Number(maxRange);
  }

  if (Object.keys(rangeFilter).length > 0) {
    filter.range = rangeFilter;
  }
  const allowedSortFields = ["createdAt", "price", "range"];
  const sortField = allowedSortFields.includes(sort)
  ? sort
  : "createdAt";

  const sortDirection = order === "asc" ? 1 : -1;

  const sortObject = {
    [sortField]: sortDirection
  };

  try 
  {
  const cars = await Car.find(filter).sort(sortObject);
  res.json(cars);
  } 
  catch (error) 
  {
  console.error("Araçlar listelenirken hata:", error);
  res.status(500).json({ error: "Veritabanı hatası" });
  }
  });




// Bayi Yetki Kontrolü Ara Yazılımı
function requireDealer(req, res, next) {
  if (req.user.role !== 'dealer' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: "Sadece bayiler veya süper adminler bu işlemi yapabilir." });
  }
  next();
}

// Geçersiz ID gönderilirse (örn. /api/cars/abc) veritabanına gitmeden 400 döner
function validateCarId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Geçersiz araç ID'si." });
  }
  next();
}

// Mongoose doğrulama hatalarını (eksik/yanlış alan) 400, diğerlerini 500 olarak döner
function sendDbError(res, error, message) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: "Geçersiz veya eksik araç bilgisi." });
  }
  console.error(message, error);
  res.status(500).json({ error: message });
}

function canManageCar(user, car) {
  return user.role === 'superadmin' || car.ownerId?.toString() === user.id;
}

app.post("/api/cars", authenticateToken, requireDealer, async function(req,res)
{
  try {
    const carData = pickCarFields(req.body);
    carData.ownerId = req.user.id; // Aracı ekleyeni (bayiyi) kaydet
    const car = await Car.create(carData);
    res.status(201).json(car);
  } catch(error) {
    sendDbError(res, error, "Veritabanı hatası, araç eklenemedi.");
  }
});

app.delete("/api/cars/:id", authenticateToken, requireDealer, validateCarId, async function(req,res)
{
    try {
      const car = await Car.findById(req.params.id);
      if(!car) return res.status(404).json({error: "Araç Bulunamadı."});      

      // Sadece Superadmin veya Aracı Ekleyen Bayi silebilir
      if (!canManageCar(req.user, car)) {
        return res.status(403).json({error: "Sadece kendi eklediğiniz araçları silebilirsiniz."});
      }

      await Car.findByIdAndDelete(req.params.id);
      res.json({message: "Araç Silinmiştir."});
    } catch(error) {
      sendDbError(res, error, "Veritabanı hatası");
    }
});

app.put("/api/cars/:id", authenticateToken, requireDealer, validateCarId, async function(req,res)
{
  try {
    const car = await Car.findById(req.params.id);
    if(!car) return res.status(404).json({error: "Araç Bulunamadı."});      

    if (!canManageCar(req.user, car)) {
      return res.status(403).json({error: "Sadece kendi eklediğiniz araçları düzenleyebilirsiniz."});
    }

    // ownerId body'den alınmaz, böylece bayi aracın sahibini değiştiremez
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, pickCarFields(req.body), {new: true, runValidators: true});
    res.json(updatedCar);
  } catch(error) {
    sendDbError(res, error, "Veritabanı hatası, araç güncellenemedi.");
  }
});

app.patch("/api/cars/:id/status", authenticateToken, requireDealer, validateCarId, async function(req,res)
{ 
  try {
    if (!CAR_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: "Geçersiz durum." });
    }

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Araç bulunamadı." });

    if (!canManageCar(req.user, car)) {
      return res.status(403).json({error: "Sadece kendi eklediğiniz araçların durumunu değiştirebilirsiniz."});
    }

    car.status = req.body.status;
    await car.save();
    res.json(car);
  } catch(error) {
    sendDbError(res, error, "Veritabanı hatası");
  }
});
