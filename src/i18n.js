import { readonly, ref } from 'vue';

const STORAGE_KEY = 'pokedex-vue:language';
const SUPPORTED_LANGUAGES = ['de', 'en'];

const messages = {
  de: {
    'common.tryAgain': 'Erneut versuchen',
    'common.none': 'Keine',
    'common.unknown': 'Unbekannt',
    'common.entries': '{count} Einträge',
    'common.results': '{count} Ergebnisse',
    'common.previous': 'Zurück',
    'common.next': 'Weiter',
    'common.page': 'Seite {page} von {pages}',
    'header.openOverview': 'Pokémon-Explorer-Übersicht öffnen',
    'header.brand': 'Pokémon Explorer',
    'header.language': 'Sprache',
    'header.german': 'Deutsch',
    'header.english': 'English',
    'header.shinyOn': 'Shiny-Sprites an',
    'header.shinyOff': 'Shiny-Sprites aus',
    'header.sessionCache': 'Sitzungscache',
    'header.cacheTitle': 'Listen und Details werden in dieser Browsersitzung zwischengespeichert',
    'section.home.label': 'Übersicht',
    'section.pokedex.label': 'Nationaler Pokédex',
    'section.moves.label': 'Attackenverzeichnis',
    'section.items.label': 'Itemverzeichnis',
    'section.berries.label': 'Beerenverzeichnis',
    'section.pokedex.searchLabel': 'Pokémon suchen',
    'section.moves.searchLabel': 'Attacken suchen',
    'section.items.searchLabel': 'Items suchen',
    'section.berries.searchLabel': 'Beeren suchen',
    'section.pokedex.searchPlaceholder': 'Pokémon nach Name oder Nummer suchen',
    'section.moves.searchPlaceholder': 'Attacken nach Name oder Nummer suchen',
    'section.items.searchPlaceholder': 'Items nach Name oder Nummer suchen',
    'section.berries.searchPlaceholder': 'Beeren nach Name oder Nummer suchen',
    'navigation.aria': 'Explorer-Bereiche',
    'navigation.home.label': 'Übersicht',
    'navigation.home.description': 'Alle Bereiche',
    'navigation.pokedex.label': 'Pokédex',
    'navigation.pokedex.description': 'Pokémon-Profile',
    'navigation.moves.label': 'Attacken',
    'navigation.moves.description': 'Kampftechniken',
    'navigation.items.label': 'Items',
    'navigation.items.description': 'Beutel- und Trageitems',
    'navigation.berries.label': 'Beeren',
    'navigation.berries.description': 'Wachstum und Aromen',
    'home.pokedex.kicker': 'Nationaler Index',
    'home.pokedex.title': 'Pokédex',
    'home.pokedex.description': 'Profile, Typen, Fähigkeiten, Entwicklungsreihen und die vollständige Attackenliste jedes Pokémon.',
    'home.pokedex.request': '1 Indexabfrage · Details bei Auswahl',
    'home.moves.kicker': 'Kampfdaten',
    'home.moves.title': 'Attacken',
    'home.moves.description': 'Stärke, Genauigkeit, AP, Priorität, Typ, Schadensklasse und die offizielle Effektbeschreibung.',
    'home.moves.request': '1 Indexabfrage · 1 Detailabfrage',
    'home.items.kicker': 'Inventardaten',
    'home.items.title': 'Items',
    'home.items.description': 'Preise, Kategorien, Attribute, Effekte, Schleuderwerte und offizielle Item-Sprites.',
    'home.items.request': '1 Indexabfrage · 1 Detailabfrage',
    'home.berries.kicker': 'Wachstumsdaten',
    'home.berries.title': 'Beeren',
    'home.berries.description': 'Ernte, Wachstumszeit, Härte, Aromen und Natur-Kraft-Werte ohne zusätzliche Itemabfragen.',
    'home.berries.request': '1 Indexabfrage · 1 Detailabfrage',
    'pokedex.kicker': 'Nationaler Index',
    'pokedex.title': 'Pokémon',
    'pokedex.loading': 'Pokémon werden geladen…',
    'pokedex.loadError': 'Die Pokémon-Liste konnte nicht geladen werden.',
    'pokedex.noMatches': 'Keine Pokémon entsprechen deiner Suche.',
    'pokedex.openLabel': '{name} mit Pokédex-Nummer {id} öffnen',
    'pokedex.chooseTitle': 'Pokémon auswählen',
    'pokedex.chooseText': 'Wähle einen Eintrag aus dem Pokédex, um Profil, Entwicklungsreihe und Attacken zu sehen.',
    'pokedex.chooseNote': 'Die Liste verwendet eine zwischengespeicherte API-Abfrage. Detaildaten werden erst nach der Auswahl geladen.',
    'pokemon.loading': 'Pokémon-Details werden geladen…',
    'pokemon.loadError': 'Die Pokémon-Details konnten nicht geladen werden.',
    'pokemon.noDescription': 'Keine Beschreibung verfügbar.',
    'pokemon.height': 'Größe',
    'pokemon.weight': 'Gewicht',
    'pokemon.baseExperience': 'Basis-Erfahrung',
    'pokemon.abilities': 'Fähigkeiten',
    'pokemon.weaknesses': 'Schwächen',
    'pokemon.resistances': 'Resistenzen',
    'pokemon.immunities': 'Immunitäten',
    'pokemon.effectiveAgainst': 'Effektiv gegen',
    'pokemon.hidden': 'versteckt',
    'pokemon.evolutionChain': 'Entwicklungsreihe',
    'pokemon.evolutionNote': 'Sprites werden aus vorhandenen Ressourcen-IDs abgeleitet',
    'pokemon.stage': 'Stufe {stage}',
    'pokemon.specialForms': 'Mega- und Gigadynamax-Formen',
    'pokemon.specialFormsNote': 'Diese Kampfformen gehören zur Art und erhalten keine eigene Pokédex-Nummer.',
    'pokemon.megaForm': 'Mega-Entwicklung',
    'pokemon.gmaxForm': 'Gigadynamax-Form',
    'pokemon.levelUp': 'Levelaufstieg',
    'pokemon.useItem': '{item} verwenden',
    'pokemon.trade': 'Tausch',
    'pokemon.holding': 'mit {item}',
    'pokemon.happiness': 'mindestens {value} Freundschaft',
    'pokemon.affection': 'mindestens {value} Zutrauen',
    'pokemon.beauty': 'mindestens {value} Schönheit',
    'pokemon.during': 'bei {value}',
    'pokemon.knowingMove': 'mit {move}',
    'pokemon.knowingType': 'mit einer {type}-Attacke',
    'pokemon.atLocation': 'bei {location}',
    'pokemon.raining': 'bei Regen',
    'pokemon.upsideDown': 'Gerät auf den Kopf drehen',
    'pokemon.partySpecies': 'mit {species} im Team',
    'pokemon.partyType': 'mit einem {type}-Pokémon im Team',
    'pokemon.tradeSpecies': 'gegen {species}',
    'resource.moves.title': 'Attacken',
    'resource.moves.singular': 'Attacke',
    'resource.moves.kicker': 'Kampftechniken',
    'resource.moves.description': 'Durchsuche den vollständigen Attackenindex lokal. Stärke, Typ und Effekte werden nur für die ausgewählte Attacke geladen.',
    'resource.moves.empty': 'Wähle eine Attacke aus, um Kampfwerte, Schadensklasse, Ziel und offizielle Effektbeschreibung zu sehen.',
    'resource.items.title': 'Items',
    'resource.items.singular': 'Item',
    'resource.items.kicker': 'Inventardaten',
    'resource.items.description': 'Durchsuche reguläre Items ohne Beeren, TMs, VMs oder TRs. Details und Sprites werden erst nach der Auswahl geladen.',
    'resource.items.empty': 'Wähle ein Item aus, um Preis, Kategorie, Attribute, Sprite und Spieleffekt zu sehen.',
    'resource.berries.title': 'Beeren',
    'resource.berries.singular': 'Beere',
    'resource.berries.kicker': 'Wachstums- und Aromadaten',
    'resource.berries.description': 'Der Beerenindex bleibt schlank. Wachstum, Ernte und Aromawerte werden bei Bedarf geladen.',
    'resource.berries.empty': 'Wähle eine Beere aus, um Wachstumszyklus, Ernte, Härte, Aromen und Natur-Kraft-Werte zu sehen.',
    'resource.loading': '{title} werden geladen…',
    'resource.loadError': 'Der Index für {title} konnte nicht geladen werden.',
    'resource.noMatches': 'Keine {singular} entspricht deiner Suche.',
    'resource.choose': '{singular} auswählen',
    'resource.cacheNote': 'Details werden erst nach der Auswahl geladen und anschließend für diese Browsersitzung zwischengespeichert.',
    'resource.pagesAria': 'Ressourcenseiten',
  },
  en: {
    'common.tryAgain': 'Try again',
    'common.none': 'None',
    'common.unknown': 'Unknown',
    'common.entries': '{count} entries',
    'common.results': '{count} results',
    'common.previous': 'Previous',
    'common.next': 'Next',
    'common.page': 'Page {page} of {pages}',
    'header.openOverview': 'Open Pokémon Explorer overview',
    'header.brand': 'Pokémon Explorer',
    'header.language': 'Language',
    'header.german': 'Deutsch',
    'header.english': 'English',
    'header.shinyOn': 'Shiny sprites on',
    'header.shinyOff': 'Shiny sprites off',
    'header.sessionCache': 'Session cache',
    'header.cacheTitle': 'Lists and details are cached in this browser session',
    'section.home.label': 'Overview',
    'section.pokedex.label': 'National Pokédex',
    'section.moves.label': 'Move directory',
    'section.items.label': 'Item directory',
    'section.berries.label': 'Berry directory',
    'section.pokedex.searchLabel': 'Search Pokémon',
    'section.moves.searchLabel': 'Search moves',
    'section.items.searchLabel': 'Search items',
    'section.berries.searchLabel': 'Search berries',
    'section.pokedex.searchPlaceholder': 'Search Pokémon by name or number',
    'section.moves.searchPlaceholder': 'Search moves by name or number',
    'section.items.searchPlaceholder': 'Search items by name or number',
    'section.berries.searchPlaceholder': 'Search berries by name or number',
    'navigation.aria': 'Explorer sections',
    'navigation.home.label': 'Overview',
    'navigation.home.description': 'All explorer areas',
    'navigation.pokedex.label': 'Pokédex',
    'navigation.pokedex.description': 'Pokémon profiles',
    'navigation.moves.label': 'Moves',
    'navigation.moves.description': 'Battle techniques',
    'navigation.items.label': 'Items',
    'navigation.items.description': 'Bag and held items',
    'navigation.berries.label': 'Berries',
    'navigation.berries.description': 'Growth and flavors',
    'home.pokedex.kicker': 'National index',
    'home.pokedex.title': 'Pokédex',
    'home.pokedex.description': 'Profiles, types, abilities, evolutions and the complete move list for each Pokémon.',
    'home.pokedex.request': '1 index call · details on selection',
    'home.moves.kicker': 'Battle data',
    'home.moves.title': 'Moves',
    'home.moves.description': 'Power, accuracy, PP, priority, type, damage class and the official effect description.',
    'home.moves.request': '1 index call · 1 detail call',
    'home.items.kicker': 'Inventory data',
    'home.items.title': 'Items',
    'home.items.description': 'Costs, categories, attributes, effects, fling values and official item sprites.',
    'home.items.request': '1 index call · 1 detail call',
    'home.berries.kicker': 'Growth data',
    'home.berries.title': 'Berries',
    'home.berries.description': 'Harvest, growth time, firmness, flavors and Natural Gift values without extra item lookups.',
    'home.berries.request': '1 index call · 1 detail call',
    'pokedex.kicker': 'National index',
    'pokedex.title': 'Pokémon',
    'pokedex.loading': 'Loading Pokémon…',
    'pokedex.loadError': 'The Pokémon list could not be loaded.',
    'pokedex.noMatches': 'No Pokémon match your search.',
    'pokedex.openLabel': 'Open {name}, Pokédex number {id}',
    'pokedex.chooseTitle': 'Choose a Pokémon',
    'pokedex.chooseText': 'Select an entry from the Pokédex to explore its profile, evolution chain and moves.',
    'pokedex.chooseNote': 'The list uses one cached API request. Detail resources are loaded only after selection.',
    'pokemon.loading': 'Loading Pokémon details…',
    'pokemon.loadError': 'The Pokémon details could not be loaded.',
    'pokemon.noDescription': 'No description available.',
    'pokemon.height': 'Height',
    'pokemon.weight': 'Weight',
    'pokemon.baseExperience': 'Base experience',
    'pokemon.abilities': 'Abilities',
    'pokemon.weaknesses': 'Weaknesses',
    'pokemon.resistances': 'Resistances',
    'pokemon.immunities': 'Immunities',
    'pokemon.effectiveAgainst': 'Effective against',
    'pokemon.hidden': 'hidden',
    'pokemon.evolutionChain': 'Evolution chain',
    'pokemon.evolutionNote': 'Sprites are derived from existing resource IDs',
    'pokemon.stage': 'Stage {stage}',
    'pokemon.specialForms': 'Mega and Gigantamax forms',
    'pokemon.specialFormsNote': 'These battle forms belong to the species and do not receive a separate Pokédex number.',
    'pokemon.megaForm': 'Mega Evolution',
    'pokemon.gmaxForm': 'Gigantamax form',
    'pokemon.levelUp': 'Level up',
    'pokemon.useItem': 'Use {item}',
    'pokemon.trade': 'Trade',
    'pokemon.holding': 'holding {item}',
    'pokemon.happiness': '{value}+ happiness',
    'pokemon.affection': '{value}+ affection',
    'pokemon.beauty': '{value}+ beauty',
    'pokemon.during': 'during {value}',
    'pokemon.knowingMove': 'knowing {move}',
    'pokemon.knowingType': 'knowing a {type} move',
    'pokemon.atLocation': 'at {location}',
    'pokemon.raining': 'while raining',
    'pokemon.upsideDown': 'with the device upside down',
    'pokemon.partySpecies': 'with {species} in the party',
    'pokemon.partyType': 'with a {type} Pokémon in the party',
    'pokemon.tradeSpecies': 'for {species}',
    'resource.moves.title': 'Moves',
    'resource.moves.singular': 'Move',
    'resource.moves.kicker': 'Battle techniques',
    'resource.moves.description': 'Search the complete move index locally. Power, type and effects are loaded only for the selected move.',
    'resource.moves.empty': 'Select a move to inspect its battle values, damage class, target and official effect description.',
    'resource.items.title': 'Items',
    'resource.items.singular': 'Item',
    'resource.items.kicker': 'Inventory data',
    'resource.items.description': 'Browse regular items without berries, TMs, HMs or TRs. Item details and sprites are loaded only after selection.',
    'resource.items.empty': 'Select an item to inspect its price, category, attributes, sprite and in-game effect.',
    'resource.berries.title': 'Berries',
    'resource.berries.singular': 'Berry',
    'resource.berries.kicker': 'Growth and flavor data',
    'resource.berries.description': 'The berry index stays lightweight. Growth, harvest and flavor values are loaded on demand.',
    'resource.berries.empty': 'Select a berry to inspect its growth cycle, harvest, firmness, flavors and Natural Gift values.',
    'resource.loading': 'Loading {title}…',
    'resource.loadError': 'The {title} index could not be loaded.',
    'resource.noMatches': 'No {singular} matches your search.',
    'resource.choose': 'Choose a {singular}',
    'resource.cacheNote': 'Details are fetched only after selection and then cached for this browser session.',
    'resource.pagesAria': 'Resource pages',
  },
};

const resolveInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    const storedLanguage = window.localStorage?.getItem(STORAGE_KEY);

    if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
      return storedLanguage;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('de')) {
    return 'de';
  }

  return 'en';
};

const language = ref(resolveInitialLanguage());

const setLanguage = (nextLanguage) => {
  if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
    return;
  }

  language.value = nextLanguage;

  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLanguage;
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(STORAGE_KEY, nextLanguage);
    } catch {
      // Language switching remains active when storage is unavailable.
    }
  }
};

const translate = (key, replacements = {}) => {
  const template = messages[language.value]?.[key]
    ?? messages.en[key]
    ?? key;

  return Object.entries(replacements).reduce((result, [name, value]) => {
    return result.replaceAll(`{${name}}`, String(value));
  }, template);
};

setLanguage(language.value);

export const useI18n = () => ({
  language: readonly(language),
  setLanguage,
  t: translate,
});

export { SUPPORTED_LANGUAGES };
