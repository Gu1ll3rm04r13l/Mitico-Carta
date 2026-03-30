import type { MenuItem } from '../../types';

export const cocteles: MenuItem[] = [
    // SOURS
    { id: 'sour-amarillo', name: 'Sour Amarillo', description: 'Whisky escocés, almíbar de miel y jengibre, limón y toque de humo.', price: 7900 },
    { id: 'sour-rojo', name: 'Sour Rojo', description: 'Gin Blu, vodka de frambuesas, limón y almíbar de frutos rojos.', price: 7900 },
    { id: 'sour-verde', name: 'Sour Verde', description: 'Gin Blu, jugo de limón, almíbar simple y albahaca.', price: 7900 },

    // BY MÍTICO (Autor)
    { id: 'lucia-del-mar-tiki', name: 'Lucía del Mar (Tiki)', description: 'Trago insignia de la casa con gin, frutas tropicales y especias.', price: 10500, isSignature: true },
    { id: 'condemora', name: 'Condemora', description: 'Ron de coco, bitter de naranja, vodka de moras, almíbar de romero y lima.', price: 7900, isSignature: true },
    { id: 'usiku', name: 'Usiku', description: 'Baileys, Cynar 70, almíbar mascabo, frutos rojos y café.', price: 6900 },
    { id: 'brandy-crusta', name: 'Brandy Crusta', description: 'Brandy, hesperidina, Smirnoff de frambuesa y angostura.', price: 6900 },
    { id: 'citrico-tano', name: "Cítrico 'El Tano'", description: 'Vermú Carpano Rosso, Aperol, frutas maceradas y albahaca.', price: 6900 },
    { id: 'ro-xio', name: 'Ro-xio', description: 'Fernet Branca, Tía María, lima, tónica y menta.', price: 6900 },

    // CLÁSICOS & MÁS
    { id: 'negroni', name: 'Negroni', description: 'Gin Blu, Carpano Rosso y Campari.', price: 6900 },
    { id: 'fernet-coca', name: 'Fernet Branca', description: 'Clásico con Coca-Cola.', price: 7500 },
    { id: 'tinto-verano', name: 'Tinto de Verano', description: 'Malbec, vermú rosso, cítricos y un toque de 7up.', price: 6900 },
    { id: 'aperol-spritz', name: 'Aperol Spritz', description: 'Aperol, espumante y rodaja de naranja.', price: 6900 },
    { id: 'gin-tonic-limon', name: 'Gin Tonic con Limón', description: 'Gin Blu, tónica y rodaja de limón.', price: 6900 },
    { id: 'cynar-julep', name: 'Cynar Julep', description: 'Cynar, menta, limón, pomelo y almíbar mascabo.', price: 7900 },
];