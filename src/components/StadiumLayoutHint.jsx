import React from 'react';
import { VENUE_LOCATIONS } from '../../utils/directions';
import {
  STADIUM_MAP_IMAGE,
  STADIUM_MAP_EDGE_MASK,
  STADIUM_MAP_ASPECT_BOX,
} from '../utils/mapLayout';

function findVenueByName(name) {
  if (!name) return null;
  return Object.values(VENUE_LOCATIONS).find((v) => v.name === name) ?? null;
}

/**
 * Mini preview that uses the same asset + coordinate system as MapScreen markers
 * (VENUE_LOCATIONS top/left % on a square, masked container).
 */
export default function StadiumLayoutHint({ fromName, toName }) {
  const from = findVenueByName(fromName);
  const to = findVenueByName(toName);

  return (
    <div
      role="img"
      aria-label={
        from && to
          ? `Stadium map preview from ${from.name} to ${to.name}`
          : 'Stadium map preview'
      }
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 280,
        margin: '0 auto',
        borderRadius: 12,
        overflow: 'hidden',
        ...STADIUM_MAP_ASPECT_BOX,
        maskImage: STADIUM_MAP_EDGE_MASK,
        WebkitMaskImage: STADIUM_MAP_EDGE_MASK,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <title>Stadium layout hint</title>
        <image
          href={STADIUM_MAP_IMAGE}
          width={100}
          height={100}
          preserveAspectRatio="xMidYMid meet"
          opacity={0.92}
        />
        {from && to && (
          <line
            x1={from.left}
            y1={from.top}
            x2={to.left}
            y2={to.top}
            stroke="rgba(16, 185, 129, 0.55)"
            strokeWidth={1.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {from && (
          <g>
            <circle
              cx={from.left}
              cy={from.top}
              r={3.2}
              fill="#10B981"
              stroke="#080c14"
              strokeWidth={0.8}
            />
            <text
              x={from.left}
              y={from.top - 5}
              fill="#94a3b8"
              fontSize={4}
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              You
            </text>
          </g>
        )}
        {to && (
          <g>
            <circle
              cx={to.left}
              cy={to.top}
              r={3.2}
              fill="#06b6d4"
              stroke="#080c14"
              strokeWidth={0.8}
            />
            <text
              x={to.left}
              y={to.top + 8}
              fill="#94a3b8"
              fontSize={4}
              textAnchor="middle"
              style={{ pointerEvents: 'none' }}
            >
              Dest
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
