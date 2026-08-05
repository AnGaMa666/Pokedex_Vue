const createNumberSet = (values) => new Set(values);

export const STARTER_SPECIES_IDS = createNumberSet([
  1, 4, 7,
  152, 155, 158,
  252, 255, 258,
  387, 390, 393,
  495, 498, 501,
  650, 653, 656,
  722, 725, 728,
  810, 813, 816,
  906, 909, 912,
]);

export const FOSSIL_SPECIES_IDS = createNumberSet([
  138, 139, 140, 141, 142,
  345, 346, 347, 348,
  408, 409, 410, 411,
  564, 565, 566, 567,
  696, 697, 698, 699,
  880, 881, 882, 883,
]);

export const LEGENDARY_SPECIES_IDS = createNumberSet([
  144, 145, 146, 150,
  243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  638, 639, 640, 641, 642, 643, 644, 645, 646,
  716, 717, 718,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,
  888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008,
  1014, 1015, 1016, 1017, 1024,
]);

export const MYTHICAL_SPECIES_IDS = createNumberSet([
  151,
  251,
  385, 386,
  489, 490, 491, 492, 493,
  494,
  647, 648, 649,
  719, 720, 721,
  801, 802, 807, 808, 809,
  893,
  1025,
]);

export const ULTRA_BEAST_SPECIES_IDS = createNumberSet([
  793, 794, 795, 796, 797, 798, 799,
  803, 804, 805, 806,
]);

export const PARADOX_SPECIES_IDS = createNumberSet([
  984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995,
  1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023,
]);

export const BABY_SPECIES_IDS = createNumberSet([
  172, 173, 174, 175, 236, 238, 239, 240, 298,
  360, 406, 433, 438, 439, 440, 446, 447, 458,
  848,
]);

export const STATUS_OPTIONS = [
  'all',
  'legendary',
  'mythical',
  'starter',
  'fossil',
  'ultra-beast',
  'paradox',
  'baby',
  'regular',
];

export const getPokemonClassifications = (id, speciesDetails = null) => {
  const numericId = Number(id);
  const classifications = [];

  if (speciesDetails?.is_legendary || LEGENDARY_SPECIES_IDS.has(numericId)) {
    classifications.push('legendary');
  }

  if (speciesDetails?.is_mythical || MYTHICAL_SPECIES_IDS.has(numericId)) {
    classifications.push('mythical');
  }

  if (STARTER_SPECIES_IDS.has(numericId)) {
    classifications.push('starter');
  }

  if (FOSSIL_SPECIES_IDS.has(numericId)) {
    classifications.push('fossil');
  }

  if (ULTRA_BEAST_SPECIES_IDS.has(numericId)) {
    classifications.push('ultra-beast');
  }

  if (PARADOX_SPECIES_IDS.has(numericId)) {
    classifications.push('paradox');
  }

  if (speciesDetails?.is_baby || BABY_SPECIES_IDS.has(numericId)) {
    classifications.push('baby');
  }

  if (classifications.length === 0) {
    classifications.push('regular');
  }

  return classifications;
};

export const matchesPokemonStatus = (id, status, speciesDetails = null) => {
  if (!status || status === 'all') {
    return true;
  }

  return getPokemonClassifications(id, speciesDetails).includes(status);
};
