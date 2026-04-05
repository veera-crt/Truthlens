import {
  CATEGORIES,
  INITIAL_POSTS,
  loadPosts,
  persistPosts,
  createPost
} from './site-data.js';

/**
 * Universal API helper for Truthlens Backend (Port 5001).
 * Ensures 'credentials: include' is passed for session/cookie persistence across origins.
 */
async function apiCall(endpoint, options = {}) {
  // Normalize endpoint to full URL if needed
  const baseUrl = 'http://127.0.0.1:5001';
  let url = endpoint;
  if (!endpoint.startsWith('http')) {
    url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include'
  });
}

/**
 * High-Security Biometric Handlers (face-api.js integration)
 */
let webcamStream = null;
let modelsLoaded = false;

async function loadBioShieldModels() {
  if (modelsLoaded) return;
  console.log("[*] BIO-SHIELD: Booting Identity Engine...");
  const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log("[*] BIO-SHIELD: Identity Engine Online.");
  } catch (err) {
    console.error("[!] BIO-SHIELD: Engine Failure:", err);
  }
}

async function getFaceDescriptor() {
  const video = document.getElementById('face-video');
  if (!video || !modelsLoaded) return null;
  
  const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  return detection ? Array.from(detection.descriptor) : null;
}

async function startWebcam() {
  try {
    const video = document.getElementById('face-video');
    if (!video) return;
    
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = webcamStream;
    console.log("[*] BIO-SCAN: Stream Active.");
    await loadBioShieldModels();
  } catch (err) {
    console.error("[!] BIO-SCAN: Interface Failed:", err);
    alert("CRITICAL: Camera Access Denied. Bio-Shield requires visual verification.");
  }
}

function stopWebcam() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
    console.log("[*] BIO-SCAN: Stream Terminated.");
  }
}

const ABOUT_FEATURES = [
  {
    icon: 'shield',
    title: 'Integrity First',
    body:
      'We are committed to factual accuracy and transparency. No hidden agendas, just the facts presented with context.'
  },
  {
    icon: 'file-text',
    title: 'Deep Analysis',
    body:
      'We look beyond the breaking news cycle to understand the second and third-order effects of global events.'
  },
  {
    icon: 'user',
    title: 'Expert Voices',
    body:
      'Our writers are subject matter experts, academics, and seasoned journalists with decades of combined experience.'
  }
];

const TERMS_SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body:
      'By accessing and using Truthlens (the "Website"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Website\'s particular services, you shall be subject to any posted guidelines or rules applicable to such services.'
  },
  {
    heading: '2. Intellectual Property Rights',
    body:
      'All content published and made available on our site is the property of Truthlens and the site\'s creators. This includes, but is not limited to images, text, logos, documents, downloadable files and anything that contributes to the composition of our site. You may not reproduce, distribute, or create derivative works from our content without explicit written permission.'
  },
  {
    heading: '3. User Contributions',
    body:
      'Users may post comments or other content as long as the content is not illegal, obscene, threatening, defamatory, invasive of privacy, infringing intellectual property rights, or otherwise injurious to third parties. Truthlens reserves the right, but not the obligation, to remove or edit such content.'
  },
  {
    heading: '4. Limitation of Liability',
    body:
      'Truthlens and our directors, officers, agents, employees, subsidiaries, and affiliates will not be liable for any actions, claims, losses, damages, liabilities, and expenses including legal fees from your use of the site. The information provided on this site is for general informational purposes only.'
  },
  {
    heading: '5. Third-Party Links',
    body:
      'Our Website may contain links to third-party websites or services that are not owned or controlled by Truthlens. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services.'
  },
  {
    heading: '6. Modifications',
    body:
      'Truthlens reserves the right to revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.'
  },
  {
    heading: '7. Governing Law',
    body:
      'Any claim relating to Truthlens\'s website shall be governed by the laws of the State without regard to its conflict of law provisions.'
  }
];

const PRIVACY_SECTIONS = [
  {
    heading: '1. Introduction',
    body:
      'At Truthlens, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and tells you about your privacy rights and how the law protects you.'
  },
  {
    heading: '2. The Data We Collect About You',
    body:
      'Personal data means any information about an individual from which that person can be identified. We may collect identity data, contact data, technical data, and usage data when you interact with our products and services.',
    list: [
      '<strong>Identity Data</strong> includes first name, last name, username or similar identifier.',
      '<strong>Contact Data</strong> includes email address and telephone numbers.',
      '<strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting, and location.',
      '<strong>Usage Data</strong> includes information about how you use our website, products, and services.'
    ]
  },
  {
    heading: '3. How We Collect Your Data',
    body:
      'We use different methods to collect data from and about you, including direct interactions and automated technologies.',
    list: [
      '<strong>Direct interactions.</strong> You may give us your identity and contact data by filling in forms or by corresponding with us by post, phone, email, or otherwise.',
      '<strong>Automated technologies or interactions.</strong> As you interact with our website, we may automatically collect technical data by using cookies, server logs, and similar technologies.'
    ]
  },
  {
    heading: '4. How We Use Your Personal Data',
    body:
      'We will only use your personal data when the law allows us to. Most commonly, we will use your personal data where we need to perform a contract, where it is necessary for our legitimate interests, or where we need to comply with a legal obligation.'
  },
  {
    heading: '5. Data Security',
    body:
      'We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, accessed, altered, or disclosed in an unauthorized way.'
  },
  {
    heading: '6. Your Legal Rights',
    body:
      'Under certain circumstances, you have rights under data protection laws in relation to your personal data, including rights to request access, correction, erasure, restriction, transfer, portability, and to object to processing.'
  },
  {
    heading: '7. Contact Us',
    body:
      'If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@truthlens.com.'
  }
];

const state = {
  posts: loadPosts(),
  searchOpen: false,
  mobileMenuOpen: false,
  adminFormOpen: false,
  newsletterSubmitted: false,
  sidebarSubmitted: false,
  editingPostId: null,
  loading: true,
  autopilotEnabled: false,
  autopilotTime: '18:00',
  upcomings: [],
  adminCategoryFilter: 'all',
  adminAuthPhase: 0, // 0: Locked, 1: Password Passed, 2: Face Passed
  isBioShieldRegistered: false
};

let revealObserver;

window.addEventListener('DOMContentLoaded', init);

