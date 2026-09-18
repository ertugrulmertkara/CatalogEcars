let cars = [];
const API_URL = "http://localhost:3000/api/cars";

async function fetchCars(){

  try{
    const body = filterBody.value;
    const status = filterStatus.value;
    const sort = sortBy.value;
    const queryUrl = `${API_URL}?bodyType=${body}&status=${status}&sort=${sort}`;
    const response = await fetch(queryUrl); // responselar her zaman düz metindir 
    cars = await response.json();
    renderCars();
  }
  catch(error){
    console.error("Arabalar yüklenirken hata oluştu.", error.message)
  }
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
carForm.addEventListener("submit",async function (e) { // içine await yazıyorsak async functiondur
  e.preventDefault();

  const newCar = {
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
  
  };
  try{
    const response = await fetch(API_URL , { //git isteği getir(fetch) , (await) sakın boş gelme bekle
      method: "POST" , //veriyi yaz
      headers: {
        "Content-Type": "application/json" // içindeki veri json 
      },
      body: JSON.stringify(newCar) // obje taşıyamaz bu yüzden stringify ile metin kutusuna çeviriyoruz.
    });
    if(response.ok){
      fetchCars();
      carForm.reset();
      formPanel.hidden = true;
      toggleBtn.textContent = "+ Araç ekle";
    }
    else{
      console.error("Araç eklenirken bir hata oluştu.")

    }
    }

    catch (error){
        console.error("Sunucuya bağlanılamadı" , error);
    }
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
      '<td class="row-actions"><button type="button" class="btn-icon" data-id="' + car._id + '">Sil</button></td>';

    tbody.appendChild(tr);
  });

    updateStats();
}

tbody.addEventListener("click",async function (e) {
   if (e.target.classList.contains("btn-icon")) {
    const id = e.target.dataset.id;
    
    try {
      // 1. Backend'e "Bu id'li aracı sil" isteği atıyoruz
      const response = await fetch(API_URL + "/" + id, {
        method: "DELETE"
      });
      // 2. Silme başarılıysa tabloyu güncelle
      if (response.ok) {
        fetchCars(); 
      } else {
        console.error("Araç silinirken hata oluştu.");
      }
    } catch (error) {
      console.error("Sunucuya bağlanılamadı:", error);
    }
  }
     else if (e.target.classList.contains("badge")) {
    const id = e.target.closest("tr").querySelector(".btn-icon").dataset.id;
    const statusOrder = ["catalog", "shortlist", "testDrive", "rejected"];
    const car = cars.find(function (c) {
      return c._id === id;
    });
    const currentIndex = statusOrder.indexOf(car.status);
    const newStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    try {
      // Backend'e PATCH isteği at (sadece statüyü gönderiyoruz)
      const response = await fetch(API_URL + "/" + id + "/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchCars(); // Başarılıysa listeyi güncelle
      } else {
        console.error("Durum güncellenemedi.");
      }
    } catch (error) {
      console.error("Sunucuya bağlanılamadı:", error);
    }
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

filterBody.addEventListener("change", fetchCars);
filterStatus.addEventListener("change", fetchCars);
sortBy.addEventListener("change", fetchCars);
fetchCars();
