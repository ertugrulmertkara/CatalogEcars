const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

const lines = fs.readFileSync('../seed.txt', 'utf8').split('\n').map(l => l.trim()).filter(l => l);
const cars = [];

for (let line of lines) {
  const match = line.match(/(.+?)\s+(\d{4})\s+(Hatchback|Sedan|SUV|Crossover|Station Wagon|City Car|Mikro|Mini SUV|Van)\s+(FWD|RWD|AWD)\s+(\d+)\s+([\d\.]+)\s+(\d+)$/i);
  if (match) {
    const brandModel = match[1].trim();
    const brand = brandModel.split(' ')[0];
    const model = brandModel.substring(brand.length).trim();
    
    // Rastgele foto
    const imageUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(brand+'+'+model) + "&background=random&size=400";
    
    const car = {
      brand: brand,
      model: model || brand,
      year: parseInt(match[2]),
      bodyType: match[3],
      drivetrain: match[4],
      range: parseInt(match[5]),
      battery: parseFloat(match[6]),
      price: parseInt(match[7]),
      status: 'catalog',
      imageUrl: imageUrl
    };
    cars.push(car);
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Atlas'a bağlanıldı!");
    await Car.deleteMany({}); // Önce içini temizle (çift kayıt olmasın)
    await Car.insertMany(cars);
    console.log("100 Araba Atlas'a başarıyla yüklendi!");
  } catch (err) {
    console.error("Hata:", err.message);
  }
  process.exit(0);
}
run();
