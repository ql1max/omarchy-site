const body = document.body;
const launcher = document.querySelector('[data-live-launcher]');
const commandInput = document.querySelector('[data-live-command]');
const terminalOutput = document.querySelector('[data-live-terminal-output]');
let currentSpace = '1';

function updateClock() {
  const clock = document.querySelector('[data-live-clock]');
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  clock.dateTime = now.toISOString();
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
  if (id === '1') window.setTimeout(() => commandInput?.focus(), 0);
}

function openLauncher() {
  if (!launcher) return;
  launcher.hidden = false;
  launcher.querySelector('button, a')?.focus();
}

function closeLauncher() {
  if (launcher) launcher.hidden = true;
}

function toggleTheme() {
  body.dataset.liveTheme = body.dataset.liveTheme === 'nord' ? '' : 'nord';
  closeLauncher();
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
  if (name === 'help') {
    addTerminalLine('Commands: about, clear, date, help, manual, theme, workspace 1-4');
    return;
  }
  if (name === 'about') {
    addTerminalLine('Omarchy Quattro 4.0.1');
    return;
  }
  if (name === 'clear') {
    terminalOutput.replaceChildren();
    return;
  }
  if (name === 'date') {
    addTerminalLine(new Date().toString());
    return;
  }
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
  if (name === 'workspace' && /^[1-4]$/.test(argument || '')) {
    switchSpace(argument);
    return;
  }
  addTerminalLine(`${name}: command not found`, 'live-error');
}

function initDragging() {
  document.querySelectorAll('[data-live-window]').forEach((windowElement) => {
    const handle = windowElement.querySelector('[data-live-drag-handle]');
    if (!handle) return;
    handle.addEventListener('pointerdown', (event) => {
      if (event.target.closest('a, button')) return;
      const rect = windowElement.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      windowElement.style.left = `${rect.left}px`;
      windowElement.style.top = `${rect.top}px`;
      windowElement.style.transform = 'none';
      handle.setPointerCapture(event.pointerId);

      const move = (moveEvent) => {
        const maxX = Math.max(0, window.innerWidth - rect.width);
        const maxY = Math.max(38, window.innerHeight - rect.height);
        const x = Math.min(maxX, Math.max(0, rect.left + moveEvent.clientX - startX));
        const y = Math.min(maxY, Math.max(38, rect.top + moveEvent.clientY - startY));
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

document.querySelectorAll('[data-live-workspace]').forEach((button) => {
  button.addEventListener('click', () => switchSpace(button.dataset.liveWorkspace));
});

document.querySelectorAll('[data-live-open-space]').forEach((button) => {
  button.addEventListener('click', () => switchSpace(button.dataset.liveOpenSpace));
});

document.querySelectorAll('[data-live-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.liveAction;
    if (action === 'launcher') openLauncher();
    if (action === 'close') closeLauncher();
    if (action === 'theme') toggleTheme();
  });
});

launcher?.addEventListener('click', (event) => {
  if (event.target === launcher) closeLauncher();
});

document.querySelector('[data-live-terminal-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  runCommand(commandInput.value);
  commandInput.value = '';
});

document.addEventListener('keydown', (event) => {
  const typing = event.target instanceof Element && Boolean(event.target.closest('input, textarea, [contenteditable="true"]'));
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    launcher?.hidden ? openLauncher() : closeLauncher();
    return;
  }
  if (event.key === 'Escape') {
    closeLauncher();
    return;
  }
  if (!typing && /^[1-4]$/.test(event.key)) switchSpace(event.key);
});

updateClock();
window.setInterval(updateClock, 10000);
initDragging();
window.setTimeout(() => commandInput?.focus(), 0);
