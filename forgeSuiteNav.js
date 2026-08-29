(() => {
  const MODULES = [
    { key: 'home', label: 'Home', href: 'https://forge2-navy.vercel.app' },
    { key: 'crm', label: 'CRM', href: 'https://forge-crm-six.vercel.app' },
    { key: 'reader', label: 'Reader', href: 'https://robquotes.vercel.app' },
    { key: 'scope', label: 'Scope', active: true },
    { key: 'quoter', label: 'Quote / AI Quoter', href: 'https://lumber-estimator-ai.vercel.app' },
    { key: 'manufacturing', label: 'Manufacturing', href: 'https://forgemfg.vercel.app' },
    { key: 'portal', label: 'Portal', href: 'https://forge-portal-pi.vercel.app' }
  ];

  function installSidingScope() {
    if (typeof TYPES === 'undefined' || typeof SCHEMAS === 'undefined' || typeof COMMON_PROJECT === 'undefined') return;
    if (TYPES.siding && SCHEMAS.siding) return;

    TYPES.siding = {
      label: 'Siding',
      icon: 'panels-top-left',
      description: 'Exterior cladding, soffit, fascia, window/door trim and complete accessory takeoff'
    };

    SCHEMAS.siding = [
      {title:'Project Intake', icon:'clipboard-list', fields:COMMON_PROJECT},
      {title:'Building & Exterior Geometry', icon:'ruler', fields:[
        {key:'projectCondition',label:'Project Condition',type:'select',options:['New Construction','Addition','Renovation / Re-Side','Repair / Partial Elevations']},
        {key:'storeys',label:'Storeys / Wall Heights',placeholder:'1 storey 9\' walls; 2 storey 9\' + 8\''},
        {key:'elevationsIncluded',label:'Elevations Included',type:'textarea',placeholder:'Front, rear, left, right, garage, dormers, bump-outs'},
        {key:'wallAreas',label:'Wall Areas / Dimensions',type:'textarea',placeholder:'Dimensions or net/gross sq.ft. by elevation'},
        {key:'gableAreas',label:'Gables / Peaks',type:'textarea',placeholder:'Base, height, pitch and quantity'},
        {key:'bumpouts',label:'Bump-Outs / Bay Windows / Projections',type:'textarea',placeholder:'Locations and dimensions'},
        {key:'dormers',label:'Dormers',type:'textarea',placeholder:'Quantity, dimensions, cladding and trim conditions'},
        {key:'walkouts',label:'Walkout / Exposed Foundation Conditions',placeholder:'Describe stepped grades or tall rear elevations'},
        {key:'wasteFactor',label:'Siding Waste Factor',placeholder:'10% typical; adjust for product/layout'},
      ]},
      {title:'Siding / Cladding', icon:'panels-top-left', fields:[
        {key:'sidingManufacturer',label:'Manufacturer / Product Line',placeholder:'LP SmartSide, James Hardie, Kaycan, Mitten, Maibec, etc.'},
        {key:'sidingMaterial',label:'Cladding Type',type:'select',options:['Vinyl','Fiber Cement','Engineered Wood','Wood','Steel / Aluminum','Composite','Stone / Masonry','Mixed Cladding','Other']},
        {key:'sidingProfile',label:'Profile / Style',placeholder:'Lap, board & batten, shake, panel, vertical, horizontal'},
        {key:'sidingExposure',label:'Exposure / Coverage',placeholder:'7 in exposure / 16 in panel / manufacturer coverage'},
        {key:'sidingColour',label:'Colour / Finish',placeholder:'Colour name / code'},
        {key:'sidingByElevation',label:'Siding by Elevation',type:'textarea',placeholder:'Front: product/colour/area; Rear: product/colour/area; etc.'},
        {key:'accentCladding',label:'Accent Cladding',type:'textarea',placeholder:'Shakes, board & batten, stone, feature walls and locations'},
        {key:'starterStrip',label:'Starter Strip',placeholder:'Type and total LF'},
        {key:'undersillFinish',label:'Undersill / Finish Trim',placeholder:'Type and total LF'},
        {key:'jChannel',label:'J-Channel / Receiver',placeholder:'Size, colour and total LF'},
        {key:'insideCorners',label:'Inside Corners',placeholder:'Profile, colour, quantity / LF'},
        {key:'outsideCorners',label:'Outside Corners',placeholder:'Profile, width, colour, quantity / LF'},
        {key:'horizontalTransitions',label:'Horizontal Transitions / Band Boards',type:'textarea',placeholder:'Belly bands, water tables, Z-flashing, transition trims'},
        {key:'verticalTransitions',label:'Vertical Transitions',type:'textarea',placeholder:'Material changes, board-and-batten transitions, H-channel'},
      ]},
      {title:'Soffit', icon:'panel-top', fields:[
        {key:'soffitMaterial',label:'Soffit Material / Product',placeholder:'Aluminum, vinyl, engineered wood, fiber cement'},
        {key:'soffitColour',label:'Soffit Colour',placeholder:'Colour name / code'},
        {key:'soffitProfile',label:'Soffit Profile',placeholder:'Vented / solid / combination; panel width'},
        {key:'eaveSoffit',label:'Eave Soffit',type:'textarea',placeholder:'LF x overhang depth by roof/elevation'},
        {key:'gableSoffit',label:'Gable / Rake Soffit',type:'textarea',placeholder:'LF x overhang depth'},
        {key:'porchSoffit',label:'Porch / Ceiling Soffit',type:'textarea',placeholder:'Area, direction, vented/solid, beam conditions'},
        {key:'coveredAreas',label:'Covered Decks / Canopies / Other Ceilings',type:'textarea',placeholder:'Areas requiring soffit or ceiling panels'},
        {key:'soffitVentilation',label:'Ventilation Requirement',placeholder:'Continuous vented soffit / alternating panels / NFA requirement'},
        {key:'soffitReceivers',label:'Soffit J / F Channel / Receivers',placeholder:'Type, colour and total LF'},
        {key:'soffitWaste',label:'Soffit Waste Factor',placeholder:'5–10% typical'},
      ]},
      {title:'Fascia & Rake', icon:'move-horizontal', fields:[
        {key:'fasciaMaterial',label:'Fascia Material',placeholder:'Aluminum fascia, composite, LP, Hardie, wood + cap'},
        {key:'fasciaColour',label:'Fascia Colour',placeholder:'Colour name / code'},
        {key:'fasciaWidth',label:'Fascia Width / Size',placeholder:'6 in, 8 in, 10 in, custom brake shape'},
        {key:'eaveFascia',label:'Eave Fascia',placeholder:'Total LF'},
        {key:'rakeFascia',label:'Rake / Gable Fascia',placeholder:'Total LF'},
        {key:'subFascia',label:'Sub-Fascia / Build-Out',placeholder:'Existing/new lumber size or build-out required'},
        {key:'fasciaTransitions',label:'Fascia Transitions / Returns',type:'textarea',placeholder:'Gable returns, boxed returns, roof intersections, step conditions'},
        {key:'fasciaWaste',label:'Fascia Waste Factor',placeholder:'5–10% typical'},
      ]},
      {title:'Windows, Doors & Opening Trim', icon:'scan', fields:[
        {key:'windowCount',label:'Window Count',placeholder:'Total quantity; verify schedule vs elevations'},
        {key:'windowTrimProduct',label:'Window Trim Product / Width',placeholder:'4/4 x 4, 5/4 x 6, aluminum, J-channel only, etc.'},
        {key:'windowTrimColour',label:'Window Trim Colour',placeholder:'Colour / finish'},
        {key:'windowTrimSchedule',label:'Window Trim Schedule',type:'textarea',placeholder:'List W1/W2/etc., size, qty, perimeter LF and trim condition'},
        {key:'windowHeaders',label:'Window Head Trim / Drip Cap',placeholder:'Head flashing / cap type and total LF'},
        {key:'windowSills',label:'Window Sill / Bottom Trim',placeholder:'Sill trim, apron, sill pan condition'},
        {key:'doorCount',label:'Exterior Door Count',placeholder:'Entry, patio, garden, service doors'},
        {key:'doorTrim',label:'Door Trim',type:'textarea',placeholder:'Sizes, perimeter LF, trim width/profile and colour'},
        {key:'garageDoors',label:'Garage Door Trim',type:'textarea',placeholder:'Opening sizes, perimeter trim, weather seal / aluminum capping'},
        {key:'otherOpenings',label:'Other Openings',type:'textarea',placeholder:'Louvers, vents, access doors, hose bibs, meter bases, penetrations'},
      ]},
      {title:'Architectural & Specialty Trims', icon:'frame', fields:[
        {key:'friezeBoard',label:'Frieze Board / Eave Trim',placeholder:'Width, product, colour and LF'},
        {key:'bandBoard',label:'Band / Belly Board',placeholder:'Width, product, colour and LF'},
        {key:'waterTable',label:'Water Table / Base Trim',placeholder:'Profile, flashing and LF'},
        {key:'gableTrim',label:'Gable / Peak Trim',type:'textarea',placeholder:'Frieze, rake trim, decorative peak details'},
        {key:'columnsPosts',label:'Columns / Posts',type:'textarea',placeholder:'Quantity, dimensions, wrap material, trim build-up'},
        {key:'beams',label:'Beam Wraps',type:'textarea',placeholder:'Dimensions, LF and material'},
        {key:'garageTrim',label:'Garage / Large Opening Build-Outs',type:'textarea',placeholder:'Wide trims, jamb cladding, headers, decorative details'},
        {key:'shutters',label:'Shutters / Decorative Accessories',placeholder:'Quantity, size, colour'},
        {key:'mountingBlocks',label:'Mounting Blocks',type:'textarea',placeholder:'Lights, outlets, hose bibs, vents, meters — type/qty/colour'},
        {key:'vents',label:'Exterior Vents',type:'textarea',placeholder:'Dryer, bath, range, gable vents — size/qty/colour'},
        {key:'customBrakeMetal',label:'Custom Brake Metal / Capping',type:'textarea',placeholder:'Windows, doors, beams, fascia, transitions — dimensions and LF'},
      ]},
      {title:'Weather Barrier, Flashing & Accessories', icon:'shield', fields:[
        {key:'housewrap',label:'WRB / Housewrap',placeholder:'Tyvek/Typar/etc.; rolls or sq.ft.'},
        {key:'seamTape',label:'WRB Tape / Flashing Tape',placeholder:'Widths, rolls and locations'},
        {key:'windowFlashing',label:'Window / Door Flashing',placeholder:'Sill, jamb and head flashing requirements'},
        {key:'kickoutFlashing',label:'Kick-Out / Roof-to-Wall Flashing',placeholder:'Locations / quantity'},
        {key:'zFlashing',label:'Z-Flashing / Cap Flashing',placeholder:'Transitions, band boards, openings — LF'},
        {key:'rainScreen',label:'Rainscreen / Furring',placeholder:'Required? material, spacing and quantity'},
        {key:'fasteners',label:'Fasteners',type:'textarea',placeholder:'Siding nails/screws, trim nails, colour-matched fasteners'},
        {key:'sealant',label:'Sealant / Caulking',placeholder:'Type, colour and tubes'},
        {key:'touchup',label:'Touch-Up Paint / Finish',placeholder:'Colour and quantity'},
        {key:'bugScreen',label:'Bug Screen / Vent Strip',placeholder:'Base/rainscreen venting requirements'},
      ]},
      {title:'Existing Conditions / Renovation', icon:'hammer', fields:[
        {key:'existingCladding',label:'Existing Cladding',placeholder:'Vinyl, aluminum, wood, stucco, etc.'},
        {key:'removal',label:'Removal / Disposal',type:'textarea',placeholder:'By customer/contractor or included; layers/areas'},
        {key:'existingSheathing',label:'Existing Sheathing Condition',placeholder:'Known condition / verify after removal'},
        {key:'wallBuildout',label:'Wall Build-Out / Insulation',placeholder:'Exterior foam, furring, leveling, substrate corrections'},
        {key:'existingOpenings',label:'Existing Window / Door Capping',placeholder:'Reuse, remove, replace, integrate'},
        {key:'tieIns',label:'Tie-Ins to Existing Finishes',type:'textarea',placeholder:'Brick, stone, stucco, roofs, decks, additions'},
      ]},
      {title:'Takeoff Controls & QC', icon:'calculator', fields:[
        {key:'openingDeduction',label:'Opening Deduction Method',type:'select',options:['Gross Wall Area — No Deductions','Deduct Large Openings Only','Net Wall Area','Product-Specific Method']},
        {key:'sidingOrderUnits',label:'Siding Order Units',placeholder:'Pieces / squares / cartons / full lifts'},
        {key:'soffitOrderUnits',label:'Soffit Order Units',placeholder:'Pieces / cartons / sq.ft.'},
        {key:'trimOrderUnits',label:'Trim Order Units',placeholder:'10 ft / 12 ft / 16 ft pieces; cartons'},
        {key:'fullLiftRules',label:'Full Lift / Pack Requirements',type:'textarea',placeholder:'Products that must be ordered by full lift/carton/package'},
        {key:'colourCheck',label:'Colour Match / Dye Lot Check',placeholder:'Confirm all siding, soffit, fascia and trims coordinate'},
        {key:'drawingCrosscheck',label:'Drawing Cross-Check',type:'textarea',placeholder:'Compare elevations, floor plans, window schedule, roof plan and details'},
        {key:'supplierCrosscheck',label:'Supplier / Manufacturer Cross-Check',type:'textarea',placeholder:'Coverage, accessory requirements, installation clearances and current packaging'},
      ]},
      {title:'Assumptions, RFIs & QC', icon:'shield-check', fields:[
        {key:'assumptions',label:'Estimator Assumptions',type:'textarea',placeholder:'List anything assumed for quote'},
        {key:'rfi',label:'RFIs / Missing Information',type:'textarea',placeholder:'Missing dimensions, colours, profiles, trim details, product selections'},
        {key:'conflicts',label:'Drawing Conflicts',type:'textarea',placeholder:'Conflicting elevations, schedules, details or revisions'},
        {key:'itemsByOthers',label:'Items By Others / Exclusions',type:'textarea',placeholder:'Eavestrough, installation, disposal, insulation, masonry, etc.'},
        {key:'finalNotes',label:'Final Estimator Notes',type:'textarea',placeholder:'Anything the salesperson should know before quoting'},
      ]}
    ];
  }

  function installStyles() {
    if (document.getElementById('forge-suite-nav-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-suite-nav-style';
    style.textContent = `
      .forge-suite-switcher{margin:2px 0 14px;padding:0 0 14px;border-bottom:1px solid var(--forge-border-soft,#21242a)}
      .forge-suite-label{padding:0 12px 6px;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--forge-muted,#6f747d)}
      .forge-suite-link{display:flex;align-items:center;justify-content:space-between;margin:2px 0;padding:10px 14px;border:1px solid transparent;border-radius:9px;color:var(--forge-secondary,#a5a9b1);font-size:14px;font-weight:650;text-decoration:none;transition:140ms ease}
      .forge-suite-link:hover{color:#fff;background:#17191d}
      .forge-suite-link.active{color:#fff;background:rgba(255,118,23,.10);border-color:rgba(255,118,23,.18)}
      .forge-suite-link.disabled{opacity:.4;cursor:default}
      .forge-suite-dot{width:7px;height:7px;border-radius:999px;background:var(--forge-accent,#ff7617);box-shadow:0 0 0 4px rgba(255,118,23,.10)}
      .forge-suite-arrow,.forge-suite-next{font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--forge-muted,#6f747d)}
    `;
    document.head.appendChild(style);
  }

  function markup() {
    return `<div id="forge-suite-nav" class="forge-suite-switcher">
      <div class="forge-suite-label">Forge Suite</div>
      ${MODULES.map(module => {
        if (module.active) return `<div class="forge-suite-link active"><span>${module.label}</span><span class="forge-suite-dot"></span></div>`;
        if (module.comingSoon) return `<div class="forge-suite-link disabled"><span>${module.label}</span><span class="forge-suite-next">Next</span></div>`;
        return `<a class="forge-suite-link" href="${module.href}"><span>${module.label}</span><span class="forge-suite-arrow">↗</span></a>`;
      }).join('')}
    </div>`;
  }

  function injectSidingShortcut() {
    const nav = document.querySelector('aside nav');
    if (!nav || document.getElementById('forge-siding-template-link')) return;
    const deckButton = [...nav.querySelectorAll('button')].find(btn => btn.textContent.trim().includes('Decks'));
    if (!deckButton) return;
    deckButton.insertAdjacentHTML('afterend', `<button id="forge-siding-template-link" onclick="startNew('siding','manual')" class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition text-slate-400 hover:text-white hover:bg-slate-800/60"><span class="flex items-center gap-3"><i data-lucide="panels-top-left" class="w-5 h-5"></i><span class="font-medium">Siding</span></span></button>`);
    if (window.lucide) lucide.createIcons();
  }

  function inject() {
    const nav = document.querySelector('aside nav');
    if (!nav || document.getElementById('forge-suite-nav')) return;
    nav.insertAdjacentHTML('afterbegin', markup());
    injectSidingShortcut();
  }

  installSidingScope();
  installStyles();
  if (typeof render === 'function') {
    const priorRender = render;
    render = function forgeSuiteNavigationRenderWrapper() {
      installSidingScope();
      priorRender();
      inject();
      injectSidingShortcut();
    };
  }
  inject();
  injectSidingShortcut();
})();
