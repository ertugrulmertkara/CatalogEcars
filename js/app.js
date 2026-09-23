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

// --- UYGULAMA AYARLARI (CONFIG) ---
const CONFIG = {
  API_URL: "https://catalogecars.onrender.com/api/cars",
  ITEMS_PER_PAGE: 10,
  STATUS_ORDER: ["catalog", "shortlist", "testDrive", "rejected"],
  STATUS_LABELS: {
    catalog: "Katalog",
    shortlist: "Kısa liste",
    testDrive: "Test sürüşü",
    rejected: "Elendi"
  }
};

let cars = []; // isimlendirme mantığı şudur: ilk harf küçük sonraki her kelimenin ilk harfi büyüktür carPrice , asla sayıyla başlamaz
let currentPage = 1;

// --- GÜVENLİK VE ROL YÖNETİMİ (RBAC) ---
function getAuthRole() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return 'guest'; // Giriş yapmamışsa direkt misafir
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'user';
  } catch (e) {
    return 'guest';
  }
}
const userRole = getAuthRole();

// --- DOM ELEMENTS (HTML Bağlantıları) ---
const UI = {
  imageModal: document.querySelector('#image-modal'),
  modalImage: document.querySelector('#modal-image'),
  closeModal: document.querySelector('#close-modal'),
  toggleBtn: document.getElementById("toggle-form-btn"),
  formPanel: document.getElementById("add-car-panel"),
  filterBody: document.getElementById("filter-body"),
  filterStatus: document.getElementById("filter-status"),
  sortBy: document.getElementById("sort-by"),
  carForm: document.getElementById("car-form"),
  tbody: document.getElementById("car-tbody"),
  pageInfo: document.getElementById("page-info"),
  prevPageBtn: document.getElementById("prev-page-btn"),
  nextPageBtn: document.getElementById("next-page-btn"),
  statTotal: document.getElementById("stat-total"),
  statShortlist: document.getElementById("stat-shortlist"),
  statRejected: document.getElementById("stat-rejected"),
  filterBrand: document.getElementById("filter-brand"),
  toggleFiltersBtn: document.getElementById("toggle-filters-btn"),
  filtersPanel: document.getElementById("filters-panel"),
  applyFiltersBtn: document.getElementById("apply-filters-btn"),
  filterDrivetrain: document.getElementById("filter-drivetrain"),
  filterMinPrice: document.getElementById("filter-min-price"),
  filterMaxPrice: document.getElementById("filter-max-price"),
  filterMinRange: document.getElementById("filter-min-range"),
  filterMaxRange: document.getElementById("filter-max-range"),
  searchInput: document.getElementById("searchInput")
};

// --- YETKİ (OTORİTE) KONTROLLERİNİ UYGULA ---
function applySecurityRules() {
  // Eğer Bayi değilse, "Araç Ekle" butonunu ve panelini tamamen gizle
  if (userRole !== 'dealer') {
    if (UI.toggleBtn) UI.toggleBtn.style.display = 'none';
    if (UI.formPanel) UI.formPanel.style.display = 'none';
  }
  
  // Eğer Misafir ise (Giriş yapmamışsa)
  if (userRole === 'guest') {
    // Kısa liste ve Elenen istatistiklerini gizle (Sadece Toplam Araç kalsın)
    if (UI.statShortlist) UI.statShortlist.parentElement.style.display = 'none';
    if (UI.statRejected) UI.statRejected.parentElement.style.display = 'none';
    if (UI.filterStatus && UI.filterStatus.parentElement) {
      UI.filterStatus.parentElement.style.display = 'none'; // Statü filtresini de gizle
    }
  }
}
applySecurityRules();

async function fetchCars(){
  try{
    const brand = UI.filterBrand.value;
    const body = UI.filterBody.value;
    const status = UI.filterStatus.value;
    const drivetrain = UI.filterDrivetrain.value;
    const sortValue = UI.sortBy.value;
    const minPrice = UI.filterMinPrice.value;
    const maxPrice = UI.filterMaxPrice.value;
    const minRange = UI.filterMinRange.value;
    const maxRange = UI.filterMaxRange.value;
    const searchValue = UI.searchInput ? UI.searchInput.value.trim() : "";
    const [sort, order] = sortValue.split("-");
    
    const params = new URLSearchParams({
      brand: brand,
      bodyType: body,
      status: status,
      sort: sort,
      order: order,
      minPrice: minPrice,
      maxPrice: maxPrice,
      minRange: minRange,
      maxRange: maxRange,
      drivetrain: drivetrain,
      search: searchValue
    });

    const queryUrl = `${CONFIG.API_URL}?${params.toString()}`;
    const response = await fetch(queryUrl); // responselar her zaman düz metindir 
    cars = await response.json();
    currentPage = 1; // Yeni filtre geldiğinde 1. sayfadan başla
    renderCars();
  }
  catch(error){
    console.error("Arabalar yüklenirken hata oluştu.", error.message)
  }
}

