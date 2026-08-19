const input = document.querySelector("#searchInput");
const results = document.querySelector("#results");
const count = document.querySelector("#resultCount");
const resultLabel = document.querySelector("#resultLabel");
const template = document.querySelector("#productCard");
const discounts = document.querySelector("#discounts");

let products = [];
let activeDiscount = "Todas";

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
    } else {
      photo.classList.add("missing");
      photo.append(document.createTextNode("Sin foto válida"));
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
  render(filtered);
}

function buildDiscountFilters() {
  const values = ["Todas", ...new Set(products.map((product) => product.discount).sort((a, b) => a - b))];
  for (const value of values) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = value === "Todas" ? "Todos" : formatDiscount(value);
    button.setAttribute("aria-pressed", value === activeDiscount);
    button.addEventListener("click", () => {
      activeDiscount = value;
      for (const chip of discounts.children) chip.setAttribute("aria-pressed", chip.textContent === button.textContent);
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
    render(products);
    input.addEventListener("input", filterProducts);
  })
  .catch(() => {
    results.innerHTML = '<p class="empty">No se pudo cargar products.json.</p>';
  });
