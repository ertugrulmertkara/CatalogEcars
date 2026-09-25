// =====================================================================
//  Sessiz Seçim — Katalog sayfası (index.html)
//  Araçları kart olarak listeler; filtre, arama, sıralama, karşılaştırma,
//  kişisel liste (kısa liste vb.), bayi ilan yönetimi ve tema geçişi.
// =====================================================================

// --- UYGULAMA AYARLARI (CONFIG) ---
const CONFIG = {
  API_URL: "https://catalogecars.onrender.com/api/cars",
  LIST_URL: "https://catalogecars.onrender.com/api/users/me/list",
  PAGE_SIZE: 12, // "Daha fazla göster" her basışta bu kadar araç ekler
  PENDING_KEY: "pending_shortlist", // misafirin kayıttan önce eklemek istediği araç
  STATUS_LABELS: {
    catalog: "Katalog",
    shortlist: "Kısa liste",
    testDrive: "Test sürüşü",
    rejected: "Elendi"
  }
};

// --- DURUM (STATE) ---
let cars = [];                      // sunucudan gelen araçlar (filtre ve sıralama uygulanmış)
let visibleCount = CONFIG.PAGE_SIZE; // ekranda gösterilen kart sayısı
let viewMode = "all";               // "all" | "mine" (Kendi İlanlarım) | "favs" (Kısa Listem)
let compareIds = [];                // karşılaştırma için seçilen en fazla 2 aracın id'si
let editingCarId = null;            // formda düzenlenen aracın id'si (yeni araçta null)
let pendingHandled = false;         // bekleyen kısa liste isteği bir kez işlensin

// Veritabanından gelen metinleri HTML'e basmadan önce zararsız hale getirir (XSS koruması).
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- KİMLİK (Buradaki rol sadece arayüzü şekillendirir; asıl yetki kontrolü backend'de) ---
function getAuthData() {
  const guest = { role: "guest", id: null, username: "" };
  const token = localStorage.getItem("jwt_token");
  if (!token) return guest;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("jwt_token"); // süresi dolmuş oturum
      return guest;
    }
    return { role: payload.role || "user", id: payload.id || null, username: payload.username || "" };
  } catch (e) {
    return guest;
  }
}

const auth = getAuthData();
const isGuest = auth.role === "guest";
const canManageListings = auth.role === "dealer" || auth.role === "superadmin";

