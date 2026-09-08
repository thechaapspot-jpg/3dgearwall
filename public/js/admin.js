// 3D Gear Wall - Boxy Admin Console Controller
// Supabase Integration for Inventory & Photo Management

(function () {
  'use strict';

  // Supabase Configuration
  const SUPABASE_URL = 'https://ipcutxtnjplptmxjdtax.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwY3V0eHRuanBscHRteGpkdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NjUwMTMsImV4cCI6MjEwNDQ0MTAxM30.WHsEzjWwNl8R48b8239RUIOPjuN7xbl-RdEQGLG_1LI';

  if (!window.supabase) {
    console.error('Supabase client SDK not loaded');
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // State
  let currentProducts = [];
  let editingPhotos = [];
  let pendingDeleteId = null;

  // DOM Elements
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  const navUserInfo = document.getElementById('nav-user-info');
  const navUserEmail = document.getElementById('nav-user-email');
  const btnLogout = document.getElementById('btn-logout');

  // Auth Elements
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');
  const togglePwdBtn = document.getElementById('toggle-pwd-btn');

  // Dashboard Stat Elements
  const statTotal = document.getElementById('stat-total');
  const statInStock = document.getElementById('stat-in-stock');
  const statOutStock = document.getElementById('stat-out-stock');
  const statBrands = document.getElementById('stat-brands');

  // Filters & Table
  const searchInput = document.getElementById('search-input');
  const filterBrand = document.getElementById('filter-brand');
  const filterStock = document.getElementById('filter-stock');
  const tableBody = document.getElementById('products-table-body');
  const btnOpenAdd = document.getElementById('btn-open-add');

  // Modals
  const editModal = document.getElementById('edit-modal');
  const editForm = document.getElementById('edit-form');
  const editPhotosList = document.getElementById('edit-photos-list');
  const editPhotoUpload = document.getElementById('edit-photo-upload');
  const editPhotoUrlInput = document.getElementById('edit-photo-url-input');
  const btnAddPhotoUrl = document.getElementById('btn-add-photo-url');
  const uploadStatus = document.getElementById('upload-status');

  const addModal = document.getElementById('add-modal');
  const addForm = document.getElementById('add-form');

  const deleteModal = document.getElementById('delete-modal');
  const deleteModalText = document.getElementById('delete-modal-text');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Toast Container
  const toastContainer = document.getElementById('admin-toast-container');

  // ================= TOAST NOTIFICATIONS =================
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type === 'error' ? 'admin-toast-error' : ''}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${type === 'error' ? '⚠️' : '✓'}</span>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  // ================= MODAL HELPER FUNCTIONS =================
  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('open', 'active');
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('open', 'active');
  }

  // ================= AUTH INITIALIZATION =================
  async function initAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      handleSessionChange(session);

      supabase.auth.onAuthStateChange((event, session) => {
        handleSessionChange(session);
      });
    } catch (e) {
      console.error('Auth check error:', e);
    }
  }

  function handleSessionChange(session) {
    if (session && session.user) {
      if (authView) authView.classList.add('hidden');
      if (dashboardView) dashboardView.classList.remove('hidden');
      if (navUserInfo) {
        navUserInfo.classList.remove('hidden');
        navUserInfo.classList.add('flex');
      }
      if (navUserEmail) navUserEmail.textContent = session.user.email || 'Admin';
      loadProducts();
    } else {
      if (authView) authView.classList.remove('hidden');
      if (dashboardView) dashboardView.classList.add('hidden');
      if (navUserInfo) {
        navUserInfo.classList.add('hidden');
        navUserInfo.classList.remove('flex');
      }
      if (navUserEmail) navUserEmail.textContent = '';
    }
  }

  // Password toggle
  if (togglePwdBtn) {
    togglePwdBtn.addEventListener('click', () => {
      const isPassword = loginPassword.type === 'password';
      loginPassword.type = isPassword ? 'text' : 'password';
      togglePwdBtn.textContent = isPassword ? 'HIDE' : 'SHOW';
    });
  }

  // Sign In Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.add('hidden');
      loginError.textContent = '';

      const email = loginEmail.value.trim();
      const password = loginPassword.value;

      btnLogin.disabled = true;
      btnLogin.innerHTML = `<span>Signing in...</span>`;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Authenticated successfully');
      } catch (err) {
        loginError.textContent = err.message || 'Failed to sign in. Please verify credentials.';
        loginError.classList.remove('hidden');
      } finally {
        btnLogin.disabled = false;
        btnLogin.innerHTML = `<span>Sign In to Console</span>`;
      }
    });
  }

  // Sign Out Handler
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await supabase.auth.signOut();
      showToast('Signed out of admin console');
    });
  }

  // ================= DATA LOADING & RENDERING =================
  async function loadProducts() {
    if (!tableBody) return;
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-white/40">
          <div class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span>Loading inventory catalog from Supabase...</span>
          </div>
        </td>
      </tr>
    `;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      currentProducts = data || [];
      updateDashboardStats();
      populateBrandFilter();
      renderTable();
    } catch (err) {
      console.error('Failed to load products:', err);
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-red-400">
            Failed to load products: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
      showToast('Error loading catalog: ' + err.message, 'error');
    }
  }

  function updateDashboardStats() {
    const total = currentProducts.length;
    const inStock = currentProducts.filter(p => !p.out_of_stock).length;
    const outStock = currentProducts.filter(p => p.out_of_stock).length;
    const uniqueBrands = new Set(currentProducts.map(p => p.brand).filter(Boolean));

    if (statTotal) statTotal.textContent = total;
    if (statInStock) statInStock.textContent = inStock;
    if (statOutStock) statOutStock.textContent = outStock;
    if (statBrands) statBrands.textContent = uniqueBrands.size;
  }

  function populateBrandFilter() {
    if (!filterBrand) return;
    const brands = Array.from(new Set(currentProducts.map(p => p.brand).filter(Boolean))).sort();
    const currentVal = filterBrand.value;
    filterBrand.innerHTML = `<option value="all">All Brands (${currentProducts.length})</option>`;
    brands.forEach(b => {
      const count = currentProducts.filter(p => p.brand === b).length;
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = `${b} (${count})`;
      filterBrand.appendChild(opt);
    });
    if (brands.includes(currentVal)) {
      filterBrand.value = currentVal;
    }
  }

  function getFilteredProducts() {
    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const brand = filterBrand ? filterBrand.value : 'all';
    const stock = filterStock ? filterStock.value : 'all';

    return currentProducts.filter(p => {
      if (search) {
        const titleMatch = (p.title || p.name || '').toLowerCase().includes(search);
        const brandMatch = (p.brand || '').toLowerCase().includes(search);
        const idMatch = String(p.id).includes(search);
        if (!titleMatch && !brandMatch && !idMatch) return false;
      }
      if (brand !== 'all' && p.brand !== brand) {
        return false;
      }
      if (stock === 'in' && p.out_of_stock) return false;
      if (stock === 'out' && !p.out_of_stock) return false;

      return true;
    });
  }

  function renderTable() {
    if (!tableBody) return;
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-12 text-center text-white/40">
            No products match the selected search or filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(p => {
      const title = escapeHtml(p.title || p.name || 'Untitled Frame');
      const brand = escapeHtml(p.brand || 'Unbranded');
      const image = p.image || (Array.isArray(p.photos) && p.photos[0]) || (Array.isArray(p.images) && p.images[0]) || '/images/products/placeholder.jpg';
      const price = Number(p.price) || 0;
      const origPrice = Number(p.original_price) || 0;
      const isOutOfStock = Boolean(p.out_of_stock);
      const scale = escapeHtml(p.scale || '1:36');
      const frameSize = escapeHtml(p.frame_size || '15x20');

      return `
        <tr class="hover:bg-white/[0.03] transition-colors border-b border-white/5" data-row-id="${p.id}">
          <!-- Photo Thumbnail -->
          <td class="py-3 px-3 md:px-4 w-16">
            <div class="w-12 h-12 bg-black border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="${escapeHtml(image)}" alt="${title}" class="w-full h-full object-cover" onerror="this.src='/images/logo-footer.png'" />
            </div>
          </td>

          <!-- Title & Details -->
          <td class="py-3 px-3 md:px-4">
            <div class="flex flex-wrap items-center gap-1.5 mb-1">
              <span class="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase bg-white/10 text-white/80 border border-white/15">${brand}</span>
              <span class="text-[10px] font-mono text-white/40">#${p.id}</span>
              <span class="text-[10px] font-mono text-white/40">${scale}</span>
              <span class="text-[10px] font-mono text-white/40">${frameSize}</span>
            </div>
            <p class="font-bold text-xs md:text-sm text-white tracking-tight line-clamp-2 md:line-clamp-1">${title}</p>
          </td>

          <!-- Price -->
          <td class="py-3 px-3 md:px-4 whitespace-nowrap">
            <div class="font-mono font-black text-xs md:text-sm text-white">₹${price.toLocaleString('en-IN')}</div>
            ${origPrice > price ? `<div class="text-[10px] font-mono text-white/40 line-through">₹${origPrice.toLocaleString('en-IN')}</div>` : ''}
          </td>

          <!-- Stock Status Toggle Button -->
          <td class="py-3 px-3 md:px-4 whitespace-nowrap">
            <button 
              type="button" 
              class="stock-toggle-btn ${isOutOfStock ? 'badge-out' : 'badge-in'}" 
              data-action="toggle-stock" 
              data-id="${p.id}"
              title="Click to toggle stock status"
            >
              <span class="w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-400' : 'bg-emerald-400'}"></span>
              <span>${isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}</span>
            </button>
          </td>

          <!-- Actions -->
          <td class="py-3 px-3 md:px-4 text-right whitespace-nowrap">
            <div class="inline-flex items-center gap-1.5">
              <a href="/product/${p.id}.html" target="_blank" class="p-1.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors" title="View live page">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              </a>
              <button type="button" class="px-2.5 py-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors" data-action="edit" data-id="${p.id}">
                Edit
              </button>
              <button type="button" class="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-colors" data-action="delete" data-id="${p.id}" title="Delete Product">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filter Event Listeners
  if (searchInput) searchInput.addEventListener('input', renderTable);
  if (filterBrand) filterBrand.addEventListener('change', renderTable);
  if (filterStock) filterStock.addEventListener('change', renderTable);

  // Table Action Delegation
  if (tableBody) {
    tableBody.addEventListener('click', async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const id = Number(target.getAttribute('data-id'));
      const product = currentProducts.find(p => p.id === id);

      if (!product) return;

      if (action === 'toggle-stock') {
        await handleToggleStock(product, target);
      } else if (action === 'edit') {
        openEditModal(product);
      } else if (action === 'delete') {
        openDeleteModal(product);
      }
    });
  }

  // ================= INSTANT STOCK TOGGLE =================
  async function handleToggleStock(product, buttonEl) {
    const newStatus = !product.out_of_stock;

    // Optimistic UI Update
    product.out_of_stock = newStatus;
    buttonEl.className = `stock-toggle-btn ${newStatus ? 'badge-out' : 'badge-in'}`;
    buttonEl.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${newStatus ? 'bg-rose-400' : 'bg-emerald-400'}"></span>
      <span>${newStatus ? 'OUT OF STOCK' : 'IN STOCK'}</span>
    `;
    updateDashboardStats();

    try {
      const { error } = await supabase
        .from('products')
        .update({ out_of_stock: newStatus, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;
      showToast(`#${product.id} marked as ${newStatus ? 'OUT OF STOCK' : 'IN STOCK'}`);
    } catch (err) {
      // Revert optimistic update
      product.out_of_stock = !newStatus;
      renderTable();
      updateDashboardStats();
      showToast('Failed to update stock: ' + err.message, 'error');
    }
  }

  // ================= EDIT PRODUCT MODAL =================
  function openEditModal(product) {
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-modal-id-badge').textContent = `ID: #${product.id}`;
    document.getElementById('edit-name').value = product.title || product.name || '';
    document.getElementById('edit-brand').value = product.brand || '';
    document.getElementById('edit-price').value = product.price || '';
    document.getElementById('edit-original-price').value = product.original_price || '';
    document.getElementById('edit-scale').value = product.scale || '1:36';
    document.getElementById('edit-frame-size').value = product.frame_size || '15x20';
    document.getElementById('edit-out-of-stock').checked = Boolean(product.out_of_stock);
    document.getElementById('edit-stock').value = product.stock !== undefined && product.stock !== null ? product.stock : 10;
    document.getElementById('edit-description').value = product.description || '';

    // Initialize Photos array (check both photos and images)
    if (Array.isArray(product.photos) && product.photos.length > 0) {
      editingPhotos = [...product.photos];
    } else if (Array.isArray(product.images) && product.images.length > 0) {
      editingPhotos = [...product.images];
    } else if (product.image) {
      editingPhotos = [product.image];
    } else {
      editingPhotos = [];
    }

    renderEditPhotos();
    openModal(editModal);
  }

  function renderEditPhotos() {
    if (!editPhotosList) return;
    if (editingPhotos.length === 0) {
      editPhotosList.innerHTML = `<div class="text-xs text-white/40 italic py-4">No photos added. Upload an image or enter a URL below.</div>`;
      return;
    }

    editPhotosList.innerHTML = editingPhotos.map((url, idx) => `
      <div class="relative w-20 h-20 bg-black border ${idx === 0 ? 'border-[var(--brand-orange)] ring-1 ring-[var(--brand-orange)]' : 'border-white/15'} group flex-shrink-0">
        <img src="${escapeHtml(url)}" alt="Photo ${idx + 1}" class="w-full h-full object-cover" onerror="this.src='/images/logo-footer.png'" />
        
        ${idx === 0 ? '<span class="absolute top-1 left-1 px-1 py-0.5 bg-black/80 text-[9px] font-mono text-[var(--brand-orange)] font-bold">PRIMARY</span>' : ''}
        
        <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
          ${idx > 0 ? `
            <button type="button" class="text-[9px] font-mono bg-white/20 hover:bg-white/40 text-white px-1 py-0.5 w-full text-center" data-photo-action="set-primary" data-index="${idx}">Set Main</button>
          ` : ''}
          <button type="button" class="text-[9px] font-mono bg-red-500/80 hover:bg-red-500 text-white px-1 py-0.5 w-full text-center" data-photo-action="delete" data-index="${idx}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  // Photo actions inside Edit Modal
  if (editPhotosList) {
    editPhotosList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-photo-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-photo-action');
      const idx = Number(btn.getAttribute('data-index'));

      if (action === 'delete') {
        editingPhotos.splice(idx, 1);
        renderEditPhotos();
      } else if (action === 'set-primary') {
        const [target] = editingPhotos.splice(idx, 1);
        editingPhotos.unshift(target);
        renderEditPhotos();
      }
    });
  }

  // Add photo via URL
  if (btnAddPhotoUrl) {
    btnAddPhotoUrl.addEventListener('click', () => {
      const url = editPhotoUrlInput.value.trim();
      if (!url) return;
      editingPhotos.push(url);
      editPhotoUrlInput.value = '';
      renderEditPhotos();
      showToast('Photo added');
    });
  }

  // Add photo via File Upload (Supabase Storage bucket `product-images`)
  if (editPhotoUpload) {
    editPhotoUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (uploadStatus) {
        uploadStatus.textContent = 'Uploading to Supabase Storage...';
        uploadStatus.classList.remove('hidden');
      }

      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadErr) {
          console.warn('Storage upload fallback to data URL:', uploadErr);
          const reader = new FileReader();
          reader.onload = () => {
            editingPhotos.push(reader.result);
            renderEditPhotos();
            if (uploadStatus) uploadStatus.classList.add('hidden');
            editPhotoUpload.value = '';
            showToast('Photo attached');
          };
          reader.readAsDataURL(file);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          editingPhotos.push(publicUrlData.publicUrl);
          renderEditPhotos();
          showToast('Photo uploaded to Supabase Storage');
        }
      } catch (err) {
        console.error('Upload failed:', err);
        showToast('Upload error: ' + err.message, 'error');
      } finally {
        if (uploadStatus) uploadStatus.classList.add('hidden');
        editPhotoUpload.value = '';
      }
    });
  }

  // Save Edit Form
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-edit');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const id = Number(document.getElementById('edit-id').value);
      const title = document.getElementById('edit-name').value.trim();
      const brand = document.getElementById('edit-brand').value.trim();
      const price = Number(document.getElementById('edit-price').value);
      const original_price = Number(document.getElementById('edit-original-price').value) || null;
      const scale = document.getElementById('edit-scale').value.trim() || '1:36';
      const frame_size = document.getElementById('edit-frame-size').value.trim() || '15x20';
      const out_of_stock = document.getElementById('edit-out-of-stock').checked;
      const stock = Number(document.getElementById('edit-stock').value) || 0;
      const description = document.getElementById('edit-description').value.trim();

      const primaryImage = editingPhotos[0] || '/images/products/placeholder.jpg';

      const payload = {
        title,
        name: title,
        brand,
        price,
        original_price,
        scale,
        frame_size,
        out_of_stock,
        stock,
        description,
        image: primaryImage,
        photos: editingPhotos,
        images: editingPhotos,
        updated_at: new Date().toISOString()
      };

      try {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        // Update local state
        const idx = currentProducts.findIndex(p => p.id === id);
        if (idx !== -1) {
          currentProducts[idx] = { ...currentProducts[idx], ...payload };
        }

        renderTable();
        updateDashboardStats();
        populateBrandFilter();
        closeModal(editModal);
        showToast(`Product #${id} updated successfully`);
      } catch (err) {
        console.error('Update failed:', err);
        showToast('Failed to update: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }

  // ================= ADD NEW PRODUCT =================
  if (btnOpenAdd) {
    btnOpenAdd.addEventListener('click', () => {
      addForm.reset();
      openModal(addModal);
    });
  }

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-add');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Creating...';

      const title = document.getElementById('add-name').value.trim();
      const brand = document.getElementById('add-brand').value.trim();
      const price = Number(document.getElementById('add-price').value);
      const original_price = Number(document.getElementById('add-original-price').value) || null;
      const scale = document.getElementById('add-scale').value.trim() || '1:36';
      const frame_size = document.getElementById('add-frame-size').value.trim() || '15x20';
      const image = document.getElementById('add-image').value.trim();
      const description = document.getElementById('add-description').value.trim();

      const maxId = currentProducts.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const newId = maxId + 1;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newProduct = {
        id: newId,
        slug,
        title,
        name: title,
        brand,
        price,
        original_price,
        scale,
        frame_size,
        image,
        photos: [image],
        images: [image],
        description,
        out_of_stock: false,
        stock: 10,
        featured: true,
        is_active: true
      };

      try {
        const { data, error } = await supabase
          .from('products')
          .insert([newProduct])
          .select();

        if (error) throw error;

        currentProducts.unshift(data && data[0] ? data[0] : newProduct);
        renderTable();
        updateDashboardStats();
        populateBrandFilter();
        closeModal(addModal);
        showToast(`Created new product #${newId}: ${title}`);
      } catch (err) {
        console.error('Insert failed:', err);
        showToast('Failed to create product: ' + err.message, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Create Product';
      }
    });
  }

  // ================= DELETE PRODUCT =================
  function openDeleteModal(product) {
    pendingDeleteId = product.id;
    deleteModalText.textContent = `Are you sure you want to delete "#${product.id} - ${product.title || product.name}"? This action cannot be undone.`;
    openModal(deleteModal);
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!pendingDeleteId) return;

      btnConfirmDelete.disabled = true;
      btnConfirmDelete.textContent = 'Deleting...';

      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', pendingDeleteId);

        if (error) throw error;

        currentProducts = currentProducts.filter(p => p.id !== pendingDeleteId);
        renderTable();
        updateDashboardStats();
        populateBrandFilter();
        closeModal(deleteModal);
        showToast(`Product #${pendingDeleteId} deleted`);
      } catch (err) {
        console.error('Delete failed:', err);
        showToast('Failed to delete product: ' + err.message, 'error');
      } finally {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.textContent = 'Yes, Delete Product';
        pendingDeleteId = null;
      }
    });
  }

  // ================= MODAL CLOSE LOGIC =================
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      const modal = document.getElementById(modalId) || btn.closest('.admin-modal-backdrop');
      closeModal(modal);
    });
  });

  document.querySelectorAll('.admin-modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.admin-modal-backdrop.open, .admin-modal-backdrop.active').forEach(modal => {
        closeModal(modal);
      });
    }
  });

  // ================= TAB SWITCHING =================
  const tabBtnProducts = document.getElementById('tab-btn-products');
  const tabBtnOrders = document.getElementById('tab-btn-orders');
  const tabContentProducts = document.getElementById('tab-content-products');
  const tabContentOrders = document.getElementById('tab-content-orders');
  const badgeOrdersCount = document.getElementById('badge-orders-count');

  if (tabBtnProducts && tabBtnOrders) {
    tabBtnProducts.addEventListener('click', () => {
      tabBtnProducts.className = 'admin-btn admin-btn-primary';
      tabBtnOrders.className = 'admin-btn admin-btn-secondary';
      if (tabContentProducts) tabContentProducts.classList.remove('hidden');
      if (tabContentOrders) tabContentOrders.classList.add('hidden');
    });

    tabBtnOrders.addEventListener('click', () => {
      tabBtnOrders.className = 'admin-btn admin-btn-primary';
      tabBtnProducts.className = 'admin-btn admin-btn-secondary';
      if (tabContentOrders) tabContentOrders.classList.remove('hidden');
      if (tabContentProducts) tabContentProducts.classList.add('hidden');
      loadOrders();
    });
  }

  // ================= ORDERS MANAGEMENT =================
  let currentOrders = [];

  const ordersTableBody = document.getElementById('orders-table-body');
  const statOrdersTotal = document.getElementById('stat-orders-total');
  const statOrdersRevenue = document.getElementById('stat-orders-revenue');
  const statOrdersPending = document.getElementById('stat-orders-pending');
  const statOrdersDelivered = document.getElementById('stat-orders-delivered');
  const ordersSearchInput = document.getElementById('orders-search-input');
  const ordersFilterStatus = document.getElementById('orders-filter-status');
  const btnRefreshOrders = document.getElementById('btn-refresh-orders');

  async function loadOrders() {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-white/40">
          <div class="inline-flex items-center gap-2">
            <svg class="animate-spin h-4 w-4 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            <span>Loading orders from Supabase...</span>
          </div>
        </td>
      </tr>
    `;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      currentOrders = data || [];
      updateOrdersStats();
      renderOrdersTable();
    } catch (err) {
      console.error('Failed to load orders:', err);
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-8 text-center text-red-400">
            Failed to load orders: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
      showToast('Error loading orders: ' + err.message, 'error');
    }
  }

  function updateOrdersStats() {
    const total = currentOrders.length;
    const revenue = currentOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
    const pending = currentOrders.filter(o => !o.order_status || o.order_status === 'Order Confirmed' || o.order_status === 'Handcrafted & Framing').length;
    const delivered = currentOrders.filter(o => (o.order_status || '').toLowerCase().includes('delivered')).length;

    if (statOrdersTotal) statOrdersTotal.textContent = total;
    if (statOrdersRevenue) statOrdersRevenue.textContent = `₹${revenue.toLocaleString('en-IN')}`;
    if (statOrdersPending) statOrdersPending.textContent = pending;
    if (statOrdersDelivered) statOrdersDelivered.textContent = delivered;
    if (badgeOrdersCount) badgeOrdersCount.textContent = total;
  }

  function getFilteredOrders() {
    const search = ordersSearchInput ? ordersSearchInput.value.trim().toLowerCase() : '';
    const status = ordersFilterStatus ? ordersFilterStatus.value : 'all';

    return currentOrders.filter(o => {
      if (search) {
        const idMatch = (o.order_id || '').toLowerCase().includes(search);
        const nameMatch = (o.customer_name || '').toLowerCase().includes(search);
        const phoneMatch = (o.customer_phone || '').includes(search);
        const cityMatch = (o.city || '').toLowerCase().includes(search);
        if (!idMatch && !nameMatch && !phoneMatch && !cityMatch) return false;
      }
      if (status !== 'all' && o.order_status !== status) {
        return false;
      }
      return true;
    });
  }

  function renderOrdersTable() {
    if (!ordersTableBody) return;
    const filtered = getFilteredOrders();

    if (filtered.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="py-12 text-center text-white/40">
            No customer orders match the current filter.
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = filtered.map(o => {
      const orderId = escapeHtml(o.order_id);
      const name = escapeHtml(o.customer_name || 'Customer');
      const phone = escapeHtml(o.customer_phone || '');
      const email = escapeHtml(o.customer_email || '');
      const address = escapeHtml(o.shipping_address || '');
      const city = escapeHtml(o.city || '');
      const pincode = escapeHtml(o.pincode || '');
      const subtotal = Number(o.subtotal || 0);
      const payId = escapeHtml(o.payment_id || 'N/A');
      const status = o.order_status || 'Order Confirmed';
      const carrier = escapeHtml(o.courier_partner || 'Bluedart Express');
      const awb = escapeHtml(o.tracking_number || '');
      const dateStr = new Date(o.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      const items = Array.isArray(o.items) ? o.items : [];

      return `
        <tr class="hover:bg-white/[0.03] transition-colors border-b border-white/5" data-order-row="${orderId}">
          <!-- Order ID & Date -->
          <td class="py-3.5 px-4 align-top whitespace-nowrap">
            <span class="font-mono font-bold text-xs text-white block">${orderId}</span>
            <span class="text-[11px] font-mono text-white/40 block mt-0.5">${dateStr}</span>
            <span class="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PAID (Razorpay)</span>
          </td>

          <!-- Customer & Address -->
          <td class="py-3.5 px-4 align-top">
            <p class="font-bold text-xs text-white">${name}</p>
            <p class="text-[11px] font-mono text-white/70">
              <a href="tel:${phone}" class="hover:underline text-[var(--brand-orange)] font-semibold">${phone}</a>
              ${email ? ` • <span class="text-white/50">${email}</span>` : ''}
            </p>
            <p class="text-[11px] text-white/50 mt-1 leading-tight line-clamp-2" title="${address}">
              ${address}, ${city} - ${pincode}
            </p>
          </td>

          <!-- Items & Total -->
          <td class="py-3.5 px-4 align-top">
            <div class="space-y-1 mb-1.5">
              ${items.map(it => `
                <div class="text-[11px] text-white/80 line-clamp-1">
                  • <strong>${escapeHtml(it.name || 'Frame')}</strong> × ${it.quantity || 1} <span class="text-white/40">(${it.scale || '1:36'})</span>
                </div>
              `).join('')}
            </div>
            <div class="font-mono font-black text-sm text-emerald-400">
              ₹${subtotal.toLocaleString('en-IN')}
            </div>
            <div class="text-[10px] font-mono text-white/40" title="${payId}">
              Ref: ${payId.slice(0, 16)}...
            </div>
          </td>

          <!-- Live Shipment Status -->
          <td class="py-3.5 px-4 align-top">
            <select class="admin-input text-xs py-1.5 px-2 font-semibold cursor-pointer select-status" data-order-id="${orderId}">
              <option value="Order Confirmed" ${status === 'Order Confirmed' ? 'selected' : ''}>1. Order Confirmed</option>
              <option value="Handcrafted & Framing" ${status === 'Handcrafted & Framing' ? 'selected' : ''}>2. Framing & QC</option>
              <option value="Dispatched / In Transit" ${status === 'Dispatched / In Transit' ? 'selected' : ''}>3. In Transit</option>
              <option value="Out for Delivery" ${status === 'Out for Delivery' ? 'selected' : ''}>4. Out for Delivery</option>
              <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>5. Delivered</option>
            </select>
            <span class="text-[10px] text-white/40 block mt-1">Live customer status</span>
          </td>

          <!-- Logistics & AWB -->
          <td class="py-3.5 px-4 align-top">
            <div class="space-y-1.5">
              <input type="text" placeholder="AWB / Tracking No." value="${awb}" class="admin-input text-xs py-1 px-2 font-mono input-awb" data-order-id="${orderId}" />
              <div class="flex gap-1.5">
                <select class="admin-input text-[11px] py-1 px-1.5 select-carrier flex-1" data-order-id="${orderId}">
                  <option value="Bluedart Express" ${carrier === 'Bluedart Express' ? 'selected' : ''}>Bluedart</option>
                  <option value="Delhivery" ${carrier === 'Delhivery' ? 'selected' : ''}>Delhivery</option>
                  <option value="DTDC Express" ${carrier === 'DTDC Express' ? 'selected' : ''}>DTDC</option>
                  <option value="India SpeedPost" ${carrier === 'India SpeedPost' ? 'selected' : ''}>SpeedPost</option>
                </select>
                <button type="button" class="px-2 py-1 text-[10px] font-bold uppercase bg-white/10 hover:bg-white/20 text-white border border-white/20 btn-save-logistics" data-order-id="${orderId}">
                  Save
                </button>
              </div>
            </div>
          </td>

          <!-- Actions -->
          <td class="py-3.5 px-4 align-top text-right whitespace-nowrap">
            <a href="/track.html?order_id=${orderId}" target="_blank" class="admin-btn admin-btn-secondary text-[10px] py-1 px-2 font-mono" title="Test tracking in real-time">
              Track ↗
            </a>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Orders Table Event Delegation
  if (ordersTableBody) {
    // 1. Status change listener
    ordersTableBody.addEventListener('change', async (e) => {
      const select = e.target.closest('.select-status');
      if (!select) return;

      const orderId = select.getAttribute('data-order-id');
      const newStatus = select.value;

      select.disabled = true;
      try {
        const { error } = await supabase
          .from('orders')
          .update({ order_status: newStatus, updated_at: new Date().toISOString() })
          .eq('order_id', orderId);

        if (error) throw error;

        const ord = currentOrders.find(o => o.order_id === orderId);
        if (ord) ord.order_status = newStatus;
        updateOrdersStats();
        showToast(`Order #${orderId} status updated to "${newStatus}"`);
      } catch (err) {
        console.error('Status update failed:', err);
        showToast('Failed to update status: ' + err.message, 'error');
      } finally {
        select.disabled = false;
      }
    });

    // 2. Save logistics / AWB listener
    ordersTableBody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-save-logistics');
      if (!btn) return;

      const orderId = btn.getAttribute('data-order-id');
      const row = btn.closest('tr');
      const awbInput = row.querySelector('.input-awb');
      const carrierSelect = row.querySelector('.select-carrier');

      const tracking_number = awbInput ? awbInput.value.trim() : null;
      const courier_partner = carrierSelect ? carrierSelect.value : 'Bluedart Express';

      btn.disabled = true;
      btn.textContent = '...';

      try {
        const { error } = await supabase
          .from('orders')
          .update({
            tracking_number: tracking_number || null,
            courier_partner: courier_partner,
            order_status: tracking_number ? 'Dispatched / In Transit' : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);

        if (error) throw error;

        const ord = currentOrders.find(o => o.order_id === orderId);
        if (ord) {
          ord.tracking_number = tracking_number;
          ord.courier_partner = courier_partner;
          if (tracking_number) ord.order_status = 'Dispatched / In Transit';
        }
        renderOrdersTable();
        updateOrdersStats();
        showToast(`Saved AWB details for Order #${orderId}`);
      } catch (err) {
        console.error('AWB save failed:', err);
        showToast('Failed to save AWB: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save';
      }
    });
  }

  // Orders Filter Events
  if (ordersSearchInput) ordersSearchInput.addEventListener('input', renderOrdersTable);
  if (ordersFilterStatus) ordersFilterStatus.addEventListener('change', renderOrdersTable);
  if (btnRefreshOrders) btnRefreshOrders.addEventListener('click', loadOrders);

  // Hook into auth
  const origHandleSession = handleSessionChange;
  handleSessionChange = function(session) {
    origHandleSession(session);
    if (session && session.user) {
      loadOrders();
    }
  };

  // Start Auth Check
  initAuth();

})();
