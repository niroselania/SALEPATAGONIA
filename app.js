const input = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const count = document.querySelector("#resultCount");
const resultLabel = document.querySelector("#resultLabel");
const template = document.querySelector("#productCard");
const discounts = document.querySelector("#discounts");
const sortSelect = document.querySelector("#sortSelect");
const clearFilters = document.querySelector("#clearFilters");

let products = [];
let activeDiscount = "Todas";
let activeSort = "code";

const normalize = (value) =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const formatDiscount = (value) => `${Math.round(value * 100)}%`;

function render(items) {
  results.replaceChildren();
  count.textContent = items.length;
  resultLabel.textContent = items.length === 1 ? "producto encontrado" : "productos encontrados";

  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No se encontraron productos para esa búsqueda.";
    results.append(empty);
    return;
  }

  for (const product of items) {
    const node = template.content.cloneNode(true);
    const photo = node.querySelector(".photo");

    if (product.image) {
      const img = document.createElement("img");
      img.src = product.image;
      img.alt = product.name;
      img.loading = "lazy";
      photo.append(img);
      node.querySelector(".photo-placeholder").hidden = true;
    } else {
      photo.classList.add("missing");
    }

    node.querySelector(".discount-badge").textContent = formatDiscount(product.discount);
    node.querySelector(".code").textContent = product.code;
    node.querySelector("h2").textContent = product.name;
    node.querySelector(".retail-price").textContent = formatPrice(product.retail);
    node.querySelector(".sale-price").textContent = formatPrice(product.salePrice);
    node.querySelector(".base-code").textContent = product.baseCode;
    node.querySelector(".color").textContent = product.color;
    results.append(node);
  }
}

function filterProducts() {
  const query = normalize(input.value);
  const filtered = products.filter((product) => {
    const matchesQuery = !query || normalize(`${product.code} ${product.baseCode} ${product.color} ${product.name}`).includes(query);
    const matchesDiscount = activeDiscount === "Todas" || product.discount === activeDiscount;
    return matchesQuery && matchesDiscount;
  });
  render(sortProducts(filtered));
}

function sortProducts(items) {
  return [...items].sort((a, b) => {
    if (activeSort === "discount") return b.discount - a.discount || a.code.localeCompare(b.code);
    if (activeSort === "salePrice") return a.salePrice - b.salePrice || a.code.localeCompare(b.code);
    return a.code.localeCompare(b.code);
  });
}

function updateDiscountButtons() {
  for (const chip of discounts.children) {
    chip.setAttribute("aria-pressed", chip.dataset.discount === String(activeDiscount));
  }
}

function buildDiscountFilters() {
  const counts = new Map();
  for (const product of products) counts.set(product.discount, (counts.get(product.discount) || 0) + 1);
  const values = ["Todas", ...[...counts.keys()].filter((value) => value > 0).sort((a, b) => a - b)];
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.discount = String(value);
    button.textContent = value === "Todas" ? `Todos (${products.length})` : `${formatDiscount(value)} (${counts.get(value)})`;
    button.setAttribute("aria-pressed", value === activeDiscount);
    button.addEventListener("click", () => {
      activeDiscount = value;
      updateDiscountButtons();
      filterProducts();
    });
    discounts.append(button);
  }
}

fetch("products.json")
  .then((response) => response.json())
  .then((data) => {
    products = data.sort((a, b) => a.code.localeCompare(b.code));
    buildDiscountFilters();
    filterProducts();
    input.addEventListener("input", filterProducts);
    sortSelect.addEventListener("change", () => {
      activeSort = sortSelect.value;
      filterProducts();
    });
    clearFilters.addEventListener("click", () => {
      input.value = "";
      activeDiscount = "Todas";
      activeSort = "code";
      sortSelect.value = activeSort;
      updateDiscountButtons();
      filterProducts();
      input.focus();
    });
  })
  .catch(() => {
    results.innerHTML = '<p class="empty">No se pudo cargar products.json.</p>';
  });
