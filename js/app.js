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
let viewMode = "all"; // "all" | "mine" (Kendi İlanlarım) | "favs" (Kısa Listem)

// Veritabanından gelen metinleri HTML'e basmadan önce zararsız hale getirir (XSS koruması).
// Örn. not alanına <script> yazılırsa kod olarak değil, düz yazı olarak görünür.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- GÜVENLİK VE ROL YÖNETİMİ (RBAC) ---
// Not: Buradaki rol sadece arayüzü şekillendirmek içindir; asıl yetki kontrolü backend'de yapılır.
function getAuthData() {
  const token = localStorage.getItem("jwt_token");
  if (!token) return { role: 'guest', id: null };
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    // Süresi dolmuş token ile menüler görünüp istekler 403 almasın
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("jwt_token");
      return { role: 'guest', id: null };
    }
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
  menuLogout: document.getElementById("menu-logout"),
  fabContainer: document.getElementById("fab-container")
};

// --- AYARLAR (FAB) MENÜSÜ ---
function setFabOpen(isOpen) {
  UI.fabContainer.classList.toggle("is-open", isOpen);
  UI.fabMainBtn.setAttribute("aria-expanded", String(isOpen));
}

function setFabLabel(button, text) {
  button.querySelector(".fab-label").textContent = text;
}

// "Kendi İlanlarım" / "Kısa Listem" görünümlerini aç-kapa yapar.
// Asıl "cars" dizisi hiç değiştirilmez; ekrana sadece getVisibleCars() sonucu çizilir.
function setViewMode(mode) {
  viewMode = viewMode === mode ? "all" : mode;
  if (UI.menuMyCars) {
    UI.menuMyCars.classList.toggle("is-active", viewMode === "mine");
    setFabLabel(UI.menuMyCars, viewMode === "mine" ? "Tüm Araçlar" : "Kendi İlanlarım");
  }
  if (UI.menuMyFavs) {
    UI.menuMyFavs.classList.toggle("is-active", viewMode === "favs");
    setFabLabel(UI.menuMyFavs, viewMode === "favs" ? "Tüm Araçlar" : "Kısa Listem");
  }
  currentPage = 1;
  renderCars();
}

function getVisibleCars() {
  if (viewMode === "mine") return cars.filter(c => c.ownerId === currentUserId);
  if (viewMode === "favs") return cars.filter(c => c.status === "shortlist");
  return cars;
}

