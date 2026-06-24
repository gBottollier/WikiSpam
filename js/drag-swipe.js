// Shared touch-drag-to-swipe behavior, used by the mobile redesigns of the
// character, chronology, race and map pages: rather than only reading dx/dy
// on touchend and snapping straight to the next item, the given draggable
// element(s) visually follow the finger during the gesture, then either
// spring back (released short of the threshold) or finish sliding off
// before the caller swaps content and the new element(s) slide in from the
// opposite edge.
//
// getDraggables() is called once a horizontal drag is detected (so it can
// return whichever element currently represents "the card" — that may be a
// fixed set of nodes reused across swipes, or change identity each time, as
// with chronology's one-event-card-at-a-time markup) and again right after
// onCommit() runs, since the latter may have swapped in a different element.
//
// onCommit(direction) should return false if the step was a no-op (already
// at the first/last item) so the dragged element springs back instead of
// sliding away from content that never actually changed.
function attachDragSwipe(target, { getDraggables, onCommit, threshold = 0.18, minPx = 40, stopBubble = false, instantSettle = false } = {}) {
  let startX = 0, startY = 0, tracking = false, decided = null, draggables = [], width = 0;
  let cleanupTimer = null;

  const setOffset = (els, x, withTransition) => {
    if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
    els.forEach((el) => {
      if (!el) return;
      el.style.transition = withTransition ? 'transform 0.2s ease' : 'none';
      el.style.transform = x === 0 && !withTransition ? '' : `translateX(${x}px)`;
    });
    // An *animated* return to rest (withTransition, x===0) has to actually
    // set translateX(0px), not '', for the transition to play — but a
    // literal translateX(0px) is still a transform, not no transform at
    // all, and some browsers keep an element on its own compositing layer
    // for as long as it has any transform value, zero or not, which can
    // very slightly shift its rendered color (a hardware-acceleration
    // quirk, not anything specific to this site). Once the animation has
    // actually played, drop the inline transform entirely so the element
    // goes back to normal (non-promoted) painting at rest.
    if (x === 0 && withTransition) {
      cleanupTimer = setTimeout(() => {
        cleanupTimer = null;
        els.forEach((el) => { if (el) { el.style.transition = 'none'; el.style.transform = ''; } });
      }, 200);
    }
  };

  target.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
    decided = null;
  }, { passive: true });

  target.addEventListener('touchmove', (e) => {
    if (!tracking || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (decided === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      decided = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'h' : 'v';
      if (decided === 'h') {
        draggables = getDraggables();
        width = target.clientWidth || window.innerWidth;
      }
    }
    if (decided !== 'h') return;
    if (stopBubble) e.stopPropagation();
    setOffset(draggables, dx, false);
  }, { passive: true });

  target.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    if (decided !== 'h') { decided = null; return; }
    if (stopBubble) e.stopPropagation();
    decided = null;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const committed = Math.abs(dx) > Math.max(minPx, width * threshold);
    const outDraggables = draggables;

    if (!committed) {
      setOffset(outDraggables, 0, true);
      return;
    }

    const direction = dx < 0 ? 1 : -1;
    setOffset(outDraggables, direction > 0 ? -width : width, true);
    setTimeout(() => {
      const advanced = onCommit(direction) !== false;
      if (!advanced) {
        setOffset(outDraggables, 0, true);
        return;
      }
      if (instantSettle) {
        // For a filmstrip-style draggable (neighbors pre-positioned at
        // ±width inside the same element being dragged, e.g. a 3-slot
        // prev/current/next track): sliding the whole thing to ±width
        // already completed the full visual transition on its own — the
        // next slot lands exactly where the current one started. onCommit
        // just relabels which content belongs in which slot, so this only
        // needs an instant reset back to rest, not a second animated
        // entrance.
        setOffset(outDraggables, 0, false);
        return;
      }
      const inDraggables = getDraggables();
      setOffset(inDraggables, direction > 0 ? width : -width, false);
      // Force a synchronous layout flush so the browser commits this
      // jumped-to-the-entrance-edge position before the transition below
      // is applied. A single requestAnimationFrame isn't a reliable
      // enough gap for that — without forcing it, the jump and the
      // animate-to-0 can get coalesced into one transition starting from
      // wherever the element was actually last painted (its *exit*
      // position), making the incoming item appear to slide in from the
      // side it just left rather than the opposite one.
      inDraggables.forEach((el) => { if (el) void el.offsetHeight; });
      setOffset(inDraggables, 0, true);
      outDraggables.forEach((el) => {
        if (!el || inDraggables.includes(el)) return;
        el.style.transition = 'none';
        el.style.transform = '';
      });
    }, 200);
  }, { passive: true });
}
