<template>
  <footer class="site-footer" aria-labelledby="footer-title">
    <div class="footer-intro">
      <div>
        <p class="footer-kicker">AnGaMa</p>
        <h2 id="footer-title">{{ labels.title }}</h2>
        <p>{{ labels.description }}</p>
      </div>

      <nav class="social-links" :aria-label="labels.socialProfiles">
        <a href="https://www.twitch.tv/angama666" target="_blank" rel="me external noopener noreferrer">Twitch</a>
        <a href="https://www.tiktok.com/@angamavt" target="_blank" rel="me external noopener noreferrer">TikTok</a>
        <a href="https://www.instagram.com/angama666/" target="_blank" rel="me external noopener noreferrer">Instagram</a>
        <a href="https://x.com/AnGaMa666" target="_blank" rel="me external noopener noreferrer">X</a>
        <a href="https://github.com/AnGaMa666/Pokedex_Vue" target="_blank" rel="me external noopener noreferrer">GitHub</a>
      </nav>
    </div>

    <div class="legal-grid">
      <details id="datenschutz">
        <summary>{{ labels.privacyTitle }}</summary>
        <div class="legal-content">
          <p>{{ labels.privacyIntro }}</p>
          <ul>
            <li>{{ labels.privacyStorage }}</li>
            <li>{{ labels.privacySession }}</li>
            <li>{{ labels.privacyExternal }}</li>
            <li>{{ labels.privacyHosting }}</li>
            <li>{{ labels.privacyNoTracking }}</li>
          </ul>
          <p>{{ labels.privacyDelete }}</p>
          <p>{{ labels.privacyRights }}</p>
        </div>
      </details>

      <details id="rechte-quellen">
        <summary>{{ labels.rightsTitle }}</summary>
        <div class="legal-content">
          <p>{{ labels.rightsPokemon }}</p>
          <p>{{ labels.rightsPokeApi }}</p>
          <p>{{ labels.rightsCode }}</p>
        </div>
      </details>

      <details id="disclaimer">
        <summary>{{ labels.disclaimerTitle }}</summary>
        <div class="legal-content">
          <p>{{ labels.disclaimerFan }}</p>
          <p>{{ labels.disclaimerData }}</p>
          <p>{{ labels.disclaimerAccuracy }}</p>
          <p>{{ labels.disclaimerLinks }}</p>
        </div>
      </details>

      <details id="kontakt">
        <summary>{{ labels.contactTitle }}</summary>
        <div class="legal-content">
          <p>{{ labels.contactText }}</p>
          <p>
            <a href="https://github.com/AnGaMa666" target="_blank" rel="external noopener noreferrer">
              GitHub: AnGaMa666
            </a>
          </p>
          <p>
            <a href="https://www.twitch.tv/angama666" target="_blank" rel="me external noopener noreferrer">
              Twitch: AnGaMa666
            </a>
          </p>
        </div>
      </details>
    </div>

    <div class="footer-bottom">
      <span>© {{ currentYear }} AnGaMa</span>
      <span>{{ labels.updated }}</span>
      <a href="#home">{{ labels.backToTop }}</a>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n';

const { language } = useI18n();
const currentYear = new Date().getFullYear();

