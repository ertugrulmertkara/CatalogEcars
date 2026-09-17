let cars = JSON.parse(localStorage.getItem("cars")) || [];

function saveCars() {
  localStorage.setItem("cars", JSON.stringify(cars));
}

const toggleBtn = document.getElementById("toggle-form-btn");
const formPanel = document.getElementById("add-car-panel");
const filterBody = document.getElementById("filter-body");
const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");


toggleBtn.addEventListener("click", function () {
  formPanel.hidden = !formPanel.hidden;
   if (formPanel.hidden) {
    toggleBtn.textContent = "+ Araç ekle";
  } else {
    toggleBtn.textContent = "✕ Kapat";
  }
});



const carForm = document.getElementById("car-form");
carForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const newCar = {
    id: Date.now(),
    brand: document.getElementById("brand").value,
    model: document.getElementById("model").value,
    year: Number(document.getElementById("year").value),
    bodyType: document.getElementById("bodyType").value,
    drivetrain: document.getElementById("drivetrain").value,
    range: Number(document.getElementById("range").value),
    battery: Number(document.getElementById("battery").value),
    price: Number(document.getElementById("price").value),
    status: document.getElementById("status").value,
    imageUrl: document.getElementById("imageUrl").value,
    link: document.getElementById("link").value,
    note: document.getElementById("note").value,
    createdAt: Date.now(),
  };
  cars.push(newCar);
  saveCars();
  renderCars();
  carForm.reset();
  formPanel.hidden = true;
  toggleBtn.textContent = "+ Araç ekle";
});


const tbody = document.getElementById("car-tbody");
const statusLabels = {
  catalog: "Katalog",
  shortlist: "Kısa liste",
  testDrive: "Test sürüşü",
  rejected: "Elendi",
};

function renderCars() {
  tbody.innerHTML = "";
  let filtered = cars.filter(function (car) {
    const bodyOk = filterBody.value === "all" || car.bodyType === filterBody.value;
    const statusOk = filterStatus.value === "all" || car.status === filterStatus.value;
    return bodyOk && statusOk;
  });

  filtered.sort(function (a, b) {
    if (sortBy.value === "price") return a.price - b.price;
    if (sortBy.value === "range") return b.range - a.range;
    if (sortBy.value === "year") return b.year - a.year;
    return b.createdAt - a.createdAt;
  });
  if (cars.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Henüz araç eklenmedi.</td></tr>';
    return;
  }

  cars.forEach(function (car) {
    const tr = document.createElement("tr");

    if (car.status === "rejected") {
      tr.classList.add("is-rejected");
    }

    tr.innerHTML =
      '<td data-label="Fotoğraf"><img src="' + (car.imageUrl || "https://placehold.co/60x40") + '" alt="' + car.brand + '" class="car-thumb"></td>' +
      '<td data-label="Araç"><strong>' + car.brand + "</strong> " + car.model + (car.note ? '<span class="row-note">' + car.note + "</span>" : "") + "</td>" +
      '<td data-label="Yıl">' + car.year + "</td>" +
      '<td data-label="Kasa">' + car.bodyType + "</td>" +
      '<td data-label="Menzil">' + car.range + " km</td>" +
      '<td data-label="Fiyat">' + car.price.toLocaleString("tr-TR") + " TL</td>" +
      '<td data-label="Durum"><span class="badge badge-' + car.status + '">' + statusLabels[car.status] + "</span></td>" + 
      '<td class="row-actions"><button type="button" class="btn-icon" data-id="' + car.id + '">Sil</button></td>';

    tbody.appendChild(tr);
  });

    updateStats();
}





































tbody.addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-icon")) {
    const id = Number(e.target.dataset.id);
    cars = cars.filter(function (car) {
      return car.id !== id;
    });
    saveCars();
    renderCars();
  }
    else if (e.target.classList.contains("badge")) {
    const id = Number(e.target.closest("tr").querySelector(".btn-icon").dataset.id);
    const statusOrder = ["catalog", "shortlist", "testDrive", "rejected"];

    const car = cars.find(function (c) {
      return c.id === id;
    });

    const currentIndex = statusOrder.indexOf(car.status);
    car.status = statusOrder[(currentIndex + 1) % statusOrder.length];

    saveCars();
    renderCars();
  }
});

function updateStats() {
  document.getElementById("stat-total").textContent = cars.length;

  document.getElementById("stat-shortlist").textContent = cars.filter(function (car) {
    return car.status === "shortlist";
  }).length;

  document.getElementById("stat-rejected").textContent = cars.filter(function (car) {
    return car.status === "rejected";
  }).length;
}

filterBody.addEventListener("change", renderCars);
filterStatus.addEventListener("change", renderCars);
sortBy.addEventListener("change", renderCars);

renderCars();