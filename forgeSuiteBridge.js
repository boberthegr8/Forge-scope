(() => {
  const BRIDGE_PROTOCOL = 'forge-suite-bridge';
  const BRIDGE_VERSION = 1;
  const DEFAULT_CRM_URL = 'https://forge-crm-six.vercel.app';

  function installResidentialTemplates() {
    if (typeof TYPES === 'undefined' || typeof SCHEMAS === 'undefined' || typeof COMMON_PROJECT === 'undefined') return false;

    TYPES.singleStorey = {
      label: 'Single Storey Home',
      icon: 'house',
      description: 'One-level residential homes on slab, crawlspace or basement foundations'
    };
    TYPES.twoStorey = {
      label: 'Two Storey Home',
      icon: 'building-2',
      description: 'Two-storey residential framing with separate floor and wall systems'
    };
    TYPES.bungalow = {
      label: 'Bungalow',
      icon: 'home',
      description: 'Bungalow framing with basement or foundation, main floor and roof scope'
    };

    const classificationFields = (defaultStoreys) => [
      {key:'projectCondition',label:'Project Condition',type:'select',options:['New Building','Addition','Renovation']},
      {key:'homeStyle',label:'Home / Building Style',placeholder:'Detached home, bungalow, ranch, cottage, etc.'},
      {key:'storeys',label:'Storeys',placeholder:defaultStoreys},
      {key:'foundationCondition',label:'Foundation Condition',type:'select',options:['Full Basement','Walkout Basement','Crawlspace','Slab-on-Grade','Mixed / Stepped','Other']},
      {key:'garageCondition',label:'Garage',placeholder:'None / attached / detached / size / storeys'},
      {key:'heatedArea',label:'Approx. Heated Floor Area',placeholder:'Square footage if shown'},
      {key:'ceilingHeights',label:'Ceiling Heights',placeholder:'8\', 9\', 10\', vaulted areas, etc.'},
      {key:'constructionNotes',label:'General Construction Notes',type:'textarea',placeholder:'Construction type, special conditions, additions, fire separations, etc.'}
    ];

    const geometryFields = [
      {key:'mainWidth',label:'Main Building Width',placeholder:'Overall width'},
      {key:'mainLength',label:'Main Building Length',placeholder:'Overall length'},
      {key:'footprintBreakdown',label:'Footprint / Wing Breakdown',type:'textarea',placeholder:'Main rectangle, garage, bump-outs, porches, additions'},
      {key:'foundationDims',label:'Foundation Dimensions',type:'textarea',placeholder:'Overall dimensions plus jogs / offsets'},
      {key:'mainWallHeight',label:'Main Exterior Wall Height',placeholder:'Plate / stud height'},
      {key:'overallHeight',label:'Overall / Ridge Height',placeholder:'If shown'},
      {key:'gradeChanges',label:'Grade / Walkout / Step Conditions',type:'textarea',placeholder:'Walkout walls, stepped foundation, split levels'},
      {key:'attachedAreas',label:'Attached Areas',type:'textarea',placeholder:'Garage, porch, deck, mudroom, sunroom, canopy, etc.'}
    ];

    const foundationFields = [
      {key:'foundationSystem',label:'Foundation System',type:'textarea',placeholder:'Poured wall, ICF, block, slab, crawlspace, mixed'},
      {key:'foundationWall',label:'Foundation Wall Size / Height',placeholder:'8" x 8\', 10" x 9\', etc.'},
      {key:'footings',label:'Footings',placeholder:'Width x thickness and any steps'},
      {key:'foundationOpenings',label:'Foundation Openings',type:'textarea',placeholder:'Windows, walkout doors, beam pockets, vents'},
      {key:'basementBearing',label:'Basement Bearing Walls / Beams',type:'textarea',placeholder:'Bearing wall lines, steel/LVL beams, flush/dropped'},
      {key:'basementPosts',label:'Basement Posts / Columns',placeholder:'Type, size, quantity / spacing'},
      {key:'pads',label:'Column Pads / Point Footings',placeholder:'Size and locations'},
      {key:'slab',label:'Basement / Ground Slab',placeholder:'Thickness and base if in scope'},
      {key:'sillPlate',label:'Sill Plate / Gasket',placeholder:'2x6 PT sill + gasket'},
      {key:'anchorBolts',label:'Anchor Bolts / Foundation Anchors',placeholder:'Size and spacing'},
      {key:'foundationInsulation',label:'Foundation Insulation / Waterproofing',type:'textarea',placeholder:'Only if included in material scope'}
    ];

    const floorFields = (prefix, label) => [
      {key:`${prefix}floorType`,label:`${label} Floor System`,type:'select',options:['I-Joists','Open Web Floor Trusses','Dimensional Lumber','Mixed / Engineered','Slab / No Framed Floor','Other']},
      {key:`${prefix}joists`,label:'Joists / Floor Trusses',placeholder:'Size, series and spacing'},
      {key:`${prefix}spanDirection`,label:'Span Direction / Bearing',type:'textarea',placeholder:'Bearing-to-bearing direction and support lines'},
      {key:`${prefix}beams`,label:'Beams / Girders',type:'textarea',placeholder:'LVL, steel, PSL, built-up lumber; flush or dropped'},
      {key:`${prefix}posts`,label:'Posts / Columns',placeholder:'Sizes and locations'},
      {key:`${prefix}rim`,label:'Rim Board / Blocking',placeholder:'Rim size, squash blocks, solid blocking'},
      {key:`${prefix}subfloor`,label:'Subfloor',placeholder:'23/32 T&G OSB / plywood / adhesive'},
      {key:`${prefix}openings`,label:'Floor Openings',type:'textarea',placeholder:'Stairs, fireplace, mechanical, plumbing, double joists'},
      {key:`${prefix}cantilevers`,label:'Cantilevers / Dropped Areas',type:'textarea',placeholder:'Bay windows, balconies, sunken areas, offsets'},
      {key:`${prefix}hardware`,label:'Floor Hardware / Hangers',type:'textarea',placeholder:'Hangers, straps, connectors, special fastening'}
    ];

    const exteriorWallFields = (prefix, label) => [
      {key:`${prefix}wallHeight`,label:`${label} Exterior Wall Height`,placeholder:'Stud / plate height'},
      {key:`${prefix}studs`,label:'Exterior Studs',placeholder:'2x6 @ 16" o.c. / other'},
      {key:`${prefix}plates`,label:'Exterior Wall Plates',placeholder:'Bottom + double top / special PT plates'},
      {key:`${prefix}sheathing`,label:'Exterior Wall Sheathing',placeholder:'7/16 OSB / plywood / structural panels'},
      {key:`${prefix}tallWalls`,label:'Tall / High Walls',type:'textarea',placeholder:'Great room, stairwell, foyer, balloon framing'},
      {key:`${prefix}gableWalls`,label:'Gable / Rake Walls',type:'textarea',placeholder:'Gable-end framing, rake studs, dropped gables'},
      {key:`${prefix}shearWalls`,label:'Shearwalls / Braced Wall Panels',type:'textarea',placeholder:'Panel thickness, nailing, hold-downs, locations'},
      {key:`${prefix}blocking`,label:'Blocking / Backing',type:'textarea',placeholder:'Mid-height blocking, cabinet backing, rail backing, soffit backing'},
      {key:`${prefix}specialWalls`,label:'Special Exterior Wall Conditions',type:'textarea',placeholder:'Double walls, staggered walls, party/fire walls, stone ledges'}
    ];

    const interiorWallFields = (prefix, label) => [
      {key:`${prefix}bearingWalls`,label:`${label} Bearing Walls`,type:'textarea',placeholder:'2x4 / 2x6, locations and heights'},
      {key:`${prefix}nonBearingWalls`,label:'Non-Bearing Interior Walls',placeholder:'2x4 @ 16" o.c. / other'},
      {key:`${prefix}wetWalls`,label:'Plumbing / Wet Walls',placeholder:'2x6 walls or special conditions'},
      {key:`${prefix}stairWalls`,label:'Stair / Open-to-Below Walls',type:'textarea',placeholder:'Tall walls, guards, backing, stair support'},
      {key:`${prefix}fireWalls`,label:'Garage / Fire Separation Walls',type:'textarea',placeholder:'Required framing/sheathing conditions'},
      {key:`${prefix}interiorHeights`,label:'Interior Wall Heights / Bulkheads',type:'textarea',placeholder:'Standard height plus special walls / dropped ceilings'}
    ];

    const openingFields = [
      {key:'windowSchedule',label:'Window Schedule / RSO',type:'textarea',placeholder:'Sizes, types and quantities by floor'},
      {key:'doorSchedule',label:'Exterior Door Schedule / RSO',type:'textarea',placeholder:'Entry, patio, garden, service, overhead doors'},
      {key:'headers',label:'Headers / Lintels',type:'textarea',placeholder:'Opening, header size, plies, bearing, jacks/kings'},
      {key:'engineeredHeaders',label:'LVL / Engineered Headers',type:'textarea',placeholder:'LVL/LSL/PSL sizes and locations'},
      {key:'garageDoors',label:'Garage Door Openings',type:'textarea',placeholder:'Widths, heights, header / lintel requirements'},
      {key:'specialOpenings',label:'Special Openings',type:'textarea',placeholder:'Large glazing, multi-panel doors, pass-throughs, arches'},
      {key:'openingNotes',label:'Opening Notes / Conflicts',type:'textarea',placeholder:'RSO conflicts, missing schedules, header RFIs'}
    ];

    const roofFields = [
      {key:'roofType',label:'Main Roof Type',type:'select',options:['Gable','Hip','Combination','Mono-Slope','Mansard','Other']},
      {key:'roofPitch',label:'Roof Pitch(es)',placeholder:'6/12 main, 4/12 porch, etc.'},
      {key:'roofFraming',label:'Roof Framing',type:'select',options:['Pre-Engineered Trusses','Stick Framed Rafters','Mixed Truss + Stick','Other']},
      {key:'trussSpacing',label:'Truss / Rafter Spacing',placeholder:'24" o.c. / 16" o.c.'},
      {key:'trussSpans',label:'Truss Spans / Bearing Lines',type:'textarea',placeholder:'Main spans, garage spans, internal bearing points'},
      {key:'heelHeight',label:'Heel Height / Energy Heel',placeholder:'If specified'},
      {key:'overhangs',label:'Eave / Gable Overhangs',placeholder:'12", 16", 24", varying'},
      {key:'specialTrusses',label:'Special Trusses',type:'textarea',placeholder:'Girders, dropped gables, piggybacks, scissor, attic, tray, mono'},
      {key:'valleys',label:'Valleys / Overbuilds / Roof Intersections',type:'textarea',placeholder:'Valley sets, porch tie-ins, garage roof tie-ins'},
      {key:'roofOpenings',label:'Roof Openings / Loads',type:'textarea',placeholder:'Chimneys, skylights, HVAC, solar, point loads'},
      {key:'roofSheathing',label:'Roof Sheathing / Strapping',placeholder:'1/2 OSB / plywood / strapping'},
      {key:'fascia',label:'Wood Fascia / Subfascia',placeholder:'2x6 / 2x8 / other'},
      {key:'roofBracing',label:'Permanent Truss / Roof Bracing',type:'textarea',placeholder:'As truss drawings / structural plans require'},
      {key:'roofFinish',label:'Roof Finish',placeholder:'Shingles / steel / supplied by others'},
      {key:'soffitFasciaFinish',label:'Soffit / Metal Fascia / Eavestrough',type:'textarea',placeholder:'Material and whether included / by others'}
    ];

    const exteriorMaterialFields = [
      {key:'wallCladding',label:'Exterior Cladding',type:'textarea',placeholder:'Vinyl, LP, Hardie, brick, stone, steel; areas / combinations'},
      {key:'housewrap',label:'Air / Weather Barrier',placeholder:'Housewrap / membrane / taped sheathing'},
      {key:'exteriorInsulation',label:'Exterior Continuous Insulation',placeholder:'Type / thickness if applicable'},
      {key:'wallInsulation',label:'Wall Insulation / Vapour Barrier',type:'textarea',placeholder:'Only if included in material scope'},
      {key:'exteriorTrim',label:'Exterior Trim / Accessories',type:'textarea',placeholder:'Corners, J, starter, trims, flashing, tapes'},
      {key:'porchesDecks',label:'Porches / Decks / Exterior Framing',type:'textarea',placeholder:'Posts, beams, joists, decking, stairs, railing if included'},
      {key:'itemsByOthers',label:'Items By Owner / Others',type:'textarea',placeholder:'Trusses, windows, doors, roofing, siding, concrete, etc.'}
    ];

    const structuralFields = [
      {key:'ewpSupplier',label:'EWP / Truss Supplier',placeholder:'Supplier if known'},
      {key:'lvlPslLsl',label:'LVL / PSL / LSL Members',type:'textarea',placeholder:'Member sizes, plies, lengths and locations'},
      {key:'steelBeams',label:'Structural Steel',type:'textarea',placeholder:'Steel beams, columns, lintels, plates if applicable'},
      {key:'hangersConnectors',label:'Hangers / Connectors / Hold-Downs',type:'textarea',placeholder:'Simpson / MiTek models, straps, post caps, hangers'},
      {key:'stairs',label:'Stair Framing',type:'textarea',placeholder:'Openings, stringers, landings, beams, stair supplier'},
      {key:'fireplace',label:'Fireplace / Chase Framing',type:'textarea',placeholder:'Framed chase, clearances, roof opening'},
      {key:'specialFraming',label:'Special Framing',type:'textarea',placeholder:'Vaults, tray ceilings, feature walls, dropped beams, niches'},
      {key:'temporaryPermanentBracing',label:'Bracing Requirements',type:'textarea',placeholder:'Permanent bracing shown on structural / truss drawings'}
    ];

    const qcFields = [
      {key:'assumptions',label:'Estimator Assumptions',type:'textarea',placeholder:'Anything assumed for quote'},
      {key:'rfi',label:'RFIs / Missing Information',type:'textarea',placeholder:'Information needed before final quote'},
      {key:'conflicts',label:'Drawing Conflicts',type:'textarea',placeholder:'Conflicting dimensions, schedules, structural / architectural details'},
      {key:'excludedMaterials',label:'Scope Exclusions / By Others',type:'textarea',placeholder:'Confirm all excluded materials and labour'},
      {key:'finalNotes',label:'Final Estimator Notes',type:'textarea',placeholder:'Anything the salesperson or purchaser should know'}
    ];

    const oneStoreySchema = (styleLabel, storeysDefault, includeBungalowNotes = false) => [
      {title:'Project Intake',icon:'clipboard-list',fields:COMMON_PROJECT},
      {title:'Home Classification',icon:'house',fields:[...classificationFields(storeysDefault), ...(includeBungalowNotes ? [{key:'bungalowCondition',label:'Bungalow Layout Notes',type:'textarea',placeholder:'Raised bungalow, walkout, split entry, cathedral areas, attached garage'}] : [])]},
      {title:'Building Geometry',icon:'ruler',fields:geometryFields},
      {title:'Foundation / Basement',icon:'layers-3',fields:foundationFields},
      {title:'Main Floor — Floor System',icon:'rows-3',fields:floorFields('main','Main Floor')},
      {title:'Main Floor — Exterior Walls',icon:'panels-top-left',fields:exteriorWallFields('main','Main Floor')},
      {title:'Main Floor — Interior Walls',icon:'columns-3',fields:interiorWallFields('main','Main Floor')},
      {title:'Openings & Headers',icon:'door-open',fields:openingFields},
      {title:'Roof / Truss Handoff',icon:'triangle',fields:roofFields},
      {title:'Exterior Materials',icon:'package-open',fields:exteriorMaterialFields},
      {title:'Structural / EWP / Hardware',icon:'blocks',fields:structuralFields},
      {title:'Assumptions, RFIs & QC',icon:'shield-check',fields:qcFields}
    ];

    const twoStoreySchema = [
      {title:'Project Intake',icon:'clipboard-list',fields:COMMON_PROJECT},
      {title:'Home Classification',icon:'building-2',fields:classificationFields('2 storeys')},
      {title:'Building Geometry',icon:'ruler',fields:geometryFields},
      {title:'Foundation / Basement',icon:'layers-3',fields:foundationFields},
      {title:'1st Floor — Floor System',icon:'rows-3',fields:floorFields('first','1st Floor')},
      {title:'1st Floor — Exterior Walls',icon:'panels-top-left',fields:exteriorWallFields('first','1st Floor')},
      {title:'1st Floor — Interior Walls',icon:'columns-3',fields:interiorWallFields('first','1st Floor')},
      {title:'2nd Floor — Floor System',icon:'rows-3',fields:floorFields('second','2nd Floor')},
      {title:'2nd Floor — Exterior Walls',icon:'panels-top-left',fields:exteriorWallFields('second','2nd Floor')},
      {title:'2nd Floor — Interior Walls',icon:'columns-3',fields:interiorWallFields('second','2nd Floor')},
      {title:'Openings & Headers',icon:'door-open',fields:openingFields},
      {title:'Roof / Truss Handoff',icon:'triangle',fields:roofFields},
      {title:'Exterior Materials',icon:'package-open',fields:exteriorMaterialFields},
      {title:'Structural / EWP / Hardware',icon:'blocks',fields:structuralFields},
      {title:'Assumptions, RFIs & QC',icon:'shield-check',fields:qcFields}
    ];

    SCHEMAS.singleStorey = oneStoreySchema('Single Storey Home','1 storey');
    SCHEMAS.twoStorey = twoStoreySchema;
    SCHEMAS.bungalow = oneStoreySchema('Bungalow','1 storey',true);
    return true;
  }

  const residentialTemplatesInstalled = installResidentialTemplates();

  function crmUrl() {
    const override = new URLSearchParams(window.location.search).get('forgeCrm');
    if (override) {
      try {
        const url = new URL(override);
        if (url.protocol === 'https:' || url.hostname === 'localhost') return url.origin;
      } catch {}
    }
    return DEFAULT_CRM_URL;
  }

  function bridgePayload() {
    if (typeof current === 'undefined' || !current) return null;
    return {
      protocol: BRIDGE_PROTOCOL,
      version: BRIDGE_VERSION,
      action: 'scope.upsert',
      sourceApp: 'forge-scope',
      sentAt: new Date().toISOString(),
      scope: JSON.parse(JSON.stringify(current))
    };
  }

  function setButtonState(text, disabled = false) {
    const button = document.getElementById('forge-send-crm');
    if (!button) return;
    button.disabled = disabled;
    const label = button.querySelector('[data-label]');
    if (label) label.textContent = text;
    button.classList.toggle('opacity-60', disabled);
    button.classList.toggle('cursor-wait', disabled);
  }

  function sendToCRM() {
    const payload = bridgePayload();
    if (!payload) {
      window.alert('Open or create a Forge Scope first.');
      return;
    }

    if (typeof upsertCurrent === 'function') upsertCurrent();

    const target = crmUrl();
    const targetOrigin = new URL(target).origin;
    let completed = false;
    setButtonState('Opening CRM…', true);

    // A fresh tab guarantees Forge CRM has this Scope tab as window.opener,
    // which gives the two separate Vercel apps a safe postMessage handshake.
    const crmWindow = window.open(`${target}/#/projects`, '_blank');
    if (!crmWindow) {
      setButtonState('Send to CRM', false);
      window.alert('Your browser blocked the CRM window. Allow pop-ups for Forge Scope and try again.');
      return;
    }

    const readyHandler = (event) => {
      if (event.origin !== targetOrigin) return;
      const message = event.data;
      if (!message || message.protocol !== BRIDGE_PROTOCOL || message.version !== BRIDGE_VERSION || message.action !== 'crm.ready') return;
      completed = true;
      window.removeEventListener('message', readyHandler);
      crmWindow.postMessage(payload, targetOrigin);
      setButtonState('Sent to CRM', false);
      setTimeout(() => setButtonState('Send to CRM', false), 2200);
    };

    window.addEventListener('message', readyHandler);

    setTimeout(() => {
      if (completed) return;
      window.removeEventListener('message', readyHandler);
      setButtonState('Send to CRM', false);
      window.alert('Forge CRM opened, but the bridge did not answer. Refresh the CRM tab and try Send to CRM again.');
    }, 10000);
  }

  function injectButton() {
    if (typeof current === 'undefined' || !current) return;
    if (typeof view !== 'undefined' && !['editor', 'summary', 'ai'].includes(view)) return;
    if (document.getElementById('forge-send-crm')) return;

    const headerActions = document.querySelector('header .flex.items-center.gap-3');
    if (!headerActions) return;

    const button = document.createElement('button');
    button.id = 'forge-send-crm';
    button.type = 'button';
    button.className = 'px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition';
    button.innerHTML = '<span aria-hidden="true">↗</span><span data-label>Send to CRM</span>';
    button.addEventListener('click', sendToCRM);
    headerActions.prepend(button);
  }

  if (typeof render === 'function') {
    const originalRender = render;
    render = function forgeSuiteRenderWrapper() {
      originalRender();
      injectButton();
    };
  }

  window.sendForgeScopeToCRM = sendToCRM;

  if (residentialTemplatesInstalled && typeof render === 'function') render();
  else injectButton();
})();
