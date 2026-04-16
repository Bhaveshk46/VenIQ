/**
 * constants.js
 * Central repository for all static application data.
 * Separating this from UI components improves maintainability and testability.
 */

/** All shops in the North Concourse area of the stadium */
export const NORTH_SHOPS = [
  {
    id: 'pizza_co',
    name: 'Stadium Pizza Co.',
    desc: 'Freshly baked premium pizza slices, garlic bread, and cold beverages.',
    menu: [
      { title: 'Margherita Slice', price: '₹140' },
      { title: 'Chicken Tikka Slice', price: '₹180' },
      { title: 'Stuffed Garlic Bread', price: '₹120' },
      { title: 'Cold Drink', price: '₹60' },
    ],
  },
  {
    id: 'hitmans_kitchen',
    name: 'Classic Burger Shop',
    desc: 'Signature juicy burgers, crispy fries, and classic local fast food.',
    menu: [
      { title: 'Classic Vada Pav', price: '₹40' },
      { title: 'Crispy Veg Burger', price: '₹150' },
      { title: 'Chicken Cheese Burger', price: '₹190' },
      { title: 'Salted Fries', price: '₹90' },
    ],
  },
  {
    id: 'hot_dog_stand',
    name: 'The Hot Dog Stand',
    desc: 'Classic stadium hot dogs, loaded nachos, and quick bites.',
    menu: [
      { title: 'Classic Chicken Hot Dog', price: '₹120' },
      { title: 'Loaded Cheese Nachos', price: '₹150' },
      { title: 'Popcorn Tub', price: '₹100' },
    ],
  },
  {
    id: 'sweet_treats',
    name: 'Sweet Treats & Ice Cream',
    desc: 'Cool down with premium ice creams, brownies, and cold shakes.',
    menu: [
      { title: 'Vanilla Soft Serve', price: '₹80' },
      { title: 'Chocolate Brownie Sundae', price: '₹150' },
      { title: 'Thick Cold Coffee', price: '₹110' },
    ],
  },
  {
    id: 'wraps_rolls',
    name: 'Stadium Wraps & Rolls',
    desc: 'Fresh, hot Kathi rolls and wraps made to order.',
    menu: [
      { title: 'Egg Chicken Roll', price: '₹120' },
      { title: 'Paneer Tikka Wrap', price: '₹130' },
      { title: 'Masala Lemonade', price: '₹50' },
    ],
  },
];

/** All shops in the South Pavilion area of the stadium */
export const SOUTH_SHOPS = [
  {
    id: 'chai_point',
    name: 'Premium Chai Point',
    desc: 'Premium hot teas and quick stadium snacks to keep the energy up!',
    menu: [
      { title: 'Masala Chai', price: '₹50' },
      { title: 'Filter Coffee', price: '₹60' },
      { title: 'Samosa (2 pcs)', price: '₹60' },
      { title: 'Kanda Poha', price: '₹50' },
    ],
  },
  {
    id: 'biryani_house',
    name: 'The Biryani House',
    desc: 'Authentic rich biryanis and hearty meals served hot at your seat.',
    menu: [
      { title: 'Chicken Dum Biryani', price: '₹250' },
      { title: 'Paneer Tikka Biryani', price: '₹220' },
      { title: 'Chicken Tikka Wrap', price: '₹150' },
      { title: 'Gulab Jamun (2 pcs)', price: '₹50' },
    ],
  },
  {
    id: 'south_indian',
    name: 'Authentic South Indian',
    desc: 'Piping hot dosas, idlis, and vadas with fresh coconut chutney.',
    menu: [
      { title: 'Masala Dosa', price: '₹110' },
      { title: 'Idli Vada Combo', price: '₹90' },
      { title: 'Filter Kaapi', price: '₹50' },
    ],
  },
  {
    id: 'chaat_corner',
    name: 'Street Chaat Corner',
    desc: 'Spicy, tangy, and crunchy street chaat favorites.',
    menu: [
      { title: 'Pani Puri (6 pcs)', price: '₹60' },
      { title: 'Sev Puri', price: '₹70' },
      { title: 'Aloo Tikki Chaat', price: '₹90' },
    ],
  },
  {
    id: 'refreshment_hub',
    name: 'Refreshment Hub',
    desc: 'Fresh fruit juices, sodas, and hydrating beverages.',
    menu: [
      { title: 'Fresh Lime Soda', price: '₹60' },
      { title: 'Cold Masala Buttermilk', price: '₹40' },
      { title: 'Fresh Watermelon Juice', price: '₹80' },
    ],
  },
];

/** Seating tier groups used to display the stadium layout hierarchy */
export const SEATING_GROUPS = [
  {
    id: 'lower',
    name: 'Lower Tier',
    rows: 'Rows 1-15',
    detail: 'Nearest to the boundary',
    startNumber: 1,
    count: 15,
  },
  {
    id: 'club',
    name: 'Club Level',
    rows: 'Rows 16-30',
    detail: 'Premium cushioned seating',
    startNumber: 16,
    count: 15,
  },
  {
    id: 'vip',
    name: 'VIP Boxes',
    rows: 'Rows 31-35',
    detail: 'Private luxury experience',
    startNumber: 31,
    count: 5,
  },
];


/** Maximum character length allowed for a chat message sent to the AI */
export const MAX_CHAT_INPUT_LENGTH = 500;

/** 
 * Comprehensive Stadium Lore for Gemini AI Concierge.
 * Centralizing this ensures the AI always has the latest and most accurate stadium info.
 */
export const STADIUM_LORE = {
  venue: "Wankhede Stadium, Mumbai",
  nicknames: ["The Bullring of India", "Mumbais Cricket Temple"],
  notable_spots: [
    "Marine Lines Station (0.9km) - Fastest way out.",
    "Churchgate Station (1.8km) - Better to beat the rush.",
    "North Concourse - Great for quick bites.",
    "South Pavilion - Legendary for Biryani and Filter Coffee."
  ],
  food_highlights: "NORTH: Pizza Co, Classic Burger (₹40), Hot Dog Stand. SOUTH: Chai Point (₹50), Biryani House (₹250), South Indian (Dosa/Idli).",
  proactive_tips: [
    "Mention Pizza if user is in North Concourse.",
    "Mention Filter Coffee/Biryani if user is in South Pavilion.",
    "Always suggest beating the rush via Churchgate if the match is near ending."
  ]
};
