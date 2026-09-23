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
function getAuthData() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return { role: 'guest', id: null };
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { role: payload.role || 'user', id: payload.id || null };
  } catch (e) {
    return { role: 'guest', id: null };
  }
}
const authData = getAuthData();
const userRole = authData.role;
const currentUserId = authData.id;

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
  searchInput: document.getElementById("searchInput"),
  fabMainBtn: document.getElementById("fab-main-btn"),
  fabMenu: document.getElementById("fab-menu"),
  menuMyCars: document.getElementById("menu-my-cars"),
  menuMyFavs: document.getElementById("menu-my-favs"),
  menuCompare: document.getElementById("menu-compare"),
  menuLogout: document.getElementById("menu-logout")
};

// --- YETKİ (OTORİTE) KONTROLLERİNİ UYGULA ---
function applySecurityRules() {
  if (userRole === 'guest') {
    if (UI.statShortlist) UI.statShortlist.parentElement.style.display = 'none';
    if (UI.statRejected) UI.statRejected.parentElement.style.display = 'none';
    if (UI.filterStatus && UI.filterStatus.parentElement) {
      UI.filterStatus.parentElement.style.display = 'none'; 
    }
  } else {
    // Giriş yapanlara Ana FAB Butonunu göster
    if (UI.fabMainBtn) UI.fabMainBtn.style.display = 'flex';
    if (UI.menuMyFavs) UI.menuMyFavs.style.display = 'block';
    if (UI.menuCompare) UI.menuCompare.style.display = 'block';
    if (UI.menuLogout) UI.menuLogout.style.display = 'block';

    // Sadece Bayi/Superadmin için "Araç Ekle" ve "Kendi İlanlarım" butonları
    if (userRole === 'dealer' || userRole === 'superadmin') {
      if (UI.toggleBtn) UI.toggleBtn.style.display = 'block';
      if (UI.menuMyCars) UI.menuMyCars.style.display = 'block';
    }

    // FAB Menü Aç/Kapa
    if (UI.fabMainBtn) {
      UI.fabMainBtn.addEventListener("click", () => {
        const isOpen = UI.fabMenu.style.opacity === "1";
        UI.fabMenu.style.opacity = isOpen ? "0" : "1";
        UI.fabMenu.style.pointerEvents = isOpen ? "none" : "auto";
        UI.fabMenu.style.transform = isOpen ? "translateY(20px)" : "translateY(0)";
        UI.fabMainBtn.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
      });
    }

    // Menü İşlevleri
    if (UI.menuLogout) {
      UI.menuLogout.addEventListener("click", () => {
        localStorage.removeItem("jwt_token");
        window.location.href = "index.html";
      });
    }

    if (UI.menuMyCars) {
      UI.menuMyCars.addEventListener("click", () => {
        // Tabloyu filtrele: Sadece ownerId'si benim olanlar
        const myCars = cars.filter(c => c.ownerId === currentUserId);
        UI.fabMainBtn.click();
        // Hızlı bir hack ile sayfayı 1'e çekip sadece bu araçları çizdirebiliriz
        // (Gerçekte backend query yapılmalı ama şimdilik client-side render)
        const oldCars = [...cars];
        cars = myCars;
        currentPage = 1;
        renderCars();
        cars = oldCars; // Asıl listeyi bozma, sadece ekrana çizdirirken myCars'ı kullandık
      });
    }

    if (UI.menuMyFavs) {
      UI.menuMyFavs.addEventListener("click", () => {
        const favCars = cars.filter(c => c.status === 'shortlist');
        UI.fabMainBtn.click();
        const oldCars = [...cars];
        cars = favCars;
        currentPage = 1;
        renderCars();
        cars = oldCars; 
      });
    }

    if (UI.menuCompare) {
      UI.menuCompare.addEventListener("click", () => {
        UI.fabMainBtn.click();
        const favCars = cars.filter(c => c.status === 'shortlist');
        
        if(favCars.length < 2) {
          alert("Karşılaştırma yapabilmek için 'Kısa Liste'nizde en az 2 araç bulunmalıdır. Lütfen tablodan 2 aracı Kısa Listeye ekleyip tekrar deneyin.");
          return;
        }

        const car1 = favCars[0];
        const car2 = favCars[1];
        
        // Basit bir Modal veya Alert yerine ekranın ortasında div oluşturalım
        const compareHtml = `
          <div id="compare-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(10px);">
            <div style="background:var(--color-surface); padding:30px; border-radius:15px; border:1px solid var(--color-border); max-width:800px; width:90%; color:white;">
              <h2 style="text-align:center; color:var(--color-accent); margin-bottom:20px;">Araç Karşılaştırma</h2>
              <div style="display:flex; justify-content:space-between; gap:20px;">
                <!-- Araç 1 -->
                <div style="flex:1; text-align:center; background:rgba(255,255,255,0.05); padding:20px; border-radius:10px;">
                  <img src="${car1.imageUrl || 'https://placehold.co/150'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                  <h3 style="margin-bottom:10px;">${car1.brand} ${car1.model}</h3>
                  <p><strong>Fiyat:</strong> ${car1.price.toLocaleString()} TL</p>
                  <p><strong>Menzil:</strong> ${car1.range} km</p>
                  <p><strong>Batarya:</strong> ${car1.battery || '?'} kWh</p>
                  <p><strong>Çekiş:</strong> ${car1.drivetrain || 'Bilinmiyor'}</p>
                </div>
                <!-- Araç 2 -->
                <div style="flex:1; text-align:center; background:rgba(255,255,255,0.05); padding:20px; border-radius:10px;">
                  <img src="${car2.imageUrl || 'https://placehold.co/150'}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                  <h3 style="margin-bottom:10px;">${car2.brand} ${car2.model}</h3>
                  <p><strong>Fiyat:</strong> ${car2.price.toLocaleString()} TL</p>
                  <p><strong>Menzil:</strong> ${car2.range} km</p>
                  <p><strong>Batarya:</strong> ${car2.battery || '?'} kWh</p>
                  <p><strong>Çekiş:</strong> ${car2.drivetrain || 'Bilinmiyor'}</p>
                </div>
              </div>
              <button onclick="document.getElementById('compare-modal').remove()" class="btn-primary" style="width:100%; margin-top:20px; padding:12px; border-radius:8px; font-weight:bold;">Kapat</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', compareHtml);
      });
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
    const response = await fetch(queryUrl); 
    let fetchedCars = await response.json();

    // EĞER KULLANICI İSE KENDİ KİŞİSEL LİSTESİNİ (Kısa Liste vs.) ÇEK VE BİRLEŞTİR
    if (userRole === 'user') {
      try {
        const token = localStorage.getItem("jwt_token");
        const listRes = await fetch(CONFIG.API_URL.replace("/cars", "/users/me/list"), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (listRes.ok) {
          const personalList = await listRes.json();
          fetchedCars.forEach(car => {
            car.status = "catalog"; // Kullanıcılar için araba varsayılan olarak katalogdadır
            const personalItem = personalList.find(item => item.carId === car._id);
            if (personalItem) car.status = personalItem.status;
          });
        }
      } catch (err) {
        console.error("Kişisel liste çekilemedi", err);
      }
    }
    cars = fetchedCars;

    currentPage = 1; 
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

let editingCarId = null;

UI.carForm.addEventListener("submit",async function (e) { 
  e.preventDefault();
  
  const carData = {
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

  if (editingCarId) {
    editCar(editingCarId, carData);
  } else {
    addCar(carData);
  }
});

function openEditModal(id) {
  const car = cars.find(c => c._id === id);
  if (!car) return;

  editingCarId = id;
  document.getElementById("brand").value = car.brand;
  document.getElementById("model").value = car.model;
  document.getElementById("year").value = car.year;
  document.getElementById("bodyType").value = car.bodyType;
  document.getElementById("drivetrain").value = car.drivetrain || "";
  document.getElementById("range").value = car.range;
  document.getElementById("battery").value = car.battery || "";
  document.getElementById("price").value = car.price;
  document.getElementById("status").value = car.status;
  document.getElementById("imageUrl").value = car.imageUrl || "";
  document.getElementById("link").value = car.link || "";
  document.getElementById("note").value = car.note || "";

  UI.formPanel.hidden = false;
  if(UI.toggleBtn) UI.toggleBtn.textContent = "✕ Düzenlemeyi İptal Et";
  document.querySelector("#car-form button[type='submit']").textContent = "Değişiklikleri Kaydet";
}

async function editCar(id, updatedCar) {
  try {
    const token = localStorage.getItem("jwt_token");
    const response = await fetch(CONFIG.API_URL + "/" + id, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(updatedCar)
    });
    
    if (response.ok) {
      fetchCars();
      UI.carForm.reset();
      UI.formPanel.hidden = true;
      editingCarId = null;
      if(UI.toggleBtn) UI.toggleBtn.textContent = "+ Araç ekle";
      document.querySelector("#car-form button[type='submit']").textContent = "Aracı Kaydet";
    } else {
      const data = await response.json();
      alert("Hata: " + data.error);
    }
  } catch (error) {
    console.error("Sunucuya bağlanılamadı", error);
  }
}

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
   if (e.target.classList.contains("delete-btn")) {
    const id = e.target.dataset.id;
    if(confirm("Bu aracı silmek istediğinize emin misiniz?")) deleteCar(id);
  } else if (e.target.classList.contains("edit-btn")) {
    const id = e.target.dataset.id;
    openEditModal(id);
  }
     else if (e.target.classList.contains("badge")) {
    const id = e.target.dataset.id; // btn-icon sildiğimiz için ID'yi direkt badge'den okuyoruz
    if (id) UpdateCarStatus(id);
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
      const token = localStorage.getItem("jwt_token");
      const canEditGlobally = userRole === 'dealer' || userRole === 'superadmin';
      
      // Kullanıcıysa kişisel listesine yaz, Bayi/Superadmin ise global listeye (PATCH)
      const endpoint = canEditGlobally ? `${CONFIG.API_URL}/${id}/status` : CONFIG.API_URL.replace("/cars", "/users/me/list");
      const method = canEditGlobally ? "PATCH" : "POST";
      const bodyPayload = canEditGlobally ? { status: newStatus } : { carId: id, status: newStatus };

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      if (response.ok) {
        fetchCars(); 
      } else {
        const data = await response.json();
        alert("Durum güncellenemedi: " + (data.error || "Yetkiniz yok."));
      }
    } catch (error) {
      console.error("Sunucuya bağlanılamadı:", error);
    }
  }

  async function deleteCar(id) {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch(CONFIG.API_URL + "/" + id, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
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
    const token = localStorage.getItem("jwt_token");
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
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
  let statusHtml = `<span class="badge badge-${car.status}" style="cursor: pointer;" data-id="${car._id}">${CONFIG.STATUS_LABELS[car.status]}</span>`;
  let actionsHtml = ``;

  if (userRole === 'guest') {
    // Misafir: Durumları değiştiremez/göremez, Araç silemez. Sadece aracı inceler.
    statusHtml = `<span style="color: rgba(255, 255, 255, 0.3); font-size: 12px;">Gizli</span>`;
  } else if (userRole === 'superadmin' || (userRole === 'dealer' && car.ownerId === currentUserId)) {
    // Sadece superadmin VEYA aracı kendi ekleyen bayi silebilir/düzenleyebilir
    actionsHtml = `
      <button type="button" class="btn-icon edit-btn" style="color: #ffc107;" data-id="${car._id}">Düzenle</button>
      <button type="button" class="btn-icon delete-btn" data-id="${car._id}">Sil</button>
    `;
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
