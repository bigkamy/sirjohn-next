-- The real Sir John catalog: 32 products built from the photography in
-- public/images/Product, plus the categories they sit in.
-- Apply after 20260918000000_home_hero_slides.sql. Safe to re-run.
--
-- PRICES ARE NOT SET. Every product is inserted with price = 0 and stock = 0, so no
-- made-up price is ever charged: the products are visible for review, and zero stock is
-- what stops one being ordered for free (the cart and place_order both refuse a product
-- with no stock). Finish each one in /admin/products: set the real price (and sale price),
-- set the stock, and add any options it needs.
--
-- Products that need options before they are ordered:
--   Leather Golf Glove   — Hand Orientation, Size
--   Spiked Golf Shoes    — Size
--   Performance Golf Socks, Leather Ratchet Belt, Golf Cap — Size, if you stock more than one
--
-- These are not sample data (is_sample stays false), so "remove samples" in the admin
-- panel leaves them alone.

-- ---------------------------------------------------------------------------
-- Categories. The first six already exist in seed.sql; this only fills in a
-- home page image where one is missing and leaves any admin edits alone.
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, sort_order, image) values
  ('Clubs',             'clubs',             1, '/images/Product/complete-club-set.png'),
  ('Bags',              'bags',              2, '/images/Product/tour-bag-headcover-collection.png'),
  ('Balls',             'balls',             3, '/images/Product/tour-golf-ball.png'),
  ('Apparel',           'apparel',           4, '/images/Product/golf-cap.png'),
  ('Footwear',          'footwear',          5, '/images/Product/spiked-golf-shoes.png'),
  ('Accessories',       'accessories',       6, '/images/Product/golf-sunglasses.png'),
  ('Course Essentials', 'course-essentials', 7, '/images/Product/golf-towel.png'),
  ('Drinkware',         'drinkware',         8, '/images/Product/insulated-water-bottle.png'),
  ('Wellness',          'wellness',          9, '/images/Product/golf-first-aid-kit.png'),
  ('Gifts & Trophies',  'gifts-trophies',   10, '/images/Product/trophy-award-collection.png')
on conflict (name) do update
  set image = coalesce(categories.image, excluded.image);

-- ---------------------------------------------------------------------------
-- Products. The descriptions come from the photography itself — what is pictured
-- and the copy printed on it — so nothing here is invented.
-- ---------------------------------------------------------------------------

insert into public.products
  (name, slug, brand, category, price, description, short_description, image, stock, is_active)
