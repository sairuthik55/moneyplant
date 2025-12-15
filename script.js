// script.js

/******************** FIREBASE INIT ********************/
const firebaseConfig = {
  apiKey: "AIzaSyBJXO-TsCpd0dlV5LO84RG0yJv2_zKFEoU",
  authDomain: "money-plant-9b247.firebaseapp.com",
  projectId: "money-plant-9b247",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
/******************** LOAD PLANTS FROM FIREBASE ********************/
const productGrid = document.getElementById("productGrid");

db.collection("plants").onSnapshot(snapshot => {
  productGrid.innerHTML = "";

  snapshot.forEach(doc => {
    const p = doc.data();

    productGrid.innerHTML += `
      <div class="product-card ${p.category?.toLowerCase() || "all"}"
        onclick="showProductDetails(
          '${p.name}',
          '${p.price}',
          '${p.description || "Healthy premium plant"}',
          '${p.image}',
          '${p.category || "Plant"}',
          'Water regularly||Bright indirect light||Indoor friendly'
        )">

        <img src="${p.image}">
        <div class="product-content">
          <span class="category-label">${p.category || "Plant"}</span>
          <h3>${p.name}</h3>
          <p>${p.description || "Healthy premium plant"}</p>
          <p class="price">₹${p.price}</p>

          <button onclick="event.stopPropagation();
            addToCart('${p.name}', ${p.price}, '${p.image}')">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
});

/******************** GLOBALS ********************/
let cart = []; // TEMP CART (NOT STORED)
const DELIVERY_CHARGE = 49;

/******************** PAGE CONTROL ********************/
function hideAll() {
  document.getElementById("home").style.display = "none";
  // Since 'about' content is moved to footer, we can keep the element hidden
  document.getElementById("about")?.classList.add("hidden"); 
  document.getElementById("cart").classList.add("hidden");
  document.getElementById("checkout").classList.add("hidden");
}

function showHome() {
  hideAll();
  document.getElementById("home").style.display = "block";
}

function showAbout() {
  // This function is still here but points to an empty/hidden section
  hideAll();
  document.getElementById("about").classList.remove("hidden");
}

function showCart() {
  hideAll();
  document.getElementById("cart").classList.remove("hidden");
  renderCart();
}

function showCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  hideAll();
  document.getElementById("checkout").classList.remove("hidden");
}

/******************** CATEGORY FILTER ********************/
function filterCategory(category) {
  document.querySelectorAll(".product-card").forEach(card => {
    // Categories are now 'indoor', 'outdoor', 'succulent', 'flowering'
    card.style.display =
      category === "all" || card.classList.contains(category)
        ? "block"
        : "none";
  });
}

/******************** TOAST NOTIFICATION ********************/
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/******************** CART LOGIC (TEMP ONLY) ********************/
function addToCart(name, price, image) {
  const item = cart.find(p => p.name === name);

  if (item) {
    item.qty++;
    showToast("Quantity updated 🛒");
  } else {
    cart.push({ name, price, image, qty: 1 });
    showToast("Item added to cart 🌱");
  }

  updateCartCount();
}

function updateCartCount() {
  document.getElementById("cartCount").innerText =
    cart.reduce((sum, item) => sum + item.qty, 0);
}

function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  list.innerHTML = "";
  let subtotal = 0;

  if (cart.length === 0) {
    empty.style.display = "block";
    subtotalEl.innerText = "0";
    totalEl.innerText = "0";
    return;
  }

  empty.style.display = "none";

  cart.forEach((item, index) => {
    subtotal += item.price * item.qty;

    list.innerHTML += `
      <div class="cart-item">
        <img src="${item.image}" class="cart-img">

        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <p>₹${item.price} × ${item.qty}</p>

          <div class="qty-controls">
            <button onclick="changeQty(${index}, 1)">+</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index}, -1)">−</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">✕</button>
      </div>
    `;
  });

  subtotalEl.innerText = subtotal;
  totalEl.innerText = subtotal + DELIVERY_CHARGE;
}

function changeQty(index, value) {
  cart[index].qty += value;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCartCount();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  updateCartCount();
  renderCart();
}

/******************** PLACE ORDER (FIREBASE ONLY HERE) ********************/
async function placeOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const orderData = {
    customer: {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value
    },
    address: {
      house: document.getElementById("house").value,
      street: document.getElementById("street").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      pincode: document.getElementById("pincode").value
    },
    instructions: document.getElementById("instructions").value,
    paymentMethod: document.querySelector('input[name="payment"]:checked').value,
    items: cart,
    subtotal: cart.reduce((s, i) => s + i.price * i.qty, 0),
    deliveryCharge: DELIVERY_CHARGE,
    totalAmount:
      cart.reduce((s, i) => s + i.price * i.qty, 0) + DELIVERY_CHARGE,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("orders").add(orderData);

  alert("✅ Order placed successfully!");

  cart = []; // CLEAR TEMP CART
  updateCartCount();
  showHome();
}

/******************** SCROLL ********************/
function scrollToProducts() {
  document.getElementById("products")
    .scrollIntoView({ behavior: "smooth" });
}
/******************** PRODUCT DETAILS MODAL ********************/

function showProductDetails(name, price, description, image, category, careTips) {
  document.getElementById("modalName").innerText = name;
  document.getElementById("modalPrice").innerText = price;
  document.getElementById("modalDescription").innerText = description;
  document.getElementById("modalImage").src = image;
  document.getElementById("modalCategory").innerText = category;

  // Care tips list
  const tipsList = document.getElementById("modalCareTips");
  tipsList.innerHTML = "";

  careTips.split("||").forEach(tip => {
    const li = document.createElement("li");
    li.innerText = tip;
    tipsList.appendChild(li);
  });

  // Add to cart from modal
  const btn = document.getElementById("modalAddToCartBtn");
  btn.onclick = () => {
    addToCart(name, Number(price), image);
    hideProductDetails();
  };

  document.getElementById("productModal").classList.remove("hidden");
}

function hideProductDetails() {
  document.getElementById("productModal").classList.add("hidden");
}

/******************** INIT ********************/
showHome();
updateCartCount();