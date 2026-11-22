(() => {
  const form = document.getElementById('listing-form');
  if (!form || !window.Sokoni?.ready) return;
  const fileInput = document.getElementById('image-input');
  const preview = document.getElementById('image-preview');
  const message = document.getElementById('listing-message');
  const submit = document.getElementById('listing-submit');
  let previewUrl = '';

  fileInput.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
    preview.replaceChildren();
    preview.hidden = true;
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      fileInput.value = '';
      Sokoni.showMessage(message, 'Choose a JPG, PNG, or WebP photo smaller than 5 MB.', 'error');
      return;
    }
    previewUrl = URL.createObjectURL(file);
    const image = document.createElement('img');
    image.src = previewUrl;
    image.alt = 'Selected product photo preview';
    preview.append(image);
    preview.hidden = false;
    Sokoni.showMessage(message, 'Photo ready to upload.');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    Sokoni.showMessage(message, '');
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = 'Posting listing…';
    let uploadedPath = '';
    try {
      const session = await Sokoni.requireSession();
      if (!session) return;
      const user = session.user;
      const formData = new FormData(form);
      const file = fileInput.files?.[0];
      let imageUrl = null;

      if (file) {
        const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' })[file.type];
        if (!extension || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPG, PNG, or WebP photo smaller than 5 MB.');
        uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await Sokoni.client.storage.from('product-images')
          .upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = Sokoni.client.storage.from('product-images').getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error } = await Sokoni.client.from('listings').insert({
        seller_id: user.id,
        seller_name: String(user.user_metadata?.full_name || '').slice(0, 100),
        contact_phone: user.phone || '',
        title: String(formData.get('title')).trim(),
        category: formData.get('category'),
        price: Number(formData.get('price')),
        description: String(formData.get('description') || '').trim(),
        location: formData.get('location'),
        image_url: imageUrl
      });
      if (error) throw error;
      window.location.assign('dashboard.html?posted=1');
    } catch (error) {
      if (uploadedPath) {
        try { await Sokoni.client.storage.from('product-images').remove([uploadedPath]); } catch { /* Keep the original listing error. */ }
      }
      Sokoni.showMessage(message, error.message || 'We couldn’t post that listing. Please try again.', 'error');
      submit.disabled = false;
      submit.textContent = 'Post listing';
    }
  });
})();
