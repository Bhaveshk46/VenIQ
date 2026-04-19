export const ZONES = [
  { id: 'gate_north', name: 'Gate 1 (Main Entrance & Exit)', type: 'gate' },
  { id: 'gate_south', name: 'Gate 2 (Pavilion Entrance)', type: 'gate' },
  { id: 'shops_north', name: 'North Concourse Shops', type: 'food' },
  { id: 'shops_south', name: 'South Pavilion Shops', type: 'food' },
  { id: 'rest_w', name: 'West Restrooms', type: 'restroom' },
  { id: 'rest_e', name: 'East Restrooms', type: 'restroom' },
  { id: 'first_aid', name: 'Primary Medical Center', type: 'aid' },
  { id: 'first_aid_2', name: 'Emergency Support Unit', type: 'aid' },
  { id: 'merch', name: 'Official Merchandise Store', type: 'merch' },
  { id: 'block_a', name: 'Block A', type: 'seat' },
  { id: 'block_b', name: 'Block B', type: 'seat' },
  { id: 'block_c', name: 'Block C', type: 'seat' },
  { id: 'block_d', name: 'Block D', type: 'seat' },
  { id: 'block_e', name: 'Block E', type: 'seat' },
  { id: 'block_f', name: 'Block F', type: 'seat' },
  { id: 'block_g', name: 'Block G', type: 'seat' },
  { id: 'block_h', name: 'Block H', type: 'seat' },
];

export const getCrowdLevel = (time, zoneType) => {
  // Logic: 0-90 mins
  if (time < 10 || time > 85) {
    if (zoneType === 'gate') return 'red';
    return 'green';
  }
  if (time >= 40 && time <= 55) {
    if (zoneType === 'food' || zoneType === 'restroom') return 'red';
    return 'green';
  }
  if (time > 15 && time < 40) {
    if (zoneType === 'food') return 'amber';
    return 'green';
  }
  return 'green';
};

export const getSensorInsights = (time, zoneType) => {
  // Logic based on match timing (Entry, Break, Exit)
  if (time < 15) {
    if (zoneType === 'gate') return { reason: "Peak Entry Time", occupancy: 92 };
    return { reason: "Building Up - Pre-match", occupancy: 40 };
  }
  if (time >= 40 && time <= 55) {
    if (zoneType === 'food' || zoneType === 'restroom') return { reason: "Half-time Peak Rush", occupancy: 98 };
    return { reason: "Quiet - Fans at Seats", occupancy: 15 };
  }
  if (time > 85) {
    if (zoneType === 'gate') return { reason: "Exit Surge Detected", occupancy: 95 };
    return { reason: "Emptying - Post-match", occupancy: 10 };
  }
  
  // Default match time logic
  if (zoneType === 'food' && time > 20 && time < 40) {
    return { reason: "Early Break Drinkers", occupancy: 65 };
  }

  return { reason: "Normal Flow", occupancy: Math.floor(Math.random() * 20) + 20 };
};

export const getPredictionData = () => {
  // Returns prediction for the bar chart
  return [
    { label: 'Pre', level: 80 },
    { label: '15m', level: 20 },
    { label: '30m', level: 30 },
    { label: 'Half', level: 95 },
    { label: '60m', level: 25 },
    { label: '75m', level: 35 },
    { label: 'FT', level: 40 },
    { label: 'Post', level: 90 },
  ];
};
