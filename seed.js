const fs = require('fs');
const lines = fs.readFileSync('seed.txt', 'utf8').split('\n').map(l => l.trim()).filter(l => l);

const cars = [];
for (let line of lines) {
  const match = line.match(/(.+?)\s+(\d{4})\s+(Hatchback|Sedan|SUV|Crossover|Station Wagon|City Car|Mikro|Mini SUV|Van)\s+(FWD|RWD|AWD)\s+(\d+)\s+([\d\.]+)\s+(\d+)$/i);
  if (match) {
    const brandModel = match[1].trim();
    const brand = brandModel.split(' ')[0];
    const model = brandModel.substring(brand.length).trim();
    const car = {
      brand: brand,
      model: model || brand,
      year: parseInt(match[2]),
      bodyType: match[3],
      drivetrain: match[4],
      range: parseInt(match[5]),
      battery: parseFloat(match[6]),
      price: parseInt(match[7]),
      status: 'catalog'
    };
    cars.push(car);
  } else {
    console.log('Parse hatasi: ' + line);
  }
}

async function seed() {
  let successCount = 0;
  for (let car of cars) {
    try {
      const res = await fetch('http://localhost:3000/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(car)
      });
      if (res.ok) successCount++;
    } catch (e) {
      console.error(e);
    }
  }
  console.log('Basariyla eklenen arac sayisi: ' + successCount + ' / ' + cars.length);
}
seed();
