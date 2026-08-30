const body = document.body;
const launcher = document.querySelector('[data-live-launcher]');
const bindingsPanel = document.querySelector('[data-live-bindings]');
const commandInput = document.querySelector('[data-live-command]');
const terminalOutput = document.querySelector('[data-live-terminal-output]');
let currentSpace = '1';

function activeSpace() {
  return document.querySelector(`[data-live-space="${currentSpace}"]`);
}

function spaceWindows(space = activeSpace()) {
  return space ? Array.from(space.querySelectorAll(':scope > .live-window:not([hidden])')) : [];
}

function updateClock() {
  const clock = document.querySelector('[data-live-clock]');
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  clock.dateTime = now.toISOString();
}

function focusWindow(windowElement) {
  if (!windowElement || windowElement.hidden) return;
  spaceWindows().forEach((item) => item.classList.toggle('is-focused', item === windowElement));
  if (windowElement.classList.contains('is-floating')) windowElement.style.zIndex = '9';
  spaceWindows().filter((item) => item !== windowElement && item.classList.contains('is-floating')).forEach((item) => { item.style.zIndex = '8'; });
}

function tileWorkspace(space) {
  if (!space) return;
  const tiled = spaceWindows(space).filter((windowElement) => !windowElement.classList.contains('is-floating') && !windowElement.classList.contains('is-fullscreen'));
  space.classList.toggle('live-space--tiled', tiled.length > 0);
  space.dataset.tileCount = String(Math.min(tiled.length, 4));
  tiled.forEach((windowElement) => {
    windowElement.style.removeProperty('left');
    windowElement.style.removeProperty('top');
    windowElement.style.removeProperty('width');
    windowElement.style.removeProperty('height');
    windowElement.style.removeProperty('z-index');
  });
}

function tileAllWorkspaces() {
  document.querySelectorAll('[data-live-space]').forEach(tileWorkspace);
}

function switchSpace(id) {
  const next = document.querySelector(`[data-live-space="${id}"]`);
  if (!next) return;
  currentSpace = id;
  document.querySelectorAll('[data-live-space]').forEach((space) => {
    const active = space === next;
    space.classList.toggle('is-active', active);
    space.hidden = !active;
  });
  document.querySelectorAll('[data-live-workspace]').forEach((button) => {
    const active = button.dataset.liveWorkspace === id;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', String(active));
  });
  closeLauncher();
  const selected = spaceWindows(next).find((item) => item.classList.contains('is-focused')) || spaceWindows(next)[0];
  if (selected) focusWindow(selected);
}

function openApp(appName) {
  const windowElement = document.querySelector(`[data-live-app="${appName}"]`);
  const space = activeSpace();
  if (!windowElement || !space) return;
  const previousSpace = windowElement.closest('[data-live-space]');
  windowElement.hidden = false;
  windowElement.classList.remove('is-floating', 'is-fullscreen');
  windowElement.removeAttribute('style');
  space.append(windowElement);
  tileWorkspace(previousSpace);
  tileWorkspace(space);
  focusWindow(windowElement);
  closeLauncher();
}


function showMenuView(name) {
  launcher?.querySelectorAll('[data-live-menu-view]').forEach((view) => {
    view.hidden = view.dataset.liveMenuView !== name;
    view.querySelectorAll(':scope > button, :scope > a').forEach((item) => { item.hidden = false; });
  });
  const search = launcher?.querySelector('[data-live-menu-search]');
  if (search) search.value = '';
}

function openLauncher() {
  if (!launcher) return;
  showMenuView('root');
  launcher.hidden = false;
  launcher.querySelector('[data-live-menu-search]')?.focus();
}

function closeLauncher() {
  if (launcher) launcher.hidden = true;
}

function toggleBindings() {
  if (!bindingsPanel) return;
  bindingsPanel.hidden = !bindingsPanel.hidden;
}

function toggleTheme() {
  body.dataset.liveTheme = body.dataset.liveTheme === 'nord' ? '' : 'nord';
  closeLauncher();
}

