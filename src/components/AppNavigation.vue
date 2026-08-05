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
]);
</script>

<style scoped>
.app-navigation {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 8px;
  align-self: start;
  padding: 10px;
  border: 1px solid rgba(213, 217, 225, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 12px 32px rgba(23, 32, 51, 0.07);
  backdrop-filter: blur(14px);
}

.navigation-link {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 62px;
  padding: 9px 12px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: #344054;
  text-decoration: none;
}

.navigation-link:hover {
  border-color: #d5d9e1;
  background: #ffffff;
}

.navigation-link:focus-visible {
  outline: 3px solid rgba(220, 38, 38, 0.24);
  outline-offset: 2px;
}

.navigation-link.is-active {
  border-color: rgba(220, 38, 38, 0.24);
  color: #991b1b;
  background: #fff4f4;
}

.navigation-icon {
  position: relative;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid #d5d9e1;
  border-radius: 13px;
  background: linear-gradient(145deg, #ffffff, #eef1f6);
}

.navigation-icon::before {
  color: #4b5563;
  font-size: 1rem;
  font-weight: 900;
}

.navigation-icon[data-icon='home']::before {
  content: '⌂';
  font-size: 1.35rem;
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

.navigation-link.is-active .navigation-icon {
  border-color: rgba(220, 38, 38, 0.32);
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.12);
}

.navigation-copy {
  display: grid;
  min-width: 0;
}

.navigation-copy strong {
  font-size: 0.94rem;
}

.navigation-copy small {
  margin-top: 3px;
  overflow: hidden;
  color: #7a8494;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .app-navigation {
    position: static;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    padding: 6px;
    overflow: visible;
  }

  .navigation-link {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3px;
    justify-items: center;
    min-width: 0;
    min-height: 54px;
    padding: 5px 2px;
    text-align: center;
  }

  .navigation-icon {
    width: 30px;
    height: 30px;
    border-radius: 4px;
  }

  .navigation-copy {
    width: 100%;
  }

  .navigation-copy strong {
    overflow: hidden;
    font-size: 0.68rem;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .navigation-copy small {
    display: none;
  }
}

@media (max-width: 380px) {
  .navigation-copy strong {
    font-size: 0.62rem;
  }
}
</style>
