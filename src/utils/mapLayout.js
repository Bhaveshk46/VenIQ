/**
 * Shared layout constants for the stadium map and any “hint” previews.
 * VENUE_LOCATIONS uses top/left as 0–100% in the same square viewport as the map image.
 */
export const STADIUM_MAP_IMAGE = '/emerald_map.png';

/** Applied to both the live map stack and the Directions hint so edges match. */
export const STADIUM_MAP_EDGE_MASK =
  'radial-gradient(circle, black 82%, transparent 98%)';

export const STADIUM_MAP_ASPECT_BOX = {
  aspectRatio: '1 / 1',
};
