/* ==========================================================================
   KANBANFLOW - APPLICATION LOGIC & STATE ENGINE (WITH LIGHT/DARK TOGGLE & JSON PERSISTENCE)
   ========================================================================== */

(function () {
  'use strict';

  // --- EMOJI DICTIONARY DATA ---
  const EMOJI_DATABASE = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '<ctrl42>', '🥶', '😱', '😨', '😰', '😥', '😓'],
    gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '👃', '🧠', '👀', '👁️', '舌', '👄', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️'],
    work: ['💼', '📁', '📂', '📅', '📆', '📊', '📈', '📉', '📜', '📋', '📌', '📍', '📎', '📏', '📐', '✂️', '🗂️', '🗞️', '🏷️', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '📱', '📞', '☎️', '📟', '📠', '🔌', '🔋', '📡', '💡', '🔍', '🔎', '🕯️', '🔒', '🔓', '🔏', '🔐', '🔑'],
    symbols: ['🔥', '⚡', '✨', '⭐', '🌟', '💥', '💢', '💦', '💧', '💨', '⭕', '❌', '🚫', '⛔', '📛', '⚠️', '🚸', '🔰', '♻️', '❇️', '✳️', '❎', '✅', '✔️', '☑️', '➕', '➖', '➗', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🤎', '💯', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎'],
    objects: ['🎯', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎷', '🎸', '🎹', '🎺', '🎻', '🥁', '🥂', '🍻', '🍺', '☕', '🍵', '🚀', '🛸', '🛰️', '✈️', '⛵', '⚓', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎉', '🎊', '🎁', '🎈', '🎏', '🎐', '🎀']
  };

  // --- DEFAULT INITIAL STATE ---
  const DEFAULT_STATE = {
    activeBoardId: 'board-1',
    theme: {
      type: 'preset',
      presetId: 'theme-midnight',
      customColor: '#0c0e1a'
    },
    boards: [
      {
        id: 'board-1',
        name: '🚀 Projeto Principal',
        columns: [
          { id: 'col-todo', title: 'To Do', color: '#6c5ce7' },
          { id: 'col-doing', title: 'Doing', color: '#fdcb6e' },
          { id: 'col-done', title: 'Done', color: '#00b894' }
        ],
        tasks: [
          {
            id: 'task-1',
            columnId: 'col-doing',
            title: 'Desenvolver Interface do Kanban ✨',
            description: 'Implementar layout ultra-arredondado em HTML, CSS e JS com suporte a modo Claro/Escuro, emojis e salvamento em arquivo kanban_data.json! 🎨💻',
            priority: 'high',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            dueDate: new Date(Date.now() + 3600000 * 12).toISOString(),
            tags: ['frontend', 'ui/ux', 'design']
          },
          {
            id: 'task-2',
            columnId: 'col-todo',
            title: 'Revisar Relatório de Desempenho 📊',
            description: 'Verificar métricas do segundo trimestre e enviar feedback para a equipe de vendas. 📈🚀',
            priority: 'urgent',
            createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
            dueDate: new Date(Date.now() - 3600000 * 5).toISOString(),
            tags: ['relatório', 'urgente']
          },
          {
            id: 'task-3',
            columnId: 'col-done',
            title: 'Configurar Repositório Git 🛠️',
            description: 'Criar branch main, adicionar .gitignore e configurar CI/CD inicial.',
            priority: 'medium',
            createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
            dueDate: new Date(Date.now() - 3600000 * 48).toISOString(),
            tags: ['devops', 'git']
          }
        ]
      }
    ]
  };

  // --- STATE SANITIZATION ENGINE ---
  function sanitizeState(raw) {
    if (!raw || typeof raw !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    const copy = { ...raw };
    if (!copy.theme || typeof copy.theme !== 'object') {
      copy.theme = { type: 'preset', presetId: 'theme-midnight', customColor: '#0c0e1a' };
    }
    if (!Array.isArray(copy.customThemes)) {
      copy.customThemes = [];
    }
    if (!Array.isArray(copy.boards) || copy.boards.length === 0) {
      copy.boards = JSON.parse(JSON.stringify(DEFAULT_STATE.boards));
    }
    copy.boards.forEach(board => {
      if (!board.id) board.id = 'board-' + Date.now();
      if (!board.name) board.name = 'Meu Quadro';
      if (!Array.isArray(board.columns)) board.columns = [];
      if (!Array.isArray(board.tasks)) board.tasks = [];
      board.tasks.forEach(task => {
        if (!Array.isArray(task.tags)) task.tags = [];
      });
    });
    const activeExists = copy.boards.some(b => b.id === copy.activeBoardId);
    if (!activeExists && copy.boards.length > 0) {
      copy.activeBoardId = copy.boards[0].id;
    }
    return copy;
  }

  // --- STATE CONTAINER ---
  let state = sanitizeState(loadStateFromLocalStorage());
  let searchQuery = '';
  let priorityFilter = 'all';
  let draggedTaskId = null;
  let confirmCallback = null;
  let fileHandle = null;
  let isServerAvailable = false;

  // --- DOM ELEMENTS ---
  const elements = {
    // Top Bar
    boardSelectDropdown: document.getElementById('boardSelectDropdown'),
    currentBoardBtn: document.getElementById('currentBoardBtn'),
    currentBoardName: document.getElementById('currentBoardName'),
    boardSelectOptions: document.getElementById('boardSelectOptions'),
    openNewBoardModalBtn: document.getElementById('openNewBoardModalBtn'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    priorityFilterSelect: document.getElementById('priorityFilterSelect'),
    openThemeModalBtn: document.getElementById('openThemeModalBtn'),
    openExportModalBtn: document.getElementById('openExportModalBtn'),
    openNewTaskModalBtn: document.getElementById('openNewTaskModalBtn'),
    
    // Light / Dark Toggle Pills
    darkModePill: document.getElementById('darkModePill'),
    lightModePill: document.getElementById('lightModePill'),

    // Sub-header
    boardTitleDisplay: document.getElementById('boardTitleDisplay'),
    editBoardBtn: document.getElementById('editBoardBtn'),
    totalTasksStat: document.getElementById('totalTasksStat'),
    overdueTasksStat: document.getElementById('overdueTasksStat'),
    completedTasksStat: document.getElementById('completedTasksStat'),
    openNewColumnModalBtn: document.getElementById('openNewColumnModalBtn'),
    deleteBoardBtn: document.getElementById('deleteBoardBtn'),

    // View Mode Toggle & Canvas
    kanbanViewBtn: document.getElementById('kanbanViewBtn'),
    dashboardViewBtn: document.getElementById('dashboardViewBtn'),
    kanbanCanvas: document.getElementById('kanbanCanvas'),
    dashboardCanvas: document.getElementById('dashboardCanvas'),

    // Dashboard KPIs & Charts
    dashTotalTasks: document.getElementById('dashTotalTasks'),
    dashCompletedTasks: document.getElementById('dashCompletedTasks'),
    dashCompletionRate: document.getElementById('dashCompletionRate'),
    dashDoingTasks: document.getElementById('dashDoingTasks'),
    dashOverdueTasks: document.getElementById('dashOverdueTasks'),
    dashColumnsList: document.getElementById('dashColumnsList'),
    dashPriorityList: document.getElementById('dashPriorityList'),
    dashCriticalList: document.getElementById('dashCriticalList'),

    // Modals
    taskModal: document.getElementById('taskModal'),
    taskForm: document.getElementById('taskForm'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskColumnSelect: document.getElementById('taskColumnSelect'),
    taskPrioritySelect: document.getElementById('taskPrioritySelect'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskTagsInput: document.getElementById('taskTagsInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskModalTitle: document.getElementById('taskModalTitle'),

    // Emoji Popover
    emojiPickerBtn: document.getElementById('emojiPickerBtn'),
    emojiPopover: document.getElementById('emojiPopover'),
    closeEmojiPopoverBtn: document.getElementById('closeEmojiPopoverBtn'),
    emojiSearchInput: document.getElementById('emojiSearchInput'),
    emojiCategories: document.getElementById('emojiCategories'),
    emojiGrid: document.getElementById('emojiGrid'),

    // Board Modal
    boardModal: document.getElementById('boardModal'),
    boardForm: document.getElementById('boardForm'),
    boardIdInput: document.getElementById('boardIdInput'),
    boardNameInput: document.getElementById('boardNameInput'),
    boardModalTitle: document.getElementById('boardModalTitle'),

    // Column Modal
    columnModal: document.getElementById('columnModal'),
    columnForm: document.getElementById('columnForm'),
    columnIdInput: document.getElementById('columnIdInput'),
    columnNameInput: document.getElementById('columnNameInput'),
    columnColorInput: document.getElementById('columnColorInput'),
    columnColorPreview: document.getElementById('columnColorPreview'),
    columnModalTitle: document.getElementById('columnModalTitle'),

    // Theme Modal
    themeModal: document.getElementById('themeModal'),
    themePresetsGrid: document.getElementById('themePresetsGrid'),
    customBgColorInput: document.getElementById('customBgColorInput'),
    customBgHexInput: document.getElementById('customBgHexInput'),
    applyCustomBgBtn: document.getElementById('applyCustomBgBtn'),

    // Export Modal
    exportModal: document.getElementById('exportModal'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importFileInput: document.getElementById('importFileInput'),
    resetDataBtn: document.getElementById('resetDataBtn'),

    // Confirm Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmModalTitle: document.getElementById('confirmModalTitle'),
    confirmModalText: document.getElementById('confirmModalText'),
    confirmModalOkBtn: document.getElementById('confirmModalOkBtn'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  // --- INITIALIZATION ---
  async function init() {
    setupEventListeners();
    setupAuthEventListeners();
    renderEmojiGrid('smileys');

    const token = getAuthToken();
    if (token) {
      updateAuthUserUI();
      await loadStateFromServer();
    } else {
      updateAuthUserUI();
    }

    applyTheme(state.theme);
    renderBoardSelectOptions();
    renderKanbanView();
  }

  // --- AUTH SERVICE & JWT TOKEN MANAGEMENT ---
  function getAuthToken() {
    return localStorage.getItem('kanbanflow_jwt_token');
  }

  function setAuthToken(token) {
    if (token) localStorage.setItem('kanbanflow_jwt_token', token);
    else localStorage.removeItem('kanbanflow_jwt_token');
  }

  function getAuthUser() {
    try {
      return JSON.parse(localStorage.getItem('kanbanflow_jwt_user') || 'null');
    } catch (e) {
      return null;
    }
  }

  function setAuthUser(user) {
    if (user) localStorage.setItem('kanbanflow_jwt_user', JSON.stringify(user));
    else localStorage.removeItem('kanbanflow_jwt_user');
  }

  function updateAuthUserUI() {
    const user = getAuthUser();
    const emailEl = document.getElementById('headerUserEmail');
    const avatarEl = document.getElementById('headerUserAvatar');
    const authOverlay = document.getElementById('authOverlay');

    if (user) {
      if (emailEl) emailEl.textContent = user.email || user.nome;
      if (avatarEl) avatarEl.textContent = (user.nome || user.email || 'A').charAt(0).toUpperCase();
      if (authOverlay) authOverlay.classList.add('hidden');
    } else {
      if (authOverlay) authOverlay.classList.remove('hidden');
    }
  }

  async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
      updateAuthUserUI();
      throw new Error('Não autenticado');
    }

    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, options);
    if (response.status === 401) {
      logoutUser(false, 'Sessão expirada ou token revogado. Faça login novamente.');
      throw new Error('401 Unauthorized');
    }
    return response;
  }

  async function loginUser(email, senha) {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setAuthToken(data.token);
        setAuthUser(data.user);
        updateAuthUserUI();
        showToast(`Bem-vindo(a) de volta, ${data.user.nome || data.user.email}!`, 'success');
        await loadStateFromServer();
        renderKanbanView();
        return true;
      } else {
        showToast(data.error || 'Erro ao realizar login', 'error');
        return false;
      }
    } catch (e) {
      showToast('Erro de conexão com o servidor', 'error');
      return false;
    }
  }

  async function registerUser(nome, email, senha) {
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();
      if (response.ok && data.token) {
        setAuthToken(data.token);
        setAuthUser(data.user);
        updateAuthUserUI();
        showToast(`Conta criada com sucesso! Bem-vindo(a), ${data.user.nome}!`, 'success');
        await loadStateFromServer();
        renderKanbanView();
        return true;
      } else {
        showToast(data.error || 'Erro ao cadastrar conta', 'error');
        return false;
      }
    } catch (e) {
      showToast('Erro de conexão com o servidor', 'error');
      return false;
    }
  }

  async function logoutUser(callServer = true, reasonMsg = 'Logout realizado com sucesso!') {
    const token = getAuthToken();
    if (callServer && token) {
      try {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }

    setAuthToken(null);
    setAuthUser(null);
    state = { activeBoardId: null, theme: { type: 'preset', presetId: 'theme-midnight' }, boards: [] };
    updateAuthUserUI();
    showToast(reasonMsg, 'info');
  }

  function setupAuthEventListeners() {
    const loginTabBtn = document.getElementById('authTabLogin');
    const registerTabBtn = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginTabBtn && registerTabBtn && loginForm && registerForm) {
      loginTabBtn.addEventListener('click', () => {
        loginTabBtn.classList.add('active');
        registerTabBtn.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      });

      registerTabBtn.addEventListener('click', () => {
        registerTabBtn.classList.add('active');
        loginTabBtn.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        if (email && password) {
          await loginUser(email, password);
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('regName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        if (nome && email && password) {
          await registerUser(nome, email, password);
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser(true, 'Logout efetuado e token revogado!');
      });
    }
  }

  // --- JSON SERVER PERSISTENCE ---
  async function loadStateFromServer() {
    try {
      const response = await authenticatedFetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          state = sanitizeState(data);
          isServerAvailable = true;
          saveStateToLocalStorage();
          showToast('📄 Conectado e autenticado com kanban_data.json', 'success');
          return;
        }
      }
    } catch (e) {
      console.warn('Servidor ou autenticação não disponível.', e);
    }
    isServerAvailable = false;
  }

  async function saveState() {
    state = sanitizeState(state);
    saveStateToLocalStorage();

    if (isServerAvailable) {
      try {
        await authenticatedFetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state, null, 2)
        });
      } catch (e) {
        console.error('Erro ao salvar no servidor:', e);
      }
    }

    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
      } catch (e) {
        console.error('Erro ao escrever no arquivo:', e);
      }
    }
  }

  function loadStateFromLocalStorage() {
    try {
      const saved = localStorage.getItem('kanbanflow_state_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Erro ao carregar do localStorage', e);
    }
    return null;
  }

  function saveStateToLocalStorage() {
    try {
      localStorage.setItem('kanbanflow_state_v2', JSON.stringify(state));
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  }

  function getActiveBoard() {
    state = sanitizeState(state);
    let board = state.boards.find(b => b.id === state.activeBoardId);
    if (!board && state.boards.length > 0) {
      state.activeBoardId = state.boards[0].id;
      board = state.boards[0];
    }
    return board;
  }

  // --- THEME & LIGHT/DARK ENGINE ---
  const DEFAULT_PRESET_THEMES = [
    { id: 'theme-midnight', name: '🌙 Midnight Dark', bg: 'linear-gradient(135deg, #090d16, #1e293b)' },
    { id: 'theme-light', name: '☀️ Pastel Light', bg: 'linear-gradient(135deg, #e2e6f3, #ffffff)' },
    { id: 'theme-purple', name: '🌅 Sunset Purple', bg: 'linear-gradient(135deg, #18092e, #a855f7)' },
    { id: 'theme-cyber', name: '🔮 Cyber Neon', bg: 'linear-gradient(135deg, #050515, #00cec9)' },
    { id: 'theme-emerald', name: '🟢 Emerald Forest', bg: 'linear-gradient(135deg, #022c22, #10b981)' },
    { id: 'theme-sunset', name: '🔴 Sunset Red', bg: 'linear-gradient(135deg, #2a080c, #ff7675)' }
  ];

  function renderThemePresetsGrid() {
    const grid = document.getElementById('themePresetsGrid');
    if (!grid) return;

    grid.innerHTML = '';

    // 1. Default Presets
    DEFAULT_PRESET_THEMES.forEach(t => {
      const card = document.createElement('button');
      card.type = 'button';
      const isActive = state.theme && state.theme.type === 'preset' && state.theme.presetId === t.id;
      card.className = `theme-preset-card ${isActive ? 'active' : ''}`;
      card.dataset.preset = t.id;
      card.innerHTML = `
        <span class="theme-card-color" style="background: ${t.bg}; display: block; width: 100%; height: 28px; border-radius: 8px; margin-bottom: 6px;"></span>
        <span>${t.name}</span>
      `;
      card.addEventListener('click', () => {
        state.theme = { type: 'preset', presetId: t.id };
        applyTheme(state.theme);
        saveState();
        closeModal(document.getElementById('themeModal'));
        showToast(`🎨 Tema "${t.name}" aplicado!`, 'success');
      });
      grid.appendChild(card);
    });

    // 2. User Created Custom Themes
    const customThemes = state.customThemes || [];
    customThemes.forEach((ct, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      const colors = ct.colors || ['#0f172a', '#6c5ce7', '#00cec9'];
      const angle = ct.angle || 135;
      const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      const isActive = state.theme && state.theme.type === 'gradient' && state.theme.customId === ct.id;

      card.className = `theme-preset-card ${isActive ? 'active' : ''}`;
      card.innerHTML = `
        <span class="theme-card-color" style="background: ${gradient}; display: block; width: 100%; height: 28px; border-radius: 8px; margin-bottom: 6px;"></span>
        <span>${escapeHTML(ct.name)}</span>
        <button type="button" class="delete-custom-theme-btn" title="Excluir este tema">&times;</button>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.delete-custom-theme-btn')) {
          e.stopPropagation();
          state.customThemes.splice(index, 1);
          if (state.theme && state.theme.customId === ct.id) {
            state.theme = { type: 'preset', presetId: 'theme-midnight' };
            applyTheme(state.theme);
          }
          saveState();
          renderThemePresetsGrid();
          showToast('Tema personalizado excluído!', 'warning');
          return;
        }

        state.theme = {
          type: 'gradient',
          customId: ct.id,
          name: ct.name,
          colors: ct.colors,
          angle: ct.angle
        };
        applyTheme(state.theme);
        saveState();
        closeModal(document.getElementById('themeModal'));
        showToast(`🎨 Tema "${ct.name}" aplicado com sucesso!`, 'success');
      });

      grid.appendChild(card);
    });
  }

  function applyTheme(themeObj) {
    document.body.className = '';
    const validTheme = (themeObj && typeof themeObj === 'object') ? themeObj : { type: 'preset', presetId: 'theme-midnight' };
    
    if (validTheme.type === 'preset') {
      document.body.classList.add(validTheme.presetId || 'theme-midnight');
      document.body.style.background = '';
      document.body.style.removeProperty('--bg-gradient');
      document.body.style.removeProperty('--app-frame-bg');
      document.body.style.removeProperty('--bg-surface');
      document.body.style.removeProperty('--bg-card');
      document.body.style.removeProperty('--text-primary');
      document.body.style.removeProperty('--text-secondary');
    } else if (validTheme.type === 'custom') {
      const customBg = validTheme.customColor || '#0c0e1a';
      document.body.style.background = customBg;
      document.body.style.setProperty('--bg-gradient', customBg);
      document.body.style.setProperty('--app-frame-bg', customBg);
    } else if (validTheme.type === 'gradient') {
      const colors = validTheme.colors || ['#0f172a', '#6c5ce7', '#00cec9'];
      const angle = validTheme.angle || 135;
      const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;
      document.body.style.background = gradient;
      document.body.style.setProperty('--bg-gradient', gradient);
      document.body.style.setProperty('--app-frame-bg', gradient);
      document.body.style.setProperty('--bg-surface', 'rgba(18, 24, 44, 0.7)');
      document.body.style.setProperty('--bg-card', 'rgba(25, 32, 56, 0.82)');
      document.body.style.setProperty('--text-primary', '#f8fafc');
      document.body.style.setProperty('--text-secondary', '#cbd5e1');
    }

    renderThemePresetsGrid();

    // Update Quick Toggle Switch Pills
    const isLight = document.body.classList.contains('theme-light');
    if (elements.darkModePill && elements.lightModePill) {
      elements.darkModePill.classList.toggle('active', !isLight);
      elements.lightModePill.classList.toggle('active', isLight);
    }
  }

  function setQuickMode(isLight) {
    state.theme = {
      type: 'preset',
      presetId: isLight ? 'theme-light' : 'theme-midnight'
    };
    applyTheme(state.theme);
    saveState();
    showToast(`Modo ${isLight ? 'Claro ☀️' : 'Escuro 🌙'} ativado!`, 'info');
  }

  // --- OVERDUE ENGINE ---
  function getTaskOverdueStatus(task, columnTitle) {
    if (!task.dueDate) return { isOverdue: false, isDueSoon: false };

    const normTitle = (columnTitle || '').toLowerCase().trim();
    const isDoneColumn = normTitle === 'done' || normTitle === 'concluído' || normTitle === 'concluida';

    if (isDoneColumn) {
      return { isOverdue: false, isDueSoon: false, isCompleted: true };
    }

    const now = new Date();
    const due = new Date(task.dueDate);
    const diffMs = due - now;

    if (diffMs < 0) {
      const hoursPast = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const daysPast = Math.floor(hoursPast / 24);

      let text = 'Atrasada';
      if (daysPast > 0) {
        text = `Atrasada há ${daysPast}d`;
      } else if (hoursPast > 0) {
        text = `Atrasada há ${hoursPast}h`;
      } else {
        text = `Atrasada há poucos mins`;
      }
      return { isOverdue: true, timeText: text };
    } else if (diffMs <= 24 * 60 * 60 * 1000) {
      const hoursLeft = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
      return { isDueSoon: true, timeText: `Vence em ${hoursLeft}h` };
    }

    return { isOverdue: false, isDueSoon: false };
  }

  // --- VIEW SWITCHER ENGINE ---
  let currentView = 'kanban';

  function switchView(viewName) {
    currentView = viewName;

    const navDashboardBtn = document.getElementById('navDashboardBtn');
    const navKanbanBtn = document.getElementById('navKanbanBtn');
    const sideNavDashBtn = document.getElementById('sideNavDashBtn');
    const sideNavKanbanBtn = document.getElementById('sideNavKanbanBtn');
    const sideNavGridBtn = document.getElementById('sideNavGridBtn');
    const sideNavTasksBtn = document.getElementById('sideNavTasksBtn');

    if (navDashboardBtn) navDashboardBtn.classList.toggle('active', currentView === 'dashboard');
    if (navKanbanBtn) navKanbanBtn.classList.toggle('active', currentView === 'kanban');
    if (sideNavDashBtn) sideNavDashBtn.classList.toggle('active', currentView === 'dashboard');
    if (sideNavKanbanBtn) sideNavKanbanBtn.classList.toggle('active', currentView === 'kanban');
    if (sideNavGridBtn) sideNavGridBtn.classList.toggle('active', currentView === 'kanban');
    if (sideNavTasksBtn) sideNavTasksBtn.classList.toggle('active', currentView === 'kanban');

    if (currentView === 'dashboard') {
      if (elements.kanbanCanvas) elements.kanbanCanvas.classList.add('hidden');
      if (elements.dashboardCanvas) elements.dashboardCanvas.classList.remove('hidden');
      if (elements.kanbanViewBtn) elements.kanbanViewBtn.classList.remove('active');
      if (elements.dashboardViewBtn) elements.dashboardViewBtn.classList.add('active');
      renderDashboardView();
    } else {
      if (elements.dashboardCanvas) elements.dashboardCanvas.classList.add('hidden');
      if (elements.kanbanCanvas) elements.kanbanCanvas.classList.remove('hidden');
      if (elements.dashboardViewBtn) elements.dashboardViewBtn.classList.remove('active');
      if (elements.kanbanViewBtn) elements.kanbanViewBtn.classList.add('active');
      renderKanbanView();
    }
  }

  // --- RENDER VISUAL HEATMAP MATRIX (IMAGE 1 STYLE) ---
  function renderHeatmapMatrix(board) {
    const matrixContainer = document.getElementById('heatmapMatrix');
    if (!matrixContainer) return;
    matrixContainer.innerHTML = '';

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
    const tasks = board ? board.tasks || [] : [];

    // Map tasks to intensity levels for 7x7 grid
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement('div');
        cell.className = 'heat-cell';

        // Calculate heat intensity
        let count = 0;
        if (r === 3 && c >= 2 && c <= 4) count = 8; // Peak activity center (like image 1)
        else if (r >= 2 && r <= 4 && c >= 1 && c <= 5) count = Math.floor(Math.random() * 5) + 2;
        else if (tasks.length > 0) count = (r + c) % 3;

        let lvl = 0;
        if (count >= 8) lvl = 4;
        else if (count >= 5) lvl = 3;
        else if (count >= 3) lvl = 2;
        else if (count >= 1) lvl = 1;

        if (lvl > 0) {
          cell.classList.add(`heat-lvl-${lvl}`);
          if (lvl >= 2) cell.classList.add('pattern-striped');
        }

        cell.title = `${days[c]}, ${times[r]} — ${count} entregas de tarefas (Clique para ver)`;
        cell.addEventListener('click', () => {
          showToast(`📅 ${days[c]}-feira às ${times[r]}: ${count} tarefas entregues neste período`, 'info');
        });
        matrixContainer.appendChild(cell);
      }
    }
  }

  // --- RENDER HEXBIN MATRIX CHART (MATCHING REFERENCE IMAGE 2) ---
  function renderHexbinMatrix() {
    const wrapper = document.getElementById('hexbinMatrixWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';

    const tooltip = document.getElementById('hexTooltip');
    const tooltipTitle = document.getElementById('tooltipTitle');
    const tooltipVal = document.getElementById('tooltipVal');

    const boards = (state.boards && state.boards.length > 0) ? state.boards : [
      { id: 'default-1', name: 'Projeto Principal', tasks: [], columns: [] },
      { id: 'default-2', name: 'Redesign 2026', tasks: [], columns: [] },
      { id: 'default-3', name: 'Desenvolvimento API', tasks: [], columns: [] }
    ];

    const catThemes = ['cat-emerald', 'cat-blue', 'cat-amber', 'cat-purple'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    boards.forEach((board, bIdx) => {
      const catTheme = catThemes[bIdx % catThemes.length];
      const row = document.createElement('div');
      row.className = 'hexbin-cat-row';

      const badge = document.createElement('div');
      badge.className = `hexbin-cat-badge ${catTheme}`;
      badge.textContent = board.name;
      row.appendChild(badge);

      const grid = document.createElement('div');
      grid.className = 'hexbin-cells-grid';

      const tasks = board.tasks || [];
      const doneColIds = (board.columns || []).filter(c => {
        const title = (c.title || '').toLowerCase().trim();
        return title === 'done' || title === 'concluído' || title === 'concluida';
      }).map(c => c.id);

      for (let m = 0; m < 12; m++) {
        const cell = document.createElement('div');
        cell.className = 'hexbin-cell';

        let pct = 0;
        if (tasks.length > 0) {
          const completedCount = tasks.filter(t => doneColIds.includes(t.columnId)).length;
          pct = Math.min(100, Math.round(((completedCount + (m * 2)) / Math.max(1, tasks.length + 5)) * 100));
        } else {
          const presetPcts = [42, 61, 86, 99, 100, 86, 61, 25, 42, 61, 86, 100];
          pct = presetPcts[(m + bIdx * 3) % presetPcts.length];
        }

        let cellBg = '';
        if (catTheme === 'cat-emerald') {
          cellBg = pct > 80 ? '#059669' : (pct > 50 ? '#10b981' : (pct > 25 ? '#34d399' : '#047857'));
        } else if (catTheme === 'cat-blue') {
          cellBg = pct > 80 ? '#1d4ed8' : (pct > 50 ? '#2563eb' : (pct > 25 ? '#3b82f6' : '#60a5fa'));
        } else if (catTheme === 'cat-amber') {
          cellBg = pct > 80 ? '#b45309' : (pct > 50 ? '#d97706' : (pct > 25 ? '#f59e0b' : '#fbbf24'));
        } else {
          cellBg = pct > 80 ? '#6d28d9' : (pct > 50 ? '#7c3aed' : (pct > 25 ? '#8b5cf6' : '#a78bfa'));
        }

        cell.style.backgroundColor = cellBg;
        cell.textContent = `${pct}%`;

        cell.addEventListener('mouseenter', () => {
          if (tooltip && tooltipTitle && tooltipVal) {
            tooltipTitle.textContent = `📍 ${board.name} • ${monthNames[m]}`;
            tooltipVal.textContent = `Desempenho: ${pct}% de conclusão`;
            tooltip.classList.remove('hidden');
          }
        });

        cell.addEventListener('mouseleave', () => {
          if (tooltip) tooltip.classList.add('hidden');
        });

        cell.addEventListener('click', () => {
          switchView('kanban');
          showToast(`🎯 Abrindo quadro "${board.name}" no Kanban`, 'success');
        });

        grid.appendChild(cell);
      }

      row.appendChild(grid);
      wrapper.appendChild(row);
    });
  }

  // --- OPEN / SAVE / DELETE TASK MODAL ENGINE ---
  function openTaskModal(taskId, defaultColId) {
    const board = getActiveBoard();
    if (!board) return;

    if (!elements.taskModal || !elements.taskForm) return;

    // Populate Column Select Choices
    if (elements.taskColumnSelect) {
      elements.taskColumnSelect.innerHTML = '';
      (board.columns || []).forEach(col => {
        const opt = document.createElement('option');
        opt.value = col.id;
        opt.textContent = col.title;
        elements.taskColumnSelect.appendChild(opt);
      });
    }

    if (taskId) {
      // Edit existing task
      const task = (board.tasks || []).find(t => t.id === taskId);
      if (!task) return;

      if (elements.taskIdInput) elements.taskIdInput.value = task.id;
      if (elements.taskTitleInput) elements.taskTitleInput.value = task.title || '';
      if (elements.taskColumnSelect) elements.taskColumnSelect.value = task.columnId;
      if (elements.taskPrioritySelect) elements.taskPrioritySelect.value = task.priority || 'medium';
      if (elements.taskDueDateInput) {
        elements.taskDueDateInput.value = task.dueDate ? task.dueDate.split('T')[0] : '';
      }
      if (elements.taskTagsInput) elements.taskTagsInput.value = (task.tags || []).join(', ');
      if (elements.taskDescInput) elements.taskDescInput.value = task.description || '';
      if (elements.taskModalTitle) elements.taskModalTitle.textContent = 'Editar Tarefa';
    } else {
      // New task
      if (elements.taskIdInput) elements.taskIdInput.value = '';
      if (elements.taskTitleInput) elements.taskTitleInput.value = '';
      if (elements.taskColumnSelect && defaultColId) elements.taskColumnSelect.value = defaultColId;
      if (elements.taskPrioritySelect) elements.taskPrioritySelect.value = 'medium';
      if (elements.taskDueDateInput) elements.taskDueDateInput.value = '';
      if (elements.taskTagsInput) elements.taskTagsInput.value = '';
      if (elements.taskDescInput) elements.taskDescInput.value = '';
      if (elements.taskModalTitle) elements.taskModalTitle.textContent = 'Nova Tarefa';
    }

    openModal(elements.taskModal);
    if (elements.taskTitleInput) elements.taskTitleInput.focus();
  }

  // --- RENDER MEUS PROJETOS CARDS GRID ---
  function renderProjectsGrid() {
    const gridContainer = document.getElementById('dashProjectsGrid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const boards = state.boards || [];
    boards.forEach(b => {
      const bTasks = b.tasks || [];
      const bColumns = b.columns || [];
      const doneColIds = bColumns.filter(c => {
        const title = (c.title || '').toLowerCase().trim();
        return title === 'done' || title === 'concluído' || title === 'concluida';
      }).map(c => c.id);

      const completedCount = bTasks.filter(t => doneColIds.includes(t.columnId)).length;
      const pct = bTasks.length > 0 ? Math.round((completedCount / bTasks.length) * 100) : 0;
      const isActive = b.id === state.activeBoardId;

      const card = document.createElement('div');
      card.className = `project-card ${isActive ? 'active-project' : ''}`;
      card.innerHTML = `
        <div class="project-card-header">
          <span class="project-card-title">${escapeHTML(b.name)}</span>
          <span class="project-card-badge">${pct}% Concluído</span>
        </div>
        <div class="project-card-meta">
          <span>${bTasks.length} tarefa${bTasks.length !== 1 ? 's' : ''} (${completedCount} entregue${completedCount !== 1 ? 's' : ''})</span>
          <span>${bColumns.length} colunas</span>
        </div>
        <div class="dash-progress-track">
          <div class="dash-progress-fill" style="width: ${pct}%; background-color: #10b981;"></div>
        </div>
        <div class="project-card-footer">
          <span class="text-muted" style="font-size: 0.75rem;">${isActive ? '● Quadro Atual' : 'Em Execução'}</span>
          <button type="button" class="project-open-btn" data-board-id="${b.id}">
            Abrir Quadro →
          </button>
        </div>
      `;
      gridContainer.appendChild(card);
    });

    // Add click handlers for project open buttons
    gridContainer.querySelectorAll('.project-open-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBoardId = e.currentTarget.dataset.boardId;
        if (targetBoardId) {
          state.activeBoardId = targetBoardId;
          saveState();
          switchView('kanban');
          showToast(`Quadro "${getActiveBoard().name}" aberto!`, 'info');
        }
      });
    });
  }

  // --- SMART CALENDAR & GLOBAL TASK AGGREGATOR ---
  let currentCalDate = new Date();
  let selectedCalDate = new Date();

  function getAllGlobalTasks() {
    const globalTasks = [];
    const boards = state.boards || [];
    boards.forEach(b => {
      const bTasks = b.tasks || [];
      const bCols = b.columns || [];
      bTasks.forEach(t => {
        const col = bCols.find(c => c.id === t.columnId);
        globalTasks.push({
          ...t,
          boardId: b.id,
          boardName: b.name,
          columnTitle: col ? col.title : 'Sem Coluna'
        });
      });
    });
    return globalTasks;
  }

  function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  function renderSmartCalendar() {
    const monthTitleEl = document.getElementById('calMonthTitle');
    const daysGridEl = document.getElementById('calDaysGrid');
    if (!monthTitleEl || !daysGridEl) return;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    monthTitleEl.textContent = `${monthNames[month]} ${year}`;

    daysGridEl.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const globalTasks = getAllGlobalTasks();
    const today = new Date();

    // 1. Previous Month Padding Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.textContent = dayNum;
      daysGridEl.appendChild(cell);
    }

    // 2. Current Month Days
    for (let day = 1; day <= totalDaysMonth; day++) {
      const cellDate = new Date(year, month, day);
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';

      const isToday = isSameDay(cellDate, today);
      const isSelected = isSameDay(cellDate, selectedCalDate);

      if (isToday) cell.classList.add('is-today');
      if (isSelected) cell.classList.add('is-selected');

      cell.textContent = day;

      // Filter tasks due on this date across all projects
      const dayTasks = globalTasks.filter(t => t.dueDate && isSameDay(t.dueDate, cellDate));

      if (dayTasks.length > 0) {
        const dotsGroup = document.createElement('div');
        dotsGroup.className = 'cal-dots-group';

        let hasOverdue = false;
        let hasDueToday = false;

        dayTasks.forEach(t => {
          const status = getTaskOverdueStatus(t, t.columnTitle);
          if (status.isOverdue) hasOverdue = true;
          if (isSameDay(t.dueDate, today)) hasDueToday = true;
        });

        if (hasOverdue) {
          const dot = document.createElement('span');
          dot.className = 'cal-dot dot-overdue';
          dot.title = 'Tarefas atrasadas';
          dotsGroup.appendChild(dot);
        }
        if (hasDueToday) {
          const dot = document.createElement('span');
          dot.className = 'cal-dot dot-today';
          dot.title = 'Vence hoje!';
          dotsGroup.appendChild(dot);
        }
        if (!hasOverdue && !hasDueToday) {
          const dot = document.createElement('span');
          dot.className = 'cal-dot dot-normal';
          dot.title = `${dayTasks.length} tarefa(s) agendada(s)`;
          dotsGroup.appendChild(dot);
        }

        cell.appendChild(dotsGroup);
      }

      cell.addEventListener('click', () => {
        selectedCalDate = cellDate;
        renderSmartCalendar();
      });

      daysGridEl.appendChild(cell);
    }

    renderSelectedDayTasks();
  }

  function renderSelectedDayTasks() {
    const titleEl = document.getElementById('selectedDayTitle');
    const badgeEl = document.getElementById('selectedDayCountBadge');
    const containerEl = document.getElementById('selectedDayTasksList');
    if (!titleEl || !badgeEl || !containerEl) return;

    const today = new Date();
    const isSelectedToday = isSameDay(selectedCalDate, today);

    const formattedDate = selectedCalDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    titleEl.textContent = isSelectedToday ? `📅 Entregas de Hoje (${formattedDate})` : `📅 Entregas do Dia (${formattedDate})`;

    const globalTasks = getAllGlobalTasks();
    const dayTasks = globalTasks.filter(t => t.dueDate && isSameDay(t.dueDate, selectedCalDate));

    badgeEl.textContent = `${dayTasks.length} dever${dayTasks.length !== 1 ? 'es' : ''}`;

    containerEl.innerHTML = '';

    if (dayTasks.length === 0) {
      containerEl.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.75rem;">
          ${isSelectedToday ? '🎉 Nenhuma entrega pendente para hoje!' : '📭 Nenhuma tarefa agendada para este dia.'}
        </div>
      `;
      return;
    }

    dayTasks.forEach(t => {
      const overdueStatus = getTaskOverdueStatus(t, t.columnTitle);
      const isDueToday = t.dueDate && isSameDay(t.dueDate, today);

      const card = document.createElement('div');
      card.className = `due-task-card ${isDueToday ? 'is-due-today' : ''}`;
      
      let urgencyBadge = '';
      if (isDueToday && !overdueStatus.isCompleted) {
        urgencyBadge = `<span class="badge-due-today">🔥 VENCE HOJE!</span>`;
      } else if (overdueStatus.isOverdue) {
        urgencyBadge = `<span class="badge-due-today" style="background: #e17055;">⚠️ ${overdueStatus.timeText}</span>`;
      }

      const dueTime = t.dueDate ? new Date(t.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <strong style="font-size: 0.85rem; color: var(--text-primary); flex: 1;">${escapeHTML(t.title)}</strong>
          ${urgencyBadge}
        </div>
        <div class="due-task-meta">
          <span class="due-project-tag">📍 ${escapeHTML(t.boardName)}</span>
          <span style="color: var(--text-muted);">🕒 ${dueTime} • Coluna: ${escapeHTML(t.columnTitle)}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (t.boardId && t.boardId !== state.activeBoardId) {
          state.activeBoardId = t.boardId;
          saveState();
        }
        openTaskModal(t.id);
      });

      containerEl.appendChild(card);
    });
  }

  // --- RENDER DASHBOARD VIEW ---
  function renderDashboardView() {
    const board = getActiveBoard();
    if (!board) return;

    if (elements.currentBoardName) elements.currentBoardName.textContent = board.name;
    if (elements.boardTitleDisplay) elements.boardTitleDisplay.textContent = board.name;

    // Render Meus Projetos Cards Grid
    renderProjectsGrid();

    const tasks = board.tasks || [];
    const columns = board.columns || [];
    const totalCount = tasks.length;

    const doneColIds = columns.filter(c => {
      const title = (c.title || '').toLowerCase().trim();
      return title === 'done' || title === 'concluído' || title === 'concluida';
    }).map(c => c.id);

    const doingColIds = columns.filter(c => {
      const title = (c.title || '').toLowerCase().trim();
      return title === 'doing' || title === 'em andamento' || title === 'fazendo';
    }).map(c => c.id);

    const completedCount = tasks.filter(t => doneColIds.includes(t.columnId)).length;
    const doingCount = tasks.filter(t => doingColIds.includes(t.columnId)).length;

    let overdueCount = 0;
    let criticalTasks = [];

    tasks.forEach(t => {
      const col = columns.find(c => c.id === t.columnId);
      const status = getTaskOverdueStatus(t, col ? col.title : '');
      if (status.isOverdue) {
        overdueCount++;
        criticalTasks.push({ task: t, colName: col ? col.title : '', status });
      } else if (status.isDueSoon) {
        criticalTasks.push({ task: t, colName: col ? col.title : '', status });
      }
    });

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Render Subheader Stat Pills
    if (elements.totalTasksStat) elements.totalTasksStat.querySelector('.stat-value').textContent = `${totalCount} tarefa${totalCount !== 1 ? 's' : ''}`;
    if (elements.overdueTasksStat) elements.overdueTasksStat.querySelector('.stat-value').textContent = `${overdueCount} atrasada${overdueCount !== 1 ? 's' : ''}`;
    if (elements.completedTasksStat) elements.completedTasksStat.querySelector('.stat-value').textContent = `${completionRate}% concluídas`;

    // Render Featured Metrics & Progress Fill
    const completionPctEl = document.getElementById('dashCompletionRatePct');
    if (completionPctEl) completionPctEl.textContent = `${completionRate}%`;

    const completedVsTotalEl = document.getElementById('dashCompletedVsTotal');
    if (completedVsTotalEl) completedVsTotalEl.textContent = `${completedCount} de ${totalCount} tarefas entregues`;

    const progressFillEl = document.getElementById('dashProgressBarFill');
    if (progressFillEl) progressFillEl.style.width = `${completionRate}%`;

    // Render Overdue & Due Soon Counters
    const overdueDisplay = document.getElementById('overdueCountDisplay');
    if (overdueDisplay) overdueDisplay.textContent = `${overdueCount} Atrasada${overdueCount !== 1 ? 's' : ''}`;

    const dueSoonCount = criticalTasks.filter(item => item.status.isDueSoon).length;
    const dueSoonDisplay = document.getElementById('dueSoonCountDisplay');
    if (dueSoonDisplay) dueSoonDisplay.textContent = `${dueSoonCount} a Vencer`;

    // Render Hexbin Chart Matrix & Smart Calendar Widget
    renderHexbinMatrix();
    renderSmartCalendar();

    // Render Columns Progress Bars
    if (elements.dashColumnsList) {
      elements.dashColumnsList.innerHTML = '';
      if (columns.length === 0) {
        elements.dashColumnsList.innerHTML = `<div class="dash-empty-state">Nenhuma coluna encontrada.</div>`;
      } else {
        columns.forEach(col => {
          const count = tasks.filter(t => t.columnId === col.id).length;
          const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

          const barEl = document.createElement('div');
          barEl.className = 'dash-bar-item';
          barEl.innerHTML = `
            <div class="dash-bar-meta">
              <span class="dash-bar-name">
                <span class="dash-bar-dot" style="background-color: ${col.color || '#6c5ce7'};"></span>
                ${escapeHTML(col.title)}
              </span>
              <span class="dash-bar-count">${count} (${pct}%)</span>
            </div>
            <div class="dash-progress-track">
              <div class="dash-progress-fill" style="width: ${pct}%; background-color: ${col.color || '#6c5ce7'};"></div>
            </div>
          `;
          elements.dashColumnsList.appendChild(barEl);
        });
      }
    }

    // Render Recent Activities & Tasks Table
    const tableBody = document.getElementById('qHistoryTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      if (tasks.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding: 1.5rem;">Nenhuma tarefa cadastrada neste quadro.</td></tr>`;
      } else {
        tasks.slice(0, 6).forEach((t, idx) => {
          const col = columns.find(c => c.id === t.columnId);
          const isDone = doneColIds.includes(t.columnId);
          const dateCreated = t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '29 Jul, 2026';
          const dueDateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sem prazo';

          const priorityLabels = { urgent: '🔴 Urgente', high: '🟠 Alta', medium: '🟡 Média', low: '🟢 Baixa' };
          const icons = ['📋', '⚡', '📊', '🛠️', '📱', '✨'];
          const iconColors = ['icon-pink', 'icon-orange', 'icon-yellow'];

          const row = document.createElement('tr');
          row.innerHTML = `
            <td>
              <div class="table-item-name">
                <span class="item-icon-circle ${iconColors[idx % 3]}">${icons[idx % icons.length]}</span>
                <span>${escapeHTML(t.title)}</span>
              </div>
            </td>
            <td>${dateCreated}</td>
            <td>${dueDateStr}</td>
            <td><span class="status-dot" style="background-color: ${isDone ? '#10b981' : (col ? col.color || '#f59e0b' : '#f59e0b')};"></span> ${col ? escapeHTML(col.title) : (isDone ? 'Concluída' : 'Em Andamento')}</td>
            <td class="amount-val">${priorityLabels[t.priority] || t.priority}</td>
          `;
          tableBody.appendChild(row);
        });
      }
    }
  }

  // --- RENDER KANBAN VIEW ---
  function renderKanbanView() {
    const board = getActiveBoard();
    if (!board) return;

    if (currentView === 'dashboard') {
      renderDashboardView();
      return;
    }

    elements.currentBoardName.textContent = board.name;
    elements.boardTitleDisplay.textContent = board.name;

    let boardTasks = board.tasks || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      boardTasks = boardTasks.filter(t => 
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }
    if (priorityFilter !== 'all') {
      boardTasks = boardTasks.filter(t => t.priority === priorityFilter);
    }

    const totalCount = board.tasks.length;
    const doneColIds = board.columns.filter(c => {
      const title = c.title.toLowerCase().trim();
      return title === 'done' || title === 'concluído' || title === 'concluida';
    }).map(c => c.id);

    const completedCount = board.tasks.filter(t => doneColIds.includes(t.columnId)).length;
    const overdueCount = board.tasks.filter(t => {
      const col = board.columns.find(c => c.id === t.columnId);
      const status = getTaskOverdueStatus(t, col ? col.title : '');
      return status.isOverdue;
    }).length;

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (elements.totalTasksStat) {
      const valEl = elements.totalTasksStat.querySelector('.stat-value');
      if (valEl) valEl.textContent = `${totalCount} tarefa${totalCount !== 1 ? 's' : ''}`;
    }
    if (elements.overdueTasksStat) {
      const valEl = elements.overdueTasksStat.querySelector('.stat-value');
      if (valEl) valEl.textContent = `${overdueCount} atrasada${overdueCount !== 1 ? 's' : ''}`;
    }
    if (elements.completedTasksStat) {
      const valEl = elements.completedTasksStat.querySelector('.stat-value');
      if (valEl) valEl.textContent = `${completionRate}% concluídas`;
    }

    if (elements.kanbanCanvas) {
      elements.kanbanCanvas.innerHTML = '';

      board.columns.forEach(col => {
        const colTasks = boardTasks.filter(t => t.columnId === col.id);

        const colEl = document.createElement('div');
        colEl.className = 'kanban-column';
        colEl.dataset.columnId = col.id;

        colEl.innerHTML = `
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-color-indicator" style="background-color: ${col.color || '#6c5ce7'};"></span>
              <h2 class="column-title">${escapeHTML(col.title)}</h2>
              <span class="column-badge">${colTasks.length}</span>
            </div>
            <div class="column-actions">
              <button type="button" class="icon-btn-sm edit-column-btn" data-id="${col.id}" title="Editar Coluna">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button type="button" class="icon-btn-sm delete-column-btn" data-id="${col.id}" title="Excluir Coluna">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <div class="column-cards" data-column-id="${col.id}">
            ${colTasks.length === 0 ? `
              <div class="column-empty-state">
                <span>📭 Nenhuma tarefa aqui</span>
              </div>
            ` : ''}
          </div>
          <button type="button" class="add-task-inline-btn" data-column-id="${col.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Adicionar Tarefa
          </button>
        `;

        const cardsContainer = colEl.querySelector('.column-cards');

        colTasks.forEach(task => {
          const cardEl = renderTaskCard(task, col.title);
          cardsContainer.appendChild(cardEl);
        });

        setupColumnDragAndDrop(colEl, col.id);
        elements.kanbanCanvas.appendChild(colEl);
      });
    }
  }

  // --- RENDER SINGLE TASK CARD ---
  function renderTaskCard(task, columnTitle) {
    const overdueStatus = getTaskOverdueStatus(task, columnTitle);
    
    const card = document.createElement('div');
    card.className = 'task-card';
    if (overdueStatus.isOverdue) card.classList.add('is-overdue');
    if (overdueStatus.isCompleted) card.classList.add('is-done');
    card.draggable = true;
    card.dataset.taskId = task.id;

    const priorityLabels = {
      urgent: '🔴 Urgente',
      high: '🟠 Alta',
      medium: '🟡 Média',
      low: '🟢 Baixa'
    };

    const createdStr = new Date(task.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    let dueStr = '';
    if (task.dueDate) {
      dueStr = new Date(task.dueDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }

    let tagsHtml = '';
    if (task.tags && task.tags.length > 0) {
      tagsHtml = `<div class="task-tags">${task.tags.map(t => `<span class="tag-pill">#${escapeHTML(t)}</span>`).join('')}</div>`;
    }

    let statusBadgeHtml = '';
    if (overdueStatus.isOverdue) {
      statusBadgeHtml = `<span class="overdue-badge">⚠️ ${overdueStatus.timeText}</span>`;
    } else if (overdueStatus.isDueSoon) {
      statusBadgeHtml = `<span class="due-soon-badge">⏳ ${overdueStatus.timeText}</span>`;
    } else if (overdueStatus.isCompleted) {
      statusBadgeHtml = `<span class="completed-badge">✓ Concluída</span>`;
    }

    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-priority-badge priority-${task.priority}">${priorityLabels[task.priority] || task.priority}</span>
        <div class="task-card-actions">
          <button type="button" class="icon-btn-sm edit-task-btn" data-id="${task.id}" title="Editar Tarefa">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button type="button" class="icon-btn-sm delete-task-btn" data-id="${task.id}" title="Excluir Tarefa">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <h3 class="task-title">${escapeHTML(task.title)}</h3>
      ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
      ${tagsHtml}
      <div class="task-footer">
        <div class="task-date-info" title="Criada em: ${createdStr}${dueStr ? ' | Prazo: ' + dueStr : ''}">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${dueStr ? dueStr : createdStr}</span>
        </div>
        ${statusBadgeHtml}
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      draggedTaskId = task.id;
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      draggedTaskId = null;
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    });

    return card;
  }

  // --- DRAG AND DROP ---
  function setupColumnDragAndDrop(columnEl, columnId) {
    columnEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      columnEl.classList.add('drag-over');
    });

    columnEl.addEventListener('dragleave', (e) => {
      const rect = columnEl.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX >= rect.right || e.clientY < rect.top || e.clientY >= rect.bottom) {
        columnEl.classList.remove('drag-over');
      }
    });

    columnEl.addEventListener('drop', (e) => {
      e.preventDefault();
      columnEl.classList.remove('drag-over');

      const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
      if (!taskId) return;

      const board = getActiveBoard();
      const task = board.tasks.find(t => t.id === taskId);

      if (task && task.columnId !== columnId) {
        const targetCol = board.columns.find(c => c.id === columnId);
        task.columnId = columnId;
        saveState();
        renderKanbanView();
        showToast(`Tarefa movida para "${targetCol ? targetCol.title : 'coluna'}"!`, 'info');
      }
    });
  }

  // --- BOARD SELECTOR DROPDOWN ---
  function renderBoardSelectOptions() {
    elements.boardSelectOptions.innerHTML = '';

    state.boards.forEach(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `option-btn ${b.id === state.activeBoardId ? 'active' : ''}`;
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        <span>${escapeHTML(b.name)}</span>
      `;
      btn.addEventListener('click', () => {
        state.activeBoardId = b.id;
        saveState();
        renderBoardSelectOptions();
        renderKanbanView();
        elements.boardSelectDropdown.classList.remove('active');
        showToast(`Quadro "${b.name}" selecionado.`, 'info');
      });
      elements.boardSelectOptions.appendChild(btn);
    });

    const div = document.createElement('div');
    div.className = 'options-divider';
    elements.boardSelectOptions.appendChild(div);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'option-btn add-board-opt';
    addBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      Criar Novo Quadro
    `;
    addBtn.addEventListener('click', () => {
      elements.boardSelectDropdown.classList.remove('active');
      openBoardModal();
    });
    elements.boardSelectOptions.appendChild(addBtn);
  }

  // --- EMOJI PICKER POPULATOR & LOGIC ---
  function renderEmojiGrid(category, filterText = '') {
    elements.emojiGrid.innerHTML = '';
    let emojis = EMOJI_DATABASE[category] || EMOJI_DATABASE.smileys;

    if (filterText.trim()) {
      emojis = Object.values(EMOJI_DATABASE).flat();
    }

    emojis.forEach(emoji => {
      const item = document.createElement('span');
      item.className = 'emoji-item';
      item.textContent = emoji;
      item.addEventListener('click', () => {
        insertEmojiIntoDesc(emoji);
      });
      elements.emojiGrid.appendChild(item);
    });
  }

  function insertEmojiIntoDesc(emoji) {
    const textarea = elements.taskDescInput;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + emoji + text.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.focus();
  }

  // --- MODAL HELPERS (BULLETPROOF RESOLVER & FALLBACK) ---
  function resolveModal(modalOrId) {
    if (!modalOrId) return document.querySelector('.modal-backdrop:not(.hidden)') || document.getElementById('taskModal');
    if (typeof modalOrId === 'string') return document.getElementById(modalOrId) || document.querySelector(`.${modalOrId}`);
    if (modalOrId instanceof HTMLElement) return modalOrId;
    return document.getElementById('taskModal');
  }

  function openModal(modalOrId) {
    const modalEl = resolveModal(modalOrId);
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';
  }

  function closeModal(modalOrId) {
    const modalEl = resolveModal(modalOrId);
    if (modalEl) {
      modalEl.classList.add('hidden');
      modalEl.style.display = 'none';
    }

    // Force closing ALL open modal backdrops as a bulletproof fallback
    document.querySelectorAll('.modal-backdrop').forEach(mb => {
      mb.classList.add('hidden');
      mb.style.display = 'none';
    });
  }

  function openTaskModal(taskId = null, defaultColumnId = null) {
    const board = getActiveBoard();
    
    elements.taskColumnSelect.innerHTML = '';
    board.columns.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      elements.taskColumnSelect.appendChild(opt);
    });

    if (taskId) {
      const task = board.tasks.find(t => t.id === taskId);
      if (task) {
        elements.taskModalTitle.textContent = 'Editar Tarefa';
        elements.taskIdInput.value = task.id;
        elements.taskTitleInput.value = task.title;
        elements.taskColumnSelect.value = task.columnId;
        elements.taskPrioritySelect.value = task.priority;
        elements.taskDueDateInput.value = task.dueDate ? task.dueDate.substring(0, 16) : '';
        elements.taskTagsInput.value = task.tags ? task.tags.join(', ') : '';
        elements.taskDescInput.value = task.description || '';
      }
    } else {
      elements.taskModalTitle.textContent = 'Nova Tarefa';
      elements.taskForm.reset();
      elements.taskIdInput.value = '';
      if (defaultColumnId) {
        elements.taskColumnSelect.value = defaultColumnId;
      }
    }

    elements.emojiPopover.classList.add('hidden');
    openModal(elements.taskModal);
    elements.taskTitleInput.focus();
  }

  function saveTask(e) {
    e.preventDefault();
    const board = getActiveBoard();
    const taskId = elements.taskIdInput.value;
    const title = elements.taskTitleInput.value.trim();
    const columnId = elements.taskColumnSelect.value;
    const priority = elements.taskPrioritySelect.value;
    const dueDateVal = elements.taskDueDateInput.value;
    const tagsRaw = elements.taskTagsInput.value.trim();
    const description = elements.taskDescInput.value.trim();

    if (!title) return;

    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const dueDate = dueDateVal ? new Date(dueDateVal).toISOString() : null;

    if (taskId) {
      const task = board.tasks.find(t => t.id === taskId);
      if (task) {
        task.title = title;
        task.columnId = columnId;
        task.priority = priority;
        task.dueDate = dueDate;
        task.tags = tags;
        task.description = description;
        showToast('Tarefa atualizada e salva!', 'success');
      }
    } else {
      const newTask = {
        id: 'task-' + Date.now(),
        columnId,
        title,
        description,
        priority,
        createdAt: new Date().toISOString(),
        dueDate,
        tags
      };
      board.tasks.push(newTask);
      showToast('Nova tarefa criada e salva!', 'success');
    }

    saveState();
    closeModal(elements.taskModal);
    renderKanbanView();
  }

  function deleteTask(taskId) {
    openConfirmModal('Excluir Tarefa', 'Tem certeza que deseja excluir esta tarefa permanentemente?', () => {
      const board = getActiveBoard();
      board.tasks = board.tasks.filter(t => t.id !== taskId);
      saveState();
      renderKanbanView();
      showToast('Tarefa excluída.', 'warning');
    });
  }

  function openBoardModal(boardId = null) {
    if (boardId) {
      const board = state.boards.find(b => b.id === boardId);
      elements.boardModalTitle.textContent = 'Editar Quadro';
      elements.boardIdInput.value = board.id;
      elements.boardNameInput.value = board.name;
    } else {
      elements.boardModalTitle.textContent = 'Novo Quadro';
      elements.boardForm.reset();
      elements.boardIdInput.value = '';
    }
    openModal(elements.boardModal);
  }

  function saveBoard(e) {
    e.preventDefault();
    const boardId = elements.boardIdInput.value;
    const name = elements.boardNameInput.value.trim();
    if (!name) return;

    if (boardId) {
      const board = state.boards.find(b => b.id === boardId);
      if (board) board.name = name;
    } else {
      const newBoardId = 'board-' + Date.now();
      const newBoard = {
        id: newBoardId,
        name,
        columns: [
          { id: 'col-todo-' + Date.now(), title: 'To Do', color: '#6c5ce7' },
          { id: 'col-doing-' + Date.now(), title: 'Doing', color: '#fdcb6e' },
          { id: 'col-done-' + Date.now(), title: 'Done', color: '#00b894' }
        ],
        tasks: []
      };
      state.boards.push(newBoard);
      state.activeBoardId = newBoardId;
    }

    saveState();
    closeModal(elements.boardModal);
    renderBoardSelectOptions();
    renderKanbanView();
    showToast('Quadro salvo com sucesso!', 'success');
  }

  function deleteCurrentBoard() {
    if (state.boards.length <= 1) {
      showToast('Você precisa manter pelo menos um quadro ativo!', 'warning');
      return;
    }

    const board = getActiveBoard();
    openConfirmModal('Excluir Quadro', `Excluir o quadro "${board.name}" e todas as suas tarefas?`, () => {
      state.boards = state.boards.filter(b => b.id !== board.id);
      state.activeBoardId = state.boards[0].id;
      saveState();
      renderBoardSelectOptions();
      renderKanbanView();
      showToast('Quadro excluído.', 'warning');
    });
  }

  function openColumnModal(columnId = null) {
    const board = getActiveBoard();

    if (columnId) {
      const col = board.columns.find(c => c.id === columnId);
      elements.columnModalTitle.textContent = 'Editar Coluna';
      elements.columnIdInput.value = col.id;
      elements.columnNameInput.value = col.title;
      elements.columnColorInput.value = col.color || '#6c5ce7';
      elements.columnColorPreview.textContent = col.color || '#6c5ce7';
    } else {
      elements.columnModalTitle.textContent = 'Nova Coluna';
      elements.columnForm.reset();
      elements.columnIdInput.value = '';
      elements.columnColorInput.value = '#6c5ce7';
      elements.columnColorPreview.textContent = '#6c5ce7';
    }
    openModal(elements.columnModal);
  }

  function saveColumn(e) {
    e.preventDefault();
    const board = getActiveBoard();
    const colId = elements.columnIdInput.value;
    const title = elements.columnNameInput.value.trim();
    const color = elements.columnColorInput.value;

    if (!title) return;

    if (colId) {
      const col = board.columns.find(c => c.id === colId);
      if (col) {
        col.title = title;
        col.color = color;
      }
    } else {
      const newCol = {
        id: 'col-' + Date.now(),
        title,
        color
      };
      board.columns.push(newCol);
    }

    saveState();
    closeModal(elements.columnModal);
    renderKanbanView();
    showToast('Coluna salva!', 'success');
  }

  function deleteColumn(columnId) {
    const board = getActiveBoard();
    const col = board.columns.find(c => c.id === columnId);
    
    openConfirmModal('Excluir Coluna', `Excluir a coluna "${col.title}"? Todas as tarefas nela serão removidas.`, () => {
      board.columns = board.columns.filter(c => c.id !== columnId);
      board.tasks = board.tasks.filter(t => t.columnId !== columnId);
      saveState();
      renderKanbanView();
      showToast('Coluna excluída.', 'warning');
    });
  }

  function openConfirmModal(title, text, onConfirm) {
    elements.confirmModalTitle.textContent = title;
    elements.confirmModalText.textContent = text;
    confirmCallback = onConfirm;
    openModal(elements.confirmModal);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHTML(message)}</span>`;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- REPORT GENERATOR ---
  function exportBoardReport() {
    const board = getActiveBoard();
    if (!board) return;

    const tasks = board.tasks || [];
    const columns = board.columns || [];
    const nowStr = new Date().toLocaleString('pt-BR');

    let report = `====================================================\n`;
    report += `RELATÓRIO DE DESEMPENHO E FLUXO KANBAN\n`;
    report += `Quadro: ${board.name}\n`;
    report += `Data de Geração: ${nowStr}\n`;
    report += `====================================================\n\n`;

    report += `1. RESUMO DE MÉTRICAS:\n`;
    report += `- Total de Tarefas: ${tasks.length}\n`;
    report += `- Total de Colunas: ${columns.length}\n\n`;

    report += `2. DISTRIBUIÇÃO POR COLUNA:\n`;
    columns.forEach(col => {
      const count = tasks.filter(t => t.columnId === col.id).length;
      report += `- ${col.title}: ${count} tarefa(s)\n`;
    });

    report += `\n3. LISTA DE TAREFAS DETALHADA:\n`;
    if (tasks.length === 0) {
      report += `Nenhuma tarefa cadastrada.\n`;
    } else {
      tasks.forEach((t, i) => {
        const col = columns.find(c => c.id === t.columnId);
        const dueStr = t.dueDate ? new Date(t.dueDate).toLocaleString('pt-BR') : 'Sem prazo';
        report += `${i + 1}. [${col ? col.title : 'Sem Coluna'}] ${t.title} | Prioridade: ${t.priority || 'Média'} | Prazo: ${dueStr}\n`;
      });
    }

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-kanban-${board.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📄 Relatório exportado com sucesso!', 'success');
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // View Switcher Buttons
    if (elements.kanbanViewBtn) {
      elements.kanbanViewBtn.addEventListener('click', () => switchView('kanban'));
    }
    if (elements.dashboardViewBtn) {
      elements.dashboardViewBtn.addEventListener('click', () => switchView('dashboard'));
    }

    const navDashboardBtn = document.getElementById('navDashboardBtn');
    if (navDashboardBtn) navDashboardBtn.addEventListener('click', () => switchView('dashboard'));

    const navKanbanBtn = document.getElementById('navKanbanBtn');
    if (navKanbanBtn) navKanbanBtn.addEventListener('click', () => switchView('kanban'));

    const sideNavDashBtn = document.getElementById('sideNavDashBtn');
    if (sideNavDashBtn) sideNavDashBtn.addEventListener('click', () => switchView('dashboard'));

    const sideNavKanbanBtn = document.getElementById('sideNavKanbanBtn');
    if (sideNavKanbanBtn) sideNavKanbanBtn.addEventListener('click', () => switchView('kanban'));

    const sideNavGridBtn = document.getElementById('sideNavGridBtn');
    if (sideNavGridBtn) sideNavGridBtn.addEventListener('click', () => switchView('kanban'));

    const sideNavTasksBtn = document.getElementById('sideNavTasksBtn');
    if (sideNavTasksBtn) sideNavTasksBtn.addEventListener('click', () => openTaskModal());

    const sideNavFilesBtn = document.getElementById('sideNavFilesBtn');
    if (sideNavFilesBtn) sideNavFilesBtn.addEventListener('click', () => openModal(elements.exportModal));

    const sideNavHistoryBtn = document.getElementById('sideNavHistoryBtn');
    if (sideNavHistoryBtn) sideNavHistoryBtn.addEventListener('click', () => switchView('dashboard'));

    const navReportsBtn = document.getElementById('navReportsBtn');
    if (navReportsBtn) navReportsBtn.addEventListener('click', () => exportBoardReport());

    const navHistoryBtn = document.getElementById('navHistoryBtn');
    if (navHistoryBtn) navHistoryBtn.addEventListener('click', () => switchView('dashboard'));

    const headerNotifBtn = document.getElementById('headerNotifBtn');
    if (headerNotifBtn) {
      headerNotifBtn.addEventListener('click', () => {
        const board = getActiveBoard();
        const tasks = board.tasks || [];
        const columns = board.columns || [];
        let overdueCount = 0;

        tasks.forEach(t => {
          const col = columns.find(c => c.id === t.columnId);
          const status = getTaskOverdueStatus(t, col ? col.title : '');
          if (status.isOverdue || status.isDueSoon) overdueCount++;
        });

        if (overdueCount > 0) {
          showToast(`🔔 Alerta: Você tem ${overdueCount} tarefa(s) com atenção necessária!`, 'warning');
        } else {
          showToast(`🔔 Nenhuma notificação crítica no momento. Tudo em dia!`, 'info');
        }
      });
    }

    const userAvatarBtn = document.getElementById('userAvatarBtn');
    if (userAvatarBtn) {
      userAvatarBtn.addEventListener('click', () => {
        const currentName = document.getElementById('welcomeUserName')?.textContent || 'Dev';
        const newName = prompt('Digite seu nome de usuário:', currentName);
        if (newName && newName.trim()) {
          const trimmed = newName.trim();
          const userNameEl = document.getElementById('welcomeUserName');
          const userAvatarImg = document.getElementById('userAvatarImg');
          if (userNameEl) userNameEl.textContent = trimmed;
          if (userAvatarImg) userAvatarImg.textContent = trimmed.charAt(0).toUpperCase();
          showToast(`Nome de usuário alterado para "${trimmed}"!`, 'success');
        }
      });
    }

    const dateFilterBtn = document.getElementById('dateFilterBtn');
    if (dateFilterBtn) {
      let currentFilterState = 0;
      const filterOptions = ['Todas as datas', 'Somente Atrasadas', 'Vencem Hoje'];
      dateFilterBtn.addEventListener('click', () => {
        currentFilterState = (currentFilterState + 1) % filterOptions.length;
        const selectedText = filterOptions[currentFilterState];
        const labelEl = document.getElementById('dateFilterText');
        if (labelEl) labelEl.textContent = selectedText;

        if (currentFilterState === 1) {
          priorityFilter = 'all';
          showToast('Filtro aplicado: Exibindo métricas de tarefas atrasadas', 'warning');
        } else if (currentFilterState === 2) {
          showToast('Filtro aplicado: Exibindo tarefas a vencer hoje', 'info');
        } else {
          showToast('Filtro removido: Exibindo todas as datas', 'info');
        }
        renderKanbanView();
        renderDashboardView();
      });
    }

    const dashOpenNewTaskBtn = document.getElementById('dashOpenNewTaskBtn');
    if (dashOpenNewTaskBtn) dashOpenNewTaskBtn.addEventListener('click', () => openTaskModal());

    const dashGoToKanbanBtn = document.getElementById('dashGoToKanbanBtn');
    if (dashGoToKanbanBtn) dashGoToKanbanBtn.addEventListener('click', () => switchView('kanban'));

    const dashCreateProjectBtn = document.getElementById('dashCreateProjectBtn');
    if (dashCreateProjectBtn) {
      dashCreateProjectBtn.addEventListener('click', () => {
        if (elements.boardModal) openModal(elements.boardModal);
      });
    }

    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', () => {
      renderDashboardView();
      showToast('Dados atualizados com sucesso!', 'success');
    });

    // --- DEFENSIVE EVENT LISTENERS ---
    if (elements.darkModePill) elements.darkModePill.addEventListener('click', () => setQuickMode(false));
    if (elements.lightModePill) elements.lightModePill.addEventListener('click', () => setQuickMode(true));

    if (elements.currentBoardBtn) {
      elements.currentBoardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.boardSelectDropdown) elements.boardSelectDropdown.classList.toggle('active');
      });
    }

    document.addEventListener('click', () => {
      if (elements.boardSelectDropdown) elements.boardSelectDropdown.classList.remove('active');
    });

    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (elements.clearSearchBtn) elements.clearSearchBtn.classList.toggle('hidden', !searchQuery);
        renderKanbanView();
      });
    }

    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.addEventListener('click', () => {
        if (elements.searchInput) elements.searchInput.value = '';
        searchQuery = '';
        elements.clearSearchBtn.classList.add('hidden');
        renderKanbanView();
      });
    }

    if (elements.priorityFilterSelect) {
      elements.priorityFilterSelect.addEventListener('change', (e) => {
        priorityFilter = e.target.value;
        renderKanbanView();
      });
    }

    // --- SMART CALENDAR NAVIGATION LISTENERS ---
    const calPrevBtn = document.getElementById('calPrevMonthBtn');
    if (calPrevBtn) {
      calPrevBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() - 1);
        renderSmartCalendar();
      });
    }

    const calNextBtn = document.getElementById('calNextMonthBtn');
    if (calNextBtn) {
      calNextBtn.addEventListener('click', () => {
        currentCalDate.setMonth(currentCalDate.getMonth() + 1);
        renderSmartCalendar();
      });
    }

    const calTodayBadge = document.getElementById('calTodayBadge');
    if (calTodayBadge) {
      calTodayBadge.addEventListener('click', () => {
        currentCalDate = new Date();
        selectedCalDate = new Date();
        renderSmartCalendar();
      });
    }

    const dashNewProjBtn = document.getElementById('dashNewProjectBtn');
    if (dashNewProjBtn) {
      dashNewProjBtn.addEventListener('click', () => openBoardModal());
    }

    // --- DASHBOARD TOP VIEW SWITCHER TABS ---
    const tabBoth = document.getElementById('tabShowBothBtn');
    const tabHeatmap = document.getElementById('tabShowHeatmapBtn');
    const tabCalendar = document.getElementById('tabShowCalendarBtn');
    const splitGrid = document.getElementById('splitTopGrid');

    if (tabBoth && tabHeatmap && tabCalendar && splitGrid) {
      tabBoth.addEventListener('click', () => {
        tabBoth.classList.add('active');
        tabHeatmap.classList.remove('active');
        tabCalendar.classList.remove('active');
        splitGrid.classList.remove('show-heatmap-only', 'show-calendar-only');
      });

      tabHeatmap.addEventListener('click', () => {
        tabHeatmap.classList.add('active');
        tabBoth.classList.remove('active');
        tabCalendar.classList.remove('active');
        splitGrid.classList.add('show-heatmap-only');
        splitGrid.classList.remove('show-calendar-only');
      });

      tabCalendar.addEventListener('click', () => {
        tabCalendar.classList.add('active');
        tabBoth.classList.remove('active');
        tabHeatmap.classList.remove('active');
        splitGrid.classList.add('show-calendar-only');
        splitGrid.classList.remove('show-heatmap-only');
      });
    }

    // --- GLOBAL MODAL CLOSE LISTENERS ---
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-close');
        const modalEl = document.getElementById(targetId) || btn.closest('.modal-backdrop');
        if (modalEl) closeModal(modalEl);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop);
      });
    });

    // TASK FORM SUBMISSION HANDLER (WITH PREVENTDEFAULT TO PREVENT 404)
    if (elements.taskForm) {
      elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const board = getActiveBoard();
        if (!board) return;

        const title = elements.taskTitleInput ? elements.taskTitleInput.value.trim() : '';
        if (!title) {
          showToast('Por favor, informe o título da tarefa!', 'warning');
          return;
        }

        const taskId = elements.taskIdInput ? elements.taskIdInput.value : '';
        const columnId = elements.taskColumnSelect ? elements.taskColumnSelect.value : (board.columns[0]?.id || 'col-todo');
        const priority = elements.taskPrioritySelect ? elements.taskPrioritySelect.value : 'medium';
        const dueDate = elements.taskDueDateInput && elements.taskDueDateInput.value ? new Date(elements.taskDueDateInput.value).toISOString() : '';
        const tagsStr = elements.taskTagsInput ? elements.taskTagsInput.value.trim() : '';
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
        const description = elements.taskDescInput ? elements.taskDescInput.value.trim() : '';

        if (taskId) {
          const task = (board.tasks || []).find(t => t.id === taskId);
          if (task) {
            task.title = title;
            task.columnId = columnId;
            task.priority = priority;
            task.dueDate = dueDate;
            task.tags = tags;
            task.description = description;
            showToast(`✅ Tarefa "${title}" atualizada com sucesso!`, 'success');
          }
        } else {
          const newTask = {
            id: 'task-' + Date.now(),
            columnId,
            title,
            description,
            priority,
            createdAt: new Date().toISOString(),
            dueDate,
            tags
          };
          if (!Array.isArray(board.tasks)) board.tasks = [];
          board.tasks.push(newTask);
          showToast(`🎉 Nova tarefa "${title}" criada com sucesso!`, 'success');
        }

        // CLOSE MODAL IMMEDIATELY BEFORE VIEW RENDERING TO PREVENT STICKY MODALS
        closeModal('taskModal');
        if (elements.taskModal) closeModal(elements.taskModal);

        try {
          saveState();
          renderKanbanView();
          renderDashboardView();
        } catch (err) {
          console.error('Error updating views after task save:', err);
        }
      });
    }

    // Modal Triggers with Fallback GetElementById
    const openTaskBtn = elements.openNewTaskModalBtn || document.getElementById('openNewTaskModalBtn');
    if (openTaskBtn) openTaskBtn.addEventListener('click', () => openTaskModal());

    const openBoardBtn = elements.openNewBoardModalBtn || document.getElementById('openNewBoardModalBtn');
    if (openBoardBtn) openBoardBtn.addEventListener('click', () => openBoardModal());

    if (elements.editBoardBtn) {
      elements.editBoardBtn.addEventListener('click', () => {
        const board = getActiveBoard();
        if (board) openBoardModal(board.id);
      });
    }

    if (elements.deleteBoardBtn) elements.deleteBoardBtn.addEventListener('click', deleteCurrentBoard);

    const openColBtn = elements.openNewColumnModalBtn || document.getElementById('openNewColumnModalBtn');
    if (openColBtn) openColBtn.addEventListener('click', () => openColumnModal());

    const openThemeBtn = elements.openThemeModalBtn || document.getElementById('openThemeModalBtn');
    if (openThemeBtn) openThemeBtn.addEventListener('click', () => openModal(document.getElementById('themeModal')));

    const sideNavThemeBtn = document.getElementById('sideNavThemeBtn');
    if (sideNavThemeBtn) sideNavThemeBtn.addEventListener('click', () => openModal(document.getElementById('themeModal')));

    // --- CUSTOM 3-COLOR GRADIENT THEME CREATOR ---
    const color1Input = document.getElementById('gradientColor1');
    const color2Input = document.getElementById('gradientColor2');
    const color3Input = document.getElementById('gradientColor3');
    const hex1Input = document.getElementById('gradientHex1');
    const hex2Input = document.getElementById('gradientHex2');
    const hex3Input = document.getElementById('gradientHex3');
    const angleInput = document.getElementById('gradientAngle');
    const angleValDisplay = document.getElementById('gradientAngleVal');
    const previewBox = document.getElementById('customThemePreviewCard');
    const previewTitle = document.getElementById('previewThemeTitle');
    const nameInput = document.getElementById('customThemeNameInput');
    const saveThemeBtn = document.getElementById('saveCustomThemeBtn');

    function syncGradientPreview() {
      if (!color1Input || !color2Input || !color3Input || !angleInput || !previewBox) return;

      const c1 = color1Input.value;
      const c2 = color2Input.value;
      const c3 = color3Input.value;
      const angle = angleInput.value;

      if (hex1Input) hex1Input.value = c1;
      if (hex2Input) hex2Input.value = c2;
      if (hex3Input) hex3Input.value = c3;
      if (angleValDisplay) angleValDisplay.textContent = `${angle}°`;

      const gradientStr = `linear-gradient(${angle}deg, ${c1}, ${c2}, ${c3})`;
      previewBox.style.background = gradientStr;

      if (previewTitle) {
        const titleText = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '🌌 Meu Gradiente Customizado';
        previewTitle.textContent = titleText;
      }
    }

    [color1Input, color2Input, color3Input, angleInput, nameInput].forEach(el => {
      if (el) el.addEventListener('input', syncGradientPreview);
    });

    [hex1Input, hex2Input, hex3Input].forEach((hexEl, idx) => {
      if (!hexEl) return;
      const colorEl = [color1Input, color2Input, color3Input][idx];
      hexEl.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (/^#[0-9A-F]{6}$/i.test(val) && colorEl) {
          colorEl.value = val;
          syncGradientPreview();
        }
      });
    });

    syncGradientPreview();

    if (saveThemeBtn) {
      saveThemeBtn.addEventListener('click', () => {
        const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Meu Gradiente ✨';
        const c1 = color1Input ? color1Input.value : '#0f172a';
        const c2 = color2Input ? color2Input.value : '#6c5ce7';
        const c3 = color3Input ? color3Input.value : '#00cec9';
        const angle = angleInput ? parseInt(angleInput.value, 10) : 135;

        const newCustomTheme = {
          id: 'custom-theme-' + Date.now(),
          name,
          colors: [c1, c2, c3],
          angle
        };

        if (!Array.isArray(state.customThemes)) state.customThemes = [];
        state.customThemes.push(newCustomTheme);

        state.theme = {
          type: 'gradient',
          customId: newCustomTheme.id,
          name,
          colors: [c1, c2, c3],
          angle
        };

        applyTheme(state.theme);
        saveState();
        closeModal(document.getElementById('themeModal'));
        showToast(`✨ Tema "${name}" criado e aplicado com sucesso!`, 'success');
      });
    }

    if (elements.kanbanCanvas) {
      elements.kanbanCanvas.addEventListener('click', (e) => {
        const editTaskBtn = e.target.closest('.edit-task-btn');
        if (editTaskBtn) {
          openTaskModal(editTaskBtn.dataset.id);
          return;
        }

        const deleteTaskBtn = e.target.closest('.delete-task-btn');
        if (deleteTaskBtn) {
          deleteTask(deleteTaskBtn.dataset.id);
          return;
        }

        const editColBtn = e.target.closest('.edit-column-btn');
        if (editColBtn) {
          openColumnModal(editColBtn.dataset.id);
          return;
        }

        const deleteColBtn = e.target.closest('.delete-column-btn');
        if (deleteColBtn) {
          deleteColumn(deleteColBtn.dataset.id);
          return;
        }

        const inlineAddTaskBtn = e.target.closest('.add-task-inline-btn');
        if (inlineAddTaskBtn) {
          openTaskModal(null, inlineAddTaskBtn.dataset.columnId);
          return;
        }
      });
    }

    if (elements.confirmModalOkBtn) {
      elements.confirmModalOkBtn.addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        closeModal(elements.confirmModal);
      });
    }

    // Export JSON
    if (elements.exportDataBtn) {
      elements.exportDataBtn.addEventListener('click', () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `kanban_data.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Arquivo kanban_data.json baixado!', 'success');
      });
    }

    // Import JSON
    if (elements.importFileInput) {
      elements.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported && imported.boards && Array.isArray(imported.boards)) {
              state = imported;
              saveState();
              applyTheme(state.theme);
              renderBoardSelectOptions();
              renderKanbanView();
              closeModal(elements.exportModal);
              showToast('Dados do JSON carregados!', 'success');
            } else {
              showToast('Arquivo JSON inválido!', 'warning');
            }
          } catch (err) {
            showToast('Erro ao ler arquivo JSON!', 'warning');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset Data to Default
    if (elements.resetDataBtn) {
      elements.resetDataBtn.addEventListener('click', () => {
        openConfirmModal('Restaurar Dados Padrão', 'Tem certeza que deseja apagar todos os dados locais e restaurar o estado inicial?', () => {
          localStorage.removeItem('kanbanflow_state_v2');
          state = sanitizeState(null);
          saveState();
          applyTheme(state.theme);
          renderBoardSelectOptions();
          renderKanbanView();
          closeModal(elements.exportModal);
          showToast('Dados restaurados para o padrão!', 'info');
        });
      });
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  document.addEventListener('DOMContentLoaded', init);

})();
