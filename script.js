document.addEventListener("DOMContentLoaded", function () {

    /* ============================================================
       WHATSAPP BUTTONS
       ============================================================ */
    // Store number: 060 889 9073 -> international format (South Africa, +27)
    const storeWhatsappNumber = "27608899073";

    const whatsappLink =
        `https://wa.me/${storeWhatsappNumber}?text=Hello%20Kaldi's%20Super%20Store`;

    document.getElementById("whatsappBtn").addEventListener("click", function () {
        window.open(whatsappLink, "_blank");
    });

    document.getElementById("floatingWhatsapp").addEventListener("click", function (e) {
        e.preventDefault();
        window.open(whatsappLink, "_blank");
    });


    /* ============================================================
       DOWNLOADABLE CONTACT CARD (vCard)
       Lets visitors save the store's details straight to their phone
       contacts / address book with one tap.
       ============================================================ */
    document.getElementById("downloadContactBtn").addEventListener("click", function () {

        const vCardData =
`BEGIN:VCARD
VERSION:3.0
FN:Kaldi's Super Store
ORG:Kaldi's Super Store
TEL;TYPE=CELL:+27608899073
ADR;TYPE=WORK:;;No 6 Western Road;Port Elizabeth;;;South Africa
URL:${window.location.href}
END:VCARD`;

        const blob = new Blob([vCardData], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "Kaldis-Super-Store-Contact.vcf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    });


    /* ============================================================
       PRODUCT PAGINATION + SEARCH
       ============================================================ */
    const productCards = document.querySelectorAll(".product-card");
    const productsPerPage = 6;

    const paginationControls = document.getElementById("paginationControls");
    const noResultsMsg = document.getElementById("noResultsMsg");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    let currentPage = 1;
    const totalPages = Math.ceil(productCards.length / productsPerPage);

    function showPage(page) {

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;

        productCards.forEach((card, index) => {

            if (index >= start && index < end) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }

        });

        document.getElementById("pageNumber").textContent =
            "Page " + page + " of " + totalPages;

        prevBtn.disabled = page <= 1;
        nextBtn.disabled = page >= totalPages;
    }

    nextBtn.addEventListener("click", function () {

        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }

    });

    prevBtn.addEventListener("click", function () {

        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }

    });

    showPage(1);

    // Search — filters live across all products, independent of pagination
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("input", function () {

        const filter = searchInput.value.trim().toLowerCase();

        if (filter === "") {
            // Back to normal paginated view
            paginationControls.classList.remove("hidden");
            noResultsMsg.classList.add("hidden");
            showPage(currentPage);
            return;
        }

        // While searching, pagination doesn't apply — show every match
        paginationControls.classList.add("hidden");

        let matchCount = 0;

        productCards.forEach((card) => {

            const title = card.querySelector("h3").textContent.toLowerCase();
            const matches = title.includes(filter);

            card.style.display = matches ? "flex" : "none";

            if (matches) matchCount++;

        });

        noResultsMsg.classList.toggle("hidden", matchCount > 0);

    });


    /* ============================================================
       WATER SLIDER
       ============================================================ */
    const waterSlides = document.querySelectorAll(".water-slide");
    let waterIndex = 0;

    function showWaterSlide() {

        waterSlides.forEach(slide => {
            slide.classList.remove("active");
        });

        waterSlides[waterIndex].classList.add("active");

        waterIndex++;

        if (waterIndex >= waterSlides.length) {
            waterIndex = 0;
        }
    }

    showWaterSlide();
    setInterval(showWaterSlide, 3000);


    /* ============================================================
       SHOPPING CART SYSTEM
       ============================================================ */

    // Small wrappers so a blocked/unavailable localStorage (e.g. strict
    // private-browsing mode) doesn't crash the whole page.
    function safeGetItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("localStorage unavailable:", e);
            return null;
        }
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("localStorage unavailable, cart will not persist:", e);
        }
    }

    // Cart is persisted in localStorage so it survives a page refresh
    let cart = loadCart();

    // Cached DOM elements
    const cartToggle = document.getElementById("cartToggle");
    const cartCountEl = document.getElementById("cartCount");
    const cartDrawer = document.getElementById("cartDrawer");
    const closeCartBtn = document.getElementById("closeCart");
    const cartItemsContainer = document.getElementById("cartItems");
    const cartTotalItemsEl = document.getElementById("cartTotalItems");
    const cartGrandTotalEl = document.getElementById("cartGrandTotal");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    const overlay = document.getElementById("overlay");

    const checkoutModal = document.getElementById("checkoutModal");
    const closeCheckoutBtn = document.getElementById("closeCheckout");
    const checkoutForm = document.getElementById("checkoutForm");
    const orderReviewEl = document.getElementById("orderReview");
    const submitOrderBtn = document.getElementById("submitOrderBtn");
    const submitBtnText = document.getElementById("submitBtnText");
    const submitSpinner = document.getElementById("submitSpinner");

    const successModal = document.getElementById("successModal");
    const closeSuccessBtn = document.getElementById("closeSuccessBtn");
    const orderNumberDisplay = document.getElementById("orderNumberDisplay");

    function loadCart() {
        const saved = safeGetItem("kaldiCart");
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn("Corrupted cart data, resetting cart:", e);
            return [];
        }
    }

    function saveCart() {
        safeSetItem("kaldiCart", JSON.stringify(cart));
    }

    // Escapes text before it's dropped into innerHTML, so a product name
    // or image path can never break the markup or inject a script.
    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = String(str);
        return div.innerHTML;
    }

    // Add a product to the cart (or bump its quantity if it's already there)
    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }

        saveCart();
        renderCart();
        openCart();
    }

    // Renders the full list of cart items into the drawer
    function renderCart() {
        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            cartItemsContainer.innerHTML =
                '<p class="empty-cart-msg">Your cart is empty. Start adding products!</p>';
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.qty;

                const itemEl = document.createElement("div");
                itemEl.className = "cart-item";
                itemEl.innerHTML = `
                    <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
                    <div class="cart-item-info">
                        <h4>${escapeHtml(item.name)}</h4>
                        <span class="cart-item-price">R${item.price.toFixed(2)} x ${item.qty} = R${itemTotal.toFixed(2)}</span>
                        <div class="cart-item-controls">
                            <button type="button" class="qty-btn decrease-btn" data-id="${escapeHtml(item.id)}" aria-label="Decrease quantity">-</button>
                            <span class="qty-value">${item.qty}</span>
                            <button type="button" class="qty-btn increase-btn" data-id="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
                            <button type="button" class="remove-item-btn" data-id="${escapeHtml(item.id)}" aria-label="Remove item">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                `;

                cartItemsContainer.appendChild(itemEl);
            });
        }

        updateCartSummary();
    }

    // Updates the item count badge, total items, and grand total
    function updateCartSummary() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const grandTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

        cartCountEl.textContent = totalItems;
        cartTotalItemsEl.textContent = totalItems;
        cartGrandTotalEl.textContent = "R" + grandTotal.toFixed(2);

        placeOrderBtn.disabled = cart.length === 0;
    }

    function openCart() {
        cartDrawer.classList.add("active");
        overlay.classList.add("active");
    }

    function closeCart() {
        cartDrawer.classList.remove("active");
        overlay.classList.remove("active");
    }

    function closeAllPanels() {
        closeCart();
        checkoutModal.classList.remove("active");
        successModal.classList.remove("active");
        overlay.classList.remove("active");
    }

    // "Add to Cart" buttons — handled with one listener for every button on the page
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".add-to-cart-btn");
        if (!btn) return;

        addToCart({
            id: btn.dataset.id,
            name: btn.dataset.name,
            price: parseFloat(btn.dataset.price),
            image: btn.dataset.image
        });
    });

    // Quantity +/- and remove buttons inside the cart drawer
    cartItemsContainer.addEventListener("click", function (e) {
        const button = e.target.closest("button");
        if (!button) return;

        const id = button.dataset.id;
        const item = cart.find(i => i.id === id);
        if (!item) return;

        if (button.classList.contains("increase-btn")) {
            item.qty += 1;
        }

        if (button.classList.contains("decrease-btn")) {
            item.qty -= 1;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
        }

        if (button.classList.contains("remove-item-btn")) {
            cart = cart.filter(i => i.id !== id);
        }

        saveCart();
        renderCart();
    });

    cartToggle.addEventListener("click", openCart);
    closeCartBtn.addEventListener("click", closeCart);
    overlay.addEventListener("click", closeAllPanels);

    // Render whatever was already in the cart on page load
    renderCart();


    /* ============================================================
       CHECKOUT
       ============================================================ */

    // Builds a readable order summary shown inside the checkout modal
    function renderOrderReview() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const grandTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

        let html = cart.map(item => `
            <div class="order-review-row">
                <span>${escapeHtml(item.name)} x${item.qty}</span>
                <span>R${(item.price * item.qty).toFixed(2)}</span>
            </div>
        `).join("");

        html += `
            <div class="order-review-row order-review-total">
                <span>Total Items: ${totalItems}</span>
                <span>Grand Total: R${grandTotal.toFixed(2)}</span>
            </div>
        `;

        orderReviewEl.innerHTML = html;
    }

    placeOrderBtn.addEventListener("click", function () {
        if (cart.length === 0) return;

        renderOrderReview();
        closeCart();
        checkoutModal.classList.add("active");
        overlay.classList.add("active");
    });

    closeCheckoutBtn.addEventListener("click", function () {
        checkoutModal.classList.remove("active");
        overlay.classList.remove("active");
    });

    closeSuccessBtn.addEventListener("click", function () {
        successModal.classList.remove("active");
        overlay.classList.remove("active");
    });


    /* ============================================================
       ORDER NUMBER GENERATOR
       Produces numbers like: ORD-20260731-0001, ORD-20260731-0002 ...
       ============================================================ */
    function generateOrderNumber() {
        const now = new Date();
        const dateStr =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");

        let counter = parseInt(safeGetItem("kaldiOrderCounter") || "0", 10) + 1;
        safeSetItem("kaldiOrderCounter", counter.toString());

        return "ORD-" + dateStr + "-" + String(counter).padStart(4, "0");
    }


    /* ============================================================
       SEND THE ORDER WITH FORMSUBMIT
       ============================================================ */
    checkoutForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const surname = document.getElementById("surname").value.trim();
        const phoneNumber = document.getElementById("phoneNumber").value.trim();
        const customerWhatsappNumber = document.getElementById("whatsappNumber").value.trim();

        if (!firstName || !surname || !phoneNumber || !customerWhatsappNumber) {
            alert("Please fill in all required fields.");
            return;
        }

        // Show the loading state on the button while the order is sent
        submitBtnText.textContent = "Placing Order...";
        submitSpinner.classList.remove("hidden");
        submitOrderBtn.disabled = true;

        const orderNumber = generateOrderNumber();

        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const grandTotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);

        // One neatly formatted line per product: name, qty, price, line total
        const orderDetailsText = cart.map(item =>
            `${item.name}  |  Qty: ${item.qty}  |  Price: R${item.price.toFixed(2)}  |  Total: R${(item.price * item.qty).toFixed(2)}`
        ).join("\n");

        const payload = {
            _subject: `New Order ${orderNumber} - Kaldi's Super Store`,
            Order_Number: orderNumber,
            First_Name: firstName,
            Surname: surname,
            Phone_Number: phoneNumber,
            WhatsApp_Number: customerWhatsappNumber,
            Order_Details: orderDetailsText,
            Total_Number_Of_Items: totalItems,
            Grand_Total: `R${grandTotal.toFixed(2)}`,
            _template: "table",
            _captcha: "false"
        };

        try {
            // ================================================================
            // ⚠️ REQUIRED SETUP — READ BEFORE GOING LIVE ⚠️
            // Replace "youremail@example.com" below with the email address
            // that should receive orders. This is the ONLY line you need to
            // edit for order delivery to work.
            //
            // The FIRST order sent after changing this address will trigger a
            // one-time confirmation email from FormSubmit — you must open it
            // and click the activation link, or every order after it will
            // silently fail to arrive.
            // ================================================================
            const response = await fetch("https://formsubmit.co/ajax/machethetumelo925@gmail.com", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("FormSubmit request failed");
            }

            // Order sent successfully — reset everything and show the success modal
            checkoutForm.reset();
            cart = [];
            saveCart();
            renderCart();

            checkoutModal.classList.remove("active");
            orderNumberDisplay.textContent = orderNumber;
            successModal.classList.add("active");

        } catch (error) {
            console.error(error);
            alert("Sorry, there was a problem sending your order. Please check your internet connection and try again, or contact us on WhatsApp.");
        } finally {
            submitBtnText.textContent = "Confirm Order";
            submitSpinner.classList.add("hidden");
            submitOrderBtn.disabled = false;
        }
    });

});
