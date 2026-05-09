/* ============================================================
	KHASANAH NUSANTARA DIGITAL — APP.JS
	Router, Render, Map, Theme, Swiper, Grid/List, Load More
============================================================ */

/* ============================================================
	UTILITIES
============================================================ */
function getImg(seed, w, h) {
	return 'https://picsum.photos/seed/' + seed + '/' + w + '/' + h;
}
function getCat(id) {
	return categories.find(function(c) { return c.id === id; }) || categories[0];
}

function showToast(msg, type) {
	type = type || 'success';
	var c = document.getElementById('toastContainer');
	var icon = type === 'success' ? 'bi-check-circle-fill' : type === 'info' ? 'bi-info-circle-fill' : 'bi-exclamation-triangle-fill';
	var bg = type === 'success' ? 'text-bg-success' : type === 'info' ? 'text-bg-primary' : 'text-bg-warning';
	c.innerHTML = '<div class="toast align-items-center ' + bg + ' border-0 show" role="alert"><div class="d-flex"><div class="toast-body"><i class="bi ' + icon + ' me-2"></i>' + msg + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div></div>';
	setTimeout(function() { c.innerHTML = ''; }, 3500);
}

function togglePassword() {
	var p = document.getElementById('loginPassword');
	var e = document.getElementById('eyeIcon');
	if (p.type === 'password') { p.type = 'text'; e.className = 'bi bi-eye-slash'; }
	else { p.type = 'password'; e.className = 'bi bi-eye'; }
}

function closeMenu() {
	var el = document.getElementById('navOffcanvas');
	var instance = bootstrap.Offcanvas.getInstance(el);
	if (instance) instance.hide();
}

