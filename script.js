document.addEventListener("DOMContentLoaded", function () {

    // WhatsApp
    const whatsappNumber = "27821234567";

    const whatsappLink =
        `https://wa.me/${whatsappNumber}?text=Hello%20Kaldi's%20Super%20Store`;

    document.getElementById("whatsappBtn").addEventListener("click", function () {
        window.open(whatsappLink, "_blank");
    });

    document.getElementById("floatingWhatsapp").addEventListener("click", function (e) {
        e.preventDefault();
        window.open(whatsappLink, "_blank");
    });

    // Products
    const productCards = document.querySelectorAll(".product-card");
    const productsPerPage = 6;

    let currentPage = 1;
    const totalPages = Math.ceil(productCards.length / productsPerPage);

    function showPage(page) {

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;

        productCards.forEach((card, index) => {

            if (index >= start && index < end) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }

        });

        document.getElementById("pageNumber").textContent =
            "Page " + page + " of " + totalPages;
    }

    document.getElementById("nextBtn").addEventListener("click", function () {

        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }

    });

    document.getElementById("prevBtn").addEventListener("click", function () {

        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }

    });

    showPage(1);

    // Search
    const searchInput = document.getElementById("searchInput");

    searchInput.addEventListener("keyup", function () {

        const filter = searchInput.value.toLowerCase();

        if (filter === "") {
            showPage(currentPage);
            return;
        }

        productCards.forEach((card) => {

            const title = card.querySelector("h3").textContent.toLowerCase();

            if (title.includes(filter)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }

        });

    });

});
// Water Slider

const waterSlides =
    document.querySelectorAll(".water-slide");

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