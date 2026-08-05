<template>
  <nav class="app-navigation" aria-label="Explorer sections">
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
defineProps({
  activeSection: {
    type: String,
    required: true,
  },
});

const navigationItems = [
  {
    id: 'home',
    label: 'Overview',
    description: 'All explorer areas',
    icon: 'home',
  },
  {
    id: 'pokedex',
    label: 'Pokédex',
    description: 'Pokémon profiles',
    icon: 'pokedex',
  },
  {
    id: 'moves',
    label: 'Moves',
    description: 'Battle techniques',
    icon: 'moves',
  },
  {
    id: 'items',
    label: 'Items',
    description: 'Bag and held items',
    icon: 'items',
  },
  {
    id: 'berries',
    label: 'Berries',
    description: 'Growth and flavors',
    icon: 'berries',
  },
];
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
  transition:
    border-color 160ms ease,
    color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.navigation-link:hover {
  border-color: #d5d9e1;
  background: #ffffff;
  transform: translateX(2px);
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
  color: #c026d3;
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
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px;
    scroll-snap-type: x proximity;
  }

  .navigation-link {
    flex: 0 0 auto;
    grid-template-columns: 36px auto;
    min-height: 52px;
    padding: 7px 10px;
    scroll-snap-align: start;
  }

  .navigation-icon {
    width: 36px;
    height: 36px;
  }

  .navigation-copy small {
    display: none;
  }
}
</style>
