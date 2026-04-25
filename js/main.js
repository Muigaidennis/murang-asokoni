document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector('.search-bar input[type="text"]');
  const categorySelect = document.querySelector('.search-bar select:nth-of-type(1)');
  const locationSelect = document.querySelector('.search-bar select:nth-of-type(2)');
  const searchBtn = document.getElementById("search-btn");
  const clearBtn = document.getElementById("clear-btn");
  const noResults = document.getElementById("no-results");

  const cards = document.querySelectorAll(".listing-card, .listing-small-card");

  function normalize(text) {
    return text.toLowerCase().trim();
  }

  function filterListings() {
    const keyword = normalize(searchInput.value);
    const category = normalize(categorySelect.value);
    const location = normalize(locationSelect.value);

    let visibleCount = 0;

    cards.forEach((card) => {
      const text = normalize(card.textContent);
      const matchesKeyword = !keyword || text.includes(keyword);
      const matchesCategory = !category || text.includes(category);
      const matchesLocation = !location || text.includes(location);

      if (matchesKeyword && matchesCategory && matchesLocation) {
        card.style.display = "";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }
  }

  searchBtn.addEventListener("click", filterListings);
  searchInput.addEventListener("input", filterListings);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") filterListings();
  });
  categorySelect.addEventListener("change", filterListings);
  locationSelect.addEventListener("change", filterListings);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      categorySelect.value = "";
      locationSelect.value = "";
      filterListings();
    });
  }

  filterListings();
});
