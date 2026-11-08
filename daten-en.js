'use strict';
// Englische Fassung der Leitfadentexte (daten.js, Rev. 6).
// Übersetzung durch ein Sprachmodell, nicht fachlich geprüft. Massgebend bleibt der deutsche Originaltext in daten.js.
// Zahlen, Einheiten, Quellen, Bedingungen und Entscheidungslogik stammen unverändert aus dem Original (maschinell verglichen).
LFT.en = {
 "fassung": "Version of 4 November 2026, revision 6 of 8 November 2026",
 "fassungKurz": "Rev. 6 of 8.11.2026",
 "einleitung": "This guide leads from a stressed area to a reasoned package of measures; it does not replace specialist planning. Heat and heavy rainfall are treated together because sealed surfaces store heat and let rain run off; anyone who opens up the soil and keeps the water on site works against both, provided that plants can evaporate the water. For this you need access to the map portals of the Confederation and the canton, your municipality’s utility line and road renovation planning and, from step 3, a specialist for the infiltration test.",
 "schritte": [
  {
   "nr": 1,
   "titel": "Stress",
   "frage": "Where is the stress highest in the settlement area?",
   "ergebnis": "Ranking of the areas from the cantonal assessment maps and the surface runoff hazard map; degree of sealing from the land cover of the official cadastral survey",
   "stelle": "Planning, GIS support"
  },
  {
   "nr": 2,
   "titel": "Occasion",
   "frage": "Is a renovation due anyway on any of these areas?",
   "ergebnis": "Cross-check with the utility line and road renovation planning; determination of the timing",
   "stelle": "Civil engineering and utilities"
  },
  {
   "nr": 3,
   "titel": "Subsoil and water source",
   "frage": "Does the subsoil absorb water, and where does the water come from?",
   "ergebnis": "Infiltration test; if the test is negative, provide for throttled discharge with a retention space. Clarify a nearby roof, access and pipe route",
   "stelle": "Civil engineering, specialist for the infiltration test"
  },
  {
   "nr": 4,
   "titel": "Admissibility per measure",
   "frage": "Is each chosen measure admissible at the site?",
   "ergebnis": "Check of the water protection area, the distance to the groundwater and the pollution load of the water arising for each measure; strike only the inadmissible measure and keep the other components; if the target facility of an inlet drops out, first check the next admissible target facility, and strike the inlet only when there is no target facility",
   "stelle": "Civil engineering, the canton where necessary"
  },
  {
   "nr": 5,
   "titel": "Choice of measures",
   "frage": "Which combination suits the area?",
   "ergebnis": "Package of measures according to the decision tree, substantiated with the information on pages 6 to 9 and planned into the renovation project",
   "stelle": "Civil engineering, green spaces, planning"
  }
 ],
 "schritt2": "Step 2 determines the costs. If unsealing is embedded in an intervention that is due anyway, breaking up and reinstatement do not arise additionally. Subsequent unsealing without an occasion for renovation is considerably more expensive and rarely enforceable in practice.",
 "schritt3": "Step 3 determines feasibility. Without absorbent subsoil and without an unpolluted water source, the most effective measures drop out. This cannot be compensated for by more effort elsewhere.",
 "gefaelle": "In step 3, also check the gradient. Under 3 %, infiltration is generally possible without special structural measures; from around 5 %, cascading swales are needed, which increases the area and the effort required.",
 "karten": [
  {
   "name": "Climate assessment map (Bewertungskarte Klima)",
   "ebene": "Canton",
   "text": "Shows, for each settlement area, the night-time overheating and the bioclimatic stress during the day, in each case in levels from very favourable to very unfavourable. From it you can read off which neighbourhoods are most heavily stressed at night. In the Canton of Aargau it is found in the layer «Bewertungskarte Klima 2026 und 2060 (Tag und Nacht)».",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS Onlinekarten (Canton of Aargau)"
  },
  {
   "name": "Climate analysis map (Klimaanalysekarte)",
   "ebene": "Canton",
   "text": "Shows the modelled air temperature at 4 am in half-degree steps as well as cold air corridors and area-wide cold air drainage. Important for the question of whether a planned planting would block an existing cold air flow.",
   "link": "https://www.ag.ch/geoportal/apps/onlinekarten/",
   "linktext": "AGIS Onlinekarten (Canton of Aargau)"
  },
  {
   "name": "Surface runoff hazard map (Gefährdungskarte Oberflächenabfluss)",
   "ebene": "Confederation",
   "text": "Shows where water flows over the surface during heavy rainfall and how deep it stands in doing so. Uniform across Switzerland and freely available for every municipality. For the prioritisation of areas in this thesis, flow depths above 0.10 m are taken into account. Lower flow depths can also be relevant at buildings.",
   "link": "https://map.geo.admin.ch/?layers=ch.bafu.gefaehrdungskarte-oberflaechenabfluss",
   "linktext": "map.geo.admin.ch"
  },
  {
   "name": "Land cover of the official cadastral survey (Bodenbedeckung der amtlichen Vermessung)",
   "ebene": "Canton",
   "text": "Classifies each area by object type, such as building, road or garden; the degree of sealing follows from this. In Aargau available via the AGIS Geodatenshop or geodienste.ch. A specialist of the municipality determines the area shares and levels, if necessary with GIS support.",
   "link": "https://www.ag.ch/geoportal/geodatenshop/Datensuche",
   "linktext": "AGIS Geodatenshop"
  }
 ],
 "kartenHinweis": "For step 1, publicly accessible maps and data are sufficient; your own measurements or surveys are not necessary for this. Step 2 relies on your municipality’s renovation and utility line planning; step 3 requires an on-site infiltration test by a specialist. The map extracts may be reproduced in your own documents with a source reference and retrieval date. The cantonal climate maps are not named identically in every canton and are not available in the same form everywhere. The Confederation’s surface runoff hazard map, by contrast, is identical across Switzerland. If in doubt, ask the cantonal specialist unit for climate adaptation which maps apply to your municipality.",
 "rangliste": [
  "Read off the night-time overheating for each area from the assessment map and classify it into three levels.",
  "Determine the degree of sealing for each area from the land cover of the official cadastral survey and likewise classify it into three levels.",
  "Determine the share of the area at risk of flooding from the surface runoff hazard map and classify it into three levels. Also record the absolute area at risk in square metres.",
  "Add up the three levels. Priority goes to areas that are at least medium in all three stresses and high in the sum. An area that stands out in only one stress is not a priority area."
 ],
 "ranglisteHinweise": [
  "Where you set the level boundaries is a decision of your municipality and not an objective limit. Record how you set them; otherwise the ranking cannot be traced later.",
  "Share and absolute area lead to different sequences. A small area easily reaches the highest level via the share, whereas a large area with a lot of area at risk may fall back. Keep both variables and give reasons for which one is decisive in the individual case."
 ],
 "abklaerungenIntro": "The following five points decide which measures are available for selection at a site at all. They must be clarified before the choice of measures, not after.",
 "abklaerungen": [
  {
   "key": "gws",
   "titel": "Water protection area and groundwater",
   "text": "In which water protection area does the area lie, and how deep is the groundwater? In the groundwater protection zones S1, S2 and Sh, infiltration of rainwater is prohibited, and in S3 and Sm it is severely restricted; the execution is to be checked with the specialist unit in accordance with the cantonal requirements. The Au area is not a protection zone. A minimum distance to the groundwater table must be maintained. The maps are maintained by the canton."
  },
  {
   "key": "wasser",
   "titel": "Pollution load of the water arising",
   "text": "Roof water is considered unpolluted, provided that the covering does not consist largely of uncoated copper, zinc or lead (guide value 50 m² across all contact surfaces such as gutters and flashings); aluminium and chromium steel are unproblematic. This applies to every measure that takes up roof water: tree trench (D5), swale (D6) and disconnection (D8). Road runoff may only be infiltrated if it is sufficiently cleaned in the soil; for public traffic areas the Canton of Aargau requires a soil passage of at least 20 cm topsoil and 30 cm subsoil, and it regulates private driveways and car parks separately."
  },
  {
   "key": "untergrund",
   "titel": "Absorption capacity of the subsoil",
   "text": "Does the soil absorb water? Only an on-site infiltration test shows this. Removing the surfacing alone does not restore the absorption and storage capacity impaired by compaction. Unsealing therefore does not merely mean opening up, but restoring the soil. If the test is negative, retention with throttled discharge remains possible, but only with a retention space and an overflow."
  },
  {
   "key": "quelle",
   "titel": "Water source",
   "text": "Where does the water come from that the plants are supposed to evaporate? Is roof water produced within reach whose owners consent to its use, or must it first be conveyed there via a disconnection? Without a secured water supply, evaporative cooling is not guaranteed during heat periods; shading remains effective."
  },
  {
   "key": "schutz",
   "titel": "Protected objects and protected spaces",
   "text": "Does the area contain a hedge, an individual tree or a natural object protected under land-use planning? Such designations are set out in the building zone plan and bind the design. At the same time, check whether the area lies in a focus area of the ecological infrastructure; there, a near-natural design is not only admissible but desirable."
  }
 ],
 "kernregel": [
  "Measures that depend on water need a source in the same package.",
  "The sponge-city principle works as a chain: the water falls onto the roof, is retained there or at ground level, infiltrates, is available to the vegetation and evaporates. If one link is missing, the whole chain does not work.",
  "Every inlet needs an admissible target facility. If a target facility drops out, the next admissible one is considered first; only when there is no target facility does the inlet drop out. The same water counts only once.",
  "Classification in this guide: A tree pit without inlet (D4) does not fall under this rule; it receives only the precipitation falling at the site, which the substrate stores, and the choice of species follows rule 2 of the rules from practice. In the standard path of this decision tree, the tree pit with a permanently established connection to a roof area counts as a tree trench (D5); a permanent connection does not mean a continuous inflow, but inflow during precipitation. Further inlets are to be examined separately by specialists (D5)."
 ],
 "baumGrenze": "What the decision tree does not decide: it proposes a retention roof (D7) only together with the disconnection. Whether a roof without a target facility at ground level is nevertheless suitable as a retention roof is a separate specialist examination (load reserve, waterproofing, data sheet D7). If the decision tree leads to no measure, the area remains excluded for the time being; record the reasoning.",
 "randbedingungen": [
  {
   "key": "kaltluft",
   "text": "Keep cold air corridors clear"
  },
  {
   "key": "ortsbild",
   "text": "Townscape and monument protection"
  },
  {
   "key": "werkleitungen",
   "text": "Utility lines and substructure"
  },
  {
   "key": "hangwasser",
   "text": "Slope water"
  },
  {
   "key": "unterhalt",
   "text": "Ensure maintenance"
  }
 ],
 "massnahmenIntro": "The information on cooling effect and retention comes from the evaluation in the diploma thesis. Retention volume, space requirement, costs and service life are there partly documented only as declared assumptions and are therefore not listed here; the complete data sheets with all fields and sources are in Appendix A8 of the thesis. The cooling effect is consistently stated as perceived temperature. Information on surface temperature has deliberately been left out: what counts is what a person feels on the area.",
 "massnahmen": {
  "D1": {
   "name": "Permeable surfacing",
   "was": "Partial unsealing with grass grid pavers, grass-joint paving or compacted gravel surfacing. Precipitation infiltrates through the joints instead of running off at the surface; from the vegetated joint zone, water evaporates and cools the surroundings.",
   "kuehl": "up to 7 °C lower perceived temperature during the day",
   "rueck": "grass grid pavers up to 80 %, permeable surfacings up to 40 % less surface runoff",
   "zul": "Conditional. Road runoff may only be infiltrated if it is sufficiently cleaned in the soil, for example via a soil passage. Uncritical on lightly loaded areas such as parking bays, driveways and forecourts.",
   "ja": "lightly loaded areas such as parking bays, driveways, forecourts, cycle paths and footpaths; subsoil capable of infiltration is present",
   "nein": "heavily trafficked areas or areas with high requirements for cleaning and winter maintenance",
   "pruef": "Infiltration capacity of the subsoil, distance to the groundwater, pollution load of the water arising",
   "komb": "Disconnection of roof areas for the inlet of roof water, tree pit for shading"
  },
  "D2": {
   "name": "Complete unsealing with greening",
   "was": "Removal of the paved surface and subsequent greening. Infiltration, evaporation and shading work together. The cantonal guide describes this variant as the most effective one for the settlement climate.",
   "kuehl": "up to 7 °C lower perceived temperature during the day",
   "rueck": "Humus layer as water store; surface runoff greatly reduced",
   "zul": "Admissible. The soil passage acts as a cleaning stage; no direct discharge into the subsoil occurs.",
   "ja": "the use of the area can be dispensed with and the soil is not contaminated",
   "nein": "the area is needed for traffic, parking or events",
   "pruef": "Pollutant load of the soil, compaction of the subsoil, recovery of the excavated material in accordance with the Waste Ordinance",
   "komb": "Tree pit for shading, retention swale for additional retention"
  },
  "D3": {
   "name": "Light-coloured surfacing with high albedo",
   "was": "Light-coloured surfaces reflect a larger share of solar radiation instead of storing the energy and releasing it as heat with a time delay. The measure acts exclusively thermally.",
   "kuehl": "up to 3 °C lower perceived temperature",
   "rueck": "none",
   "zul": "Admissible. There is no intervention in the drainage.",
   "ja": "the area has to remain paved and is strongly exposed to the sun during the day",
   "nein": "a contribution to the water balance is expected or glare may arise",
   "pruef": "Compatibility with the townscape, glare effect, cleaning effort",
   "komb": "Tree pit, because shading prevents heating up more effectively than reflection"
  },
  "D4": {
   "name": "Tree pit with sponge-city substrate, without water inlet",
   "was": "Generous tree planting pit with water-storing substrate. The tree shades the surface and cools through evaporation; the substrate stores precipitation water and contributes to the water supply.",
   "kuehl": "over 8 °C lower perceived temperature in the tree shade",
   "rueck": "a large tree evaporates several hundred litres per day",
   "zul": "Admissible. Without an inlet, the site receives only the precipitation falling at the site. An inlet of road runoff does not belong to D4: it requires the soil passage according to page 4 of the guide, and tree substrate does not replace it.",
   "ja": "root space and distance to utility lines are available and the water supply can be secured",
   "nein": "the area is built underneath or the soil cover is insufficient",
   "pruef": "whether an existing tree can be preserved through soil improvement; utility lines, boundary distances, choice of species incl. isoprene emission (willows, poplars)",
   "komb": "complete unsealing for the open soil connection; with a connected roof area, the site counts in this guide as a tree trench (D5)"
  },
  "D5": {
   "name": "Tree trench with water inlet",
   "was": "Rainwater is collected and led into the vegetation and root zone, infiltrates there slowly and evaporates via the tree. The standard case is unpolluted roof water; road and square runoff only under the cantonal conditions, never in a groundwater protection zone.",
   "kuehl": "as with the tree pit, at the upper end of the range",
   "rueck": "relief of the sewer system outside the winter months",
   "zul": "Admissible with unpolluted roof water, but only outside groundwater protection zones, with 20 cm topsoil and 30 cm subsoil and a raised trunk. Road runoff only if pollution class, water protection area and distance to the groundwater permit it under the cantonal requirements; a specialist clarifies this.",
   "ja": "unpolluted roof water arises within reach and the subsoil absorbs water",
   "nein": "the roof water is polluted (large-area uncoated copper, zinc or lead), the area lies in a groundwater protection zone or only road runoff is available that does not meet the cantonal conditions",
   "pruef": "Water source, water protection area and groundwater protection zone, for road runoff the pollution class, infiltration rate, freedom from ponding in the trunk area",
   "komb": "Retention roof and disconnection of roof areas as water source"
  },
  "D6": {
   "name": "Retention swale",
   "was": "A vegetated depression in the terrain takes up precipitation water, retains it and releases it with a delay to soil and vegetation. In dry periods it is part of the usable green space.",
   "kuehl": "like a vegetated area",
   "rueck": "reduces surface runoff and cuts runoff peaks",
   "zul": "Admissible for unpolluted water. When road runoff is fed in, pretreatment is required, and on public traffic areas a soil passage of 20 cm topsoil and 30 cm subsoil.",
   "ja": "an open area with a gradient towards the inflow is available and the subsoil is capable of infiltration",
   "nein": "the groundwater table is high or the area is otherwise used",
   "pruef": "Infiltration test, ratio of connected to receiving area, emergency overflow, depth limitation, slope gradient (unproblematic under 3 %, cascades necessary from around 5 %)",
   "komb": "Disconnection of roof areas as inlet, tree pit at the edge of the swale"
  },
  "D7": {
   "name": "Retention roof with intensive greening",
   "was": "Green roof build-up with a substrate layer and an underlying storage and drainage element. Precipitation is retained at its first point of impact, partly evaporated via the vegetation and released with a delay.",
   "kuehl": "no proven effect for the street space; evaporative cooling above the roof",
   "rueck": "Runoff coefficient significantly below that of a flat roof, depending on the thickness of the build-up",
   "zul": "Admissible. Unpolluted roof water is the suitable inlet for tree trenches and retention swales.",
   "ja": "the roof waterproofing is being renovated anyway and the load reserve has been demonstrated",
   "nein": "the roof area is fully taken up by photovoltaics or the structural analysis permits no additional load",
   "pruef": "Load-bearing capacity in the water-saturated state, waterproofing, access for maintenance",
   "komb": "Tree trench and retention swale as downstream elements of the cascade"
  },
  "D8": {
   "name": "Disconnection of roof areas into adjacent green spaces",
   "was": "The roof drainage is separated from the sewer system and led via a discharge channel or an infiltration pipe, spread over a wide area, into an adjacent green space. The water infiltrates through the living soil layer, is available to the vegetation and is evaporated by it.",
   "kuehl": "indirect, via the water supply of the vegetation",
   "rueck": "relieves the sewer system by the amount of roof water managed on site; overflows must be taken into account in the dimensioning",
   "zul": "Admissible for roof water, provided that the covering does not consist largely of uncoated copper, zinc or lead (guide value 50 m² of all contact surfaces); aluminium and chromium steel are regarded as unproblematic.",
   "ja": "a sufficiently large green space with a gradient can be connected to the downpipe",
   "nein": "the roof covering contains large areas of uncoated copper, zinc or lead or backwater may arise at buildings",
   "pruef": "Groundwater protection zone and water protection area, distance to the basement, infiltration capacity, ratio of connected to receiving area",
   "komb": "Tree trench and retention swale as receiving elements"
  }
 },
 "regelnIntro": "These rules are not tied to an individual area, but they decide success. They come from implemented projects and from expert information.",
 "regeln": [
  [
   "Preserve existing trees first.",
   "Before any new planting, check whether an existing tree can be saved by loosening the compacted soil and adding water-storing substrate."
  ],
  [
   "Align the choice of species with the secured amount of water.",
   "Water-demanding species such as willows evaporate only as long as water is available to them. Where there is no permanent inlet, species are to be chosen that manage without additional watering."
  ],
  [
   "Select according to the floodplain principle.",
   "For sites that fluctuate between drought and ponding, woody plants from the softwood and hardwood floodplain are suitable. Narrow-crowned street tree types provide little shade and little evaporation."
  ],
  [
   "Pay attention to the side effect.",
   "Individual genera such as willows and poplars emit a lot of isoprene, which contributes to ozone formation on hot days. Diversity within the stand also increases robustness."
  ],
  [
   "Plant one size smaller.",
   "Trees planted too large have difficulty continuing to grow in any substrate; smaller grades establish better."
  ],
  [
   "Do not merely open the soil, but create it.",
   "Removing the surfacing alone does not restore the absorption and storage capacity impaired by compaction."
  ],
  [
   "Use local materials.",
   "From a transport distance of around fifty kilometres, the transport effort exceeds the material value. Specify the substrate by its properties, that is structurally stable and coarse-grained with a low humus content, and not by a product."
  ],
  [
   "Plan the maintenance and know the requirements.",
   "An infiltration facility must be checked periodically for its function, cleaned and monitored for pollutant load of the soil; the emergency overflow must lead above terrain level, and the basin floor and embankment may be used only as litter meadow. This is prescribed by the Canton of Aargau. Without graded maintenance, a swale loses its infiltration capacity. Clarify the responsibility before implementation."
  ],
  [
   "Involve the population early.",
   "Participation not only increases acceptance, it reduces objections and thereby speeds up implementation."
  ],
  [
   "Address private areas.",
   "A large part of the sealed areas lies on private land. Requirements via the building permit take effect there only for construction projects; anyone who wants to achieve more needs an incentive instrument, for example reimbursement of the connection fee in the case of permanent disconnection."
  ]
 ],
 "herkunft": [
  "This guide is a result of the diploma thesis «Entsiegelung als Massnahme zur Reduktion urbaner Hitzeinseln in Schweizer Städten» (Unsealing as a measure to reduce urban heat islands in Swiss cities) by Loris Beriger, TEKO Olten, 2026, case study of the settlement area of Zofingen. Version of 4 November 2026, revision 6 of 8 November 2026, revised following evaluation of three application tests; not tested again. The version tested was that of 19 October 2026, supplement 2; results and limits in Chapter 9.3 of the thesis.",
  "Basis: cantonal guide for heat-adapted settlement development, Water Protection Act and Ordinance, specialist publications on tree substrate research as well as expert information from the city and the canton. The complete source references are given in the thesis.",
  "Characteristic values for retention volume, space requirement, costs and service life are based in the thesis partly on declared assumptions. This guide does not replace a cost estimate."
 ],
 "baumLesen": [
  "Questions 1 to 3 describe the site (remaining paved, infiltration test, roof water), question 4 checks the package. The site data do not change if a measure is struck later.",
  "Question 3 can be answered with Yes only if both apply: the roof water may be used, and there is an admissible target facility, that is a receiving green space with a gradient, a space for a tree trench (D5) or an open area for a swale (D6). The disconnection (D8) receives a target facility, in this order; the same water counts only once.",
  "In every branch, a tree pit (D4) presupposes an existing space for a tree; if the infiltration test is negative, additionally a retention space with overflow. Without a retention space, only the light-coloured surfacing (D3) remains there.",
  "Question 4 checks each measure of the package individually, including the water fed in. If No: strike only the inadmissible measure, then start again at question 1; the site data remain, anything struck is treated as not present. If every target facility is missing thereafter, question 3 is No: the package without roof water applies, D1 and, where there is a space for a tree, D4, without retention roof (D7)."
 ]
};