async function init() {
  document.addEventListener('click', handleClick);
  document.addEventListener('submit', handleSubmit);
  
  // High-Security Auth Check
  try {
    const authRes = await apiCall('/api/auth/check');
    const authData = await authRes.json();
    if (authData.logged_in) {
      state.adminAuthPhase = 2; // Auto-pass if already session-valid
    }
  } catch(e) {}

  // Check Bio-Shield Registration Status
  try {
    const regRes = await apiCall('/api/auth/check-registration');
    const regData = await regRes.json();
    state.isBioShieldRegistered = regData.registered;
  } catch(e) {}

  document.addEventListener('change', (e) => {
    const action = e.target.dataset.action;
    if (action === 'update-autopilot-time') {
      const newTime = e.target.value;
      state.autopilotTime = newTime;
      apiCall('/api/autopilot/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: state.autopilotEnabled, time: state.autopilotTime })
      });
    }
  });
  window.addEventListener('scroll', syncHeaderState, { passive: true });
  window.addEventListener('popstate', () => {
    state.mobileMenuOpen = false;
    state.searchOpen = false;
    renderApp();
  });
  
  // Live IST Clock Tick
  setInterval(() => {
    const clockEl = document.getElementById('ist-clock-live');
    const countdownEl = document.getElementById('autopilot-countdown');
    
    if (clockEl) {
      const now = new Date();
      const istDateStr = now.toLocaleTimeString('en-US', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      clockEl.textContent = istDateStr;

      // Update Countdown logic
      if (countdownEl && state.autopilotEnabled) {
        const [targetH, targetM] = state.autopilotTime.split(':').map(Number);
        
        // Get current IST hour/min
        const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const curH = istNow.getHours();
        const curM = istNow.getMinutes();

        if (curH < targetH || (curH === targetH && curM < targetM)) {
          countdownEl.textContent = ` (Targets ${state.autopilotTime} IST)`;
          countdownEl.style.color = 'var(--text-muted)';
        } else {
          countdownEl.textContent = ` (Window Active!)`;
          countdownEl.style.color = '#4ade80';
        }
      } else if (countdownEl) {
        countdownEl.textContent = '';
      }
    }
  }, 1000);

  syncHeaderState();

  const CACHE_KEY = 'truthlens_data_cache';
  const cachedData = window.sessionStorage.getItem(CACHE_KEY);
  
  if (cachedData) {
    try {
      state.posts = JSON.parse(cachedData);
      state.loading = false;
    } catch (e) {
      state.loading = true;
    }
  } else {
    state.loading = true;
  }

  // Initial render so the screen isn't suspiciously black/blank while waiting for the fetching
  renderApp();

  try {
    const res = await apiCall('/api/blog/data');
    if (res.ok) {
      const db = await res.json();
      if (db.data) {
        const freshPosts = db.data
          .filter(row => row['ID'] && row['Title'])
          .map(row => ({
            id: String(row['ID']),
            title: String(row['Title']),
            category: String(row['Category'] || 'technology').toLowerCase().replace('&', '').replace(' ', '-'),
            author: String(row['Author'] || 'Veerapandi'),
            date: String(row['Date']),
            excerpt: String(row['Excerpt']),
            imageUrl: String(row['Image URL']),
            content: String(row['Content']),
            readTime: Math.max(1, Math.ceil(String(row['Content']).length / 1000))
          }));
        
        // Reverse so the newest posts (bottom of sheet) appear first
        freshPosts.reverse();
        
    state.posts = freshPosts;
        window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(freshPosts));
      }
    }
  } catch (err) {
    console.error('Error fetching data from Flask API:', err);
  }

  // Fetch Autopilot Settings
  try {
    const res = await apiCall('/api/autopilot/settings');
    if (res.ok) {
      const settings = await res.json();
      state.autopilotEnabled = settings.enabled;
      state.autopilotTime = settings.time || '18:00';
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
  }

  // Fetch Upcomings
  try {
    const res = await apiCall('/api/blog/upcomings');
    if (res.ok) {
      const up = await res.json();
      if (up.data) {
        state.upcomings = up.data.map(row => ({
          id: String(row['ID']),
          title: String(row['Title']),
          scheduledTime: String(row['Scheduled_IST']),
          category: String(row['Category'])
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching upcomings:', err);
  }

  state.loading = false;
  renderApp();
}

function renderApp() {
  const headerEl = document.querySelector('[data-site-header]');
  const mainEl = document.querySelector('[data-site-main]');
  const footerEl = document.querySelector('[data-site-footer]');

  if (!headerEl || !mainEl || !footerEl) {
    return;
  }

  const route = getRoute();

  headerEl.innerHTML = renderHeader();
  mainEl.innerHTML = renderPage(route);
  footerEl.innerHTML = renderFooter();

  setPageTitle(route);
  syncHeaderState();
  initReveals();
}

function handleClick(event) {
  const linkEl = event.target.closest('a');
  if (linkEl && linkEl.href && linkEl.href.startsWith(window.location.origin)) {
    const url = new URL(linkEl.href);
    const path = url.pathname;
    
    // Only intercept if we are not opening in a new tab
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && !linkEl.target) {
      event.preventDefault();
      window.history.pushState({}, '', linkEl.href);
      state.mobileMenuOpen = false;
      renderApp();
      window.scrollTo(0, 0);
      return;
    }
  }

  const actionEl = event.target.closest('[data-action], [data-format]');
  if (!actionEl) {
    return;
  }

  const action = actionEl.dataset.action;

  if (action === 'auth-p2-register') {
    event.preventDefault();
    const btn = actionEl;
    btn.disabled = true;
    btn.innerHTML = `CAPTURING IDENTITY...`;
    
    setTimeout(async () => {
        const descriptor = await getFaceDescriptor();
        if (!descriptor) {
            btn.disabled = false;
            btn.innerHTML = "NO FACE DETECTED. RETRY.";
            return;
        }
        
        btn.innerHTML = `ARCHIVING BIOMETRICS...`;
        btn.style.background = '#10b981';
        
        try {
            const res = await apiCall('/api/auth/register-biometrics', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor }) 
            });
            const resData = await res.json();
            if (resData.status === 'success') {
                setTimeout(() => {
                    stopWebcam();
                    state.adminAuthPhase = 2;
                    state.isBioShieldRegistered = true;
                    renderApp();
                    showSuccessNotification("BIO-SHIELD DISENGAGED. PROFILE ARCHIVED.");
                }, 1000);
            } else {
                alert(resData.error || "Vault Registration Failure.");
                btn.disabled = false;
                btn.innerHTML = "RETRY CAPTURE";
            }
        } catch(e) {
            alert("Security Protocol Timeout.");
            btn.disabled = false;
        }
    }, 500);
    return;
  }

  if (action === 'auth-p2-simulate') {
    event.preventDefault();
    const btn = actionEl;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `SCANNING MESH...`;
    
    setTimeout(async () => {
        const descriptor = await getFaceDescriptor();
        if (!descriptor) {
            btn.disabled = false;
            btn.innerHTML = "FACE NOT ACQUIRED. RETRY.";
            return;
        }
        
        btn.innerHTML = `COMPARING DATA...`;
        
        // FINAL STEP: Verify on server using the real 128-float descriptor
        try {
            const res = await apiCall('/api/auth/verify-face', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ descriptor })
            });
            const resData = await res.json();
            if (resData.status === 'success') {
                btn.innerHTML = `IDENTITY CONFIRMED.`;
                btn.style.background = '#10b981';
                setTimeout(() => {
                    stopWebcam();
                    state.adminAuthPhase = 2;
                    renderApp();
                    showSuccessNotification("BIO-SHIELD DISENGAGED. WELCOME ADMIN.");
                }, 800);
            } else {
                alert(resData.message || "Match Rejected: Biometric Mismatch.");
                btn.disabled = false;
                btn.innerHTML = "RETRY SCAN";
            }
        } catch(e) {
            console.error(e);
            alert("Security Protocol Timeout.");
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }, 500);
    return;
  }

  if (action === 'toggle-search') {
    event.preventDefault();
    state.searchOpen = !state.searchOpen;
    state.mobileMenuOpen = false;
    renderHeaderOnly();
    return;
  }

  if (action === 'toggle-mobile-menu') {
    event.preventDefault();
    state.mobileMenuOpen = !state.mobileMenuOpen;
    state.searchOpen = false;
    renderHeaderOnly();
    return;
  }

  if (action === 'toggle-admin-form') {
    event.preventDefault();
    state.adminFormOpen = !state.adminFormOpen;
    state.editingPostId = null;
    renderApp();
    return;
  }

  if (action === 'admin-schedule-post') {
    const form = document.querySelector('[data-form="admin-add-post"]');
    if (form.reportValidity()) {
      handleSchedulePost(form);
    }
    return;
  }

  if (action === 'toggle-autopilot') {
    event.preventDefault();
    state.autopilotEnabled = !state.autopilotEnabled;
    renderApp();
    
    // Save to Google Sheets settings tab
    apiCall('/api/autopilot/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: state.autopilotEnabled, time: state.autopilotTime })
    });
    return;
  }

  if (action === 'update-autopilot-time') {
    // This will be triggered on input change
    const newTime = event.target.value;
    state.autopilotTime = newTime;
    
    apiCall('/api/autopilot/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: state.autopilotEnabled, time: state.autopilotTime })
    });
    return;
  }

  if (action === 'trigger-autopilot-now') {
    event.preventDefault();
    const btn = actionEl;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `Executing AI Logic...`;
    
    apiCall('/api/autopilot/trigger', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Autopilot finish. Refresh the page to see any new post!");
      })
      .catch(err => alert("Error triggering autopilot: " + err))
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = originalContent;
      });
    return;
  }

  // Content Editor Formatting Toolbar Logic
  const formats = {
    bold: { start: '<b>', end: '</b>' },
    quote: { start: '\n<blockquote>', end: '</blockquote>\n' },
    link: { start: '<a href="#">', end: '</a>' },
    image: { start: '\n<div class="post-inline-image"><img src="https://picsum.photos/seed/any/900/500" alt="Illustration" style="width: 100%; border-radius: 8px; margin: 2rem 0;" /></div>\n', end: '' }
  };

  const format = actionEl.dataset.format;
  if (format && formats[format]) {
    const textarea = document.getElementById('admin-post-content-area');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const selected = val.substring(start, end);
      const replacement = formats[format].start + selected + formats[format].end;
      textarea.value = val.substring(0, start) + replacement + val.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + formats[format].start.length, start + formats[format].start.length + selected.length);
    }
    return;
  }

  if (action === 'filter-admin') {
    state.adminCategoryFilter = actionEl.dataset.category;
    renderApp();
    return;
  }

  if (action === 'admin-logout') {
    apiCall('/api/auth/logout', { method: 'POST' })
      .finally(() => {
        state.adminAuthPhase = 0;
        state.adminFormOpen = false;
        renderApp();
      });
    return;
  }

  if (action === 'edit-post') {
    event.preventDefault();
    state.editingPostId = actionEl.dataset.id;
    state.adminFormOpen = true;
    renderApp();
    setTimeout(() => {
      document.querySelector('.admin-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return;
  }

  if (action === 'delete-post') {
    event.preventDefault();
    if (!window.confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }
    
    const { id } = actionEl.dataset;
    apiCall('/api/blog/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(res => {
      if (res.ok) {
        state.posts = state.posts.filter((post) => post.id !== id);
        // Refresh the local state
        syncHeaderState();
        renderApp();
      } else {
        alert("Failed to delete from server.");
      }
    });
  }
}

async function handleSchedulePost(form) {
    const formData = new FormData(form);
    const postData = {
      id: `manual-${Date.now()}`,
      title: formData.get('title'),
      category: formData.get('category'),
      author: 'Veerapandi',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      excerpt: formData.get('excerpt'),
      imageUrl: formData.get('imageUrl') || `https://picsum.photos/seed/${Date.now()}/800/500`,
      content: formData.get('content'),
      scheduledTime: formData.get('scheduledTime') || '18:00'
    };

    try {
      const res = await apiCall('/api/blog/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [postData.id, postData.title, postData.category, postData.author, postData.date, postData.excerpt, postData.imageUrl, postData.content, postData.scheduledTime] })
      });

      if (res.ok) {
        state.adminFormOpen = false;
        alert('Post scheduled successfully! It will go live at ' + postData.scheduledTime + ' IST.');
        renderApp();
      }
    } catch (err) {
      console.error(err);
    }
}

function handleSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const formType = form.dataset.form;
  if (!formType) {
    return;
  }

  event.preventDefault();

  if (formType === 'site-search') {
    const query = new FormData(form).get('q');
    const nextQuery = typeof query === 'string' ? query.trim() : '';
    window.location.href = buildPageHref('/search/', nextQuery ? { q: nextQuery } : null);
    return;
  }

  if (formType === 'newsletter' || formType === 'sidebar-newsletter') {
    const formData = new FormData(form);
    const email = formData.get('email');

    // Optimistic UI update
    if (formType === 'newsletter') state.newsletterSubmitted = true;
    if (formType === 'sidebar-newsletter') state.sidebarSubmitted = true;
    renderApp();

    // Stream directly to Flask backend (which pushes to Google Sheets)
    apiCall('/api/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [email, new Date().toISOString()] })
    })
      .then(res => res.json())
      .catch(err => console.error("Error connecting to Google Sheets API:", err))
      .finally(() => {
        form.reset();
        window.setTimeout(() => {
          if (formType === 'newsletter') state.newsletterSubmitted = false;
          if (formType === 'sidebar-newsletter') state.sidebarSubmitted = false;
          renderApp();
        }, 3000);
      });
      
    return;
  }

  if (formType === 'auth-p1') {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    apiCall('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(resData => {
      if (resData.status === 'partial_success' || resData.status === 'success') {
        state.adminAuthPhase = 1;
        renderApp();
        setTimeout(startWebcam, 100);
      } else {
        alert(resData.error || "Authentication Failed");
      }
    })
    .catch(err => {
      console.error("Login fetch error:", err);
      alert("System Connection Failure: Check if backend is running on port 5001.");
    });
    return;
  }

  if (formType === 'admin-add-post') {
    const formData = new FormData(form);
    const nextPostData = {
      title: toStringValue(formData.get('title')),
      category: toStringValue(formData.get('category')),
      excerpt: toStringValue(formData.get('excerpt')),
      content: toStringValue(formData.get('content')),
      imageUrl: toStringValue(formData.get('imageUrl')),
      author: 'Veerapandi'
    };

    if (state.editingPostId) {
      const idx = state.posts.findIndex((p) => p.id === state.editingPostId);
      if (idx !== -1) {
        const oldPost = state.posts[idx];
        const updatedPost = createPost(nextPostData);
        updatedPost.id = oldPost.id;
        updatedPost.date = oldPost.date;
        state.posts[idx] = updatedPost;
        
        // Sync to Sheets
        apiCall('/api/blog/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updatedPost.id,
            values: [updatedPost.id, updatedPost.title, updatedPost.category, updatedPost.author, updatedPost.date, updatedPost.excerpt, updatedPost.imageUrl, nextPostData.content]
          })
        }).catch(err => console.error("Sheet sync error:", err));
      }
    } else {
      const nextPost = createPost(nextPostData);
      state.posts = [nextPost, ...state.posts];
      
      // Sync to Sheets
      apiCall('/api/blog/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: [nextPost.id, nextPost.title, nextPost.category, nextPost.author, nextPost.date, nextPost.excerpt, nextPost.imageUrl, nextPostData.content]
        })
      }).catch(err => console.error("Sheet sync error:", err));
    }

    persistPosts(state.posts);
    state.adminFormOpen = false;
    state.editingPostId = null;
    renderApp();
  }
}

function renderHeaderOnly() {
  const headerEl = document.querySelector('[data-site-header]');
  if (!headerEl) {
    return;
  }

  headerEl.innerHTML = renderHeader();
  syncHeaderState();
}

