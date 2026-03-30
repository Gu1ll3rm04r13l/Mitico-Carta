import type { MenuCategory } from '../types';
import { pizzas } from './menu/pizzas';
import { sandwiches } from './menu/sandwiches';
import { entradas } from './menu/entradas';
import { panchos } from './menu/panchos';
import { cocteles } from './menu/cocteles';
import { cervezas } from './menu/cervezas';
import { vinos } from './menu/vinos';
import { bebidas } from './menu/bebidas';
import { postres } from './menu/postres';
import { empanadas } from './menu/empanadas';
import { ensaladas } from './menu/ensaladas';

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'entradas', label: 'Entradas', icon: '🧀', items: entradas },
  { id: 'cervezas', label: 'Cervezas', icon: '🍺', items: cervezas },
  { id: 'cocteles', label: 'Cócteles', icon: '🍸', items: cocteles },
  { id: 'vinos', label: 'Vinos', icon: '🍷', items: vinos },
  { id: 'bebidas', label: 'Sin Alcohol', icon: '🥤', items: bebidas },
  { id: 'pizzas', label: 'Pizzas', icon: '🍕', items: pizzas },
  { id: 'postres', label: 'Postres', icon: '🍮', items: postres },
  { id: 'sandwiches', label: 'Sandwiches', icon: '🥪', items: sandwiches },
  { id: 'panchos', label: 'Panchos', icon: '🌭', items: panchos },
  { id: 'empanadas', label: 'Empanadas', icon: '🥟', items: empanadas },
  { id: 'ensaladas', label: 'Ensaladas', icon: '🥗', items: ensaladas },
];