// let , const , var değişken tanımlamak için kullanılır. let ve const ES6 ile gelmiştir. var eski sürümlerde kullanılırdı. let ve const block scope (sadece {} içinde geçerli) iken var function scope (sadece function içinde geçerli) dir.
// let içindeki değer sonradan değiştirilebilir. const içindeki değer sonradan değiştirilemez. var içindeki değer sonradan değiştirilebilir.
// `` backtick ile yazılan stringler template literal olarak adlandırılır. ${} ile değişkenler string içine gömülebilir.
// Sadece + işareti string'leri yapıştırır. Diğer matematik işlemleri string'i zorla Number'a çevirir.
// false ifadeler: 0, "", null, undefined, NaN
// equality operators: == (eşit mi), === (tipi ve değeri eşit mi), != (eşit değil mi), !== (tipi ve değeri eşit değil mi) === bunu kullan katıdır. 
//'use strict'; bu ifade ilk satıra yazılır amacı js'in katı olmasını sağlamaktır. Örn: değişken tanımlamadan kullanılamaz, debugging kolaylaştırır, performansı artırır.
// function expression: const myFunc = function() { ... } , function declaration: function myFunc() { ... } , neden kullanılır: function declaration hoisting yapar, function expression yapmaz.
// ARROW FUNCTION Yöntemi => const myFunc = () => { ... } , function expression ile aynı işlevi görür. this bağlamını korur.
// for (let i = 1; i <= x; i++)
// const benimButonum = document.querySelector('.btn-primary');class'ı btn-primary olan ilk elementi seçer. querySelectorAll('.btn-primary') class'ı btn-primary olan tüm elementleri seçer ve NodeList döndürür.
// const popUpKutusu = document.querySelector('#image-modal');id 'si image-modal olan ilk elementi seçer.

let cars = []; // isimlendirme mantığı şudur: ilk harf küçük sonraki her kelimenin ilk harfi büyüktür carPrice , asla sayıyla başlamaz
let currentPage = 1;
const itemsPerPage = 10;
const API_URL = "https://catalogecars.onrender.com/api/cars";

const imageModal = document.querySelector('#image-modal');
const modalImage = document.querySelector('#modal-image');
const closeModal = document.querySelector('#close-modal');


function getOptimizedImageUrl(url) {
  if (!url || !url.startsWith("http")) return "https://placehold.co/60x40";
  return url;
}

async function fetchCars(){

  try{
    const body = filterBody.value;
    const status = filterStatus.value;
    const sort = sortBy.value;
    const queryUrl = `${API_URL}?bodyType=${body}&status=${status}&sort=${sort}`;
    const response = await fetch(queryUrl); // responselar her zaman düz metindir 
    cars = await response.json();
    currentPage = 1; // Yeni filtre geldiğinde 1. sayfadan başla
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
    document.getElementById("page-info").textContent = "Sayfa 0 / 0";
    document.getElementById("prev-page-btn").disabled = true;
    document.getElementById("next-page-btn").disabled = true;
    return;
  }
  // --- Sayfalama Matematigi ---
  const totalPages = Math.ceil(cars.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCars = cars.slice(startIndex, endIndex); 
  // Tabloya sadece o 10 arabayı çiziyoruz
  currentCars.forEach(function (car) {
    const tr = document.createElement("tr");
    if (car.status === "rejected") {
      tr.classList.add("is-rejected");
    }
    const fallbackUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(car.brand) + "&background=random&size=100";
    tr.innerHTML =
      '<td data-label="Fotoğraf"><img src="' + getOptimizedImageUrl(car.imageUrl) + '" alt="' + car.brand + '" class="car-thumb" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + fallbackUrl + '\'"></td>' +
      '<td data-label="Araç"><strong>' + car.brand + "</strong> " + car.model + (car.note ? '<span class="row-note">' + car.note + "</span>" : "") + "</td>" +
      '<td data-label="Yıl">' + car.year + "</td>" +
      '<td data-label="Kasa">' + car.bodyType + "</td>" +
      '<td data-label="Menzil">' + car.range + " km</td>" +
      '<td data-label="Fiyat">' + car.price.toLocaleString("tr-TR") + " TL</td>" +
      '<td data-label="Durum"><span class="badge badge-' + car.status + '">' + statusLabels[car.status] + "</span></td>" + 
      '<td class="row-actions"><button type="button" class="btn-icon" data-id="' + car._id + '">Sil</button></td>';
    tbody.appendChild(tr);
  });
  // Butonları ve sayfa yazısını güncelle
  document.getElementById("page-info").textContent = "Sayfa " + currentPage + " / " + totalPages;
  document.getElementById("prev-page-btn").disabled = (currentPage === 1);
  document.getElementById("next-page-btn").disabled = (currentPage === totalPages);
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
  else if (e.target.classList.contains("car-thumb")) {
    modalImage.src = e.target.src;
    const satir = e.target.closest("tr");
    const markaText = satir.querySelector('td[data-label="Araç"]').textContent;
    const fiyatText = satir.querySelector('td[data-label="Fiyat"]').textContent;
    const yilText = satir.querySelector('td[data-label="Yıl"]').textContent;
    const menzilText = satir.querySelector('td[data-label="Menzil"]').textContent;

    document.querySelector('#modal-brand').textContent = markaText;
    document.querySelector('#modal-price').textContent = fiyatText;
    document.querySelector('#modal-year').textContent = yilText;
    document.querySelector('#modal-range').textContent = menzilText;

    imageModal.classList.remove("modal-hidden");


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

// --- Sayfalama Buton Dinleyicileri ---
document.getElementById("prev-page-btn").addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    renderCars();
    window.scrollTo({ top: 0, behavior: "smooth" }); // Sayfanın en tepesine yumuşakça kaydır
  }
});

document.getElementById("next-page-btn").addEventListener("click", function () {
  const totalPages = Math.ceil(cars.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderCars();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});


closeModal.addEventListener('click', function () {
  imageModal.classList.add('modal-hidden');
}); 

imageModal.addEventListener("click", function(e) {
  if (e.target.id === "image-modal") {
    imageModal.classList.add("modal-hidden");
  }
});
