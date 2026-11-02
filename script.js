const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector(".search-input");
const categoryMenu = document.querySelector(".category-menu");
const categoryOptions = document.querySelectorAll(".category-option[data-search]");
const moreOptions = document.querySelector("#more-search-options");
const moreButton = document.querySelector(".category-more");
const menuFilters = document.querySelectorAll(".menu-filter");
const menuSections = document.querySelectorAll(".menu-section[data-menu-category]");
const searchStatus = document.querySelector("#search-status");
const receiptDialog = document.querySelector("#receipt-dialog");
const receiptMenu = document.querySelector("#receipt-menu");
const receiptPrice = document.querySelector("#receipt-price");
const receiptQuantity = document.querySelector("#receipt-quantity");
const receiptTotal = document.querySelector("#receipt-total");
const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});
let preventMenuOpen = false;
let selectedFilter = "all";
let lastBuyButton = null;

function resetPurchaseCard(card, restoreFocus = false) {
    const buyButton = card.querySelector(".buy-button");
    const purchaseControls = card.querySelector(".purchase-controls");
    const quantityInput = card.querySelector(".purchase-quantity");
    const hadControlFocus = purchaseControls.contains(document.activeElement);

    purchaseControls.hidden = true;
    quantityInput.value = "1";
    quantityInput.setCustomValidity("");
    buyButton.hidden = false;

    if (restoreFocus && hadControlFocus) {
        buyButton.focus();
    }
}

function updateMenuResults() {
    const query = searchInput.value.trim().toLocaleLowerCase("id-ID");
    let resultCount = 0;

    menuSections.forEach((section) => {
        const categoryMatches = selectedFilter === "all" || section.dataset.menuCategory === selectedFilter;
        const cards = section.querySelectorAll(".menu-card");
        let visibleInSection = 0;

        cards.forEach((card) => {
            const matchesQuery = card.textContent.toLocaleLowerCase("id-ID").includes(query);
            const isVisible = categoryMatches && matchesQuery;
            card.hidden = !isVisible;
            visibleInSection += Number(isVisible);
        });

        const shouldHideSection = visibleInSection === 0;
        section.hidden = shouldHideSection;
        section.setAttribute("aria-hidden", String(shouldHideSection));
        resultCount += visibleInSection;
    });

    searchStatus.hidden = query.length === 0;
    if (query.length > 0) {
        searchStatus.textContent = resultCount === 0
            ? `Menu "${searchInput.value.trim()}" tidak ditemukan.`
            : `${resultCount} menu ditemukan.`;
    }
}

document.querySelectorAll(".menu-card[data-price]").forEach((card) => {
    const buyButton = card.querySelector(".buy-button");
    const purchaseControls = card.querySelector(".purchase-controls");
    const quantityInput = card.querySelector(".purchase-quantity");
    const confirmButton = card.querySelector(".confirm-purchase");

    buyButton.addEventListener("click", () => {
        buyButton.hidden = true;
        purchaseControls.hidden = false;
        quantityInput.focus();
    });

    card.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "touch" || (receiptDialog.open && lastBuyButton === buyButton)) {
            return;
        }

        if (!purchaseControls.hidden) {
            resetPurchaseCard(card, true);
        }
    });

    confirmButton.addEventListener("click", () => {
        const quantity = Number(quantityInput.value);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            quantityInput.setCustomValidity("Masukkan jumlah antara 1 dan 99.");
            quantityInput.reportValidity();
            return;
        }

        quantityInput.setCustomValidity("");
        const menuName = card.querySelector("h2, h3").textContent.trim();
        const unitPrice = Number(card.dataset.price);

        receiptMenu.textContent = menuName;
        receiptPrice.textContent = rupiah.format(unitPrice);
        receiptQuantity.textContent = String(quantity);
        receiptTotal.textContent = rupiah.format(unitPrice * quantity);
        lastBuyButton = buyButton;
        receiptDialog.showModal();
    });

    quantityInput.addEventListener("input", () => quantityInput.setCustomValidity(""));
});

receiptDialog.addEventListener("close", () => {
    if (!lastBuyButton) {
        return;
    }

    const card = lastBuyButton.closest(".menu-card");
    resetPurchaseCard(card);
    lastBuyButton.focus();
    lastBuyButton = null;
});

function setMenuOpen(isOpen) {
    categoryMenu.classList.toggle("is-open", isOpen);
    searchInput.setAttribute("aria-expanded", String(isOpen));
    categoryMenu.setAttribute("aria-hidden", String(!isOpen));
}

searchInput.addEventListener("focus", () => {
    if (!preventMenuOpen) {
        setMenuOpen(true);
    }
});
searchInput.addEventListener("click", () => setMenuOpen(true));

categoryOptions.forEach((option) => {
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => {
        searchInput.value = option.dataset.search;
        updateMenuResults();
        setMenuOpen(false);
    });
});

moreButton.addEventListener("mousedown", (event) => event.preventDefault());
moreButton.addEventListener("click", () => {
    const isExpanded = moreButton.getAttribute("aria-expanded") === "true";
    moreOptions.hidden = isExpanded;
    moreButton.setAttribute("aria-expanded", String(!isExpanded));
    moreButton.textContent = isExpanded ? "Lainnya" : "Lebih sedikit";
});

menuFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
        selectedFilter = filter.dataset.filter;

        if (!["all", "food", "drink"].includes(selectedFilter)) {
            return;
        }

        menuFilters.forEach((item) => {
            const isActive = item === filter;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
        });

        updateMenuResults();
    });
});

searchInput.addEventListener("input", updateMenuResults);
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateMenuResults();
    setMenuOpen(false);
});

searchForm.addEventListener("focusout", () => {
    window.setTimeout(() => {
        if (!searchForm.contains(document.activeElement)) {
            setMenuOpen(false);
        }
    });
});

searchForm.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        setMenuOpen(false);
        preventMenuOpen = true;
        searchInput.focus();
        preventMenuOpen = false;
    }
});