function renderLoadingState() {
  return `
    <section class="page-shell page-shell--top">
      <div class="container stack-xl">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Accessing the Truthlens Archive...</p>
        </div>
        
        <div class="card-grid">
          ${[1, 2, 3, 4, 5, 6].map(() => `
            <div class="skeleton-card">
              <div class="skeleton-thumb"></div>
              <div class="skeleton-text">
                <div class="skeleton-line skeleton-line--title"></div>
                <div class="skeleton-line skeleton-line--excerpt"></div>
                <div class="skeleton-line skeleton-line--excerpt" style="width: 60%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderHeader() {
  return `
    <header class="site-header">
      <div class="container site-header__inner">
        <div class="site-header__bar">
          <a href="${buildPageHref('/')}" class="brand">
            <span class="brand__mark">T</span>
            <span class="brand__wordmark">Truthlens<span class="text-gold">.</span></span>
          </a>

          <nav class="desktop-nav" aria-label="Primary">
            <a href="${buildPageHref('/')}" class="nav-link">Home</a>
            ${Object.entries(CATEGORIES)
              .map(
                ([key, category]) => `
                  <a href="${buildPageHref(`/category/${key}/`)}" class="nav-link">
                    ${escapeHtml(category.name)}
                  </a>
                `
              )
              .join('')}
            <a href="${buildPageHref('/about/')}" class="nav-link">About</a>
          </nav>

          <div class="site-header__actions">
            <button class="icon-button" type="button" data-action="toggle-search" aria-label="Search">
              ${icon('search')}
            </button>
            <button class="icon-button mobile-only" type="button" data-action="toggle-mobile-menu" aria-label="Menu">
              ${icon(state.mobileMenuOpen ? 'x' : 'menu')}
            </button>
          </div>
        </div>

        ${
          state.searchOpen
            ? `
              <div class="search-panel">
                <div class="search-panel__inner">
                  <form data-form="site-search" class="search-form">
                    <span class="search-form__icon">${icon('search')}</span>
                    <input
                      type="text"
                      name="q"
                      value="${escapeAttribute(getSearchQuery())}"
                      placeholder="Search articles, topics, or authors..."
                      class="field search-form__input"
                      autofocus
                    />
                    <button type="submit" class="search-form__submit">Search</button>
                  </form>
                </div>
              </div>
            `
            : ''
        }
      </div>

      ${
        state.mobileMenuOpen
          ? `
            <div class="mobile-menu">
              <div class="container mobile-menu__inner">
                <a href="${buildPageHref('/')}" class="mobile-link">Home</a>
                ${Object.entries(CATEGORIES)
                  .map(
                    ([key, category]) => `
                      <a href="${buildPageHref(`/category/${key}/`)}" class="mobile-link">
                        ${escapeHtml(category.name)}
                      </a>
                    `
                  )
                  .join('')}
                <a href="${buildPageHref('/about/')}" class="mobile-link">About Us</a>
                <a href="${buildPageHref('/admin/')}" class="mobile-link mobile-link--accent">Admin Dashboard</a>
              </div>
            </div>
          `
          : ''
      }
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <section class="footer-card">
            <a href="${buildPageHref('/')}" class="brand brand--footer">
              <span class="brand__mark">T</span>
              <span class="brand__wordmark">Truthlens<span class="text-gold">.</span></span>
            </a>
            <p class="footer-copy">
              Premium editorial content delivering deep-dive analysis on technology, history, and the current affairs shaping our world.
            </p>
            <div class="social-links" aria-label="Social links">
              <a href="#" class="social-link" aria-label="Twitter">${icon('twitter')}</a>
              <a href="#" class="social-link" aria-label="LinkedIn">${icon('linkedin')}</a>
              <a href="#" class="social-link" aria-label="Facebook">${icon('facebook')}</a>
              <a href="#" class="social-link" aria-label="Instagram">${icon('instagram')}</a>
            </div>
          </section>

          <section class="footer-card">
            <h3 class="footer-heading">Categories</h3>
            <ul class="footer-list">
              ${Object.entries(CATEGORIES)
                .map(
                  ([key, category]) => `
                    <li>
                      <a href="${buildPageHref(`/category/${key}/`)}">${escapeHtml(category.name)}</a>
                    </li>
                  `
                )
                .join('')}
            </ul>
          </section>

          <section class="footer-card">
            <h3 class="footer-heading">Company</h3>
            <ul class="footer-list">
              <li><a href="${buildPageHref('/about/')}">About Us</a></li>
              <li><a href="${buildPageHref('/admin/')}">Admin Portal</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </section>

          <section class="footer-card">
            <h3 class="footer-heading">Legal</h3>
            <ul class="footer-list">
              <li><a href="${buildPageHref('/terms/')}">Terms &amp; Conditions</a></li>
              <li><a href="${buildPageHref('/privacy/')}">Privacy Policy</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">Accessibility</a></li>
            </ul>
          </section>
        </div>

        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Truthlens Media. All rights reserved.</p>
          <div class="footer-contact">
            <span class="footer-contact__icon">${icon('mail')}</span>
            <span>contact@truthlens.com</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function renderPage(route) {
  if (route.type === 'about') {
    return renderAboutPage();
  }

  if (route.type === 'terms') {
    return renderLegalPage('Terms & Conditions', TERMS_SECTIONS);
  }

  if (route.type === 'privacy') {
    return renderLegalPage('Privacy Policy', PRIVACY_SECTIONS);
  }

  if (route.type === 'search') {
    return renderSearchPage(route.query);
  }

  if (route.type === 'category') {
    return renderCategoryPage(route.categoryId);
  }

  if (route.type === 'post') {
    return renderPostPage(route.postId);
  }

  if (route.type === 'admin') {
    return renderAdminPage();
  }

  return renderHomePage();
}

function renderHomePage() {
  if (state.loading) {
    return renderLoadingState();
  }

  const featuredPost = state.posts[0];
  const recentPosts = state.posts.slice(1, 7);
  const editorPicks = state.posts.slice(7, 10);

  if (!featuredPost) {
    return `
      <section class="page-shell page-shell--top">
        <div class="container empty-state">
          <h1>No stories yet</h1>
          <p>Open the admin dashboard to publish your first article.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="hero">
      <div class="hero__media">
        <img src="${escapeAttribute(featuredPost.imageUrl)}" alt="${escapeAttribute(featuredPost.title)}" />
        <div class="hero__overlay"></div>
      </div>

      <div class="container hero__content">
        <div class="hero__text">
          ${renderCategoryBadge(featuredPost.category, true)}
          <h1>${escapeHtml(featuredPost.title)}</h1>
          <p class="hero__excerpt">${escapeHtml(featuredPost.excerpt)}</p>
          <div class="hero__actions">
            <a href="${buildPostHref(featuredPost)}" class="button button--primary">
              Read Full Article
              ${icon('arrow-right')}
            </a>
            <div class="hero__meta">
              <span class="hero__author">${escapeHtml(featuredPost.author)}</span>
              <span>${escapeHtml(featuredPost.date)} · ${featuredPost.readTime} min read</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="page-shell">
      <div class="container stack-xl">
        <section class="stack-lg">
          <div class="section-heading reveal reveal--up" data-reveal>
            <h2><span></span>Latest Dispatches</h2>
          </div>
          <div class="card-grid">
            ${recentPosts
              .map((post, index) => renderBlogCard(post, { delay: index * 0.08 }))
              .join('')}
          </div>
        </section>

        <section class="feature-band">
          <div class="feature-band__inner">
            <div class="section-heading section-heading--center reveal reveal--up" data-reveal>
              <h2>Editor's <em>Picks</em></h2>
            </div>
            <div class="stack-lg">
              ${editorPicks
                .map((post, index) =>
                  renderBlogCard(post, {
                    featured: true,
                    delay: index * 0.08,
                    direction: index % 2 === 0 ? 'left' : 'right'
                  })
                )
                .join('')}
            </div>
          </div>
        </section>

        <section class="reveal reveal--up" data-reveal>
          ${renderNewsletterPanel()}
        </section>
      </div>
    </section>
  `;
}

function renderCategoryPage(categoryId) {
  if (state.loading) {
    return renderLoadingState();
  }

  const category = CATEGORIES[categoryId];

  if (!category) {
    return `
      <section class="page-shell page-shell--top">
        <div class="container empty-state">
          <h1>Category not found</h1>
        </div>
      </section>
    `;
  }

  const posts = state.posts.filter((post) => post.category === categoryId);

  return `
    <section class="page-shell page-shell--top">
      <div class="category-hero">
        <div class="container">
          <div class="category-hero__inner reveal reveal--up" data-reveal>
            <span class="eyebrow">Topic</span>
            <h1>${escapeHtml(category.name)}</h1>
            <p>${escapeHtml(category.description)}</p>
          </div>
        </div>
      </div>

      <div class="container two-column">
        <section class="content-column">
          ${
            posts.length
              ? `
                <div class="card-grid card-grid--two">
                  ${posts
                    .map((post, index) => renderBlogCard(post, { delay: index * 0.08 }))
                    .join('')}
                </div>
              `
              : `
                <div class="panel panel--center">
                  <p>No posts found in this category yet.</p>
                </div>
              `
          }
        </section>

        <aside class="sidebar-column">
          ${renderSidebar()}
        </aside>
      </div>
    </section>
  `;
}

function renderPostPage(postId) {
  const post = state.posts.find((entry) => entry.id === postId);

  if (!post) {
    return `
      <section class="page-shell page-shell--top">
        <div class="container empty-state">
          <h1>Article Not Found</h1>
          <a href="${buildPageHref('/')}" class="text-link">${icon('arrow-left')} Return Home</a>
        </div>
      </section>
    `;
  }

  const relatedPosts = state.posts
    .filter((entry) => entry.category === post.category && entry.id !== post.id)
    .slice(0, 3);

  return `
    <article class="page-shell page-shell--top article-page">
      <header class="container article-header">
        <div class="reveal reveal--up" data-reveal>
          ${renderCategoryBadge(post.category, true)}
          <h1>${escapeHtml(post.title)}</h1>
        </div>
        <div class="article-meta reveal reveal--up" data-reveal style="transition-delay: 0.1s;">
          <span>${icon('user')} <strong>${escapeHtml(post.author)}</strong></span>
          <span>${icon('calendar')} ${escapeHtml(post.date)}</span>
          <span>${icon('clock')} ${post.readTime} min read</span>
        </div>
      </header>

      <div class="container article-media reveal reveal--up" data-reveal style="transition-delay: 0.16s;">
        <div class="article-media__frame">
          <img src="${escapeAttribute(post.imageUrl)}" alt="${escapeAttribute(post.title)}" />
        </div>
      </div>

      <div class="container article-copy-wrap">
        <div class="article-copy reveal reveal--up" data-reveal>
          <p class="article-copy__lead">${escapeHtml(post.excerpt)}</p>
          ${post.content}
        </div>

        <div class="author-card reveal reveal--up" data-reveal style="transition-delay: 0.1s;">
          <div class="author-card__avatar">${icon('user')}</div>
          <div>
            <h2>Written by ${escapeHtml(post.author)}</h2>
            <p>
              Senior Editor at Truthlens specializing in deep-dive analysis and investigative journalism. Bringing clarity to complex global narratives.
            </p>
          </div>
        </div>
      </div>

      ${
        relatedPosts.length
          ? `
            <section class="feature-band feature-band--related">
              <div class="container">
                <div class="section-heading reveal reveal--up" data-reveal>
                  <h2><span></span>Related Reading</h2>
                </div>
                <div class="card-grid">
                  ${relatedPosts
                    .map((entry, index) => renderBlogCard(entry, { delay: index * 0.08 }))
                    .join('')}
                </div>
              </div>
            </section>
          `
          : ''
      }
    </article>
  `;
}

function renderSearchPage(query) {
  if (state.loading) {
    return renderLoadingState();
  }
  const results = searchPosts(query);

  return `
    <section class="page-shell page-shell--top">
      <div class="container stack-lg">
        <div class="page-heading">
          <h1>${icon('search')} Search Results</h1>
          <p>${results.length} ${results.length === 1 ? 'result' : 'results'} for "<span>${escapeHtml(query)}</span>"</p>
        </div>

        ${
          results.length
            ? `
              <div class="card-grid">
                ${results
                  .map((post, index) => renderBlogCard(post, { delay: index * 0.08 }))
                  .join('')}
              </div>
            `
            : `
              <div class="empty-search">
                <div class="empty-search__icon">${icon('search')}</div>
                <h2>No matching articles found</h2>
                <p>We couldn't find any articles matching your search. Try adjusting your keywords or browse our categories.</p>
              </div>
            `
        }
      </div>
    </section>
  `;
}

function renderAboutPage() {
  return `
    <section class="page-shell page-shell--top">
      <div class="container about-page">
        <header class="about-page__hero">
          <h1 class="reveal reveal--up" data-reveal>
            Uncovering the <span class="text-gold italic">Truth</span>
          </h1>
          <p class="reveal reveal--up" data-reveal style="transition-delay: 0.08s;">
            Truthlens is a premium digital publication dedicated to deep-dive analysis, investigative journalism, and unbiased reporting on the forces shaping our world.
          </p>
        </header>

        <div class="about-page__image reveal reveal--up" data-reveal>
          <img src="https://picsum.photos/seed/office/1200/600" alt="Truthlens Editorial Office" />
        </div>

        <div class="about-grid">
          ${ABOUT_FEATURES.map(
            (feature, index) => `
              <article class="about-card reveal reveal--up" data-reveal style="transition-delay: ${index * 0.08}s;">
                <div class="about-card__icon">${icon(feature.icon)}</div>
                <h2>${escapeHtml(feature.title)}</h2>
                <p>${escapeHtml(feature.body)}</p>
              </article>
            `
          ).join('')}
        </div>

        <section class="mission-card reveal reveal--up" data-reveal>
          <h2>Our Mission</h2>
          <p>
            In an era of misinformation and algorithmic echo chambers, Truthlens stands as a beacon of clarity. We believe that a well-informed public is the cornerstone of a functioning society. Our mission is to equip our readers with the knowledge they need to navigate an increasingly complex world.
          </p>
        </section>
      </div>
    </section>
  `;
}

function renderLegalPage(title, sections) {
  return `
    <section class="page-shell page-shell--top">
      <div class="container legal-page">
        <header class="legal-page__header">
          <h1>${escapeHtml(title)}</h1>
          <p>Last updated: April 5, 2026</p>
        </header>

        <div class="article-copy article-copy--legal">
          ${sections
            .map(
              (section) => `
                <section class="reveal reveal--up" data-reveal>
                  <h2>${escapeHtml(section.heading)}</h2>
                  <p>${section.body}</p>
                  ${
                    section.list
                      ? `<ul>${section.list.map((item) => `<li>${item}</li>`).join('')}</ul>`
                      : ''
                  }
                </section>
              `
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}

function renderAdminPage() {
  if (state.loading) return renderLoadingState();

  if (state.adminAuthPhase === 0) {
    return `
      <section class="page-shell page-shell--top reveal--up" style="max-width: 450px; margin: 4rem auto; text-align: center;">
          <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem; letter-spacing: -0.02em;">${icon('shield')} Bio-Shield</h1>
          <p style="color: var(--text-muted); margin-bottom: 2rem;">V-Pandi Authority Verification Required</p>
          <form data-form="auth-p1" class="panel stack-md">
            <label style="text-align: left;">
              <input class="field" type="text" name="username" required />
            </label>
            <label style="text-align: left;">
              <input class="field" type="password" name="password" required />
            </label>
            <button type="submit" class="button button--primary button--full" style="height: 3.5rem;">AUTHORIZE PHASE 1</button>
          </form>
      </section>
    `;
  }

  if (state.adminAuthPhase === 1) {
    if (!state.isBioShieldRegistered) {
      // REGISTRATION FLOW (FIRST TIME SETUP)
      return `
        <section class="page-shell page-shell--top reveal--up" style="max-width: 500px; margin: 4rem auto; text-align: center;">
            <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem; color: var(--gold);">${icon('user')} Setup Bio-Vault</h1>
            <p style="color: var(--text-gold); margin-bottom: 2rem;">Initial Profile Required for the Authorized User: <b>VEERAPANDI</b></p>
            
            <div class="face-scan-box panel" style="position: relative; aspect-ratio: 4/3; background: #000; border: 2px solid var(--gold); border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
              <video id="face-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: var(--gold); box-shadow: 0 0 20px var(--gold); animation: scanner 3s infinite linear; z-index: 10;"></div>
              <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 1rem; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.7rem; text-align: left; font-family: monospace;">
                STATUS: READY_FOR_SETUP... <br>
                AUTHORIZED_HOLDER: VP-TRUTHLENS-CORE
              </div>
            </div>

            <button type="button" class="button button--primary button--full" style="height: 3.5rem;" data-action="auth-p2-register">
              ${icon('user')} CAPTURE & ARCHIVE MY FACE
            </button>
        </section>
      `;
    }

    // NORMAL LOGIN VERIFICATION FLOW
    return `
       <section class="page-shell page-shell--top reveal--up" style="max-width: 500px; margin: 4rem auto; text-align: center;">
          <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem;">${icon('user')} Phase 2 Scan</h1>
          <p style="color: var(--text-gold); margin-bottom: 2rem; font-weight: bold;">[!] BIO-SCANNER ACTIVE: VEERAPANDI DETECTED</p>
          
          <div class="face-scan-box panel" style="position: relative; aspect-ratio: 4/3; background: #000; border: 2px solid var(--gold); border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
            <video id="face-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: var(--gold); box-shadow: 0 0 20px var(--gold); animation: scanner 3s infinite linear; z-index: 10;"></div>
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--gold); opacity: 0.2; pointer-events: none;">
              <div style="transform: scale(3);">${icon('user')}</div>
              <span style="font-family: monospace; letter-spacing: 2px; font-size: 0.8rem;">VEERAPANDI_SCAN_REQUIRED...</span>
            </div>
          </div>

          <button type="button" class="button button--primary button--full" style="height: 3.5rem;" data-action="auth-p2-simulate">
            ${icon('shield')} COMPLETE BIOMETRIC MATCH
          </button>
      </section>
    `;
  }

  const editingPost = state.editingPostId ? state.posts.find(p => p.id === state.editingPostId) : null;
  const editingContent = editingPost ? editingPost.content.replace(/<\/p>/g, '\n\n').replace(/<[^>]*>/g, '').trim() : '';
  const editingExcerpt = editingPost ? editingPost.excerpt : '';

  return `
    <section class="page-shell page-shell--top">
      <div class="container admin-page">
        <header class="admin-topbar">
          <div>
            <h1>${icon('settings')} Admin Dashboard</h1>
            <p>Manage your publications and editorial content.</p>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button type="button" class="button button--secondary" data-action="admin-logout" title="Exit Bio-Shield">
              ${icon('x')} Logout
            </button>
            <button type="button" class="button button--primary" data-action="toggle-admin-form">
              ${
                state.adminFormOpen
                  ? 'Cancel'
                  : `${icon('plus')} New Post`
              }
            </button>
          </div>
        </header>

        ${
          state.adminFormOpen
            ? `
              <section class="admin-form panel">
                <h2>${editingPost ? 'Edit Article' : 'Create New Article'}</h2>
                <form data-form="admin-add-post" class="stack-md">
                  <div class="form-grid">
                    <label>
                      <span>Title (Max 50 chars)</span>
                      <input class="field" type="text" name="title" value="${editingPost ? escapeAttribute(editingPost.title) : ''}" required maxlength="50" placeholder="Enter a catchy headline..." />
                    </label>
                    <label>
                      <span>Category</span>
                      <select class="field" name="category" required>
                        ${Object.entries(CATEGORIES)
                          .map(
                            ([key, category]) => `
                              <option value="${key}" ${editingPost && editingPost.category === key ? 'selected' : ''}>${escapeHtml(category.name)}</option>
                            `
                          )
                          .join('')}
                      </select>
                    </label>

                    <label>
                      <span>Image URL (Optional)</span>
                      <input class="field" type="url" name="imageUrl" value="${editingPost ? escapeAttribute(editingPost.imageUrl) : ''}" placeholder="Leave blank for random image" />
                    </label>
                  </div>

                  <label>
                    <span>Excerpt (Max 150 chars)</span>
                    <textarea class="field field--textarea field--short" name="excerpt" required maxlength="150" placeholder="Highlight why users should read this...">${escapeHtml(editingExcerpt)}</textarea>
                  </label>

                  <label>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                      <span>Content (HTML Stories)</span>
                      <div class="editor-toolbar" style="display: flex; gap: 0.5rem;">
                        <button type="button" class="button button--secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-format="bold" title="Bold Text"><b>B</b></button>
                        <button type="button" class="button button--secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-format="quote" title="Quote Text">${icon('quote')}</button>
                        <button type="button" class="button button--secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-format="link" title="Insert Link">${icon('link')}</button>
                        <button type="button" class="button button--secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" data-format="image" title="Insert Image">${icon('image')}</button>
                      </div>
                    </div>
                    <textarea class="field field--textarea" name="content" required id="admin-post-content-area">${escapeHtml(editingContent)}</textarea>
                  </label>

                  <div class="form-grid">
                    <label>
                      <span>Scheduled Time (Optional)</span>
                      <input class="field" type="time" name="scheduledTime" value="${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' })}" />
                    </label>
                  </div>

                  <div class="admin-form__actions" style="display: flex; gap: 0.75rem; justify-content: flex-end; align-items: center;">
                    <button type="submit" class="button button--primary" style="padding: 0.6rem 1.25rem;">${editingPost ? 'Save Changes' : `${icon('send')} Publish Now`}</button>
                    ${!editingPost ? `<button type="button" class="button button--primary" data-action="admin-schedule-post" style="padding: 0.6rem 1.25rem; background: var(--bg-card); border: 1px solid var(--gold); color: var(--gold);">${icon('calendar')} Schedule</button>` : ''}
                  </div>
                </form>
              </section>
            `
            : ''
        }

        ${
          !state.adminFormOpen
            ? `
              <section class="admin-autopilot-card panel stack-sm">
                <div class="admin-autopilot-card__header">
                  <div>
                    <h2>${icon('activity')} Autopilot Mode</h2>
                    <p>AI will automatically publish a post if you haven't posted daily.</p>
                  </div>
                  <div class="autopilot-toggle ${state.autopilotEnabled ? 'is-active' : ''}" data-action="toggle-autopilot">
                    <div class="autopilot-toggle__knob"></div>
                  </div>
                </div>
                <div class="admin-autopilot-card__settings">
                  <div class="form-grid">
                    <label>
                      <span>Daily Schedule Time</span>
                      <input class="field" type="time" name="autopilotTime" value="${state.autopilotTime || '18:00'}" data-action="update-autopilot-time" />
                    </label>
                    <div class="admin-autopilot-card__status">
                      <span>Status:</span>
                      <strong class="${state.autopilotEnabled ? 'text-success' : 'text-muted'}">
                        ${state.autopilotEnabled ? 'Enabled & Monitoring' : 'Disabled'}
                        <span id="autopilot-countdown" style="font-size: 0.8em;"></span>
                      </strong>
                    </div>
                    <div class="admin-autopilot-card__status">
                      <span>Current IST Time:</span>
                      <strong class="text-gold" id="ist-clock-live">${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
                    </div>
                  </div>
                  <button type="button" class="button button--secondary" data-action="trigger-autopilot-now">
                    ${icon('refresh')} Trigger Autopilot Manual Run
                  </button>
                </div>
              </section>
            `
            : ''
        }

        ${!state.adminFormOpen ? renderAdminUpcomings() : ''}

        ${
          !state.adminFormOpen
            ? `
              <div class="admin-filter-bar stack-sm" style="margin-bottom: 2rem;">
                <h2 style="font-size: 1.1rem; color: var(--gold);">${icon('activity')} Editorial Library</h2>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button type="button" class="button ${state.adminCategoryFilter === 'all' ? 'button--primary' : 'button--secondary'}" style="padding: 0.5rem 1rem; font-size: 0.85rem;" data-action="filter-admin" data-category="all">All Posts</button>
                  ${Object.entries(CATEGORIES).map(([key, cat]) => `
                    <button type="button" class="button ${state.adminCategoryFilter === key ? 'button--primary' : 'button--secondary'}" style="padding: 0.5rem 1rem; font-size: 0.85rem;" data-action="filter-admin" data-category="${key}">${cat.name}</button>
                  `).join('')}
                </div>
              </div>

              <section class="admin-post-list">
                ${
                  (() => {
                    const filtered = state.adminCategoryFilter === 'all' 
                      ? state.posts 
                      : state.posts.filter(p => p.category === state.adminCategoryFilter);
                    
                    if (!filtered.length) {
                      return `
                        <div class="empty-state panel" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                          <p>No articles found for this category.</p>
                        </div>
                      `;
                    }

                    return filtered.map((post) => `
                            <article class="admin-list-item panel" style="display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-bottom: 0.75rem; padding: 0.75rem 1rem;">
                              <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                <img src="${escapeAttribute(post.imageUrl)}" alt="" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle);" />
                                <div class="admin-list-item__body">
                                  <h3 style="font-size: 1.05rem; margin-bottom: 0.15rem;">${escapeHtml(post.title)}</h3>
                                  <div class="admin-list-item__meta" style="display: flex; gap: 0.75rem; align-items: center; font-size: 0.8rem; color: var(--text-muted);">
                                    ${renderCategoryBadge(post.category, false)}
                                    <span>ID: <b>${escapeHtml(post.id)}</b> &bull; ${escapeHtml(post.date)}</span>
                                  </div>
                                </div>
                              </div>
                              <div class="admin-list-item__actions" style="display: flex; gap: 0.5rem;">
                                <button type="button" class="button button--secondary" style="padding: 0.5rem; width: 34px; height: 34px;" data-action="edit-post" data-id="${escapeAttribute(post.id)}" title="Edit article">
                                  ${icon('edit')}
                                </button>
                                <button type="button" class="button button--secondary" style="padding: 0.5rem; width: 34px; height: 34px; border-color: rgba(239, 68, 68, 0.2); color: #ef4444;" data-action="delete-post" data-id="${escapeAttribute(post.id)}" title="Delete article">
                                  ${icon('trash')}
                                </button>
                              </div>
                            </article>
                          `).join('');
                  })()
                }
              </section>
            `
            : ''
        }
      </div>
    </section>
  `;
}

function renderSidebar() {
  const popularPosts = state.posts.slice(0, 4);

  return `
    <div class="sidebar-stack">
      <section class="panel">
        <h2 class="panel-heading"><span></span>Categories</h2>
        <ul class="category-list">
          ${Object.entries(CATEGORIES)
            .map(
              ([key, category]) => `
                <li>
                  <a href="${buildPageHref(`/category/${key}/`)}" class="category-link">
                    <span>${escapeHtml(category.name)}</span>
                    ${icon('chevron-right')}
                  </a>
                </li>
              `
            )
            .join('')}
        </ul>
      </section>

      <section class="panel">
        <h2 class="panel-heading"><span></span>Trending Now</h2>
        <div class="trending-list">
          ${popularPosts
            .map(
              (post, index) => `
                <a href="${buildPostHref(post)}" class="trending-item">
                  <span class="trending-item__index">0${index + 1}</span>
                  <span>
                    <strong>${escapeHtml(post.title)}</strong>
                    <small>${escapeHtml(post.date)}</small>
                  </span>
                </a>
              `
            )
            .join('')}
        </div>
      </section>

      <section class="panel panel--newsletter-mini">
        <h2>Stay Informed</h2>
        <p>Get the latest insights delivered weekly.</p>
        ${
          state.sidebarSubmitted
            ? `<div class="form-success">Thanks for subscribing. We will keep you posted.</div>`
            : `
              <form data-form="sidebar-newsletter" class="stack-sm">
                <input class="field" type="email" name="email" placeholder="Email address" required />
                <button class="button button--primary button--full" type="submit">Subscribe</button>
              </form>
            `
        }
      </section>
    </div>
  `;
}

function renderNewsletterPanel() {
  return `
    <section class="newsletter-panel">
      <div class="newsletter-panel__glow newsletter-panel__glow--right"></div>
      <div class="newsletter-panel__glow newsletter-panel__glow--left"></div>
      <div class="newsletter-panel__inner">
        <div class="newsletter-icon">${icon('mail')}</div>
        <h2>The Truthlens Dispatch</h2>
        <p>
          Premium editorial content, deep-dive analysis, and exclusive insights delivered straight to your inbox every Sunday.
        </p>

        ${
          state.newsletterSubmitted
            ? `<div class="form-success">Thank you for subscribing. Welcome to the inner circle.</div>`
            : `
              <form data-form="newsletter" class="newsletter-form">
                <input class="field" type="email" name="email" placeholder="Enter your email address" required />
                <button class="button button--primary" type="submit">
                  Subscribe
                  ${icon('arrow-right')}
                </button>
              </form>
            `
        }

        <small>
          By subscribing, you agree to our Terms of Service and Privacy Policy. No spam, ever.
        </small>
      </div>
    </section>
  `;
}

function renderBlogCard(post, options = {}) {
  const featured = Boolean(options.featured);
  const direction = options.direction || 'up';
  const delay = options.delay || 0;

  return `
    <article class="blog-card ${featured ? 'blog-card--featured' : ''} reveal reveal--${direction}" data-reveal style="transition-delay: ${delay}s;">
      <a href="${buildPostHref(post)}" class="blog-card__media">
        <img src="${escapeAttribute(post.imageUrl)}" alt="${escapeAttribute(post.title)}" />
      </a>
      <div class="blog-card__body">
        <div class="blog-card__badge">
          ${renderCategoryBadge(post.category, true)}
        </div>
        <a href="${buildPostHref(post)}" class="blog-card__title-link">
          <h3>${escapeHtml(post.title)}</h3>
        </a>
        <p class="blog-card__excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="blog-card__meta">
          <span>${icon('user')} ${escapeHtml(post.author)}</span>
          <span>${escapeHtml(post.date)}</span>
          <span>${icon('clock')} ${post.readTime} min</span>
        </div>
      </div>
    </article>
  `;
}

function renderAdminUpcomings() {
  if (!state.upcomings || state.upcomings.length === 0) {
    return `<div class="panel" style="text-align: center; padding: 3rem; color: var(--text-muted);">
      ${icon('calendar')} No scheduled posts in queue.
    </div>`;
  }

  return `
    <div class="panel stack-md">
      <h2>${icon('calendar')} Publication Queue (IST)</h2>
      <div class="admin-table-container" style="overflow-x: auto;">
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; border-bottom: 1px solid var(--border-subtle); color: var(--gold);">
              <th style="padding: 1rem;">Title</th>
              <th style="padding: 1rem;">Category</th>
              <th style="padding: 1rem;">Scheduled Time</th>
            </tr>
          </thead>
          <tbody>
            ${state.upcomings.map(up => `
              <tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="padding: 1rem;">${escapeHtml(up.title)}</td>
                <td style="padding: 1rem;">${renderCategoryBadge(up.category, false)}</td>
                <td style="padding: 1rem; font-weight: bold; color: var(--gold);">${up.scheduledTime} IST</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCategoryBadge(categoryId, clickable) {
  const category = CATEGORIES[categoryId];
  if (!category) {
    return '';
  }

  const content = `<span class="badge badge--${category.tone}">${escapeHtml(category.name)}</span>`;
  if (!clickable) {
    return content;
  }

  return `<a href="${buildPageHref(`/category/${categoryId}/`)}" class="badge-link">${content}</a>`;
}

function buildPostHref(post) {
  const isStaticPost = INITIAL_POSTS.some((entry) => entry.id === post.id);
  return isStaticPost
    ? buildPageHref(`/post/${post.id}/`)
    : buildPageHref('/post/', { id: post.id });
}

function searchPosts(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return state.posts.filter(
    (post) =>
      post.title.toLowerCase().includes(normalized) ||
      post.excerpt.toLowerCase().includes(normalized)
  );
}

function getRoute() {
  const routePath = getRoutePath();
  const queryParams = new URLSearchParams(window.location.search);

  if (routePath === '/about/') {
    return { type: 'about' };
  }

  if (routePath === '/terms/') {
    return { type: 'terms' };
  }

  if (routePath === '/privacy/') {
    return { type: 'privacy' };
  }

  if (routePath === '/admin/') {
    return { type: 'admin' };
  }

  if (routePath === '/search/') {
    return { type: 'search', query: getSearchQuery() };
  }

  if (routePath === '/category/' || routePath.startsWith('/category/')) {
    const categoryId = routePath.split('/')[2] || queryParams.get('slug') || '';
    return { type: 'category', categoryId };
  }

  if (routePath === '/post/' || routePath.startsWith('/post/')) {
    const postId = routePath.split('/')[2] || queryParams.get('id') || '';
    return { type: 'post', postId };
  }

  return { type: 'home' };
}

function getRoutePath() {
  if (window.location.protocol === 'file:') {
    return normalizeRoutePath(document.documentElement.dataset.routePath || '/');
  }

  return normalizeRoutePath(window.location.pathname);
}

function normalizeRoutePath(pathname) {
  let normalized = pathname.replace(/index\.html$/, '');
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

function buildPageHref(routePath, query) {
  // Use absolute relative routing from domain root to fix recursive 404 loops
  const nextPath = routePath.startsWith('/') ? routePath : `/${routePath}`;

  if (!query) {
    return nextPath;
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return `${nextPath}?${searchParams.toString()}`;
}

function getSearchQuery() {
  return new URLSearchParams(window.location.search).get('q') || '';
}

function setPageTitle(route) {
  if (route.type === 'about') {
    document.title = 'About | Truthlens';
    return;
  }

  if (route.type === 'terms') {
    document.title = 'Terms & Conditions | Truthlens';
    return;
  }

  if (route.type === 'privacy') {
    document.title = 'Privacy Policy | Truthlens';
    return;
  }

  if (route.type === 'search') {
    document.title = `Search: ${route.query || 'Articles'} | Truthlens`;
    return;
  }

  if (route.type === 'category') {
    document.title = `${CATEGORIES[route.categoryId]?.name || 'Category'} | Truthlens`;
    return;
  }

  if (route.type === 'post') {
    const post = state.posts.find((entry) => entry.id === route.postId);
    document.title = `${post?.title || 'Article'} | Truthlens`;
    return;
  }

  if (route.type === 'admin') {
    document.title = 'Admin Dashboard | Truthlens';
    return;
  }

  document.title = 'Truthlens';
}

function syncHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  header.classList.toggle('site-header--scrolled', window.scrollY > 20);
}

function initReveals() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (!revealItems.length) {
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

function toStringValue(value) {
  return typeof value === 'string' ? value : '';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function icon(name) {
  const shared = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"';
  const icons = {
    search: `<svg ${shared}><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`,
    edit: `<svg ${shared}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    menu: `<svg ${shared}><path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path></svg>`,
    x: `<svg ${shared}><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
    'arrow-right': `<svg ${shared}><path d="M5 12h14"></path><path d="m13 5 7 7-7 7"></path></svg>`,
    'arrow-left': `<svg ${shared}><path d="M19 12H5"></path><path d="m11 5-7 7 7 7"></path></svg>`,
    'chevron-right': `<svg ${shared}><path d="m9 18 6-6-6-6"></path></svg>`,
    clock: `<svg ${shared}><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path></svg>`,
    user: `<svg ${shared}><path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle></svg>`,
    calendar: `<svg ${shared}><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4"></path><path d="M8 3v4"></path><path d="M3 11h18"></path></svg>`,
    mail: `<svg ${shared}><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m4 7 8 6 8-6"></path></svg>`,
    trash: `<svg ${shared}><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m8 10 .5 8"></path><path d="m16 10-.5 8"></path><path d="M6 6l1 14h10l1-14"></path></svg>`,
    plus: `<svg ${shared}><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`,
    settings: `<svg ${shared}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87-.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.07-.4H3a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.07V3a2 2 0 1 1 4 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.07.4H21a2 2 0 1 1 0 4h-.08a1.7 1.7 0 0 0-1.52.6Z"></path></svg>`,
    shield: `<svg ${shared}><path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3Z"></path></svg>`,
    'file-text': `<svg ${shared}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h8"></path><path d="M8 9h3"></path></svg>`,
    twitter: `<svg ${shared}><path d="M4 5c2.5 1.5 5.5 2.3 8.5 2.2A4.5 4.5 0 0 1 20 10.5c0 5.5-4.2 9.5-9.5 9.5-1.9 0-3.7-.5-5.2-1.5a7.2 7.2 0 0 0 5.2-1.5A3.3 3.3 0 0 1 7.4 14a3.4 3.4 0 0 0 1.5-.1A3.4 3.4 0 0 1 6 10.6v-.1c.5.3 1 .4 1.6.5A3.4 3.4 0 0 1 6.5 6.5 9.6 9.6 0 0 0 13.5 10a3.4 3.4 0 0 1 5.8-3.1A6.7 6.7 0 0 0 21 6a3.4 3.4 0 0 1-1.5 1.9A6.9 6.9 0 0 0 21 7.4a7.1 7.1 0 0 1-1.7 1.8"></path></svg>`,
    linkedin: `<svg ${shared}><path d="M7 9v8"></path><path d="M7 5h.01"></path><path d="M12 17v-5a3 3 0 0 1 6 0v5"></path><path d="M12 12V9"></path></svg>`,
    facebook: `<svg ${shared}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v5h4v-5h3l1-4h-4V8a1 1 0 0 1 1-1Z"></path></svg>`,
    instagram: `<svg ${shared}><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><path d="M17.5 6.5h.01"></path></svg>`,
    quote: `<svg ${shared}><path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 2-2 4-4 4v4zm11 0c3 0 7-1 7-8V5h-7v8h4c0 2-2 4-4 4v4z"></path></svg>`,
    link: `<svg ${shared}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    image: `<svg ${shared}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>`,
    activity: `<svg ${shared}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    refresh: `<svg ${shared}><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    send: `<svg ${shared}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`
  };

  return icons[name] || '';
}
