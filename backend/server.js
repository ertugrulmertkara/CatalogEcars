require("dotenv").config(); // .env dosyasındaki şifreleri okumayı sağlar
const connectDb = require("./db"); // db.js dosyamızı projeye dahil ettik

const express = require("express"); // hazır bir express çağırır , express : node.js'in işini kolaylaştıran bir araç
const cors = require("cors"); //frontendin backend e istek atmasını sağlayan güvenlik ayarıdır normalde bir siteden başka siteye istek atmaya güvenlik kuralı uygulanır.  
const Car = require("./models/Car");
const app = express(); //express i kurduk 
connectDb();

const PORT = 3000;


app.use(cors());
app.use(express.json());



app.listen(PORT, function(){
    console.log("Sunucu Çalışıyor: http://localhost:" + PORT);
});

app.get("/api/cars", async function(req, res)
  {
  const {bodyType , status , sort, order , brand , drivetrain, minPrice, maxPrice , minRange, maxRange} = req.query;

  const filter= {};
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



