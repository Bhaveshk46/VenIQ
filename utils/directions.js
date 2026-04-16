/* Top/Left Coordinate percentages (0-100) on a 2D Stadium Prototype */
export const STADIUM_SECTIONS = [
  'Tata End (North)',
  'Garware Pavilion',
  'Pavilion End (South)',
  'Vittal Divecha Pavilion'
];

export const VENUE_LOCATIONS = {
  gate_north: { top: 25, left: 50, name: 'Gate 1 (Main Entrance & Exit)', type: 'gate' },
  gate_south: { top: 75, left: 50, name: 'Gate 2 (Pavilion Entrance)', type: 'gate' },
  shops_north: { top: 35, left: 35, name: 'North Concourse Shops', type: 'food' },
  shops_south: { top: 65, left: 65, name: 'South Pavilion Shops', type: 'food' },
  rest_w: { top: 50, left: 25, name: 'West Restrooms', type: 'restroom' },
  rest_e: { top: 50, left: 75, name: 'East Restrooms', type: 'restroom' },
  first_aid: { top: 35, left: 65, name: 'Primary Medical Center', type: 'aid' },
  first_aid_2: { top: 65, left: 35, name: 'Emergency Support Unit', type: 'aid' },
  merch: { top: 40, left: 25, name: 'Official Merchandise Store', type: 'merch' },
  
  // Seating Blocks mapped around the stadium ring (A through H)
  block_a: { top: 22, left: 50, name: 'Block A', type: 'seat' },
  block_b: { top: 30, left: 65, name: 'Block B', type: 'seat' },
  block_c: { top: 50, left: 75, name: 'Block C', type: 'seat' },
  block_d: { top: 70, left: 65, name: 'Block D', type: 'seat' },
  block_e: { top: 78, left: 50, name: 'Block E', type: 'seat' },
  block_f: { top: 70, left: 35, name: 'Block F', type: 'seat' },
  block_g: { top: 50, left: 25, name: 'Block G', type: 'seat' },
  block_h: { top: 30, left: 35, name: 'Block H', type: 'seat' },
};

export const getWalkingInstructions = async (fromSection, toZoneId) => {
  // Mock logic 
  const zone = VENUE_LOCATIONS[toZoneId];
  if (!fromSection || !zone) return "Please select your section first!";
  
  return `From ${fromSection}, head towards the central concourse. ${zone.name} is reachable within 3-5 minutes.`;
};