values
  ('Complete Club Set', 'complete-club-set', 'Sir John', 'Clubs', 0,
    'The full Sir John set: a 10.5 degree driver, 3 wood, forged iron set and a blade putter, shown with the tour bag, premium grips and numbered headcovers. Built for a greater game — power, precision, control and confidence.',
    'Driver, fairway wood, irons and putter with matching headcovers.',
    '/images/Product/complete-club-set.png', 0, true),

  ('Tour Bag & Headcover Collection', 'tour-bag-headcover-collection', 'Sir John', 'Bags', 0,
    'Leather-look staff bag and lighter stand bag in black, white and gold, finished with the Sir John wordmark, a branded bag tag and a set of matching numbered headcovers.',
    'Staff bag, stand bag and matching headcover set.',
    '/images/Product/tour-bag-headcover-collection.png', 0, true),

  ('Golf Shoe Bag', 'golf-shoe-bag', 'Sir John', 'Bags', 0,
    'Zipped shoe bag in black with gold trim, mesh side panels for airflow, a front zip pocket for tees and markers, a top carry handle and a carabiner for the outside of your bag. Play. Honour. Belong.',
    'Ventilated shoe bag with a carabiner clip.',
    '/images/Product/golf-shoe-bag.png', 0, true),

  ('Tour Golf Ball', 'tour-golf-ball', 'Sir John', 'Balls', 0,
    'White dimpled tour ball carrying the Sir John logo.',
    'Sir John branded tour ball.',
    '/images/Product/tour-golf-ball.png', 0, true),

  ('Premium Golf Tees', 'premium-golf-tees', 'Sir John', 'Course Essentials', 0,
    'White wooden tees printed with the Sir John wordmark, presented in a black gift box. Small details make a bigger game.',
    'Boxed set of branded wooden tees.',
    '/images/Product/premium-golf-tees.png', 0, true),

  ('Golf Arm Band', 'golf-arm-band', 'Sir John', 'Apparel', 0,
    'Stretch neoprene band for the upper arm, with bound edges and a large Sir John logo print.',
    'Neoprene upper-arm band with the Sir John logo.',
    '/images/Product/golf-arm-band.png', 0, true),

  ('Compression Arm Sleeve', 'compression-arm-sleeve', 'Sir John', 'Apparel', 0,
    'Full-length compression sleeve in premium stretch fabric, with an anti-slip grip cuff and a premium logo print. UV protection, breathable, moisture wicking, flexible fit and all-day comfort.',
    'UV-protective compression sleeve for the full arm.',
    '/images/Product/compression-arm-sleeve.png', 0, true),

  ('Ball Cleaning Brush', 'ball-cleaning-brush', 'Sir John', 'Course Essentials', 0,
    'Two-sided brush with nylon bristles on one face and brass bristles on the other, a groove pick at the tip and a retractable reel carabiner that clips to your bag.',
    'Two-sided brush with a groove pick and retractable clip.',
    '/images/Product/ball-cleaning-brush.png', 0, true),

  ('Club Groove Brush', 'club-groove-brush', 'Sir John', 'Course Essentials', 0,
    'Nylon and steel wire bristles for cleaning grooves, a moulded rubber grip and a groove pick, on a retractable reel carabiner for your bag.',
    'Wire and nylon groove brush on a retractable clip.',
    '/images/Product/club-groove-brush.png', 0, true),

  ('Leather Ratchet Belt', 'leather-ratchet-belt', 'Sir John', 'Apparel', 0,
    'White leather belt with a black reverse and stitched edges, fastened by a brushed-steel ratchet buckle engraved with the Sir John wordmark. Supplied in a gift box. Style on and off the course.',
    'White leather belt with a ratchet buckle, boxed.',
    '/images/Product/leather-ratchet-belt.png', 0, true),

  ('Golf Cap', 'golf-cap', 'Sir John', 'Apparel', 0,
    'Structured white cap with a black-tipped peak, an embroidered Sir John logo on the front and the monogram on the side.',
    'White cap with an embroidered logo.',
    '/images/Product/golf-cap.png', 0, true),

  ('Ceramic Coffee Mug', 'ceramic-coffee-mug', 'Sir John', 'Drinkware', 0,
    'Premium ceramic mug with a black handle and interior, a gold sweep and the Sir John wordmark, presented in a gift box. Durable and easy to clean.',
    'Boxed ceramic mug in black, white and gold.',
    '/images/Product/ceramic-coffee-mug.png', 0, true),

  ('Golf Ball Marker', 'golf-ball-marker', 'Sir John', 'Course Essentials', 0,
    'Enamel ball marker with a polished gold rim and the Sir John logo. Mark your moments.',
    'Gold-rimmed enamel ball marker.',
    '/images/Product/golf-ball-marker.png', 0, true),

  ('Dartboard & Darts Gift Set', 'dartboard-darts-gift-set', 'Sir John', 'Gifts & Trophies', 0,
    'Dartboard finished in black, gold and green with golfer figures around the rim, supplied with six brass darts in golf-ball and black flights, a wooden dart stand and a lined presentation case. Same passion, different game.',
    'Golf-themed dartboard with six darts, boxed.',
    '/images/Product/dartboard-darts-gift-set.png', 0, true),

  ('Golf First Aid Kit', 'golf-first-aid-kit', 'Sir John', 'Wellness', 0,
    'Hard-shell zip case that clips to your bag, holding plasters, sterile gauze, antiseptic wipes and cream, alcohol prep pads, tape, cotton buds, scissors and tweezers.',
    'Compact course first aid kit with a carabiner.',
    '/images/Product/golf-first-aid-kit.png', 0, true),

  ('Leather Golf Glove', 'leather-golf-glove', 'Sir John', 'Apparel', 0,
    'Soft white leather glove with perforated panels across the back and fingers, a textured grip palm and a logo closure tab. Lightweight, breathable and durable, with premium comfort.',
    'Perforated leather glove with a grip palm.',
    '/images/Product/leather-golf-glove.png', 0, true),

  ('Hand Sanitizer 100 ml', 'hand-sanitizer-100ml', 'Sir John', 'Wellness', 0,
    'Gel hand sanitizer in a 100 ml pump bottle that kills 99.9% of germs and stays gentle on skin. Clean hands, brighter rounds.',
    '100 ml pump bottle sized for your bag.',
    '/images/Product/hand-sanitizer-100ml.png', 0, true),

  ('Premium Handkerchief', 'premium-handkerchief', 'Sir John', 'Apparel', 0,
    'White woven handkerchief with black and gold border stripes and an embroidered Sir John logo, in a gift box. A small detail for a bigger game.',
    'Boxed cotton handkerchief with a striped border.',
    '/images/Product/premium-handkerchief.png', 0, true),

  ('Golf Keychain', 'golf-keychain', 'Sir John', 'Accessories', 0,
    'Leather strap and split ring with an enamel logo medallion, a miniature iron and a golf ball charm. Supplied in a gift box. Carry your passion everywhere.',
    'Metal keychain with club and ball charms.',
    '/images/Product/golf-keychain.png', 0, true),

  ('Divot Repair Tool', 'divot-repair-tool', 'Sir John', 'Course Essentials', 0,
    'Brushed steel divot repair fork with a grippy thumb pad and a removable magnetic ball marker carrying the Sir John logo.',
    'Steel divot tool with a magnetic ball marker.',
    '/images/Product/divot-repair-tool.png', 0, true),

  ('Golf Pencils', 'golf-pencils', 'Sir John', 'Course Essentials', 0,
    'White scoring pencils with gold ferrules, erasers and the Sir John wordmark, in a zipped leather case. Small things make a greater game.',
    'Branded scoring pencils in a leather case.',
    '/images/Product/golf-pencils.png', 0, true),

  ('Cart Phone Holder', 'cart-phone-holder', 'Sir John', 'Accessories', 0,
    'Adjustable four-jaw phone cradle on a ball joint, with a padded clamp for a cart or trolley bar tightened by hand with a thumbwheel.',
    'Clamp mount phone holder for a cart or trolley.',
    '/images/Product/cart-phone-holder.png', 0, true),

  ('Leather Scorecard Holder', 'leather-scorecard-holder', 'Sir John', 'Course Essentials', 0,
    'Folding leather-look holder with a magnetic strap, a scorecard clip, a pocket for notes and elastic loops for three tees and a ball marker.',
    'Scorecard holder with tee and marker slots.',
    '/images/Product/leather-scorecard-holder.png', 0, true),

  ('Golf Scorecard', 'golf-scorecard', 'Sir John', 'Course Essentials', 0,
    'Fold-out scorecard with player, date, course and tee-box details, 18 holes of par, yardage, strokes and putts, out, in and total rows, and a signature line.',
    '18-hole scorecard with par, yardage and putts.',
    '/images/Product/golf-scorecard.png', 0, true),

  ('Spiked Golf Shoes', 'spiked-golf-shoes', 'Sir John', 'Footwear', 0,
    'Leather-look uppers in white with black and gold detailing, perforated vents and a black outsole with gold soft spikes. Premium craftsmanship, superior grip and all-day comfort.',
    'White and gold spiked golf shoes.',
    '/images/Product/spiked-golf-shoes.png', 0, true),

  ('Performance Golf Socks', 'performance-golf-socks', 'Sir John', 'Apparel', 0,
    'Ribbed white crew socks with black and gold stripes, cushioned heel and toe zones and arch support, in a gift box. Comfort for a greater game.',
    'Boxed crew socks with cushioned heel and toe.',
    '/images/Product/performance-golf-socks.png', 0, true),

  ('Golf Sunglasses', 'golf-sunglasses', 'Sir John', 'Accessories', 0,
    'Black and gold browline frame with a double bridge and dark lenses, supplied with a hard case and a cleaning cloth. Vision beyond the game.',
    'Metal and acetate sunglasses with a case.',
    '/images/Product/golf-sunglasses.png', 0, true),

  ('Golf Towel', 'golf-towel', 'Sir John', 'Course Essentials', 0,
    'Tri-fold waffle-weave towel with a brass grommet for your bag clip, black and gold border stripes and an embroidered logo. Super absorbent with a soft premium feel.',
    'Waffle-weave towel with a clip grommet.',
    '/images/Product/golf-towel.png', 0, true),

  ('Trophy & Award Collection', 'trophy-award-collection', 'Sir John', 'Gifts & Trophies', 0,
    'Five-piece award range for club days and society events: champion cup, crystal column, star and ball award, golfer figurine and crystal ball award, each on a black base with the Sir John logo and titles such as Winner, Longest Drive, Nearest the Pin and Best Performance.',
    'Five-piece trophy and award range for events.',
    '/images/Product/trophy-award-collection.png', 0, true),

  ('Golf Umbrella', 'golf-umbrella', 'Sir John', 'Course Essentials', 0,
    'Vented double canopy in black and white with gold piping, a strong frame and a leather-look grip, with a carry sleeve. Water repellent, wind resistant and UV protective.',
    'Double-canopy umbrella with a premium grip.',
    '/images/Product/golf-umbrella.png', 0, true),

  ('Golf Wristwatch', 'golf-wristwatch', 'Sir John', 'Accessories', 0,
    'Stainless steel case with a gold bezel, a green dial carrying a golfer motif and a course sub-dial, a textured green rubber strap and an engraved case back. Water resistant to 10 ATM, in a presentation box.',
    'Green-dial steel watch on a rubber strap.',
    '/images/Product/golf-wristwatch.png', 0, true),

  ('Insulated Water Bottle', 'insulated-water-bottle', 'Sir John', 'Drinkware', 0,
    'Double-walled stainless steel bottle with an easy-sip lid and carry handle, a wide mouth for cleaning and a sweat-proof matte finish. Keeps drinks cold for 24 hours and hot for 12. BPA free and leak proof.',
    'Stainless bottle: cold 24 hours, hot 12 hours.',
    '/images/Product/insulated-water-bottle.png', 0, true)
on conflict (slug) do nothing;
