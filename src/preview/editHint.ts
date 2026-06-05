import { setIcon } from 'obsidian';

/**
 * Add a centered, hover-revealed "Edit" hint over a clickable diagram preview.
 * The hint is non-interactive (pointer-events: none in CSS) so clicks fall through
 * to the preview's own click-to-edit handler. Placed centrally rather than in a
 * corner so it never collides with other plugins' code-block buttons.
 */
export function addEditHint(parent: HTMLElement): void {
  const hint = parent.createDiv({ cls: 'drawio-edit-hint' });
  setIcon(hint.createSpan({ cls: 'drawio-edit-hint-icon' }), 'pencil');
  hint.createSpan({ text: 'Edit' });
}
