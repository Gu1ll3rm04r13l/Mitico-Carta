import type { MenuItem } from '../../types';

export const entradas: MenuItem[] = [
    {
        id: 'berenjenas-parmesana',
        name: 'Berenjenas a la Parmesana',
        description: 'Berenjena horneada y queso gratinado en una combinación reconfortante y sabrosa.',
        price: 7900
    },
    {
        id: 'chicken-fingers',
        name: 'Chicken Fingers',
        description: 'Bastones de pollo empanados con dip de alioli y barbacoa.',
        price: 10900
    },
    {
        id: 'empanadas-casa',
        name: 'Empanadas de la Casa (3 unidades)',
        description: 'Tres empanadas a elección (Carne fritas, Caprese al horno o Jamón y Queso) + dip de mayonesa de albahaca.',
        price: 5900
    },
    {
        id: 'mix-picar',
        name: 'Mix Para Picar',
        description: 'Papas fritas, bastones de mozzarella y chicken fingers con dip de alioli y barbacoa.',
        price: 15900,
        isSignature: true
    },
    {
        id: 'papas-fritas',
        name: 'Papas Fritas',
        description: 'Papas fritas clásicas con dip de alioli y barbacoa.',
        price: 7900
    },
    {
        id: 'papas-mitico',
        name: 'Papas Mítico',
        description: 'Papas fritas con crema de leche, panceta y cebolla de verdeo.',
        price: 9900,
        isSignature: true
    },
    {
        id: 'provoleta-ahumada',
        name: 'Provoleta Ahumada',
        description: 'Provoleta "La Alemana", tomates confitados y pesto en un equilibrio perfecto.',
        price: 11900
    },
    {
        id: 'bastones-mozza',
        name: 'Bastones de Mozzarella',
        description: 'Rebozados crocantes con salsa marinara para dippear.',
        price: 6500
    },
];