export const WORLD = { width: 3200, height: 2400 };
export const FOOD_TYPES = [
  {name:'Apple', emoji:'🍎', color:'#f04452', value:12, weight:18},
  {name:'Green Apple', emoji:'🍏', color:'#7acb45', value:14, weight:12},
  {name:'Banana', emoji:'🍌', color:'#ffd447', value:18, weight:10},
  {name:'Strawberry', emoji:'🍓', color:'#ed4165', value:16, weight:10},
  {name:'Cherries', emoji:'🍒', color:'#d92e52', value:20, weight:8},
  {name:'Grapes', emoji:'🍇', color:'#8e63c9', value:22, weight:7},
  {name:'Orange', emoji:'🍊', color:'#ff9e38', value:15, weight:10},
  {name:'Watermelon', emoji:'🍉', color:'#58bd70', value:35, weight:4},
  {name:'Cupcake', emoji:'🧁', color:'#e89bc4', value:32, weight:4},
  {name:'Donut', emoji:'🍩', color:'#d98c55', value:28, weight:4},
  {name:'Candy', emoji:'🍬', color:'#ef75c5', value:24, weight:5},
  {name:'Chocolate', emoji:'🍫', color:'#8d5b43', value:30, weight:3},
  {name:'Cookie', emoji:'🍪', color:'#c98a4d', value:25, weight:4},
  {name:'Pizza', emoji:'🍕', color:'#f4b443', value:40, weight:2},
  {name:'Burger', emoji:'🍔', color:'#d99545', value:45, weight:2},
  {name:'Golden', emoji:'⭐', color:'#ffd335', value:80, weight:1}
];
export const POWERUPS = [
  {id:'magnet', name:'MAGNET', icon:'🧲', color:'#58baff', duration:9000, description:'Pulls nearby food toward you.'},
  {id:'speed', name:'SPEED', icon:'⚡', color:'#fff064', duration:7000, description:'Move faster for a short time.'},
  {id:'double', name:'2X SCORE', icon:'✖️2', color:'#f5a5ff', duration:12000, description:'Double points from food.'},
  {id:'food', name:'FEAST', icon:'🍉', color:'#77e38d', duration:10000, description:'Food gives extra growth.'},
  {id:'zoom', name:'ZOOM OUT', icon:'🔭', color:'#86baff', duration:9000, description:'Pull the camera back for a wider arena view.'},
  {id:'coin', name:'COIN MAGNET', icon:'🪙', color:'#ffcc55', duration:10000, description:'Collect bonus coins nearby.'},
  {id:'shield', name:'SHIELD', icon:'🛡️', color:'#75dcff', duration:14000, description:'Blocks one body collision.'},
  {id:'super', name:'SUPER BOOST', icon:'🚀', color:'#ff9872', duration:5000, description:'A powerful speed burst.'},
  {id:'xp', name:'XP BOOST', icon:'💎', color:'#c2a2ff', duration:12000, description:'Earn bonus experience.'},
  {id:'gold', name:'GOLDEN FEVER', icon:'👑', color:'#ffd95b', duration:9000, description:'More golden food appears.'}
];
export const SKINS = [
  ['Classic','classic','#30bd72','#168c55'],['Ocean','classic','#35bde8','#137da6'],['Sunset','stripe','#ff9b50','#dd4b62'],['Candy','stripe','#ff75c8','#9b67d9'],['Lemon','classic','#f5df48','#b6a42e'],['Lavender','classic','#b69aff','#755fbd'],['Ruby','stripe','#f24a61','#a9284b'],['Mint','classic','#8be4ba','#37a77e'],['Neon','glow','#7cf4ff','#4d70ff'],['Rainbow','rainbow','#ff6e9d','#53d8c8'],
  ['Fire','glow','#ffad42','#f04437'],['Ice','glow','#d3faff','#62b4ed'],['Galaxy','galaxy','#a78bfa','#43318e'],['Robot','stripe','#a5b5c5','#536477'],['Dragon','stripe','#78c85c','#286e3b'],['Gold','glow','#ffe17a','#c78a22'],['Shadow','classic','#6e718b','#303244'],['Toxic','glow','#a5eb42','#4a9d35'],['Bubblegum','stripe','#ffb5da','#ed6a9f'],['Citrus','stripe','#c7ee4f','#fa9d37'],
  ['Royal','galaxy','#8e7bff','#e7c2ff'],['Arctic','stripe','#a7ecf4','#4e9cbf'],['Lava','glow','#ff7447','#8d2c31'],['Pixel','stripe','#79d6c5','#3a847e'],['Leopard','spots','#e3b46f','#79512d'],['Zebra','stripe','#f2f2f2','#414b59'],['Comet','galaxy','#f5a8ff','#4f8ae8'],['Emerald','glow','#77e4a4','#167b58'],['Phantom','glow','#9b95ce','#4e436e'],['Legend','galaxy','#ffe68b','#e66ca7']
].map((s,i)=>({id:i,name:s[0],pattern:s[1],a:s[2],b:s[3],price:i<4?0:100+i*65}));
export const MODES = [
  {id:'classic',name:'Classic Endless',icon:'♾️',desc:'Grow, hunt and survive. No time limit.'},
  {id:'battle',name:'Battle Royale',icon:'🏆',desc:'The arena shrinks. Be the last worm alive.'},
  {id:'time',name:'Time Challenge',icon:'⏱️',desc:'Collect as much as you can in 3 minutes.'},
  {id:'giant',name:'Giant Worm',icon:'🐉',desc:'Start huge and face tougher rivals.'},
  {id:'survival',name:'Survival Challenge',icon:'🔥',desc:'Danger rises as the match continues.'}
];
export const BOT_NAMES = ['NoodleKing','Wiggle','TurboTail','JellyBean','CobraKai','MangoRush','PixelWorm','SirSlither','LimeLoop','VenomVibe','Twisty','Boba','Rocket','Sizzle','Mochi','Comet','Tango','Pickle','ZigZag','Nova','Chomper','Waffle','Blinky','Sushi','Sprout','Blizzard','Fuzzy','Orbit','Doodle','Taffy','Rumble','Kiwi','Puff','Jinx','Nacho','Pebble','Zesty','Muffin','Clover','Echo'];
export const THEMES = [
  {id:'meadow',name:'Meadow',bg:'#92c96b',grid:'#a8d980',price:0},
  {id:'ocean',name:'Ocean Floor',bg:'#469eaa',grid:'#62b5bd',price:450},
  {id:'night',name:'Moonlight',bg:'#263b58',grid:'#344d6e',price:700},
  {id:'candyland',name:'Candyland',bg:'#d58bbd',grid:'#e7a6d0',price:900},
  {id:'desert',name:'Golden Desert',bg:'#d6b36d',grid:'#e7c989',price:1100}
];
