const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const Car = require("./models/Car");

const curatedCars = JSON.parse(
  fs.readFileSync(path.join(__dirname, "newCars.json"), "utf8")
);

const seedLinePattern =
  /(.+?)\s+(\d{4})\s+(Hatchback|Sedan|SUV|Crossover|Station Wagon|City Car|Mikro|Mini SUV|Van)\s+(FWD|RWD|AWD)\s+(\d+)\s+([\d.]+)\s+(\d+)$/i;

function readSeedCars() {
  const seedPath = path.join(__dirname, "..", "seed.txt");
  const lines = fs.readFileSync(seedPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.flatMap((line) => {
    const match = line.match(seedLinePattern);
    if (!match) {
      console.warn(`Atlanan seed satırı: ${line}`);
      return [];
    }

    const brandModel = match[1].trim();
    const brand = brandModel.split(/\s+/)[0];
    const model = brandModel.slice(brand.length).trim() || brand;

    return [{
      brand,
      model,
      year: Number(match[2]),
      bodyType: match[3],
      drivetrain: match[4],
      range: Number(match[5]),
      battery: Number(match[6]),
      price: Number(match[7]),
      imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(`${brand}+${model}`)}&background=random&size=400`,
      note: "Genişletilmiş katalog seed verisi; fiyat ve teknik bilgiler kullanıcı tarafından kontrol edilmelidir."
    }];
  });
}

const cars = [...curatedCars, ...readSeedCars()];
const uniqueCars = Array.from(
  new Map(cars.map((car) => [`${car.brand}|${car.model}|${car.year}`, car])).values()
);

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  await mongoose.connect(process.env.DATABASE_URL);

  for (const car of uniqueCars) {
    await Car.updateOne(
      { brand: car.brand, model: car.model, year: car.year },
      {
        $set: car,
        $setOnInsert: { status: "catalog" }
      },
      { upsert: true }
    );
  }

  console.log(`${uniqueCars.length} araç kaydı upsert edildi.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Yeni araçlar içe aktarılırken hata:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
