export const BOARDS = ['Edexcel International', 'Cambridge (CIE)'];

export const SUBJECT_BOARDS = {
  IGCSE: {
    'Biology': BOARDS,
    'Chemistry': BOARDS,
    'Physics': BOARDS,
    'Maths': BOARDS,
    'Further Maths': BOARDS,
    'Statistics': BOARDS,
    'Computer Science': BOARDS,
    'Business': BOARDS,
    'Accounting': BOARDS,
    'Economics': BOARDS,
    'English Language': BOARDS,
    'English Literature': BOARDS,
    'ICT': BOARDS,
    'Environmental Management': BOARDS,
    'Psychology': BOARDS,
    'French': BOARDS,
    'German': BOARDS,
    'Spanish': BOARDS,
  },
  AS: {
    'Biology': BOARDS,
    'Chemistry': BOARDS,
    'Physics': BOARDS,
    'Maths': BOARDS,
    'Further Maths': BOARDS,
    'Business': BOARDS,
    'Economics': BOARDS,
    'Psychology': BOARDS,
    'English Literature': BOARDS,
    'Computer Science': BOARDS,
  },
  'A Level': {
    'Biology': BOARDS,
    'Chemistry': BOARDS,
    'Physics': BOARDS,
    'Maths': BOARDS,
    'Further Maths': BOARDS,
    'Business': BOARDS,
    'Economics': BOARDS,
    'Psychology': BOARDS,
    'English Literature': BOARDS,
    'Computer Science': BOARDS,
    'Art & Design': BOARDS,
  },
};

export const LEVELS = Object.keys(SUBJECT_BOARDS);
export const OTHER = 'Other (type your own)';

// Officially published syllabus/specification codes where confirmed.
// Not every subject/board/level combination has a verified code — check
// the board's own site before using any of these for exam registration.
export const PAPER_CODES = {
  IGCSE: {
    'Biology': { 'Edexcel International': '4BI1', 'Cambridge (CIE)': '0610' },
    'Chemistry': { 'Edexcel International': '4CH1', 'Cambridge (CIE)': '0620' },
    'Physics': { 'Edexcel International': '4PH1', 'Cambridge (CIE)': '0625' },
    'Maths': { 'Edexcel International': '4MA1', 'Cambridge (CIE)': '0580' },
    'Further Maths': { 'Edexcel International': '4PM1', 'Cambridge (CIE)': '0606' },
    'Computer Science': { 'Edexcel International': '4CP0', 'Cambridge (CIE)': '0478' },
    'Business': { 'Edexcel International': '4BS1', 'Cambridge (CIE)': '0450' },
    'Accounting': { 'Edexcel International': '4AC1', 'Cambridge (CIE)': '0452' },
    'Economics': { 'Edexcel International': '4EC1', 'Cambridge (CIE)': '0455' },
    'English Language': { 'Edexcel International': '4EA1', 'Cambridge (CIE)': '0500' },
    'English Literature': { 'Edexcel International': '4ET1', 'Cambridge (CIE)': '0475' },
    'ICT': { 'Cambridge (CIE)': '0417' },
    'Environmental Management': { 'Cambridge (CIE)': '0680' },
    'Psychology': { 'Cambridge (CIE)': '0266' },
    'French': { 'Edexcel International': '4FR1', 'Cambridge (CIE)': '0520' },
    'German': { 'Edexcel International': '4GN1', 'Cambridge (CIE)': '0525' },
    'Spanish': { 'Edexcel International': '4SP1', 'Cambridge (CIE)': '0530' },
  },
  // Edexcel International codes below are the official specification
  // cash-in codes (X = Advanced Subsidiary, Y = full Advanced Level),
  // confirmed against Pearson's own Qualifications Information Manual —
  // not individual unit/paper codes.
  AS: {
    'Biology': { 'Edexcel International': 'XBI11', 'Cambridge (CIE)': '9700' },
    'Chemistry': { 'Edexcel International': 'XCH11', 'Cambridge (CIE)': '9701' },
    'Physics': { 'Edexcel International': 'XPH11', 'Cambridge (CIE)': '9702' },
    'Maths': { 'Edexcel International': 'XMA01', 'Cambridge (CIE)': '9709' },
    'Further Maths': { 'Edexcel International': 'XFM01', 'Cambridge (CIE)': '9231' },
    'Business': { 'Edexcel International': 'XBS11', 'Cambridge (CIE)': '9609' },
    'Economics': { 'Edexcel International': 'XEC11', 'Cambridge (CIE)': '9708' },
    'Psychology': { 'Edexcel International': 'XPS01', 'Cambridge (CIE)': '9990' },
    'English Literature': { 'Edexcel International': 'XET01', 'Cambridge (CIE)': '9695' },
    'Computer Science': { 'Cambridge (CIE)': '9618' },
    'Accounting': { 'Edexcel International': 'XAC11' },
    'English Language': { 'Edexcel International': 'XEN01' },
    'French': { 'Edexcel International': 'XFR01' },
    'German': { 'Edexcel International': 'XGN01' },
    'Spanish': { 'Edexcel International': 'XSP01' },
    'ICT': { 'Edexcel International': 'XIT11' },
  },
  'A Level': {
    'Biology': { 'Edexcel International': 'YBI11', 'Cambridge (CIE)': '9700' },
    'Chemistry': { 'Edexcel International': 'YCH11', 'Cambridge (CIE)': '9701' },
    'Physics': { 'Edexcel International': 'YPH11', 'Cambridge (CIE)': '9702' },
    'Maths': { 'Edexcel International': 'YMA01', 'Cambridge (CIE)': '9709' },
    'Further Maths': { 'Edexcel International': 'YFM01', 'Cambridge (CIE)': '9231' },
    'Business': { 'Edexcel International': 'YBS11', 'Cambridge (CIE)': '9609' },
    'Economics': { 'Edexcel International': 'YEC11', 'Cambridge (CIE)': '9708' },
    'Psychology': { 'Edexcel International': 'YPS01', 'Cambridge (CIE)': '9990' },
    'English Literature': { 'Edexcel International': 'YET01', 'Cambridge (CIE)': '9695' },
    'Computer Science': { 'Cambridge (CIE)': '9618' },
    'Art & Design': { 'Cambridge (CIE)': '9704' },
    'Accounting': { 'Edexcel International': 'YAC11' },
    'English Language': { 'Edexcel International': 'YEN01' },
    'French': { 'Edexcel International': 'YFR01' },
    'German': { 'Edexcel International': 'YGN01' },
    'Spanish': { 'Edexcel International': 'YSP01' },
    'ICT': { 'Edexcel International': 'YIT11' },
  },
};

export function getPaperCode(level, subject, board) {
  return PAPER_CODES[level]?.[subject]?.[board] || null;
}

// Verified stable slugs Cambridge uses in its own site URLs — only
// includes subjects where the pattern has actually been confirmed,
// since a wrong slug produces a dead link.
export const CAMBRIDGE_SPEC_SLUGS = {
  IGCSE: {
    'Biology': 'biology',
    'Chemistry': 'chemistry',
    'Physics': 'physics',
    'Maths': 'mathematics',
    'Further Maths': 'additional-mathematics',
    'Computer Science': 'computer-science',
    'Business': 'business-studies',
    'Accounting': 'accounting',
    'Economics': 'economics',
    'English Language': 'english-first-language',
    'English Literature': 'english-literature',
    'ICT': 'ict',
    'Environmental Management': 'environmental-management',
    'Psychology': 'psychology',
    'French': 'french-foreign-language',
    'German': 'german-foreign-language',
    'Spanish': 'spanish-foreign-language',
  },
  AS: {
    'Biology': 'biology',
    'Chemistry': 'chemistry',
    'Physics': 'physics',
    'Maths': 'mathematics',
    'Further Maths': 'further-mathematics',
    'Business': 'business',
    'Economics': 'economics',
    'Psychology': 'psychology',
    'English Literature': 'english-literature',
    'Computer Science': 'computer-science',
  },
  'A Level': {
    'Biology': 'biology',
    'Chemistry': 'chemistry',
    'Physics': 'physics',
    'Maths': 'mathematics',
    'Further Maths': 'further-mathematics',
    'Business': 'business',
    'Economics': 'economics',
    'Psychology': 'psychology',
    'English Literature': 'english-literature',
    'Computer Science': 'computer-science',
    'Art & Design': 'art-and-design',
  },
};

export function getSpecUrl(level, subject, board) {
  if (board === 'Cambridge (CIE)') {
    const slug = CAMBRIDGE_SPEC_SLUGS[level]?.[subject];
    const code = getPaperCode(level, subject, board);
    if (!slug || !code) return null;
    if (level === 'IGCSE') {
      return `https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-${slug}-${code}/`;
    }
    if (level === 'AS' || level === 'A Level') {
      return `https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-international-as-and-a-level-${slug}-${code}/`;
    }
    return null;
  }
  if (board === 'Edexcel International' && (level === 'AS' || level === 'A Level')) {
    const slug = EDEXCEL_IAL_SLUGS[subject];
    if (!slug) return null;
    return `https://qualifications.pearson.com/en/qualifications/edexcel-international-advanced-levels/${slug}/about.html`;
  }
  // Edexcel International GCSE isn't linked: Pearson publishes several
  // overlapping year-tagged specs per subject with no code-derivable URL,
  // so a guessed link risks landing on the wrong or a dead page.
  return null;
}

export const EDEXCEL_IAL_SLUGS = {
  'Biology': 'biology',
  'Chemistry': 'chemistry',
  'Physics': 'physics',
  'Maths': 'mathematics',
  'Further Maths': 'further-mathematics',
};

export const MATHS_COMPONENTS = ['Pure', 'Mechanics', 'Statistics', 'Decision'];
export const PAPERS = ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4', 'Paper 5', 'Paper 6'];

// Pre-built topic/subtopic checklists, researched per subject/level/board.
// Coverage is intentionally limited to subjects that have been verified —
// Biology, Chemistry, Physics, and Maths — rather than guessed for all.
export const T = (name, subtopics) => ({ name, subtopics: subtopics || [] });

