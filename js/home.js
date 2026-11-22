(() => {
  const grid = document.getElementById('dynamic-listings');
  const message = document.getElementById('listing-message');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const locationFilter = document.getElementById('location-filter');
  let listings = [];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function safeImageUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function render() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    const category = categoryFilter.value;
    const location = locationFilter.value;
    const filtered = listings.filter((item) => {
      const matchesText = !query || [item.title, item.description, item.seller_name, item.location]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query));
      return matchesText && (!category || item.category === category) && (!location || String(item.location || '').toLowerCase() === location);
    });

    grid.replaceChildren();
    if (!filtered.length) {
      grid.append(element('div', 'empty-state', listings.length
        ? 'No items match these filters. Try another search or location.'
        : 'No products are listed yet. Be the first local seller to post an item.'));
      return;
    }

    filtered.forEach((item) => {
      const card = element('article', 'product-card');
      const photo = element('div', 'product-photo');
      const imageUrl = safeImageUrl(item.image_url);
      if (imageUrl) {
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = item.title ? `${item.title} for sale in Murang’a` : 'Local product';
        image.loading = 'lazy';
        image.onerror = () => {
          image.remove();
          photo.append(element('span', 'product-placeholder', '🛍️'));
        };
        photo.append(image);
      } else {
        photo.append(element('span', 'product-placeholder', '🛍️'));
      }
      const details = element('div', 'product-details');
      details.append(element('span', 'product-category', Sokoni.categoryNames[item.category] || 'Local find'));
      details.append(element('h3', 'product-title', item.title || 'Untitled listing'));
      details.append(element('p', 'product-price', Sokoni.money(item.price)));
      details.append(element('p', 'product-location', `📍 ${Sokoni.locationName(item.location || 'Murang’a County')}`));
      if (item.seller_name) details.append(element('p', 'product-seller', `Sold by ${item.seller_name}`));
      const phone = String(item.contact_phone || '').replace(/[^+\d]/g, '');
      if (phone) {
        const contact = element('a', 'contact-seller', 'Contact seller');
        contact.href = `tel:${phone}`;
        details.append(contact);
      }
      card.append(photo, details);
      grid.append(card);
    });
  }

  async function loadListings() {
    if (!window.Sokoni?.ready) {
      Sokoni.showMessage(message, window.Sokoni?.error || 'Marketplace service is not ready.', 'error');
      return;
    }
    try {
      const { data, error } = await Sokoni.client.from('listings')
        .select('id,title,price,category,description,location,image_url,created_at,seller_name,contact_phone')
        .order('created_at', { ascending: false });
      if (error) throw error;
      listings = data || [];
      Sokoni.showMessage(message, listings.length ? `${listings.length} local ${listings.length === 1 ? 'find' : 'finds'} to explore` : 'The marketplace is ready for its first listing.');
      render();
    } catch (error) {
      Sokoni.showMessage(message, `We couldn’t load listings right now. ${error.message || 'Please try again later.'}`, 'error');
      grid.replaceChildren();
      grid.append(element('div', 'empty-state', 'Check your connection and refresh the page to try again.'));
    }
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    render();
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
  searchInput.addEventListener('input', render);
  categoryFilter.addEventListener('change', render);
  locationFilter.addEventListener('change', render);
  document.querySelectorAll('[data-category]').forEach((link) => link.addEventListener('click', () => {
    categoryFilter.value = link.dataset.category;
    render();
  }));
  loadListings();
})();
