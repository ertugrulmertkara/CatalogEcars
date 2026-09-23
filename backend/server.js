require("dotenv").config(); // .env dosyasındaki şifreleri okumayı sağlar
const connectDb = require("./db"); // db.js dosyamızı projeye dahil ettik

const express = require("express"); // hazır bir express çağırır
const cors = require("cors"); 
const Car = require("./models/Car");
const User = require("./models/User"); // YENİ: Kullanıcı modeli
const bcrypt = require("bcryptjs");   // YENİ: Şifre hashleme aracı
const jwt = require("jsonwebtoken");  // YENİ: Token oluşturucu

const app = express(); //express i kurduk 
connectDb();

const PORT = 3000;

app.use(cors());
app.use(express.json());

app.listen(PORT, function(){
    console.log("Sunucu Çalışıyor: http://localhost:" + PORT);
});

// --- AUTHENTICATION (GÜVENLİK) ROUTE'LARI ---
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_catalog_key";

// 1. Kayıt (Register) Route'u
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    // Şifreyi şifreleme (Bcrypt)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.create({ username, password: hashedPassword, role: role || 'user' });
    res.status(201).json({ message: "Kullanıcı başarıyla oluşturuldu." });
  } catch (error) {
    res.status(500).json({ error: "Kayıt hatası veya kullanıcı zaten mevcut." });
  }
});

// 2. Giriş (Login) Route'u ve JWT Dağıtımı
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
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
// ----------------------------------------

app.get("/api/cars", async function(req, res)
  {
  const {bodyType , status , sort, order , brand , drivetrain, minPrice, maxPrice , minRange, maxRange, search} = req.query;

  const filter= {};

  // ARAMA KUTUSU MANTIĞI (Marka veya model içinde Case-Insensitive arama yapar)
  if (search && search.trim() !== "") {
    filter.$or = [
      { brand: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } }
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


app.post("/api/cars",async function(req,res)
{
  try
  {
    const car = await Car.create(req.body);
    res.status(201).json(car);
  }
  catch(error)
  {
    console.error("Araç eklenirken hata:", error);
    res.status(500).json({error: "Veritabanı hatası"})
  }
}



);

app.delete("/api/cars/:id", async function(req,res)
{
    try
    {
      const car = await Car.findByIdAndDelete(req.params.id);
      if(!car)
      {
        return res.status(404).json({error: "Araç Bulunamadı."});      
      }
        res.json({message: "Araç Silinmiştir."});
    }
    catch(error)
    {
      console.error("Araç silinirken hata:", error);
      res.status(500).json({ error: "Veritabanı hatası" });
    }
});


app.patch("/api/cars/:id/status", async function(req,res)
{ 
  try
  {
    const car = await Car.findByIdAndUpdate
    (
      req.params.id, 
      {status: req.body.status},
      {new: true}
    );
    if (!car)
    {
      return res.status(404).json({ error: "Araç bulunamadı." });
    }
    res.json(car);
  }
  catch(error)
  {
    console.error("Durum güncellenirken hata:", error);
    res.status(500).json({ error: "Veritabanı hatası" });
  }

   
});