function focusedWindow() {
  return spaceWindows().find((item) => item.classList.contains('is-focused')) || spaceWindows()[0];
}

function directionalWindow(direction, source = focusedWindow()) {
  const windows = spaceWindows().filter((item) => item !== source);
  if (!source || !windows.length) return null;
  const sourceRect = source.getBoundingClientRect();
  const sx = sourceRect.left + sourceRect.width / 2;
  const sy = sourceRect.top + sourceRect.height / 2;
  const candidates = windows.map((item) => {
    const rect = item.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - sx;
    const dy = rect.top + rect.height / 2 - sy;
    const valid = direction === 'left' ? dx < -1 : direction === 'right' ? dx > 1 : direction === 'up' ? dy < -1 : dy > 1;
    const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
    const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    return { item, valid, score: primary + secondary * 1.8 };
  }).filter((candidate) => candidate.valid).sort((a, b) => a.score - b.score);
  return candidates[0]?.item || null;
}

function focusDirection(direction) {
  const target = directionalWindow(direction);
  if (target) focusWindow(target);
}

function swapDirection(direction) {
  const source = focusedWindow();
  const target = directionalWindow(direction, source);
  if (!source || !target) return;
  const marker = document.createElement('span');
  source.before(marker);
  target.before(source);
  marker.replaceWith(target);
  tileWorkspace(activeSpace());
  focusWindow(source);
}

function toggleSplit() {
  const space = activeSpace();
  if (!space) return;
  space.classList.toggle('is-split-vertical');
  tileWorkspace(space);
}

function toggleFloating() {
  const windowElement = focusedWindow();
  const space = activeSpace();
  if (!windowElement || !space) return;
  if (windowElement.classList.contains('is-fullscreen')) windowElement.classList.remove('is-fullscreen');
  if (windowElement.classList.contains('is-floating')) {
    windowElement.classList.remove('is-floating');
    windowElement.removeAttribute('style');
  } else {
    const rect = windowElement.getBoundingClientRect();
    windowElement.classList.add('is-floating');
    windowElement.style.left = `${Math.max(10, rect.left)}px`;
    windowElement.style.top = `${Math.max(10, rect.top - 30)}px`;
    windowElement.style.width = `${Math.min(820, rect.width)}px`;
    windowElement.style.height = `${Math.min(520, rect.height)}px`;
  }
  tileWorkspace(space);
  focusWindow(windowElement);
}

function toggleFullscreen() {
  const windowElement = focusedWindow();
  if (!windowElement) return;
  windowElement.classList.toggle('is-fullscreen');
  focusWindow(windowElement);
}

function addTerminalLine(value, className = '') {
  if (!terminalOutput) return null;
  const line = document.createElement('p');
  if (className) line.className = className;
  line.textContent = value;
  terminalOutput.append(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
  return line;
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  addTerminalLine(`omarchy@quattro:~$ ${command}`, 'live-command');
  if (!command) return;
  const [name, argument] = command.toLowerCase().split(/\s+/, 2);
  if (name === 'help') return void addTerminalLine('Commands: about, clear, date, help, manual, theme, workspace 1-5');
  if (name === 'about') return void addTerminalLine('Omarchy Quattro 4.0.1');
  if (name === 'clear') return void terminalOutput.replaceChildren();
  if (name === 'date') return void addTerminalLine(new Date().toString());
  if (name === 'theme') {
    toggleTheme();
    addTerminalLine(`Theme: ${body.dataset.liveTheme === 'nord' ? 'Nord' : 'Tokyo Night'}`);
    return;
  }
  if (name === 'manual') {
    const line = addTerminalLine('');
    const link = document.createElement('a');
    link.href = 'https://omarchy.org/manual/';
    link.textContent = 'Open the Omarchy Manual';
    line.append(link);
    return;
  }
  if (name === 'workspace' && /^[1-5]$/.test(argument || '')) return void switchSpace(argument);
  addTerminalLine(`${name}: command not found`, 'live-error');
}

function initWindows() {
  document.querySelectorAll('[data-live-window]').forEach((windowElement) => {
    windowElement.addEventListener('pointerdown', () => focusWindow(windowElement));
    const handle = windowElement.querySelector('[data-live-drag-handle]');
    if (!handle) return;
    handle.addEventListener('pointerdown', (event) => {
      if (event.target.closest('a, button') || !windowElement.classList.contains('is-floating')) return;
      const rect = windowElement.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = rect.left;
      const startTop = rect.top - 30;
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const x = Math.min(window.innerWidth - rect.width, Math.max(0, startLeft + moveEvent.clientX - startX));
        const y = Math.min(window.innerHeight - rect.height - 30, Math.max(0, startTop + moveEvent.clientY - startY));
        windowElement.style.left = `${x}px`;
        windowElement.style.top = `${y}px`;
      };
      const stop = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', stop);
        handle.removeEventListener('pointercancel', stop);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', stop);
      handle.addEventListener('pointercancel', stop);
    });
  });
}

