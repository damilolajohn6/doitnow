export const categories = [
  'All',
  'Wardrobes',
  'Kitchens',
  'Bedroom TV Walls',
  'Bedroom Furniture',
  'Living & Dining',
  'TV Feature Walls',
  'Bathrooms',
  'Staircases',
  'Office & Storage',
] as const;

export type Category = (typeof categories)[number];
export type DesignCategory = Exclude<Category, 'All'>;

export interface Design {
  slug: string;
  title: string;
  category: DesignCategory;
  image: string;
  alt: string;
  summary: string;
  description: string;
  facts: string[];
  materials: string[];
  planning: string[];
  lighting: string;
}

export function isCategory(value: string): value is Category {
  return (categories as readonly string[]).includes(value);
}

export const designs: Design[] = [
  {
    slug: 'soft-curves-warm-neutrals',
    title: 'Soft Curves + Warm Neutrals',
    category: 'Living & Dining',
    image: '/images/designs/living-01.webp',
    alt: 'Warm minimal living room with curved ivory seating and pale timber tables',
    summary: 'A calm living direction shaped by rounded seating, pale timber and restrained objects.',
    description:
      'Soft curves and warm neutrals create a relaxed room without filling every surface. The layout keeps circulation clear and uses a few larger pieces rather than many small decorative items.',
    facts: ['Warm neutral palette', 'Curved seating', 'Pale timber'],
    materials: ['Cream textured upholstery', 'Pale oak or light walnut tables', 'Warm off-white walls'],
    planning: [
      'Keep the main route outside the coffee-table zone.',
      'Use fewer, larger accessories for a quieter composition.',
      'Choose washable or performance fabrics where needed.',
    ],
    lighting: 'Combine warm ambient light with reading lamps and a softer evening layer.',
  },
  {
    slug: 'simple-ivory-walnut-wardrobe',
    title: 'Simple Ivory + Walnut Wardrobe',
    category: 'Wardrobes',
    image: '/images/designs/wardrobe-01.webp',
    alt: 'Simple ivory wardrobe with walnut edging and separate overhead cabinets',
    summary: 'A clean built-in direction with three main doors and a separate overhead pair.',
    description:
      'This Room 1 wardrobe direction keeps the elevation simple and visually light. Walnut edging gives the ivory fronts definition while the internal layout can be zoned around hanging, folded items and drawers.',
    facts: ['7 ft × 8 ft 2 in', 'Three main doors', 'Separate overheads'],
    materials: ['Warm ivory matte fronts', 'Walnut-look edge frame', 'Slim warm-metal handles'],
    planning: [
      'Confirm the actual wall width, height and skirting before production.',
      'Zone the interior around the clothing categories used most.',
      'Check door swing and bedside clearance.',
    ],
    lighting: 'Use even light at the door face and concealed internal illumination where required.',
  },
  {
    slug: 'ivory-walnut-kitchen-island',
    title: 'Ivory + Walnut Kitchen + Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-02.webp',
    alt: 'Ivory and walnut kitchen with a central island and windows above worktop level',
    summary: 'A warm kitchen with a slim island, tall walnut storage and window-led planning.',
    description:
      'This island layout balances warm ivory work zones with a walnut tall unit and island base. Rear and right windows inform the cabinet arrangement, with sills kept above finished worktop level.',
    facts: ['Island layout', '3 ft window studies', 'Ivory + walnut'],
    materials: [
      'Warm ivory cabinet fronts',
      'Walnut-look tall units and island base',
      'Pale durable worktop',
    ],
    planning: [
      'Confirm clear aisles before fixing the island size.',
      'Coordinate sink, hob, refrigerator and landing space together.',
      'Keep window sills above the worktop and check tap opening arcs.',
    ],
    lighting: 'Combine ceiling, under-cabinet and island task lighting with warm colour temperature.',
  },
  {
    slug: 'white-marble-walnut-tv-wall',
    title: 'White Marble + Walnut TV Wall',
    category: 'TV Feature Walls',
    image: '/images/designs/tv-wall-01.webp',
    alt: 'White stone-look TV wall with walnut console, fluted edges and standing open shelves',
    summary: 'A restrained media wall with one dominant panel and a door-free open-shelf tower.',
    description:
      'Designed around the confirmed TV wall, this direction pairs a pale stone-look panel with a walnut console and standing open shelves. The tower remains door-free and the composition stays focused on one main feature.',
    facts: ['9 ft × 101 in wall', '3 ft open shelves', 'Door-free tower'],
    materials: [
      'White stone-look feature panel',
      'Walnut-look console and slatted accents',
      'Warm ivory surrounding wall',
    ],
    planning: [
      'Set the TV around the main seated sightline.',
      'Size the console around actual devices and cable bends.',
      'Keep sockets, ventilation and service access concealed but reachable.',
    ],
    lighting: 'Use a concealed warm halo with shielded shelf lighting and accessible drivers.',
  },
  {
    slug: 'upholstered-bed-tall-headboard',
    title: 'Upholstered Bed + Tall Headboard',
    category: 'Bedroom Furniture',
    image: '/images/designs/bedroom-01.webp',
    alt: 'Grey upholstered bed with a tall padded headboard and coordinated bedside tables',
    summary: 'A padded bed direction with a tall headboard and coordinated bedside furniture.',
    description:
      'The tall upholstered headboard gives the room a clear focal point while the coordinated bedside tables keep the composition balanced. Fabric, firmness and frame construction should be confirmed against comfort and maintenance needs.',
    facts: ['Upholstered frame', 'Tall headboard', 'Coordinated tables'],
    materials: ['Grey upholstery', 'Padded headboard panels', 'Coordinated timber-look bedside tables'],
    planning: [
      'Confirm mattress size and overall frame dimensions.',
      'Check circulation around both sides and the foot of the bed.',
      'Review fabric cleaning and headboard fixing requirements.',
    ],
    lighting: 'Use separate bedside reading lights and a warm, low-glare ambient layer.',
  },
  {
    slug: 'walk-in-shower-floating-vanity',
    title: 'Walk-In Shower + Floating Vanity',
    category: 'Bathrooms',
    image: '/images/designs/bathroom-01.webp',
    alt: 'Modern bathroom with walk-in glass shower and floating dark vanity',
    summary: 'A modern wet-room direction with large-format surfaces and a floating drawer vanity.',
    description:
      'A walk-in shower and floating vanity keep the floor visually open. Finish selection follows waterproofing, drainage, ventilation and safe wet-area detailing rather than appearance alone.',
    facts: ['Walk-in shower', 'Floating vanity', 'Large-format surfaces'],
    materials: [
      'Large-format porcelain wall and floor finishes',
      'Floating matte or wood-look vanity',
      'Dark framed shower screen',
    ],
    planning: [
      'Plan falls to the drain before selecting tile sizes.',
      'Use slip-appropriate flooring and sealed wet-zone junctions.',
      'Keep traps, valves and drivers accessible for maintenance.',
    ],
    lighting: 'Combine wet-area-rated ambient fittings with even vertical light at the mirror.',
  },
  {
    slug: 'oak-dining-woven-pendants',
    title: 'Oak Dining + Woven Pendants',
    category: 'Living & Dining',
    image: '/images/designs/dining-01.webp',
    alt: 'Warm oak dining table with light chairs and woven pendant shades',
    summary: 'A warm dining setting with natural timber, restrained chairs and woven shades.',
    description:
      'Natural timber and woven pendants bring warmth to a simple dining arrangement. The table, chair count and pullback space should be resolved together so the room remains comfortable in daily use.',
    facts: ['Oak table', 'Woven pendants', 'Warm neutral room'],
    materials: [
      'Natural oak or oak-look table',
      'Neutral upholstered or timber chairs',
      'Woven pendant shades',
    ],
    planning: [
      'Centre the fittings over the table rather than the room.',
      'Keep chair pullback space clear behind every seat.',
      'Use dimming to shift between meals, work and evening ambience.',
    ],
    lighting:
      'Typical pendant bottoms may sit 750–900 mm above the table, subject to the actual room and fitting.',
  },
  {
    slug: 'walnut-bedroom-tv-console',
    title: 'Walnut Bedroom TV Console',
    category: 'Bedroom TV Walls',
    image: '/images/designs/bedroom-tv-01.webp',
    alt: 'Walnut TV console on a warm ivory bedroom wall below a wall-mounted screen',
    summary: 'A low walnut console and quiet ivory backdrop for a bedroom TV wall.',
    description:
      'This console-wall direction keeps the bedroom visually calm. Screen centre, console height, sockets and cable routes should be resolved from the real bed and pillow position.',
    facts: ['Low console', 'Warm ivory backdrop', 'Concealed cables'],
    materials: ['Walnut-look console', 'Warm ivory wall finish', 'Restrained decorative objects'],
    planning: [
      'Mock up the TV centre from the actual bed position.',
      'Confirm device sizes before fixing console depth.',
      'Group sockets behind an accessible panel.',
    ],
    lighting: 'Keep downlight reflections away from the screen and use a soft evening layer.',
  },
  {
    slug: 'floating-timber-glass-staircase',
    title: 'Floating Timber + Glass',
    category: 'Staircases',
    image: '/images/designs/staircase-01.webp',
    alt: 'Floating timber staircase with glass guarding and a simple handrail',
    summary: 'An open stair direction combining warm treads, transparent guarding and a simple rail.',
    description:
      'Timber treads and glass guarding create a light architectural appearance. Structure, consistent geometry, guards and handrails must be resolved before the visual treatment is approved.',
    facts: ['Timber treads', 'Clear guarding', 'Open character'],
    materials: [
      'Timber or timber-look tread finish',
      'Clear guard system with suitable fixings',
      'Warm neutral supporting structure',
    ],
    planning: [
      'Verify structural support before pursuing a floating appearance.',
      'Maintain consistent tread and riser dimensions.',
      'Use slip-appropriate nosings and keep visual edges clear.',
    ],
    lighting: 'Use shielded low-level wall or tread lighting without exposed diode points.',
  },
  {
    slug: 'ivory-walnut-kitchen-no-island',
    title: 'Ivory + Walnut Kitchen — No Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-01.webp',
    alt: 'No-island ivory and walnut kitchen with rear and right windows',
    summary: 'A clear no-island layout with warm cabinetry and coordinated rear and right windows.',
    description:
      'This no-island arrangement prioritises uninterrupted movement through the centre of the kitchen. Window positions and worktop-level coordination shape the rear and right runs.',
    facts: ['No island', '3 ft window studies', 'Clear central route'],
    materials: ['Warm ivory cabinet fronts', 'Walnut-look tall accents', 'Pale worktop and splashback'],
    planning: [
      'Preserve clear movement through the centre of the room.',
      'Coordinate tall appliances, hood and sink services early.',
      'Keep window sills above finished worktop level.',
    ],
    lighting: 'Use ceiling, cove and under-cabinet layers without creating worktop shadows.',
  },
  {
    slug: 'compact-ivory-wardrobe',
    title: 'Compact Ivory Wardrobe',
    category: 'Wardrobes',
    image: '/images/designs/wardrobe-02.webp',
    alt: 'Compact ivory wardrobe with two main doors and separate overhead cabinets',
    summary: 'A compact Room 4 direction with two main doors and a separate overhead pair.',
    description:
      'The compact elevation uses full-height ivory fronts and a restrained frame to suit the smaller wardrobe wall. Separate overheads provide less-frequently-used storage without adding another main door.',
    facts: ['4 ft × 8 ft 7 in', 'Two main doors', 'Separate overheads'],
    materials: ['Soft ivory matte fronts', 'Light-to-mid wood edge frame', 'Slim warm-metal handle'],
    planning: [
      'Prioritise one well-planned hanging bay.',
      'Use drawers below to reduce visual handles.',
      'Check door swing against the bed and walkway.',
    ],
    lighting: 'Use vertical internal LED lighting shielded from direct view where required.',
  },
  {
    slug: 'sage-oak-kitchen-no-island',
    title: 'Sage + Oak Kitchen — No Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-05.webp',
    alt: 'Sage and oak kitchen without an island, with rear and right windows above worktop level',
    summary: 'A quiet linear kitchen with muted sage fronts, light oak storage and an open central walkway.',
    description:
      'This no-island layout keeps the centre of the room open while balancing sage base cabinets with light oak storage. The rear and right 3 ft window studies inform the work zones, with sills held above finished worktop level.',
    facts: ['No-island layout', '3 ft window studies', 'Sage + oak'],
    materials: [
      'Muted sage cabinet fronts',
      'Light oak tall units and open shelving',
      'Pale durable worktop',
    ],
    planning: [
      'Keep the main walkway clear and confirm door and appliance opening arcs.',
      'Coordinate sink, hob, refrigerator and uninterrupted landing space along the runs.',
      'Keep window sills above the worktop and check tap opening arcs.',
    ],
    lighting: 'Combine even ceiling light with under-cabinet task lighting and a warm evening layer.',
  },
  {
    slug: 'fluted-walnut-stone-tv-wall',
    title: 'Fluted Walnut + Stone TV Wall',
    category: 'TV Feature Walls',
    image: '/images/designs/tv-wall-02.webp',
    alt: 'TV wall with central dark screen, fluted walnut frame and standing open shelves',
    summary: 'A stronger walnut frame around a calm central panel and door-free shelf tower.',
    description:
      'Fluting is used as an accent around the main TV panel rather than across every surface. The standing open shelves and restrained console maintain the confirmed wall proportions.',
    facts: ['9 ft × 101 in wall', '3 ft open shelves', 'Fluted accents'],
    materials: [
      'Walnut-look fluted frame',
      'Neutral stone-look central panel',
      'Coordinated floating console',
    ],
    planning: [
      'Use fluting as an accent, not across every surface.',
      'Keep display objects sparse and varied in height.',
      'Confirm tower base and wall fixing on site.',
    ],
    lighting: 'Combine a warm halo behind the central panel with shielded vertical or shelf lighting.',
  },
  {
    slug: 'grey-upholstered-bed',
    title: 'Grey Upholstered Bed',
    category: 'Bedroom Furniture',
    image: '/images/designs/bedroom-02.webp',
    alt: 'Grey upholstered bed with channel headboard in a warm neutral bedroom',
    summary: 'A softer bedroom direction with a channel headboard and low upholstered frame.',
    description:
      'A channel-stitched headboard and low frame give this bed a calm, tailored appearance. The neutral upholstery can coordinate with timber, ivory and muted accent palettes.',
    facts: ['Channel headboard', 'Low frame', 'Soft neutral palette'],
    materials: [
      'Grey upholstered frame',
      'Padded channel headboard',
      'Coordinated neutral bedside furniture',
    ],
    planning: [
      'Confirm mattress and frame sizes before fabrication.',
      'Check bedside table height against the mattress.',
      'Review upholstery durability and cleaning requirements.',
    ],
    lighting: 'Use warm bedside lighting and avoid harsh direct downlights over the bed.',
  },
  {
    slug: 'built-in-home-office',
    title: 'Built-In Home Office',
    category: 'Office & Storage',
    image: '/images/designs/office-01.webp',
    alt: 'Dark built-in home office with desk, screen and closed overhead storage',
    summary: 'A coordinated work zone with a built-in desk and closed storage.',
    description:
      'The built-in desk and overhead storage create one organised work zone. Monitor position, knee space, sockets and task lighting should be coordinated before the cabinetry is detailed.',
    facts: ['Built-in desk', 'Closed storage', 'Integrated work zone'],
    materials: ['Dark matte cabinetry', 'Coordinated desk surface', 'Warm neutral surrounding finishes'],
    planning: [
      'Use a 720–750 mm high desk as a starting point.',
      'Check chair, knee space, monitor distance and sockets together.',
      'Place the monitor to avoid window glare and reflections.',
    ],
    lighting: 'Add focused task lighting rather than brightening the whole room unnecessarily.',
  },
  {
    slug: 'compact-wood-vanity-glass',
    title: 'Compact Wood Vanity + Glass',
    category: 'Bathrooms',
    image: '/images/designs/bathroom-02.webp',
    alt: 'Compact bathroom with wood-look vanity, glass shower and mirror cabinet',
    summary: 'A compact wet room with warm drawers, a glass shower and broad mirror cabinet.',
    description:
      'Warm wood-look drawers balance the glass and pale wall finishes. Every board, seal and fitting should be selected for its actual bathroom exposure.',
    facts: ['Compact bathroom', 'Wood-look vanity', 'Glass shower'],
    materials: [
      'Wood-look moisture-appropriate vanity',
      'Large-format neutral wall tile',
      'Black shower frame and fittings',
    ],
    planning: [
      'Keep the counter clear with everyday items inside drawers.',
      'Confirm shower screen swing or fixed-panel clearances.',
      'Coordinate wall-hung units with suitable support.',
    ],
    lighting: 'Use even vertical light at the face with rated shower lighting and accessible drivers.',
  },
  {
    slug: 'greige-darkwood-kitchen-island',
    title: 'Greige + Darkwood Kitchen + Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-06.webp',
    alt: 'Greige and darkwood kitchen with an island and rear and right windows above worktop level',
    summary: 'A deeper neutral kitchen with a practical island, darkwood accents and window-led work zones.',
    description:
      'This island layout pairs restrained greige cabinetry with darkwood depth and a pale work surface. Rear and right 3 ft window studies guide the cabinet arrangement, while the sills remain above finished worktop level.',
    facts: ['Island layout', '3 ft window studies', 'Greige + darkwood'],
    materials: [
      'Warm greige cabinet fronts',
      'Darkwood tall units and island accents',
      'Pale durable worktop',
    ],
    planning: [
      'Confirm clear aisles on every side of the island before fixing its dimensions.',
      'Coordinate sink, hob, refrigerator and landing space as one working sequence.',
      'Keep window sills above the worktop and check tap opening arcs.',
    ],
    lighting: 'Layer ceiling, under-cabinet and island task lighting with warm colour temperature.',
  },
  {
    slug: 'dark-timber-bedroom-console',
    title: 'Dark Timber Bedroom Console',
    category: 'Bedroom TV Walls',
    image: '/images/designs/bedroom-tv-02.webp',
    alt: 'Dark timber bedroom TV console with a wall-mounted screen and soft neutral walls',
    summary: 'A darker console direction with a restrained wall and concealed media services.',
    description:
      'The darker console anchors the screen without requiring a busy feature wall. Proportion, device ventilation and the bed sightline guide the final technical layout.',
    facts: ['Dark timber console', 'Quiet backdrop', 'Media storage'],
    materials: ['Dark timber-look console', 'Warm neutral wall finish', 'Restrained decorative objects'],
    planning: [
      'Keep the console visually wider than the TV where space allows.',
      'Use 350–450 mm depth only after checking device sizes.',
      'Leave ventilation space and avoid sealed hot-device compartments.',
    ],
    lighting: 'Use soft indirect light and keep direct spotlights away from the screen.',
  },
  {
    slug: 'sage-oak-kitchen-island',
    title: 'Sage + Oak Kitchen + Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-03.webp',
    alt: 'Sage and oak kitchen with island and windows above the worktop',
    summary: 'A softer island kitchen combining muted sage, warm oak and pale work surfaces.',
    description:
      'Muted sage cabinetry and warm oak details give this island kitchen a calm, natural palette. The layout retains window coordination and practical clearances around the working sides.',
    facts: ['Island layout', 'Sage + oak', 'Window-led planning'],
    materials: ['Muted sage cabinet fronts', 'Warm oak-look accents', 'Pale durable worktop'],
    planning: [
      'Target clear working aisles before confirming the island.',
      'Provide usable landing space near sink, hob and refrigerator.',
      'Check window sills and tap opening arcs.',
    ],
    lighting: 'Combine warm ambient, under-cabinet and focused island task lighting.',
  },
  {
    slug: 'four-door-wardrobe-drawers',
    title: 'Four-Door Wardrobe + Drawers',
    category: 'Wardrobes',
    image: '/images/designs/wardrobe-03.webp',
    alt: 'White freestanding four-door wardrobe with two central lower drawers',
    summary: 'A clean white freestanding wardrobe with full-height zones and two central drawers.',
    description:
      'The four-door elevation provides full-height storage with two central drawers for folded daily items. Dark slim pulls add definition without visually complicating the front.',
    facts: ['Four main doors', 'Two drawers', 'Freestanding'],
    materials: [
      'White matte door and drawer fronts',
      'Dark slim pulls and top edge',
      'Light neutral carcass',
    ],
    planning: [
      'Use the central drawers for folded daily items.',
      'Confirm hanging widths against the four-door layout.',
      'Level the base and consider suitable anti-tip fixing.',
    ],
    lighting: 'Use good room lighting at the doors with optional internal sensor lighting.',
  },
  {
    slug: 'taupe-travertine-oak-tv-wall',
    title: 'Taupe Travertine + Oak TV Wall',
    category: 'TV Feature Walls',
    image: '/images/designs/tv-wall-03.webp',
    alt: 'Taupe stone-look TV wall with oak console and standing open shelves',
    summary: 'A quieter earthy media wall with taupe stone-look surfaces and warm oak shelving.',
    description:
      'Subtle taupe stone-look surfaces and warm oak create a calm backdrop for the screen. The open tower balances the console while retaining the confirmed wall and shelf framework.',
    facts: ['9 ft × 101 in wall', '3 ft open shelves', 'Taupe + oak'],
    materials: [
      'Taupe stone-look feature surface',
      'Warm oak console and open tower',
      'Soft ivory surrounding wall',
    ],
    planning: [
      'Use subtle veining for a calmer backdrop.',
      'Balance the tower with the visual weight of the console.',
      'Keep device shelves ventilated and accessible.',
    ],
    lighting: 'Use low-glare concealed backlight with optional dimmable shelf illumination.',
  },
  {
    slug: 'statement-pendant-stone-staircase',
    title: 'Statement Pendant + Stone',
    category: 'Staircases',
    image: '/images/designs/staircase-02.webp',
    alt: 'Double-height staircase with stone-look treads and grouped pendant lights',
    summary: 'A double-height stairwell with suspended lighting and stone-look treads.',
    description:
      'A suspended pendant composition gives the stairwell scale while stone-look treads provide a durable visual base. Headroom, guard lines and maintenance access remain central to the detail.',
    facts: ['Double-height space', 'Pendant composition', 'Stone-look treads'],
    materials: [
      'Stone or stone-look stair finish',
      'Dark framed pendant composition',
      'Warm neutral wall surfaces',
    ],
    planning: [
      'Coordinate pendant drops with headroom and guard lines.',
      'Plan safe maintenance access to every fitting.',
      'Keep the stair edge readable under all lighting scenes.',
    ],
    lighting: 'Use dimmable decorative pendants together with shielded stair-level illumination.',
  },
  {
    slug: 'grey-storage-tv-niche',
    title: 'Grey Storage + TV Niche',
    category: 'Bedroom TV Walls',
    image: '/images/designs/bedroom-tv-03.webp',
    alt: 'Full-height grey wardrobes framing a central TV and floating timber console',
    summary: 'Full-height grey storage frames a central TV and slim floating timber console.',
    description:
      'Tall wardrobe fronts frame the central media niche, combining storage and a TV wall in one composition. Door swings and console clearances must be checked together.',
    facts: ['Tall storage', 'Floating console', 'Grey + timber'],
    materials: ['Warm grey full-height doors', 'Timber-look floating console', 'Long warm-metal pulls'],
    planning: [
      'Keep the central console clear of wardrobe door swings.',
      'Use the niche for media and a restrained daily drop zone.',
      'Plan sockets and cable routes before carcass production.',
    ],
    lighting: 'Add soft light below the floating console and avoid downlight reflections on the TV.',
  },
  {
    slug: 'spa-retreat-bathroom',
    title: 'Spa Retreat Bathroom',
    category: 'Bathrooms',
    image: '/images/designs/bathroom-03.webp',
    alt: 'Spa-like bathroom with freestanding bath and warm large-format wall finishes',
    summary: 'A warm spa-like direction with a freestanding bath and restrained large-format finishes.',
    description:
      'Warm large-format surfaces and a freestanding bath create a spa-like atmosphere. Waterproofing, cleaning access and floor build-up must be resolved around the actual fixture positions.',
    facts: ['Freestanding bath', 'Warm surfaces', 'Spa-like palette'],
    materials: [
      'Large-format warm porcelain finishes',
      'Freestanding bath',
      'Restrained dark or metal fittings',
    ],
    planning: [
      'Confirm floor build-up and drainage before fixture positioning.',
      'Keep cleaning access around the bath and wall junctions.',
      'Use suitable waterproofing and slip-resistant floor finishes.',
    ],
    lighting: 'Layer low-glare ambient light with rated feature lighting suitable for the actual zones.',
  },
  {
    slug: 'greige-darkwood-kitchen-no-island',
    title: 'Greige + Darkwood Kitchen — No Island',
    category: 'Kitchens',
    image: '/images/designs/kitchen-04.webp',
    alt: 'No-island greige kitchen with darkwood tall units and rear and right windows',
    summary: 'A no-island kitchen with muted greige cabinetry and darkwood tall accents.',
    description:
      'Greige cabinetry and darkwood tall units give this no-island kitchen a richer but restrained palette. Rear and right windows remain coordinated with the work zones and cabinet breaks.',
    facts: ['No island', 'Greige + darkwood', 'Rear + right windows'],
    materials: ['Muted greige cabinet fronts', 'Darkwood-look tall units', 'Pale worktop and splashback'],
    planning: [
      'Keep the centre open for comfortable circulation.',
      'Coordinate appliance and sink services before production.',
      'Retain window clearances and sills above the worktop.',
    ],
    lighting: 'Use warm under-cabinet task light and balanced ceiling illumination.',
  },
  {
    slug: 'minimal-entry-console',
    title: 'Minimal Entry Console',
    category: 'Office & Storage',
    image: '/images/designs/entry-01.webp',
    alt: 'Minimal entry console with mirror, flowers and small daily drop zone',
    summary: 'A compact entry drop zone with a slim console, mirror and restrained objects.',
    description:
      'A slim console and mirror create a useful entry point without crowding the passage. The final depth and accessories should preserve the main route and door swings.',
    facts: ['Slim console', 'Daily drop zone', 'Compact footprint'],
    materials: ['Slim dark console frame', 'Warm neutral wall', 'Restrained timber or ceramic accessories'],
    planning: [
      'Slim consoles often need only 250–350 mm depth.',
      'Preserve the main clear passage and door swings.',
      'Add a tray, hook or closed box only where circulation allows.',
    ],
    lighting: 'Use soft ambient light and a restrained accent rather than glare at the mirror.',
  },
];

export function getDesign(slug: string): Design | undefined {
  return designs.find((design) => design.slug === slug);
}

export function getRelatedDesigns(design: Design, limit = 3): Design[] {
  return designs
    .filter((item) => item.category === design.category && item.slug !== design.slug)
    .slice(0, limit);
}
