import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronDown, ChevronRight, Circle, CircleDot, CheckCircle2, X, BookOpen, GraduationCap, ClipboardList, Image as ImageIcon, Loader2, Target, CalendarCheck, FileText, Bell, BellOff } from 'lucide-react';

const STORAGE_KEY = 'study-tracker:subjects';

const BOARDS = ['Edexcel International', 'Cambridge (CIE)'];

const SUBJECT_BOARDS = {
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

const LEVELS = Object.keys(SUBJECT_BOARDS);
const OTHER = 'Other (type your own)';

// Officially published syllabus/specification codes where confirmed.
// Not every subject/board/level combination has a verified code — check
// the board's own site before using any of these for exam registration.
const PAPER_CODES = {
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

function getPaperCode(level, subject, board) {
  return PAPER_CODES[level]?.[subject]?.[board] || null;
}

// Verified stable slugs Cambridge uses in its own site URLs — only
// includes subjects where the pattern has actually been confirmed,
// since a wrong slug produces a dead link.
const CAMBRIDGE_SPEC_SLUGS = {
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

function getSpecUrl(level, subject, board) {
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

const EDEXCEL_IAL_SLUGS = {
  'Biology': 'biology',
  'Chemistry': 'chemistry',
  'Physics': 'physics',
  'Maths': 'mathematics',
  'Further Maths': 'further-mathematics',
};

const MATHS_COMPONENTS = ['Pure', 'Mechanics', 'Statistics', 'Decision'];
const PAPERS = ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'];

// Pre-built topic/subtopic checklists, researched per subject/level/board.
// Coverage is intentionally limited to subjects that have been verified —
// Biology, Chemistry, Physics, and Maths — rather than guessed for all.
const T = (name, subtopics) => ({ name, subtopics: subtopics || [] });

const SEED_DATA = (() => {
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
  const CS_CIE_P1 = [
    T('Data representation', ['Number systems, binary, and text/image/sound representation', 'User-defined data types']),
    T('Communication and internet technologies', ['Data transmission and networks', 'The internet and cloud computing']),
    T('Hardware', ['Computer architecture and logic gates']),
    T('Processor fundamentals', ['The fetch-execute cycle', 'Addressing modes']),
    T('System software', ['Operating systems and utility software']),
    T('Security, privacy and data integrity', ['Threats and protection methods']),
    T('Ethics and ownership', ['Legal and ethical issues in computing']),
    T('Algorithm design and problem-solving', ['Flowcharts, pseudocode, and trace tables']),
    T('Data structures', ['Arrays, records, and files']),
    T('Programming', ['Programming constructs and structured programming']),
    T('Software development', ['Program design and testing']),
  ];
  const CS_CIE_P2 = [
    T('Further computational thinking', ['Searching and sorting algorithms', 'Further data structures']),
    T('Artificial intelligence', ['Machine learning and AI applications']),
    T('Further programming', ['Recursion and exception handling']),
    T('Programming paradigms', ['Procedural, object-oriented, and other paradigms']),
    T('Further computer architecture', ['Parallel processing and virtual machines']),
    T('Further communication and networking', ['Cloud storage and public/private clouds']),
    T('Databases', ['Relational databases and normalisation', 'SQL']),
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
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': BIO_IGCSE_CIE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': BIO_CIE_P1 },
        'Edexcel International': { 'Paper 1': BIO_EDEXCEL_P1, 'Paper 2': BIO_EDEXCEL_P2 },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': BIO_CIE_P1, 'Paper 2': BIO_CIE_P2 },
        'Edexcel International': { 'Paper 1': BIO_EDEXCEL_P1, 'Paper 2': BIO_EDEXCEL_P2, 'Paper 3': BIO_EDEXCEL_P3, 'Paper 4': BIO_EDEXCEL_P4 },
      },
    },
    'Chemistry': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': CHEM_IGCSE_CIE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': CHEM_CIE_P1 },
        'Edexcel International': { 'Paper 1': CHEM_EDEXCEL_P1, 'Paper 2': CHEM_EDEXCEL_P2 },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': CHEM_CIE_P1, 'Paper 2': CHEM_CIE_P2 },
        'Edexcel International': { 'Paper 1': CHEM_EDEXCEL_P1, 'Paper 2': CHEM_EDEXCEL_P2, 'Paper 3': CHEM_EDEXCEL_P3, 'Paper 4': CHEM_EDEXCEL_P4 },
      },
    },
    'Physics': {
      IGCSE: { 'Cambridge (CIE)': { 'Paper 1': PHYS_IGCSE_CIE } },
      AS: {
        'Cambridge (CIE)': { 'Paper 1': PHYS_CIE_P1 },
        'Edexcel International': { 'Paper 1': PHYS_EDEXCEL_P1, 'Paper 2': PHYS_EDEXCEL_P2 },
      },
      'A Level': {
        'Cambridge (CIE)': { 'Paper 1': PHYS_CIE_P1, 'Paper 2': PHYS_CIE_P2 },
        'Edexcel International': { 'Paper 1': PHYS_EDEXCEL_P1, 'Paper 2': PHYS_EDEXCEL_P2, 'Paper 3': PHYS_EDEXCEL_P3, 'Paper 4': PHYS_EDEXCEL_P4 },
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
      AS: { 'Cambridge (CIE)': { 'Paper 1': CS_CIE_P1 } },
      'A Level': { 'Cambridge (CIE)': { 'Paper 1': CS_CIE_P1, 'Paper 2': CS_CIE_P2 } },
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


function getSeedData(subject) {
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

const STATUS_ORDER = ['not-started', 'in-progress', 'done'];
const STATUS_META = {
  'not-started': { label: 'Not started', icon: Circle, ring: 'text-stone-400' },
  'in-progress': { label: 'In progress', icon: CircleDot, ring: 'text-amber-600' },
  'done': { label: 'Done', icon: CheckCircle2, ring: 'text-emerald-700' },
};

const MASTERY_LEVELS = [
  { value: 0, label: 'Unrated', stamp: 'UNRATED', color: 'text-stone-400 border-stone-300' },
  { value: 1, label: 'Shaky', stamp: 'SHAKY', color: 'text-rose-700 border-rose-400' },
  { value: 2, label: 'Learning', stamp: 'LEARNING', color: 'text-amber-700 border-amber-500' },
  { value: 3, label: 'Solid', stamp: 'SOLID', color: 'text-blue-700 border-blue-500' },
  { value: 4, label: 'Mastered', stamp: 'MASTERED', color: 'text-emerald-700 border-emerald-500' },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function flattenUnits(topics) {
  return topics.flatMap(t => (t.subtopics && t.subtopics.length ? t.subtopics : [t]));
}

function computeProgress(topics) {
  const units = flattenUnits(topics);
  if (!units.length) return 0;
  const done = units.filter(u => u.status === 'done').length;
  return Math.round((done / units.length) * 100);
}

function computeMastery(topics) {
  const units = flattenUnits(topics);
  if (!units.length) return 0;
  const sum = units.reduce((s, u) => s + (u.mastery || 0), 0);
  return sum / units.length;
}

function normText(s) {
  return (s || '').trim().toLowerCase();
}

function inferMediaType(file) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

// Claude sometimes wraps JSON in stray text despite instructions not to.
// Try a strict parse first, then fall back to extracting the first
// balanced [...] or {...} block from the response.
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const objectMatch = text.match(/\{[\s\S]*\}/);
    const candidate = arrayMatch && (!objectMatch || arrayMatch.index <= objectMatch.index) ? arrayMatch[0] : (objectMatch ? objectMatch[0] : null);
    if (!candidate) throw e;
    return JSON.parse(candidate);
  }
}

async function callClaudeWithFile(fileContentBlock, promptText, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            fileContentBlock,
            { type: 'text', text: promptText },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Request failed (${response.status})`);
  }
  if (data.stop_reason === 'max_tokens') {
    throw new Error('The response was cut off because the file had too much content — try splitting it into smaller uploads.');
  }
  const textBlock = (data.content || []).map(b => b.text || '').join('\n');
  const cleaned = textBlock.replace(/```json|```/g, '').trim();
  if (!cleaned) {
    throw new Error('Empty response from the model.');
  }
  return extractJson(cleaned);
}

function findTextMatch(name, candidates) {
  const n = normText(name);
  if (!n) return null;
  let match = candidates.find(c => normText(c.name) === n);
  if (!match) match = candidates.find(c => normText(c.name).includes(n) || n.includes(normText(c.name)));
  return match || null;
}

function deriveMastery(marksLost) {
  if (marksLost === null || marksLost === undefined || marksLost === '') return 0;
  const n = Number(marksLost);
  if (Number.isNaN(n) || n < 0) return 0;
  if (n <= 5) return 4; // Mastered
  if (n <= 10) return 3; // Solid
  if (n <= 15) return 2; // Learning
  return 1; // Shaky
}

function mostRecentMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun ... 1=Mon ... 6=Sat
  const diff = (day - 1 + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function getWeekRange(weekOffset) {
  const start = mostRecentMonday(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 5); // Friday, exclusive (Mon–Fri)
  return { start, end };
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function pastPaperLabel(pp) {
  if (pp.session && pp.year) return `${pp.session} ${pp.year}`;
  if (pp.year) return pp.year;
  return pp.fileName;
}

function mathsComponentTag(s) {
  if (s.name !== 'Maths' || !Array.isArray(s.components)) return '';
  const tags = [];
  if (s.components.includes('Statistics')) tags.push('S');
  if (s.components.includes('Mechanics')) tags.push('M');
  return tags.length ? ` (${tags.join(', ')})` : '';
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function parseTopicsFromText(text) {
  return text
    .split('\n')
    .map(line => line
      .replace(/^[\s]*[-*•▪◦]\s*/, '')
      .replace(/^[\s]*\(?\d+[\.\)]\s*/, '')
      .replace(/^[\s]*\(?[a-zA-Z]\)\s*/, '')
      .replace(/^[\s]*\[[ xX]?\]\s*/, '')
      .trim())
    .filter(line => line.length > 0)
    .filter((line, idx, arr) => arr.indexOf(line) === idx);
}

function parseTopicsHierarchical(text) {
  const lines = text.split('\n');
  const result = [];
  let current = null;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const leadingWhitespace = (raw.match(/^(\s*)/) || ['', ''])[1];
    const indent = leadingWhitespace.replace(/\t/g, '  ').length;
    const cleaned = raw
      .replace(/^[\s]*[-*•▪◦]\s*/, '')
      .replace(/^[\s]*\(?\d+[\.\)]\s*/, '')
      .replace(/^[\s]*\(?[a-zA-Z]\)\s*/, '')
      .replace(/^[\s]*\[[ xX]?\]\s*/, '')
      .trim();
    if (!cleaned) continue;
    if (indent >= 2 && current) {
      current.subtopics.push(cleaned);
    } else {
      current = { name: cleaned, subtopics: [] };
      result.push(current);
    }
  }
  return result;
}

export default function StudyTracker() {
  const [subjects, setSubjects] = useState(() => {
    const saved = localStorage.getItem('studyTrackerSubjects');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('studyTrackerSubjects', JSON.stringify(subjects));
  }, [subjects]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('home');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedReportSubjectId, setSelectedReportSubjectId] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedPastPaperId, setSelectedPastPaperId] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortOrder, setSortOrder] = useState('mastery');
  const [activeId, setActiveId] = useState(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newCategory, setNewCategory] = useState('study');
  const [newGoalName, setNewGoalName] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newLevel, setNewLevel] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSubjectCustom, setNewSubjectCustom] = useState('');
  const [newBoard, setNewBoard] = useState('');
  const [newBoardCustom, setNewBoardCustom] = useState('');
  const [newComponents, setNewComponents] = useState([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicPaper, setNewTopicPaper] = useState('Paper 1');
  const [saveError, setSaveError] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPaper, setImportPaper] = useState('Paper 1');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [pastPaperLoading, setPastPaperLoading] = useState(false);
  const [pastPaperError, setPastPaperError] = useState('');
  const [unitTestLoadingTopicId, setUnitTestLoadingTopicId] = useState(null);
  const [unitTestErrorTopicId, setUnitTestErrorTopicId] = useState(null);
  const [unitTestErrorMessage, setUnitTestErrorMessage] = useState('');
  const [expandedTopics, setExpandedTopics] = useState(() => new Set());
  const [subtopicDrafts, setSubtopicDrafts] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, false);
        if (result && result.value) {
          setSubjects(JSON.parse(result.value));
        }
      } catch (e) {
        // no existing data yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    (async () => {
      let notified = {};
      try {
        const result = await window.storage.get('study-tracker:notified-deadlines', false);
        if (result && result.value) notified = JSON.parse(result.value);
      } catch (e) {
        // none yet
      }
      const todayKey = new Date().toISOString().slice(0, 10);
      let changed = false;
      subjects.forEach(s => {
        if (!s.deadline) return;
        const d = daysUntil(s.deadline);
        if (d === 2 || d === 1 || d === 0) {
          const key = `${s.id}:${todayKey}`;
          if (!notified[key]) {
            try {
              new Notification(`${s.name} — deadline ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`, {
                body: s.target ? `Target: ${s.target}` : 'Check your progress in the tracker.',
              });
            } catch (e) {
              // notification failed to fire, ignore
            }
            notified[key] = true;
            changed = true;
          }
        }
      });
      if (changed) {
        try {
          await window.storage.set('study-tracker:notified-deadlines', JSON.stringify(notified), false);
        } catch (e) {
          // best effort
        }
      }
    })();
  }, [loaded, subjects]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const persist = useCallback(async (next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }, []);

  const updateSubjects = (next) => {
    setSubjects(next);
    persist(next);
  };

  const addSubject = () => {
    const subjectName = newCategory === 'study'
      ? (newSubject === OTHER ? newSubjectCustom.trim() : newSubject)
      : newGoalName.trim();
    if (!subjectName) return;
    if (newCategory === 'study' && !newLevel) return;
    const boardName = newBoard === OTHER ? newBoardCustom.trim() : newBoard;
    if (newCategory === 'study' && !boardName) return;
    const mathsNeedsComponent = newCategory === 'study' && newSubject === 'Maths' && (newLevel === 'AS' || newLevel === 'A Level');
    if (mathsNeedsComponent && newComponents.length === 0) return;
    const componentsPart = newComponents.length ? newComponents.join(', ') : '';
    const spec = newCategory === 'study'
      ? [newLevel, boardName, componentsPart].filter(Boolean).join(' · ')
      : '';
    const subject = {
      id: uid(),
      name: subjectName,
      spec,
      category: newCategory,
      level: newCategory === 'study' ? newLevel : '',
      board: newCategory === 'study' ? boardName : '',
      components: newCategory === 'study' ? newComponents : [],
      pastPapers: [],
      target: newTarget.trim(),
      deadline: newDeadline,
      topics: [],
    };
    updateSubjects([...subjects, subject]);
    setNewCategory('study');
    setNewGoalName('');
    setNewTarget('');
    setNewDeadline('');
    setNewLevel('');
    setNewSubject('');
    setNewSubjectCustom('');
    setNewBoard('');
    setNewBoardCustom('');
    setNewComponents([]);
    setShowAddSubject(false);
  };

  const toggleComponent = (comp) => {
    setNewComponents(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);
  };

  const deleteSubject = (id) => {
    updateSubjects(subjects.filter(s => s.id !== id));
    if (activeId === id) {
      setView('dashboard');
      setActiveId(null);
    }
  };

  const addTopic = (subjectId) => {
    const name = newTopicName.trim();
    if (!name) return;
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, topics: [...s.topics, { id: uid(), name, status: 'not-started', mastery: 0, marksLost: null, subtopics: [] }] };
    }));
    setNewTopicName('');
  };

  const importTopics = (subjectId, paper) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    if (subject.category === 'study') {
      const groups = parseTopicsHierarchical(importText);
      if (!groups.length) return;
      updateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        const existing = new Set(s.topics.map(t => t.name.toLowerCase()));
        const additions = groups
          .filter(g => !existing.has(g.name.toLowerCase()))
          .map(g => ({
            id: uid(),
            name: g.name,
            status: 'not-started',
            mastery: 0,
            marksLost: null,
            paper: paper || 'Paper 1',
            subtopics: g.subtopics.map(name => ({ id: uid(), name, status: 'not-started', mastery: 0, marksLost: null })),
          }));
        return { ...s, topics: [...s.topics, ...additions] };
      }));
    } else {
      const names = parseTopicsFromText(importText);
      if (!names.length) return;
      updateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        const existing = new Set(s.topics.map(t => t.name.toLowerCase()));
        const additions = names
          .filter(n => !existing.has(n.toLowerCase()))
          .map(n => ({ id: uid(), name: n, status: 'not-started', mastery: 0, marksLost: null, subtopics: [] }));
        return { ...s, topics: [...s.topics, ...additions] };
      }));
    }
    setImportText('');
    setShowImport(false);
  };

  const loadSeedChecklist = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    const seed = getSeedData(subject);
    if (!seed) return;
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      const existing = new Set(s.topics.map(t => t.name.toLowerCase()));
      const additions = [];
      Object.entries(seed).forEach(([paper, topics]) => {
        topics.forEach(g => {
          if (existing.has(g.name.toLowerCase())) return;
          additions.push({
            id: uid(),
            name: g.name,
            status: 'not-started',
            mastery: 0,
            marksLost: null,
            paper,
            subtopics: g.subtopics.map(name => ({ id: uid(), name, status: 'not-started', mastery: 0, marksLost: null })),
          });
        });
      });
      return { ...s, topics: [...s.topics, ...additions] };
    }));
  };

  const handleImageUpload = async (file, category) => {
    if (!file) return;
    setImageError('');
    setImageLoading(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.readAsDataURL(file);
      });
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const mediaType = inferMediaType(file);
      const isStudy = category === 'study';

      const promptText = isStudy
        ? 'This file shows content from a syllabus or specification. Extract the main topics and, under each, its subtopics. Cover every page — do not stop partway through. Respond with ONLY a JSON array of objects, no other text, no markdown fences. Format: [{"topic": "Cell structure", "subtopics": ["Prokaryotic vs eukaryotic cells", "Organelles"]}]. If a main topic has no subtopics listed, use an empty array.'
        : 'This file shows a list of tasks or milestones. Extract every individual item as a short line. Respond with ONLY a JSON array of strings, no other text, no markdown fences. Example: ["Book a venue", "Send invitations"]';

      const fileContentBlock = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };

      const parsed = await callClaudeWithFile(fileContentBlock, promptText, 8000);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('No topics were found in that file');
      }

      const draftText = isStudy
        ? parsed.map(g => {
            const subLines = (g.subtopics || []).map(st => `  - ${st}`).join('\n');
            return subLines ? `${g.topic}\n${subLines}` : g.topic;
          }).join('\n')
        : parsed.join('\n');

      setImportText(draftText);
      setShowImport(true);
    } catch (e) {
      setImageError(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read topics from that file — try a clearer photo or PDF, or paste the list as text instead.");
    } finally {
      setImageLoading(false);
    }
  };

  const handlePastPaperUpload = async (file, subjectId, paper) => {
    if (!file) return;
    setPastPaperError('');
    setPastPaperLoading(true);
    try {
      const subject = subjects.find(s => s.id === subjectId);
      const topicNames = (subject?.topics || [])
        .filter(t => (t.paper || 'Paper 1') === paper)
        .map(t => t.name);

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.readAsDataURL(file);
      });
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const mediaType = inferMediaType(file);
      const fileContentBlock = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };

      const promptText = `This file is a corrected/marked past exam paper — it shows which answers the student got wrong or lost marks on. First, find the exam session and year printed on the paper (e.g. "May/June", "October/November", "January", "Summer", "Winter" plus a 4-digit year) — look at headers, footers, or the front cover. Then go through it and identify every question where marks were lost. For each one, work out which topic it relates to` +
        (topicNames.length ? ` (pick the closest match from this list where possible: ${topicNames.join(', ')}; otherwise give your own short topic label)` : '') +
        `, briefly describe the mistake in one short sentence, and give the number of marks lost on that question as an integer. Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"session": "May/June", "year": "2023", "mistakes": [{"question": "3b", "topic": "Enzyme kinetics", "mistake": "Confused competitive and non-competitive inhibition", "marksLost": 2}]}. If the session or year can't be found, use null for that field.`;

      const parsedResponse = await callClaudeWithFile(fileContentBlock, promptText, 6000);
      if (!parsedResponse || !Array.isArray(parsedResponse.mistakes)) throw new Error('Unexpected response');
      const parsed = parsedResponse.mistakes;

      const record = {
        id: uid(),
        paper,
        fileName: file.name,
        session: parsedResponse.session || null,
        year: parsedResponse.year || null,
        uploadedAt: new Date().toISOString(),
        mistakes: parsed,
      };


      updateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        const nextTopics = s.topics.map(t => {
          if ((t.paper || 'Paper 1') !== paper) return t;
          let topic = { ...t };
          const hasSub = topic.subtopics && topic.subtopics.length > 0;
          if (hasSub) {
            let subtopics = topic.subtopics;
            parsed.forEach(m => {
              if (typeof m.marksLost !== 'number' || !m.topic) return;
              const match = findTextMatch(m.topic, subtopics);
              if (match) {
                subtopics = subtopics.map(st => st.id === match.id
                  ? { ...st, marksLost: (st.marksLost || 0) + m.marksLost, mastery: deriveMastery((st.marksLost || 0) + m.marksLost) }
                  : st);
              }
            });
            topic = { ...topic, subtopics };
          } else {
            parsed.forEach(m => {
              if (typeof m.marksLost !== 'number' || !m.topic) return;
              if (normText(m.topic) === normText(topic.name) || normText(topic.name).includes(normText(m.topic)) || normText(m.topic).includes(normText(topic.name))) {
                const newMarksLost = (topic.marksLost || 0) + m.marksLost;
                topic = { ...topic, marksLost: newMarksLost, mastery: deriveMastery(newMarksLost) };
              }
            });
          }
          return topic;
        });
        return { ...s, topics: nextTopics, pastPapers: [...(s.pastPapers || []), record] };
      }));
    } catch (e) {
      setPastPaperError(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read that past paper — try a clearer photo or PDF.");
    } finally {
      setPastPaperLoading(false);
    }
  };

  const deletePastPaper = (subjectId, pastPaperId) => {
    updateSubjects(subjects.map(s => s.id === subjectId
      ? { ...s, pastPapers: (s.pastPapers || []).filter(pp => pp.id !== pastPaperId) }
      : s));
  };

  const handleUnitTestUpload = async (file, subjectId, topicId) => {
    if (!file) return;
    setUnitTestErrorTopicId(null);
    setUnitTestErrorMessage('');
    setUnitTestLoadingTopicId(topicId);
    try {
      const subject = subjects.find(s => s.id === subjectId);
      const topic = subject?.topics.find(t => t.id === topicId);
      const subtopicNames = (topic?.subtopics || []).map(st => st.name);

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the file'));
        reader.readAsDataURL(file);
      });
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const mediaType = inferMediaType(file);
      const fileContentBlock = isPdf
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } };

      const promptText = `This file is a corrected/marked unit test on the topic "${topic?.name || ''}". Go through it and identify every question where marks were lost, and work out which subtopic each one relates to` +
        (subtopicNames.length ? ` (pick the closest match from this list where possible: ${subtopicNames.join(', ')}; otherwise give your own short subtopic label)` : '') +
        `, giving the number of marks lost on that question as an integer and a one-sentence description of the mistake. Then list which subtopics need the most focus, ranked by how many marks were lost on them. Respond with ONLY a JSON object, no other text, no markdown fences. Format: {"details": [{"subtopic": "Enzyme kinetics", "marksLost": 2, "mistake": "Confused competitive and non-competitive inhibition"}], "focus": ["Enzyme kinetics"]}`;

      const parsedResponse = await callClaudeWithFile(fileContentBlock, promptText, 4000);
      if (!parsedResponse || !Array.isArray(parsedResponse.details)) throw new Error('Unexpected response');

      const record = {
        id: uid(),
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        focus: Array.isArray(parsedResponse.focus) ? parsedResponse.focus : [],
        details: parsedResponse.details,
      };

      updateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          topics: s.topics.map(t => {
            if (t.id !== topicId) return t;
            let subtopics = t.subtopics || [];
            parsedResponse.details.forEach(d => {
              if (typeof d.marksLost !== 'number' || !d.subtopic) return;
              const match = findTextMatch(d.subtopic, subtopics);
              if (match) {
                subtopics = subtopics.map(st => st.id === match.id
                  ? { ...st, marksLost: (st.marksLost || 0) + d.marksLost, mastery: deriveMastery((st.marksLost || 0) + d.marksLost) }
                  : st);
              }
            });
            return { ...t, subtopics, unitTests: [...(t.unitTests || []), record] };
          }),
        };
      }));
    } catch (e) {
      setUnitTestErrorTopicId(topicId);
      setUnitTestErrorMessage(e.message && !e.message.startsWith('Unexpected')
        ? e.message
        : "Couldn't read that unit test — try a clearer photo or PDF.");
    } finally {
      setUnitTestLoadingTopicId(null);
    }
  };

  const deleteTopic = (subjectId, topicId) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return { ...s, topics: s.topics.filter(t => t.id !== topicId) };
    }));
  };

  const cycleStatus = (subjectId, topicId) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => {
          if (t.id !== topicId) return t;
          const idx = STATUS_ORDER.indexOf(t.status);
          const nextStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
          return { ...t, status: nextStatus, completedAt: nextStatus === 'done' ? new Date().toISOString() : null };
        }),
      };
    }));
  };

  const setTopicMarksLost = (subjectId, topicId, value) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === topicId
          ? { ...t, marksLost: value === '' ? null : value, mastery: deriveMastery(value) }
          : t),
      };
    }));
  };

  const setMastery = (subjectId, topicId, value) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === topicId ? { ...t, mastery: t.mastery === value ? 0 : value } : t),
      };
    }));
  };

  const addSubtopic = (subjectId, topicId, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === topicId
          ? { ...t, subtopics: [...(t.subtopics || []), { id: uid(), name: trimmed, status: 'not-started', mastery: 0, marksLost: null }] }
          : t),
      };
    }));
  };

  const deleteSubtopic = (subjectId, topicId, subtopicId) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => t.id === topicId
          ? { ...t, subtopics: (t.subtopics || []).filter(st => st.id !== subtopicId) }
          : t),
      };
    }));
  };

  const cycleSubtopicStatus = (subjectId, topicId, subtopicId) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => {
          if (t.id !== topicId) return t;
          return {
            ...t,
            subtopics: (t.subtopics || []).map(st => {
              if (st.id !== subtopicId) return st;
              const idx = STATUS_ORDER.indexOf(st.status);
              const nextStatus = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
              return { ...st, status: nextStatus, completedAt: nextStatus === 'done' ? new Date().toISOString() : null };
            }),
          };
        }),
      };
    }));
  };

  const setSubtopicMarksLost = (subjectId, topicId, subtopicId, value) => {
    updateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        topics: s.topics.map(t => {
          if (t.id !== topicId) return t;
          return {
            ...t,
            subtopics: (t.subtopics || []).map(st => st.id === subtopicId
              ? { ...st, marksLost: value === '' ? null : value, mastery: deriveMastery(value) }
              : st),
          };
        }),
      };
    }));
  };

  const toggleExpanded = (topicId) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId); else next.add(topicId);
      return next;
    });
  };

  if (!loaded) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-stone-500 font-serif">Loading your subjects…</div>
    );
  }

  const activeSubject = subjects.find(s => s.id === activeId);

  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);
  const inWeek = (iso) => {
    const d = new Date(iso);
    return d >= weekStart && d < weekEnd;
  };

  const groupsForSubject = (s) => {
    const groups = [];
    s.topics.forEach(t => {
      const hasSub = t.subtopics && t.subtopics.length > 0;
      if (hasSub) {
        const doneSubsThisWeek = t.subtopics.filter(st => st.completedAt && inWeek(st.completedAt));
        if (!doneSubsThisWeek.length) return;
        const allDone = t.subtopics.every(st => st.status === 'done');
        if (allDone) {
          groups.push({
            key: t.id,
            topicName: t.name,
            subtopicName: null,
            wholeTopic: true,
            hadSubtopics: true,
            latest: Math.max(...doneSubsThisWeek.map(st => new Date(st.completedAt).getTime())),
          });
        } else {
          doneSubsThisWeek.forEach(st => {
            groups.push({
              key: st.id,
              topicName: t.name,
              subtopicName: st.name,
              wholeTopic: false,
              hadSubtopics: true,
              latest: new Date(st.completedAt).getTime(),
            });
          });
        }
      } else if (t.completedAt && inWeek(t.completedAt)) {
        groups.push({
          key: t.id,
          topicName: t.name,
          subtopicName: null,
          wholeTopic: true,
          hadSubtopics: false,
          latest: new Date(t.completedAt).getTime(),
        });
      }
    });
    return groups.sort((a, b) => b.latest - a.latest);
  };

  const buildSummary = (groups) => {
    const fullTopics = groups.filter(g => g.wholeTopic).map(g => g.topicName);
    const partials = groups.filter(g => !g.wholeTopic);
    const partialByTopic = {};
    partials.forEach(g => {
      (partialByTopic[g.topicName] = partialByTopic[g.topicName] || []).push(g.subtopicName);
    });
    const partialTopicNames = Object.keys(partialByTopic);

    const listJoin = (arr) => arr.length <= 2 ? arr.join(' and ') : `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;

    const parts = [];
    if (fullTopics.length) {
      parts.push(`finished ${fullTopics.length === 1 ? 'the topic' : 'the topics'} ${listJoin(fullTopics)}`);
    }
    if (partialTopicNames.length) {
      const subCount = partials.length;
      parts.push(`completed ${subCount} subtopic${subCount !== 1 ? 's' : ''} across ${listJoin(partialTopicNames)}`);
    }
    if (!parts.length) return 'Nothing completed here yet this week.';
    return `You ${parts.join(', and ')}.`;
  };

  const subjectReports = subjects
    .map(s => ({ subject: s, groups: groupsForSubject(s) }))
    .filter(r => r.groups.length > 0)
    .sort((a, b) => b.groups[0].latest - a.groups[0].latest);

  const completedCount = subjectReports.reduce((sum, r) => sum + r.groups.reduce((n, g) => n + (g.wholeTopic || !g.hadSubtopics ? 1 : 1), 0), 0);
  const selectedReport = subjectReports.find(r => r.subject.id === selectedReportSubjectId);
  const selectedPastPaper = activeSubject?.pastPapers?.find(pp => pp.id === selectedPastPaperId);

  return (
    <div className="w-full max-w-3xl mx-auto bg-stone-50 min-h-screen">
      <div className="border-b-2 border-stone-800 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(view === 'dashboard' || view === 'subject' || view === 'report' || view === 'reportDetail' || view === 'paperDetail' || view === 'pastPapersList' || view === 'pastPaperDetail') && (
            <button
              onClick={() => {
                if (view === 'subject') { setView('dashboard'); setActiveId(null); }
                else if (view === 'reportDetail') { setView('report'); setSelectedReportSubjectId(null); }
                else if (view === 'paperDetail') { setView('subject'); setSelectedPaper(null); }
                else if (view === 'pastPapersList') { setView('paperDetail'); }
                else if (view === 'pastPaperDetail') { setView('pastPapersList'); setSelectedPastPaperId(null); }
                else { setView('home'); setActiveCategory(null); }
              }}
              className="mr-2 p-1.5 rounded hover:bg-stone-200 text-stone-700"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {view === 'home' && <GraduationCap size={22} className="text-stone-800" />}
          {view === 'dashboard' && (
            activeCategory === 'study'
              ? <GraduationCap size={22} className="text-indigo-800" />
              : <Target size={22} className="text-amber-700" />
          )}
          {(view === 'subject' || view === 'paperDetail' || view === 'pastPapersList' || view === 'pastPaperDetail') && activeSubject && (
            activeSubject.category === 'study'
              ? <GraduationCap size={22} className="text-indigo-800" />
              : <Target size={22} className="text-amber-700" />
          )}
          {view === 'report' && <CalendarCheck size={22} className="text-stone-800" />}
          {view === 'reportDetail' && selectedReport && (
            selectedReport.subject.category === 'study'
              ? <GraduationCap size={22} className="text-indigo-800" />
              : <Target size={22} className="text-amber-700" />
          )}
          <h1 className="font-serif text-xl text-stone-900 tracking-tight">
            {view === 'home' && 'Goal ledger'}
            {view === 'dashboard' && (activeCategory === 'study' ? 'Studies' : 'General goals')}
            {view === 'subject' && activeSubject && `${activeSubject.name}${mathsComponentTag(activeSubject)}`}
            {view === 'paperDetail' && selectedPaper}
            {view === 'pastPapersList' && `${selectedPaper} past papers`}
            {view === 'pastPaperDetail' && (selectedPastPaper ? pastPaperLabel(selectedPastPaper) : 'Past paper')}
            {view === 'report' && 'Weekly report'}
            {view === 'reportDetail' && selectedReport?.subject.name}
          </h1>
        </div>
        {view === 'dashboard' && (
          <button
            onClick={() => { setNewCategory(activeCategory); setShowAddSubject(v => !v); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-stone-50 rounded text-sm font-medium hover:bg-stone-700"
          >
            <Plus size={16} /> {activeCategory === 'study' ? 'Subject' : 'Goal'}
          </button>
        )}
      </div>

      {saveError && (
        <div className="mx-6 mt-4 px-3 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-sm rounded">
          Couldn't save your changes. They may not persist — try again in a moment.
        </div>
      )}

      {view === 'home' && (
        <div className="px-6 pt-6">
          <button
            onClick={() => { setWeekOffset(0); setView('report'); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 border-2 border-stone-800 rounded-xl text-sm font-medium text-stone-800 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <CalendarCheck size={16} /> Weekly report
          </button>

          {notifPermission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              className="w-full flex items-center justify-center gap-2 py-2 mb-4 border border-stone-300 rounded-lg text-xs text-stone-600 hover:border-stone-500 transition-colors"
            >
              <Bell size={14} /> Enable deadline reminders
            </button>
          )}
          {notifPermission === 'denied' && (
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 mb-4">
              <BellOff size={12} /> Notifications blocked — enable them in your browser's site settings to get deadline reminders.
            </p>
          )}
        </div>
      )}

      {view === 'home' && (
        <div className="p-6 grid grid-cols-2 gap-3">
          {[
            { key: 'study', label: 'Studies', Icon: GraduationCap, accent: 'indigo', empty: 'No subjects yet' },
            { key: 'general', label: 'General goals', Icon: Target, accent: 'amber', empty: 'No goals yet' },
          ].map(({ key, label, Icon, accent, empty }) => {
            const items = subjects.filter(s => s.category === key);
            const PREVIEW_LIMIT = 6;
            const preview = items.slice(0, PREVIEW_LIMIT);
            const remaining = items.length - preview.length;
            const accentText = accent === 'indigo' ? 'text-indigo-800' : 'text-amber-700';
            const accentBorder = accent === 'indigo' ? 'border-indigo-800' : 'border-amber-600';
            const accentBg = accent === 'indigo' ? 'bg-indigo-800' : 'bg-amber-600';
            return (
              <div key={key} className={`flex flex-col bg-white border-2 rounded-xl overflow-hidden ${accentBorder}`}>
                <button
                  onClick={() => { setActiveCategory(key); setView('dashboard'); }}
                  className="text-left p-4 pb-3 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={`${accentText} shrink-0`} />
                    <h2 className="font-serif text-base text-stone-900 flex-1 truncate">{label}</h2>
                    <ChevronRight size={16} className="text-stone-400 shrink-0" />
                  </div>
                </button>

                <div className="flex-1 border-t border-stone-200 px-3 py-2">
                  {items.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">{empty}</p>
                  ) : (
                    <div className="flex flex-col">
                      {preview.map(s => {
                        const progress = computeProgress(s.topics);
                        const code = key === 'study' ? getPaperCode(s.level, s.name, s.board, s.components) : null;
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setActiveId(s.id); setView('subject'); }}
                            className="flex items-center gap-2 py-1.5 text-left hover:bg-stone-50 rounded px-1 -mx-1"
                          >
                            <span className="text-xs text-stone-700 flex-1 truncate">{s.name}{mathsComponentTag(s)}</span>
                            {code && (
                              <span className="font-mono text-[9px] text-stone-400 border border-stone-300 rounded px-1 py-0.5 shrink-0">
                                {code}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-stone-400 shrink-0">{progress}%</span>
                          </button>
                        );
                      })}
                      {remaining > 0 && (
                        <button
                          onClick={() => { setActiveCategory(key); setView('dashboard'); }}
                          className="text-[10px] text-stone-400 hover:text-stone-700 text-left py-1 px-1 -mx-1"
                        >
                          +{remaining} more
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'dashboard' && (
        <div className="p-6">
          {showAddSubject && (
            <div className="mb-6 p-4 border-2 border-dashed border-stone-400 rounded-lg bg-white">
              <div className="flex flex-col gap-2">
                {newCategory === 'general' && (
                  <input
                    autoFocus
                    value={newGoalName}
                    onChange={e => setNewGoalName(e.target.value)}
                    placeholder="Goal name (e.g. Deadlift 100kg, Learn Spanish)"
                    className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                )}

                {newCategory === 'study' && (
                  <>
                    <select
                      value={newLevel}
                      onChange={e => { setNewLevel(e.target.value); setNewSubject(''); setNewSubjectCustom(''); setNewBoard(''); setNewBoardCustom(''); setNewComponents([]); }}
                      className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
                    >
                      <option value="">Level…</option>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select
                      value={newSubject}
                      onChange={e => { setNewSubject(e.target.value); setNewBoard(''); setNewBoardCustom(''); setNewComponents([]); }}
                      disabled={!newLevel}
                      className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
                    >
                      <option value="">Subject…</option>
                      {newLevel && Object.keys(SUBJECT_BOARDS[newLevel]).map(s => <option key={s} value={s}>{s}</option>)}
                      {newLevel && <option value={OTHER}>{OTHER}</option>}
                    </select>

                    {newSubject === OTHER && (
                      <input
                        value={newSubjectCustom}
                        onChange={e => setNewSubjectCustom(e.target.value)}
                        placeholder="Type the subject name"
                        className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                      />
                    )}

                    <select
                      value={newBoard}
                      onChange={e => setNewBoard(e.target.value)}
                      disabled={!newSubject}
                      className="border border-stone-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 disabled:bg-stone-100 disabled:text-stone-400"
                    >
                      <option value="">Exam board…</option>
                      {newLevel && newSubject && newSubject !== OTHER && (SUBJECT_BOARDS[newLevel][newSubject] || []).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                      {newSubject && <option value={OTHER}>{OTHER}</option>}
                    </select>

                    {newBoard === OTHER && (
                      <input
                        value={newBoardCustom}
                        onChange={e => setNewBoardCustom(e.target.value)}
                        placeholder="Type the exam board"
                        className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                      />
                    )}

                    {newSubject === 'Maths' && (newLevel === 'AS' || newLevel === 'A Level') && (
                      <div>
                        <p className="text-xs text-stone-500 mb-1">Components — pick at least one (Pure, Mechanics, or Statistics)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {MATHS_COMPONENTS.map(comp => (
                            <button
                              key={comp}
                              type="button"
                              onClick={() => toggleComponent(comp)}
                              className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                                newComponents.includes(comp)
                                  ? 'bg-stone-800 text-white border-stone-800'
                                  : 'text-stone-600 border-stone-300 hover:border-stone-500'
                              }`}
                            >
                              {comp}
                            </button>
                          ))}
                        </div>
                        {newComponents.length === 0 && (
                          <p className="text-xs text-rose-600 mt-1">Select at least one component to continue.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <input
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder={newCategory === 'general' ? 'Target (optional) — e.g. Bench 100kg, CEFR B2' : 'Target grade (optional) — e.g. Grade A, 90%'}
                  className="border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />

                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-500 shrink-0">Deadline (optional)</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="border border-stone-300 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={addSubject}
                    disabled={
                      (newCategory === 'study' && !(newBoard === OTHER ? newBoardCustom.trim() : newBoard)) ||
                      (newCategory === 'study' && newSubject === 'Maths' && (newLevel === 'AS' || newLevel === 'A Level') && newComponents.length === 0)
                    }
                    className="px-3 py-1.5 bg-stone-800 text-white rounded text-sm hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
                  >
                    Add goal
                  </button>
                  <button onClick={() => setShowAddSubject(false)} className="px-3 py-1.5 text-stone-600 text-sm hover:bg-stone-100 rounded">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {(() => {
            const visibleSubjects = subjects.filter(s => s.category === activeCategory);
            const sortedSubjects = [...visibleSubjects].sort((a, b) => {
              if (sortOrder === 'alphabetical') return a.name.localeCompare(b.name);
              const masteryA = computeMastery(a.topics);
              const masteryB = computeMastery(b.topics);
              return masteryB - masteryA;
            });
            return (
              <>
                {sortedSubjects.length > 1 && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs text-stone-500">Sort:</span>
                    {[{ key: 'mastery', label: '% Mastered' }, { key: 'alphabetical', label: 'Alphabetical' }].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSortOrder(opt.key)}
                        className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                          sortOrder === opt.key ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300 hover:border-stone-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {sortedSubjects.length === 0 && !showAddSubject && (
                  <div className="text-center py-16 text-stone-400 font-serif">
                    <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
                    {activeCategory === 'study' ? 'No subjects yet. Add one to start tracking your progress.' : 'No goals yet. Add one to start tracking your progress.'}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {sortedSubjects.map(s => {
              const progress = computeProgress(s.topics);
              const mastery = computeMastery(s.topics);
              const masteryLevel = MASTERY_LEVELS[Math.round(mastery)];
              const isStudy = s.category === 'study';
              return (
                <div
                  key={s.id}
                  onClick={() => { setActiveId(s.id); setView('subject'); }}
                  className={`group relative p-4 bg-white border-l-4 border border-stone-300 rounded-lg cursor-pointer hover:border-stone-500 transition-colors ${
                    isStudy ? 'border-l-indigo-800' : 'border-l-amber-600'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSubject(s.id); }}
                    className="absolute top-3 right-3 p-1 text-stone-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-baseline gap-2 pr-6">
                    {isStudy
                      ? <GraduationCap size={14} className="text-indigo-800 shrink-0" />
                      : <Target size={14} className="text-amber-700 shrink-0" />}
                    <h2 className="font-serif text-lg text-stone-900 flex-1 truncate">{s.name}{mathsComponentTag(s)}</h2>
                    {isStudy && getPaperCode(s.level, s.name, s.board, s.components) && (
                      <span className="shrink-0 font-mono text-[10px] text-stone-400 border border-stone-300 rounded px-1 py-0.5">
                        {getPaperCode(s.level, s.name, s.board, s.components)}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-xs text-stone-500">{s.topics.length} {isStudy ? 'topic' : 'milestone'}{s.topics.length !== 1 ? 's' : ''}</span>
                  </div>
                  {s.spec && (
                    <p className="text-xs text-stone-500 mt-0.5 ml-5">{s.spec}</p>
                  )}
                  {(s.target || s.deadline) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 ml-5 text-xs text-stone-500">
                      {s.target && <span>Target: {s.target}</span>}
                      {s.deadline && (() => {
                        const d = daysUntil(s.deadline);
                        return (
                          <span className={d < 0 ? 'text-rose-600' : d <= 7 ? 'text-amber-700' : ''}>
                            {d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? 'Due today' : `${d} days left`}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isStudy ? 'bg-indigo-800' : 'bg-amber-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-stone-600 w-10 text-right">{progress}%</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {s.topics.length > 0 && (
                      <div className={`inline-block px-2 py-0.5 border rounded text-[10px] font-mono tracking-wider ${masteryLevel.color}`}>
                        AVG · {masteryLevel.stamp}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {(view === 'subject' || view === 'paperDetail') && activeSubject && (
        <div className="p-6">
          {view === 'subject' && activeSubject.spec && (
            <p className="text-sm text-stone-500 mb-1 -mt-2">
              {activeSubject.spec}
              {activeSubject.category === 'study' && getPaperCode(activeSubject.level, activeSubject.name, activeSubject.board, activeSubject.components) && (
                <span className="ml-1.5 font-mono text-xs text-stone-400 border border-stone-300 rounded px-1 py-0.5">
                  {getPaperCode(activeSubject.level, activeSubject.name, activeSubject.board, activeSubject.components)}
                </span>
              )}
              {activeSubject.category === 'study' && getSpecUrl(activeSubject.level, activeSubject.name, activeSubject.board) && (
                <a
                  href={getSpecUrl(activeSubject.level, activeSubject.name, activeSubject.board)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 underline text-xs"
                >
                  <FileText size={12} /> View specification
                </a>
              )}
            </p>
          )}
          {view === 'subject' && (activeSubject.target || activeSubject.deadline) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-stone-600">
              {activeSubject.target && <span>Target: {activeSubject.target}</span>}
              {activeSubject.deadline && (() => {
                const d = daysUntil(activeSubject.deadline);
                return (
                  <span className={d < 0 ? 'text-rose-600' : d <= 7 ? 'text-amber-700' : ''}>
                    {d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? 'Due today' : `${d} days left`}
                  </span>
                );
              })()}
            </div>
          )}

          {view === 'subject' && (
            <div className="mb-5 p-3 bg-white border border-stone-300 rounded-lg flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-stone-500 mb-1">
                  <span>Completion</span>
                  <span className="font-mono">{computeProgress(activeSubject.topics)}%</span>
                </div>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-800 rounded-full transition-all"
                    style={{ width: `${computeProgress(activeSubject.topics)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {view === 'subject' && activeSubject.category === 'study' && getSeedData(activeSubject) && (
            <button
              onClick={() => loadSeedChecklist(activeSubject.id)}
              className="w-full flex items-center justify-center gap-2 py-2 mb-5 border-2 border-indigo-800 rounded-lg text-sm font-medium text-indigo-800 hover:bg-indigo-800 hover:text-white transition-colors"
            >
              <ClipboardList size={16} /> Load standard topics
            </button>
          )}

          {(() => {
            const isStudy = activeSubject.category === 'study';

            const renderTopicRow = (t) => {
              const hasSub = isStudy && t.subtopics && t.subtopics.length > 0;
              const StatusIcon = STATUS_META[t.status].icon;
              const doneCount = hasSub ? t.subtopics.filter(st => st.status === 'done').length : 0;

              if (isStudy) {
                return (
                  <div key={t.id} className="aspect-square bg-white border border-stone-300 rounded-lg p-3 flex flex-col overflow-hidden">
                    <div className="flex items-start gap-2 mb-1">
                      {hasSub ? (
                        <span className="shrink-0 text-[10px] font-mono text-stone-500 border border-stone-300 rounded px-1.5 py-0.5">
                          {doneCount}/{t.subtopics.length}
                        </span>
                      ) : (
                        <button
                          onClick={() => cycleStatus(activeSubject.id, t.id)}
                          title={STATUS_META[t.status].label}
                          className={`shrink-0 ${STATUS_META[t.status].ring}`}
                        >
                          <StatusIcon size={16} />
                        </button>
                      )}
                      <span className="flex-1 text-sm font-medium text-stone-900 leading-tight">
                        {t.name}
                      </span>
                      <button
                        onClick={() => deleteTopic(activeSubject.id, t.id)}
                        className="shrink-0 p-0.5 text-stone-300 hover:text-rose-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {!hasSub && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          type="number"
                          min="0"
                          value={t.marksLost === null || t.marksLost === undefined ? '' : t.marksLost}
                          onChange={e => setTopicMarksLost(activeSubject.id, t.id, e.target.value)}
                          placeholder="marks lost"
                          className="w-20 border border-stone-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-stone-400"
                        />
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wider ${MASTERY_LEVELS[t.mastery || 0].color}`}>
                          {MASTERY_LEVELS[t.mastery || 0].stamp}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5">
                      {(t.subtopics || []).map(st => {
                        const SubIcon = STATUS_META[st.status].icon;
                        return (
                          <div key={st.id} className="border-b border-stone-100 pb-1 last:border-b-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => cycleSubtopicStatus(activeSubject.id, t.id, st.id)}
                                title={STATUS_META[st.status].label}
                                className={`shrink-0 ${STATUS_META[st.status].ring}`}
                              >
                                <SubIcon size={13} />
                              </button>
                              <span className={`flex-1 text-[11px] leading-tight ${st.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                {st.name}
                              </span>
                              <button
                                onClick={() => deleteSubtopic(activeSubject.id, t.id, st.id)}
                                className="shrink-0 p-0.5 text-stone-300 hover:text-rose-600"
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 ml-[18px]">
                              <input
                                type="number"
                                min="0"
                                value={st.marksLost === null || st.marksLost === undefined ? '' : st.marksLost}
                                onChange={e => setSubtopicMarksLost(activeSubject.id, t.id, st.id, e.target.value)}
                                placeholder="lost"
                                className="w-12 border border-stone-300 rounded px-1 py-0.5 text-[9px] focus:outline-none focus:ring-2 focus:ring-stone-400"
                              />
                              <span className={`px-1 py-0.5 rounded border text-[8px] font-mono tracking-wider ${MASTERY_LEVELS[st.mastery || 0].color}`}>
                                {MASTERY_LEVELS[st.mastery || 0].stamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-1 mt-1 pt-1 border-t border-stone-100">
                      <input
                        value={subtopicDrafts[t.id] || ''}
                        onChange={e => setSubtopicDrafts(prev => ({ ...prev, [t.id]: e.target.value }))}
                        placeholder="Add subtopic…"
                        className="flex-1 min-w-0 border border-stone-300 rounded px-1.5 py-1 text-[10px] focus:outline-none focus:ring-2 focus:ring-stone-400"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            addSubtopic(activeSubject.id, t.id, subtopicDrafts[t.id]);
                            setSubtopicDrafts(prev => ({ ...prev, [t.id]: '' }));
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          addSubtopic(activeSubject.id, t.id, subtopicDrafts[t.id]);
                          setSubtopicDrafts(prev => ({ ...prev, [t.id]: '' }));
                        }}
                        className="shrink-0 px-2 py-1 bg-stone-800 text-white rounded text-[10px] hover:bg-stone-700"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {hasSub && (
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100">
                        <label className="flex items-center gap-1 text-[9px] text-stone-500 hover:text-stone-800 cursor-pointer">
                          {unitTestLoadingTopicId === t.id ? <Loader2 size={11} className="animate-spin" /> : <ImageIcon size={11} />}
                          {unitTestLoadingTopicId === t.id ? 'Analyzing…' : 'Upload unit test'}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={unitTestLoadingTopicId === t.id}
                            onChange={e => {
                              const file = e.target.files && e.target.files[0];
                              handleUnitTestUpload(file, activeSubject.id, t.id);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {(t.unitTests || []).length > 0 && (
                          <span className="text-[9px] font-mono text-stone-400">{t.unitTests.length} test{t.unitTests.length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    )}
                    {unitTestErrorTopicId === t.id && (
                      <p className="text-[9px] text-rose-600 mt-1">{unitTestErrorMessage}</p>
                    )}
                    {hasSub && (t.unitTests || []).length > 0 && (t.unitTests[t.unitTests.length - 1].focus || []).length > 0 && (
                      <p className="text-[9px] text-amber-700 mt-1 leading-tight">
                        Focus: {t.unitTests[t.unitTests.length - 1].focus.join(', ')}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div key={t.id} className="p-3 bg-white border border-stone-300 rounded-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => cycleStatus(activeSubject.id, t.id)}
                      title={STATUS_META[t.status].label}
                      className={`shrink-0 ${STATUS_META[t.status].ring}`}
                    >
                      <StatusIcon size={20} />
                    </button>
                    <span className={`flex-1 text-sm ${t.status === 'done' ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                      {t.name}
                    </span>
                    <button
                      onClick={() => deleteTopic(activeSubject.id, t.id)}
                      className="p-1 text-stone-300 hover:text-rose-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2 ml-8">
                    {MASTERY_LEVELS.filter(m => m.value > 0).map(m => (
                      <button
                        key={m.value}
                        onClick={() => setMastery(activeSubject.id, t.id, m.value)}
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono tracking-wider transition-colors ${
                          t.mastery === m.value
                            ? m.color + ' bg-opacity-10'
                            : 'text-stone-300 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        {m.stamp}
                      </button>
                    ))}
                  </div>
                </div>
              );
            };

            return (
              <>
                {view === 'subject' && !isStudy && (
                  <div className="flex gap-2 mb-2">
                    <input
                      value={newTopicName}
                      onChange={e => setNewTopicName(e.target.value)}
                      placeholder="Add a milestone or task…"
                      className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                      onKeyDown={e => e.key === 'Enter' && addTopic(activeSubject.id)}
                    />
                    <button
                      onClick={() => addTopic(activeSubject.id)}
                      className="px-3 py-2 bg-stone-800 text-white rounded text-sm hover:bg-stone-700 flex items-center gap-1"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                )}

                {view === 'subject' && isStudy && (
                  <p className="text-xs text-stone-400 mb-2">Paste a list or upload the specification below to build the checklist — add subtopics directly inside each topic's card.</p>
                )}

                {view === 'subject' && (
                <>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <button
                    onClick={() => setShowImport(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800"
                  >
                    <ClipboardList size={14} /> {showImport ? 'Hide import' : 'Paste a list instead'}
                  </button>
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer">
                    {imageLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    {imageLoading ? 'Reading file…' : (isStudy ? 'Upload a Photo of the specification' : 'Upload a photo of the topics')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={imageLoading}
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        handleImageUpload(file, activeSubject.category);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer">
                    {imageLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    {imageLoading ? 'Reading file…' : (isStudy ? 'Upload a PDF of the specification' : 'Upload a PDF of the topics')}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={imageLoading}
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        handleImageUpload(file, activeSubject.category);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {imageError && (
                  <p className="text-xs text-rose-600 -mt-3 mb-4">{imageError}</p>
                )}

                {showImport && (
                  <div className="mb-5 p-4 border-2 border-dashed border-stone-400 rounded-lg bg-white">
                    <p className="text-xs text-stone-500 mb-2">
                      {isStudy
                        ? 'Paste your topic list, one per line. Indent a line with a couple of spaces to make it a subtopic of the line above — bullets, numbering, and checkboxes are stripped automatically.'
                        : "Paste a list of milestones or tasks, one per line — bullets, numbering, or checkboxes are fine, they'll be stripped automatically."}
                    </p>
                    {isStudy && (
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-xs text-stone-500">Adding to:</span>
                        {PAPERS.map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setImportPaper(p)}
                            className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                              importPaper === p ? 'bg-stone-800 text-white border-stone-800' : 'text-stone-600 border-stone-300 hover:border-stone-500'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                      rows={7}
                      placeholder={isStudy ? 'e.g.\nCell structure\n  Prokaryotic vs eukaryotic cells\n  Organelles\nEnzyme action' : 'e.g.\n1. Cell structure\n2. Enzyme action\n3. Photosynthesis'}
                      className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-stone-400 font-mono">
                        {isStudy
                          ? `${parseTopicsHierarchical(importText).length} main topic${parseTopicsHierarchical(importText).length !== 1 ? 's' : ''} detected`
                          : `${parseTopicsFromText(importText).length} milestone${parseTopicsFromText(importText).length !== 1 ? 's' : ''} detected`}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowImport(false); setImportText(''); }} className="px-3 py-1.5 text-stone-600 text-sm hover:bg-stone-100 rounded">Cancel</button>
                        <button onClick={() => importTopics(activeSubject.id, isStudy ? importPaper : null)} className="px-3 py-1.5 bg-stone-800 text-white rounded text-sm hover:bg-stone-700">Add to checklist</button>
                      </div>
                    </div>
                  </div>
                )}
                </>
                )}

                {view === 'subject' && activeSubject.topics.length === 0 && (
                  <div className="text-center py-12 text-stone-400 font-serif text-sm">
                    {isStudy ? 'No topics yet. Add the first one above.' : 'No milestones yet. Add the first one above.'}
                  </div>
                )}

                {isStudy && view === 'subject' && (() => {
                  const papersInUse = [...new Set(activeSubject.topics.map(t => t.paper || 'Paper 1'))];
                  return (
                    <div className="flex flex-col gap-3">
                      {papersInUse.map(p => {
                        const paperTopics = activeSubject.topics.filter(t => (t.paper || 'Paper 1') === p);
                        const paperProgress = computeProgress(paperTopics);
                        return (
                          <button
                            key={p}
                            onClick={() => { setSelectedPaper(p); setView('paperDetail'); }}
                            className="text-left bg-white border-2 border-stone-300 rounded-xl p-4 hover:border-stone-500 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-serif text-base text-stone-800">{p}</h3>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-stone-500">{paperProgress}% · {paperTopics.length} item{paperTopics.length !== 1 ? 's' : ''}</span>
                                <ChevronRight size={16} className="text-stone-400" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {isStudy && view === 'paperDetail' && (() => {
                  const paperTopics = activeSubject.topics.filter(t => (t.paper || 'Paper 1') === selectedPaper);
                  const paperProgress = computeProgress(paperTopics);
                  const pastPapers = (activeSubject.pastPapers || []).filter(pp => pp.paper === selectedPaper);

                  return (
                    <>
                      <div className="mb-4 p-3 bg-white border border-stone-300 rounded-lg flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-stone-500 mb-1">
                            <span>{selectedPaper} completion</span>
                            <span className="font-mono">{paperProgress}%</span>
                          </div>
                          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-800 rounded-full transition-all" style={{ width: `${paperProgress}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 flex items-center gap-2">
                        <button
                          onClick={() => setView('pastPapersList')}
                          className="flex-1 flex items-center justify-between p-3 bg-white border border-stone-300 rounded-lg hover:border-stone-500 transition-colors"
                        >
                          <span className="text-sm text-stone-700">
                            Past papers {pastPapers.length > 0 && <span className="text-stone-400">· {pastPapers.length} uploaded</span>}
                          </span>
                          <ChevronRight size={16} className="text-stone-400" />
                        </button>
                        <label className="shrink-0 flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer border border-stone-300 rounded-lg px-3 py-3 hover:border-stone-500">
                          {pastPaperLoading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={pastPaperLoading}
                            onChange={e => {
                              const file = e.target.files && e.target.files[0];
                              handlePastPaperUpload(file, activeSubject.id, selectedPaper);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {pastPaperError && <p className="text-xs text-rose-600 -mt-4 mb-4">{pastPaperError}</p>}

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {paperTopics.map(renderTopicRow)}
                      </div>

                    </>
                  );
                })()}

                {!isStudy && (
                  <div className="flex flex-col gap-2">
                    {activeSubject.topics.map(renderTopicRow)}
                  </div>
                )}

              </>
            );
          })()}
        </div>
      )}

      {view === 'report' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-1.5 rounded hover:bg-stone-200 text-stone-600"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <p className="font-serif text-sm text-stone-800">
                {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
              </p>
              {weekOffset === 0 && <p className="text-[10px] text-stone-400 font-mono">This week</p>}
            </div>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded hover:bg-stone-200 text-stone-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-xs text-stone-500 mb-4 text-center font-mono">
            {completedCount} item{completedCount !== 1 ? 's' : ''} completed
          </p>

          {subjectReports.length === 0 ? (
            <div className="text-center py-16 text-stone-400 font-serif text-sm">
              Nothing completed in this week yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {subjectReports.map(({ subject: s, groups }) => {
                const isStudySubj = s.category === 'study';
                const itemCount = groups.length;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedReportSubjectId(s.id); setView('reportDetail'); }}
                    className={`text-left p-4 bg-white border-l-4 border border-stone-300 rounded-lg hover:border-stone-500 transition-colors ${
                      isStudySubj ? 'border-l-indigo-800' : 'border-l-amber-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isStudySubj
                        ? <GraduationCap size={16} className="text-indigo-800 shrink-0" />
                        : <Target size={16} className="text-amber-700 shrink-0" />}
                      <h2 className="font-serif text-base text-stone-900 flex-1 truncate">{s.name}</h2>
                      <span className="font-mono text-[10px] text-stone-400 shrink-0">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                      <ChevronRight size={16} className="text-stone-400 shrink-0" />
                    </div>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{buildSummary(groups)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'reportDetail' && selectedReport && (
        <div className="p-6">
          <p className="text-xs text-stone-500 mb-4 -mt-2">
            {formatShortDate(weekStart)} – {formatShortDate(new Date(weekEnd.getTime() - 86400000))}
          </p>
          <div className="flex flex-col gap-3">
            {selectedReport.groups.map(g => (
              <div key={g.key} className="flex items-start gap-2 p-3 bg-white border border-stone-300 rounded-lg">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-700 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-stone-900">
                      {g.wholeTopic ? g.topicName : g.subtopicName}
                    </p>
                    {g.wholeTopic && g.hadSubtopics && (
                      <span className="px-1.5 py-0.5 rounded border border-emerald-500 text-emerald-700 text-[9px] font-mono tracking-wider">
                        FULL TOPIC
                      </span>
                    )}
                  </div>
                  {!g.wholeTopic && (
                    <p className="text-xs text-stone-500">{g.topicName}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] font-mono text-stone-400">{formatDateTime(g.latest)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {view === 'pastPapersList' && activeSubject && (() => {
        const pastPapers = (activeSubject.pastPapers || []).filter(pp => pp.paper === selectedPaper);
        const topicCounts = {};
        pastPapers.forEach(pp => {
          (pp.mistakes || []).forEach(m => {
            const key = m.topic || 'Unlabeled';
            topicCounts[key] = (topicCounts[key] || 0) + 1;
          });
        });
        const focusAreas = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

        return (
          <div className="p-6">
            {focusAreas.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                <p className="text-xs font-medium text-amber-900 mb-1.5">Focus on these topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {focusAreas.map(([topic, count]) => (
                    <span key={topic} className="px-2 py-0.5 rounded border border-amber-400 bg-white text-amber-800 text-[11px] font-mono">
                      {topic} × {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pastPapers.length === 0 ? (
              <div className="text-center py-16 text-stone-400 font-serif text-sm">
                No past papers uploaded for {selectedPaper} yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pastPapers.map(pp => (
                  <button
                    key={pp.id}
                    onClick={() => { setSelectedPastPaperId(pp.id); setView('pastPaperDetail'); }}
                    className="text-left flex items-center gap-3 p-3 bg-white border border-stone-300 rounded-lg hover:border-stone-500 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{pastPaperLabel(pp)}</p>
                      <p className="text-[10px] font-mono text-stone-400 truncate">
                        {pp.session && pp.year ? `${pp.fileName} · ` : ''}{formatDateTime(pp.uploadedAt)} · {(pp.mistakes || []).length} mistake{(pp.mistakes || []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePastPaper(activeSubject.id, pp.id); }}
                      className="shrink-0 p-1 text-stone-300 hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                    <ChevronRight size={16} className="shrink-0 text-stone-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {view === 'pastPaperDetail' && selectedPastPaper && (
        <div className="p-6">
          <p className="text-xs font-mono text-stone-400 mb-4 -mt-2">
            {formatDateTime(selectedPastPaper.uploadedAt)} · {(selectedPastPaper.mistakes || []).length} mistake{(selectedPastPaper.mistakes || []).length !== 1 ? 's' : ''}
          </p>
          {(selectedPastPaper.mistakes || []).length === 0 ? (
            <div className="text-center py-16 text-stone-400 font-serif text-sm">
              No mistakes were identified in this paper.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedPastPaper.mistakes.map((m, i) => (
                <div key={i} className="p-3 bg-white border border-stone-300 rounded-lg">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {m.question && <span className="font-mono text-[10px] text-stone-400">Q{m.question}</span>}
                    {m.topic && (
                      <span className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-600 text-[10px] font-mono">
                        {m.topic}
                      </span>
                    )}
                    {typeof m.marksLost === 'number' && (
                      <span className="px-1.5 py-0.5 rounded border border-rose-300 text-rose-700 text-[10px] font-mono">
                        -{m.marksLost}
                      </span>
                    )}
                  </div>
                  {m.mistake && <p className="text-sm text-stone-700">{m.mistake}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