document.querySelectorAll('[data-live-workspace]').forEach((button) => button.addEventListener('click', () => switchSpace(button.dataset.liveWorkspace)));
document.querySelectorAll('[data-live-open-app]').forEach((button) => button.addEventListener('click', () => openApp(button.dataset.liveOpenApp)));
document.querySelectorAll('[data-live-menu-target]').forEach((button) => button.addEventListener('click', () => showMenuView(button.dataset.liveMenuTarget)));
document.querySelector('[data-live-menu-search]')?.addEventListener('input', (event) => {
  const query = event.currentTarget.value.trim().toLowerCase();
  const view = launcher?.querySelector('[data-live-menu-view]:not([hidden])');
  view?.querySelectorAll(':scope > button, :scope > a').forEach((item) => { item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query); });
});
document.querySelectorAll('[data-live-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.liveAction;
    if (action === 'launcher') openLauncher();
    if (action === 'close') closeLauncher();
    if (action === 'theme') toggleTheme();
    if (action === 'bindings') {
      closeLauncher();
      toggleBindings();
    }
  });
});
launcher?.addEventListener('click', (event) => { if (event.target === launcher) closeLauncher(); });
document.querySelector('[data-live-terminal-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  runCommand(commandInput.value);
  commandInput.value = '';
});

document.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const typing = Boolean(target?.closest('input, textarea, [contenteditable="true"]'));
  const overlayControl = Boolean(target?.closest('button, a') && ((!launcher?.hidden) || (!bindingsPanel?.hidden)));
  const key = event.key.toLowerCase();
  if (event.key === 'Escape') {
    closeLauncher();
    if (bindingsPanel) bindingsPanel.hidden = true;
    return;
  }
  if (typing || overlayControl || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.code === 'Space') {
    event.preventDefault();
    launcher?.hidden ? openLauncher() : closeLauncher();
    return;
  }
  if (/^[1-5]$/.test(event.key)) {
    event.preventDefault();
    switchSpace(event.key);
    return;
  }
  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    const direction = event.key.slice(5).toLowerCase();
    event.shiftKey ? swapDirection(direction) : focusDirection(direction);
    return;
  }
  if (key === 'j') { event.preventDefault(); toggleSplit(); return; }
  if (key === 't') { event.preventDefault(); toggleFloating(); return; }
  if (key === 'f') { event.preventDefault(); toggleFullscreen(); return; }
  if (key === 'k') { event.preventDefault(); toggleBindings(); return; }
  if (key === 'b') { event.preventDefault(); openApp('browser'); return; }
  if (key === 'e') { event.preventDefault(); openApp('files'); return; }
  if (event.key === 'Enter') { event.preventDefault(); openApp('terminal'); }
});

updateClock();
window.setInterval(updateClock, 10000);
initWindows();
openApp('browser');
openApp('files');
tileAllWorkspaces();
switchSpace('1');
focusWindow(document.querySelector('[data-live-app="terminal"]'));