function authHeaders(json = true) {
  const headers = { Authorization: `Bearer ${localStorage.getItem("jwt_token")}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

// --- İKONLAR ---
const ICONS = {
  range: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  power: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/></svg>',
  battery: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/></svg>',
  edit: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  chevron: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  bookmark: '<svg class="icon prompt-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
};

// --- DOM ELEMANLARI ---
const $ = (id) => document.getElementById(id);
const UI = {
  themeToggle: $("theme-toggle"),
  guestActions: $("guest-actions"),
  userActions: $("user-actions"),
  userName: $("user-name"),
  logoutBtn: $("logout-btn"),
  hero: $("hero"),
  summary: $("summary"),
  statTotal: $("stat-total"),
  statShortlist: $("stat-shortlist"),
  statRejected: $("stat-rejected"),
  statShortlistCard: $("stat-shortlist-card"),
  searchInput: $("searchInput"),
  sortBy: $("sort-by"),
  toggleFiltersBtn: $("toggle-filters-btn"),
  compareOpenBtn: $("compare-open-btn"),
  resultCount: $("result-count"),
  activeFilters: $("active-filters"),
  grid: $("car-grid"),
  emptyState: $("empty-state"),
  errorState: $("error-state"),
  clearFiltersBtn: $("clear-filters-btn"),
  loadMoreBtn: $("load-more-btn"),
  compareBar: $("compare-bar"),
  compareBarText: $("compare-bar-text"),
  compareBarClear: $("compare-bar-clear"),
  compareBarOpen: $("compare-bar-open"),
  overlay: $("drawer-overlay"),
  drawer: $("filters-panel"),
  closeDrawerBtn: $("close-drawer-btn"),
  applyFiltersBtn: $("apply-filters-btn"),
  resetFiltersBtn: $("reset-filters-btn"),
  filterStatusField: $("filter-status-field"),
  modal: $("modal"),
  modalBody: $("modal-body"),
  carFormTemplate: $("car-form-template"),
  statusMenu: $("status-menu"),
  fabContainer: $("fab-container"),
  fabBackdrop: $("fab-backdrop"),
  fabMenu: $("fab-menu"),
  fabMainBtn: $("fab-main-btn"),
  menuAddCar: $("menu-add-car"),
  menuMyCars: $("menu-my-cars"),
  menuMyFavs: $("menu-my-favs"),
  menuLogout: $("menu-logout")
};

// Filtre alanları: çekmecedeki her filtrenin API parametresi ve etiket metni
const FILTERS = [
  { el: $("filter-body"), param: "bodyType", label: (v) => v },
  { el: $("filter-brand"), param: "brand", label: (v, el) => el.selectedOptions[0].textContent },
  { el: $("filter-drivetrain"), param: "drivetrain", label: (v) => v },
  { el: $("filter-status"), param: "status", label: (v) => CONFIG.STATUS_LABELS[v] },
  { el: $("filter-min-price"), param: "minPrice", label: (v) => `En az ${formatPrice(v)} TL` },
  { el: $("filter-max-price"), param: "maxPrice", label: (v) => `En çok ${formatPrice(v)} TL` },
  { el: $("filter-min-range"), param: "minRange", label: (v) => `En az ${v} km` },
  { el: $("filter-max-range"), param: "maxRange", label: (v) => `En çok ${v} km` }
];

// Bir filtre "Hepsi" ya da boş değilse aktiftir
function isFilterActive(filter) {
  return filter.el.value !== "" && filter.el.value !== "all";
}

function resetFilter(filter) {
  filter.el.value = filter.el.tagName === "SELECT" ? "all" : "";
}

// =====================================================================
//  TEMA
// =====================================================================
UI.themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch (e) { /* gizli sekmede kayıt yapılamayabilir */ }
});

// =====================================================================
//  ROL'E GÖRE ARAYÜZ
// =====================================================================
function setupRoleUI() {
  if (isGuest) {
    UI.guestActions.hidden = false;
    UI.hero.hidden = false;
    // Misafirin kişisel listesi olmadığı için "Durum" filtresi anlamsız
    UI.filterStatusField.hidden = true;
    return;
  }

  UI.userActions.hidden = false;
  UI.userName.textContent = auth.username;
  UI.summary.hidden = false;
  UI.fabContainer.hidden = false;
  document.body.classList.add("has-fab"); // mobilde karşılaştırma çubuğu dişli butona binmesin

  if (canManageListings) {
    UI.menuAddCar.hidden = false;
    UI.menuMyCars.hidden = false;
  }

  UI.logoutBtn.addEventListener("click", logout);
  UI.menuLogout.addEventListener("click", logout);
  UI.menuAddCar.addEventListener("click", () => openCarForm(null));
  UI.menuMyCars.addEventListener("click", () => setViewMode("mine"));
  UI.menuMyFavs.addEventListener("click", () => setViewMode("favs"));
  UI.statShortlistCard.addEventListener("click", () => setViewMode("favs"));
  setupFab();
}

function logout() {
  localStorage.removeItem("jwt_token");
  window.location.href = "index.html";
}

// =====================================================================
//  VERİ
// =====================================================================
function buildQuery() {
  const [sort, order] = UI.sortBy.value.split("-");
  const params = new URLSearchParams({ sort, order });
  FILTERS.forEach((f) => {
    if (isFilterActive(f) && f.param !== "status") params.set(f.param, f.el.value);
  });
  const search = UI.searchInput.value.trim();
  if (search) params.set("search", search);
  return params.toString();
}

async function fetchCars() {
  try {
    const response = await fetch(`${CONFIG.API_URL}?${buildQuery()}`);
    if (!response.ok) throw new Error("Sunucu " + response.status + " döndü");
    const fetchedCars = await response.json();

    // Durumlar (kısa liste vb.) her kullanıcının kendi listesinden gelir
    fetchedCars.forEach((car) => { car.status = "catalog"; });
    if (!isGuest) {
      try {
        const listRes = await fetch(CONFIG.LIST_URL, { headers: authHeaders(false) });
        if (listRes.ok) {
          const personalList = await listRes.json();
          fetchedCars.forEach((car) => {
            const item = personalList.find((i) => i.carId === car._id);
            if (item) car.status = item.status;
          });
        }
      } catch (err) {
        console.error("Kişisel liste alınamadı", err);
      }
    }

    // Durum filtresi kişisel listeye göre tarayıcıda uygulanır
    const statusValue = $("filter-status").value;
    cars = statusValue !== "all" ? fetchedCars.filter((c) => c.status === statusValue) : fetchedCars;

    UI.errorState.hidden = true;
    visibleCount = CONFIG.PAGE_SIZE;
    renderCars();
    handlePendingShortlist();
  } catch (error) {
    console.error("Araçlar yüklenemedi:", error.message);
    UI.errorState.hidden = false;
  }
}

// Misafirken "Kısa listeye ekle"ye basıp sonra kayıt olan/giriş yapan kullanıcı için
// o aracı otomatik olarak kısa listeye ekler.
async function handlePendingShortlist() {
  if (isGuest || pendingHandled) return;
  pendingHandled = true;
  const pendingId = localStorage.getItem(CONFIG.PENDING_KEY);
  if (!pendingId) return;
  localStorage.removeItem(CONFIG.PENDING_KEY);
  const car = cars.find((c) => c._id === pendingId);
  if (car && car.status !== "shortlist") {
    await setStatus(pendingId, "shortlist");
    showToast(`${car.brand} ${car.model} kısa listene eklendi.`);
  }
}

// =====================================================================
//  LİSTELEME
// =====================================================================
function getVisibleCars() {
  if (viewMode === "mine") return cars.filter((c) => c.ownerId === auth.id);
  if (viewMode === "favs") return cars.filter((c) => c.status === "shortlist");
  return cars;
}

function renderCars() {
  const list = getVisibleCars();
  const shown = list.slice(0, visibleCount);

  UI.grid.innerHTML = shown.map(cardHtml).join("");
  UI.resultCount.innerHTML = `<strong>${list.length}</strong> araç bulundu`;
  UI.emptyState.hidden = list.length > 0;
  UI.loadMoreBtn.hidden = visibleCount >= list.length;

  renderChips();
  updateStats();
  updateCompareBar();
}

function formatPrice(value) {
  return Number(value).toLocaleString("tr-TR");
}

function getImageUrl(url) {
  return url && url.startsWith("http") ? url : "";
}

function cardHtml(car) {
  const id = escapeHtml(car._id);
  const status = CONFIG.STATUS_LABELS[car.status] ? car.status : "catalog";
  const img = getImageUrl(car.imageUrl);
  const fallback = "https://ui-avatars.com/api/?size=400&background=random&name=" + encodeURIComponent(car.brand);
  const checked = compareIds.includes(car._id) ? "checked" : "";
  const canEdit = auth.role === "superadmin" || (auth.role === "dealer" && car.ownerId === auth.id);

  const specs = [
    `<span class="spec">${ICONS.range}${escapeHtml(car.range)} km</span>`,
    car.horsepower ? `<span class="spec">${ICONS.power}${escapeHtml(car.horsepower)} BG</span>` : "",
    car.battery ? `<span class="spec">${ICONS.battery}${escapeHtml(car.battery)} kWh</span>` : ""
  ].join("");

  // Misafir: "Kısa listeye ekle" (üyelik penceresi açar); giriş yapmış: durum etiketi (menü açar)
  const action = isGuest
    ? `<button type="button" class="btn btn-soft add-btn" data-action="add" data-id="${id}">${ICONS.plus}Kısa listeye ekle</button>`
    : `<button type="button" class="status-btn status-${status}" data-action="status" data-id="${id}">${CONFIG.STATUS_LABELS[status]}${ICONS.chevron}</button>`;

  const manage = canEdit
    ? `<div class="card-actions">
         <button type="button" class="icon-btn" data-action="edit" data-id="${id}" aria-label="Düzenle" title="Düzenle">${ICONS.edit}</button>
         <button type="button" class="icon-btn delete-btn" data-action="delete" data-id="${id}" aria-label="Sil" title="Sil">${ICONS.trash}</button>
       </div>`
    : "";

  return `
    <article class="car-card${status === "rejected" ? " is-rejected" : ""}${checked ? " is-selected" : ""}" data-id="${id}">
      <div class="car-media">
        <img src="${escapeHtml(img || fallback)}" data-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(car.brand + " " + car.model)}" loading="lazy" referrerpolicy="no-referrer">
        <span class="body-badge">${escapeHtml(car.bodyType)}</span>
        <label class="compare-check" title="Karşılaştırmaya ekle">
          <input type="checkbox" data-action="compare" data-id="${id}" ${checked}> Karşılaştır
        </label>
        ${manage}
      </div>
      <div class="car-body">
        <h3 class="car-title">${escapeHtml(car.brand)} <span class="model">${escapeHtml(car.model)}</span></h3>
        <div class="specs">${specs}</div>
        <div class="car-footer">
          <span class="price">${formatPrice(car.price)} <small>TL</small></span>
          ${action}
        </div>
      </div>
    </article>`;
}

// Kart fotoğrafı yüklenemezse yedek görsele geç (error olayı kabarcıklanmadığı için capture=true)
UI.grid.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.fallback && img.src !== img.dataset.fallback) {
    img.src = img.dataset.fallback;
  }
}, true);

// Kartlardaki tüm tıklamalar tek bir dinleyiciyle yönetilir
UI.grid.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  const card = e.target.closest(".car-card");
  if (!card) return;

  if (e.target.closest(".compare-check")) return; // onay kutusu "change" ile işlenir

  if (!target) {
    openDetail(card.dataset.id);
    return;
  }

  const id = target.dataset.id;
  switch (target.dataset.action) {
    case "add":
      openGuestPrompt(id);
      break;
    case "status":
      openStatusMenu(target, id);
      break;
    case "edit":
      openCarForm(id);
      break;
    case "delete":
      if (confirm("Bu aracı silmek istediğinize emin misiniz?")) deleteCar(id);
      break;
  }
});

UI.grid.addEventListener("change", (e) => {
  if (e.target.dataset.action === "compare") toggleCompare(e.target.dataset.id, e.target.checked);
});

UI.loadMoreBtn.addEventListener("click", () => {
  visibleCount += CONFIG.PAGE_SIZE;
  renderCars();
});

// =====================================================================
//  ÖZET KARTLARI
// =====================================================================
let statsAnimated = false; // sayma animasyonu sadece ilk açılışta çalışır

function updateStats() {
  if (isGuest) return;
  const values = [
    [UI.statTotal, cars.length],
    [UI.statShortlist, cars.filter((c) => c.status === "shortlist").length],
    [UI.statRejected, cars.filter((c) => c.status === "rejected").length]
  ];
  UI.statShortlistCard.classList.toggle("is-active", viewMode === "favs");

  // Her kartın güncel hedef değeri saklanır; devam eden sayma animasyonu eski değeri yazmasın diye
  values.forEach(([el, value]) => { el.dataset.target = value; });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (statsAnimated || cars.length === 0 || reduceMotion) {
    values.forEach(([el, value]) => { el.textContent = value; });
    return;
  }
  statsAnimated = true;
  values.forEach(([el, value]) => countUp(el, value));
}

// Sayıyı 0'dan hedef değere ~0.9 saniyede, sona doğru yavaşlayarak çıkarır.
// Animasyon sürerken değer değişirse (ör. araç kısa listeye eklendi) animasyon durur.
function countUp(el, target) {
  const start = performance.now();
  function step(now) {
    if (Number(el.dataset.target) !== target) return;
    const progress = Math.min((now - start) / 900, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  // Sekme arka plandaysa tarayıcı animasyonu çalıştırmaz; süre sonunda doğru sayı yine de yazılır
  setTimeout(() => {
    if (Number(el.dataset.target) === target) el.textContent = target;
  }, 950);
}

// =====================================================================
//  GÖRÜNÜM MODU (Kendi İlanlarım / Kısa Listem)
// =====================================================================
function setViewMode(mode) {
  viewMode = viewMode === mode ? "all" : mode;
  UI.menuMyCars.classList.toggle("is-active", viewMode === "mine");
  UI.menuMyFavs.classList.toggle("is-active", viewMode === "favs");
  visibleCount = CONFIG.PAGE_SIZE;
  renderCars();
}

// =====================================================================
//  FİLTRELER, ETİKETLER, ARAMA, SIRALAMA
// =====================================================================
function renderChips() {
  const chips = [];

  if (viewMode !== "all") {
    const label = viewMode === "mine" ? "Kendi ilanlarım" : "Kısa listem";
    chips.push(`<button type="button" class="chip" data-chip="view">${label}${ICONS.close}</button>`);
  }
  const search = UI.searchInput.value.trim();
  if (search) {
    chips.push(`<button type="button" class="chip" data-chip="search">"${escapeHtml(search)}"${ICONS.close}</button>`);
  }
  FILTERS.forEach((f, i) => {
    if (isFilterActive(f)) {
      chips.push(`<button type="button" class="chip" data-chip="${i}">${escapeHtml(f.label(f.el.value, f.el))}${ICONS.close}</button>`);
    }
  });
  if (chips.length > 1) {
    chips.push(`<button type="button" class="chip chip-clear" data-chip="all">Tümünü temizle</button>`);
  }
  UI.activeFilters.innerHTML = chips.join("");
}

UI.activeFilters.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-chip]");
  if (!chip) return;
  const key = chip.dataset.chip;
  if (key === "view") {
    setViewMode(viewMode);
    return;
  }
  if (key === "all") {
    clearAllFilters();
    return;
  }
  if (key === "search") UI.searchInput.value = "";
  else resetFilter(FILTERS[Number(key)]);
  fetchCars();
});

function clearAllFilters() {
  FILTERS.forEach(resetFilter);
  UI.searchInput.value = "";
  viewMode = "all";
  UI.menuMyCars.classList.remove("is-active");
  UI.menuMyFavs.classList.remove("is-active");
  fetchCars();
}

UI.clearFiltersBtn.addEventListener("click", clearAllFilters);

function openDrawer() {
  UI.drawer.classList.add("is-open");
  UI.overlay.classList.add("is-open");
}

function closeDrawer() {
  UI.drawer.classList.remove("is-open");
  UI.overlay.classList.remove("is-open");
}

UI.toggleFiltersBtn.addEventListener("click", openDrawer);
UI.closeDrawerBtn.addEventListener("click", closeDrawer);
UI.overlay.addEventListener("click", closeDrawer);
UI.applyFiltersBtn.addEventListener("click", () => {
  fetchCars();
  closeDrawer();
});
UI.resetFiltersBtn.addEventListener("click", () => FILTERS.forEach(resetFilter));
UI.sortBy.addEventListener("change", fetchCars);

// Arama: yazmayı bıraktıktan 400 ms sonra istek atılır (debounce)
let searchTimeout;
UI.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchCars, 400);
});

// =====================================================================
//  DURUM (Kısa liste, Test sürüşü, Elendi)
// =====================================================================
let statusMenuCarId = null;

function openStatusMenu(button, id) {
  statusMenuCarId = id;
  const car = cars.find((c) => c._id === id);
  UI.statusMenu.querySelectorAll("button").forEach((b) => {
    b.classList.toggle("is-current", car && b.dataset.status === car.status);
  });

  UI.statusMenu.hidden = false;
  const rect = button.getBoundingClientRect();
  const menuWidth = UI.statusMenu.offsetWidth;
  const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12);
  UI.statusMenu.style.left = Math.max(12, left) + window.scrollX + "px";
  UI.statusMenu.style.top = rect.bottom + 6 + window.scrollY + "px";
}

function closeStatusMenu() {
  UI.statusMenu.hidden = true;
  statusMenuCarId = null;
}

UI.statusMenu.addEventListener("click", (e) => {
  const item = e.target.closest("[data-status]");
  if (!item || !statusMenuCarId) return;
  setStatus(statusMenuCarId, item.dataset.status);
  closeStatusMenu();
});

document.addEventListener("click", (e) => {
  if (!UI.statusMenu.hidden && !e.target.closest("#status-menu") && !e.target.closest('[data-action="status"]')) {
    closeStatusMenu();
  }
});
window.addEventListener("resize", closeStatusMenu);

// Durumu önce ekranda günceller, sonra sunucuya kaydeder; hata olursa geri alır
async function setStatus(id, status) {
  const car = cars.find((c) => c._id === id);
  if (!car) return;
  const previous = car.status;
  car.status = status;
  renderCars();

  try {
    const response = await fetch(CONFIG.LIST_URL, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ carId: id, status })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Durum kaydedilemedi.");
    }
  } catch (error) {
    car.status = previous;
    renderCars();
    alert(error.message);
  }
}

// =====================================================================
//  PENCERE (MODAL)
// =====================================================================
function openModal(content, { small = false } = {}) {
  UI.modalBody.innerHTML = "";
  if (typeof content === "string") UI.modalBody.innerHTML = content;
  else UI.modalBody.appendChild(content);
  UI.modal.classList.toggle("is-small", small);
  UI.modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  UI.modal.hidden = true;
  UI.modalBody.innerHTML = "";
  document.body.style.overflow = "";
  editingCarId = null;
}

UI.modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!UI.modal.hidden) closeModal();
  closeStatusMenu();
  closeDrawer();
  setFabOpen(false);
});

// --- Araç detayı ---
function openDetail(id) {
  const car = cars.find((c) => c._id === id);
  if (!car) return;
  const img = getImageUrl(car.imageUrl);
  const item = (label, value) => `<div class="detail-item"><span>${label}</span><strong>${value}</strong></div>`;

  openModal(`
    ${img ? `<img class="detail-img" src="${escapeHtml(img)}" alt="${escapeHtml(car.brand + " " + car.model)}" referrerpolicy="no-referrer">` : ""}
    <h2 class="detail-title">${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h2>
    <p class="detail-price">${formatPrice(car.price)} TL</p>
    <div class="detail-grid">
      ${item("Menzil (WLTP)", escapeHtml(car.range) + " km")}
      ${item("Güç", car.horsepower ? escapeHtml(car.horsepower) + " BG" : "—")}
      ${item("Batarya", car.battery ? escapeHtml(car.battery) + " kWh" : "—")}
      ${item("Kasa tipi", escapeHtml(car.bodyType))}
      ${item("Çekiş", escapeHtml(car.drivetrain || "—"))}
      ${item("Durum", isGuest ? "—" : CONFIG.STATUS_LABELS[car.status] || "Katalog")}
    </div>
    ${car.note ? `<p class="detail-note">${escapeHtml(car.note)}</p>` : ""}
    ${car.link && car.link.startsWith("http") ? `<a class="detail-link" href="${escapeHtml(car.link)}" target="_blank" rel="noopener">Kaynağa git →</a>` : ""}
  `);
}

// --- Misafir: "Kısa listeye ekle" ---
function openGuestPrompt(id) {
  openModal(`
    ${ICONS.bookmark}
    <h2 class="modal-title">Listeni kaydet</h2>
    <p class="prompt-text">Listeni kaydetmek için ücretsiz üye ol. Seçtiğin araç, kayıt olduktan sonra kısa listene otomatik eklenecek.</p>
    <div class="prompt-actions">
      <a href="login.html" class="btn btn-ghost">Giriş Yap</a>
      <a href="login.html?kayit" class="btn btn-primary">Ücretsiz Kayıt Ol</a>
    </div>
  `, { small: true });

  // Kullanıcı giriş/kayıt sayfasına giderse, dönüşte bu araç otomatik eklenir
  UI.modalBody.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => localStorage.setItem(CONFIG.PENDING_KEY, id));
  });
}

// =====================================================================
//  KARŞILAŞTIRMA
// =====================================================================
function toggleCompare(id, checked) {
  if (checked) {
    if (compareIds.length >= 2) {
      alert("En fazla 2 aracı karşılaştırabilirsin. Önce seçili araçlardan birini kaldır.");
      renderCars();
      return;
    }
    compareIds.push(id);
  } else {
    compareIds = compareIds.filter((x) => x !== id);
  }
  renderCars();
}

function updateCompareBar() {
  UI.compareBar.hidden = compareIds.length === 0;
  UI.compareBarText.textContent = compareIds.length === 1
    ? "1 araç seçildi, bir tane daha seç"
    : `${compareIds.length} araç seçildi`;
  UI.compareBarOpen.disabled = compareIds.length < 2;
}

UI.compareBarClear.addEventListener("click", () => {
  compareIds = [];
  renderCars();
});
UI.compareBarOpen.addEventListener("click", () => openCompare(compareIds));
UI.compareOpenBtn.addEventListener("click", () => {
  // Seçim yoksa kısa listedeki ilk iki araç önerilir
  const preselect = compareIds.length ? compareIds : cars.filter((c) => c.status === "shortlist").map((c) => c._id);
  openCompare(preselect);
});

// Karşılaştırılan değerlerden daha iyi olanı yeşil gösterir
const COMPARE_ROWS = [
  { label: "Fiyat", value: (c) => c.price, text: (c) => formatPrice(c.price) + " TL", better: "lower" },
  { label: "Menzil", value: (c) => c.range, text: (c) => c.range + " km", better: "higher" },
  { label: "Güç", value: (c) => c.horsepower, text: (c) => (c.horsepower ? c.horsepower + " BG" : "—"), better: "higher" },
  { label: "Batarya", value: (c) => c.battery, text: (c) => (c.battery ? c.battery + " kWh" : "—"), better: "higher" },
  { label: "Kasa tipi", value: () => null, text: (c) => c.bodyType },
  { label: "Çekiş", value: () => null, text: (c) => c.drivetrain || "—" }
];

function openCompare(preselect = []) {
  const options = cars
    .map((c) => `<option value="${escapeHtml(c._id)}">${escapeHtml(c.brand)} ${escapeHtml(c.model)}</option>`)
    .join("");

  openModal(`
    <h2 class="modal-title">Araç karşılaştırma</h2>
    <div class="compare-grid">
      ${[0, 1].map((i) => `
        <div class="compare-col">
          <select data-compare-slot="${i}" aria-label="${i + 1}. araç">
            <option value="">${i + 1}. aracı seç</option>${options}
          </select>
          <div data-compare-content="${i}"><p class="compare-empty">Karşılaştırmak için bir araç seç.</p></div>
        </div>`).join("")}
    </div>
  `);

  const selects = UI.modalBody.querySelectorAll("[data-compare-slot]");
  selects.forEach((select, i) => {
    if (preselect[i]) select.value = preselect[i];
    select.addEventListener("change", renderCompare);
  });
  renderCompare();
}

function renderCompare() {
  const selects = [...UI.modalBody.querySelectorAll("[data-compare-slot]")];
  const chosen = selects.map((s) => cars.find((c) => c._id === s.value) || null);

  chosen.forEach((car, i) => {
    const box = UI.modalBody.querySelector(`[data-compare-content="${i}"]`);
    if (!car) {
      box.innerHTML = '<p class="compare-empty">Karşılaştırmak için bir araç seç.</p>';
      return;
    }
    const other = chosen[1 - i];
    const rows = COMPARE_ROWS.map((row) => {
      let isBetter = false;
      if (other && row.better && row.value(car) && row.value(other)) {
        isBetter = row.better === "lower" ? row.value(car) < row.value(other) : row.value(car) > row.value(other);
      }
      return `<div class="compare-row"><span>${row.label}</span><strong class="${isBetter ? "is-better" : ""}">${escapeHtml(row.text(car))}</strong></div>`;
    }).join("");
    const img = getImageUrl(car.imageUrl);
    box.innerHTML = `${img ? `<img src="${escapeHtml(img)}" alt="" referrerpolicy="no-referrer">` : ""}${rows}`;
  });
}

// =====================================================================
//  ARAÇ EKLEME / DÜZENLEME (bayi ve süper admin)
// =====================================================================
const FORM_FIELDS = ["brand", "model", "horsepower", "bodyType", "drivetrain", "range", "battery", "price", "imageUrl", "link", "note"];
const NUMBER_FIELDS = ["horsepower", "range", "battery", "price"];

function openCarForm(id) {
  const content = UI.carFormTemplate.content.cloneNode(true);
  openModal(content);
  editingCarId = id;

  const form = $("car-form");
  if (id) {
    const car = cars.find((c) => c._id === id);
    FORM_FIELDS.forEach((f) => { $(f).value = car?.[f] ?? ""; });
    $("car-form-title").textContent = "Aracı düzenle";
    $("car-form-submit").textContent = "Değişiklikleri kaydet";
  }
  form.addEventListener("submit", submitCarForm);
}

async function submitCarForm(e) {
  e.preventDefault();
  const data = {};
  FORM_FIELDS.forEach((f) => {
    const value = $(f).value.trim();
    if (value === "") return;
    data[f] = NUMBER_FIELDS.includes(f) ? Number(value) : value;
  });

  const isEdit = Boolean(editingCarId);
  try {
    const response = await fetch(isEdit ? `${CONFIG.API_URL}/${editingCarId}` : CONFIG.API_URL, {
      method: isEdit ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "İşlem başarısız.");
    }
    closeModal();
    showToast(isEdit ? "Araç güncellendi." : "Araç eklendi.");
    fetchCars();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteCar(id) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/${id}`, { method: "DELETE", headers: authHeaders(false) });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Araç silinemedi.");
    }
    compareIds = compareIds.filter((x) => x !== id);
    showToast("Araç silindi.");
    fetchCars();
  } catch (error) {
    alert(error.message);
  }
}

