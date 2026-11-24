// Secret Santa draw: assigns each person someone to buy for.
// Nobody gets themselves, and pairs listed in `rules` never get each other.

function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {string[]} names  unique participant names
 * @param {[string, string][]} rules  mutual exclusions (A can't get B, B can't get A)
 * @returns {Map<string, string>} giver -> receiver
 * @throws {Error} if no valid draw exists
 */
export function draw(names, rules = []) {
  if (names.length < 2) throw new Error('Add at least 2 people.');

  const blocked = new Map(names.map((n) => [n, new Set([n])]));
  for (const [a, b] of rules) {
    blocked.get(a)?.add(b);
    blocked.get(b)?.add(a);
  }

  // Most-constrained givers first makes the search fast; shuffle within ties for variety.
  const givers = shuffle(names).sort((x, y) => blocked.get(y).size - blocked.get(x).size);
  const taken = new Set();
  const result = new Map();

  function assign(i) {
    if (i === givers.length) return true;
    const giver = givers[i];
    for (const receiver of shuffle(names)) {
      if (taken.has(receiver) || blocked.get(giver).has(receiver)) continue;
      taken.add(receiver);
      result.set(giver, receiver);
      if (assign(i + 1)) return true;
      taken.delete(receiver);
      result.delete(giver);
    }
    return false;
  }

  if (!assign(0)) {
    throw new Error("These rules make a draw impossible. Try removing a rule.");
  }
  return result;
}