// --- YETKİ (OTORİTE) KONTROLLERİNİ UYGULA ---
function applySecurityRules() {
  if (userRole === 'guest') {
    if (UI.statShortlist) UI.statShortlist.parentElement.style.display = 'none';
    if (UI.statRejected) UI.statRejected.parentElement.style.display = 'none';
    if (UI.filterStatus && UI.filterStatus.parentElement) {
      UI.filterStatus.parentElement.style.display = 'none'; 
    }
    return;
  }

  // Giriş yapanlara ayarlar menüsünü göster
  UI.fabContainer.hidden = false;
  UI.menuMyFavs.hidden = false;
  UI.menuCompare.hidden = false;
  UI.menuLogout.hidden = false;

  // Sadece Bayi/Superadmin için "Araç Ekle" ve "Kendi İlanlarım" butonları
  if (userRole === 'dealer' || userRole === 'superadmin') {
    UI.toggleBtn.hidden = false;
    UI.menuMyCars.hidden = false;
  }

  // Menü Aç/Kapa
  UI.fabMainBtn.addEventListener("click", () => {
    setFabOpen(!UI.fabContainer.classList.contains("is-open"));
  });

  // Menü dışına tıklanınca veya Esc'ye basılınca kapat
  document.addEventListener("click", (e) => {
    if (!UI.fabContainer.contains(e.target)) setFabOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setFabOpen(false);
  });

  // Bir menü öğesine tıklanınca menüyü kapat
  UI.fabMenu.addEventListener("click", (e) => {
    if (e.target.closest(".fab-item")) setFabOpen(false);
  });

  // Menü İşlevleri
  UI.menuLogout.addEventListener("click", () => {
    localStorage.removeItem("jwt_token");
    window.location.href = "index.html";
  });

  UI.menuMyCars.addEventListener("click", () => setViewMode("mine"));
  UI.menuMyFavs.addEventListener("click", () => setViewMode("favs"));
  UI.menuCompare.addEventListener("click", openCompareModal);
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
    if (!response.ok) throw new Error("Sunucu " + response.status + " döndü");
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

let editingCarId = null;

// Formu kapatır ve düzenleme modundan çıkar (Ekle/Düzenle sonrası ve iptal için ortak)
function closeCarForm() {
  UI.carForm.reset();
  UI.formPanel.hidden = true;
  editingCarId = null;
  setFabLabel(UI.toggleBtn, "Araç Ekle");
  document.querySelector("#car-form button[type='submit']").textContent = "Ekle";
}

UI.toggleBtn.addEventListener("click", function () {
  if (!UI.formPanel.hidden) {
    closeCarForm();
    return;
  }
  UI.formPanel.hidden = false;
  setFabLabel(UI.toggleBtn, "Formu Kapat");
  UI.formPanel.scrollIntoView({ behavior: "smooth" });
});

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
  setFabLabel(UI.toggleBtn, "Düzenlemeyi İptal Et");
  document.querySelector("#car-form button[type='submit']").textContent = "Değişiklikleri Kaydet";
  UI.formPanel.scrollIntoView({ behavior: "smooth" });
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
      closeCarForm();
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
  const visibleCars = getVisibleCars();
  const totalPages = Math.ceil(visibleCars.length / CONFIG.ITEMS_PER_PAGE);
  updateStats();
  // 1. Boş Liste Durumu
  if (visibleCars.length === 0) {
    const emptyText = viewMode === "mine" ? "Henüz ilan eklemediniz."
      : viewMode === "favs" ? "Kısa listenizde araç yok."
      : "Aranan kriterlere uygun araç bulunamadı.";
    UI.tbody.innerHTML = '<tr><td colspan="8" class="empty-state">' + emptyText + '</td></tr>';
    updatePaginationUI(0); // İşi uzmana devrettik!
    return;
  }
  const currentCars = getPaginatedCars(visibleCars, totalPages);
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
  const totalPages = Math.ceil(getVisibleCars().length / CONFIG.ITEMS_PER_PAGE);
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
  
  window.updateCompareUI = function(boxNum) {
    const selectEl = document.getElementById('compare-select-' + boxNum);
    const contentEl = document.getElementById('compare-content-' + boxNum);
    const carId = selectEl.value;
    
    if (!carId) {
      contentEl.style.display = 'none';
      return;
    }
    
    const car = cars.find(c => c._id === carId);
    if (car) {
      document.getElementById('comp-img-' + boxNum).src = car.imageUrl || 'https://placehold.co/150';
      document.getElementById('comp-price-' + boxNum).textContent = car.price.toLocaleString() + ' TL';
      document.getElementById('comp-range-' + boxNum).textContent = car.range + ' km';
      document.getElementById('comp-battery-' + boxNum).textContent = (car.battery || '?') + ' kWh';
      document.getElementById('comp-drivetrain-' + boxNum).textContent = car.drivetrain || 'Bilinmiyor';
      contentEl.style.display = 'block';
    }
  };

  function openCompareModal() {
    let modal = document.getElementById('compare-modal');
    if (modal) modal.remove();

    const optionsHtml = cars.map(c => `<option value="${escapeHtml(c._id)}">${escapeHtml(c.brand)} ${escapeHtml(c.model)}</option>`).join('');
    
    const modalHtml = `
      <div id="compare-modal" class="compare-modal-overlay">
        <div class="compare-modal-card">
          <h2 class="compare-title">⚖️ Araç Karşılaştırma</h2>
          <div class="compare-grid">
            <!-- Araç 1 -->
            <div class="compare-item">
              <select id="compare-select-1" class="compare-select" onchange="window.updateCompareUI(1)">
                <option value="">1. Aracı Seçin</option>
                ${optionsHtml}
              </select>
              <div id="compare-content-1" style="display:none; text-align:center;">
                 <img id="comp-img-1" src="" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                 <div class="compare-stat"><span>Fiyat:</span> <strong id="comp-price-1"></strong></div>
                 <div class="compare-stat"><span>Menzil:</span> <strong id="comp-range-1"></strong></div>
                 <div class="compare-stat"><span>Batarya:</span> <strong id="comp-battery-1"></strong></div>
                 <div class="compare-stat"><span>Çekiş:</span> <strong id="comp-drivetrain-1"></strong></div>
              </div>
            </div>
            <!-- Araç 2 -->
            <div class="compare-item">
              <select id="compare-select-2" class="compare-select" onchange="window.updateCompareUI(2)">
                <option value="">2. Aracı Seçin</option>
                ${optionsHtml}
              </select>
              <div id="compare-content-2" style="display:none; text-align:center;">
                 <img id="comp-img-2" src="" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                 <div class="compare-stat"><span>Fiyat:</span> <strong id="comp-price-2"></strong></div>
                 <div class="compare-stat"><span>Menzil:</span> <strong id="comp-range-2"></strong></div>
                 <div class="compare-stat"><span>Batarya:</span> <strong id="comp-battery-2"></strong></div>
                 <div class="compare-stat"><span>Çekiş:</span> <strong id="comp-drivetrain-2"></strong></div>
              </div>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('compare-modal').remove()" class="btn btn-primary" style="width:100%; margin-top:25px; padding:15px; font-size:16px;">Kapat</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Favorileri otomatik seç (varsa)
    const favCars = cars.filter(c => c.status === 'shortlist');
    if (favCars.length >= 1) {
      document.getElementById('compare-select-1').value = favCars[0]._id;
      window.updateCompareUI(1);
    }
    if (favCars.length >= 2) {
      document.getElementById('compare-select-2').value = favCars[1]._id;
      window.updateCompareUI(2);
    }
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
        const data = await response.json().catch(() => ({}));
        alert("Araç silinemedi: " + (data.error || "Bilinmeyen hata."));
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
      closeCarForm(); // Formu temizle ve gizle
    } else {
      const data = await response.json().catch(() => ({}));
      alert("Araç eklenemedi: " + (data.error || "Bilinmeyen hata."));
    }
  } catch (error) {
    console.error("Sunucuya bağlanılamadı", error);
  }
}

function generateRowHtml(car){
  // Tüm veritabanı alanları escapeHtml'den geçer; resim yüklenemezse yedek görsel
  // tbody üzerindeki "error" dinleyicisi tarafından data-fallback'ten alınır (inline onerror yok).
  const fallbackUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(car.brand) + "&background=random&size=100";
  const id = escapeHtml(car._id);
  const status = CONFIG.STATUS_LABELS[car.status] ? car.status : "catalog";

  // ROL BAZLI TABLO GÖRÜNÜMÜ
  let statusHtml = `<span class="badge badge-${status}" style="cursor: pointer;" data-id="${id}">${CONFIG.STATUS_LABELS[status]}</span>`;
  let actionsHtml = ``;

  if (userRole === 'guest') {
    // Misafir: Durumları değiştiremez/göremez, Araç silemez. Sadece aracı inceler.
    statusHtml = `<span style="color: rgba(255, 255, 255, 0.3); font-size: 12px;">Gizli</span>`;
  } else if (userRole === 'superadmin' || (userRole === 'dealer' && car.ownerId === currentUserId)) {
    // Sadece superadmin VEYA aracı kendi ekleyen bayi silebilir/düzenleyebilir
    actionsHtml = `
      <button type="button" class="btn-icon edit-btn" style="color: #ffc107;" data-id="${id}">Düzenle</button>
      <button type="button" class="btn-icon delete-btn" data-id="${id}">Sil</button>
    `;
  }

  return `
    <td data-label="Fotoğraf"><img src="${escapeHtml(getOptimizedImageUrl(car.imageUrl))}" data-fallback="${escapeHtml(fallbackUrl)}" alt="${escapeHtml(car.brand)}" class="car-thumb" loading="lazy" referrerpolicy="no-referrer"></td>
    <td data-label="Araç"><strong>${escapeHtml(car.brand)}</strong> ${escapeHtml(car.model)} ${car.note ? '<span class="row-note">' + escapeHtml(car.note) + '</span>' : ''}</td>
    <td data-label="Yıl">${escapeHtml(car.year)}</td>
    <td data-label="Kasa">${escapeHtml(car.bodyType)}</td>
    <td data-label="Menzil">${escapeHtml(car.range)} km</td>
    <td data-label="Fiyat">${Number(car.price).toLocaleString("tr-TR")} TL</td>
    <td data-label="Durum">${statusHtml}</td>
    <td class="row-actions">${actionsHtml}</td>
  `;
}

// Tablodaki bir resim yüklenemezse yedek görsele geç (error olayı kabarcıklanmaz, bu yüzden capture=true)
UI.tbody.addEventListener("error", function (e) {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.fallback && img.src !== img.dataset.fallback) {
    img.src = img.dataset.fallback;
  }
}, true);

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

function getPaginatedCars(list, totalPages) {
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;
  
  const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
  
  return list.slice(startIndex, endIndex); // Sadece o sayfaya ait arabaları kes ve yolla
}
