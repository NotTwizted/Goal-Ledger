// Where marks go on a topic, and how not to lose them there again.
//
// Reading a script tells you what went wrong on the day; this tells you what
// goes wrong on this topic generally. It is written per topic rather than
// derived from the marks, so it is offered as what usually costs marks here —
// never as a claim about what the student actually did.
//
// `match` is tested against the topic or subtopic the question was filed under.

const PITFALLS = [
  // ---------------------------------------------------------------- maths
  {
    match: /differentiat|derivative|stationary|tangent|normal|gradient/i,
    where: 'Most dropped marks here are algebra rather than calculus: terms not rewritten as powers of x before differentiating, and sign slips on negative indices.',
    avoid: 'Rewrite every root and fraction as x to a power first, differentiate, then re-read the question — a normal needs the negative reciprocal, and a tangent needs a y value as well as a gradient.',
  },
  {
    match: /integrat|area under|trapezium/i,
    where: 'The constant of integration, and forgetting that an indefinite integral needs one at all. Definite integrals lose marks in the subtraction rather than the integration.',
    avoid: 'Write + c the moment you integrate. For a definite integral, write both substitutions out in full before subtracting, and bracket the lower one.',
  },
  {
    match: /completing the square|quadratic|discriminant|quadratic formula/i,
    where: 'Halving the x coefficient when the leading coefficient is not 1, and losing the sign when the bracket is subtracted back out.',
    avoid: 'Factor the leading coefficient out of both the x² and x terms before completing the square, and expand your answer to check it returns the original.',
  },
  {
    match: /surd|rationalis|indices|index laws/i,
    where: 'Marks go on simplifying only part of the expression, and on multiplying by the wrong conjugate when rationalising.',
    avoid: 'Break every surd into its largest square factor first. When rationalising, multiply top and bottom by the conjugate — the same terms with the middle sign flipped — and simplify fully.',
  },
  {
    match: /inequalit/i,
    where: 'The direction of the sign when multiplying or dividing by a negative, and giving a single range where a quadratic inequality needs two.',
    avoid: 'Sketch the quadratic and read the range off the sketch rather than solving it like an equation. Check one value inside your answer actually satisfies the inequality.',
  },
  {
    match: /straight line|parallel and perpendicular|coordinate geometry|midpoint/i,
    where: 'The perpendicular gradient, and leaving the answer in the wrong form when the question specified one.',
    avoid: 'Perpendicular means negative reciprocal — flip and change sign, both. Re-read the required form before writing the final line.',
  },
  {
    match: /trigonometr|sine rule|cosine rule|triangle/i,
    where: 'Choosing the wrong rule for the information given, the ambiguous case of the sine rule, and calculators left in the wrong mode.',
    avoid: 'Two sides and the angle between them, or three sides, means cosine rule; anything else, sine rule. Check degrees or radians before every calculation, and ask whether an obtuse answer is also possible.',
  },
  {
    match: /radian|arc length|sector|segment/i,
    where: 'Working in degrees when the formula needs radians, and using the sector formula where the question wanted a segment.',
    avoid: 'Both arc length and sector area assume radians. A segment is the sector minus the triangle — draw it and subtract rather than reaching for a single formula.',
  },
  {
    match: /reciprocal graph|asymptote|graphs and transformations|sketch|transform/i,
    where: 'Asymptotes not drawn or not labelled with their equations, missing intercepts, and transformations applied in the wrong order or the wrong direction.',
    avoid: 'Label every asymptote with its equation and mark where the curve cuts each axis. Remember f(x − a) moves right by a, not left, and that a stretch inside the bracket acts on x by the reciprocal factor.',
  },
  {
    match: /binomial/i,
    where: 'The signs when a term in the bracket is negative, and expanding in the wrong variable when the question asks for ascending powers.',
    avoid: 'Write the general term out before substituting, keep the negative inside the bracket, and check the first term of your expansion equals the bracket raised to the power with x = 0.',
  },
  {
    match: /logarithm|exponential/i,
    where: 'Applying a log law that does not exist — splitting log(a + b) — and losing solutions by dividing rather than factorising.',
    avoid: 'Only products, quotients and powers have log laws. Check every solution back in the original equation, since logs of negative numbers are not valid.',
  },
  {
    match: /sequence|series|arithmetic|geometric|sigma/i,
    where: 'Confusing the nth term with the sum, and off-by-one errors in the number of terms.',
    avoid: 'Write down which you need — term or sum — before choosing a formula. For sigma notation, the number of terms is top minus bottom plus one.',
  },
  {
    match: /vector/i,
    where: 'Direction of subtraction when finding a vector between two points, and confusing magnitude with the vector itself.',
    avoid: 'AB is B minus A — the end point first. Give a magnitude as a number and a vector in component form, and check which the question asked for.',
  },
  {
    match: /proof|contradiction/i,
    where: 'Stating the result rather than deriving it, and missing the concluding sentence that the marks are for.',
    avoid: 'Start from what is given, not from what you are proving. Finish with a line that says what has been shown, in words.',
  },
  {
    match: /kinematic|suvat|projectile|motion|acceleration|velocity/i,
    where: 'Signs when motion changes direction, and mixing up which suvat values are known.',
    avoid: 'Define upwards or forwards as positive at the start and keep it. List s, u, v, a and t before choosing the equation, so it is obvious which one fits.',
  },
  {
    match: /\bmoments?\b|\bforces?\b|equilibrium|newton|friction|statics/i,
    where: 'Forces missed off the diagram, and moments taken about a point that does not remove the unknowns.',
    avoid: 'Draw every force before writing an equation, including reaction and friction. Take moments about a point where an unknown acts, so it disappears.',
  },

  // -------------------------------------------------------------- biology
  {
    match: /enzyme|inhibit|active site/i,
    where: 'Describing a graph instead of explaining it, and answers that say "denatured" without saying what changed.',
    avoid: 'Name the bonds and the shape: heat or pH breaks hydrogen and ionic bonds, the tertiary structure changes, and the active site no longer complements the substrate. Compare competitive and non-competitive by their effect on Vmax, not on the shape alone.',
  },
  {
    match: /osmosis|water potential|diffusion|active transport|membrane|transport/i,
    where: 'Water potential signs, and describing movement as "from high to low concentration" for water rather than by potential.',
    avoid: 'Water moves from higher (less negative) to lower (more negative) water potential — always give the sign. Say whether the process needs ATP and whether a carrier protein is involved.',
  },
  {
    match: /photosynthesis|chloroplast|calvin/i,
    where: 'Mixing the light-dependent and light-independent stages, and not saying where in the chloroplast each happens.',
    avoid: 'State the location for every step — thylakoid membrane or stroma — and track what happens to ATP and NADP through both stages.',
  },
  {
    match: /respiration|glycolysis|krebs|atp|oxidative/i,
    where: 'Net versus gross ATP in glycolysis, and where in the mitochondrion each stage occurs.',
    avoid: 'Glycolysis makes 4 ATP but uses 2, so the net is 2. Give the location for each stage, and follow the electrons rather than only naming the stages.',
  },
  {
    match: /genetic|inheritance|dna|mutation|meiosis|mitosis|chromosom/i,
    where: 'Genetic diagrams without parental genotypes or gamete rows, and confusing genotype with phenotype in the ratio.',
    avoid: 'Set out parental phenotypes, genotypes, gametes, offspring, then the ratio — every line earns marks. Define your symbols before you use them.',
  },
  {
    match: /immun|antibod|pathogen|vaccin|disease/i,
    where: 'Confusing specific with non-specific defences, and active with passive immunity.',
    avoid: 'Say which cell does what: phagocytes engulf, B cells make antibodies, T cells kill or help. Active means you made the antibodies; passive means you were given them.',
  },
  {
    match: /ecosystem|biodiversity|conservation|nutrient cycle|food (chain|web)/i,
    where: 'Vague answers about "the environment" where the marks are for named processes and figures.',
    avoid: 'Name the process and the organism doing it. Where data is given, quote figures with units in your answer rather than describing the trend loosely.',
  },

  // ------------------------------------------------------------ chemistry
  {
    match: /titration|volumetric|burette|concordant/i,
    where: 'Using non-concordant titres in the mean, and arithmetic in the mole calculation rather than the chemistry.',
    avoid: 'Only average titres within 0.10 cm³ of each other. Set the calculation out as moles, ratio, moles, then concentration — a line each — so a slip costs one mark instead of all of them.',
  },
  {
    match: /enthalpy|energetic|calorimetr|hess|thermochemis/i,
    where: 'The sign of the enthalpy change, and using the mass of the solution rather than the substance in mcΔT.',
    avoid: 'Exothermic is negative — check the sign against whether the temperature rose. In mcΔT, m is the mass of the solution being heated, and the final answer is per mole.',
  },
  {
    match: /rate|kinetic|collision|catalyst|order of reaction/i,
    where: 'Explaining rate by "more collisions" without saying successful collisions or activation energy.',
    avoid: 'Every rate explanation needs frequency of collisions AND the proportion with energy above the activation energy. A catalyst provides an alternative route with lower activation energy — say both halves.',
  },
  {
    match: /equilibri|le chatelier|kc|kp/i,
    where: 'Predicting a shift without saying which way and why, and thinking a catalyst moves the position of equilibrium.',
    avoid: 'Name the change, the direction of the shift, and the reason in one sentence. A catalyst changes only how fast equilibrium is reached, never where it lies.',
  },
  {
    match: /redox|oxidation number|electrochemis|electrolysis|electrode/i,
    where: 'Oxidation numbers in polyatomic ions, and confusing which electrode is which.',
    avoid: 'Work oxidation numbers out from the charge on the whole ion. Oxidation is loss at the anode, reduction is gain at the cathode — in electrolysis and in cells alike.',
  },
  {
    match: /bonding|shapes of molecules|intermolecular|vsepr|polarity/i,
    where: 'Counting bonding pairs but forgetting lone pairs, and naming a force without saying between which molecules.',
    avoid: 'Count all electron pairs including lone pairs, then name the shape and the angle. Hydrogen bonding needs N, O or F and a lone pair to bond to — say so explicitly.',
  },
  {
    match: /organic|halogenoalkane|alcohol|carbonyl|carboxylic|ester|amine|aromatic|mechanism/i,
    where: 'Curly arrows starting in the wrong place, and reagents given without conditions.',
    avoid: 'An arrow starts at a bond or a lone pair, never at an atom, and points where the electrons go. Give reagent AND conditions — "acidified potassium dichromate, heat under reflux" is two marks where "oxidise" is none.',
  },
  {
    match: /qualitative analysis|test for|flame test/i,
    where: 'Giving the test without the observation, or the observation without what it proves.',
    avoid: 'Answer in three parts: reagent, what you would see, and the conclusion. "Add silver nitrate" alone earns nothing.',
  },
  {
    match: /mole|stoichiometr|empirical|concentration|yield/i,
    where: 'Not converting cm³ to dm³, and rounding partway through a multi-step calculation.',
    avoid: 'Divide cm³ by 1000 before using concentration. Carry full precision through and round only the final answer, to the significant figures the question asks for.',
  },

  // -------------------------------------------------------------- physics
  {
    match: /electric|circuit|resistiv|resistance|current|potential divider|emf/i,
    where: 'Series and parallel rules applied to the wrong part of a circuit, and internal resistance ignored.',
    avoid: 'Redraw the circuit before calculating, marking which components share a current and which share a voltage. When a cell is real, EMF equals terminal voltage plus the drop across internal resistance.',
  },
  {
    match: /momentum|collision|impulse/i,
    where: 'Momentum treated as a scalar, and kinetic energy assumed to be conserved when it is not.',
    avoid: 'Assign a positive direction and use negative values for the opposite one. Momentum is conserved in every collision; kinetic energy only in an elastic one.',
  },
  {
    match: /wave|interference|diffraction|refraction|standing wave|superposition/i,
    where: 'Path difference and phase difference confused, and the wrong angle used in refraction.',
    avoid: 'Path difference in whole wavelengths means constructive; half wavelengths means destructive. Angles in refraction are measured from the normal, never from the surface.',
  },
  {
    match: /magnetic|electromagnetic induction|flux|faraday|lenz/i,
    where: 'Left and right hand rules mixed up, and rate of change of flux confused with flux itself.',
    avoid: 'Left hand for motors, right for generators. An EMF is induced only while flux is changing — if the answer involves a steady field and no motion, the EMF is zero.',
  },
  {
    match: /thermodynamic|ideal gas|kinetic theory|specific heat|latent heat/i,
    where: 'Temperatures left in Celsius, and latent heat left out of a heating calculation that includes a change of state.',
    avoid: 'Convert to kelvin for every gas calculation. If the substance melts or boils during the question, the energy has at least two parts — mcΔT and mL.',
  },
  {
    match: /circular motion|oscillat|simple harmonic|shm|pendulum|resonance/i,
    where: 'Assuming a constant velocity in circular motion, and confusing amplitude with displacement.',
    avoid: 'Speed may be constant but velocity is not, because direction changes — which is why there is an acceleration. In SHM, acceleration is proportional to displacement and directed back towards the centre; quote both parts.',
  },
  {
    match: /nuclear|radioactiv|half-life|binding energy|fission|fusion/i,
    where: 'Nucleon and proton numbers not balancing in decay equations, and half-life arithmetic done by guesswork.',
    avoid: 'Check both numbers balance on each side of the equation. For half-lives, count the halvings explicitly rather than estimating.',
  },
  {
    match: /young modulus|hooke|material|stress|strain|density/i,
    where: 'Area not converted from mm² to m², and the gradient of a stress-strain graph read over the wrong region.',
    avoid: 'Convert every length to metres before finding an area. The Young modulus is the gradient of the straight part only — not a line through the whole curve.',
  },

  // ------------------------------------------- practical, across sciences
  {
    match: /practical|apparatus|uncertaint|evaluation|experimental|measurement/i,
    where: 'Improvements that say "be more accurate" or "repeat it", and uncertainties quoted without a unit.',
    avoid: 'Every improvement should name the specific measurement and how to make it better — a thermometer with finer divisions, a lid to reduce heat loss. Give uncertainty as an absolute value with units and as a percentage.',
  },
  {
    match: /variable|method|planning|risk/i,
    where: 'Control variables listed without saying how they are held constant.',
    avoid: 'For each control variable, say the value and the means — "temperature at 25°C using a water bath" — since the mark is for the how, not the what.',
  },

  // ------------------------------------------------------ further coverage
  {
    match: /algebraic expression|expanding|brackets|factoris|factoriz|polynomial|algebraic method|algebraic fraction/i,
    where: 'Sign errors when expanding a bracket that is subtracted, and stopping before the expression is fully factorised.',
    avoid: 'Expand into a bracket first and simplify second. After factorising, check whether either factor factorises again — a difference of two squares is easy to miss.',
  },
  {
    match: /simultaneous|points of intersection|y = mx/i,
    where: 'Finding one variable and forgetting the other, and losing the second solution when the pair is non-linear.',
    avoid: 'Substitute back to find the second variable and write both as a coordinate pair. A linear-and-quadratic pair usually has two solutions — give both unless the question rules one out.',
  },
  {
    match: /cell structure|microscop|organelle|prokaryot|eukaryot|ultrastructure/i,
    where: 'Magnification calculations with mismatched units, and organelle functions given without the structure that allows them.',
    avoid: 'Convert to the same unit before dividing — magnification is image over actual. Tie each function to a feature: cristae give surface area, a double membrane keeps enzymes together.',
  },
  {
    match: /transport in (plants|mammals|animals)|xylem|phloem|transpiration|circulat|heart|blood|haemoglobin/i,
    where: 'Describing a route without the driving force, and oxygen dissociation curves described rather than explained.',
    avoid: 'Say what creates the gradient — transpiration pull, pressure from the ventricle. For dissociation curves, link the shift to carbon dioxide concentration and to what the tissue needs.',
  },
  {
    match: /homeostasis|nervous|neurone|synap|hormone|coordination|kidney|nephron|osmoregulation/i,
    where: 'Negative feedback given as a list of events without saying what is being held constant.',
    avoid: 'Name the norm, the receptor, the effector and the correction, in that order. For a neurone, say which ions move which way and through what.',
  },
  {
    match: /classification|biodiversity|species|variation|selection|evolution|adaptation/i,
    where: 'Answers on natural selection that say organisms adapt, rather than that variation already present is selected.',
    avoid: 'Start from existing variation, then the selection pressure, then differential survival and reproduction, then allele frequency over generations. Never say an organism changed to suit its environment.',
  },
  {
    match: /reproduction|fertilisation|pregnan|gamete|flower/i,
    where: 'Sequences given out of order, and structures named without their function.',
    avoid: 'Follow the order of events, and give each structure a job as you name it.',
  },
  {
    match: /gas exchange|lung|alveol|breathing|smoking/i,
    where: 'Listing features of an exchange surface without linking each one to the rate of diffusion.',
    avoid: 'For every feature, say what it does to the rate: thin walls shorten the path, many alveoli increase the area, blood flow keeps the gradient steep.',
  },
  {
    match: /periodic|periodicity|group 2|group 17|group i|group vii|transition element|trend/i,
    where: 'Trends stated without the three factors that explain them.',
    avoid: 'Explain every trend with nuclear charge, shielding and atomic radius together — one of the three alone rarely earns the mark.',
  },
  {
    match: /atomic structure|isotope|electron configuration|ionisation energy|mass spectrom/i,
    where: 'Electron configurations written without the 4s-before-3d order, and ionisation energy defined without its state symbols.',
    avoid: 'Fill 4s before 3d, and empty it first when ionising. A definition of ionisation energy needs "one mole", "gaseous" and "+1 ions" to score.',
  },
  {
    match: /separation|filtration|crystallis|distillation|chromatograph/i,
    where: 'Describing apparatus rather than why the method separates the mixture.',
    avoid: 'Say which property is being exploited — boiling point, solubility, particle size — and then describe the steps in order.',
  },
  {
    match: /metal|reactivity series|extraction|alloy|corrosion/i,
    where: 'Reactivity explained as "more reactive" without electrons, and extraction methods matched to the wrong metal.',
    avoid: 'Explain reactivity by how readily the atom loses electrons. Match the method to the position in the series: electrolysis above carbon, reduction with carbon below it.',
  },
  {
    match: /states of matter|kinetic particle|solids, liquids/i,
    where: 'Particle explanations that describe arrangement but not energy or movement.',
    avoid: 'Cover all three every time: arrangement, movement, and the energy needed to change between states.',
  },
  {
    match: /polymer|polymerisation|plastic/i,
    where: 'Repeat units drawn without extending bonds, and addition confused with condensation.',
    avoid: 'Draw the repeat unit with bonds passing through the brackets and n outside. Addition loses nothing; condensation loses a small molecule — say which.',
  },
  {
    match: /environment|pollut|air quality|water treatment|climate|greenhouse/i,
    where: 'Named pollutants missing, and effects given without their cause.',
    avoid: 'Name the substance, where it comes from, and what it does. "Pollution harms the environment" earns nothing.',
  },
  {
    match: /energy|work|power|efficiency|conservation of energy/i,
    where: 'Efficiency coming out above 100% from mixing input and output, and energy described as lost rather than transferred.',
    avoid: 'Efficiency is useful output over total input — check the answer is below 100%. Energy is never lost, only transferred to a less useful store, usually thermal.',
  },
  {
    match: /pressure|density|upthrust|archimedes/i,
    where: 'Areas in square centimetres used with pressures in pascals, and depth confused with height.',
    avoid: 'Convert areas to square metres before calculating a pressure. In a liquid, pressure depends on depth below the surface, not on the shape of the container.',
  },
  {
    match: /field|gravitational|coulomb|capacit/i,
    where: 'Inverse square confused with inverse proportion, and field strength confused with potential.',
    avoid: 'Doubling the distance quarters the field but halves the potential — check which is being asked for. Field strength is a force per unit; potential is an energy per unit.',
  },
  {
    match: /quantum|photoelectric|photon|energy level|spectra/i,
    where: 'Intensity confused with frequency, and the threshold frequency treated as a threshold intensity.',
    avoid: 'One photon frees one electron, so frequency decides whether emission happens at all and intensity only decides how many. Brighter light below the threshold still emits nothing.',
  },
  {
    match: /space|solar system|star|universe|astronom|cosmolog|hubble|big bang/i,
    where: 'Redshift described without linking it to recession, and stellar stages listed out of order.',
    avoid: 'Say that a greater redshift means a faster recession, and that this supports an expanding universe. Learn the two stellar paths separately — they differ by mass.',
  },
  {
    match: /programming|algorithm|data structure|pseudocode|software development|database|sql|computational/i,
    where: 'Pseudocode with variables never initialised, and trace tables filled in from the expected answer rather than the code.',
    avoid: 'Initialise every variable before the loop and state the condition exactly. Trace line by line, writing each value as it changes, even when the outcome seems obvious.',
  },
  {
    match: /business|marketing|finance|motivation|management|stakeholder|operations/i,
    where: 'Points made without application to the case, and evaluation that summarises rather than judges.',
    avoid: 'Tie every point to the business named in the question, using its figures. To evaluate, say which factor matters most here and why the alternative matters less.',
  },
  {
    match: /econom|demand|supply|elasticity|inflation|fiscal|monetary|market/i,
    where: 'Diagrams without labelled axes or shifted curves, and analysis that stops before the consequence.',
    avoid: 'Label both axes, the original and the new curve, and mark the new equilibrium. Then carry the chain through: what shifts, what happens to price and quantity, and who is affected.',
  },

  // ---------------------------------------------- generally, any subject
  {
    match: /data|graph|analysis|statistic/i,
    where: 'Describing what a graph does without using the figures on it.',
    avoid: 'Quote values with units from the data and, where you can, work out a rate or a percentage change. A described trend earns one mark; a quantified one earns more.',
  },
];

export function pitfallFor(topicName) {
  if (!topicName) return null;
  return PITFALLS.find(p => p.match.test(topicName)) || null;
}