UI.toggleBtn.addEventListener("click", function () {
  UI.formPanel.hidden = !UI.formPanel.hidden;
   if (UI.formPanel.hidden) {
    UI.toggleBtn.textContent = "+ Araç ekle";
  } else {
    UI.toggleBtn.textContent = "✕ Kapat";
  }
});

UI.carForm.addEventListener("submit",async function (e) { // içine await yazıyorsak async functiondur
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
  addCar(newCar);
});

function renderCars() {
   UI.tbody.innerHTML = "";
  const totalPages = Math.ceil(cars.length / CONFIG.ITEMS_PER_PAGE);
  // 1. Boş Liste Durumu
  if (cars.length === 0) {
    UI.tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Henüz araç eklenmedi.</td></tr>';
    updatePaginationUI(0); // İşi uzmana devrettik!
    return;
  }
  const currentCars = getPaginatedCars(totalPages);
  // 3. Ekrana Çizme
  currentCars.forEach(function (car) {
    const tr = document.createElement("tr");
    if (car.status === "rejected") {
      tr.classList.add("is-rejected");
    }
    tr.innerHTML = generateRowHtml(car);
    UI.tbody.appendChild(tr);
  });
  // 4. Alt Kısım Güncellemeleri
  updatePaginationUI(totalPages); // İşi uzmana devrettik!
  updateStats()
  }


UI.tbody.addEventListener("click",async function (e) {
   if (e.target.classList.contains("btn-icon")) {
    const id = e.target.dataset.id;
    deleteCar(id);
    
  }
     else if (e.target.classList.contains("badge")) {
    const id = e.target.closest("tr").querySelector(".btn-icon").dataset.id;
    UpdateCarStatus(id);
  }

  else if (e.target.classList.contains("car-thumb")) {
    openMobileCard(e.target);
  }
});

function updateStats() {
  UI.statTotal.textContent = cars.length;

  UI.statShortlist.textContent = cars.filter(function (car) {
    return car.status === "shortlist";
  }).length;

  UI.statRejected.textContent = cars.filter(function (car) {
    return car.status === "rejected";
  }).length;
}

UI.toggleFiltersBtn.addEventListener("click", function () {
  UI.filtersPanel.classList.toggle("is-open");
  document.getElementById("drawer-overlay").classList.toggle("is-open");
});

function closeDrawer() {
  UI.filtersPanel.classList.remove("is-open");
  document.getElementById("drawer-overlay").classList.remove("is-open");
}

document.getElementById("close-drawer-btn").addEventListener("click", closeDrawer);
document.getElementById("drawer-overlay").addEventListener("click", closeDrawer);

UI.applyFiltersBtn.addEventListener("click", function () {
  fetchCars();
  closeDrawer();
});

UI.sortBy.addEventListener("change", fetchCars);

// Arama kutusu için Debounce (Yazarken her harfte istek atmasını engeller, yazmayı bitirince atar)
let searchTimeout;
if (UI.searchInput) {
  UI.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchCars();
    }, 400); // Kullanıcı yazmayı bıraktıktan 400ms sonra arama yapar
  });
}

fetchCars();

// --- Sayfalama Buton Dinleyicileri ---
UI.prevPageBtn.addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    renderCars();
    window.scrollTo({ top: 0, behavior: "smooth" }); // Sayfanın en tepesine yumuşakça kaydır
  }
});

