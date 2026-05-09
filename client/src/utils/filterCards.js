/**
 * Applies active filters to a list of cards.
 * @param {object[]} cards - array of card objects
 * @param {object}   filters - { search, labels, dueDate, hasChecklist }
 * @returns {object[]} filtered cards
 */
export function applyFilters(cards, filters) {
  if (!filters) return cards;
  const { search, labels, dueDate, hasChecklist } = filters;

  const hasActiveFilter =
    search || labels?.length || dueDate || hasChecklist;
  if (!hasActiveFilter) return cards;

  const now = Date.now();
  const soonThreshold = now + 48 * 60 * 60 * 1000;

  return cards.filter((card) => {
    // ── Text search ──────────────────────────────────────────────────────
    if (search && !card.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // ── Label filter ─────────────────────────────────────────────────────
    if (labels?.length) {
      const cardColors = (card.labels || []).map((l) => l.color);
      const hasMatch = labels.some((color) => cardColors.includes(color));
      if (!hasMatch) return false;
    }

    // ── Due date filter ──────────────────────────────────────────────────
    if (dueDate) {
      const due = card.dueDate ? new Date(card.dueDate).getTime() : null;
      if (dueDate === 'overdue' && !(due && due < now)) return false;
      if (dueDate === 'due_soon' && !(due && due >= now && due <= soonThreshold)) return false;
      if (dueDate === 'no_date' && due != null) return false;
    }

    // ── Checklist filter ─────────────────────────────────────────────────
    if (hasChecklist && !(card.checklist?.length > 0)) return false;

    return true;
  });
}

/**
 * Returns true if any filter is currently active.
 */
export function isFiltering(filters) {
  if (!filters) return false;
  return !!(filters.search || filters.labels?.length || filters.dueDate || filters.hasChecklist);
}
