import { decode } from './link.js';
import { Wheel } from './wheel.js';

const $ = (id) => document.getElementById(id);

const data = decode(location.hash.slice(1));

if (!data) {
  $('content').hidden = true;
  $('error').hidden = false;
} else {
  const me = data.names[data.from];
  const match = data.names[data.to];
  // The wheel shows everyone except the person themselves.
  const wheelNames = data.names.filter((_, i) => i !== data.from);

  document.title = `${data.group} · Secret Santa`;
  $('group').textContent = data.group;
  $('me').textContent = me;

  const wheel = new Wheel($('wheel'), wheelNames);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('spin').addEventListener('click', async () => {
    $('spin').hidden = true;
    $('wheel').classList.remove('blurred');
    await wheel.spinTo(wheelNames.indexOf(match), { instant: reduceMotion });
    $('match').textContent = match;
    $('result').hidden = false;
  });
}