/* ============================================================
	THEME
============================================================ */
function applyTheme(theme) {
	document.documentElement.setAttribute('data-bs-theme', theme);
	localStorage.setItem('knd-theme', theme);
	var isDark = theme === 'dark';
	var icon = isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
	document.getElementById('themeToggle').innerHTML = icon;
	var oc = document.getElementById('themeToggleOC');
	if (oc) oc.innerHTML = (isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>') + ' Tema';
	if (leafletMap) {
		leafletMap.eachLayer(function(layer) { if (layer._url) leafletMap.removeLayer(layer); });
		addMapTiles();
	}
}

(function() {
	var saved = localStorage.getItem('knd-theme') || 'light';
	applyTheme(saved);
	document.getElementById('themeToggle').addEventListener('click', function() {
		applyTheme(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
	});
	var oc = document.getElementById('themeToggleOC');
	if (oc) oc.addEventListener('click', function() {
		applyTheme(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
	});
})();

/* ============================================================
	NAVBAR SCROLL
============================================================ */
var navEl = document.getElementById('mainNav');
window.addEventListener('scroll', function() {
	if (window.scrollY > 60) {
		navEl.classList.add('scrolled');
		navEl.classList.remove('transparent-light');
		} else {
		navEl.classList.remove('scrolled');
		if (currentRoute === '/' || currentRoute === '') navEl.classList.add('transparent-light');
	}
});

/* ============================================================
	STATE
============================================================ */
var currentRoute = '';
var leafletMap = null;
var mapInitialized = false;
var mapMarkers = [];

var sitesView = 'grid'; // 'grid' | 'list'
var currentSitesFilter = 'semua';
var sitesVisible = 6;
var SITES_STEP = 6;

var storiesView = 'grid';
var storiesVisible = 6;
var STORIES_STEP = 6;
var storiesSearchVal = '';

/* ============================================================
	ROUTER
============================================================ */
function handleRoute() {
	var hash = window.location.hash.slice(1) || '/';
	if (hash === '') hash = '/';
	
	var pageId = '', slug = null;
	if (hash.indexOf('/site/') === 0) { pageId = 'page-site-detail'; slug = hash.replace('/site/', ''); }
	else if (hash.indexOf('/story/') === 0) { pageId = 'page-story-detail'; slug = hash.replace('/story/', ''); }
	else {
		var m = {
			'/':'page-home','/map':'page-map','/sites':'page-sites',
			'/stories':'page-stories','/contribute':'page-contribute',
			'/login':'page-login','/admin':'page-admin','/about':'page-about',
			'/contact':'page-contact','/faq':'page-faq'
		};
		pageId = m[hash] || 'page-home';
	}
	
	document.querySelectorAll('.page').forEach(function(p) {
		p.classList.add('d-none'); p.classList.remove('visible');
	});
	var target = document.getElementById(pageId);
	if (target) { target.classList.remove('d-none'); void target.offsetWidth; target.classList.add('visible'); }
	
	document.getElementById('mainFooter').style.display = (pageId === 'page-map') ? 'none' : '';
	
	if (pageId === 'page-home') { navEl.classList.add('transparent-light'); navEl.classList.remove('scrolled'); }
	else { navEl.classList.remove('transparent-light'); if (window.scrollY > 60) navEl.classList.add('scrolled'); else navEl.classList.remove('scrolled'); }
	
	// Active nav: satu selector berlaku untuk desktop inline + mobile drawer
	var np = {
		'page-home':'home','page-map':'map','page-sites':'sites','page-stories':'stories',
		'page-contribute':'contribute','page-about':'about',
		'page-site-detail':'sites','page-story-detail':'stories'
	};
	var ap = np[pageId] || '';
	document.querySelectorAll('#navOffcanvas .nav-link[data-page]').forEach(function(l) {
		l.classList.remove('active');
		if (l.getAttribute('data-page') === ap) l.classList.add('active');
	});
	// Active bottom nav
	document.querySelectorAll('#mobileBottomNav .mob-nav-item[data-page]').forEach(function(l) {
		l.classList.remove('active');
		if (l.getAttribute('data-page') === ap) l.classList.add('active');
	});
	
	currentRoute = hash;
	
	if (pageId === 'page-home') renderHome();
	if (pageId === 'page-map') renderMap();
	if (pageId === 'page-sites') { sitesVisible = SITES_STEP; renderSitesList(); }
	if (pageId === 'page-site-detail') renderSiteDetail(slug);
	if (pageId === 'page-stories') { storiesVisible = STORIES_STEP; storiesSearchVal = ''; renderStoriesList(); }
	if (pageId === 'page-story-detail') renderStoryDetail(slug);
	if (pageId === 'page-about') renderAbout();
	
	window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('load', handleRoute);

/* ============================================================
	CARD GENERATORS
============================================================ */
function siteCardGrid(site) {
	var cat = getCat(site.category);
	return '<div class="col-md-6 col-lg-4 anim-up">'
    + '<div class="kk-card h-100"><div class="card-img-wrap">'
    + '<span class="badge-cat">' + cat.label + '</span>'
    + '<img src="' + getImg(site.photos[0], 600, 400) + '" class="card-img-top" alt="' + site.name + '" style="height:175px;object-fit:cover">'
    + '</div><div class="card-body">'
    + '<h5 class="card-title">' + site.name + '</h5>'
    + '<p class="card-text" style="margin-bottom:.3rem">' + site.summary + '</p>'
    + '<p style="font-size:.76rem;color:var(--kk-text-muted);margin-bottom:0"><i class="bi bi-geo-alt me-1" style="color:var(--kk-gold)"></i>' + site.address.split(',')[0] + '</p>'
    + '<a href="#/site/' + site.slug + '" class="card-link">Lihat Detail <i class="bi bi-arrow-right"></i></a>'
    + '</div></div></div>';
}

function siteCardList(site) {
	var cat = getCat(site.category);
	return '<div class="col-12 anim-up">'
    + '<div class="list-card">'
    + '<img src="' + getImg(site.photos[0], 300, 200) + '" class="list-img" alt="' + site.name + '">'
    + '<div class="list-body">'
    + '<span class="badge-cat-sm">' + cat.label + '</span>'
    + '<div class="list-title">' + site.name + '</div>'
    + '<div class="list-text">' + site.summary + '</div>'
    + '<div style="font-size:.74rem;color:var(--kk-text-muted);margin-bottom:.3rem"><i class="bi bi-geo-alt me-1" style="color:var(--kk-gold)"></i>' + site.address + '</div>'
    + '<a href="#/site/' + site.slug + '" class="list-link">Lihat Detail <i class="bi bi-arrow-right"></i></a>'
    + '</div></div></div>';
}

function storyCardGrid(story) {
	return '<div class="col-md-6 col-lg-4 anim-up">'
    + '<div class="kk-card kk-story-card h-100">'
    + '<img src="' + getImg(story.thumbnail, 600, 400) + '" class="story-img card-img-top" alt="' + story.title + '">'
    + '<div class="card-body"><h5 class="card-title">' + story.title + '</h5>'
    + '<p class="story-excerpt">' + story.summary + '</p>'
    + '<a href="#/story/' + story.slug + '" class="card-link mt-auto">Baca Cerita <i class="bi bi-arrow-right"></i></a>'
    + '</div></div></div>';
}

function storyCardList(story) {
	return '<div class="col-12 anim-up">'
    + '<div class="list-card">'
    + '<img src="' + getImg(story.thumbnail, 300, 200) + '" class="list-img" alt="' + story.title + '">'
    + '<div class="list-body">'
    + '<span class="badge-cat-sm">Cerita Rakyat</span>'
    + '<div class="list-title">' + story.title + '</div>'
    + '<div class="list-text">' + story.summary + '</div>'
    + '<a href="#/story/' + story.slug + '" class="list-link">Baca Cerita <i class="bi bi-arrow-right"></i></a>'
    + '</div></div></div>';
}

/* ============================================================
	RENDER: HOME
============================================================ */
var swiperContributor = null, swiperPartner = null;

function renderHome() {
	// Stats
	var statsData = [
		{ num:'25+', label:'Situs Budaya', icon:'bi-building', note:'Terdigitalisasi' },
		{ num:'25+', label:'Cerita Rakyat', icon:'bi-book', note:'Terdokumentasi' },
		{ num:'6', label:'Kecamatan', icon:'bi-geo', note:'Kutai Kartanegara' },
		{ num:'100%', label:'Open Access', icon:'bi-unlock', note:'Gratis & Terbuka' }
	];
	var sg = '';
	statsData.forEach(function(s) {
		sg += '<div class="col-6 col-lg-3"><div class="stat-counter-card"><div class="stat-icon"><i class="bi ' + s.icon + '"></i></div><div class="stat-num">' + s.num + '</div><div class="stat-label">' + s.label + '</div><div style="font-size:.72rem;color:var(--kk-text-muted);margin-top:.2rem">' + s.note + '</div></div></div>';
	});
	document.getElementById('homeStatsGrid').innerHTML = sg;
	
	// Features
	var features = [
		{ icon:'bi-map', cls:'gold', title:'Peta Interaktif Web GIS', desc:'Jelajahi semua situs budaya pada peta digital interaktif dengan filter kategori, pencarian, dan legenda yang lengkap.' },
		{ icon:'bi-archive', cls:'maroon', title:'Arsip Digital Terstruktur', desc:'Dokumentasi lengkap setiap situs: foto, deskripsi historis, koordinat, status konservasi, dan cerita terkait.' },
		{ icon:'bi-people', cls:'blue', title:'Crowdsourcing Partisipatif', desc:'Masyarakat dapat berkontribusi menambah data situs atau cerita rakyat yang belum terdokumentasikan.' },
		{ icon:'bi-phone', cls:'green', title:'Progressive Web App (PWA)', desc:'Diakses nyaman dari HP maupun komputer tanpa perlu instalasi aplikasi. Responsif di semua ukuran layar.' },
		{ icon:'bi-shield-check', cls:'gold', title:'Data Tervalidasi', desc:'Setiap data diverifikasi oleh tim ahli bersama Balai Pelestarian Kebudayaan (BPK) Wilayah XIV Kalimantan Timur.' },
		{ icon:'bi-diagram-3', cls:'maroon', title:'Model Replikasi Nasional', desc:'Dirancang sebagai pilot project yang arsitekturnya dapat diadopsi oleh daerah lain di seluruh Indonesia.' }
	];
	var fg = '';
	features.forEach(function(f, i) {
		fg += '<div class="col-md-6 col-lg-4 anim-up delay-' + (i + 1) + '"><div class="feature-card"><div class="feature-icon-wrap ' + f.cls + '"><i class="bi ' + f.icon + '"></i></div><h5>' + f.title + '</h5><p>' + f.desc + '</p></div></div>';
	});
	document.getElementById('homeFeaturesGrid').innerHTML = fg;
	
	// Featured sites (first 4)
	var sitesHTML = '';
	for (var i = 0; i < Math.min(4, sites.length); i++) sitesHTML += siteCardGrid(sites[i]);
	document.getElementById('homeSitesGrid').innerHTML = sitesHTML;
	
	// Process steps
	var steps = [
		{ num:'1', title:'Riset Lapangan', desc:'Tim turun langsung ke lokasi situs untuk mendokumentasikan kondisi, koordinat, dan sejarah secara akurat.' },
		{ num:'2', title:'Digitalisasi Data', desc:'Foto, deskripsi, dan metadata diunggah ke sistem platform dengan struktur data yang terstandar.' },
		{ num:'3', title:'Validasi Ahli', desc:'Data diverifikasi bersama BPK dan pakar budaya lokal untuk memastikan keakuratan informasi.' },
		{ num:'4', title:'Publikasi Online', desc:'Situs budaya tampil di peta interaktif dan dapat diakses oleh masyarakat luas secara gratis.' }
	];
	var pg = '';
	steps.forEach(function(s) {
		pg += '<div class="col-6 col-lg-3 anim-up"><div class="process-step"><div class="step-num">' + s.num + '</div><h6>' + s.title + '</h6><p>' + s.desc + '</p></div></div>';
	});
	document.getElementById('homeProcessGrid').innerHTML = pg;
	
	// Featured stories (first 3)
	var storiesHTML = '';
	for (var j = 0; j < Math.min(3, stories.length); j++) storiesHTML += storyCardGrid(stories[j]);
	document.getElementById('homeStoriesGrid').innerHTML = storiesHTML;
	
	// Quotes
	var quotes = [
		{ text:'Platform ini sangat membantu penelitian saya tentang sejarah Kerajaan Kutai. Data yang tersaji lengkap dan terverifikasi dengan baik oleh tim ahli.', author:'Dr. Suryanto', role:'Peneliti Sejarah, Unmul' },
		{ text:'Saya senang akhirnya ada platform yang mendokumentasikan situs-situs budaya di kampung kami. Generasi muda jadi tahu warisan leluhurnya.', author:'Pak Ridwan', role:'Tokoh Adat Kutai, Tenggarong' },
		{ text:'Sebagai guru sejarah, saya menggunakan platform ini sebagai media pembelajaran interaktif. Siswa jadi lebih antusias belajar budaya lokal.', author:'Bu Hartini', role:'Guru Sejarah, SMAN 1 Tenggarong' }
	];
	var qg = '';
	quotes.forEach(function(q, i) {
		qg += '<div class="col-md-4 anim-up delay-' + (i + 1) + '"><div class="quote-card"><p class="quote-text">"' + q.text + '"</p><div class="quote-author">' + q.author + '</div><div class="quote-role">' + q.role + '</div></div></div>';
	});
	document.getElementById('homeQuotesGrid').innerHTML = qg;
	
	// Swiper: Contributors
	var cwrap = document.getElementById('contributorSwiperWrap');
	if (cwrap && !cwrap.hasChildNodes()) {
		contributors.forEach(function(c) {
			cwrap.innerHTML += '<div class="swiper-slide" style="padding:0 4px"><div class="team-card"><img src="' + getImg(c.avatar, 200, 200) + '" class="team-avatar" alt="' + c.name + '"><div class="team-name">' + c.name + '</div><div class="team-role">' + c.role + '</div><div class="team-note"><i class="bi bi-star-fill me-1" style="font-size:.7rem"></i>' + c.note + '</div></div></div>';
		});
	}
	if (!swiperContributor) {
		swiperContributor = new Swiper('#contributorSwiper', {
			slidesPerView: 1.2, spaceBetween: 16, centeredSlides: false,
			pagination: { el: '.swiper-pagination', clickable: true },
			navigation: { prevEl: '.swiper-button-prev', nextEl: '.swiper-button-next' },
			breakpoints: { 576: { slidesPerView: 2.2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }
		});
	}
	
	// Swiper: Partners
	var pwrap = document.getElementById('partnerSwiperWrap');
	if (pwrap && !pwrap.hasChildNodes()) {
		partners.forEach(function(p) {
			pwrap.innerHTML += '<div class="swiper-slide" style="padding:0 4px"><div class="partner-card"><div class="partner-icon"><i class="bi ' + p.icon + '"></i></div><div><div class="partner-name">' + p.name + '</div><div class="partner-type">' + p.type + '</div><div style="font-size:.72rem;color:var(--kk-gold);margin-top:2px">' + p.note + '</div></div></div></div>';
		});
	}
	if (!swiperPartner) {
		swiperPartner = new Swiper('#partnerSwiper', {
			slidesPerView: 1.1, spaceBetween: 14,
			pagination: { el: '#partnerSwiper .swiper-pagination', clickable: true },
			navigation: { prevEl: '#partnerSwiper .swiper-button-prev', nextEl: '#partnerSwiper .swiper-button-next' },
			breakpoints: { 576: { slidesPerView: 1.6 }, 768: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3 } }
		});
	}
}

/* ============================================================
	RENDER: SITES LIST (Grid/List + Load More)
============================================================ */
function getFilteredSites() {
	var sv = (document.getElementById('sitesSearchInput') ? document.getElementById('sitesSearchInput').value : '').toLowerCase();
	var filtered = sites.slice();
	if (currentSitesFilter !== 'semua') filtered = filtered.filter(function(s) { return s.category === currentSitesFilter; });
	if (sv) filtered = filtered.filter(function(s) { return s.name.toLowerCase().indexOf(sv) > -1 || s.summary.toLowerCase().indexOf(sv) > -1; });
	return filtered;
}

function renderSitesList() {
	// Filter bar
	var fbar = document.getElementById('sitesFilterBar');
	var fh = '';
	categories.forEach(function(c) {
		fh += '<button class="btn-filter' + (c.id === currentSitesFilter ? ' active' : '') + '" data-cat="' + c.id + '">' + c.label + '</button>';
	});
	fbar.innerHTML = fh;
	fbar.querySelectorAll('.btn-filter').forEach(function(btn) {
		btn.addEventListener('click', function() {
			currentSitesFilter = this.getAttribute('data-cat');
			sitesVisible = SITES_STEP;
			renderSitesContent();
		});
	});
	
	// View toggle
	document.getElementById('btnGrid').classList.toggle('active', sitesView === 'grid');
	document.getElementById('btnList').classList.toggle('active', sitesView === 'list');
	
	renderSitesContent();
}

function renderSitesContent() {
	var filtered = getFilteredSites();
	var paged = filtered.slice(0, sitesVisible);
	var grid = document.getElementById('sitesGrid');
	
	// Count
	var countEl = document.getElementById('sitesCount');
	if (countEl) countEl.textContent = filtered.length + ' situs ditemukan';
	
	if (paged.length === 0) {
		grid.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search fs-1" style="color:var(--kk-text-muted)"></i><p style="color:var(--kk-text-muted);margin-top:.5rem">Tidak ada situs ditemukan.</p></div>';
		} else {
		grid.innerHTML = paged.map(function(s) {
			return sitesView === 'grid' ? siteCardGrid(s) : siteCardList(s);
		}).join('');
	}
	
	// Load more
	var lmWrap = document.getElementById('sitesLoadMoreWrap');
	if (filtered.length > sitesVisible) {
		lmWrap.style.display = '';
		} else {
		lmWrap.style.display = 'none';
	}
}

document.getElementById('sitesSearchInput').addEventListener('input', function() {
	sitesVisible = SITES_STEP;
	renderSitesContent();
});

document.getElementById('btnGrid').addEventListener('click', function() {
	sitesView = 'grid';
	this.classList.add('active');
	document.getElementById('btnList').classList.remove('active');
	renderSitesContent();
});

document.getElementById('btnList').addEventListener('click', function() {
	sitesView = 'list';
	this.classList.add('active');
	document.getElementById('btnGrid').classList.remove('active');
	renderSitesContent();
});

document.getElementById('sitesLoadMore').addEventListener('click', function() {
	var btn = this;
	btn.classList.add('loading');
	btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Memuat...';
	setTimeout(function() {
		sitesVisible += SITES_STEP;
		renderSitesContent();
		btn.classList.remove('loading');
		btn.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Muat Lebih Banyak';
	}, 400);
});

/* ============================================================
	RENDER: SITE DETAIL
============================================================ */
function renderSiteDetail(slug) {
	var site = sites.find(function(s) { return s.slug === slug; });
	var container = document.getElementById('page-site-detail');
	if (!site) {
		container.innerHTML = '<div class="page-pad container py-5 text-center"><h3>Situs tidak ditemukan</h3><a href="#/sites" class="btn-gold mt-3">Kembali ke Daftar Situs</a></div>';
		return;
	}
	var cat = getCat(site.category);
	
	var relHTML = '';
	if (site.relatedStories && site.relatedStories.length > 0) {
		relHTML = '<div class="mt-4 pt-4" style="border-top:1px solid var(--kk-border)"><h5 class="font-display" style="font-weight:700;font-size:1.15rem;color:var(--kk-text)">Cerita Terkait</h5><div class="row g-3 mt-1">';
		site.relatedStories.forEach(function(rid) {
			var st = stories.find(function(s) { return s.id === rid; });
			if (st) relHTML += '<div class="col-md-6"><a href="#/story/' + st.slug + '" class="d-flex gap-3 text-decoration-none p-2 rounded-3" style="border:1px solid var(--kk-border);transition:all .2s" onmouseover="this.style.background=\'var(--kk-surface-alt)\';" onmouseout="this.style.background=\'transparent\'"><img src="' + getImg(st.thumbnail, 120, 80) + '" class="rounded" style="width:78px;height:58px;object-fit:cover" alt=""><div><h6 style="font-size:.86rem;font-weight:700;color:var(--kk-text);margin-bottom:2px">' + st.title + '</h6><p style="font-size:.74rem;color:var(--kk-text-muted);margin:0;line-height:1.4">' + st.summary.substring(0, 70) + '...</p></div></a></div>';
		});
		relHTML += '</div></div>';
	}
	
	var galHTML = '<div class="gallery-grid">';
	site.photos.forEach(function(ph) { galHTML += '<img src="' + getImg(ph, 400, 300) + '" alt="Foto">'; });
	galHTML += '</div>';
	
	var descHTML = site.description.split('\n\n').map(function(p) { return p.trim() ? '<p>' + p.trim() + '</p>' : ''; }).join('');
	
	var statusBadge = site.status
    ? '<span class="badge me-2" style="background:rgba(var(--kk-gold-rgb),.15);color:var(--kk-gold);font-size:.72rem;font-weight:600;padding:.3rem .7rem;border-radius:20px;border:1px solid rgba(var(--kk-gold-rgb),.3)">' + site.status + '</span>'
    : '';
	
	container.innerHTML = '<div class="detail-hero"><img src="' + getImg(site.photos[0], 1400, 500) + '" alt="' + site.name + '"><div class="detail-hero-overlay"></div>'
    + '<div class="detail-title-area container"><div class="d-flex align-items-center gap-2 mb-1 flex-wrap">'
    + '<span style="background:rgba(var(--kk-gold-rgb),.9);color:#fff;font-size:.7rem;font-weight:600;padding:.25rem .65rem;border-radius:20px;backdrop-filter:blur(4px)">' + cat.label + '</span>'
    + statusBadge + '</div>'
    + '<h1>' + site.name + '</h1>'
    + '<div class="detail-meta"><span><i class="bi bi-geo-alt"></i> ' + site.address + '</span><span><i class="bi bi-images"></i> ' + site.photos.length + ' Foto</span></div></div></div>'
    + '<div class="page-pad" style="padding-top:2rem"><div class="container py-2"><div class="row g-4">'
    + '<div class="col-lg-8">'
    + '<div class="mb-4"><h5 class="font-display" style="font-weight:700;font-size:1.15rem;color:var(--kk-text)">Deskripsi</h5><div class="story-content">' + descHTML + '</div></div>'
    + '<div><h5 class="font-display" style="font-weight:700;font-size:1.15rem;color:var(--kk-text)">Galeri Foto</h5>' + galHTML + '</div>'
    + relHTML
    + '</div>'
    + '<div class="col-lg-4">'
    + '<div class="kk-card p-3 mb-3"><h6 style="font-size:.86rem;font-weight:700;margin-bottom:.6rem;color:var(--kk-text)"><i class="bi bi-info-circle me-1" style="color:var(--kk-gold)"></i>Informasi Situs</h6>'
    + '<div style="font-size:.83rem;color:var(--kk-text-muted);line-height:2">'
    + '<div><strong style="color:var(--kk-text)">Kategori:</strong> ' + cat.label + '</div>'
    + '<div><strong style="color:var(--kk-text)">Status:</strong> ' + (site.status || '-') + '</div>'
    + '<div><strong style="color:var(--kk-text)">Alamat:</strong> ' + site.address + '</div>'
    + '<div><strong style="color:var(--kk-text)">Koordinat:</strong> ' + site.lat.toFixed(4) + ', ' + site.lng.toFixed(4) + '</div></div></div>'
    + '<div class="kk-card p-0 overflow-hidden mb-3"><h6 style="font-size:.86rem;font-weight:700;padding:.75rem 1rem .4rem;margin:0;color:var(--kk-text)"><i class="bi bi-map me-1" style="color:var(--kk-gold)"></i>Lokasi</h6><div class="mini-map" id="detailMiniMap"></div></div>'
    + '<a href="#/sites" class="btn btn-outline-secondary w-100" style="border-radius:9px;font-size:.84rem;border-color:var(--kk-border);color:var(--kk-text)"><i class="bi bi-arrow-left me-2"></i>Kembali ke Daftar</a>'
    + '</div></div></div></div>';
	
	setTimeout(function() {
		var el = document.getElementById('detailMiniMap');
		if (!el) return;
		var mm = L.map('detailMiniMap', { zoomControl: false, dragging: false, scrollWheelZoom: false, attributionControl: false }).setView([site.lat, site.lng], 14);
		addTileToMap(mm);
		var co = getCat(site.category);
		L.marker([site.lat, site.lng], { icon: L.divIcon({ className: 'custom-marker', html: '<div class="marker-pin" style="background:' + co.color + '"><i class="bi bi-geo-alt-fill"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32] }) }).addTo(mm);
		setTimeout(function() { mm.invalidateSize(); }, 150);
	}, 150);
}

/* ============================================================
	RENDER: STORIES LIST (Grid/List + Load More)
============================================================ */
function getFilteredStories() {
	var sv = storiesSearchVal.toLowerCase();
	if (!sv) return stories.slice();
	return stories.filter(function(s) {
		return s.title.toLowerCase().indexOf(sv) > -1 || s.summary.toLowerCase().indexOf(sv) > -1;
	});
}

function renderStoriesList() {
	document.getElementById('storiesSearchInput').value = storiesSearchVal;
	document.getElementById('btnStoriesGrid').classList.toggle('active', storiesView === 'grid');
	document.getElementById('btnStoriesList').classList.toggle('active', storiesView === 'list');
	renderStoriesContent();
}

function renderStoriesContent() {
	var filtered = getFilteredStories();
	var paged = filtered.slice(0, storiesVisible);
	var grid = document.getElementById('storiesGrid');
	
	var countEl = document.getElementById('storiesCount');
	if (countEl) countEl.textContent = filtered.length + ' cerita ditemukan';
	
	if (paged.length === 0) {
		grid.innerHTML = '<div class="col-12 text-center py-5"><i class="bi bi-search fs-1" style="color:var(--kk-text-muted)"></i><p style="color:var(--kk-text-muted);margin-top:.5rem">Tidak ada cerita ditemukan.</p></div>';
		} else {
		grid.innerHTML = paged.map(function(s) {
			return storiesView === 'grid' ? storyCardGrid(s) : storyCardList(s);
		}).join('');
	}
	
	var lmWrap = document.getElementById('storiesLoadMoreWrap');
	if (filtered.length > storiesVisible) {
		lmWrap.style.display = '';
		} else {
		lmWrap.style.display = 'none';
	}
}

document.getElementById('storiesSearchInput').addEventListener('input', function() {
	storiesSearchVal = this.value;
	storiesVisible = STORIES_STEP;
	renderStoriesContent();
});

document.getElementById('btnStoriesGrid').addEventListener('click', function() {
	storiesView = 'grid';
	this.classList.add('active');
	document.getElementById('btnStoriesList').classList.remove('active');
	renderStoriesContent();
});

document.getElementById('btnStoriesList').addEventListener('click', function() {
	storiesView = 'list';
	this.classList.add('active');
	document.getElementById('btnStoriesGrid').classList.remove('active');
	renderStoriesContent();
});

document.getElementById('storiesLoadMore').addEventListener('click', function() {
	var btn = this;
	btn.classList.add('loading');
	btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Memuat...';
	setTimeout(function() {
		storiesVisible += STORIES_STEP;
		renderStoriesContent();
		btn.classList.remove('loading');
		btn.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Muat Lebih Banyak';
	}, 400);
});

/* ============================================================
	RENDER: STORY DETAIL
============================================================ */
function renderStoryDetail(slug) {
	var story = stories.find(function(s) { return s.slug === slug; });
	var container = document.getElementById('page-story-detail');
	if (!story) {
		container.innerHTML = '<div class="page-pad container py-5 text-center"><h3>Cerita tidak ditemukan</h3><a href="#/stories" class="btn-gold mt-3">Kembali</a></div>';
		return;
	}
	var relHTML = '';
	if (story.relatedSite) {
		var rs = sites.find(function(s) { return s.id === story.relatedSite; });
		if (rs) relHTML = '<div class="mt-4 pt-4" style="border-top:1px solid var(--kk-border)"><h5 class="font-display" style="font-weight:700;font-size:1.15rem;color:var(--kk-text)">Situs Terkait</h5>'
		+ '<a href="#/site/' + rs.slug + '" class="d-flex gap-3 text-decoration-none p-2 rounded-3 mt-2" style="border:1px solid var(--kk-border);transition:all .2s" onmouseover="this.style.background=\'var(--kk-surface-alt)\'" onmouseout="this.style.background=\'transparent\'">'
		+ '<img src="' + getImg(rs.photos[0], 200, 140) + '" class="rounded" style="width:100px;height:70px;object-fit:cover" alt="">'
		+ '<div><h6 style="font-size:.9rem;font-weight:700;color:var(--kk-text);margin-bottom:3px">' + rs.name + '</h6><p style="font-size:.77rem;color:var(--kk-text-muted);margin:0">' + rs.summary.substring(0, 90) + '...</p></div></a></div>';
	}
	var contentHTML = story.content.split('\n\n').map(function(p) { return p.trim() ? '<p>' + p.trim() + '</p>' : ''; }).join('');
	container.innerHTML = '<div class="detail-hero"><img src="' + getImg(story.thumbnail, 1400, 500) + '" alt="' + story.title + '"><div class="detail-hero-overlay"></div>'
    + '<div class="detail-title-area container"><span style="background:rgba(var(--kk-gold-rgb),.9);color:#fff;font-size:.7rem;font-weight:600;padding:.25rem .65rem;border-radius:20px;display:inline-block;margin-bottom:.5rem;backdrop-filter:blur(4px)">Cerita Rakyat</span>'
    + '<h1>' + story.title + '</h1></div></div>'
    + '<div class="page-pad" style="padding-top:2rem"><div class="container py-2"><div class="row justify-content-center"><div class="col-lg-8">'
    + '<div class="story-content mb-3">' + contentHTML + '</div>'
    + relHTML
    + '<a href="#/stories" class="btn btn-outline-secondary mt-4" style="border-radius:9px;font-size:.84rem;border-color:var(--kk-border);color:var(--kk-text)"><i class="bi bi-arrow-left me-2"></i>Kembali ke Daftar Cerita</a>'
    + '</div></div></div></div>';
}

/* ============================================================
	RENDER: ABOUT
============================================================ */
var swiperAboutPartner = null, swiperAboutTeam = null;

function renderAbout() {
	// Timeline
	var timelineData = [
		{ badge:'Bulan 1', title:'Penyempurnaan Prototipe & Persiapan Sistem', desc:'Infrastruktur platform Web GIS dan struktur database disiapkan dari prototipe menjadi sistem produksi.' },
		{ badge:'Bulan 2-3', title:'Pengumpulan Data Lapangan', desc:'Survei lapangan ke berbagai situs budaya di Kutai Kartanegara, dokumentasi visual dan wawancara narasumber.' },
		{ badge:'Bulan 4', title:'Pengolahan & Validasi Data', desc:'Data situs dideskripsikan, dikategorikan, ditentukan status konservasi, dan divalidasi bersama BPK Wilayah XIV.' },
		{ badge:'Bulan 5', title:'Integrasi Data & Penguatan Fitur', desc:'Platform terisi data nyata; fitur pemetaan, arsip, dan partisipasi publik (crowdsourcing) diaktifkan.' },
		{ badge:'Bulan 6', title:'Peluncuran & Diseminasi', desc:'Peluncuran resmi platform dan penyelenggaraan lokakarya pelatihan penggunaan bagi masyarakat.' }
	];
	var tl = document.getElementById('aboutTimeline');
	if (tl) {
		tl.innerHTML = timelineData.map(function(t) {
			return '<div class="timeline-item"><span class="timeline-badge">' + t.badge + '</span><h6>' + t.title + '</h6><p>' + t.desc + '</p></div>';
		}).join('');
	}
	
	// Partner swiper in about
	var apw = document.getElementById('aboutPartnerSwiperWrap');
	if (apw && !apw.hasChildNodes()) {
		partners.forEach(function(p) {
			apw.innerHTML += '<div class="swiper-slide" style="padding:0 4px"><div class="partner-card"><div class="partner-icon"><i class="bi ' + p.icon + '"></i></div><div><div class="partner-name">' + p.name + '</div><div class="partner-type">' + p.type + '</div><div style="font-size:.72rem;color:var(--kk-gold);margin-top:2px">' + p.note + '</div></div></div></div>';
		});
	}
	if (!swiperAboutPartner) {
		swiperAboutPartner = new Swiper('#aboutPartnerSwiper', {
			slidesPerView: 1.1, spaceBetween: 14,
			pagination: { el: '#aboutPartnerSwiper .swiper-pagination', clickable: true },
			breakpoints: { 576: { slidesPerView: 1.8 }, 768: { slidesPerView: 2.5 }, 1024: { slidesPerView: 3 } }
		});
	}
	
	// Team swiper in about
	var atw = document.getElementById('aboutTeamSwiperWrap');
	if (atw && !atw.hasChildNodes()) {
		// Core team
		var teamData = [
			{ name:'Danang Sigit Prasetya', role:'Penanggung Jawab / Pengembang Sistem', note:'Arsitek sistem Web GIS & integrasi data', avatar:'danang-team' },
			{ name:'Rohadi Wijaya', role:'Peneliti & Penulis Konten Budaya', note:'Wawancara lapangan & deskripsi situs', avatar:'rohadi-team' },
			{ name:'Achmad Ario Guntur', role:'Dokumentator / Fotografer', note:'Dokumentasi visual situs budaya', avatar:'guntur-team' },
			{ name:'Narasumber BPK XIV', role:'Perwakilan Mitra BPK', note:'Validasi data historis & budaya', avatar:'bpk-team' }
		];
		teamData.forEach(function(t) {
			atw.innerHTML += '<div class="swiper-slide" style="padding:0 4px"><div class="team-card"><img src="' + getImg(t.avatar, 200, 200) + '" class="team-avatar" alt="' + t.name + '"><div class="team-name">' + t.name + '</div><div class="team-role">' + t.role + '</div><div class="team-note">' + t.note + '</div></div></div>';
		});
	}
	if (!swiperAboutTeam) {
		swiperAboutTeam = new Swiper('#aboutTeamSwiper', {
			slidesPerView: 1.2, spaceBetween: 16,
			pagination: { el: '#aboutTeamSwiper .swiper-pagination', clickable: true },
			breakpoints: { 576: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }
		});
	}
}
L.tileLayer(url, { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19 }).addTo(map);
/* ============================================================
	MAP
============================================================ */
function addTileToMap(map) {
    var isDark =
        document.documentElement.getAttribute('data-bs-theme') === 'dark';
    // STADIA DARK / LIGHT
    var url = isDark
        ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
        : 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
    L.tileLayer(url, {
        maxZoom: 19,
        attribution: '&copy; <a targe="_blank" href="https://openstreetmap.org/copyright">OSM</a> | <a targe="_blank" href="https://stadiamaps.com/">Stadia</a>'
    }).addTo(map);
}

function addMapTiles() { if (leafletMap) addTileToMap(leafletMap); }

function renderMap() {
	if (!mapInitialized) {
		leafletMap = L.map('leafletMap', { zoomControl: false }).setView([-0.50, 117.15], 11);
		L.control.zoom({ position: 'bottomleft' }).addTo(leafletMap);
		addMapTiles();
		mapInitialized = true;
		setTimeout(function() { leafletMap.invalidateSize(); }, 200);
		} else {
		leafletMap.invalidateSize();
	}
	
	// Filter panel toggle (hanya filter yang collapsed, legenda selalu tampil)
	var filterBtn = document.getElementById('mapFilterBtn');
	var filterPanel = document.getElementById('mapFilterPanel');
	
	filterBtn.onclick = function() {
		filterPanel.classList.toggle('collapsed');
		filterBtn.classList.toggle('active', !filterPanel.classList.contains('collapsed'));
	};
	
	// Legend — selalu tampil, render langsung tanpa toggle
	var lh = '';
	for (var l = 1; l < categories.length; l++) {
		lh += '<div class="legend-item"><span class="legend-dot" style="background:' + categories[l].color + '"></span>' + categories[l].label + '</div>';
	}
	document.getElementById('mapLegend').innerHTML = lh;
	
	// Filter checkboxes
	var fo = document.getElementById('mapFilterOptions');
	var fh = '<div class="form-check mb-1"><input class="form-check-input map-cat-check" type="checkbox" id="mapCatAll" data-cat="semua" checked><label class="form-check-label" for="mapCatAll">Semua</label></div>';
	for (var f = 1; f < categories.length; f++) {
		fh += '<div class="form-check mb-1"><input class="form-check-input map-cat-check" type="checkbox" id="mapCat' + f + '" data-cat="' + categories[f].id + '" checked><label class="form-check-label" for="mapCat' + f + '"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + categories[f].color + ';margin-right:4px"></span>' + categories[f].label + '</label></div>';
	}
	fo.innerHTML = fh;
	
	fo.querySelectorAll('.map-cat-check').forEach(function(cb) {
		cb.addEventListener('change', function() {
			if (this.getAttribute('data-cat') === 'semua') {
				fo.querySelectorAll('.map-cat-check').forEach(function(c) { c.checked = true; });
				} else {
				document.getElementById('mapCatAll').checked = false;
				var checked = fo.querySelectorAll('.map-cat-check:checked:not(#mapCatAll)');
				if (checked.length === 0) { this.checked = true; return; }
				if (checked.length === categories.length - 1) document.getElementById('mapCatAll').checked = true;
			}
			updateMapMarkers(document.getElementById('mapSearchInput').value.toLowerCase());
		});
	});
	
	document.getElementById('mapSearchInput').value = '';
	document.getElementById('mapSearchInput').oninput = function() {
		updateMapMarkers(this.value.toLowerCase());
	};
	
	updateMapMarkers();
}

function updateMapMarkers(searchVal) {
	mapMarkers.forEach(function(m) { leafletMap.removeLayer(m); });
	mapMarkers = [];
	
	var activeCats = [];
	document.querySelectorAll('.map-cat-check:checked').forEach(function(c) {
		if (c.getAttribute('data-cat') !== 'semua') activeCats.push(c.getAttribute('data-cat'));
	});
	var showAll = document.getElementById('mapCatAll') && document.getElementById('mapCatAll').checked;
	
	var filtered = sites.slice();
	if (!showAll && activeCats.length > 0) filtered = filtered.filter(function(s) { return activeCats.indexOf(s.category) > -1; });
	if (searchVal) filtered = filtered.filter(function(s) { return s.name.toLowerCase().indexOf(searchVal) > -1 || s.address.toLowerCase().indexOf(searchVal) > -1; });
	
	var bounds = [];
	filtered.forEach(function(site) {
		var co = getCat(site.category);
		var icon = L.divIcon({ className: 'custom-marker', html: '<div class="marker-pin" style="background:' + co.color + '"><i class="bi bi-geo-alt-fill"></i></div>', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
		var marker = L.marker([site.lat, site.lng], { icon: icon })
		.bindPopup('<h6 style="font-family:\'Cormorant Garamond\',serif;font-weight:700;font-size:1rem;color:var(--kk-text);margin-bottom:4px">' + site.name + '</h6><p style="font-size:.78rem;color:var(--kk-text-muted);margin:3px 0">' + site.summary.substring(0, 75) + '...</p><a href="#/site/' + site.slug + '" style="font-size:.76rem;font-weight:600;color:var(--kk-gold)">Lihat Detail &rarr;</a>')
		.addTo(leafletMap);
		mapMarkers.push(marker);
		bounds.push([site.lat, site.lng]);
	});
	
	if (bounds.length > 0) leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
}

/* ============================================================
	UPLOAD ZONE
============================================================ */
(function() {
	var zone = document.getElementById('uploadZone');
	if (!zone) return;
	function handleFiles(files) {
		if (files.length > 0) {
			zone.innerHTML = '<i class="bi bi-check-circle fs-2" style="color:#16a34a"></i>'
			+ '<p class="mt-2 mb-0" style="font-size:.88rem;font-weight:600;color:var(--kk-text)">' + files.length + ' file dipilih</p>'
			+ '<p style="font-size:.76rem;color:var(--kk-text-muted)">Klik untuk mengganti</p>'
			+ '<input type="file" class="d-none" id="fileInput" multiple accept=".jpg,.jpeg,.png,.pdf">';
			document.getElementById('fileInput').addEventListener('change', function() { handleFiles(this.files); });
		}
	}
	zone.addEventListener('click', function() { document.getElementById('fileInput').click(); });
	zone.addEventListener('dragover', function(e) { e.preventDefault(); zone.classList.add('dragover'); });
	zone.addEventListener('dragleave', function() { zone.classList.remove('dragover'); });
	zone.addEventListener('drop', function(e) { e.preventDefault(); zone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
	document.getElementById('fileInput').addEventListener('change', function() { handleFiles(this.files); });
})();

document.getElementById('contributeSubmit').addEventListener('click', function() {
	if (!document.getElementById('agreeCheck').checked) {
		showToast('Harap centang pernyataan persetujuan terlebih dahulu.', 'warning'); return;
	}
	showToast('Kontribusi Anda berhasil dikirim! Tim kami akan meninjau data Anda.', 'success');
	setTimeout(function() {
		document.getElementById('contributeForm').querySelectorAll('input,textarea,select').forEach(function(el) {
			if (el.type !== 'checkbox') el.value = ''; else el.checked = false;
		});
		var zone = document.getElementById('uploadZone');
		if (zone) zone.innerHTML = '<i class="bi bi-cloud-arrow-up fs-2" style="color:var(--kk-gold)"></i><p class="mt-2 mb-1" style="font-size:.88rem;font-weight:600;color:var(--kk-text)">Seret file ke sini atau klik untuk memilih</p><p style="font-size:.76rem;color:var(--kk-text-muted)">JPG, PNG, atau PDF (maks. 10MB)</p><input type="file" class="d-none" id="fileInput" multiple accept=".jpg,.jpeg,.png,.pdf">';
	}, 600);
});