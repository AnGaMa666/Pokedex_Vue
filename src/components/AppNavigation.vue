<template>
  <nav class="app-navigation" :aria-label="t('navigation.aria')">
    <a
      v-for="item in navigationItems"
      :key="item.id"
      :href="`#${item.id}`"
      class="navigation-link"
      :class="{ 'is-active': activeSection === item.id }"
      :aria-current="activeSection === item.id ? 'page' : undefined"
    >
      <span class="navigation-icon" :data-icon="item.icon" aria-hidden="true"></span>
      <span class="navigation-copy">
        <strong>{{ item.label }}</strong>
        <small>{{ item.description }}</small>
      </span>
    </a>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/i18n';

defineProps({
  activeSection: {
    type: String,
    required: true,
  },
});

const { t } = useI18n();

const navigationItems = computed(() => [
  {
    id: 'home',
    label: t('navigation.home.label'),
    description: t('navigation.home.description'),
    icon: 'home',
  },
  {
    id: 'pokedex',
    label: t('navigation.pokedex.label'),
    description: t('navigation.pokedex.description'),
    icon: 'pokedex',
  },
  {
    id: 'moves',
    label: t('navigation.moves.label'),
    description: t('navigation.moves.description'),
    icon: 'moves',
  },
  {
    id: 'items',
    label: t('navigation.items.label'),
    description: t('navigation.items.description'),
    icon: 'items',
  },
  {
    id: 'berries',
    label: t('navigation.berries.label'),
    description: t('navigation.berries.description'),
    icon: 'berries',
  },
  {
    id: 'balls',
    label: t('navigation.balls.label'),
    description: t('navigation.balls.description'),
    icon: 'balls',
  },
  {
    id: 'special-items',
    label: t('navigation.specialItems.label'),
    description: t('navigation.specialItems.description'),
    icon: 'special-items',
  },
  {
    id: 'routes',
    label: t('navigation.routes.label'),
    description: t('navigation.routes.description'),
    icon: 'routes',
  },
  {
    id: 'team',
    label: t('navigation.team.label'),
    description: t('navigation.team.description'),
    icon: 'team',
  },
]);
</script>

<style scoped>
.app-navigation {
  position: sticky;
  top: 86px;
  display: grid;
  gap: 5px;
  align-self: start;
  max-height: calc(100vh - 104px);
  padding: 7px;
  overflow-y: auto;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-surface);
  box-shadow: 0 2px 5px var(--legacy-shadow);
  scrollbar-width: thin;
}

.navigation-link {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  min-height: 52px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--legacy-text);
  text-decoration: none;
}

.navigation-link:hover {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-hover);
}

.navigation-link:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

.navigation-link.is-active {
  border-color: var(--legacy-border-strong);
  background: var(--legacy-surface-active);
  box-shadow: inset 4px 0 0 #888888;
}

.navigation-icon {
  position: relative;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--legacy-border);
  border-radius: 4px;
  background: var(--legacy-page);
}

.navigation-icon::before {
  color: var(--legacy-text);
  font-size: 1rem;
  font-weight: 900;
}

.navigation-icon[data-icon='home']::before {
  content: '⌂';
  font-size: 1.25rem;
}

.navigation-icon[data-icon='pokedex']::before {
  content: '#';
}

.navigation-icon[data-icon='moves']::before {
  content: '⚡';
}

.navigation-icon[data-icon='items']::before {
  content: '◆';
}

.navigation-icon[data-icon='berries']::before {
  content: '●';
  color: mediumorchid;
}

.navigation-icon[data-icon='balls']::before {
  content: '◉';
  color: #dc2626;
}

.navigation-icon[data-icon='special-items']::before {
  content: '✦';
  color: #7c3aed;
}

.navigation-icon[data-icon='routes']::before {
  content: '⌖';
  color: #2563eb;
}

.navigation-icon[data-icon='team']::before {
  content: 'Ⅵ';
  color: #15803d;
}

.navigation-copy {
  display: grid;
  min-width: 0;
}

.navigation-copy strong {
  font-size: 0.84rem;
}

.navigation-copy small {
  margin-top: 2px;
  overflow: hidden;
  color: var(--legacy-muted);
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .app-navigation {
    position: static;
    grid-template-columns: repeat(5, minmax(110px, 1fr));
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .navigation-link {
    grid-template-columns: 30px minmax(0, 1fr);
    min-width: 110px;
    min-height: 46px;
    padding: 5px;
  }

  .navigation-icon {
    width: 30px;
    height: 30px;
  }

  .navigation-copy strong {
    font-size: 0.7rem;
  }

  .navigation-copy small {
    display: none;
  }
}

@media (max-width: 600px) {
  .app-navigation {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: visible;
  }

  .navigation-link {
    grid-template-columns: 1fr;
    gap: 2px;
    justify-items: center;
    min-width: 0;
    min-height: 50px;
    text-align: center;
  }

  .navigation-copy strong {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