UI.nextPageBtn.addEventListener("click", function () {
  const totalPages = Math.ceil(cars.length / CONFIG.ITEMS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderCars();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});


UI.closeModal.addEventListener('click', function () {
  UI.imageModal.classList.add('modal-hidden');
}); 

UI.imageModal.addEventListener("click", function(e) {
  if (e.target.id === "image-modal") {
    UI.imageModal.classList.add("modal-hidden");
  }
});
// FUNCTIONS // 
 function openMobileCard(imageTarget){
    UI.modalImage.src = imageTarget.src; // Hatayi burada duzelttik
    const satir = imageTarget.closest("tr");
    const markaText = satir.querySelector('td[data-label="Araç"]').textContent;
    const fiyatText = satir.querySelector('td[data-label="Fiyat"]').textContent;
    const yilText = satir.querySelector('td[data-label="Yıl"]').textContent;
    const menzilText = satir.querySelector('td[data-label="Menzil"]').textContent;

    document.querySelector('#modal-brand').textContent = markaText;
    document.querySelector('#modal-price').textContent = fiyatText;
    document.querySelector('#modal-year').textContent = yilText;
    document.querySelector('#modal-range').textContent = menzilText;

    UI.imageModal.classList.remove("modal-hidden");


  }
    async function UpdateCarStatus(id) {  
  
    const car = cars.find(function (c) {
      return c._id === id;
    });
    const currentIndex = CONFIG.STATUS_ORDER.indexOf(car.status);
    const newStatus = CONFIG.STATUS_ORDER[(currentIndex + 1) % CONFIG.STATUS_ORDER.length];
    try {
      // Backend'e PATCH isteği at (sadece statüyü gönderiyoruz)
      const response = await fetch(CONFIG.API_URL + "/" + id + "/status", {
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

  async function deleteCar(id) {
    try {
      // 1. Backend'e "Bu id'li aracı sil" isteği atıyoruz
      const response = await fetch(CONFIG.API_URL + "/" + id, {
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

  async function addCar(newCar) {
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCar)
    });
    
    if (response.ok) {
      fetchCars(); // Başarılıysa tabloyu güncelle
      UI.carForm.reset(); // Formu temizle
      UI.formPanel.hidden = true; // Paneli gizle
      UI.toggleBtn.textContent = "+ Araç ekle"; // Buton yazısını düzelt
    } else {
      console.error("Araç eklenirken bir hata oluştu.");
    }
  } catch (error) {
    console.error("Sunucuya bağlanılamadı", error);
  }
}

function generateRowHtml(car){
  const fallbackUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(car.brand) + "&background=random&size=100";

  // ROL BAZLI TABLO GÖRÜNÜMÜ
  let statusHtml = `<span class="badge badge-${car.status}">${CONFIG.STATUS_LABELS[car.status]}</span>`;
  let actionsHtml = `<button type="button" class="btn-icon" data-id="${car._id}">Sil</button>`;

  if (userRole === 'guest') {
    // Misafir: Durumları değiştiremez/göremez, Araç silemez. Sadece aracı inceler.
    statusHtml = `<span style="color: rgba(255, 255, 255, 0.3); font-size: 12px;">Gizli</span>`;
    actionsHtml = ``; 
  } else if (userRole === 'user') {
    // Bireysel Kullanıcı: Araç silemez, ama statü değiştirebilir (badge'e tıklayabilir).
    actionsHtml = ``;
  }

   return `
    <td data-label="Fotoğraf"><img src="${getOptimizedImageUrl(car.imageUrl)}" alt="${car.brand}" class="car-thumb" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${fallbackUrl}'"></td>
    <td data-label="Araç"><strong>${car.brand}</strong> ${car.model} ${car.note ? '<span class="row-note">' + car.note + '</span>' : ''}</td>
    <td data-label="Yıl">${car.year}</td>
    <td data-label="Kasa">${car.bodyType}</td>
    <td data-label="Menzil">${car.range} km</td>
    <td data-label="Fiyat">${car.price.toLocaleString("tr-TR")} TL</td>
    <td data-label="Durum">${statusHtml}</td>
    <td class="row-actions">${actionsHtml}</td>
  `;
}
function getOptimizedImageUrl(url) {
  if (!url || !url.startsWith("http")) return "https://placehold.co/60x40";
  return url;
}

function updatePaginationUI(totalPages) {
  // Eğer hiç araba yoksa (totalPages 0 ise) ekranda Sayfa 0/0 yerine 1/1 yazsın
  const displayTotal = totalPages === 0 ? 1 : totalPages;
  
  UI.pageInfo.textContent = "Sayfa " + currentPage + " / " + displayTotal;
  UI.prevPageBtn.disabled = (currentPage === 1);
  UI.nextPageBtn.disabled = (currentPage === displayTotal || displayTotal === 0);
}

function getPaginatedCars(totalPages) {
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
  
  return cars.slice(startIndex, endIndex); // Sadece o sayfaya ait arabaları kes ve yolla
}