// =====================================================================
//  BİLDİRİM (TOAST)
// =====================================================================
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("is-hiding"), 2600);
  setTimeout(() => toast.remove(), 3000);
}

// =====================================================================
//  AYARLAR MENÜSÜ (BALONCUK YAY MENÜ)
// =====================================================================
function setFabOpen(isOpen) {
  UI.fabContainer.classList.toggle("is-open", isOpen);
  UI.fabBackdrop.classList.toggle("is-open", isOpen);
  UI.fabMainBtn.setAttribute("aria-expanded", String(isOpen));
}

// Görünen baloncukları ana butonun etrafında, yukarıdan (90°) sola (180°) uzanan bir yay
// üzerine eşit aralıkla yerleştirir. Yazılar yayın dışına doğru konur ki üst üste binmesin.
function layoutFabItems() {
  const items = Array.from(UI.fabMenu.querySelectorAll(".fab-item:not([hidden])"));
  const radius = window.innerWidth < 480 ? 150 : 175;
  const bubbleRadius = 28, gap = 8;
  items.forEach((item, i) => {
    const angleDeg = items.length === 1 ? 135 : 90 + (i * 90) / (items.length - 1);
    const angle = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    item.style.setProperty("--x", Math.round(dx * radius) + "px");
    item.style.setProperty("--y", Math.round(dy * radius) + "px");
    item.style.setProperty("--delay", i * 45 + "ms");

    const label = item.querySelector(".fab-label");
    const distance = bubbleRadius + gap + Math.abs(dx) * (label.offsetWidth / 2) + Math.abs(dy) * (label.offsetHeight / 2);
    item.style.setProperty("--lx", Math.round(dx * distance) + "px");
    item.style.setProperty("--ly", Math.round(dy * distance) + "px");
  });
}

function setupFab() {
  layoutFabItems();
  window.addEventListener("resize", layoutFabItems);
  UI.fabMainBtn.addEventListener("click", () => setFabOpen(!UI.fabContainer.classList.contains("is-open")));
  UI.fabBackdrop.addEventListener("click", () => setFabOpen(false));
  UI.fabMenu.addEventListener("click", (e) => {
    if (e.target.closest(".fab-item")) setFabOpen(false);
  });
}

// =====================================================================
//  BAŞLAT
// =====================================================================
setupRoleUI();
fetchCars();
