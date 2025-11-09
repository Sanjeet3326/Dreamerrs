// Wrap all DOM queries and listeners to ensure elements exist and avoid runtime errors
document.addEventListener('DOMContentLoaded', () => {
  // --- Authentication / login gate ---
  const auth = JSON.parse(localStorage.getItem('dreamer_auth') || 'null');
  const isLoginPage = window.location.pathname.includes('login.html') || window.location.href.includes('login.html');
  const loginForm = document.getElementById('login-form');

  // If not authenticated and not on login page, redirect to login
  if (!auth && !isLoginPage) {
    window.location.href = 'login.html';
    return; // stop further initialization on protected pages
  }

  // If authenticated and on login page, go to home
  if (auth && isLoginPage) {
    window.location.href = 'index.html';
    return;
  }

  // Handle login form submission (login page)
  if (loginForm) {
    // Dynamic greeting based on time of day
    const welcomeGreeting = document.getElementById('welcome-greeting');
    if (welcomeGreeting) {
      const hour = new Date().getHours();
      let greet = "Welcome back";
      if (hour < 12) {
        greet = "Good Morning ☀️";
      } else if (hour < 18) {
        greet = "Good Afternoon 🌤️";
      } else {
        greet = "Good Evening 🌙";
      }
      welcomeGreeting.textContent = greet + " Dreamer!";
    }

    // Pre-fill email if "remember me" was checked previously
    const savedAuth = JSON.parse(localStorage.getItem('dreamer_auth') || 'null');
    const emailInput = document.getElementById('login-email');
    const rememberMeCheckbox = document.getElementById('remember-me');
    
    if (savedAuth && savedAuth.rememberMe && savedAuth.email && emailInput) {
      emailInput.value = savedAuth.email;
      if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = true;
      }
    }

    // Toggle password visibility
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const eyeIcon = togglePassword.querySelector('.eye-icon');
        if (eyeIcon) {
          eyeIcon.classList.toggle('fa-eye');
          eyeIcon.classList.toggle('fa-eye-slash');
        }
      });
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('login-email')?.value || '').trim();
      const pass = (document.getElementById('login-password')?.value || '').trim();
      const rememberMe = document.getElementById('remember-me')?.checked || false;
      const submitBtn = document.getElementById('login-submit');
      const btnLoader = document.getElementById('btn-loader');
      
      if (!email || !pass) {
        showToast('Please enter both email and password');
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
      }

      // Simulate login delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        // Create user data object
        const userData = {
          email: email,
          loginTime: new Date().toISOString(),
          rememberMe: rememberMe,
          sessionId: Date.now().toString(),
          // Store password hash (simple hash for demo - in production use proper hashing)
          passwordHash: btoa(pass).substring(0, 20) // Simple encoding (NOT secure, for demo only)
        };

        // Store user data in localStorage
        localStorage.setItem('dreamer_auth', JSON.stringify(userData));
        
        // If remember me is checked, also store in a separate key for easy retrieval
        if (rememberMe) {
          localStorage.setItem('dreamer_remembered_email', email);
        } else {
          localStorage.removeItem('dreamer_remembered_email');
        }
        
        // Store user profile data
        const userProfile = {
          email: email,
          lastLogin: new Date().toISOString(),
          createdAt: localStorage.getItem('dreamer_user_created') || new Date().toISOString(),
          preferences: {
            theme: 'light',
            notifications: true
          }
        };
        localStorage.setItem('dreamer_user_profile', JSON.stringify(userProfile));
        
        // Set creation date if first time
        if (!localStorage.getItem('dreamer_user_created')) {
          localStorage.setItem('dreamer_user_created', new Date().toISOString());
        }

        // Store login history (last 5 logins)
        const loginHistory = JSON.parse(localStorage.getItem('dreamer_login_history') || '[]');
        loginHistory.unshift({
          email: email,
          loginTime: new Date().toISOString(),
          rememberMe: rememberMe
        });
        // Keep only last 5 logins
        if (loginHistory.length > 5) loginHistory.pop();
        localStorage.setItem('dreamer_login_history', JSON.stringify(loginHistory));

        showToast('Login successful! Redirecting...');
  // log login activity
  try { logActivity('login', { email, sessionId: userData.sessionId }); } catch(e){}
        
        // Redirect after short delay
        setTimeout(() => {
          // Check for admin email
          if (email === 'sanjeet10098@gmail.com') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'index.html';
          }
        }, 500);
      } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred. Please try again.');
        if (submitBtn) {
          submitBtn.classList.remove('loading');
          submitBtn.disabled = false;
        }
      }
    });

    // Social login buttons (open provider login pages as placeholders)
    try {
      const socialBtns = document.querySelectorAll('.social-login .social-btn');
      socialBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const provider = btn.classList.contains('facebook') ? 'facebook'
            : btn.classList.contains('twitter') ? 'twitter'
            : btn.classList.contains('google') ? 'google'
            : btn.classList.contains('instagram') ? 'instagram' : null;
          if (!provider) return;
          const urls = {
            facebook: 'https://www.facebook.com/login',
            twitter: 'https://twitter.com/login',
            google: 'https://accounts.google.com/signin',
            instagram: 'https://www.instagram.com/accounts/login/'
          };
          const url = urls[provider];
          if (url) {
            window.open(url, '_blank');
            showToast('Opening ' + provider + ' login…');
          }
        });
      });
    } catch (err) { /* ignore if DOM not present */ }
  }
  const taskTitle = document.getElementById("task-title");
  const taskDate = document.getElementById("task-date");
  const taskTags = document.getElementById('task-tags');
  const taskSubtasks = document.getElementById('task-subtasks');
  const taskRecurring = document.getElementById('task-recurring');
  const taskPriority = document.getElementById("task-priority");
  const addBtn = document.getElementById("add-task");
  const taskList = document.getElementById("task-list");
  const taskSearch = document.getElementById('task-search');
  const filterControls = document.querySelectorAll('.filter-controls .filter-btn');
  const notificationArea = document.getElementById('notification-area');
  const themeToggle = document.querySelector('#theme-toggle');

  // Navigation buttons (may be null if layout changed)
  const homeBtn = document.getElementById("home-btn");
  const goalsBtn = document.getElementById("goals-btn");
  const notesBtn = document.getElementById("notes-btn");
  const calendarBtn = document.getElementById("calendar-btn");
  const settingsBtn = document.getElementById("settings-btn");

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = 'all';
  let searchQuery = '';

  // chart
  const chartCanvas = document.getElementById('progress-chart');
  let progressChart = null;
  const progressFill = document.getElementById('progress-fill');

  // Settings functionality
  const settings = {
    load() {
      return JSON.parse(localStorage.getItem('dreamer_settings') || '{}');
    },
    save(data) {
      const current = this.load();
      localStorage.setItem('dreamer_settings', JSON.stringify({ ...current, ...data }));
    }
  };

  // Initialize settings
  const savedSettings = settings.load();
  let soundEnabled = !!savedSettings.soundEnabled;

  // Settings page elements
  const profileAvatar = document.getElementById('profile-avatar');
  const avatarInput = document.getElementById('avatar-input');
  const removeAvatarBtn = document.getElementById('remove-avatar');
  const usernameInput = document.getElementById('username');
  const themeMode = document.getElementById('theme-mode');
  const themeColor = document.getElementById('theme-color');
  const soundCheckbox = document.getElementById('enable-sound');
  const notificationsCheckbox = document.getElementById('enable-notifications');
  const pomodoroWork = document.getElementById('pomodoro-work');
  const pomodoroBreak = document.getElementById('pomodoro-break');
  const pomodoroLongBreak = document.getElementById('pomodoro-long-break');
  const languageSelect = document.getElementById('language');
  const exportDataBtn = document.getElementById('export-data');
  const importDataBtn = document.getElementById('import-data');
  const importInput = document.getElementById('import-input');
  const clearDataBtn = document.getElementById('clear-data');
  const confirmModal = document.getElementById('confirm-modal');

  // Initialize settings values
  if (usernameInput) usernameInput.value = savedSettings.username || '';
  if (themeMode) themeMode.value = savedSettings.themeMode || 'light';
  if (themeColor) themeColor.value = savedSettings.themeColor || 'green';
  if (soundCheckbox) soundCheckbox.checked = soundEnabled;
  if (notificationsCheckbox) notificationsCheckbox.checked = !!savedSettings.notificationsEnabled;
  if (pomodoroWork) pomodoroWork.value = savedSettings.pomodoroWork || 25;
  if (pomodoroBreak) pomodoroBreak.value = savedSettings.pomodoroBreak || 5;
  if (pomodoroLongBreak) pomodoroLongBreak.value = savedSettings.pomodoroLongBreak || 15;
  if (languageSelect) languageSelect.value = savedSettings.language || 'en';
  if (profileAvatar && savedSettings.avatar) {
    profileAvatar.src = savedSettings.avatar;
  }

  // Profile settings
  avatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && profileAvatar) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileAvatar.src = e.target.result;
        settings.save({ avatar: e.target.result });
        showToast('Profile picture updated');
      };
      reader.readAsDataURL(file);
    }
  });

  removeAvatarBtn?.addEventListener('click', () => {
    if (profileAvatar) {
      profileAvatar.src = 'default-avatar.png';
      settings.save({ avatar: null });
      showToast('Profile picture removed');
    }
  });

  usernameInput?.addEventListener('change', (e) => {
    settings.save({ username: e.target.value.trim() });
    showToast('Username updated');
  });

  // Theme settings
  themeMode?.addEventListener('change', (e) => {
    const mode = e.target.value;
    document.body.classList.remove('dark', 'light');
    if (mode !== 'auto') document.body.classList.add(mode);
    settings.save({ themeMode: mode });
    if (themeToggle) themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });

  themeColor?.addEventListener('change', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--primary', `var(--theme-${color})`);
    settings.save({ themeColor: color });
    showToast('Theme color updated');
  });

  // Sound settings
  soundCheckbox?.addEventListener('change', (e) => {
    soundEnabled = !!e.target.checked;
    settings.save({ soundEnabled });
    showToast(soundEnabled ? 'Sound enabled' : 'Sound disabled');
  });

  // Notification settings
  notificationsCheckbox?.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    if (enabled) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          settings.save({ notificationsEnabled: true });
          showToast('Notifications enabled');
        } else {
          e.target.checked = false;
          showToast('Notification permission denied');
        }
      });
    } else {
      settings.save({ notificationsEnabled: false });
      showToast('Notifications disabled');
    }
  });

  // Pomodoro settings
  [pomodoroWork, pomodoroBreak, pomodoroLongBreak].forEach(input => {
    input?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      const min = parseInt(e.target.min, 10);
      const max = parseInt(e.target.max, 10);
      if (val < min) e.target.value = min;
      if (val > max) e.target.value = max;
      
      settings.save({
        pomodoroWork: pomodoroWork?.value,
        pomodoroBreak: pomodoroBreak?.value,
        pomodoroLongBreak: pomodoroLongBreak?.value
      });
      showToast('Pomodoro settings updated');
    });
  });

  // Language settings
  languageSelect?.addEventListener('change', (e) => {
    settings.save({ language: e.target.value });
    showToast('Language updated - will take effect after reload');
  });

  // Data management
  exportDataBtn?.addEventListener('click', () => {
    const data = {
      settings: settings.load(),
      tasks: tasks,
      goals: goals,
      notes: notes,
      events: events
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dreamer-backup-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  });

  importDataBtn?.addEventListener('click', () => {
    if (importInput) importInput.click();
  });

  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.settings || !data.tasks || !data.goals || !data.notes) {
          throw new Error('Invalid backup file format');
        }

        // Import data
        localStorage.setItem('dreamer_settings', JSON.stringify(data.settings));
        localStorage.setItem('tasks', JSON.stringify(data.tasks));
        localStorage.setItem('goals', JSON.stringify(data.goals));
        localStorage.setItem('notes', JSON.stringify(data.notes));
        if (data.events) localStorage.setItem('calendar_events', JSON.stringify(data.events));
        
        showToast('Data imported successfully - reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast('Error importing data: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  clearDataBtn?.addEventListener('click', () => {
    if (confirmModal) {
      confirmModal.classList.add('open');
      const yesBtn = confirmModal.querySelector('#confirm-yes');
      const noBtn = confirmModal.querySelector('#confirm-no');
      
      yesBtn.onclick = () => {
        localStorage.clear();
        showToast('All data cleared - reloading...');
        setTimeout(() => window.location.href = 'login.html', 1500);
      };
      
      noBtn.onclick = () => confirmModal.classList.remove('open');
    }
  });

  // toast helper (available globally for login page)
  function showToast(message, opts = {}){
    const container = document.getElementById('toast-container');
    if(!container) {
      // Create toast container if it doesn't exist
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(newContainer);
      return showToast(message, opts);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    // fade out after duration
    setTimeout(()=>{ 
      el.style.opacity = '0'; 
      el.style.transition = 'opacity 0.3s ease';
      el.addEventListener('transitionend', ()=>el.remove()); 
    }, opts.duration || 3000);
  }
  
  // Make showToast available globally
  window.showToast = showToast;

  // Activity logging helper: records user/system actions to localStorage
  function logActivity(type, details = {}){
    try{
      const auth = JSON.parse(localStorage.getItem('dreamer_auth') || 'null');
      const user = auth && auth.email ? auth.email : null;
      const storeKey = 'dreamer_activity_log';
      const log = JSON.parse(localStorage.getItem(storeKey) || '[]');
      log.unshift({ id: Date.now().toString(), type, user, details, ts: new Date().toISOString() });
      // keep the log reasonably sized
      if (log.length > 2000) log.length = 2000;
      localStorage.setItem(storeKey, JSON.stringify(log));
    }catch(e){ console.error('logActivity error', e); }
  }
  window.logActivity = logActivity;

  // sound (small beep)
  function playSound(){
    if (!soundEnabled) return;
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 520;
      g.gain.value = 0.03;
      o.connect(g); g.connect(ctx.destination);
      o.start(); setTimeout(()=>{ o.stop(); ctx.close(); }, 120);
    }catch(e){}
  }

  // small HTML sanitizer to avoid injecting markup when rendering user input
  function escapeHTML(str){
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";

    // apply sorting to a copy so original order in storage is preserved
    let pool = tasks.slice();
    pool = applySort(pool);

    const q = (searchQuery || '').toLowerCase();

    const visible = pool.filter((task) => {
      // filter by currentFilter
      if (currentFilter === 'active' && task.completed) return false;
      if (currentFilter === 'completed' && !task.completed) return false;
      if (currentFilter === 'high' && task.priority !== 'high') return false;

      // search by title, tags, or date
      if (!q) return true;
      const inTitle = task.title.toLowerCase().includes(q);
      const inTags = (task.tags || []).some(t => t.toLowerCase().includes(q));
      const inDate = (task.dueDate || '').toLowerCase().includes(q);
      return inTitle || inTags || inDate;
    });

    visible.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = `task priority-${task.priority} ${task.completed ? "completed" : ""}`;
      li.dataset.id = task.id;

      const tagHtml = (task.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join(' ');
      const safeTitle = escapeHTML(task.title);
      const dateHtml = task.dueDate ? `📅 ${escapeHTML(task.dueDate)}` : '';

      // subtasks markup
      let subtasksHtml = '';
      if (task.subtasks && task.subtasks.length) {
        const items = task.subtasks.map(st => `<li>${escapeHTML(st)}</li>`).join('');
        subtasksHtml = `
          <button class="toggle-subtasks" data-id="${task.id}" style="margin-top:8px;background:transparent;border:none;color:var(--secondary);cursor:pointer">Show subtasks</button>
          <ul class="subtask-list" data-id="${task.id}" style="display:none">${items}</ul>
        `;
      }

      li.innerHTML = `
        <input type="checkbox" ${task.completed ? "checked" : ""} data-id="${task.id}">
        <div class="info">
          <strong>${safeTitle}</strong> ${tagHtml}<br>
          <small>${dateHtml} ${task.recurring && task.recurring !== 'none' ? ' • ' + escapeHTML(task.recurring) : ''}</small>
          ${subtasksHtml}
        </div>
        <div class="actions">
          <button class="edit-btn" data-id="${task.id}">✏️</button>
          <button class="delete-btn" data-id="${task.id}">🗑️</button>
        </div>
      `;
      taskList.appendChild(li);
    });

    // update progress bar if present
    if (progressFill) {
      const completed = tasks.filter(t=>t.completed).length;
      const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
      progressFill.style.width = pct + '%';
    }

    renderChart();
  }

  // Safe add listener
  addBtn?.addEventListener("click", () => {
    if (!taskTitle) return alert('Task input not found');
    const title = taskTitle.value.trim();
    const date = taskDate ? taskDate.value : '';
    const priority = taskPriority ? taskPriority.value : 'medium';
    const tags = taskTags ? taskTags.value.split(',').map(t => t.trim()).filter(Boolean) : [];
    const subtasks = taskSubtasks ? taskSubtasks.value.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const recurring = taskRecurring ? taskRecurring.value : 'none';

    if (!title) return alert("Please enter a task!");

    const id = Date.now();
    tasks.push({ id, title, dueDate: date, priority, tags, subtasks, recurring, completed: false });
    localStorage.setItem("tasks", JSON.stringify(tasks));
    taskTitle.value = "";
    if (taskDate) taskDate.value = "";
    if (taskTags) taskTags.value = '';
    if (taskSubtasks) taskSubtasks.value = '';
    if (taskRecurring) taskRecurring.value = 'none';
    renderTasks();
    checkDueDates();
    showToast('Task added');
    playSound();
    // log task creation
    try { logActivity('task-add', { id, title, priority, tags }); } catch(e){}
  });

  // Delegate events inside taskList to avoid anonymous inline handlers
  taskList?.addEventListener("click", (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const toggleSub = e.target.closest('.toggle-subtasks');
    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      editTask(id);
    }
    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id, 10);
      deleteTask(id);
    }
    if (toggleSub) {
      const id = toggleSub.dataset.id;
      const ul = taskList.querySelector(`.subtask-list[data-id="${id}"]`);
      if (ul) ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Search input
  taskSearch?.addEventListener('input', (e) => {
    searchQuery = e.target.value || '';
    renderTasks();
  });

  // Filter buttons
  filterControls?.forEach(btn => {
    btn.addEventListener('click', () => {
      filterControls.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      if (f === 'all') currentFilter = 'all';
      else if (f === 'completed') currentFilter = 'completed';
      else if (f === 'high') currentFilter = 'high';
      renderTasks();
    });
  });

  // Sorting
  const sortSelect = document.getElementById('task-sort');
  sortSelect?.addEventListener('change', () => renderTasks());

  function applySort(list){
    const s = sortSelect ? sortSelect.value : 'newest';
    if (s === 'newest') return list.sort((a,b)=> b.id - a.id);
    if (s === 'oldest') return list.sort((a,b)=> a.id - b.id);
    if (s === 'date-asc') return list.sort((a,b)=> (a.dueDate||'') > (b.dueDate||'') ? 1 : -1);
    if (s === 'date-desc') return list.sort((a,b)=> (a.dueDate||'') < (b.dueDate||'') ? 1 : -1);
    if (s === 'priority') return list.sort((a,b)=> {
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority]||1) - (p[b.priority]||1);
    });
    return list;
  }

  taskList?.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const id = parseInt(e.target.dataset.id, 10);
      const idx = tasks.findIndex(t => t.id === id);
      if (idx === -1) return;
      tasks[idx].completed = e.target.checked;
      localStorage.setItem("tasks", JSON.stringify(tasks));
      // small animation on the item
      const li = taskList.querySelector(`li[data-id="${id}"]`);
      if (li) {
        li.classList.add('checked-animate');
        setTimeout(()=> li.classList.remove('checked-animate'), 350);
      }
      renderTasks();
      // toast and sound on complete/incomplete
      if (e.target.checked) { showToast('Task completed'); playSound(); }
      else { showToast('Task marked incomplete'); playSound(); }
    }
  });

  function deleteTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const removed = tasks[idx];
    tasks.splice(idx, 1);
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    showToast('Task deleted');
    playSound();
    try { logActivity('task-delete', { id, title: removed?.title }); } catch(e){}
  }

  function editTask(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    const oldTitle = tasks[idx].title;
    const newTitle = prompt("Edit task title:", oldTitle);
    if (newTitle !== null && newTitle.trim() !== "") {
      tasks[idx].title = newTitle.trim();
      localStorage.setItem('tasks', JSON.stringify(tasks));
      renderTasks();
      showToast('Task updated');
      playSound();
      try { logActivity('task-edit', { id, oldTitle, newTitle: newTitle.trim() }); } catch(e){}
    }
  }

  // --- Notifications for due dates (simple, while page open) ---
  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();
  }

  const NOTIFIED_KEY = 'dreamer_notified_ids';
  function getNotifiedIds() {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]');
  }
  function addNotifiedId(id) {
    const arr = getNotifiedIds();
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr));
    }
  }

  function checkDueDates() {
    if (!tasks || !tasks.length) return;
    const now = Date.now();
    const inOneHour = now + 60 * 60 * 1000; // 1 hour
    const notified = getNotifiedIds();
    const upcoming = tasks.filter(t => t.dueDate).filter(t => {
      const d = new Date(t.dueDate).getTime();
      return d > now && d <= inOneHour && !notified.includes(t.id);
    });
    if (upcoming.length) {
      const msg = `You have ${upcoming.length} task(s) due within the next hour.`;
      if (notificationArea) notificationArea.textContent = msg;
      if (Notification.permission === 'granted') {
        upcoming.forEach(t => {
          try { new Notification('Dreamer — Task due soon', { body: `${t.title} — due ${t.dueDate}` }); } catch (e) {}
          addNotifiedId(t.id);
        });
      } else {
        // fallback: show a simple alert once
        // don't spam: only show message in notification area
      }
    } else {
      if (notificationArea) notificationArea.textContent = '';
    }
  }

  // request permission and run first check
  requestNotificationPermission();
  checkDueDates();
  setInterval(checkDueDates, 60 * 1000); // every minute while page is open

  // Theme toggle
  // initialize theme from settings
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') document.body.classList.add('dark');
  if (themeToggle) {
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // Apply saved theme color immediately (if settings saved earlier)
  try {
    const savedSettingsAll = settings.load();
    if (savedSettingsAll && savedSettingsAll.themeColor) {
      document.documentElement.style.setProperty('--primary', `var(--theme-${savedSettingsAll.themeColor})`);
    }
  } catch (e) { /* ignore */ }

  // Mobile sidebar toggling
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const closeSidebar = document.getElementById('close-sidebar');

  // create backdrop for sidebar
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSidebar(){
    sidebar?.classList.add('open');
    backdrop.classList.add('visible');
    sidebar?.setAttribute('aria-hidden','false');
  }
  function closeSidebarFn(){
    sidebar?.classList.remove('open');
    backdrop.classList.remove('visible');
    sidebar?.setAttribute('aria-hidden','true');
  }

  hamburger?.addEventListener('click', (e)=>{ openSidebar(); });
  closeSidebar?.addEventListener('click', (e)=>{ closeSidebarFn(); });
  backdrop?.addEventListener('click', ()=>{ closeSidebarFn(); });

  // Close sidebar on escape
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeSidebarFn(); });

  // Logout button (redirect to login and clear auth)
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('dreamer_auth');
    window.location.href = 'login.html';
  });

  // Goals functionality
  const goalTitle = document.getElementById('goal-title');
  const goalCategory = document.getElementById('goal-category');
  const goalStart = document.getElementById('goal-start');
  const goalEnd = document.getElementById('goal-end');
  const goalMilestones = document.getElementById('goal-milestones');
  const goalImage = document.getElementById('goal-image');
  const goalQuote = document.getElementById('goal-quote');
  const goalDesc = document.getElementById('goal-desc');
  const goalProgressRange = document.getElementById('goal-progress');
  const goalProgressValue = document.getElementById('goal-progress-value');
  const addGoalBtn = document.getElementById('add-goal');
  const longTermGoals = document.getElementById('long-term-goals');
  const shortTermGoals = document.getElementById('short-term-goals');
  const badgeText = document.getElementById('badge-text');
  const streakCountEl = document.getElementById('streak-count');

  let goals = JSON.parse(localStorage.getItem('goals')) || [];

  // reflect slider value while composing
  goalProgressRange?.addEventListener('input', (e)=>{
    if (goalProgressValue) goalProgressValue.textContent = e.target.value + '%';
  });

  function saveGoals(){ localStorage.setItem('goals', JSON.stringify(goals)); }

  addGoalBtn?.addEventListener('click', () => {
    const title = (goalTitle?.value || '').trim();
    if (!title) { showToast('Please enter a goal'); return; }
    const category = (goalCategory?.value || 'short');
    const start = goalStart?.value || '';
    const end = goalEnd?.value || '';
    const desc = (goalDesc?.value || '').trim();
    const image = (goalImage?.value || '').trim();
    const quote = (goalQuote?.value || '').trim();
    const progress = parseInt(goalProgressRange?.value || '0', 10);
    const milestonesRaw = (goalMilestones?.value || '').split(',').map(s=>s.trim()).filter(Boolean);
    const milestones = milestonesRaw.map((m, i) => ({ id: Date.now() + i, title: m, completed: false }));

    const id = Date.now();
    const completed = progress >= 100 || false;
    const completedDate = completed ? new Date().toISOString() : null;

    const goal = { id, title, category, startDate: start, endDate: end, description: desc, motivationImage: image, motivationQuote: quote, milestones, progress, completed, completedDate };
    goals.unshift(goal);
    saveGoals();
    renderGoals();
    // clear inputs
    goalTitle.value = '';
    goalCategory.value = 'short';
    if (goalStart) goalStart.value = '';
    if (goalEnd) goalEnd.value = '';
    if (goalMilestones) goalMilestones.value = '';
    if (goalImage) goalImage.value = '';
    if (goalQuote) goalQuote.value = '';
    if (goalDesc) goalDesc.value = '';
    if (goalProgressRange) { goalProgressRange.value = 0; if (goalProgressValue) goalProgressValue.textContent = '0%'; }
    showToast('Goal added'); playSound();
    try { logActivity('goal-add', { id, title }); } catch(e){}
  });

  function renderGoals(){
    if (!longTermGoals || !shortTermGoals) return;
    longTermGoals.innerHTML = '';
    shortTermGoals.innerHTML = '';

    goals.forEach((goal, idx) => {
      const li = document.createElement('li');
      li.className = 'goal-item';
      li.dataset.index = idx;

      const title = escapeHTML(goal.title);
      const start = goal.startDate ? escapeHTML(goal.startDate) : '—';
      const end = goal.endDate ? escapeHTML(goal.endDate) : '—';
      const desc = goal.description ? `<p class="goal-desc">${escapeHTML(goal.description)}</p>` : '';
      const img = goal.motivationImage ? `<div class="goal-motivation"><img src="${escapeHTML(goal.motivationImage)}" alt="motivation" onerror="this.style.display='none'" /></div>` : '';
      const quote = goal.motivationQuote ? `<div class="goal-quote">“${escapeHTML(goal.motivationQuote)}”</div>` : '';

      // milestones
      let milestonesHtml = '';
      if (goal.milestones && goal.milestones.length){
        const items = goal.milestones.map((m, mi) => `
          <label class="milestone-item"><input type="checkbox" class="milestone-toggle" data-goal-idx="${idx}" data-milestone-idx="${mi}" ${m.completed ? 'checked' : ''}/> ${escapeHTML(m.title)}</label>
        `).join('');
        milestonesHtml = `<div class="milestones">${items}</div>`;
      }

      const progressPct = Math.min(100, Math.max(0, parseInt(goal.progress || 0, 10)));
      const progressBar = `
        <div class="goal-progress-wrapper">
          <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${progressPct}%"></div></div>
          <div class="goal-progress-meta"><input type="range" class="goal-progress-range" data-index="${idx}" min="0" max="100" value="${progressPct}"/><span class="goal-progress-label">${progressPct}%</span></div>
        </div>
      `;

      li.innerHTML = `
        <div class="goal-left">
          <input type="checkbox" class="goal-toggle" data-index="${idx}" ${goal.completed ? 'checked' : ''} />
        </div>
        <div class="goal-main">
          <div class="goal-row">
            <strong class="goal-title">${title}</strong>
            <div class="goal-dates"><small>${start} → ${end}</small></div>
          </div>
          ${desc}
          ${img}
          ${quote}
          ${milestonesHtml}
          ${progressBar}
        </div>
        <div class="goal-actions">
          <button class="goal-edit" data-index="${idx}">✏️</button>
          <button class="goal-delete" data-index="${idx}">🗑️</button>
        </div>
      `;

      if (goal.category === 'long') longTermGoals.appendChild(li); else shortTermGoals.appendChild(li);
    });

    updateAchievements();
    updateStreak();
  }

  // Delegated click/change handlers for goals
  document.addEventListener('click', (e) => {
    const del = e.target.closest('.goal-delete');
    const edit = e.target.closest('.goal-edit');
    if (del) {
      const i = parseInt(del.dataset.index, 10);
      const removed = goals.splice(i,1)[0];
      saveGoals(); renderGoals(); showToast('Goal removed'); playSound();
      try { logActivity('goal-delete', { id: removed?.id, title: removed?.title }); } catch(e){}
    }
    if (edit) {
      const i = parseInt(edit.dataset.index, 10);
      const g = goals[i];
      if (!g) return;
      const oldTitle = g.title;
      const newTitle = prompt('Edit goal title:', oldTitle);
      if (newTitle !== null && newTitle.trim() !== ''){ g.title = newTitle.trim(); saveGoals(); renderGoals(); showToast('Goal updated'); playSound(); try { logActivity('goal-edit', { id: g.id, oldTitle, newTitle: newTitle.trim() }); } catch(e){} }
    }
  });

  document.addEventListener('change', (e) => {
    // toggle goal complete
    const goalToggle = e.target.closest('.goal-toggle');
    if (goalToggle){
      const i = parseInt(goalToggle.dataset.index, 10);
      const g = goals[i]; if (!g) return;
      g.completed = !!goalToggle.checked;
      g.completedDate = g.completed ? new Date().toISOString() : null;
      saveGoals(); renderGoals(); showToast('Goal status changed'); playSound();
    }

    // milestone toggles
    const milestoneToggle = e.target.closest('.milestone-toggle');
    if (milestoneToggle){
      const gi = parseInt(milestoneToggle.dataset.goalIdx, 10);
      const mi = parseInt(milestoneToggle.dataset.milestoneIdx, 10);
      const g = goals[gi]; if (!g || !g.milestones) return;
      g.milestones[mi].completed = !!milestoneToggle.checked;
      // if milestones exist, sync progress to milestones completion
      const done = g.milestones.filter(m=>m.completed).length;
      const total = g.milestones.length || 1;
      g.progress = Math.round((done / total) * 100);
      if (g.progress >= 100){ g.completed = true; g.completedDate = new Date().toISOString(); }
      else { g.completed = false; g.completedDate = null; }
      saveGoals(); renderGoals(); showToast('Milestone updated'); playSound();
    }
  });

  // range input for per-goal progress (delegated)
  document.addEventListener('input', (e) => {
    const rng = e.target.closest('.goal-progress-range');
    if (!rng) return;
    const idx = parseInt(rng.dataset.index, 10);
    const g = goals[idx]; if (!g) return;
    const val = parseInt(rng.value, 10);
    g.progress = val;
    if (val >= 100){ g.completed = true; g.completedDate = new Date().toISOString(); } else { g.completed = false; g.completedDate = null; }
    saveGoals();
    // update label and bar in-place for better responsiveness
    const li = document.querySelector(`li.goal-item[data-index="${idx}"]`);
    if (li){
      const fill = li.querySelector('.goal-progress-fill'); if (fill) fill.style.width = val + '%';
      const label = li.querySelector('.goal-progress-label'); if (label) label.textContent = val + '%';
    }
  });

  function updateAchievements(){
    const completed = goals.filter(g=>g.completed).length;
    if (completed >= 5) badgeText.textContent = `Goal Getter — ${completed} completed`;
    else badgeText.textContent = `${completed} completed`;
  }

  function startOfWeek(d){
    const dt = new Date(d);
    const day = dt.getDay(); // 0 Sun .. 6 Sat
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1); // shift to Monday
    return new Date(dt.setDate(diff));
  }

  function updateStreak(){
    // count consecutive weeks (ending this week) that have at least one completed goal
    const completedDates = goals.filter(g=>g.completed && g.completedDate).map(g=>new Date(g.completedDate).getTime());
    if (!completedDates.length){ streakCountEl.textContent = '0'; return; }
    let weeks = 0; let k=0; const now = new Date();
    while (k < 52){
      const weekStart = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - k*7));
      const weekEnd = new Date(weekStart.getTime() + (7*24*60*60*1000) - 1);
      const any = completedDates.some(ts => ts >= weekStart.getTime() && ts <= weekEnd.getTime());
      if (any) { weeks++; k++; } else break;
    }
    streakCountEl.textContent = String(weeks);
  }

  // initialize
  renderGoals();

  // Notes functionality
  const noteTitle = document.getElementById('note-title');
  const noteContent = document.getElementById('note-content');
  const noteCategory = document.getElementById('note-category');
  const addNoteBtn = document.getElementById('add-note');
  const notesList = document.getElementById('notes-list');
  const notesSearchInput = document.getElementById('notes-search');
  const categoryBtns = document.querySelectorAll('.category-btn');

  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  // Search and filter state for notes
  let notesFilter = 'all';
  let notesSearch = '';

  // Save to localStorage
  function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
  }  // Random pastel color for sticky notes
  function getRandomColor() {
    const colors = [
      '#fff8b5', // yellow
      '#b5e6ff', // blue
      '#ffd1dc', // pink
      '#d1ffb5', // green
      '#e6b5ff', // purple
      '#ffdfb5'  // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addNoteBtn?.addEventListener('click', () => {
    if (!noteTitle || !noteContent || !notesList) return;
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    const category = noteCategory?.value || 'personal';
    
    if (!title || !content) { showToast('Please fill in both title and content!'); return; }
    
    const id = Date.now();
    notes.unshift({
      id,
      title,
      content,
      category,
      color: getRandomColor(),
      date: new Date().toISOString(),
      lastEdited: new Date().toISOString()
    });
    
    saveNotes();
    renderNotes();
    noteTitle.value = '';
    noteContent.value = '';
    showToast('Note added');
    playSound();
    try { logActivity('note-add', { id, title, category }); } catch(e){}
  });

  function renderNotes() {
    if (!notesList) return;
    notesList.innerHTML = '';
    
    // Filter notes by category and search query
    const filtered = notes.filter(note => {
      const matchesCategory = notesFilter === 'all' || note.category === notesFilter;
      if (!matchesCategory) return false;
      
      if (!notesSearch) return true;
      const query = notesSearch.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });

    filtered.forEach((note, index) => {
      const noteEl = document.createElement('div');
      noteEl.className = 'note';
      noteEl.style.backgroundColor = note.color;
      noteEl.dataset.id = note.id;

      const safeTitle = escapeHTML(note.title);
      // Parse markdown in content
      const parsedContent = window.marked ? marked.parse(note.content) : escapeHTML(note.content).replace(/\n/g, '<br>');
      const categoryBadge = `<span class="category-badge ${note.category}">${note.category}</span>`;
      
      noteEl.innerHTML = `
        <div class="note-header">
          <h3>${safeTitle}</h3>
          ${categoryBadge}
        </div>
        <div class="note-content">${parsedContent}</div>
        <div class="note-footer">
          <small>📅 ${new Date(note.date).toLocaleDateString()}</small>
          <div class="note-actions">
            <button class="note-edit" data-id="${note.id}">✏️</button>
            <button class="note-delete" data-id="${note.id}">🗑️</button>
          </div>
        </div>
      `;
      notesList.appendChild(noteEl);
    });
  }

  // Category filter
  categoryBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      notesFilter = btn.dataset.category;
      renderNotes();
    });
  });

  // Search notes
  notesSearchInput?.addEventListener('input', (e) => {
    notesSearch = e.target.value.trim();
    renderNotes();
  });

  // Handle note actions (edit/delete) with event delegation
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.note-delete');
    const editBtn = e.target.closest('.note-edit');
    
    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id, 10);
      const idx = notes.findIndex(n => n.id === id);
      if (idx === -1) return;
      
      if (confirm('Delete this note?')) {
        const removed = notes.splice(idx, 1)[0];
        saveNotes();
        renderNotes();
        showToast('Note deleted');
        playSound();
        try { logActivity('note-delete', { id, title: removed?.title }); } catch(e){}
      }
    }
    
    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
      const oldContent = note.content;
      const newContent = prompt('Edit note:', oldContent);
      if (newContent !== null && newContent.trim()) {
        note.content = newContent.trim();
        note.lastEdited = new Date().toISOString();
        saveNotes();
        renderNotes();
        showToast('Note updated');
        playSound();
        try { logActivity('note-edit', { id, oldContent, newContent: newContent.trim() }); } catch(e){}
      }
    }
  });

  // Calendar functionality
  const calendar = document.getElementById('calendar');
  const calendarViewSelect = document.getElementById('calendar-view');
  const addEventBtn = document.getElementById('add-event-btn');
  const eventModal = document.getElementById('event-modal');
  const eventForm = document.getElementById('event-form');
  const showTasksCheckbox = document.getElementById('show-tasks');
  const showGoalsCheckbox = document.getElementById('show-goals');
  const showEventsCheckbox = document.getElementById('show-events');
  const upcomingList = document.getElementById('upcoming-list');

  // Events storage
  let events = JSON.parse(localStorage.getItem('calendar_events') || '[]');
  function saveEvents() {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }

  // FullCalendar initialization
  let calendarInstance = null;
  function initializeCalendar() {
    if (!calendar) return;
    
    calendarInstance = new FullCalendar.Calendar(calendar, {
      plugins: ['dayGrid', 'timeGrid', 'list', 'interaction'],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: ''  // We're using our own view selector
      },
      height: '100%',
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      events: getAllEvents,
      eventClick: handleEventClick,
      select: handleDateSelect,
      eventDrop: handleEventDrop,
      eventResize: handleEventResize
    });

    calendarInstance.render();
  }

  // Combine all events from different sources
  function getAllEvents() {
    let allEvents = [];
    
    // Add custom events
    if (showEventsCheckbox?.checked) {
      allEvents = allEvents.concat(events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description,
        className: 'event',
        type: 'event'
      })));
    }

    // Add tasks as events
    if (showTasksCheckbox?.checked) {
      allEvents = allEvents.concat(tasks.map(task => ({
        id: 'task_' + task.id,
        title: task.title,
        start: task.dueDate,
        className: 'task',
        type: 'task',
        description: `Priority: ${task.priority}${task.tags?.length ? '\\nTags: ' + task.tags.join(', ') : ''}`,
        completed: task.completed
      })));
    }

    // Add goals as events
    if (showGoalsCheckbox?.checked) {
      allEvents = allEvents.concat(goals.map(goal => ({
        id: 'goal_' + goal.id,
        title: goal.title,
        start: goal.startDate,
        end: goal.endDate,
        className: 'goal',
        type: 'goal',
        description: goal.description,
        completed: goal.completed
      })));
    }

    return allEvents;
  }

  function updateCalendarView() {
    if (!calendarInstance) return;
    calendarInstance.refetchEvents();
  }

  // Event handlers
  function handleEventClick(info) {
    const event = info.event;
    
    // If it's a task or goal, don't open modal - highlight it in the respective list instead
    if (event.extendedProps.type === 'task') {
      const taskEl = document.querySelector(`li[data-id="${event.id.replace('task_', '')}"]`);
      if (taskEl) {
        taskEl.scrollIntoView({ behavior: 'smooth' });
        taskEl.classList.add('highlight');
        setTimeout(() => taskEl.classList.remove('highlight'), 2000);
      }
      return;
    }

    if (event.extendedProps.type === 'goal') {
      const goalEl = document.querySelector(`li[data-id="${event.id.replace('goal_', '')}"]`);
      if (goalEl) {
        goalEl.scrollIntoView({ behavior: 'smooth' });
        goalEl.classList.add('highlight');
        setTimeout(() => goalEl.classList.remove('highlight'), 2000);
      }
      return;
    }

    // For custom events, open the edit modal
    openEventModal('edit', {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end || event.start,
      description: event.extendedProps.description,
      type: event.extendedProps.type
    });
  }

  function handleDateSelect(info) {
    openEventModal('add', {
      start: info.start,
      end: info.end
    });
    calendarInstance.unselect();
  }

  function handleEventDrop(info) {
    const event = info.event;
    if (event.extendedProps.type === 'event') {
      const idx = events.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        events[idx].start = event.start;
        events[idx].end = event.end;
        saveEvents();
        updateUpcomingEvents();
        showToast('Event moved');
      }
    }
  }

  function handleEventResize(info) {
    const event = info.event;
    if (event.extendedProps.type === 'event') {
      const idx = events.findIndex(e => e.id === event.id);
      if (idx !== -1) {
        events[idx].end = event.end;
        saveEvents();
        updateUpcomingEvents();
        showToast('Event duration updated');
      }
    }
  }

  // Modal management
  function openEventModal(mode, data = {}) {
    if (!eventModal) return;

    const modalTitle = document.getElementById('modal-title');
    const titleInput = document.getElementById('event-title');
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');
    const typeSelect = document.getElementById('event-type');
    const descInput = document.getElementById('event-description');

    modalTitle.textContent = mode === 'add' ? 'Add Event' : 'Edit Event';
    eventForm.dataset.mode = mode;
    eventForm.dataset.eventId = data.id || '';

    titleInput.value = data.title || '';
    startInput.value = data.start ? formatDateTimeForInput(data.start) : '';
    endInput.value = data.end ? formatDateTimeForInput(data.end) : '';
    typeSelect.value = data.type || 'event';
    descInput.value = data.description || '';

    eventModal.classList.add('open');
  }

  function closeEventModal() {
    if (!eventModal) return;
    eventModal.classList.remove('open');
    eventForm.reset();
  }

  // Event form handling
  eventForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const mode = eventForm.dataset.mode;
    const eventId = eventForm.dataset.eventId;
    const formData = {
      title: document.getElementById('event-title').value,
      start: new Date(document.getElementById('event-start').value),
      end: new Date(document.getElementById('event-end').value),
      type: document.getElementById('event-type').value,
      description: document.getElementById('event-description').value
    };

    if (mode === 'add') {
      const newEvent = {
        ...formData,
        id: Date.now().toString()
      };
      events.push(newEvent);
    } else {
      const idx = events.findIndex(e => e.id === eventId);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...formData };
      }
    }

    saveEvents();
    updateCalendarView();
    updateUpcomingEvents();
    closeEventModal();
    showToast(mode === 'add' ? 'Event added' : 'Event updated');
  });

  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeEventModal);
  });

  // View changes
  calendarViewSelect?.addEventListener('change', (e) => {
    calendarInstance?.changeView(e.target.value);
  });

  // Add event button
  addEventBtn?.addEventListener('click', () => {
    openEventModal('add', {
      start: new Date(),
      end: new Date(Date.now() + 3600000) // 1 hour from now
    });
  });

  // Visibility toggles
  [showTasksCheckbox, showGoalsCheckbox, showEventsCheckbox].forEach(checkbox => {
    checkbox?.addEventListener('change', updateCalendarView);
  });

  // Helper functions
  function formatDateTimeForInput(date) {
    return new Date(date).toISOString().slice(0, 16);
  }

  function updateUpcomingEvents() {
    if (!upcomingList) return;

    const now = new Date();
    const upcoming = getAllEvents()
      .filter(event => new Date(event.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);

    upcomingList.innerHTML = upcoming.length ? upcoming.map(event => `
      <div class="upcoming-event ${event.type}">
        <div class="event-time">${formatEventDateTime(event.start, event.end)}</div>
        <div class="event-title">${event.title}</div>
      </div>
    `).join('') : '<p>No upcoming events</p>';
  }

  function formatEventDateTime(start, end) {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString() + ' ' + startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  // Initialize calendar (only if calendar element exists)
  if (calendar) {
    initializeCalendar();
    updateUpcomingEvents();
    // Update upcoming events periodically
    setInterval(updateUpcomingEvents, 60000); // Every minute
  }

  // Initialize renderers (safe: each will early-return if its DOM not present)
  renderTasks();
  renderGoals();
  renderNotes();
  // renderCalendar is handled by FullCalendar initialization above
  // Initialize SortableJS for drag-and-drop reordering of tasks
  if (window.Sortable && taskList) {
    try{
      new Sortable(taskList, {
        animation: 150,
        onEnd: function (evt) {
          // build new order by reading li data-id attributes
          const ids = Array.from(taskList.querySelectorAll('li')).map(li => parseInt(li.dataset.id, 10));
          const newTasks = ids.map(id => tasks.find(t => t.id === id)).filter(Boolean);
          tasks = newTasks;
          localStorage.setItem('tasks', JSON.stringify(tasks));
          renderTasks();
        }
      });
    }catch(e){ console.error('Failed to init Sortable', e); }
  }
  // Chart rendering helper
  function renderChart() {
    if (!chartCanvas) return;
    const completed = tasks.filter(t => t.completed).length;
    const remaining = Math.max(0, tasks.length - completed);
    const data = [completed, remaining];

    if (progressChart) {
      progressChart.data.datasets[0].data = data;
      progressChart.update();
      return;
    }

    try {
      progressChart = new Chart(chartCanvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{ data, backgroundColor: ['#4caf50', '#f1f1f1'] }]
        },
        options: { responsive: false, maintainAspectRatio: false }
      });
    } catch (e) {
      // Chart may not be available on other pages
    }
  }

  // Initialize AI Features
  let aiEngine, speechInput, chatbot, analytics;
  try {
    // Create AI feature instances
    aiEngine = new DreamerAI.TaskSuggestionEngine();
    speechInput = new DreamerAI.SpeechInputSystem();
    chatbot = new DreamerAI.DreamerChatbot();
    analytics = new DreamerAI.ProductivityAnalytics();

    // Get UI elements
    const aiPanel = document.getElementById('ai-assistant-panel');
    const analyticsPanel = document.getElementById('analytics-panel');
    const toggleAiBtn = document.getElementById('toggle-ai-panel');
    const toggleAnalyticsBtn = document.getElementById('toggle-analytics');
    const taskSuggestions = document.getElementById('task-suggestions');
    const micBtn = document.getElementById('mic-btn');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');
    const weeklyChart = document.getElementById('weekly-chart');
    const categoryChart = document.getElementById('category-chart');
    const insightsDiv = document.getElementById('productivity-insights');
    const pwaPrompt = document.getElementById('pwa-install-prompt');
    
    // Toggle panels
    toggleAiBtn?.addEventListener('click', () => {
      aiPanel?.classList.toggle('open');
      if (aiPanel?.classList.contains('open')) {
        updateSuggestions();
      }
    });

    toggleAnalyticsBtn?.addEventListener('click', () => {
      analyticsPanel?.classList.toggle('open');
      if (analyticsPanel?.classList.contains('open')) {
        updateAnalytics();
      }
    });

    // Task Suggestions
    function updateSuggestions() {
      if (!taskSuggestions) return;
      const suggestions = aiEngine.suggestTasks(tasks);
      taskSuggestions.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-suggestion="${escapeHTML(suggestion)}">
          ${escapeHTML(suggestion)}
        </div>
      `).join('');
    }

    // Handle clicking on suggestions
    taskSuggestions?.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (!item) return;
      const suggestion = item.dataset.suggestion;
      if (taskTitle) taskTitle.value = suggestion;
      showToast('Suggestion added to input');
    });

    // Speech Input
    micBtn?.addEventListener('click', () => {
      if (speechInput.isListening) {
        speechInput.stop();
      } else {
        speechInput.start();
      }
    });

    // Handle speech results
    window.addEventListener('speech-task', (e) => {
      const { title, priority } = e.detail;
      if (taskTitle) taskTitle.value = title;
      if (taskPriority) taskPriority.value = priority;
      showToast('Voice input processed');
    });

    // Chatbot Interface
    function addChatMessage(message, isUser = false) {
      if (!chatMessages) return;
      const div = document.createElement('div');
      div.className = `chat-message ${isUser ? 'user' : 'bot'}`;
      div.textContent = message;
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleChatMessage();
      }
    });

    sendChatBtn?.addEventListener('click', handleChatMessage);

    async function handleChatMessage() {
      if (!chatInput || !chatInput.value.trim()) return;
      
      const message = chatInput.value.trim();
      addChatMessage(message, true);
      chatInput.value = '';

      // Get chatbot response
      const response = await chatbot.processMessage(message);
      addChatMessage(response);
    }

    // Analytics
    function updateAnalytics() {
      if (!weeklyChart || !categoryChart || !insightsDiv) return;

      const data = analytics.analyze();
      
      // Weekly progress chart
      new Chart(weeklyChart, {
        type: 'line',
        data: {
          labels: Object.keys(data.tasks.completion),
          datasets: [{
            label: 'Tasks Completed',
            data: Object.values(data.tasks.completion).map(d => d.completed),
            borderColor: '#4CAF50',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              }
            },
            x: {
              grid: {
                color: 'rgba(255,255,255,0.1)'
              },
              ticks: {
                color: 'white'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'white'
              }
            }
          }
        }
      });

      // Category distribution chart
      new Chart(categoryChart, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.tasks.categories),
          datasets: [{
            data: Object.values(data.tasks.categories),
            backgroundColor: [
              '#4CAF50',
              '#2196F3',
              '#FFC107',
              '#E91E63',
              '#9C27B0'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'white'
              }
            }
          }
        }
      });

      // Display insights
      const insights = analytics.generateInsights();
      insightsDiv.innerHTML = insights.map(insight => 
        `<div class="insight-item">${insight}</div>`
      ).join('');
    }

    // PWA Installation
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (pwaPrompt) {
        pwaPrompt.classList.remove('hidden');
      }
    });

    document.getElementById('install-pwa')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Installing app...');
      }
      deferredPrompt = null;
      if (pwaPrompt) {
        pwaPrompt.classList.add('hidden');
      }
    });

    document.getElementById('dismiss-pwa')?.addEventListener('click', () => {
      if (pwaPrompt) {
        pwaPrompt.classList.add('hidden');
      }
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.error('ServiceWorker registration failed:', err);
        });
    }

    // Initial updates
    if (aiPanel?.classList.contains('open')) {
      updateSuggestions();
    }
    if (analyticsPanel?.classList.contains('open')) {
      updateAnalytics();
    }

  } catch (e) {
    console.error('Failed to initialize AI features:', e);
  }

  // Inject floating chat button and panel (iframe to chat.html) on non-chat pages
  (function injectChatUI(){
    try{
      if (window.location.pathname.includes('chat.html')) return; // don't inject into the chat page itself
      // create fab
      const fab = document.createElement('button');
      fab.id = 'chat-fab'; fab.className = 'chat-fab'; fab.title = 'Open chat'; fab.innerHTML = '💬';
      document.body.appendChild(fab);

      // create panel
      const panel = document.createElement('div');
      panel.id = 'chat-panel'; panel.className = 'chat-panel';
      panel.innerHTML = '<div class="chat-panel-header"><span class="title">Dreamer Chat</span><button class="close-btn" aria-label="Close chat">✖</button></div><iframe class="chat-iframe" src="chat.html" title="Chat window"></iframe>';
      document.body.appendChild(panel);

      fab.addEventListener('click', ()=> panel.classList.toggle('open'));
      panel.querySelector('.close-btn')?.addEventListener('click', ()=> panel.classList.remove('open'));
    }catch(err){ console.error('Failed to inject chat UI', err); }
  })();
});