export const SEED_DATA = (() => {
  const BIO_IGCSE_CIE = [
    T('Characteristics and classification of living organisms', ['Characteristics of living organisms', 'Classification (five kingdoms)', 'The binomial naming system', 'Features of major groups: plants, animals, fungi, bacteria, protoctista']),
    T('Organisation of the organism', ['Levels of organisation: cells, tissues, organs, systems', 'Plant and animal organ systems']),
    T('Movement into and out of cells', ['Diffusion', 'Osmosis', 'Active transport']),
    T('Biological molecules', ['Carbohydrates, proteins, and lipids', 'Water and its role', 'Testing for biological molecules']),
    T('Enzymes', ['Enzyme structure and action', 'Factors affecting enzyme activity']),
    T('Plant nutrition', ['Photosynthesis', 'Leaf structure', 'Mineral requirements']),
    T('Human nutrition', ['Diet and nutrients', 'The alimentary canal', 'Digestion and absorption']),
    T('Transport in plants', ['Xylem and phloem', 'Transpiration', 'Translocation']),
    T('Transport in animals', ['The circulatory system', 'The heart', 'Blood']),
    T('Diseases and immunity', ['Pathogens and transmission', 'Immune response', 'Vaccination']),
    T('Gas exchange in humans', ['Lung structure', 'Gas exchange mechanism']),
    T('Respiration', ['Aerobic respiration', 'Anaerobic respiration']),
    T('Excretion in humans', ['The kidney', 'Homeostasis of water and waste']),
    T('Coordination and response', ['The nervous system', 'Sense organs', 'Hormones']),
    T('Drugs', ['Medicinal drugs', 'Recreational drugs and their effects']),
    T('Reproduction', ['Asexual and sexual reproduction', 'Human reproductive systems', 'Fertilisation, pregnancy, and birth']),
    T('Inheritance', ['Chromosomes, genes, and DNA', 'Monohybrid inheritance']),
    T('Variation and selection', ['Types of variation', 'Natural and artificial selection']),
    T('Organisms and their environment', ['Energy flow and food chains/webs', 'Nutrient cycles']),
    T('Human influences on ecosystems', ['Habitat destruction', 'Pollution', 'Conservation']),
    T('Biotechnology and genetic modification', ['Uses of biotechnology', 'Genetic engineering']),
  ];
  const BIO_CIE_P1 = [
    T('Cell structure', ['Light microscopy and magnification calculations', 'Electron microscopy: SEM vs TEM', 'Ultrastructure of eukaryotic cells', 'Structure of prokaryotic cells', 'Structure of viruses', 'Cell fractionation and centrifugation']),
    T('Biological molecules', ['Water: structure and properties', 'Monosaccharides and disaccharides', 'Polysaccharides: starch, glycogen, cellulose', 'Lipids: triglycerides and phospholipids', 'Protein structure: primary to quaternary', 'Structure of DNA and RNA', 'Biochemical tests for molecules']),
    T('Enzymes', ['Mechanism of enzyme action: lock and key, induced fit', 'Effect of temperature on rate', 'Effect of pH on rate', 'Effect of substrate and enzyme concentration', 'Competitive and non-competitive inhibition']),
    T('Cell membranes and transport', ['Fluid mosaic model of the membrane', 'Factors affecting membrane permeability', 'Diffusion and facilitated diffusion', 'Osmosis and water potential', 'Active transport and co-transport']),
    T('The mitotic cell cycle', ['Stages of the cell cycle', 'Chromosome behaviour in mitosis', 'Significance of mitosis', 'Cancer as uncontrolled cell division', 'Chemotherapy and the cell cycle']),
    T('Nucleic acids and protein synthesis', ['Semi-conservative DNA replication', 'The genetic code', 'Transcription', 'Translation', 'Role of mRNA, tRNA, and ribosomes']),
    T('Transport in plants', ['Structure of xylem and phloem', 'Movement of water through the plant', 'Transpiration and factors affecting it', 'Translocation mechanism', 'Investigating transpiration rate']),
    T('Transport in mammals', ['Structure of the mammalian heart', 'The cardiac cycle', 'Blood vessels: arteries, veins, capillaries', 'Structure and function of haemoglobin', 'The oxygen dissociation curve', 'Transport of carbon dioxide']),
    T('Gas exchange and smoking', ['Structure of the gas exchange system', 'Mechanism of gas exchange in the alveoli', 'Effects of tar and carcinogens', 'Effects of carbon monoxide and nicotine', 'Correlation vs causation in smoking data']),
    T('Infectious disease', ['Characteristics of pathogens: bacteria, viruses, protoctista, fungi', 'Transmission of infectious disease', 'Antibiotic action and resistance', 'Case studies: cholera, malaria, TB, HIV/AIDS']),
    T('Immunity', ['Phagocytosis', 'Antigens and antibody structure', 'Cell-mediated and humoral immune response', 'Active and passive immunity', 'Vaccination and herd immunity', 'Monoclonal antibodies']),
  ];
  const BIO_CIE_P2 = [
    T('Energy and respiration', ['The role of ATP', 'Respiratory substrates', 'Glycolysis', 'Krebs cycle and oxidative phosphorylation', 'Anaerobic respiration in yeast and muscle']),
    T('Photosynthesis', ['Structure of the chloroplast', 'Light-dependent reactions', 'Light-independent reactions (Calvin cycle)', 'Limiting factors of photosynthesis', 'Investigating rate of photosynthesis']),
    T('Homeostasis', ['Principles of homeostasis and negative feedback', 'Control of blood glucose concentration', 'Structure and function of the kidney nephron', 'Osmoregulation and ADH']),
    T('Coordination', ['Structure and function of neurones', 'The nerve impulse and action potential', 'Synapses and synaptic transmission', 'Hormonal communication', 'Plant tropisms and auxin']),
    T('Inherited change', ['Meiosis and genetic variation', 'Gene mutation', 'Control of gene expression', 'Genetic crosses and inheritance patterns', 'Sex linkage']),
    T('Selection and evolution', ['Variation within populations', 'Natural selection and adaptation', 'Evidence for evolution', 'Speciation', 'Antibiotic resistance as an example of selection']),
    T('Biodiversity, classification, and conservation', ['Species concept', 'The five kingdom classification system', 'Measuring biodiversity', 'Threats to biodiversity', 'Methods of conservation']),
    T('Genetic technology', ['Gene cloning techniques', 'The polymerase chain reaction (PCR)', 'Gel electrophoresis', 'Genetic engineering applications', 'Ethical issues in genetic technology']),
  ];
  const BIO_EDEXCEL_P1 = [
    T('Biological molecules', ['Structure of carbohydrates: monosaccharides, disaccharides, polysaccharides', 'Structure of lipids: triglycerides and phospholipids', 'Structure of proteins: primary to quaternary', 'Enzyme action and factors affecting rate', 'Biochemical tests']),
    T('Diet and food', ['Components of a balanced diet', 'Energy requirements and energy balance', 'Malnutrition, obesity, and diet-related disease', 'Food safety and food production']),
    T('Transport in the heart and blood', ['Structure of the heart', 'The cardiac cycle', 'Structure of blood vessels', 'Composition and function of blood', 'Haemoglobin and oxygen transport']),
    T('Cardiovascular disease', ['Atherosclerosis and its causes', 'Risk factors: diet, smoking, genetics', 'Epidemiological evidence and correlation', 'Prevention, diagnosis, and treatment']),
  ];
  const BIO_EDEXCEL_P2 = [
    T('Cell structure and function', ['Eukaryotic cell ultrastructure', 'Prokaryotic cell structure', 'Cell membrane structure and transport', 'Mitosis and the cell cycle', 'Meiosis and genetic variation']),
    T('Viruses', ['Structure of viruses', 'The lytic and lysogenic replication cycles', 'Viral diseases']),
    T('Reproduction and development', ['Sexual reproduction in mammals', 'Sexual reproduction in flowering plants', 'Stem cells and cell differentiation', 'Growth and development']),
    T('Biodiversity', ['The species concept', 'Classification systems', 'Genetic, species, and ecosystem biodiversity', 'Measuring biodiversity with sampling techniques']),
    T('Conservation', ['Threats to biodiversity: habitat loss, pollution, climate change', 'In-situ and ex-situ conservation', 'International conservation agreements']),
  ];
  const BIO_EDEXCEL_P3 = [
    T('Photosynthesis', ['Structure of the chloroplast', 'Light-dependent reactions', 'Light-independent reactions', 'Factors limiting the rate of photosynthesis']),
    T('Ecosystems and energy flow', ['Trophic levels and food webs', 'Energy transfer between trophic levels', 'Primary and secondary productivity', 'The carbon and nitrogen cycles']),
    T('Microbiology', ['Growth curves of microorganisms', 'Culturing techniques', 'Aseptic technique', 'Pathogens and disease transmission']),
    T('Immunity', ['Non-specific defences', 'The specific immune response', 'Antibody structure and function', 'Vaccination programmes', 'Antibiotic resistance']),
  ];
  const BIO_EDEXCEL_P4 = [
    T('Respiration', ['Glycolysis', 'Link reaction and Krebs cycle', 'Oxidative phosphorylation', 'Anaerobic respiration in yeast and muscle']),
    T('Homeostasis', ['Principles of negative feedback', 'Control of blood glucose', 'Control of body temperature', 'Structure and function of the kidney']),
    T('Coordination', ['Structure and function of neurones', 'Synaptic transmission', 'Hormonal coordination', 'Plant growth substances and tropisms']),
    T('Genetics and gene technology', ['Patterns of inheritance', 'Genetic variation and mutation', 'Gene cloning and PCR', 'Genetic engineering applications', 'Ethical issues in gene technology']),
  ];

  const CHEM_IGCSE_CIE = [
    T('States of matter', ['Solids, liquids, and gases', 'Diffusion']),
    T('Atoms, elements and compounds', ['Atomic structure', 'Bonding: ionic, covalent, metallic']),
    T('Stoichiometry', ['The mole and chemical formulae', 'Reacting masses and volumes']),
    T('Electrochemistry', ['Electrolysis', 'Predicting electrolysis products']),
    T('Chemical energetics', ['Exothermic and endothermic reactions', 'Energy from fuels']),
    T('Chemical reactions', ['Rate of reaction and factors affecting it', 'Reversible reactions and equilibrium']),
    T('Acids, bases and salts', ['Properties of acids and bases', 'Preparation of salts']),
    T('The Periodic Table', ['Periodic trends', 'Groups I, VII, and transition elements']),
    T('Metals', ['Reactivity series', 'Extraction of metals', 'Uses of metals and alloys']),
    T('Chemistry of the environment', ['Water and its treatment', 'Air quality and pollutants']),
    T('Organic chemistry', ['Fuels and hydrocarbons', 'Alkanes, alkenes, alcohols, carboxylic acids', 'Polymers']),
    T('Experimental techniques and chemical analysis', ['Separation and purification techniques', 'Tests for ions and gases']),
  ];
  const CHEM_CIE_P1 = [
    T('Atomic structure', ['Structure of the atom: protons, neutrons, electrons', 'Isotopes and relative atomic mass', 'Electron arrangement and orbitals', 'Mass spectrometry']),
    T('Atoms, molecules and stoichiometry', ['The mole and Avogadro constant', 'Empirical and molecular formulae', 'Balancing equations and reacting masses', 'Molar gas volume and concentration calculations']),
    T('Chemical bonding', ['Ionic bonding and lattice structures', 'Covalent bonding and dative bonds', 'Metallic bonding', 'Shapes of molecules and bond angles', 'Electronegativity and polarity']),
    T('States of matter', ['The gas laws and ideal gas equation', 'Kinetic theory', 'Intermolecular forces in liquids and solids', 'Types of solid lattice']),
    T('Chemical energetics', ['Enthalpy change definitions', 'Measuring enthalpy change experimentally', "Hess's Law and energy cycles", 'Bond energies']),
    T('Electrochemistry (AS)', ['Oxidation numbers', 'Balancing redox equations', 'Electrolysis and electrode products']),
    T('Equilibria (AS)', ['Dynamic equilibrium', "Le Chatelier's principle", 'Introductory acid\u2013base theory']),
    T('Reaction kinetics (AS)', ['Collision theory', 'Factors affecting rate of reaction', 'Catalysts and activation energy']),
    T('The Periodic Table: chemical periodicity', ['Periodic trends in atomic radius, ionisation energy, and melting point', 'Trends across Period 3 oxides and chlorides']),
    T('Group 2', ['Reactivity trends of Group 2 metals', 'Reactions with water and oxygen', 'Solubility trends of hydroxides and sulfates']),
    T('Group 17', ['Trends in reactivity and oxidising power', 'Reactions of halogens and halide ions', 'Uses of chlorine and its compounds']),
    T('Nitrogen and sulfur', ['The nitrogen cycle and ammonia production', 'Oxides of nitrogen and acid rain', 'Sulfur dioxide and the contact process']),
    T('Introduction to organic chemistry', ['Nomenclature of organic compounds', 'Structural, positional, and functional group isomerism', 'Types of organic reaction mechanism']),
    T('Hydrocarbons', ['Reactions of alkanes: substitution', 'Reactions of alkenes: addition, oxidation, polymerisation', 'Mechanism of electrophilic addition']),
    T('Halogen compounds', ['Nucleophilic substitution reactions', 'Elimination reactions', 'Uses and environmental impact of halogenoalkanes']),
    T('Hydroxy compounds', ['Classification of alcohols', 'Oxidation of alcohols', 'Reactions of phenol']),
    T('Carbonyl compounds', ['Reactions of aldehydes and ketones', 'Nucleophilic addition mechanism', 'Tests to distinguish aldehydes and ketones']),
    T('Carboxylic acids and derivatives', ['Reactions of carboxylic acids', 'Esterification', 'Acyl chlorides and their reactions']),
  ];
  const CHEM_CIE_P2 = [
    T('Lattice energy', ['Definitions of enthalpy changes in Born\u2013Haber cycles', 'Constructing and using Born\u2013Haber cycles', 'Factors affecting lattice energy']),
    T('Electrochemistry (A2)', ['Standard electrode potentials', 'The electrochemical series', 'Predicting feasibility of reactions', 'Electrochemical cells and fuel cells']),
    T('Further aspects of equilibria', ['pH, Ka, and Kw calculations', 'Buffer solutions and their action', 'Titration curves and indicators', 'Solubility product Ksp']),
    T('Reaction kinetics (A2)', ['Orders of reaction and rate equations', 'Determining rate equations experimentally', 'The Arrhenius equation', 'Reaction mechanisms and the rate-determining step']),
    T('Entropy and Gibbs free energy', ['Entropy change calculations', 'Gibbs free energy equation', 'Predicting feasibility of reactions']),
    T('Transition elements', ['Electron configuration of transition metals', 'Variable oxidation states', 'Formation of complex ions', 'Ligand exchange and colour', 'Catalytic properties']),
    T('Nitrogen compounds', ['Preparation and reactions of amines', 'Amides and their formation', 'Amino acids and peptide bonds']),
    T('Polymerisation', ['Condensation polymerisation mechanisms', 'Polyesters and polyamides', 'Biodegradability of polymers']),
    T('Organic synthesis', ['Planning multi-step synthetic routes', 'Choosing reagents and conditions', 'Purification and identification of products']),
    T('Analytical techniques', ['Thin layer and column chromatography', 'Mass spectrometry in structure determination', 'Infrared spectroscopy', 'Proton and carbon-13 NMR spectroscopy']),
  ];
  const CHEM_EDEXCEL_P1 = [
    T('Atomic structure and the periodic table', ['Sub-atomic particles and isotopes', 'Electron configuration', 'Ionisation energy trends', 'Periodicity of physical properties']),
    T('Bonding', ['Ionic bonding and lattice energy', 'Covalent and dative bonding', 'Shapes of molecules (VSEPR theory)', 'Intermolecular forces']),
    T('Introduction to organic chemistry', ['IUPAC nomenclature', 'Types of isomerism', 'Reactions of alkanes and alkenes', 'Mechanisms: substitution and addition']),
  ];
  const CHEM_EDEXCEL_P2 = [
    T('Energetics', ['Enthalpy change definitions', "Hess's Law calculations", 'Bond enthalpies']),
    T('Kinetics and equilibria', ['Collision theory and rate of reaction', 'Dynamic equilibrium and Kc', "Le Chatelier's principle"]),
    T('Group chemistry', ['Group 2 reactivity trends', 'Group 17 reactivity and displacement reactions']),
    T('Halogenoalkanes and alcohols', ['Nucleophilic substitution mechanisms', 'Elimination reactions', 'Oxidation of alcohols']),
  ];
  const CHEM_EDEXCEL_P3 = [
    T('Rates of reaction', ['Orders of reaction and rate equations', 'Rate-determining step', 'Effect of temperature on rate constant']),
    T('Equilibria', ['Acid\u2013base theory and pH calculations', 'Buffer solutions', 'Titration curves']),
    T('Redox chemistry', ['Electrode potentials', 'The electrochemical series and cell design']),
    T('Further organic chemistry', ['Reactions of carbonyl compounds', 'Reactions of carboxylic acids and esters', 'Aromatic chemistry and benzene reactions']),
  ];
  const CHEM_EDEXCEL_P4 = [
    T('Transition metals', ['Electron configuration and oxidation states', 'Complex ion formation and colour', 'Catalytic behaviour']),
    T('Further equilibria', ['Solubility product Ksp', 'Entropy and Gibbs free energy']),
    T('Organic nitrogen chemistry', ['Amines: preparation and basicity', 'Amino acids and proteins']),
    T('Polymers and synthesis', ['Condensation polymerisation', 'Planning synthetic routes']),
    T('Analysis', ['Chromatography techniques', 'Mass spectrometry', 'IR and NMR spectroscopy']),
  ];

  const PHYS_IGCSE_CIE = [
    T('Motion, forces and energy', ['Physical quantities and measurement', 'Motion, speed, and acceleration', 'Forces, mass and weight', 'Energy, work, and power']),
    T('Thermal physics', ['Kinetic particle model of matter', 'Thermal properties and temperature', 'Transfer of thermal energy']),
    T('Waves', ['General wave properties', 'Light and reflection/refraction', 'Sound']),
    T('Electricity and magnetism', ['Simple phenomena of magnetism', 'Electrical quantities and circuits', 'Electromagnetic effects']),
    T('Nuclear physics', ['The nuclear atom', 'Radioactivity']),
    T('Space physics', ['Earth and the solar system', 'Stars and the universe']),
  ];
  const PHYS_CIE_P1 = [
    T('Physical quantities and units', ['SI base and derived units', 'Prefixes and scientific notation', 'Estimating physical quantities', 'Errors and uncertainties in measurement', 'Scalars and vectors']),
    T('Kinematics', ['Distance, displacement, speed, and velocity', 'Acceleration', 'The suvat equations of motion', 'Displacement-time and velocity-time graphs', 'Motion under gravity']),
    T('Dynamics', ["Newton's first, second, and third laws", 'Linear momentum', 'Conservation of momentum', 'Elastic and inelastic collisions']),
    T('Forces, density and pressure', ['Types of force', 'Moments and couples', 'Conditions for equilibrium', 'Density and pressure', 'Upthrust and Archimedes principle']),
    T('Work, energy and power', ['Work done by a force', 'Kinetic and potential energy', 'The principle of conservation of energy', 'Power and efficiency']),
    T('Deformation of solids', ['Hooke\u2019s law', 'Stress, strain, and the Young modulus', 'Elastic and plastic deformation']),
    T('Waves', ['Describing waves: amplitude, frequency, wavelength', 'Transverse and longitudinal waves', 'The wave equation', 'The electromagnetic spectrum', 'Polarisation']),
    T('Superposition', ['The principle of superposition', 'Two-source interference and Young\u2019s double slit', 'Diffraction gratings', 'Stationary waves on strings']),
    T('Electricity', ['Electric current and charge', 'Potential difference and EMF', "Resistance and Ohm's law", 'Resistivity']),
    T('D.C. circuits', ['Circuit symbols and rules', 'Series and parallel circuits', 'Potential dividers', 'Internal resistance']),
    T('Particle physics', ['Atomic structure: protons, neutrons, electrons', 'Nucleon and proton number', 'Fundamental particles: quarks and leptons', 'Particle classification']),
  ];
  const PHYS_CIE_P2 = [
    T('Motion in a circle', ['Radians and angular velocity', 'Centripetal acceleration and force', 'Circular motion examples']),
    T('Gravitational fields', ['Gravitational field strength', "Newton's law of gravitation", 'Gravitational potential and orbits']),
    T('Temperature', ['Thermal equilibrium', 'The thermodynamic (Kelvin) scale']),
    T('Ideal gases', ['Boyle\u2019s law and the gas laws', 'The ideal gas equation', 'Kinetic theory of gases']),
    T('Thermodynamics', ['Internal energy', 'The first law of thermodynamics', 'Specific heat capacity and latent heat']),
    T('Oscillations', ['Simple harmonic motion equations', 'Energy in SHM', 'Damping', 'Forced oscillations and resonance']),
    T('Electric fields', ['Electric field strength', 'Coulomb\u2019s law', 'Electric potential']),
    T('Capacitance', ['Capacitance and charge storage', 'Energy stored in a capacitor', 'Charging and discharging through a resistor']),
    T('Magnetic fields', ['Magnetic flux density', 'Force on a current-carrying conductor', 'Force on a moving charge', 'Electromagnetic induction and Faraday\u2019s law']),
    T('Alternating currents', ['Root-mean-square current and voltage', 'Rectification with diodes', 'Smoothing']),
    T('Quantum physics', ['The photoelectric effect', 'Photon energy and wave-particle duality', 'Energy levels and line spectra']),
    T('Nuclear physics', ['Radioactive decay and half-life', 'Nuclear binding energy and mass defect', 'Fission and fusion']),
    T('Astronomy and cosmology', ['Standard candles and luminosity', 'The Doppler effect and redshift', 'Hubble\u2019s law and the Big Bang model']),
  ];
  const PHYS_EDEXCEL_P1 = [
    T('Kinematics', ['Equations of motion (suvat)', 'Displacement-time and velocity-time graphs', 'Projectile motion']),
    T('Momentum and vectors', ['Conservation of linear momentum', 'Resolving vectors into components', 'Elastic and inelastic collisions']),
    T('Forces and moments', ["Newton's laws of motion", 'Moments and equilibrium', 'Friction']),
    T('Energy, work and power', ['Work done', 'Kinetic and potential energy', 'Efficiency and power calculations']),
    T('Materials', ['Density and upthrust', "Hooke's law", 'The Young modulus', 'Stress-strain graphs']),
  ];
  const PHYS_EDEXCEL_P2 = [
    T('Waves', ['Wave properties and the electromagnetic spectrum', 'Refraction and total internal reflection', 'Interference and diffraction', 'Standing waves']),
    T('Electricity', ['Current, charge, and potential difference', 'Resistance and resistivity', 'EMF and internal resistance', 'Series and parallel circuits']),
  ];
  const PHYS_EDEXCEL_P3 = [
    T('Further mechanics', ['Circular motion and centripetal force', 'Simple harmonic motion']),
    T('Electric and magnetic fields', ['Electric field strength and Coulomb\u2019s law', 'Magnetic flux density', 'Electromagnetic induction']),
    T('Particle physics', ['Particle classification: quarks, leptons, hadrons', 'Nuclear radius and Rutherford scattering']),
  ];
  const PHYS_EDEXCEL_P4 = [
    T('Thermodynamics', ['The gas laws and ideal gas equation', 'Kinetic theory', 'The first law of thermodynamics']),
    T('Nuclear physics', ['Radioactive decay and half-life', 'Nuclear binding energy']),
    T('Oscillations', ['Simple harmonic motion equations', 'Damping and resonance']),
    T('Astrophysics and cosmology', ['Stellar evolution and the Hertzsprung-Russell diagram', 'The expanding universe and the Big Bang model']),
  ];

  const MATHS_IGCSE_CIE = [
    T('Number', ['Types of number, place value, and rounding', 'Ratio, proportion, and rates of change']),
    T('Algebra and graphs', ['Algebraic manipulation and equations', 'Sequences', 'Graphs of functions']),
    T('Coordinate geometry', ['Straight line graphs']),
    T('Geometry', ['Geometrical terms and properties', 'Similarity and congruence']),
    T('Mensuration', ['Perimeter, area, and volume']),
    T('Trigonometry', ['Right-angled and non-right-angled triangles']),
    T('Vectors and transformations', ['Vector notation and operations', 'Transformations of shapes']),
    T('Probability', ['Single and combined events']),
    T('Statistics', ['Data collection and representation', 'Averages and measures of spread']),
  ];
  const MATHS_CIE_PURE_P1 = [
    T('Quadratics', ['Completing the square', 'The quadratic formula and discriminant', 'Sketching quadratic graphs', 'Solving quadratic inequalities']),
    T('Functions', ['Domain and range', 'Composite functions', 'Inverse functions', 'Transformations of graphs']),
    T('Coordinate geometry', ['Equations of straight lines', 'Parallel and perpendicular lines', 'Equations of circles', 'Intersection of lines and curves']),
    T('Circular measure', ['Radian measure', 'Arc length', 'Area of a sector']),
    T('Trigonometry', ['Trigonometric ratios and graphs', 'Trigonometric identities', 'Solving trigonometric equations']),
    T('Series', ['The binomial theorem', 'Arithmetic progressions', 'Geometric progressions', 'Sum to infinity']),
    T('Differentiation', ['Gradient of a curve', 'Differentiation from first principles', 'Stationary points', 'Rates of change']),
    T('Integration', ['Integration as the reverse of differentiation', 'Definite integrals and area under a curve', 'Finding the equation of a curve from its gradient']),
  ];
  const MATHS_CIE_PURE_P2 = [
    T('Algebra', ['Algebraic division', 'Partial fractions', 'The modulus function']),
    T('Logarithmic and exponential functions', ['Laws of logarithms', 'Solving equations using logarithms', 'Exponential growth and decay graphs']),
    T('Trigonometry (further)', ['Compound angle formulae', 'Double angle formulae', 'Expressing a sinθ + b cosθ in the form R sin(θ ± α)']),
    T('Differentiation (further)', ['Implicit differentiation', 'Parametric differentiation', 'Differentiating exponential and logarithmic functions']),
    T('Integration (further)', ['Integration by substitution', 'Integration by parts', 'Integration using partial fractions']),
    T('Numerical solutions of equations', ['Locating roots by sign change', 'Iterative methods (fixed-point iteration)']),
    T('Vectors', ['Vector equations of lines', 'The scalar (dot) product', 'Intersection of lines in 3D']),
    T('Differential equations', ['Forming a differential equation from a problem', 'Solving by separation of variables']),
  ];
  const MATHS_CIE_MECH = [
    T('Forces and equilibrium', ['Force diagrams', 'Resolving forces into components', 'Equilibrium of a particle']),
    T('Kinematics of motion in a straight line', ['Displacement-time and velocity-time graphs', 'The suvat equations', 'Motion under gravity']),
    T('Momentum', ['Momentum and impulse', 'Conservation of momentum in collisions']),
    T("Newton's laws of motion", ['Applying F = ma', 'Connected particles: strings and pulleys', 'Motion on an inclined plane']),
    T('Energy, work and power', ['Work done by a force', 'Kinetic and potential energy', 'The work-energy principle', 'Power']),
  ];
  const MATHS_CIE_STATS = [
    T('Representation of data', ['Stem-and-leaf diagrams', 'Histograms with unequal class widths', 'Cumulative frequency graphs and box plots']),
    T('Measures of central tendency and spread', ['Mean, median, and mode from grouped data', 'Variance and standard deviation']),
    T('Permutations and combinations', ['The factorial function', 'Permutations of distinct objects', 'Combinations']),
    T('Probability', ['Addition and multiplication rules', 'Conditional probability', 'Tree diagrams and Venn diagrams']),
    T('Discrete random variables', ['Probability distributions', 'Expectation E(X) and variance Var(X)']),
    T('The normal distribution', ['The normal distribution curve', 'Standardising using the z-value', 'Using normal distribution tables']),
  ];
  const MATHS_EDEXCEL_PURE_P1 = [
    T('Algebraic expressions', ['Multiplying and dividing integer powers', 'Expanding brackets and collecting like terms', 'Expanding the product of two or three expressions', 'Factorising linear, quadratic, and cubic expressions', 'Laws of indices', 'Simplifying surds', 'Rationalising denominators']),
    T('Quadratics', ['Solving quadratics by factorising', 'Completing the square', 'The quadratic formula', 'Sketching quadratic graphs', 'The discriminant']),
    T('Equations and inequalities', ['Linear simultaneous equations', 'Quadratic simultaneous equations', 'Solving linear inequalities', 'Solving quadratic inequalities', 'Regions satisfying inequalities']),
    T('Graphs and transformations', ['Cubic and quartic graphs', 'Reciprocal graphs', 'Points of intersection', 'Translating graphs', 'Stretching graphs', 'Transforming functions']),
    T('Straight line graphs', ['y = mx + c', 'Equations of straight lines', 'Parallel and perpendicular lines', 'Length and area problems']),
    T('Trigonometric ratios', ['The cosine rule', 'The sine rule', 'Areas of triangles', 'Solving triangle problems', 'Graphs of sine, cosine, and tangent', 'Transforming trigonometric graphs']),
    T('Radians', ['Radian measure', 'Arc length', 'Areas of sectors and segments']),
    T('Differentiation', ['Gradients of curves', 'Finding the derivative', 'Differentiating xⁿ', 'Differentiating quadratics', 'Differentiating functions with two or more terms', 'Gradients, tangents, and normals', 'Second order derivatives']),
    T('Integration', ['Finding the indefinite integral', 'Finding the constant of integration', 'Definite integrals', 'Area under a curve']),
  ];
  const MATHS_EDEXCEL_PURE_P2 = [
    T('Algebraic methods', ['Algebraic fractions', 'Dividing polynomials', 'The factor theorem', 'The remainder theorem', 'Mathematical proof', 'Proof by contradiction']),
    T('Coordinate geometry in the (x, y) plane', ['Midpoints and perpendicular bisectors', 'Equation of a circle', 'Angles in a semicircle', 'Tangent to a circle', 'Circles and triangles']),
    T('Exponentials and logarithms', ['Exponential functions', 'The function eˣ', 'Exponential growth and decay', 'Logarithms and their laws', 'Solving equations using logarithms']),
    T('The binomial expansion', ['Expanding (1+x)ⁿ', 'Expanding (a+bx)ⁿ', 'Using binomial expansion for approximations']),
    T('Sequences and series', ['Arithmetic sequences and series', 'Geometric sequences and series', 'Sum to infinity of a geometric series', 'Sigma notation', 'Recurrence relations']),
    T('Trigonometric identities and equations', ['Angles in all four quadrants', 'Exact values of trigonometric ratios', 'Trigonometric identities', 'Solving simple trigonometric equations', 'Solving harder trigonometric equations', 'Equations and identities']),
    T('Differentiation', ['Increasing and decreasing functions', 'Stationary points', 'Sketching gradient functions', 'Modelling with differentiation']),
    T('Integration', ['Definite integrals', 'Areas under curves', 'Areas under the x-axis', 'Areas between curves and lines', 'Areas between two curves', 'The trapezium rule']),
  ];
  const MATHS_EDEXCEL_PURE_P3 = [
    T('Algebraic methods', ['Simplifying algebraic fractions', 'Partial fractions with distinct linear factors', 'Partial fractions with repeated and quadratic factors', 'Algebraic division']),
    T('Functions and graphs', ['The modulus function', 'Functions and mappings', 'Combining transformations', 'Solving modulus equations and inequalities']),
    T('Secant, cosecant and cotangent', ['Definitions of sec, cosec, and cot', 'Graphs of sec x, cosec x, and cot x', 'Using sec x, cosec x, and cot x', 'Trigonometric identities', 'Inverse trigonometric functions']),
    T('Trigonometric addition formulae', ['The addition formulae', 'Using the angle addition formulae', 'Double-angle formulae', 'Solving trigonometric equations', 'Simplifying a cos x ± b sin x', 'Proving trigonometric identities']),
    T('Exponentials and logarithms', ['Exponential functions', 'The function y = eᵃˣ⁺ᵇ + c', 'Natural logarithms', 'Logarithms and non-linear data', 'Exponential modelling']),
    T('Differentiation', ['Differentiating sin x and cos x', 'Differentiating exponentials and logarithms', 'The chain rule', 'The product rule', 'The quotient rule', 'Differentiating trigonometric functions']),
    T('Integration', ['Integrating standard functions', 'Integrating f(ax + b)', 'Using trigonometric identities in integration', 'The reverse chain rule']),
    T('Numerical methods', ['Locating roots by sign change', 'Fixed point iteration']),
  ];
  const MATHS_EDEXCEL_PURE_P4 = [
    T('Proof', ['Proof by contradiction']),
    T('Partial fractions', ['Partial fractions with distinct factors', 'Repeated factors', 'Improper fractions']),
    T('Coordinate geometry in the (x, y) plane', ['Parametric equations', 'Converting between parametric and Cartesian forms', 'Curve sketching with parametric equations']),
    T('Binomial expansion', ['Expanding (1 + x)ⁿ for rational n', 'Expanding (a + bx)ⁿ', 'Using partial fractions with binomial expansion']),
    T('Differentiation', ['Parametric differentiation', 'Implicit differentiation', 'Rates of change']),
    T('Integration', ['Integration using partial fractions', 'Integration by substitution', 'Integration by parts', 'Solving differential equations']),
    T('Vectors', ['3D vectors and position vectors', '3D coordinates', 'Equation of a line in three dimensions', 'Points of intersection', 'The scalar product']),
  ];
  const MATHS_EDEXCEL_MECH_AS = [
    T('Kinematics', ['Displacement, velocity, and acceleration', 'The suvat equations', 'Velocity-time graphs', 'Motion under gravity']),
    T('Dynamics', ["Newton's laws of motion", 'Connected particles: strings and pulleys', 'Motion on an inclined plane']),
    T('Statics', ['Resolving forces', 'Equilibrium of a particle', 'Moments and equilibrium of rigid bodies']),
  ];
  const MATHS_EDEXCEL_MECH_A2 = [
    ...MATHS_EDEXCEL_MECH_AS,
    T('Further kinematics', ['Variable acceleration using calculus', 'Vectors in kinematics']),
    T('Centres of mass', ['Centre of mass of a system of particles', 'Centre of mass of a lamina']),
    T('Work, energy and power', ['Work done by a force', 'Kinetic and potential energy', 'The work-energy principle', 'Power']),
    T('Elastic strings and springs', ["Hooke's law", 'Elastic potential energy']),
  ];
  const MATHS_EDEXCEL_STATS_AS = [
    T('Mathematical modelling', ['What a statistical model is', 'Advantages and disadvantages of modelling']),
    T('Measures of location and spread', ['Types of data', 'Mean, median, and mode', 'Percentiles', 'Range, interquartile range, and interpercentile range', 'Variance and standard deviation', 'Coding']),
    T('Representations of data', ['Histograms', 'Outliers', 'Box plots', 'Stem and leaf diagrams', 'Skewness', 'Comparing data sets']),
    T('Probability', ['Probability vocabulary', 'Venn diagrams', 'Mutually exclusive and independent events', 'Set notation', 'Conditional probability', 'Probability formulae', 'Tree diagrams']),
    T('Correlation and regression', ['Scatter diagrams', 'Linear regression', 'Least squares regression', 'Product moment correlation coefficient', 'Coding in regression and correlation']),
    T('Discrete random variables', ['Probability distributions', 'The cumulative distribution function', 'Expected value E(X)', 'Variance Var(X)']),
    T('The normal distribution', ['The normal distribution curve', 'The standard normal distribution', 'Finding probabilities and values from tables']),
  ];
  const MATHS_EDEXCEL_STATS_A2 = MATHS_EDEXCEL_STATS_AS;

  const FMATHS_IGCSE_CIE = [
    T('Functions', ['Domain, range, composite and inverse functions']),
    T('Quadratic functions', ['Graphs, roots, and the discriminant']),
    T('Indices and surds', ['Laws of indices and surd manipulation']),
    T('Factors of polynomials', ['The factor and remainder theorems']),
    T('Simultaneous equations', ['Linear and non-linear simultaneous equations']),
    T('Logarithmic and exponential functions', ['Laws of logarithms and exponential equations']),
    T('Straight line graphs', ['Gradient, midpoint, and parallel/perpendicular lines']),
    T('Coordinate geometry of the circle', ['Equation of a circle']),
    T('Circular measure', ['Radians, arc length, and sector area']),
    T('Trigonometry', ['Trigonometric graphs, identities, and equations']),
    T('Permutations and combinations', ['Counting principles']),
    T('Series', ['Binomial expansion and arithmetic/geometric series']),
    T('Vectors in two dimensions', ['Vector geometry']),
    T('Differentiation and integration', ['Gradients, stationary points, and basic integration']),
  ];
  const FMATHS_CIE_P1 = [
    T('Roots of polynomial equations', ['Relationships between roots and coefficients']),
    T('Rational functions and graphs', ['Sketching graphs of rational functions']),
    T('Summation of series', ['Method of differences and other summation techniques']),
    T('Matrices', ['Matrix operations, inverses, and simultaneous equations']),
    T('Polar coordinates', ['Polar curves and area calculations']),
    T('Vectors', ['Vector equations of lines and planes']),
    T('Proof by induction', ['Mathematical induction technique']),
  ];
  const FMATHS_CIE_P2 = [
    T('Hyperbolic functions', ['Definitions and identities']),
    T('Matrices', ['Eigenvalues and eigenvectors, diagonalisation']),
    T('Differentiation', ['Further differentiation techniques']),
    T('Integration', ['Further integration techniques']),
    T('Complex numbers', ['De Moivre\u2019s theorem and applications']),
    T('Differential equations', ['First and second order differential equations']),
  ];
  const FMATHS_CIE_MECH = [
    T('Motion of a projectile', ['Projectile motion equations and trajectories']),
    T('Equilibrium of a rigid body', ['Moments and equilibrium conditions']),
    T('Circular motion', ['Motion in a horizontal and vertical circle']),
    T('Hooke\u2019s law', ['Elastic strings and springs, elastic potential energy']),
    T('Linear motion under a variable force', ['Differential equations of motion']),
    T('Momentum', ['Momentum and impulse in more complex situations']),
  ];
  const FMATHS_CIE_STATS = [
    T('Continuous random variables', ['Probability density functions and distributions']),
    T('Inference using normal and t-distributions', ['Confidence intervals and hypothesis tests']),
    T('Chi-squared tests', ['Goodness of fit and contingency table tests']),
    T('Non-parametric tests', ['Sign test and other non-parametric methods']),
    T('Probability generating functions', ['Properties and applications of PGFs']),
  ];
  const FMATHS_EDEXCEL_P1 = [
    T('Complex numbers', ['Imaginary and complex numbers', 'Solving quadratic and cubic equations with complex roots', 'Complex conjugates']),
    T('Argand diagrams', ['Representing complex numbers on an Argand diagram', 'Modulus and argument', 'Loci in the complex plane']),
    T('Roots of equations', ['Relationships between roots and coefficients of quadratics', 'Relationships between roots and coefficients of cubics and quartics']),
    T('Coordinate systems', ['Parametric equations of a parabola', 'Parametric equations of a rectangular hyperbola', 'Equation of the tangent and the equation of the normal']),
    T('Matrices', ['Introduction to matrices', 'Matrix multiplication', 'Determinants', 'Inverting a 2×2 matrix']),
    T('Transformations using matrices', ['Linear transformations in two dimensions', 'Reflections and rotations', 'Enlargements and stretches', 'Successive transformations', 'The inverse of a linear transformation']),
    T('Series', ['Sums of natural numbers', 'Sums of squares and cubes']),
    T('Proof', ['Proof by mathematical induction', 'Proving divisibility results', 'Using induction for a general term of a recurrence relation', 'Proving statements involving matrices']),
  ];
  const FMATHS_EDEXCEL_P2 = [
    T('Inequalities', ['Algebraic and graphical solutions of inequalities']),
    T('Series', ['Method of differences', 'Further summation of series']),
    T('Complex numbers', ['Exponential form of complex numbers', 'Multiplying and dividing complex numbers', "De Moivre's theorem", 'nth roots of a complex number']),
    T('Further Argand diagrams', ['Further loci and regions in the complex plane']),
    T('First-order differential equations', ['Equations with separable variables', 'First-order linear differential equations', 'Reducible first-order differential equations']),
    T('Second-order differential equations', ['Second-order homogeneous differential equations', 'Second-order non-homogeneous differential equations', 'Using boundary conditions', 'Reducible second-order differential equations']),
    T('Maclaurin and Taylor series', ['Higher derivatives', 'Maclaurin series', 'Series expansions of compound functions', 'Taylor series', 'Series solutions of differential equations']),
    T('Polar coordinates', ['Polar coordinates and equations', 'Sketching curves', 'Area enclosed by a polar curve', 'Tangents to polar curves']),
  ];

  // Practical assessment. Cambridge examines it as its own paper — Paper 3 at
  // AS, and Paper 5 at A2 for planning and evaluation — while Edexcel
  // International assesses it in Units 3 and 6. The skills are examined rather
  // than merely performed, so they are worth tracking like any other topic.
  const BIO_PRAC_IGCSE = [
    T('Using apparatus', ['Choosing and reading measuring cylinders, thermometers and timers', 'Using a microscope', 'Preparing a temporary slide', 'Calculating magnification']),
    T('Biological drawing', ['Drawing what is observed rather than what is expected', 'Labelling with straight, uncrossed lines', 'Adding a scale or magnification']),
    T('Handling variables', ['Identifying independent, dependent and control variables', 'Describing how each control variable is kept constant', 'Deciding how many repeats to take']),
    T('Standard biological tests', ['Benedict test for reducing sugars', 'Iodine test for starch', 'Biuret test for protein', 'Emulsion test for fats']),
    T('Recording and presenting results', ['Ruled tables with headings and units', 'Plotting line graphs and bar charts', 'Calculating means and rates']),
    T('Analysis and evaluation', ['Describing a trend in the data', 'Identifying anomalous results', 'Suggesting sources of error', 'Suggesting improvements to the method']),
  ];
  const BIO_PRAC_ADV = [
    T('Microscopy and drawing', ['Preparing and staining temporary slides', 'Using an eyepiece graticule and stage micrometer', 'Calculating actual size and magnification', 'Plan diagrams and high-power detail']),
    T('Quantitative techniques', ['Serial dilutions and standard curves', 'Using a colorimeter', 'Potometers and respirometers', 'Controlling temperature with a water bath']),
    T('Experimental design', ['Identifying and controlling variables', 'Choosing a sensible range and interval', 'Replication and reliability', 'Assessing risk']),
    T('Presenting data', ['Tables with the quantity and unit in the heading', 'Choosing axes and scales', 'Error bars and ranges']),
    T('Analysis', ['Finding a rate from a tangent or gradient', 'Percentage change and percentage error', 'Judging whether a difference is significant', 'Dealing with anomalies']),
    T('Evaluation', ['Distinguishing systematic from random error', 'Judging the limitations of the method', 'Proposing specific improvements']),
  ];

  const CHEM_PRAC_IGCSE = [
    T('Using apparatus', ['Reading a burette, pipette and measuring cylinder', 'Using a balance and a thermometer', 'Timing a reaction']),
    T('Separation techniques', ['Filtration and evaporation', 'Crystallisation', 'Simple and fractional distillation', 'Paper chromatography and Rf values']),
    T('Titration', ['Technique for accurate transfer', 'Choosing and using an indicator', 'Obtaining concordant titres', 'Calculating an unknown concentration']),
    T('Rates of reaction', ['Collecting and measuring a gas', 'Following a reaction by loss of mass', 'Timing a colour change or precipitate']),
    T('Qualitative analysis', ['Tests for cations', 'Tests for anions', 'Tests for gases', 'Flame tests']),
    T('Analysis and evaluation', ['Recording readings to a consistent precision', 'Identifying anomalous titres', 'Suggesting sources of error and improvements']),
  ];
  const CHEM_PRAC_ADV = [
    T('Volumetric analysis', ['Preparing a standard solution', 'Accurate burette and pipette technique', 'Concordant titres and the mean titre', 'Titration calculations']),
    T('Thermochemistry', ['Calorimetry technique', 'Temperature-time graphs and extrapolation', 'Calculating an enthalpy change from results']),
    T('Rates', ['Initial-rate methods', 'Clock reactions', 'Following a reaction by titration or colorimetry', 'Determining order from results']),
    T('Qualitative analysis', ['Tests for cations and anions', 'Tests for gases', 'Tests for organic functional groups']),
    T('Organic preparation', ['Heating under reflux', 'Distilling a product', 'Purification and recrystallisation', 'Melting point as a measure of purity']),
    T('Uncertainty and evaluation', ['Apparatus uncertainties and how they combine', 'Percentage error in a measurement', 'Systematic versus random error', 'Suggesting improvements']),
  ];

  const PHYS_PRAC_IGCSE = [
    T('Measuring instruments', ['Rulers, protractors and set squares', 'Balances and measuring cylinders', 'Thermometers', 'Timing with a stopwatch and reducing reaction-time error']),
    T('Electrical measurement', ['Setting up a circuit from a diagram', 'Using an ammeter and a voltmeter', 'Choosing a sensible range']),
    T('Standard experiments', ['Density of a solid and of a liquid', 'Extension of a spring', 'Timing a pendulum', 'Reflection and refraction of light', 'Simple thermal experiments']),
    T('Recording and graphing', ['Tables with units and consistent precision', 'Choosing scales and plotting points', 'Drawing a line of best fit', 'Finding a gradient']),
    T('Analysis and evaluation', ['Repeating readings and averaging', 'Identifying anomalies', 'Describing sources of error', 'Suggesting improvements']),
  ];
  const PHYS_PRAC_ADV = [
    T('Measurement technique', ['Vernier callipers and the micrometer screw gauge', 'Choosing an instrument for the precision needed', 'Timing many oscillations to reduce error', 'Zero errors and how to correct for them']),
    T('Electrical experiments', ['Determining resistivity', 'Measuring EMF and internal resistance', 'Potential dividers', 'Finding the characteristic of a component']),
    T('Mechanics experiments', ['Determining g by free fall', 'Spring constant from force and extension', 'The Young modulus of a wire']),
    T('Graphical analysis', ['Rearranging an equation into y = mx + c', 'Taking the gradient and intercept from a graph', 'Using log graphs to find a power law']),
    T('Uncertainties', ['Absolute, fractional and percentage uncertainty', 'Combining uncertainties through a calculation', 'Error bars and the worst acceptable line']),
    T('Evaluation', ['Systematic versus random error', 'Judging the largest source of uncertainty', 'Proposing specific improvements']),
  ];

  // Cambridge A2 examines planning and evaluation as a paper of its own, and
  // the skills are the same whichever science it sits under.
  const PRAC_PLANNING = [
    T('Planning an investigation', ['Defining the problem and the variables', 'Choosing apparatus and justifying the choice', 'Describing a method another student could follow', 'Controlling variables and assessing risk']),
    T('Analysis of results', ['Rearranging a relationship into a straight line', 'Determining constants from gradient and intercept', 'Using logarithms for exponential and power relationships']),
    T('Treatment of uncertainty', ['Estimating the uncertainty in each measurement', 'Propagating uncertainty through a calculation', 'Plotting error bars', 'Drawing the worst acceptable line']),
    T('Conclusions and evaluation', ['Deciding whether the results support the hypothesis', 'Judging whether a conclusion survives the uncertainty', 'Identifying limitations and improvements']),
  ];

  const BUS_IGCSE = [
    T('Understanding business activity', ['Purpose and nature of business activity', 'Classification of businesses', 'Enterprise and entrepreneurship', 'Business size and growth', 'Types of business organisation', 'Business objectives and stakeholders']),
    T('People in business', ['Motivation of employees', 'Organisational structure', 'Recruitment, selection, and training', 'Internal and external communication']),
    T('Marketing', ['Market research', 'The marketing mix (4Ps)', 'Market segmentation']),
    T('Operations management', ['Production methods', 'Quality assurance and lean production']),
    T('Financial information and decisions', ['Sources of finance', 'Cash flow forecasting', 'Costs, revenue, and profit', 'Final accounts']),
    T('External influences on business', ['Government economic policy', 'Business ethics and environmental concerns', 'International trade and globalisation']),
  ];
  const BUS_CIE_P1 = [
    T('Enterprise', ['The nature of business activity', 'The role of entrepreneurs and intrapreneurs', 'Business plans']),
    T('Business structure', ['Economic sectors', 'Business ownership', 'Unlimited and limited liability']),
    T('Size of business', ['Measuring business size', 'Significance of small businesses', 'Business growth: mergers and takeovers']),
    T('Business objectives', ['Objectives in the private and public sector', 'Corporate social responsibility', 'Objectives and business decisions']),
    T('Stakeholders in a business', ['Internal and external stakeholders', 'Stakeholder influence on business activities']),
    T('Human resource management', ['Workforce planning', 'Recruitment and selection', 'Redundancy and dismissal', 'Training and development']),
    T('Motivation', ['Human needs at work', 'Motivation theories: Taylor, Mayo, Maslow, Herzberg, McClelland, Vroom', 'Financial and non-financial motivators']),
    T('Management', ['Management functions and roles', 'Management styles', "McGregor's Theory X and Theory Y"]),
    T('The nature of marketing', ['Demand and supply', 'Market segmentation', 'Mass vs niche marketing', 'Customer relationship marketing']),
    T('Market research', ['Primary and secondary research', 'Sampling', 'Interpreting market research data']),
    T('The marketing mix', ['Product and product portfolio analysis', 'Pricing methods', 'Promotion methods', 'Place and distribution']),
    T('The nature of operations', ['The transformational process', 'Efficiency and productivity', 'Capital vs labour intensive operations', 'Operations methods: job, batch, flow']),
    T('Inventory management', ['Managing inventory', 'Just in Time (JIT)']),
    T('Capacity utilisation and outsourcing', ['Measuring capacity utilisation', 'Impact of outsourcing']),
    T('Business finance', ['The need for business finance', 'Working capital']),
    T('Sources of finance', ['Internal and external sources', 'Factors affecting choice of finance']),
    T('Forecasting and managing cash flows', ['Cash flow forecasts', 'Improving cash flow']),
    T('Costs', ['Types of costs', 'Full and contribution costing', 'Break-even analysis']),
    T('Budgets', ['Purpose of budgets', 'Variances']),
  ];
  const BUS_CIE_P2 = [
    T('External influences on business activity', ['Political and legal influences', 'Economic influences', 'Social and demographic influences', 'Technological influences', 'International influences', 'Environmental influences']),
    T('Business strategy', ['SWOT and PEST analysis', "Porter's five forces", 'Ansoff matrix', 'Corporate planning and culture']),
    T('Organisational structure', ['Types of structure: functional, hierarchical, matrix', 'Delegation and accountability', 'Centralisation and decentralisation']),
    T('Business communication', ['Methods and channels of communication', 'Barriers to communication']),
    T('Leadership', ['Leadership theories', 'Emotional intelligence']),
    T('Human resource management strategy', ["Hard vs soft HRM", 'Flexible working contracts', 'Management by Objectives']),
    T('Marketing analysis', ['Elasticity of demand', 'Product development', 'Sales forecasting']),
    T('Marketing strategy', ['Planning the marketing strategy', 'International marketing strategies']),
    T('Location and scale', ['Location factors', 'Economies and diseconomies of scale']),
    T('Quality management', ['Quality control and quality assurance', 'Total Quality Management', 'Benchmarking']),
    T('Operations strategy', ['Enterprise resource planning', 'Lean production', 'Critical Path Analysis']),
    T('Financial statements', ['Statement of profit or loss', 'Statement of financial position', 'Depreciation']),
    T('Analysis of published accounts', ['Liquidity, profitability, and efficiency ratios', 'Gearing and investment ratios']),
    T('Investment appraisal', ['Payback and accounting rate of return', 'Net present value']),
    T('Finance and accounting strategy', ['Using accounting data for strategic decisions', 'Ratio analysis in strategy']),
  ];

  const ECON_IGCSE = [
    T('Basic economic problem', ['Scarcity and choice', 'Factors of production', 'Opportunity cost']),
    T('The allocation of resources', ['Demand and supply', 'Price determination', 'Market economic systems']),
    T('Microeconomic decision makers', ['Money and banking', 'Households as consumers and workers', 'Firms and production']),
    T('Government and the macroeconomy', ['Government economic policy objectives', 'Fiscal, monetary, and supply-side policy']),
    T('Economic development', ['Living standards and measures of development']),
    T('International trade and globalisation', ['Trade, exchange rates, and globalisation']),
  ];
  const ECON_CIE_P1 = [
    T('Scarcity, choice and opportunity cost', ['The fundamental economic problem', 'Basic questions of resource allocation']),
    T('Economic methodology', ['Positive and normative statements', 'Ceteris paribus']),
    T('Factors of production', ['Land, labour, capital, and enterprise', 'Division of labour and specialisation']),
    T('Resource allocation in different economic systems', ['Market, planned, and mixed economies']),
    T('Production possibility curves', ['Shape, shifts, and significance of a PPC']),
    T('Classification of goods and services', ['Free, private, public, merit, and demerit goods']),
    T('Demand and supply curves', ['Determinants of demand and supply', 'Shifts vs movements along curves']),
    T('Price, income, and cross elasticity of demand', ['Formulae and interpretation of elasticity values']),
    T('Price elasticity of supply', ['Factors affecting elasticity of supply']),
    T('The interaction of demand and supply', ['Market equilibrium and disequilibrium', 'Functions of price']),
    T('Consumer and producer surplus', ['Causes of changes in surplus']),
    T('Reasons for government intervention in markets', ['Public goods, merit and demerit goods, price controls']),
    T('Methods and effects of government intervention', ['Taxes, subsidies, direct provision, buffer stocks']),
    T('Addressing income and wealth inequality', ['Measuring inequality', 'Redistribution policies']),
    T('National income statistics', ['GDP, GNI, NNI measurement']),
    T('The circular flow of income', ['Injections and leakages']),
    T('Aggregate Demand and Aggregate Supply analysis', ['AD/AS curves and equilibrium']),
    T('Economic growth', ['Measurement and causes of growth']),
    T('Unemployment', ['Types and causes of unemployment']),
    T('Price stability', ['Inflation, deflation, and measurement of price changes']),
    T('Government macroeconomic policy objectives', ['Price stability, low unemployment, economic growth']),
    T('Fiscal policy', ['Government budget, taxation, government spending']),
    T('Monetary policy', ['Interest rates, money supply, credit regulation']),
    T('Supply-side policy', ['Tools and objectives of supply-side policy']),
    T('The reasons for international trade', ['Absolute and comparative advantage']),
    T('Protectionism', ['Tariffs, quotas, subsidies, and arguments for/against']),
    T('Current account of the balance of payments', ['Components and calculation of the current account']),
    T('Exchange rates', ['Floating exchange rate determination']),
    T('Policies to correct current account imbalances', ['Fiscal, monetary, supply-side, and protectionist effects']),
  ];
  const ECON_CIE_P2 = [
    T('Utility', ['Total and marginal utility', 'Diminishing marginal utility']),
    T('Indifference curves and budget lines', ['Income, substitution, and price effects']),
    T('Efficiency and market failure', ['Productive and allocative efficiency', 'Reasons for market failure']),
    T('Private costs, externalities, and social costs', ['Positive and negative externalities']),
    T('Costs, revenue, and profit', ['Short-run and long-run production and cost functions']),
    T('Different market structures', ['Perfect competition, monopoly, monopolistic competition, oligopoly']),
    T('Growth and survival of firms', ['Internal and external growth, integration, cartels']),
    T('Differing objectives and policies of firms', ['Price discrimination and other pricing policies']),
    T('Government policies to correct market failure', ['Taxes, subsidies, regulation, pollution permits']),
    T('Equity and redistribution of income and wealth', ['Absolute and relative poverty, redistribution policies']),
    T('Labour market forces and government intervention', ['Wage determination', 'Transfer earnings and economic rent']),
    T('The circular flow of income and the multiplier', ['Multiplier calculation and national income determination']),
    T('Economic growth and sustainability', ['Business cycle', 'Inclusive and sustainable growth']),
    T('Employment and unemployment', ['Natural rate of unemployment', 'Labour mobility']),
    T('Money and banking', ['Functions of money', 'Commercial and central banks']),
    T('Government macroeconomic policy objectives (A Level)', ['Inflation, balance of payments, growth, development']),
    T('Links between macroeconomic problems', ['Phillips curve', 'Relationships between growth, inflation, and trade']),
    T('Effectiveness of policy options', ['Comparing fiscal, monetary, supply-side, and exchange rate policy']),
    T('Policies to correct balance of payments disequilibrium', ['Expenditure-switching and expenditure-reducing policies']),
    T('Exchange rates (A Level)', ['Fixed and managed exchange rate systems']),
    T('Economic development', ['Indicators of living standards and development']),
    T('Characteristics of countries at different development levels', ['Population, income distribution, economic structure']),
    T('Relationship between countries at different development levels', ['International aid, multinationals, FDI, external debt']),
    T('Globalisation', ['Trade blocs, trade creation, and trade diversion']),
  ];

  const CS_IGCSE = [
    T('Data representation', ['Number systems and binary', 'Data storage and compression']),
    T('Communication and internet technologies', ['Networks and the internet', 'Cyber security']),
    T('Hardware and software', ['Computer architecture', 'Types of software and programming languages']),
    T('Security and ethics', ['Data security', 'Ethical, legal, and environmental impacts']),
    T('Algorithm design and problem-solving', ['Flowcharts and pseudocode', 'Structured programming constructs']),
    T('Programming', ['Programming concepts and data structures']),
  ];
  // 9618 examines theory and programming as separate papers at both levels:
  // Papers 1 and 2 at AS, Papers 3 and 4 at A2. They were previously merged
  // into one list each, which left AS Paper 2 with nothing to load.
  const CS_CIE_AS_P1 = [
    T('Information representation', ['Number systems and binary', 'Representing text, sound and images', 'Data compression', 'User-defined data types']),
    T('Communication', ['Networks and network topologies', 'The internet and how data is transmitted', 'Network hardware and protocols']),
    T('Hardware', ['Computer architecture and the CPU', 'Input, output and storage devices', 'Logic gates and logic circuits']),
    T('Processor fundamentals', ['The Von Neumann model and registers', 'The fetch-decode-execute cycle', 'Assembly language and addressing modes', 'Interrupts']),
    T('System software', ['The role of the operating system', 'Utility software', 'Interpreters, compilers and assemblers']),
    T('Security, privacy and data integrity', ['Threats to data', 'Encryption, firewalls and authentication', 'Validation and verification']),
    T('Ethics and ownership', ['Copyright and software licensing', 'Professional and ethical conduct']),
    T('Databases', ['Limitations of a file-based approach', 'Relational database design and normalisation', 'Data dictionaries and DBMS features', 'SQL for querying and defining data']),
  ];
  const CS_CIE_AS_P2 = [
    T('Algorithm design and problem-solving', ['Decomposition and abstraction', 'Structure charts, flowcharts and pseudocode', 'Trace tables and dry running', 'Identifying and correcting errors']),
    T('Data types and structures', ['Data types and how they are chosen', 'Arrays: one and two dimensional', 'Records and files', 'Reading from and writing to text files']),
    T('Programming', ['Sequence, selection and iteration', 'Procedures, functions and parameters', 'Local and global variables', 'Built-in and user-defined functions']),
    T('Software development', ['The program development life cycle', 'Design methods and modular programming', 'Test data: normal, boundary and erroneous', 'Types of testing and maintenance']),
  ];
  const CS_CIE_A2_P3 = [
    T('Data representation (advanced)', ['Floating-point numbers and normalisation', 'Underflow and overflow']),
    T('Communication and networking', ['Client-server and peer-to-peer models', 'Cloud computing and storage', 'Protocols and packet switching']),
    T('Hardware and virtual machines', ['Parallel processing and RISC/CISC', 'Virtual machines and their uses', 'Boolean algebra and Karnaugh maps']),
    T('System software (advanced)', ['Process scheduling and states', 'Memory management, paging and virtual memory', 'Translation software in depth']),
    T('Security (advanced)', ['Asymmetric encryption and digital signatures', 'Digital certificates and SSL/TLS', 'Malware and countermeasures']),
    T('Artificial intelligence', ['Graphs and A* search', 'Machine learning: supervised and unsupervised', 'Artificial neural networks and deep learning']),
  ];
  const CS_CIE_A2_P4 = [
    T('Computational thinking', ['Abstraction and decomposition in larger problems', 'Algorithm efficiency and Big O notation']),
    T('Algorithms', ['Linear and binary search', 'Bubble and insertion sort', 'Stacks, queues, linked lists and trees', 'Traversal algorithms']),
    T('Recursion', ['Writing and tracing recursive routines', 'How recursion uses the stack', 'Converting between recursive and iterative solutions']),
    T('Programming paradigms', ['Low-level programming', 'Imperative and procedural programming', 'Object-oriented programming: classes, inheritance, polymorphism', 'Declarative programming and queries']),
    T('File and exception handling', ['Random and sequential file access', 'Exception handling in programs']),
  ];

  const ACC_IGCSE = [
    T('The fundamentals of accounting', ['Purpose of accounting', 'Accounting principles and policies']),
    T('Sources and recording of data', ['Double entry bookkeeping', 'Business documents and books of prime entry']),
    T('Verification of accounting records', ['Trial balance and correction of errors', 'Bank reconciliation statements']),
    T('Accounting procedures', ['Non-current assets and depreciation', 'Bad debts and provisions']),
    T('Preparation of financial statements', ['Income statements', 'Statements of financial position', 'Accounts of non-trading organisations']),
    T('Analysis and interpretation', ['Accounting ratios', 'Users of accounts']),
    T('Accounting principles and policies', ['Accounting concepts and their application']),
    T('Other aspects of accounting', ['Incomplete records', 'Partnerships and limited companies']),
  ];

  const ENGLIT_IGCSE = [
    T('Poetry', ['Analysis of set poems: language, form, and structure']),
    T('Prose', ['Analysis of a set novel: character, theme, and narrative technique']),
    T('Drama', ['Analysis of a set play: character, theme, and dramatic technique']),
    T('Unseen texts', ['Responding to unseen poetry and prose']),
  ];
  const ENGLIT_CIE_P1 = [
    T('Drama (set text)', ['Study of a set play: character, theme, and dramatic technique']),
    T('Poetry (set text)', ['Close analysis of set poems: language, form, and structure']),
  ];
  const ENGLIT_CIE_P2 = [
    T('Prose (set text)', ['Study of a set novel: narrative technique and theme']),
    T('Unseen texts', ['Critical appreciation of unseen poetry and prose']),
  ];
  const ENGLIT_CIE_P3 = [
    T('Shakespeare (set text)', ['Close study of a set Shakespeare play']),
    T('Drama (further set text)', ['Study of a second set play']),
  ];
  const ENGLIT_CIE_P4 = [
    T('Poetry pre-1900', ['Close study of a pre-1900 poetry set text']),
    T('Prose post-1900', ['Study of a post-1900 prose set text']),
  ];

  const PSYCH_IGCSE = [
    T('Research methods', ['Experiments, case studies, and surveys', 'Ethics in psychological research']),
    T('Biological psychology', ['The brain and nervous system', 'Sleep and dreaming']),
    T('Cognitive psychology', ['Memory', 'Perception']),
    T('Developmental psychology', ['Cognitive and moral development']),
    T('Social psychology', ['Conformity and obedience', 'Prejudice and discrimination']),
    T('Individual differences', ['Intelligence', 'Personality']),
    T('Health psychology', ['Stress and coping', 'Substance abuse']),
  ];
  const PSYCH_CIE_P1 = [
    T('The biological approach', ['Core studies in biological psychology', 'Brain structure and behaviour']),
    T('The cognitive approach', ['Core studies in cognitive psychology', 'Memory and perception']),
    T('The learning approach', ['Core studies in behaviourist and social learning theory']),
    T('The social approach', ['Core studies in social psychology', 'Conformity and obedience']),
    T('Research methods', ['Experimental design', 'Data analysis and hypothesis testing']),
    T('Issues and debates in psychology', ['Ethics, nature vs nurture, reductionism, and free will']),
  ];
  const PSYCH_CIE_P2 = [
    T('Clinical psychology (specialist option)', ['Diagnosis, symptoms, and treatment of mental disorders']),
    T('Consumer psychology (specialist option)', ['Advertising and consumer decision-making']),
    T('Health psychology (specialist option)', ['Health beliefs, stress, and adherence to treatment']),
    T('Organisational psychology (specialist option)', ['Motivation, leadership, and work satisfaction']),
  ];

  const LANG_IGCSE = (lang) => [
    T('Everyday activities', [`Home life, school, and daily routine in ${lang}`]),
    T('Personal and social life', ['Family, relationships, and free time']),
    T('The world around us', ['Home town, environment, and weather']),
    T('The world of work', ['Careers, study, and future plans']),
    T('The international world', ['Travel, tourism, and life in other countries']),
    T('Listening skills', ['Understanding spoken material across topics']),
    T('Reading skills', ['Understanding written material across topics']),
    T('Writing skills', ['Structured writing tasks and translation']),
    T('Speaking skills', ['Role play and conversation']),
  ];

  const ENVM_IGCSE = [
    T('Ecosystems', ['Ecosystem structure and function', 'Biodiversity']),
    T('Global challenges', ['Population growth and food supply', 'Climate change']),
    T('Energy resources', ['Non-renewable and renewable energy']),
    T('Water resources', ['Water availability and management']),
    T('Land use and living resources', ['Agriculture, forestry, and fishing']),
    T('Waste and pollution management', ['Types of pollution and waste management strategies']),
    T('Sustainability', ['Conservation and sustainable development']),
  ];

  const ICT_IGCSE = [
    T('Types and components of computer systems', ['Hardware and software', 'Input, output, and storage devices']),
    T('Input and output devices', ['Choosing appropriate devices for tasks']),
    T('Storage devices and media', ['Types and uses of storage']),
    T('Networks and the effects of using them', ['Network types', 'The internet and the World Wide Web']),
    T('The effects of using IT', ['Health, safety, and security issues']),
    T('ICT applications', ['Applications in communication, data handling, and modelling']),
    T('Systems life cycle', ['Analysis, design, implementation, and evaluation']),
    T('Safety and security', ['E-safety and data protection']),
    T('Audience and communication', ['Creating documents for different audiences']),
    T('File management', ['Organising and manipulating files']),
    T('Images, layout, charts, and graphs', ['Creating and editing digital content']),
    T('Document production, data manipulation, and presentations', ['Word processing, spreadsheets, and presentation software']),
    T('Data analysis and website authoring', ['Databases and website creation']),
  ];

  const ART_CIE = [
    T('Coursework/personal study', ['Development of a personal portfolio across a chosen area']),
    T('Observational and recording skills', ['Drawing and recording from direct observation']),
    T('Development of ideas', ['Research, experimentation, and refinement of ideas']),
    T('Materials, techniques, and processes', ['Exploration of media appropriate to the chosen area']),
    T('Presentation and evaluation', ['Presenting a coherent body of work with critical reflection']),
  ];

  return {
    'Biology': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': BIO_IGCSE_CIE, 'Paper 3': BIO_PRAC_IGCSE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': BIO_CIE_P1, 'Paper 3': BIO_PRAC_ADV },
        'Edexcel International': { 'Paper 1': BIO_EDEXCEL_P1, 'Paper 2': BIO_EDEXCEL_P2, 'Paper 3': BIO_PRAC_ADV },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': BIO_CIE_P1, 'Paper 2': BIO_CIE_P2, 'Paper 3': BIO_PRAC_ADV, 'Paper 5': PRAC_PLANNING },
        'Edexcel International': { 'Paper 1': BIO_EDEXCEL_P1, 'Paper 2': BIO_EDEXCEL_P2, 'Paper 3': BIO_EDEXCEL_P3, 'Paper 4': BIO_EDEXCEL_P4, 'Paper 5': BIO_PRAC_ADV },
      },
    },
    'Chemistry': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': CHEM_IGCSE_CIE, 'Paper 3': CHEM_PRAC_IGCSE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': CHEM_CIE_P1, 'Paper 3': CHEM_PRAC_ADV },
        'Edexcel International': { 'Paper 1': CHEM_EDEXCEL_P1, 'Paper 2': CHEM_EDEXCEL_P2, 'Paper 3': CHEM_PRAC_ADV },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': CHEM_CIE_P1, 'Paper 2': CHEM_CIE_P2, 'Paper 3': CHEM_PRAC_ADV, 'Paper 5': PRAC_PLANNING },
        'Edexcel International': { 'Paper 1': CHEM_EDEXCEL_P1, 'Paper 2': CHEM_EDEXCEL_P2, 'Paper 3': CHEM_EDEXCEL_P3, 'Paper 4': CHEM_EDEXCEL_P4, 'Paper 5': CHEM_PRAC_ADV },
      },
    },
    'Physics': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': PHYS_IGCSE_CIE, 'Paper 3': PHYS_PRAC_IGCSE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': PHYS_CIE_P1, 'Paper 3': PHYS_PRAC_ADV },
        'Edexcel International': { 'Paper 1': PHYS_EDEXCEL_P1, 'Paper 2': PHYS_EDEXCEL_P2, 'Paper 3': PHYS_PRAC_ADV },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': PHYS_CIE_P1, 'Paper 2': PHYS_CIE_P2, 'Paper 3': PHYS_PRAC_ADV, 'Paper 5': PRAC_PLANNING },
        'Edexcel International': { 'Paper 1': PHYS_EDEXCEL_P1, 'Paper 2': PHYS_EDEXCEL_P2, 'Paper 3': PHYS_EDEXCEL_P3, 'Paper 4': PHYS_EDEXCEL_P4, 'Paper 5': PHYS_PRAC_ADV },
      },
    },
    'Maths': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': MATHS_IGCSE_CIE } },
      AS: {
        'Cambridge (CIE)': { Pure: { 'Paper 1': MATHS_CIE_PURE_P1 }, Mechanics: { 'Mech 1': MATHS_CIE_MECH }, Statistics: { 'Stats 1': MATHS_CIE_STATS } },
        'Edexcel International': { Pure: { 'Paper 1': MATHS_EDEXCEL_PURE_P1, 'Paper 2': MATHS_EDEXCEL_PURE_P2 }, Mechanics: { 'Mech 1': MATHS_EDEXCEL_MECH_AS }, Statistics: { 'Stats 1': MATHS_EDEXCEL_STATS_AS } },
      },
      'A Level': {
        'Cambridge (CIE)': { Pure: { 'Paper 1': MATHS_CIE_PURE_P1, 'Paper 2': MATHS_CIE_PURE_P2 }, Mechanics: { 'Mech 1': MATHS_CIE_MECH }, Statistics: { 'Stats 1': MATHS_CIE_STATS } },
        'Edexcel International': { Pure: { 'Paper 1': MATHS_EDEXCEL_PURE_P1, 'Paper 2': MATHS_EDEXCEL_PURE_P2, 'Paper 3': MATHS_EDEXCEL_PURE_P3, 'Paper 4': MATHS_EDEXCEL_PURE_P4 }, Mechanics: { 'Mech 1': MATHS_EDEXCEL_MECH_A2 }, Statistics: { 'Stats 1': MATHS_EDEXCEL_STATS_A2 } },
      },
    },
    'Further Maths': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': FMATHS_IGCSE_CIE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': FMATHS_CIE_P1, 'Mech 1': FMATHS_CIE_MECH, 'Stats 1': FMATHS_CIE_STATS },
        'Edexcel International': { 'Paper 1': FMATHS_EDEXCEL_P1 },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': FMATHS_CIE_P1, 'Paper 2': FMATHS_CIE_P2, 'Mech 1': FMATHS_CIE_MECH, 'Stats 1': FMATHS_CIE_STATS },
        'Edexcel International': { 'Paper 1': FMATHS_EDEXCEL_P1, 'Paper 2': FMATHS_EDEXCEL_P2 },
      },
    },
    'Business': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': BUS_IGCSE } },
      AS: { 'Cambridge (CIE)': { 'Paper 1': BUS_CIE_P1 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': BUS_CIE_P1, 'Paper 2': BUS_CIE_P2 } },
    },
    'Economics': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': ECON_IGCSE } },
      AS: { 'Cambridge (CIE)': { 'Paper 1': ECON_CIE_P1 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': ECON_CIE_P1, 'Paper 2': ECON_CIE_P2 } },
    },
    'Computer Science': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': CS_IGCSE } },
      AS: { 'Cambridge (CIE)': { 'Paper 1': CS_CIE_AS_P1, 'Paper 2': CS_CIE_AS_P2 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': CS_CIE_AS_P1, 'Paper 2': CS_CIE_AS_P2, 'Paper 3': CS_CIE_A2_P3, 'Paper 4': CS_CIE_A2_P4 } },
    },
    'Accounting': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': ACC_IGCSE } },
    },
    'English Literature': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': ENGLIT_IGCSE } },
      AS: { 'Cambridge (CIE)': { 'Paper 1': ENGLIT_CIE_P1, 'Paper 2': ENGLIT_CIE_P2 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': ENGLIT_CIE_P1, 'Paper 2': ENGLIT_CIE_P2, 'Paper 3': ENGLIT_CIE_P3, 'Paper 4': ENGLIT_CIE_P4 } },
    },
    'Psychology': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': PSYCH_IGCSE } },
      AS: { 'Cambridge (CIE)': { 'Paper 1': PSYCH_CIE_P1 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': PSYCH_CIE_P1, 'Paper 2': PSYCH_CIE_P2 } },
    },
    'French': { IGCSE: { 'Cambridge (CIE)': { 'Paper 1': LANG_IGCSE('French') }, 'Edexcel International': { 'Paper 1': LANG_IGCSE('French') } } },
    'German': { IGCSE: { 'Cambridge (CIE)': { 'Paper 1': LANG_IGCSE('German') } } },
    'Spanish': { IGCSE: { 'Cambridge (CIE)': { 'Paper 1': LANG_IGCSE('Spanish') }, 'Edexcel International': { 'Paper 1': LANG_IGCSE('Spanish') } } },
    'Environmental Management': { IGCSE: { 'Cambridge (CIE)': { 'Paper 1': ENVM_IGCSE } } },
    'ICT': { IGCSE: { 'Cambridge (CIE)': { 'Paper 1': ICT_IGCSE } } },
    'Art & Design': { 'A Level': { 'Cambridge (CIE)': { 'Paper 1': ART_CIE } } },
  };
})();


export function getSeedData(subject) {
  const bySubject = SEED_DATA[subject.name];
  if (!bySubject) return null;
  const byLevel = bySubject[subject.level];
  if (!byLevel) return null;
  const byBoard = byLevel[subject.board];
  if (!byBoard) return null;
  // Maths is keyed by component first, then filtered by what was selected
  if (subject.name === 'Maths') {
    const components = subject.components && subject.components.length ? subject.components : ['Pure'];
    const merged = {};
    components.forEach(c => {
      const compPapers = byBoard[c];
      if (!compPapers) return;
      Object.entries(compPapers).forEach(([paper, topics]) => {
        merged[paper] = topics;
      });
    });
    return Object.keys(merged).length ? merged : null;
  }
  return byBoard;
}
