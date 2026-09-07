/**
 * 3D Gear Wall - Custom 3D Die-Cast Frame Studio
 * Interactive frame customizer: car model, frame size, background themes,
 * live 3D shadowbox positioning, plaque engraving, and direct crate checkout.
 */

(function () {
  'use strict';

  // Car models database with high-resolution cutouts
  const CAR_MODELS = [
    {
      id: 'ferrari-sf24',
      name: 'Ferrari SF-24 Formula 1',
      brand: 'Ferrari',
      tag: 'Scuderia Spec',
      scale: '1:43 / 1:64',
      image: '/category/fararri.png',
      defaultScale: 85
    },
    {
      id: 'porsche-gt3rs',
      name: 'Porsche 911 GT3 RS',
      brand: 'Porsche',
      tag: 'Weissach Track Edition',
      scale: '1:43 Scale',
      image: '/category/porche.png',
      defaultScale: 80
    },
    {
      id: 'lamborghini-sto',
      name: 'Lamborghini Huracán STO',
      brand: 'Lamborghini',
      tag: 'V10 Track Weapon',
      scale: '1:24 / 1:43',
      image: '/category/lamborgini.png',
      defaultScale: 85
    },
    {
      id: 'bmw-m3-e30',
      name: 'BMW M3 E30 Sport Evolution',
      brand: 'BMW',
      tag: 'DTM Touring Legend',
      scale: '1:43 Scale',
      image: '/category/bmw.png',
      defaultScale: 85
    },
    {
      id: 'mercedes-amg-f1',
      name: 'Mercedes-AMG Petronas F1',
      brand: 'Mercedes-AMG',
      tag: 'Silver Arrows Spec',
      scale: '1:36 / 1:64',
      image: '/category/mercedes.png',
      defaultScale: 85
    },
    {
      id: 'mclaren-720s',
      name: 'McLaren 720S Performance',
      brand: 'McLaren',
      tag: 'Papaya Supercar',
      scale: '1:36 Scale',
      image: '/category/mclaren.png',
      defaultScale: 85
    },
    {
      id: 'shelby-gt500',
      name: 'Ford Mustang Shelby GT500',
      brand: 'Classic',
      tag: 'American Muscle Legend',
      scale: '1:43 Scale',
      image: '/category/classic.png',
      defaultScale: 80
    },
    {
      id: 'nissan-gtr',
      name: 'Nissan GT-R R35 Nismo',
      brand: 'Nissan',
      tag: 'Godzilla Supercar',
      scale: '1:43 Scale',
      image: '/images/products/atgyatzsaxvqquqbsocs.jpg',
      defaultScale: 75
    },
    {
      id: 'batman-tumbler',
      name: 'Batmobile Tumbler Edition',
      brand: 'Batman',
      tag: 'Dark Knight Special',
      scale: '1:64 Scale',
      image: '/images/products/ayadrx7msqptgvwh3z80.jpg',
      defaultScale: 75
    }
  ];

  // Frame sizes with real pricing
  const FRAME_SIZES = [
    {
      id: 'desk-15x20',
      label: 'Desk Frame (15×20 cm)',
      sub: 'Ideal for study desk, workstation, or nightstand',
      aspect: '3/4',
      price: 599,
      originalPrice: 899,
      badge: 'Compact'
    },
    {
      id: 'standard-a4',
      label: 'Standard Collector (A4 - 21×30 cm)',
      sub: 'The gold standard for die-cast frame collections',
      aspect: '1/1.414',
      price: 799,
      originalPrice: 1199,
      badge: 'Popular',
      isDefault: true
    },
    {
      id: 'gallery-a3',
      label: 'Gallery Exhibition (A3 - 30×42 cm)',
      sub: 'Bold dramatic statement for living rooms & garages',
      aspect: '1/1.414',
      price: 999,
      originalPrice: 1499,
      badge: 'Exhibition'
    }
  ];

  // Background presets
  const BACKGROUNDS = [
    {
      id: 'blueprint',
      name: 'Monaco CAD Blueprint',
      desc: 'Technical chassis schematics & engineering grid',
      type: 'blueprint',
      previewCss: 'background: #09131f; border-color: rgba(0, 220, 255, 0.4);'
    },
    {
      id: 'carbon',
      name: 'Carbon Fiber Weave',
      desc: 'Ultra-dark 3K twill matte carbon composite',
      type: 'carbon',
      previewCss: 'background: #111114; border-color: rgba(255, 255, 255, 0.2);'
    },
    {
      id: 'monza-dark',
      name: 'Monza Pitlane Stealth',
      desc: 'Asphalt asphalt gradient with racing stripe',
      type: 'monza',
      previewCss: 'background: #121217; border-color: rgba(255, 255, 255, 0.25);'
    },
    {
      id: 'corsa-red',
      name: 'Scuderia Corsa Crimson',
      desc: 'Deep Italian racing red with speed vignette',
      type: 'corsa',
      previewCss: 'background: #400707; border-color: rgba(255, 60, 60, 0.4);'
    },
    {
      id: 'nurburgring',
      name: 'Nürburgring Apex Track',
      desc: 'Stealth dark green elevation & circuit telemetry',
      type: 'nurburgring',
      previewCss: 'background: #0d1a14; border-color: rgba(34, 197, 94, 0.4);'
    },
    {
      id: 'cyber-drift',
      name: 'Cyber Drift Neon',
      desc: 'Midnight obsidian with electric violet & cyan glow',
      type: 'cyber',
      previewCss: 'background: #100a1c; border-color: rgba(168, 85, 247, 0.4);'
    },
    {
      id: 'studio-white',
      name: 'Exhibition Studio White',
      desc: 'Clean gallery museum backdrop with clean typography',
      type: 'studio',
      previewCss: 'background: #f8fafc; border-color: rgba(0, 0, 0, 0.2);'
    }
  ];

  // Frame border finishes
  const FRAME_FINISHES = [
    { id: 'matte-black', label: 'Stealth Matte Black', border: '#121214', innerShadow: 'rgba(0,0,0,0.85)' },
    { id: 'brushed-silver', label: 'Brushed Titanium', border: '#737373', innerShadow: 'rgba(0,0,0,0.6)' },
    { id: 'gallery-oak', label: 'Natural Gallery Oak', border: '#5c3a21', innerShadow: 'rgba(0,0,0,0.6)' },
    { id: 'polar-white', label: 'Polar White', border: '#eaeaea', innerShadow: 'rgba(0,0,0,0.3)' }
  ];

  // State
  const state = {
    selectedCar: CAR_MODELS[0],
    selectedSize: FRAME_SIZES[1],
    selectedBg: BACKGROUNDS[0],
    selectedFinish: FRAME_FINISHES[0],
    orientation: 'portrait', // 'portrait' or 'landscape'
    plaqueText: '3D GEAR WALL • COLLECTOR SPEC',
    carScale: 85,
    carRotation: 0,
    carPos: { x: 50, y: 48 }, // Percentage center
    customBgUrl: null,
    customCarUrl: null,
    activeBrandFilter: 'All'
  };

  // Dragging state
  let isDragging = false;
  let dragStartMouse = { x: 0, y: 0 };
  let dragStartPos = { x: 50, y: 48 };

  // DOM Elements
  let carPreviewEl, carImgEl, frameBoxEl, plaqueEl, bgSurfaceEl;
  let priceDisplayEl, originalPriceEl, summaryTitleEl, summarySpecsEl;

  function init() {
    // Check if customize container exists
    const root = document.getElementById('customize-studio-root');
    if (!root) return;

    // Check URL search params for ?product= or ?brand=
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    const brandParam = params.get('brand');

    if (productId) {
      const found = CAR_MODELS.find(c => c.id === productId || c.name.toLowerCase().includes(productId.toLowerCase()));
      if (found) state.selectedCar = found;
    } else if (brandParam) {
      const found = CAR_MODELS.find(c => c.brand.toLowerCase() === brandParam.toLowerCase());
      if (found) {
        state.selectedCar = found;
        state.activeBrandFilter = found.brand;
      }
    }

    renderStudioUI(root);
    setupEventListeners();
    updateLivePreview();
  }

  function renderStudioUI(container) {
    container.innerHTML = `
      <!-- Main Studio Workspace -->
      <section class="py-8 sm:py-12 md:py-16 bg-[#f8f9fa] min-h-screen">
        <div class="container mx-auto px-4 sm:px-6 md:px-12">
          
          <!-- Split Grid: Left = Interactive Preview, Right = Configuration Controls -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            
            <!-- LEFT COLUMN: Live 3D Frame Preview (Sticky on Desktop) -->
            <div class="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24 w-full">
              <div class="bg-white border border-black/10 p-4 sm:p-6 md:p-8 shadow-sm">
                
                <!-- Preview Toolbar -->
                <div class="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-black/10">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Live Real-Time View</span>
                    <h2 class="text-base sm:text-lg font-black text-black tracking-tight" id="preview-frame-title">A4 Standard Collector Frame</h2>
                  </div>
                  <div class="flex items-center gap-2">
                    <button id="btn-toggle-orientation" class="px-3.5 py-1.5 text-xs font-semibold bg-black/[0.03] hover:bg-black text-black hover:text-white border border-black/10 transition-colors flex items-center gap-1.5 cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                      <span id="orientation-label">Portrait</span>
                    </button>
                    <button id="btn-reset-car" class="px-3.5 py-1.5 text-xs font-semibold bg-black/[0.03] hover:bg-black text-black hover:text-white border border-black/10 transition-colors cursor-pointer" title="Reset Car Position">
                      Reset Position
                    </button>
                  </div>
                </div>

                <!-- 3D Shadow Box Frame Canvas Container -->
                <div class="relative flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/[0.03] border border-black/10 overflow-hidden min-h-[380px] sm:min-h-[460px] md:min-h-[560px] select-none w-full">
                  
                  <!-- Physical 3D Frame Wrapper (Responsive) -->
                  <div id="frame-shadow-box" class="relative transition-all duration-300 shadow-2xl flex flex-col items-center justify-between"
                       style="width: 100%; max-width: 320px; aspect-ratio: 1 / 1.38; border: 12px solid #141416; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6), inset 0 0 25px rgba(0,0,0,0.85); background: #0c0c10; overflow: hidden;">
                    
                    <!-- Background Canvas Surface -->
                    <div id="frame-bg-surface" class="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
                      <!-- Dynamic background pattern or uploaded image injected here -->
                    </div>

                    <!-- Subtle Glass Glare Reflection Layer -->
                    <div class="absolute inset-0 pointer-events-none z-20"
                         style="background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, transparent 60%);"></div>

                    <!-- Top Spec Header inside frame -->
                    <div class="relative z-10 w-full pt-3 px-4 sm:pt-4 sm:px-5 flex items-center justify-between text-white/50 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase pointer-events-none">
                      <span id="frame-brand-badge">FERRARI CORSA</span>
                      <span id="frame-scale-badge">1:43 DIE-CAST</span>
                    </div>

                    <!-- Car Stage & Interactive Drag Area -->
                    <div id="frame-drag-stage" class="relative w-full flex-1 cursor-grab active:cursor-grabbing z-10 min-h-[220px]"
                         title="Click and drag car to reposition!">
                      
                      <!-- Car Transform Wrapper -->
                      <div id="frame-car-wrapper" class="absolute transition-transform duration-75"
                           style="left: 50%; top: 48%; transform: translate(-50%, -50%) scale(0.85) rotate(0deg); touch-action: none;">
                        <img id="frame-car-img" src="/category/fararri.png" alt="Custom Car"
                             class="max-w-[260px] sm:max-w-[320px] h-auto object-contain pointer-events-none transition-all"
                             style="filter: drop-shadow(0 25px 20px rgba(0,0,0,0.75)) drop-shadow(0 5px 10px rgba(0,0,0,0.5));" />
                      </div>

                      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest text-white/60 bg-black/70 border border-white/10 px-3 py-1 pointer-events-none whitespace-nowrap font-mono">
                        <span>✦ Drag to Reposition</span>
                      </div>
                    </div>

                    <!-- Metallic Engraved Plaque at Bottom of Frame -->
                    <div class="relative z-10 w-full pb-3 px-4 sm:pb-4 sm:px-6 flex justify-center pointer-events-none">
                      <div id="frame-plaque" class="w-full max-w-[240px] py-1.5 px-2.5 text-center border shadow-lg transition-all"
                           style="background: linear-gradient(180deg, #2a2a2e 0%, #161619 100%); border-color: rgba(255,255,255,0.25); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.6);">
                        <p id="plaque-display-text" class="text-[9px] sm:text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase font-mono truncate">
                          3D GEAR WALL • COLLECTOR SPEC
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Live Slider Adjustments -->
                <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-black/10">
                  <div>
                    <div class="flex justify-between items-center text-xs font-semibold text-black/70 mb-1.5">
                      <span>Model Scale</span>
                      <span id="car-scale-val" class="text-black font-bold">85%</span>
                    </div>
                    <input type="range" id="slider-car-scale" min="40" max="115" value="85"
                           class="w-full h-2 bg-black/10 appearance-none cursor-pointer"
                           style="accent-color: #000000;" />
                  </div>
                  <div>
                    <div class="flex justify-between items-center text-xs font-semibold text-black/70 mb-1.5">
                      <span>Dynamic Tilt / Rotation</span>
                      <span id="car-rot-val" class="text-black font-bold">0°</span>
                    </div>
                    <input type="range" id="slider-car-rot" min="-30" max="30" value="0"
                           class="w-full h-2 bg-black/10 appearance-none cursor-pointer"
                           style="accent-color: #000000;" />
                  </div>
                </div>

              </div>
            </div>

            <!-- RIGHT COLUMN: 4-Step Configurator Panel -->
            <div class="lg:col-span-6 xl:col-span-5 space-y-6">
              
              <!-- STEP 1: Select Car Model -->
              <div class="bg-white border border-black/10 p-6 md:p-8 shadow-sm">
                <div class="flex items-center gap-3 mb-5 pb-3 border-b border-black/10">
                  <span class="w-7 h-7 bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <h3 class="text-lg font-black text-black tracking-tight uppercase">Select Model / Legend</h3>
                </div>

                <!-- Brand Filter Chips -->
                <div class="flex flex-wrap gap-1.5 mb-4" id="car-brand-chips">
                  <!-- Chips injected via JS -->
                </div>

                <!-- Car Grid Selection -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1" id="car-selection-grid">
                  <!-- Car cards injected via JS -->
                </div>

                <!-- Upload Custom Car Option -->
                <div class="mt-4 pt-4 border-t border-black/10">
                  <label class="flex items-center justify-between p-3.5 border border-dashed border-black/20 hover:border-black cursor-pointer transition-colors bg-black/[0.02] hover:bg-black/[0.04]">
                    <div class="flex items-center gap-2.5">
                      <span class="text-base">📸</span>
                      <div>
                        <p class="text-xs font-bold text-black">Upload Your Own Vehicle Photo</p>
                        <p class="text-[10px] text-black/50">PNG or JPG with transparent or solid background</p>
                      </div>
                    </div>
                    <span class="text-xs font-semibold px-3 py-1 bg-black text-white">Browse</span>
                    <input type="file" id="input-custom-car" accept="image/*" class="hidden" />
                  </label>
                </div>
              </div>

              <!-- STEP 2: Frame Size & Proportions -->
              <div class="bg-white border border-black/10 p-6 md:p-8 shadow-sm">
                <div class="flex items-center justify-between mb-5 pb-3 border-b border-black/10">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <h3 class="text-lg font-black text-black tracking-tight uppercase">Choose Frame Size</h3>
                  </div>
                  <span class="text-[10px] font-bold text-black uppercase tracking-wider bg-black/5 px-2 py-0.5 border border-black/10">Save 33%</span>
                </div>

                <div class="space-y-3" id="size-options-container">
                  <!-- Injected via JS -->
                </div>
              </div>

              <!-- STEP 3: Background Art & Themes -->
              <div class="bg-white border border-black/10 p-6 md:p-8 shadow-sm">
                <div class="flex items-center justify-between mb-5 pb-3 border-b border-black/10">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <h3 class="text-lg font-black text-black tracking-tight uppercase">Select Background Art</h3>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2.5" id="background-options-grid">
                  <!-- Background cards injected via JS -->
                </div>

                <!-- Upload Custom Background Option -->
                <div class="mt-4 pt-4 border-t border-black/10">
                  <label class="flex items-center justify-between p-3.5 border border-dashed border-black/20 hover:border-black cursor-pointer transition-colors bg-black/[0.02] hover:bg-black/[0.04]">
                    <div class="flex items-center gap-2.5">
                      <span class="text-base">🎨</span>
                      <div>
                        <p class="text-xs font-bold text-black">Upload Custom Art / Wallpaper</p>
                        <p class="text-[10px] text-black/50">High-res vertical image for backboard</p>
                      </div>
                    </div>
                    <span class="text-xs font-semibold px-3 py-1 bg-black text-white">Upload</span>
                    <input type="file" id="input-custom-bg" accept="image/*" class="hidden" />
                  </label>
                </div>
              </div>

              <!-- STEP 4: Personalize Plaque & Frame Finish -->
              <div class="bg-white border border-black/10 p-6 md:p-8 shadow-sm">
                <div class="flex items-center gap-3 mb-5 pb-3 border-b border-black/10">
                  <span class="w-7 h-7 bg-black text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                  <h3 class="text-lg font-black text-black tracking-tight uppercase">Frame Finish & Plaque</h3>
                </div>

                <!-- Frame Bevel Finish -->
                <div class="mb-5">
                  <label class="block text-xs font-bold text-black/70 uppercase tracking-wider mb-2">Shadowbox Border Finish</label>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="frame-finishes-container">
                    <!-- Injected via JS -->
                  </div>
                </div>

                <!-- Custom Plaque Inscription -->
                <div>
                  <label for="input-plaque" class="block text-xs font-bold text-black/70 uppercase tracking-wider mb-1.5">
                    Engraved Nameplate Inscription
                  </label>
                  <input type="text" id="input-plaque" maxlength="36"
                         placeholder="e.g. VIPUL'S GARAGE • EDITION #01"
                         value="3D GEAR WALL • COLLECTOR SPEC"
                         class="w-full px-4 py-3.5 bg-black/[0.03] border border-black/10 text-black placeholder:text-black/30 text-sm focus:outline-none focus:border-black focus:bg-white transition-all font-mono" />
                  <p class="text-[10px] text-black/40 mt-1">Laser-etched onto the metallic plaque plate inside the frame.</p>
                </div>
              </div>

              <!-- ORDER ACTION & DYNAMIC PRICING BOX (Boxy Design Matching Contact Page) -->
              <div class="bg-white border border-black/10 p-6 md:p-8 shadow-sm">
                <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-5 pb-5 border-b border-black/10">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">Collector Spec Total</span>
                    <h4 class="text-2xl font-black text-black tracking-tight mt-0.5" id="summary-car-title">Ferrari SF-24</h4>
                    <p class="text-xs text-black/60 mt-0.5" id="summary-specs-desc">Standard A4 Frame • Monaco CAD Blueprint</p>
                  </div>
                  <div class="flex items-baseline gap-2.5">
                    <span class="text-sm text-black/40 line-through font-semibold" id="summary-original-price">₹1,199</span>
                    <span class="text-3xl font-black text-black tracking-tight" id="summary-live-price">₹799</span>
                  </div>
                </div>

                <!-- Perks Checklist (Clean Boxy Badges) -->
                <div class="grid grid-cols-2 gap-2.5 text-xs mb-6 font-medium text-black/80">
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span>
                    <span>Free All-India Shipping</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span>
                    <span>Deep 35mm Shadowbox</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span>
                    <span>Museum Acrylic Shield</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="w-4 h-4 bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">✓</span>
                    <span>Ready-to-Hang Hardware</span>
                  </div>
                </div>

                <!-- Action Buttons: Solid Black Action Button Matching Contact Page -->
                <div class="flex flex-col sm:flex-row gap-3">
                  <button id="btn-add-to-crate"
                          class="w-full sm:flex-1 py-4 bg-black text-white font-semibold text-sm hover:bg-black/90 transition-colors flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span>Add to Crate</span>
                  </button>

                  <button id="btn-buy-now"
                          class="w-full sm:flex-1 py-4 bg-gradient-to-r from-[var(--brand-orange)] via-[var(--brand-red)] to-[var(--brand-pink)] text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider shadow-lg shadow-black/10">
                    <span>Buy Now</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>
    `;

    // Cache elements
    carPreviewEl = document.getElementById('frame-car-wrapper');
    carImgEl = document.getElementById('frame-car-img');
    frameBoxEl = document.getElementById('frame-shadow-box');
    plaqueEl = document.getElementById('frame-plaque');
    bgSurfaceEl = document.getElementById('frame-bg-surface');
    priceDisplayEl = document.getElementById('summary-live-price');
    originalPriceEl = document.getElementById('summary-original-price');
    summaryTitleEl = document.getElementById('summary-car-title');
    summarySpecsEl = document.getElementById('summary-specs-desc');

    renderBrandFilterChips();
    renderCarSelectionGrid();
    renderSizeOptions();
    renderBackgroundOptions();
    renderFrameFinishes();
  }

  function renderBrandFilterChips() {
    const container = document.getElementById('car-brand-chips');
    if (!container) return;

    const brands = ['All', 'Ferrari', 'Porsche', 'Lamborghini', 'BMW', 'Mercedes-AMG', 'McLaren', 'Classic', 'Nissan', 'Batman'];
    container.innerHTML = brands.map(b => `
      <button class="brand-chip px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
        state.activeBrandFilter === b
          ? 'bg-black text-white border-black'
          : 'bg-black/[0.03] text-black/70 border-black/10 hover:border-black hover:text-black'
      }" data-brand="${b}">
        ${b}
      </button>
    `).join('');

    container.querySelectorAll('.brand-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeBrandFilter = btn.getAttribute('data-brand');
        renderBrandFilterChips();
        renderCarSelectionGrid();
      });
    });
  }

  function renderCarSelectionGrid() {
    const grid = document.getElementById('car-selection-grid');
    if (!grid) return;

    const filtered = state.activeBrandFilter === 'All'
      ? CAR_MODELS
      : CAR_MODELS.filter(c => c.brand.toLowerCase() === state.activeBrandFilter.toLowerCase());

    grid.innerHTML = filtered.map(car => {
      const isSelected = state.selectedCar && state.selectedCar.id === car.id;
      return `
        <div class="car-card cursor-pointer p-3 border transition-all duration-200 flex flex-col items-center text-center ${
          isSelected
            ? 'border-black ring-1 ring-black bg-black/[0.04]'
            : 'border-black/10 hover:border-black hover:bg-black/[0.02]'
        }" data-car-id="${car.id}">
          <div class="w-full h-16 relative flex items-center justify-center overflow-hidden mb-1.5">
            <img src="${car.image}" alt="${car.name}" class="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105" />
          </div>
          <p class="text-[11px] font-bold text-black line-clamp-1 w-full">${car.name}</p>
          <span class="text-[9px] text-black/50 uppercase tracking-wider font-semibold">${car.brand}</span>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.car-card').forEach(card => {
      card.addEventListener('click', () => {
        const carId = card.getAttribute('data-car-id');
        const found = CAR_MODELS.find(c => c.id === carId);
        if (found) {
          state.selectedCar = found;
          state.customCarUrl = null;
          state.carScale = found.defaultScale || 85;
          document.getElementById('slider-car-scale').value = state.carScale;
          document.getElementById('car-scale-val').textContent = state.carScale + '%';
          renderCarSelectionGrid();
          updateLivePreview();
        }
      });
    });
  }

  function renderSizeOptions() {
    const container = document.getElementById('size-options-container');
    if (!container) return;

    container.innerHTML = FRAME_SIZES.map(size => {
      const isSelected = state.selectedSize.id === size.id;
      return `
        <div class="size-card cursor-pointer p-4 border transition-all flex items-center justify-between ${
          isSelected
            ? 'border-black ring-1 ring-black bg-black/[0.03]'
            : 'border-black/10 hover:border-black bg-white'
        }" data-size-id="${size.id}">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 border flex items-center justify-center ${
              isSelected ? 'border-black bg-black text-white' : 'border-black/30'
            }">
              ${isSelected ? '<span class="text-[10px] font-bold">✓</span>' : ''}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-black">${size.label}</p>
                <span class="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border border-black/10 bg-black/5 text-black/60">${size.badge}</span>
              </div>
              <p class="text-xs text-black/50">${size.sub}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs text-black/40 line-through">₹${size.originalPrice}</p>
            <p class="text-base font-bold text-black">₹${size.price}</p>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.size-card').forEach(card => {
      card.addEventListener('click', () => {
        const sizeId = card.getAttribute('data-size-id');
        const found = FRAME_SIZES.find(s => s.id === sizeId);
        if (found) {
          state.selectedSize = found;
          renderSizeOptions();
          updateLivePreview();
        }
      });
    });
  }

  function renderBackgroundOptions() {
    const grid = document.getElementById('background-options-grid');
    if (!grid) return;

    grid.innerHTML = BACKGROUNDS.map(bg => {
      const isSelected = !state.customBgUrl && state.selectedBg.id === bg.id;
      return `
        <div class="bg-card cursor-pointer p-3 border transition-all flex flex-col justify-between ${
          isSelected
            ? 'border-black ring-1 ring-black bg-black/[0.03]'
            : 'border-black/10 hover:border-black bg-white'
        }" data-bg-id="${bg.id}">
          <div class="w-full h-14 mb-2 overflow-hidden border border-black/10" style="${bg.previewCss}">
            <!-- Miniature representation -->
            <div class="w-full h-full opacity-40 flex items-center justify-center text-[10px] text-white/70 font-mono">
              ${bg.name.split(' ')[0]}
            </div>
          </div>
          <div>
            <p class="text-xs font-bold text-black leading-tight">${bg.name}</p>
            <p class="text-[10px] text-black/50 line-clamp-1">${bg.desc}</p>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.bg-card').forEach(card => {
      card.addEventListener('click', () => {
        const bgId = card.getAttribute('data-bg-id');
        const found = BACKGROUNDS.find(b => b.id === bgId);
        if (found) {
          state.selectedBg = found;
          state.customBgUrl = null;
          renderBackgroundOptions();
          updateLivePreview();
        }
      });
    });
  }

  function renderFrameFinishes() {
    const container = document.getElementById('frame-finishes-container');
    if (!container) return;

    container.innerHTML = FRAME_FINISHES.map(finish => {
      const isSelected = state.selectedFinish.id === finish.id;
      return `
        <button class="finish-btn p-2.5 border text-center transition-all cursor-pointer ${
          isSelected
            ? 'border-black ring-1 ring-black bg-black/5'
            : 'border-black/10 hover:border-black'
        }" data-finish-id="${finish.id}">
          <div class="w-6 h-6 mx-auto mb-1.5 border border-black/20"
               style="background: ${finish.border};"></div>
          <span class="text-[10px] font-bold text-black line-clamp-1">${finish.label.split(' ')[0]}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.finish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const finishId = btn.getAttribute('data-finish-id');
        const found = FRAME_FINISHES.find(f => f.id === finishId);
        if (found) {
          state.selectedFinish = found;
          renderFrameFinishes();
          updateLivePreview();
        }
      });
    });
  }

  function setupEventListeners() {
    // Car scale slider
    const scaleSlider = document.getElementById('slider-car-scale');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', (e) => {
        state.carScale = Number(e.target.value);
        document.getElementById('car-scale-val').textContent = state.carScale + '%';
        applyCarTransform();
      });
    }

    // Car rotation slider
    const rotSlider = document.getElementById('slider-car-rot');
    if (rotSlider) {
      rotSlider.addEventListener('input', (e) => {
        state.carRotation = Number(e.target.value);
        document.getElementById('car-rot-val').textContent = state.carRotation + '°';
        applyCarTransform();
      });
    }

    // Orientation toggle
    const orientBtn = document.getElementById('btn-toggle-orientation');
    if (orientBtn) {
      orientBtn.addEventListener('click', () => {
        state.orientation = state.orientation === 'portrait' ? 'landscape' : 'portrait';
        document.getElementById('orientation-label').textContent = state.orientation === 'portrait' ? 'Portrait' : 'Landscape';
        updateLivePreview();
      });
    }

    // Reset car position
    const resetBtn = document.getElementById('btn-reset-car');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.carPos = { x: 50, y: 48 };
        state.carRotation = 0;
        state.carScale = state.selectedCar.defaultScale || 85;
        document.getElementById('slider-car-scale').value = state.carScale;
        document.getElementById('car-scale-val').textContent = state.carScale + '%';
        document.getElementById('slider-car-rot').value = 0;
        document.getElementById('car-rot-val').textContent = '0°';
        applyCarTransform();
      });
    }

    // Plaque input
    const plaqueInput = document.getElementById('input-plaque');
    if (plaqueInput) {
      plaqueInput.addEventListener('input', (e) => {
        state.plaqueText = e.target.value.trim() || `${state.selectedCar.name.toUpperCase()} • COLLECTOR SPEC`;
        document.getElementById('plaque-display-text').textContent = state.plaqueText;
      });
    }

    // Custom Car Upload
    const customCarInput = document.getElementById('input-custom-car');
    if (customCarInput) {
      customCarInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            state.customCarUrl = ev.target.result;
            state.selectedCar = {
              id: 'custom-car-' + Date.now(),
              name: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
              brand: 'Custom Vehicle',
              tag: 'Personal Spec',
              scale: 'Custom 1:43',
              image: ev.target.result,
              defaultScale: 80
            };
            renderCarSelectionGrid();
            updateLivePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Custom Background Upload
    const customBgInput = document.getElementById('input-custom-bg');
    if (customBgInput) {
      customBgInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            state.customBgUrl = ev.target.result;
            renderBackgroundOptions();
            updateLivePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Interactive Dragging on the frame stage
    const dragStage = document.getElementById('frame-drag-stage');
    if (dragStage) {
      dragStage.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        dragStartMouse = { x: e.clientX, y: e.clientY };
        dragStartPos = { ...state.carPos };
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging || !dragStage) return;
        const rect = dragStage.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartMouse.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartMouse.y) / rect.height) * 100;

        state.carPos.x = Math.max(15, Math.min(85, dragStartPos.x + deltaX));
        state.carPos.y = Math.max(20, Math.min(80, dragStartPos.y + deltaY));
        applyCarTransform();
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });

      // Touch events
      dragStage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          dragStartMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          dragStartPos = { ...state.carPos };
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (!isDragging || !dragStage || e.touches.length !== 1) return;
        const rect = dragStage.getBoundingClientRect();
        const deltaX = ((e.touches[0].clientX - dragStartMouse.x) / rect.width) * 100;
        const deltaY = ((e.touches[0].clientY - dragStartMouse.y) / rect.height) * 100;

        state.carPos.x = Math.max(15, Math.min(85, dragStartPos.x + deltaX));
        state.carPos.y = Math.max(20, Math.min(80, dragStartPos.y + deltaY));
        applyCarTransform();
      }, { passive: true });

      window.addEventListener('touchend', () => {
        isDragging = false;
      });
    }

    // "Add to Crate" Button
    const addCrateBtn = document.getElementById('btn-add-to-crate');
    if (addCrateBtn) {
      addCrateBtn.addEventListener('click', handleAddToCart);
    }

    // "Buy Now" Button
    const buyNowBtn = document.getElementById('btn-buy-now');
    if (buyNowBtn) {
      buyNowBtn.addEventListener('click', () => {
        handleAddToCart();
        if (window.openCheckoutModal) {
          window.openCheckoutModal();
        }
      });
    }
  }

  function applyCarTransform() {
    if (!carPreviewEl) return;
    carPreviewEl.style.left = `${state.carPos.x}%`;
    carPreviewEl.style.top = `${state.carPos.y}%`;
    const scale = state.carScale / 100;
    carPreviewEl.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${state.carRotation}deg)`;
  }

  function updateLivePreview() {
    if (!frameBoxEl) return;

    // 1. Frame dimensions based on orientation and size (FULLY RESPONSIVE)
    if (state.orientation === 'landscape') {
      frameBoxEl.style.width = '100%';
      frameBoxEl.style.maxWidth = '460px';
      frameBoxEl.style.aspectRatio = '1.38 / 1';
      frameBoxEl.style.height = 'auto';
    } else {
      frameBoxEl.style.width = '100%';
      frameBoxEl.style.maxWidth = '320px';
      frameBoxEl.style.aspectRatio = '1 / 1.38';
      frameBoxEl.style.height = 'auto';
    }

    // 2. Frame finish border
    frameBoxEl.style.borderColor = state.selectedFinish.border;
    frameBoxEl.style.boxShadow = `0 30px 60px -15px rgba(0,0,0,0.6), inset 0 0 25px ${state.selectedFinish.innerShadow}`;

    // 3. Car Image & Badges
    const car = state.selectedCar;
    if (carImgEl) {
      carImgEl.src = state.customCarUrl || car.image;
      carImgEl.alt = car.name;
    }
    document.getElementById('frame-brand-badge').textContent = car.brand.toUpperCase();
    document.getElementById('frame-scale-badge').textContent = car.scale.toUpperCase();

    // 4. Background Rendering
    renderBackgroundSurface();

    // 5. Plaque text
    const plaqueText = state.plaqueText || `${car.name.toUpperCase()} • COLLECTOR SPEC`;
    document.getElementById('plaque-display-text').textContent = plaqueText;

    // 6. Header and Summary
    document.getElementById('preview-frame-title').textContent = `${state.selectedSize.label} (${state.orientation})`;
    summaryTitleEl.textContent = car.name;
    summarySpecsEl.textContent = `${state.selectedSize.label} • ${state.selectedBg.name} • ${state.selectedFinish.label}`;
    priceDisplayEl.textContent = `₹${state.selectedSize.price}`;
    originalPriceEl.textContent = `₹${state.selectedSize.originalPrice}`;

    applyCarTransform();
  }

  function renderBackgroundSurface() {
    if (!bgSurfaceEl) return;

    if (state.customBgUrl) {
      bgSurfaceEl.innerHTML = `
        <div class="w-full h-full bg-cover bg-center" style="background-image: url('${state.customBgUrl}');"></div>
        <div class="absolute inset-0 bg-black/20"></div>
      `;
      return;
    }

    const bg = state.selectedBg;
    switch (bg.type) {
      case 'blueprint':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: #08111d;">
            <!-- Blueprint grid -->
            <div class="absolute inset-0" style="background-image: linear-gradient(rgba(0,220,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,255,0.08) 1px, transparent 1px); background-size: 24px 24px;"></div>
            <div class="absolute inset-0" style="background-image: linear-gradient(rgba(0,220,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,220,255,0.18) 1px, transparent 1px); background-size: 96px 96px;"></div>
            <!-- Blueprint crosshairs & CAD telemetry -->
            <div class="absolute top-8 left-6 text-[8px] font-mono text-[rgba(0,220,255,0.4)] tracking-widest leading-loose">
              <div>SECTION: CHASSIS // AERO-01</div>
              <div>SCALE RATIO: 1:43 CAD V8.4</div>
              <div>TELEMETRY: MONACO GP SPEC</div>
            </div>
            <div class="absolute bottom-12 right-6 text-right text-[8px] font-mono text-[rgba(0,220,255,0.4)] tracking-widest leading-loose">
              <div>DOWNFORCE: 820 KG @ 250 KM/H</div>
              <div>MASS DISTRIBUTION: 43:57</div>
            </div>
            <!-- Technical circles -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[rgba(0,220,255,0.08)] pointer-events-none"></div>
          </div>
        `;
        break;

      case 'carbon':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: #0f0f13;">
            <div class="absolute inset-0" style="background-image: repeating-linear-gradient(45deg, #18181f 0, #18181f 2px, transparent 0, transparent 4px), repeating-linear-gradient(-45deg, #131318 0, #131318 2px, #0e0e12 0, #0e0e12 4px); background-size: 8px 8px;"></div>
            <div class="absolute inset-0" style="background: radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08) 0%, transparent 70%);"></div>
          </div>
        `;
        break;

      case 'monza':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: #111116;">
            <!-- Asphalt gradient -->
            <div class="absolute inset-0 opacity-15" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 16px 16px;"></div>
            <!-- Racing Stripes (Sleek Monochrome) -->
            <div class="absolute top-0 bottom-0 left-8 w-2 bg-white/40"></div>
            <div class="absolute top-0 bottom-0 left-11 w-1 bg-white/25"></div>
            <div class="absolute top-0 bottom-0 left-13 w-0.5 bg-white/15"></div>
            <div class="absolute right-6 top-8 text-right font-black text-4xl text-white/[0.04] select-none tracking-tighter">
              MONZA
            </div>
          </div>
        `;
        break;

      case 'corsa':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: linear-gradient(135deg, #3d0505 0%, #170202 100%);">
            <div class="absolute inset-0" style="background: radial-gradient(circle at 50% 40%, rgba(255,50,50,0.2) 0%, transparent 75%);"></div>
            <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 11px);"></div>
            <div class="absolute bottom-10 left-6 text-white/10 font-black text-3xl tracking-widest uppercase">CORSA</div>
          </div>
        `;
        break;

      case 'nurburgring':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: #09130d;">
            <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(rgba(34,197,94,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.3) 1px, transparent 1px); background-size: 30px 30px;"></div>
            <div class="absolute top-6 left-6 text-[8px] font-mono text-green-500/40 tracking-widest">
              <div>NÜRBURGRING NORDSCHLEIFE</div>
              <div>LENGTH: 20.832 KM // 73 CORNERS</div>
            </div>
            <div class="absolute bottom-12 right-6 w-24 h-24 border border-green-500/15 rounded-full flex items-center justify-center text-[9px] font-mono text-green-500/30">
              GREEN HELL
            </div>
          </div>
        `;
        break;

      case 'cyber':
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative" style="background: #090611;">
            <div class="absolute top-0 left-0 right-0 h-1/2" style="background: radial-gradient(circle at 50% 10%, rgba(168,85,247,0.25) 0%, transparent 70%);"></div>
            <div class="absolute bottom-0 left-0 right-0 h-1/2" style="background: radial-gradient(circle at 50% 90%, rgba(6,182,212,0.2) 0%, transparent 70%);"></div>
            <div class="absolute inset-0 opacity-15" style="background-image: linear-gradient(transparent 95%, rgba(6,182,212,0.5) 95%); background-size: 100% 20px;"></div>
          </div>
        `;
        break;

      case 'studio':
      default:
        bgSurfaceEl.innerHTML = `
          <div class="w-full h-full relative bg-[#f8fafc]">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#94a3b8 1px, transparent 1px); background-size: 20px 20px;"></div>
            <div class="absolute top-6 left-6 text-[8px] font-mono text-black/30 tracking-widest">
              STUDIO EXHIBITION // EDITION 01
            </div>
          </div>
        `;
        break;
    }
  }

  function handleAddToCart() {
    const car = state.selectedCar;
    const size = state.selectedSize;
    const bg = state.selectedBg;
    const plaque = state.plaqueText;

    const item = {
      id: `custom-${car.id}-${size.id}-${Date.now()}`,
      name: `Custom 3D Frame - ${car.name} (${size.label.split(' ')[0]})`,
      price: size.price,
      scale: `${size.label.split(' ')[0]} Frame`,
      image: car.image,
      details: `${bg.name} • Plaque: "${plaque}"`
    };

    if (window.addToCart) {
      window.addToCart(item);
    } else {
      alert(`Added ${item.name} to Crate!`);
    }

    if (window.openCartDrawer) {
      window.openCartDrawer();
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
