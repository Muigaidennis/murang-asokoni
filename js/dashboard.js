(() => {
  const list = document.getElementById('seller-listings');
  if (!list || !window.Sokoni?.ready) return;
  const message = document.getElementById('dashboard-message');
  const empty = document.getElementById('dashboard-empty');
  const count = document.getElementById('active-count');
  const greeting = document.getElementById('seller-greeting');
  let seller;

  function text(tag, className, content) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = content;
    return node;
  }

  async function load() {
    try {
      const session = await Sokoni.requireSession();
      if (!session) return;
      seller = session.user;
      const firstName = String(seller.user_metadata?.full_name || 'seller').trim().split(/\s+/)[0];
      greeting.textContent = `Hi, ${firstName}.`;
      const { data, error } = await Sokoni.client.from('listings')
        .select('id,title,price,category,location,created_at')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      count.textContent = String(data.length);
      list.replaceChildren();
      empty.hidden = data.length > 0;
      data.forEach((listing) => list.append(renderListing(listing)));
      if (new URLSearchParams(location.search).has('posted')) {
        Sokoni.showMessage(message, 'Your product is live on the marketplace.');
      }
    } catch (error) {
      Sokoni.showMessage(message, error.message || 'We couldn’t load your listings.', 'error');
    }
  }

  function renderListing(item) {
    const row = document.createElement('article');
    row.className = 'seller-listing';
    const details = document.createElement('div');
    details.className = 'seller-listing-info';
    details.append(text('strong', 'seller-listing-title', item.title || 'Untitled listing'));
    details.append(text('span', 'seller-listing-meta', `${Sokoni.money(item.price)} · ${Sokoni.locationName(item.location)} · ${Sokoni.categoryNames[item.category] || 'Local find'}`));
    const actions = document.createElement('div');
    actions.className = 'seller-listing-actions';
    const edit = text('button', 'btn-small', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => editListing(item));
    const remove = text('button', 'btn-small btn-danger', 'Delete');
    remove.type = 'button';
    remove.addEventListener('click', () => deleteListing(item));
    actions.append(edit, remove);
    row.append(details, actions);
    return row;
  }

  async function editListing(item) {
    const title = window.prompt('Update the product name:', item.title || '');
    if (title === null) return;
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 120) {
      Sokoni.showMessage(message, 'Product name must be between 1 and 120 characters.', 'error');
      return;
    }
    const priceInput = window.prompt('Update the price in KSh:', String(item.price ?? ''));
    if (priceInput === null) return;
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price < 0) {
      Sokoni.showMessage(message, 'Enter a valid non-negative price.', 'error');
      return;
    }
    try {
      const { error } = await Sokoni.client.from('listings').update({ title: cleanTitle, price }).eq('id', item.id).eq('seller_id', seller.id);
      if (error) throw error;
      Sokoni.showMessage(message, 'Listing updated.');
      await load();
    } catch (error) {
      Sokoni.showMessage(message, error.message || 'We couldn’t update this listing.', 'error');
    }
  }

  async function deleteListing(item) {
    if (!window.confirm(`Delete “${item.title}” from the marketplace? This cannot be undone.`)) return;
    try {
      const { error } = await Sokoni.client.from('listings').delete().eq('id', item.id).eq('seller_id', seller.id);
      if (error) throw error;
      Sokoni.showMessage(message, 'Listing deleted.');
      await load();
    } catch (error) {
      Sokoni.showMessage(message, error.message || 'We couldn’t delete this listing.', 'error');
    }
  }

  document.getElementById('logout-button').addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    try {
      const { error } = await Sokoni.client.auth.signOut();
      if (error) throw error;
      window.location.assign('index.html');
    } catch (error) {
      event.currentTarget.disabled = false;
      Sokoni.showMessage(message, error.message || 'Log out failed. Please try again.', 'error');
    }
  });
  load();
})();
