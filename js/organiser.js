import { draw } from './draw.js';
import { encode, revealUrl } from './link.js';

const STORAGE_KEY = 'secret-santa-v1';
const $ = (id) => document.getElementById(id);

/** @type {{ group: string, names: string[], rules: [string, string][], links: {name: string, url: string}[] | null, drawnFor: string | null }} */
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.names)) return saved;
  } catch {}
  return { group: '', names: [], rules: [], links: null, drawnFor: null };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// A fingerprint of the setup, so we can tell if it changed after the draw.
function setupKey() {
  return JSON.stringify([state.group.trim(), state.names, state.rules]);
}

const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function setError(msg = '') {
  $('error').textContent = msg;
}

// ---------- Rendering ----------

function render() {
  $('group').value = state.group;

  // People
  $('people').replaceChildren(
    ...state.names.map((name) =>
      el('li', {},
        el('span', { textContent: name }),
        el('button', {
          type: 'button', className: 'remove', textContent: '×',
          title: `Remove ${name}`, ariaLabel: `Remove ${name}`,
          onclick: () => removePerson(name),
        })
      )
    )
  );
  const n = state.names.length;
  $('people-count').textContent = n === 0 ? 'No one added yet.' : `${n} ${n === 1 ? 'person' : 'people'}`;

  // Rule dropdowns
  for (const id of ['rule-a', 'rule-b']) {
    const select = $(id);
    const current = select.value;
    select.replaceChildren(
      el('option', { value: '', textContent: 'Choose…' }),
      ...state.names.map((name) => el('option', { value: name, textContent: name }))
    );
    if (state.names.includes(current)) select.value = current;
  }

  // Rules
  $('rules').replaceChildren(
    ...state.rules.map(([a, b], i) =>
      el('li', {},
        el('span', { textContent: `${a} ↔ ${b}` }),
        el('button', {
          type: 'button', className: 'remove', textContent: '×',
          title: 'Remove rule', ariaLabel: `Remove rule ${a} and ${b}`,
          onclick: () => { state.rules.splice(i, 1); changed(); },
        })
      )
    )
  );

  // Results
  const hasLinks = Array.isArray(state.links) && state.links.length > 0;
  $('results').hidden = !hasLinks;
  $('draw').textContent = hasLinks ? 'Draw again' : 'Draw names';
  if (hasLinks) {
    $('stale').hidden = state.drawnFor === setupKey();
    $('links').replaceChildren(
      ...state.links.map(({ name, url }) => {
        const input = el('input', { type: 'text', value: url, readOnly: true, ariaLabel: `Link for ${name}` });
        input.addEventListener('focus', () => input.select());
        return el('li', { className: 'link-row' },
          el('strong', { textContent: name }),
          input,
          el('button', { type: 'button', textContent: 'Copy', onclick: (e) => copy(url, e.currentTarget) })
        );
      })
    );
  }
}

function changed() {
  setError();
  save();
  render();
}

// ---------- Actions ----------

function addPerson(raw) {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return false;
  if (state.names.some((n) => sameName(n, name))) {
    setError(`${name} is already on the list.`);
    return false;
  }
  state.names.push(name);
  changed();
  return true;
}

function removePerson(name) {
  state.names = state.names.filter((n) => n !== name);
  state.rules = state.rules.filter(([a, b]) => a !== name && b !== name);
  changed();
}

function addRule(a, b) {
  if (!a || !b) return setError('Pick two people for the rule.');
  if (a === b) return setError('Pick two different people.');
  if (state.rules.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
    return setError('That rule already exists.');
  }
  state.rules.push([a, b]);
  changed();
}

function runDraw() {
  setError();
  const group = state.group.trim();
  if (!group) return setError('Give your group a name first.');
  if (state.names.length < 3) return setError('Add at least 3 people.');
  if (state.links && !confirm(
    "Draw again? Any links you've already sent will still show the old result, so you'll need to send everyone their new link."
  )) return;

  let result;
  try {
    result = draw(state.names, state.rules);
  } catch (err) {
    return setError(err.message);
  }

  state.links = state.names.map((name, from) => ({
    name,
    url: revealUrl(encode({ group, names: state.names, from, to: state.names.indexOf(result.get(name)) })),
  }));
  state.drawnFor = setupKey();
  save();
  render();
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copy(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers without clipboard access.
    const t = el('textarea', { value: text });
    document.body.append(t);
    t.select();
    document.execCommand('copy');
    t.remove();
  }
  const label = button.textContent;
  button.textContent = 'Copied!';
  setTimeout(() => (button.textContent = label), 1500);
}

function copyAll(button) {
  const lines = state.links.map(({ name, url }) => `${name}: ${url}`);
  copy(`🎅 ${state.group.trim()}: Secret Santa links\n\n${lines.join('\n')}`, button);
}

function reset() {
  if (!confirm('Start over? This clears the group, people, rules and links.')) return;
  state = { group: '', names: [], rules: [], links: null, drawnFor: null };
  changed();
}

// ---------- Wiring ----------

$('group').addEventListener('input', (e) => {
  state.group = e.target.value;
  save();
  if (state.links) $('stale').hidden = state.drawnFor === setupKey();
});

$('add-person').addEventListener('submit', (e) => {
  e.preventDefault();
  setError();
  if (addPerson($('person-name').value)) $('person-name').value = '';
  $('person-name').focus();
});

$('add-rule').addEventListener('submit', (e) => {
  e.preventDefault();
  setError();
  addRule($('rule-a').value, $('rule-b').value);
});

$('draw').addEventListener('click', runDraw);
$('copy-all').addEventListener('click', (e) => copyAll(e.currentTarget));
$('reset').addEventListener('click', reset);

render();
