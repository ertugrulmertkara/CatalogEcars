const mongoose = require('mongoose');
const Car = require('./models/Car');
require('dotenv').config();

// Bağlantı adresi (şifre içerir) koda yazılmaz, .env dosyasındaki DATABASE_URL'den okunur
async function run() {
  await mongoose.connect(process.env.DATABASE_URL);
  const cars = await Car.find().limit(15);
  for (let c of cars) {
    console.log(`${c.brand} ${c.model}: ${c.imageUrl ? c.imageUrl.substring(0, 50) + '...' : 'YOK'}`);
  }
  process.exit(0);
}
run();
