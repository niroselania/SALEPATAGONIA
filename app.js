const input = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const count = document.querySelector("#resultCount");
const resultLabel = document.querySelector("#resultLabel");
const template = document.querySelector("#productCard");
const discounts = document.querySelector("#discounts");
const tags = document.querySelector("#tags");
const sortSelect = document.querySelector("#sortSelect");
const clearFilters = document.querySelector("#clearFilters");

let products = [];
let activeDiscount = "Todas";
let activeTag = "Todas";
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

const compareSizes = (a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });

const isRioActive = () => activeTag === "SALE RIO";
const getDiscount = (product) => (isRioActive() ? product.rioDiscount : product.discount);
const getSalePrice = (product) => (isRioActive() ? product.rioSalePrice : product.salePrice);

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

    node.querySelector(".discount-badge").textContent = formatDiscount(getDiscount(product));
    node.querySelector(".rio-badge").hidden = !isRioActive();
    node.querySelector(".code").textContent = product.code;
    node.querySelector("h2").textContent = product.name;
    node.querySelector(".retail-price").textContent = formatPrice(product.retail);
    node.querySelector(".sale-price").textContent = formatPrice(getSalePrice(product));
    node.querySelector(".stock-total-value").textContent = product.stock?.total ?? 0;
    node.querySelector(".stock-carrito").textContent = product.stock?.carrito ?? 0;
    node.querySelector(".stock-local").textContent = product.stock?.local ?? 0;
    node.querySelector(".stock-bariloche").textContent = product.stock?.bariloche ?? 0;
    node.querySelector(".stock-rio").textContent = product.stock?.rio ?? 0;
    const sizeDetails = product.stock?.sizes || [];
    if (sizeDetails.length) {
      const sizeSection = node.querySelector(".stock-sizes");
      const sizeRows = node.querySelector(".stock-size-rows");
      sizeSection.hidden = false;
      for (const size of [...sizeDetails].sort((a, b) => compareSizes(a.size, b.size))) {
        const row = document.createElement("div");
        row.className = "stock-size-row";
        row.setAttribute("role", "row");
        for (const value of [size.size, size.carrito, size.local, size.bariloche, size.rio]) {
          const cell = document.createElement("span");
          cell.setAttribute("role", "cell");
          cell.textContent = value;
          row.append(cell);
        }
        sizeRows.append(row);
      }
    }
    node.querySelector(".base-code").textContent = product.baseCode;
    node.querySelector(".color").textContent = product.color;
    results.append(node);
  }
}

function filterProducts() {
  const query = normalize(input.value);
  const filtered = products.filter((product) => {
    const matchesQuery = !query || normalize(`${product.code} ${product.baseCode} ${product.color} ${product.name}`).includes(query);
    const matchesTag = activeTag === "Todas" || (activeTag === "SALE RIO" && product.rioDiscount != null);
    const matchesDiscount = activeDiscount === "Todas" || getDiscount(product) === activeDiscount;
    return matchesQuery && matchesTag && matchesDiscount;
  });
  render(sortProducts(filtered));
}

function sortProducts(items) {
  return [...items].sort((a, b) => {
    if (activeSort === "discount") return getDiscount(b) - getDiscount(a) || a.code.localeCompare(b.code);
    if (activeSort === "salePrice") return getSalePrice(a) - getSalePrice(b) || a.code.localeCompare(b.code);
    return a.code.localeCompare(b.code);
  });
}

function updateDiscountButtons() {
  for (const chip of discounts.children) {
    chip.setAttribute("aria-pressed", chip.dataset.discount === String(activeDiscount));
  }
}

function updateTagButtons() {
  for (const chip of tags.children) {
    chip.setAttribute("aria-pressed", chip.dataset.tag === activeTag);
  }
}

function buildDiscountFilters() {
  const scope = activeTag === "SALE RIO" ? products.filter((product) => product.rioDiscount != null) : products;
  const counts = new Map();
  for (const product of scope) counts.set(getDiscount(product), (counts.get(getDiscount(product)) || 0) + 1);
  discounts.replaceChildren();
  const values = ["Todas", ...[...counts.keys()].filter((value) => value > 0).sort((a, b) => a - b)];
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.discount = String(value);
    button.textContent = value === "Todas" ? `Todos (${scope.length})` : `${formatDiscount(value)} (${counts.get(value)})`;
    button.setAttribute("aria-pressed", value === activeDiscount);
    button.addEventListener("click", () => {
      activeDiscount = value;
      updateDiscountButtons();
      filterProducts();
    });
    discounts.append(button);
  }
}

function buildTagFilters() {
  const rioCount = products.filter((product) => product.rioDiscount != null).length;
  const values = [
    { value: "Todas", label: `Todos (${products.length})`, className: "chip" },
    { value: "SALE RIO", label: `SALE RIO (${rioCount})`, className: "chip chip-rio" },
  ];
  for (const { value, label, className } of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.tag = value;
    button.textContent = label;
    button.setAttribute("aria-pressed", value === activeTag);
    button.addEventListener("click", () => {
      activeTag = value;
      activeDiscount = "Todas";
      updateTagButtons();
      buildDiscountFilters();
      filterProducts();
    });
    tags.append(button);
  }
}

Promise.all([
  fetch("products.json").then((response) => response.json()),
  fetch("sale_rio.json")
    .then((response) => (response.ok ? response.json() : {}))
    .catch(() => ({})),
])
  .then(([data, rioDiscounts]) => {
    products = data
      .map((product) => {
        const rioDiscount = rioDiscounts[product.code];
        if (rioDiscount == null) return product;
        return {
          ...product,
          rioDiscount,
          rioSalePrice: Math.round(product.retail * (1 - rioDiscount)),
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
    buildTagFilters();
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
      activeTag = "Todas";
      activeSort = "code";
      sortSelect.value = activeSort;
      updateTagButtons();
      buildDiscountFilters();
      updateDiscountButtons();
      filterProducts();
      input.focus();
    });
  })
  .catch(() => {
    results.innerHTML = '<p class="empty">No se pudo cargar products.json.</p>';
  });
