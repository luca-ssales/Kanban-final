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

  // --- STATE CONTAINER ---
  let state = loadStateFromLocalStorage() || DEFAULT_STATE;
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

    // Kanban Canvas
    kanbanCanvas: document.getElementById('kanbanCanvas'),

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
    renderEmojiGrid('smileys');

    await loadStateFromServer();

    applyTheme(state.theme);
    renderBoardSelectOptions();
    renderKanbanView();
  }

  // --- JSON SERVER PERSISTENCE ---
  async function loadStateFromServer() {
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const data = await response.json();
        if (data && data.boards && Array.isArray(data.boards)) {
          state = data;
          isServerAvailable = true;
          saveStateToLocalStorage();
          showToast('📄 Conectado a kanban_data.json', 'success');
          return;
        }
      }
    } catch (e) {
      console.warn('Servidor local não detectado, usando salvamento local.', e);
    }
    isServerAvailable = false;
  }

  async function saveState() {
    saveStateToLocalStorage();

    if (isServerAvailable) {
      try {
        await fetch('/api/data', {
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
    let board = state.boards.find(b => b.id === state.activeBoardId);
    if (!board && state.boards.length > 0) {
      state.activeBoardId = state.boards[0].id;
      board = state.boards[0];
    }
    return board;
  }

  // --- THEME & LIGHT/DARK ENGINE ---
  function applyTheme(themeObj) {
    document.body.className = '';
    
    if (themeObj.type === 'preset') {
      document.body.classList.add(themeObj.presetId);
      document.body.style.background = '';
    } else if (themeObj.type === 'custom') {
      document.body.style.background = themeObj.customColor;
    }

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

  // --- RENDER KANBAN VIEW ---
  function renderKanbanView() {
    const board = getActiveBoard();
    if (!board) return;

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

    elements.totalTasksStat.querySelector('.stat-value').textContent = `${totalCount} tarefa${totalCount !== 1 ? 's' : ''}`;
    elements.overdueTasksStat.querySelector('.stat-value').textContent = `${overdueCount} atrasada${overdueCount !== 1 ? 's' : ''}`;
    elements.completedTasksStat.querySelector('.stat-value').textContent = `${completionRate}% concluídas`;

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

  // --- MODAL HELPERS ---
  function openModal(modalEl) {
    modalEl.classList.remove('hidden');
  }

  function closeModal(modalEl) {
    modalEl.classList.add('hidden');
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

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Quick Light / Dark Mode Toggle Pills
    if (elements.darkModePill) {
      elements.darkModePill.addEventListener('click', () => setQuickMode(false));
    }
    if (elements.lightModePill) {
      elements.lightModePill.addEventListener('click', () => setQuickMode(true));
    }

    elements.currentBoardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.boardSelectDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      elements.boardSelectDropdown.classList.remove('active');
    });

    elements.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      elements.clearSearchBtn.classList.toggle('hidden', !searchQuery);
      renderKanbanView();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      searchQuery = '';
      elements.clearSearchBtn.classList.add('hidden');
      renderKanbanView();
    });

    elements.priorityFilterSelect.addEventListener('change', (e) => {
      priorityFilter = e.target.value;
      renderKanbanView();
    });

    elements.openNewTaskModalBtn.addEventListener('click', () => openTaskModal());
    elements.openNewBoardModalBtn.addEventListener('click', () => openBoardModal());
    elements.editBoardBtn.addEventListener('click', () => {
      const board = getActiveBoard();
      openBoardModal(board.id);
    });
    elements.deleteBoardBtn.addEventListener('click', deleteCurrentBoard);
    elements.openNewColumnModalBtn.addEventListener('click', () => openColumnModal());

    elements.openThemeModalBtn.addEventListener('click', () => openModal(elements.themeModal));
    elements.openExportModalBtn.addEventListener('click', () => openModal(elements.exportModal));

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        if (targetId) closeModal(document.getElementById(targetId));
      });
    });

    elements.taskForm.addEventListener('submit', saveTask);
    elements.boardForm.addEventListener('submit', saveBoard);
    elements.columnForm.addEventListener('submit', saveColumn);

    elements.columnColorInput.addEventListener('input', (e) => {
      elements.columnColorPreview.textContent = e.target.value;
    });

    elements.emojiPickerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.emojiPopover.classList.toggle('hidden');
    });

    elements.closeEmojiPopoverBtn.addEventListener('click', () => {
      elements.emojiPopover.classList.add('hidden');
    });

    elements.emojiCategories.querySelectorAll('.emoji-cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        elements.emojiCategories.querySelectorAll('.emoji-cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderEmojiGrid(tab.dataset.cat, elements.emojiSearchInput.value);
      });
    });

    elements.emojiSearchInput.addEventListener('input', (e) => {
      const activeTab = elements.emojiCategories.querySelector('.emoji-cat-tab.active');
      renderEmojiGrid(activeTab ? activeTab.dataset.cat : 'smileys', e.target.value);
    });

    elements.themePresetsGrid.querySelectorAll('.theme-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        elements.themePresetsGrid.querySelectorAll('.theme-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        state.theme = {
          type: 'preset',
          presetId: card.dataset.theme
        };
        applyTheme(state.theme);
        saveState();
        showToast('Tema atualizado!', 'success');
      });
    });

    elements.customBgColorInput.addEventListener('input', (e) => {
      elements.customBgHexInput.value = e.target.value;
    });

    elements.applyCustomBgBtn.addEventListener('click', () => {
      const hex = elements.customBgHexInput.value.trim();
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        state.theme = {
          type: 'custom',
          customColor: hex
        };
        applyTheme(state.theme);
        saveState();
        showToast('Cor de fundo aplicada!', 'success');
      } else {
        showToast('Digite uma cor HEX válida (ex: #6c5ce7)', 'warning');
      }
    });

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

    elements.confirmModalOkBtn.addEventListener('click', () => {
      if (confirmCallback) confirmCallback();
      closeModal(elements.confirmModal);
    });

    // Export JSON
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

    // Import JSON
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

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  document.addEventListener('DOMContentLoaded', init);

})();