const labels = computed(() => language.value === 'de'
  ? {
      title: 'Rechtliches, Datenschutz und Quellen',
      description: 'Transparente Kurzinformationen zum Betrieb des AnGaMa Pokédex, zu lokal gespeicherten Einstellungen und zu den verwendeten Pokémon-Daten.',
      socialProfiles: 'Offizielle AnGaMa-Profile',
      privacyTitle: 'Datenschutz / DSGVO',
      privacyIntro: 'Der Pokédex besitzt kein Benutzerkonto, kein Kontaktformular und keine serverseitige Speicherung der Eingaben aus Fang-, EV-, IV-/DV- oder Wesen-Rechnern.',
      privacyStorage: 'Im lokalen Browserspeicher können Sprache, Dark Mode, Sprite- und Shiny-Auswahl, die Anzeige von Sonderformen, Team-Builder-Daten sowie zwischengespeicherte deutsche Übersetzungskataloge gespeichert werden. Diese Daten verbleiben auf dem verwendeten Gerät, bis sie über die Browserdaten gelöscht werden.',
      privacySession: 'PokéAPI-Antworten werden zur Leistungsverbesserung zeitlich begrenzt im Sitzungsspeicher des Browsers zwischengespeichert. Der Sitzungsspeicher wird durch den Browser entfernt; einzelne Cache-Einträge besitzen zusätzlich eine technische Ablaufzeit.',
      privacyExternal: 'Für Pokémon-Daten und Übersetzungen stellt der Browser HTTPS-Anfragen an pokeapi.co und raw.githubusercontent.com. Beim freiwilligen Öffnen externer Profile gelten die Datenschutzbestimmungen des jeweiligen Anbieters.',
      privacyHosting: 'Beim Seitenaufruf verarbeitet der Hostinganbieter STRATO technisch erforderliche Verbindungs- und Serverprotokolldaten. STRATO gibt für die Angriffserkennung eine Speicherung von IP-Adressen von maximal sieben Tagen an und stellt Zugriffsprotokolle mit anonymisierten Adressangaben bereit.',
      privacyNoTracking: 'Die Anwendung bindet nach aktuellem Softwarestand keine eigene Reichweitenanalyse, keine personalisierte Werbung und keine Social-Media-Tracking-Pixel ein.',
      privacyDelete: 'Lokale Daten lassen sich jederzeit über die Website- beziehungsweise Browserdaten für pokedex.byangama.de löschen. Der Team Builder kann zusätzlich innerhalb der Anwendung geleert werden.',
      privacyRights: 'Für Auskunfts-, Berichtigungs-, Löschungs- oder sonstige Datenschutzanfragen kann der Betreiber über die unten genannten AnGaMa-Kanäle kontaktiert werden. Außerdem besteht das Recht, sich an eine zuständige Datenschutzaufsichtsbehörde zu wenden.',
      rightsTitle: 'Rechte und Datenquellen',
      rightsPokemon: 'Pokémon, Pokédex, Pokémon-Namen, Figuren, Logos, Spielgrafiken und zugehörige Marken sind Eigentum von Nintendo, GAME FREAK, The Pokémon Company beziehungsweise der jeweiligen Rechteinhaber.',
      rightsPokeApi: 'Strukturierte Spiel- und Pokédex-Daten werden über die gemeinschaftlich betriebene PokéAPI bezogen. Sprites und Übersetzungskataloge stammen aus den öffentlich bereitgestellten PokeAPI-Datensätzen und Sprite-Repositories.',
      rightsCode: 'Konzept, Benutzeroberfläche und Anwendungscode dieses unabhängigen Projekts werden von AnGaMa entwickelt. Der öffentliche Quellcode ist über das verlinkte GitHub-Repository einsehbar.',
      disclaimerTitle: 'Disclaimer / Haftungshinweis',
      disclaimerFan: 'Dies ist ein unabhängiges, nicht kommerziell bestätigtes Fanprojekt. Es besteht keine Verbindung, Beauftragung oder offizielle Partnerschaft mit Nintendo, GAME FREAK oder The Pokémon Company.',
      disclaimerData: 'Die dargestellten Spiel- und Pokédex-Daten stammen überwiegend aus PokéAPI. Angaben können je Spielversion abweichen; einzelne historische oder editionsspezifische Informationen können unvollständig sein.',
      disclaimerAccuracy: 'Fangchancen, Statuswerte, Entwicklungsbedingungen, Fundorte und weitere berechnete Angaben beruhen auf den verfügbaren Daten und den ausgewählten Spielmechaniken. Eine Garantie für Vollständigkeit und Fehlerfreiheit wird nicht übernommen.',
      disclaimerLinks: 'Für Inhalte externer Websites sind ausschließlich deren Betreiber verantwortlich. Externe Links werden als solche geöffnet und dienen nur als weiterführende Quelle oder Profilverknüpfung.',
      contactTitle: 'Betreiber und Kontakt',
      contactText: 'Betreiber und Entwickler des Pokédex ist AnGaMa. Technische, inhaltliche und datenschutzbezogene Hinweise können über das GitHub-Profil oder den Twitch-Kanal AnGaMa666 übermittelt werden.',
      updated: 'Stand: 6. August 2026',
      backToTop: 'Zur Übersicht',
    }
  : {
      title: 'Legal information, privacy and sources',
      description: 'Transparent information about the AnGaMa Pokédex, locally stored preferences and the Pokémon data sources used by the application.',
      socialProfiles: 'Official AnGaMa profiles',
      privacyTitle: 'Privacy / GDPR',
      privacyIntro: 'The Pokédex has no user account, no contact form and no server-side storage of values entered in the capture, EV, IV/DV or nature calculators.',
      privacyStorage: 'Language, dark mode, sprite and shiny selection, special-form visibility, team-builder data and cached German translation catalogs may be stored in the browser’s local storage. They remain on the device until the site data is cleared.',
      privacySession: 'PokéAPI responses are cached temporarily in browser session storage for performance. The browser removes session storage and individual entries also have technical expiration times.',
      privacyExternal: 'The browser sends HTTPS requests to pokeapi.co and raw.githubusercontent.com for Pokémon data and translations. When external profiles are opened voluntarily, the respective provider’s privacy terms apply.',
      privacyHosting: 'When the page is requested, the hosting provider STRATO processes technically required connection and server-log data. STRATO states that IP addresses are retained for attack detection for no more than seven days and provides access logs with anonymised address information.',
      privacyNoTracking: 'The current application does not integrate its own audience analytics, personalised advertising or social-media tracking pixels.',
      privacyDelete: 'Local data can be removed at any time through the browser’s site-data controls for pokedex.byangama.de. The team builder can also be cleared inside the application.',
      privacyRights: 'Requests regarding access, correction, erasure or other data-protection rights can be sent through the AnGaMa channels listed below. Users may also lodge a complaint with the competent data-protection authority.',
      rightsTitle: 'Rights and data sources',
      rightsPokemon: 'Pokémon, Pokédex, Pokémon names, characters, logos, game graphics and related trademarks belong to Nintendo, GAME FREAK, The Pokémon Company or their respective owners.',
      rightsPokeApi: 'Structured game and Pokédex data is obtained through the community-operated PokéAPI. Sprites and translation catalogs come from publicly provided PokeAPI datasets and sprite repositories.',
      rightsCode: 'The concept, interface and application code of this independent project are developed by AnGaMa. The public source code is available through the linked GitHub repository.',
      disclaimerTitle: 'Disclaimer',
      disclaimerFan: 'This is an independent fan project without commercial endorsement. It is not connected with, commissioned by or officially partnered with Nintendo, GAME FREAK or The Pokémon Company.',
      disclaimerData: 'The displayed game and Pokédex data is obtained primarily from PokéAPI. Details may differ between game versions, and some historical or version-specific information may be incomplete.',
      disclaimerAccuracy: 'Catch chances, stats, evolution conditions, locations and other calculated information are based on the available data and selected mechanics. Completeness and freedom from errors are not guaranteed.',
      disclaimerLinks: 'External website operators are solely responsible for their content. External links open separately and are provided only as sources or profile references.',
      contactTitle: 'Operator and contact',
      contactText: 'The Pokédex is operated and developed by AnGaMa. Technical, content and privacy-related messages can be sent through the GitHub profile or Twitch channel AnGaMa666.',
      updated: 'Updated: 6 August 2026',
      backToTop: 'Back to overview',
    });
