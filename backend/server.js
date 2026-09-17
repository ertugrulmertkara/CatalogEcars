const express = require("express"); // hazır bir express çağırır , express : node.js'in işini kolaylaştıran bir araç
const cors = require("cors"); //frontendin backend e istek atmasını sağlayan güvenlik ayarıdır normalde bir siteden başka siteye istek atmaya güvenlik kuralı uygulanır.  

const app = express(); // expressi kur
const PORT = 3000;


app.use(cors());
app.use(express.json());
let cars = []; // araçları ram'de tutuyoruz , veritabanı yok 
let nextId = 1; // her yeni araça unique id


app.listen(PORT, function(){
    console.log("Sunucu Çalışıyor: http://localhost:" + PORT);
});

app.get("/api/cars", function(req,res){
  const bodyType = req.query.bodyType;
  const status = req.query.status;
  const sort = req.query.sort;

  let filteredCars = [...cars];

  if (bodyType && bodyType !== "all") {
    filteredCars = filteredCars.filter(function (car) {
      return car.bodyType === bodyType;
    });
  }


   if (status && status !== "all") {
    filteredCars = filteredCars.filter(function (car) {
      return car.status === status;
    });
  }

  if (sort) {
    filteredCars.sort(function (a, b) {
      if (sort === "price") return a.price - b.price;
      if (sort === "range") return b.range - a.range;
      if (sort === "year") return b.year - a.year;
      return b.createdAt - a.createdAt; // Varsayılan: Eklenme sırası
    });
  }

   res.json(filteredCars);
});


app.post("/api/cars", function(req,res){
const car = {
    id: nextId++, // 1,1 arttır
    brand: req.body.brand,
    model: req.body.model,
    year: req.body.year,
    bodyType: req.body.bodyType,
    drivetrain: req.body.drivetrain,
    range: req.body.range,
    battery: req.body.battery,
    price: req.body.price,
    status: req.body.status || "catalog", // default: catalog
    imageUrl: req.body.imageUrl,
    link: req.body.link,
    note: req.body.note,
    createdAt: Date.now(),

  };
  cars.push(car); // diziye ekle
  res.status(201).json(car); // 201(başarıyla oluşturuldu), araç listesini gönder.
}

);

app.delete("/api/cars:id", function(req,res){
    const id = Number(req.params.id); // id string olarak gelir onu int e çevirir
    const index = cars.findIndex(function(car){ //findIndex bulamazsa -1 dönderir.
    return car.id === id;
    });
    if (index === -1){
        return res.status(404).json({ error: "araç bulunamadı."})
    }

    cars.splice(index , 1);
    res.json({message : "Araç Silinmiştir."})
});

app.patch("/api/cars/:id/status", function(req,res){ //: değişken istiyor demek 
    const id = Number(req.params.id);
    const car = cars.find(function(c){
        return c.id === id; // tek tek her id yi tarıyor bulduğunu car a atıyor
    });

    if(!car){
        return res.status(404).json({error: "Araç Bulunamadı."});
     }
     car.status = req.body.status; // statusunu request ile değiştiriyor 
     res.json(car);
})