</script>

<style scoped>
.site-footer {
  width: min(100%, 2160px);
  padding: 22px 16px 28px;
  margin: 0 auto;
  color: var(--legacy-text);
}

.footer-intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px 4px 0 0;
  background: var(--legacy-surface);
}

.footer-kicker {
  margin: 0 0 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.footer-intro h2 {
  margin: 0;
  font-size: 1.2rem;
}

.footer-intro p:not(.footer-kicker) {
  max-width: 900px;
  margin: 8px 0 0;
  color: var(--legacy-muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.social-links a,
.footer-bottom a {
  color: var(--legacy-text);
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
}

.social-links a {
  padding: 7px 9px;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-page);
}

.social-links a:hover,
.footer-bottom a:hover {
  text-decoration: underline;
}

.legal-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-right: 1px solid var(--legacy-border);
  border-left: 1px solid var(--legacy-border);
  background: var(--legacy-surface);
}

.legal-grid details {
  min-width: 0;
  border-right: 1px solid var(--legacy-border);
  border-bottom: 1px solid var(--legacy-border);
}

.legal-grid details:last-child {
  border-right: 0;
}

.legal-grid summary {
  padding: 13px 14px;
  font-size: 0.76rem;
  font-weight: 850;
  cursor: pointer;
  list-style-position: inside;
  background: var(--legacy-page);
}

.legal-grid summary:hover {
  background: var(--legacy-surface-hover);
}

.legal-content {
  padding: 14px;
  color: var(--legacy-muted);
  font-size: 0.7rem;
  line-height: 1.55;
}

.legal-content p {
  margin: 0 0 10px;
}

.legal-content p:last-child {
  margin-bottom: 0;
}

.legal-content ul {
  padding-left: 18px;
  margin: 0 0 10px;
}

.legal-content li + li {
  margin-top: 6px;
}

.legal-content a {
  color: var(--focus-color);
}

.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  justify-content: space-between;
  padding: 11px 14px;
  border: 1px solid var(--legacy-border);
  border-top: 0;
  border-radius: 0 0 4px 4px;
  color: var(--legacy-muted);
  font-size: 0.68rem;
  background: var(--legacy-page);
}

@media (max-width: 1100px) {
  .footer-intro {
    grid-template-columns: 1fr;
  }

  .social-links {
    justify-content: flex-start;
  }

  .legal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .legal-grid details:nth-child(2) {
    border-right: 0;
  }
}

@media (max-width: 620px) {
  .site-footer {
    padding: 14px 9px 22px;
  }

  .footer-intro {
    padding: 16px;
  }

  .legal-grid {
    grid-template-columns: 1fr;
  }

  .legal-grid details {
    border-right: 0;
  }

  .footer-bottom {
    flex-direction: column;
  }
}
</style>
