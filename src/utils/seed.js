import 'dotenv/config';
import { connectDB } from '../config/db.js';
import sequelize from '../config/sequelize.js';
import { getUserRepository } from '../repositories/UserRepository.js';
import { getProfileRepository } from '../repositories/ProfileRepository.js';
import { getCategoryRepository } from '../repositories/CategoryRepository.js';
import { getProductRepository } from '../repositories/ProductRepository.js';
import { getDiscountRepository } from '../repositories/DiscountRepository.js';
import { getStoreInfoRepository } from '../repositories/StoreInfoRepository.js';
import { getInquiryRepository } from '../repositories/InquiryRepository.js';

async function seed() {
  console.log('--- Iniciando precarga de datos UALab (Insumos Farmacéuticos y Laboratorio) ---');
  await connectDB();

  const userRepo = getUserRepository();
  const profileRepo = getProfileRepository();
  const catRepo = getCategoryRepository();
  const prodRepo = getProductRepository();
  const discountRepo = getDiscountRepository();
  const storeRepo = getStoreInfoRepository();
  const inquiryRepo = getInquiryRepository();

  // Limpiamos productos y categorías previas para asegurar el catálogo farmacéutico/laboratorio limpio
  if (process.env.DB_TYPE === 'sql') {
    await sequelize.query('DELETE FROM product_categories');
    await sequelize.query('DELETE FROM productvariants');
    await sequelize.query('DELETE FROM products');
    await sequelize.query('DELETE FROM categories');
    await sequelize.query('DELETE FROM discounts');
    await sequelize.query('DELETE FROM inquiries');
  }

  // 1. Información Institucional de UALab
  await storeRepo.update({
    name: 'UALab Insumos Farmacéuticos & Laboratorio',
    description:
      'Distribuidora integral de equipamiento científico, instrumental analítico, reactivos e insumos farmacéuticos para laboratorios, farmacias, clínicas y centros de investigación.',
    address: 'Lima 757, Ciudad Autónoma de Buenos Aires',
    phone: '0800-122-8233',
    email: 'contacto@uade.edu.ar',
    whatsapp: '+54 9 11 7662-5199',
    hours: 'Lunes a Viernes de 8:30 a 19:00 hs | Sábados de 9:00 a 13:00 hs',
    social: {
      facebook: 'https://www.facebook.com/UADEOficial',
      instagram: 'https://www.instagram.com/uadeoficial',
      twitter: 'https://x.com/UADEoficial',
      linkedin: 'https://www.linkedin.com/school/uade/',
    },
  });
  console.log('✓ Información institucional de UALab actualizada.');

  // 2. Usuarios Administradores
  const admins = [
    {
      email: 'admin@ualab.edu.ar',
      password: 'admin1234',
      firstName: 'Administrador',
      lastName: 'UALab',
      phone: '1155550000',
      dni: '30123456',
    },
    {
      email: 'lencinadariojavier@gmail.com',
      password: 'dario1122',
      firstName: 'Dario',
      lastName: 'Lencina',
      phone: '1133557788',
      dni: '35888999',
    },
  ];

  for (const adm of admins) {
    let user = await userRepo.getByEmail(adm.email);
    if (!user) {
      user = await userRepo.create({
        email: adm.email,
        password: adm.password,
        role: 'admin',
      });
      console.log(`✓ Usuario Admin creado: ${adm.email}`);
    }
    const userId = user.id ?? user._id;
    const existingProfile = await profileRepo.getByUserId(userId);
    if (!existingProfile) {
      await profileRepo.create(userId, {
        firstName: adm.firstName,
        lastName: adm.lastName,
        phone: adm.phone,
        dni: adm.dni,
        isCompany: false,
      });
    }
  }

  // 3. Descuentos y Promociones Vigentes
  const disc1 = await discountRepo.create({
    name: 'Promo Equipamiento 15% OFF',
    type: 'percent',
    value: 15,
    isEnabled: true,
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validTo: new Date('2028-12-31T23:59:59.000Z'),
  });

  const disc2 = await discountRepo.create({
    name: 'Bonificación Insumos -$12.000',
    type: 'amount',
    value: 12000,
    isEnabled: true,
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validTo: new Date('2028-12-31T23:59:59.000Z'),
  });
  console.log('✓ Descuentos creados.');

  // 4. Categorías Jerárquicas (inspiradas en OneLab y UALab.sql)
  const parentCategories = [
    {
      key: 'equipos',
      name: 'Equipos de Laboratorio',
      slug: 'equipos-de-laboratorio',
      description: 'Instrumental analítico, agitadores, centrífugas, microscopios y balanzas de precisión.',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      sortOrder: 1,
    },
    {
      key: 'liquidos',
      name: 'Manejo de Líquidos',
      slug: 'manejo-de-liquidos',
      description: 'Micropipetas automáticas, buretas digitales, dispensadores de frasco y pipeteadores.',
      image: 'https://images.unsplash.com/photo-1579165466791-788226ab77b6?auto=format&fit=crop&w=600&q=80',
      sortOrder: 2,
    },
    {
      key: 'consumibles',
      name: 'Consumibles y Descartables',
      slug: 'consumibles-y-descartables',
      description: 'Material plástico estéril, placas de Petri, tubos Falcon, crioviales, tips y protección.',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
      sortOrder: 3,
    },
    {
      key: 'farmacia',
      name: 'Insumos Farmacéuticos y Vidriería',
      slug: 'insumos-farmaceuticos-y-vidrieria',
      description: 'Material volumétrico en vidrio borosilicato, reactivos farmacopea, morteros y envases.',
      image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
      sortOrder: 4,
    },
  ];

  const catMap = {};
  for (const pc of parentCategories) {
    const created = await catRepo.create({
      name: pc.name,
      slug: pc.slug,
      description: pc.description,
      image: pc.image,
      isEnabled: true,
      sortOrder: pc.sortOrder,
      parentId: null,
    });
    catMap[pc.key] = created.id;
  }

  const subCategories = [
    {
      key: 'agitadores',
      name: 'Agitadores y Mezcladores',
      slug: 'agitadores-y-mezcladores',
      description: 'Agitadores magnéticos con calentamiento, mezcladores vortex y orbitales.',
      parentKey: 'equipos',
      sortOrder: 1,
    },
    {
      key: 'microscopios',
      name: 'Microscopios y Óptica',
      slug: 'microscopios-y-optica',
      description: 'Microscopios binoculares, trinoculares y lupas estereoscópicas para diagnóstico.',
      parentKey: 'equipos',
      sortOrder: 2,
    },
    {
      key: 'micropipetas',
      name: 'Micropipetas y Buretas',
      slug: 'micropipetas-y-buretas',
      description: 'Pipetas de volumen variable autoclavables y buretas de titulación digital.',
      parentKey: 'liquidos',
      sortOrder: 1,
    },
    {
      key: 'descartables',
      name: 'Bioseguridad y Descartables',
      slug: 'bioseguridad-y-descartables',
      description: 'Guantes de nitrilo, filtros de jeringa, placas de cultivo y tubos PCR.',
      parentKey: 'consumibles',
      sortOrder: 1,
    },
  ];

  for (const sc of subCategories) {
    const created = await catRepo.create({
      name: sc.name,
      slug: sc.slug,
      description: sc.description,
      isEnabled: true,
      sortOrder: sc.sortOrder,
      parentId: catMap[sc.parentKey],
    });
    catMap[sc.key] = created.id;
  }
  console.log('✓ Árbol de categorías farmacéuticas y de laboratorio creado.');

  const futureDate = new Date('2028-12-31T23:59:59.000Z');

  // 5. 24 Productos de Farmacia, Bioquímica y Laboratorio (estilo OneLab)
  const productsData = [
    {
      name: 'Agitador Vortex MX-S DLab de Velocidad Variable',
      sku: 'DLAB-MX-S',
      price: 245000,
      stock: 14,
      categories: [catMap.equipos, catMap.agitadores],
      shortDescription: 'Mezclador Vortex de operación continua o modo touch para resuspensión celular y reactivos en tubos de hasta 50 ml.',
      longDescription: 'El agitador Vortex MX-S de DLab es un instrumento indispensable en laboratorios de análisis clínicos, farmacéuticos y biotecnológicos. Cuenta con regulación electrónica de velocidad entre 0 y 3000 rpm, cabezal intercambiable, base de aluminio fundido con patas de succión de vacío que garantizan estabilidad total sin desplazamiento en la mesada, y protección IP21.',
      images: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: futureDate,
      discountId: disc1.id,
    },
    {
      name: 'Bureta Digital Sartorius Biotrate de Alta Precisión',
      sku: 'LH-723080',
      price: 890000,
      stock: 8,
      categories: [catMap.liquidos, catMap.micropipetas],
      shortDescription: 'Bureta digital para titulación volumétrica exacta con cabezal dispensador giratorio 360° y alta resistencia química.',
      longDescription: 'Biotrate de Sartorius ofrece valoración exacta y segura de ácidos, bases y solventes farmacéuticos. Equipada con pantalla LCD de gran tamaño, válvula de recirculación que evita pérdida de reactivos durante el purgado, pistón de cerámica de alta pureza y calibración sencilla por el usuario conforme a normas ISO 8655.',
      images: ['https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: null,
      discountId: disc2.id,
      variants: [
        { name: 'Rango 0 - 10 ml', sku: 'LH-723080-10', price: 850000, stock: 4 },
        { name: 'Rango 0 - 20 ml', sku: 'LH-723080-20', price: 890000, stock: 5 },
        { name: 'Rango 0 - 50 ml', sku: 'LH-723080-50', price: 960000, stock: 3 },
      ],
    },
    {
      name: 'Micropipeta Automática monocanal DLab MicroPette Plus Autoclavable',
      sku: 'DLAB-MP-PLUS',
      price: 118000,
      stock: 25,
      categories: [catMap.liquidos, catMap.micropipetas],
      shortDescription: 'Micropipeta ergonómica totalmente autoclavable a 121°C para dispensación precisa de microlitros.',
      longDescription: 'Diseñada bajo estándares ISO 8655 con certificado de calibración individual. Permite esterilización completa en autoclave sin desensamblar. Visor numérico de 4 dígitos, expulsor de tips suave y cono resistente a solventes.',
      images: ['https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: futureDate,
      discountId: null,
      variants: [
        { name: '2 - 20 µL', sku: 'DLAB-MP-20', price: 118000, stock: 10 },
        { name: '10 - 100 µL', sku: 'DLAB-MP-100', price: 118000, stock: 12 },
        { name: '100 - 1000 µL', sku: 'DLAB-MP-1000', price: 118000, stock: 8 },
      ],
    },
    {
      name: 'Microscopio Binocular Óptico Arcano XSZ-107BN LED Planacromático',
      sku: 'ARC-XSZ-107',
      price: 640000,
      stock: 6,
      categories: [catMap.equipos, catMap.microscopios],
      shortDescription: 'Microscopio biológico profesional con óptica acromática 40x-1000x, condensador Abbe e iluminación LED regulable.',
      longDescription: 'Ideal para análisis clínicos, hematología, bacteriología y control de calidad farmacéutico. Revólver cuádruple con objetivos 4x, 10x, 40x (retráctil) y 100x (inmersión en aceite). Platina mecánica coaxial de doble capa y enfoque macrométrico/micrométrico de alta sensibilidad.',
      images: ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: null,
      discountId: disc1.id,
    },
    {
      name: 'Balanza Analítica de Precisión 220g x 0.0001g Ohaus Pioneer PX224',
      sku: 'OHA-PX224',
      price: 1850000,
      stock: 4,
      categories: [catMap.equipos, catMap.farmacia],
      shortDescription: 'Balanza analítica de 0.1 mg con cabina cortavientos de vidrio y calibración interna automática InCal.',
      longDescription: 'Equipada con pantalla de doble línea retroiluminada, conectividad USB y RS232 para trazabilidad GLP/GMP en formulación magistral y control de calidad farmacéutico. Plato de acero inoxidable de 90 mm.',
      images: ['https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: futureDate,
    },
    {
      name: 'Agitador Magnético con Calefacción Digital DLab MS-H280-Pro',
      sku: 'DLAB-MSH280',
      price: 395000,
      stock: 9,
      categories: [catMap.equipos, catMap.agitadores],
      shortDescription: 'Placa calefactora de acero inoxidable con revestimiento cerámico hasta 280°C y control digital LED.',
      longDescription: 'Permite agitación magnética de hasta 3 litros con regulación de 200 a 1500 rpm. Incluye sensor de temperatura externo PT1000 para control directo sobre el líquido con precisión de ±0.5°C y alerta de superficie caliente (Hot Warning) a más de 50°C.',
      images: ['https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      discountId: disc1.id,
    },
    {
      name: 'Centrífuga Clínica Digital DLab DM0412 para 8 Tubos de 15 ml',
      sku: 'DLAB-DM0412',
      price: 520000,
      stock: 7,
      categories: [catMap.equipos],
      shortDescription: 'Centrífuga de mesada de hasta 4500 rpm (2490 xg) para separación de suero, plasma, muestras de orina y formulaciones.',
      longDescription: 'Motor sin escobillas libre de mantenimiento, pantalla LCD con programación de velocidad en RPM o fuerza RCF, temporizador de 30 seg a 99 min y bloqueo electrónico de tapa de seguridad.',
      images: ['https://images.unsplash.com/photo-1583912267550-d974311a9a6e?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: null,
      discountId: disc1.id,
    },
    {
      name: 'Medidor de pH y Temperatura de Mesada Hanna HI2211 con Electrodo',
      sku: 'HAN-HI2211',
      price: 460000,
      stock: 11,
      categories: [catMap.equipos],
      shortDescription: 'pHmetro de alta exactitud (±0.01 pH) con compensación automática de temperatura (ATC) y brazo porta electrodo.',
      longDescription: 'Rango de medición de -2.00 a 16.00 pH y mV. Incluye electrodo de cuerpo de vidrio HI1131B, sonda de temperatura HI7662, sobres de soluciones buffer pH 4.01 y 7.01, y solución de electrolito.',
      images: ['https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: futureDate,
      discountId: disc2.id,
    },
    {
      name: 'Baño Termostático Digital de Acero Inoxidable 6 Litros HH-S2',
      sku: 'LAB-BANO-6L',
      price: 310000,
      stock: 6,
      categories: [catMap.equipos],
      shortDescription: 'Baño María termostatizado con controlador PID desde T° ambiente +5°C hasta 100°C.',
      longDescription: 'Cuba interior estampada en acero inoxidable 304 sin costuras para evitar corrosión. Incluye tapas concéntricas de anillos modulables para colocar matraces, vasos de precipitados o gradillas de tubos.',
      images: ['https://images.unsplash.com/photo-1563213126-a4273aed2016?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      discountId: disc1.id,
    },
    {
      name: 'Espectrofotómetro UV-Visible Digital 190-1100 nm Metash UV-5100',
      sku: 'MET-UV5100',
      price: 2450000,
      stock: 3,
      categories: [catMap.equipos],
      shortDescription: 'Espectrofotómetro de haz simple con ancho de banda de 2 nm y portaceldas automático para 4 cubetas de cuarzo.',
      longDescription: 'Lámparas de Deuterio y Tungsteno prealineadas de larga vida útil. Curvas de calibración cuantitativa, cinética y barrido básico. Incluye 4 cubetas de vidrio óptico de 10 mm y 2 cubetas de cuarzo para rango UV.',
      images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
    },
    {
      name: 'Autoclave Vertical de Esterilización por Vapor 18 Litros Acero Inox',
      sku: 'EST-AUTO-18L',
      price: 680000,
      stock: 5,
      categories: [catMap.equipos],
      shortDescription: 'Esterilizador a vapor de agua a presión (121°C / 0.14 MPa) para instrumental quirúrgico, medios de cultivo y vidriería.',
      longDescription: 'Construido íntegramente en acero inoxidable sanitario con doble válvula de seguridad sobrepresión, manómetro de doble escala y resistencia blindada sumergida.',
      images: ['https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      discountId: disc2.id,
    },
    {
      name: 'Dispensador para Boca de Frasco DLab DispensMate-Pro',
      sku: 'DLAB-DISP-PRO',
      price: 360000,
      stock: 10,
      categories: [catMap.liquidos],
      shortDescription: 'Dispensador acoplable a botella con alta resistencia a ácidos concentrados, álcalis y solventes orgánicos.',
      longDescription: 'Todas las partes en contacto con el fluido están fabricadas en PTFE, FEP, BSG y PP. Incluye 5 adaptadores universales de rosca (GL25, GL28, GL32, GL38 y S40) y tubo telescópico de aspiración.',
      images: ['https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: futureDate,
      variants: [
        { name: '0.5 - 5 ml', sku: 'DLAB-DISP-5', price: 340000, stock: 5 },
        { name: '1 - 10 ml', sku: 'DLAB-DISP-10', price: 360000, stock: 5 },
        { name: '5 - 50 ml', sku: 'DLAB-DISP-50', price: 410000, stock: 4 },
      ],
    },
    {
      name: 'Pipeteador Automático Motorizado DLab Levo ME para Pipetas de 0.1 a 100 ml',
      sku: 'DLAB-LEVO-ME',
      price: 175000,
      stock: 16,
      categories: [catMap.liquidos],
      shortDescription: 'Controlador electrónico inalámbrico para pipetas serológicas y volumétricas de vidrio o plástico.',
      longDescription: 'Batería de litio de alta duración (más de 8 horas de uso intermitente), filtro hidrofóbico de 0.45 µm reemplazable y control de velocidad de aspiración y dispensado por gatillos sensibles a la presión.',
      images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
    },
    {
      name: 'Caja x 500 Placas de Petri Estériles Descartables 90x15 mm Poliestireno',
      sku: 'CON-PETRI-90',
      price: 112000,
      stock: 30,
      categories: [catMap.consumibles, catMap.descartables],
      shortDescription: 'Placas de cultivo microbiológico de poliestireno cristal virgen de alta transparencia, esterilizadas por óxido de etileno.',
      longDescription: 'Diseño con 3 vientos para intercambio gaseoso óptimo, libres de DNasa, RNasa y pirógenos. Envasadas en mangas selladas de 20 unidades para preservar la esterilidad en cabina de flujo laminar.',
      images: ['https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: null,
      discountId: disc2.id,
    },
    {
      name: 'Pack x 500 Tubos Cónicos Tipo Falcon de Centrífuga 15 ml y 50 ml Estériles',
      sku: 'CON-FALC-PACK',
      price: 84000,
      stock: 40,
      categories: [catMap.consumibles, catMap.descartables],
      shortDescription: 'Tubos de polipropileno de alta claridad con tapa a rosca hermética, graduación impresa y área blanca de rotulado.',
      longDescription: 'Soportan centrifugación de hasta 12.000 xg y temperaturas desde -80°C hasta +121°C (autoclavables). Certificados libres de citotoxicidad y metales pesados.',
      images: ['https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      variants: [
        { name: '15 ml (Bolsa x 500 u.)', sku: 'CON-FALC-15', price: 84000, stock: 25 },
        { name: '50 ml (Bolsa x 500 u.)', sku: 'CON-FALC-50', price: 105000, stock: 15 },
      ],
    },
    {
      name: 'Bolsa x 1000 Puntas (Tips) para Micropipeta Universales Libres de RNasa',
      sku: 'CON-TIPS-UNIV',
      price: 19500,
      stock: 80,
      categories: [catMap.consumibles, catMap.liquidos],
      shortDescription: 'Puntas de polipropileno virgen grado médico de baja retención compatibles con DLab, Eppendorf, Gilson y Sartorius.',
      longDescription: 'Geometría de cono flexible para sellado hermético y eyección suave. Autoclavables a 121°C.',
      images: ['https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      variants: [
        { name: 'Amarillas 2 - 200 µL (x1000)', sku: 'TIPS-YEL-200', price: 19500, stock: 50 },
        { name: 'Azules 100 - 1000 µL (x1000)', sku: 'TIPS-BLU-1000', price: 24500, stock: 30 },
      ],
    },
    {
      name: 'Guantes de Nitrilo sin Polvo Hipoalergénicos Texturados Caja x 100 u.',
      sku: 'BIO-NIT-100',
      price: 14800,
      stock: 120,
      categories: [catMap.consumibles, catMap.descartables],
      shortDescription: 'Guantes de examinación y laboratorio resistentes a salpicaduras químicas y punción. Aprobados por ANMAT.',
      longDescription: 'Fórmula 100% nitrilo sintético libre de látex natural para evitar alergias tipo I. Yemas microtexturadas para agarre seguro de material de vidrio húmedo.',
      images: ['https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: futureDate,
      variants: [
        { name: 'Talle S (Chico)', sku: 'BIO-NIT-S', price: 14800, stock: 40 },
        { name: 'Talle M (Mediano)', sku: 'BIO-NIT-M', price: 14800, stock: 50 },
        { name: 'Talle L (Grande)', sku: 'BIO-NIT-L', price: 14800, stock: 30 },
      ],
    },
    {
      name: 'Filtros de Jeringa Estériles Membrana PES / Nylon 0.22 µm x 100 Unidades',
      sku: 'CON-FILT-022',
      price: 92000,
      stock: 22,
      categories: [catMap.consumibles, catMap.farmacia],
      shortDescription: 'Filtros de 25 mm de diámetro con conexión Luer-Lock para esterilización en frío de soluciones farmacéuticas y muestras HPLC.',
      longDescription: 'Carcasa de polipropileno soldada por ultrasonido sin adhesivos ni extractables. Envasados en blíster individual estéril.',
      images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
    },
    {
      name: 'Set x 6 Vasos de Precipitados Forma Baja Vidrio Borosilicato 3.3 Pyrex / Boeco',
      sku: 'VID-VASO-SET6',
      price: 48000,
      stock: 35,
      categories: [catMap.farmacia],
      shortDescription: 'Juego de vasos graduados de vidrio borosilicato 3.3 resistentes al choque térmico (50, 100, 250, 400, 600 y 1000 ml).',
      longDescription: 'Fabricados bajo norma ISO 3819 / DIN 12231 con pico vertedor anti-goteo y graduación blanca vitrificada de alta durabilidad frente a lavados ácidos.',
      images: ['https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: null,
      discountId: disc1.id,
    },
    {
      name: 'Matraz Aforado Clase A Vidrio Borosilicato 3.3 con Tapón de PTFE Certificado',
      sku: 'VID-AFOR-CLA',
      price: 28000,
      stock: 45,
      categories: [catMap.farmacia],
      shortDescription: 'Matraz volumétrico Clase A calibrado "In" a 20°C con número de lote grabado para análisis cuantitativo farmacopea.',
      longDescription: 'Cumple estrictamente norma DIN EN ISO 1042. Cuello esmerilado normalizado con tapón octogonal de polietileno/PTFE hermético.',
      images: ['https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
      variants: [
        { name: '100 ml Clase A', sku: 'VID-AFOR-100', price: 24000, stock: 20 },
        { name: '250 ml Clase A', sku: 'VID-AFOR-250', price: 28000, stock: 15 },
        { name: '500 ml Clase A', sku: 'VID-AFOR-500', price: 36000, stock: 10 },
      ],
    },
    {
      name: 'Frasco Reactivo Color Ámbar Rosca GL45 con Anillo Vertedor 1000 ml',
      sku: 'VID-FRAS-AMB1L',
      price: 22500,
      stock: 60,
      categories: [catMap.farmacia],
      shortDescription: 'Frasco de vidrio borosilicato ámbar fotoprotector UV para conservación de principios activos fotosensibles y soluciones madre.',
      longDescription: 'Tapa a rosca estándar DIN GL45 de polipropileno azul autoclavable hasta 140°C. Protección lumínica conforme a Farmacopea Europea y USP.',
      images: ['https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: futureDate,
    },
    {
      name: 'Mortero con Pilón de Porcelana Esmaltada Farmacéutica 130 mm (350 ml)',
      sku: 'FAR-MORT-130',
      price: 31000,
      stock: 18,
      categories: [catMap.farmacia],
      shortDescription: 'Mortero de porcelana técnica de alta dureza para pulverización, trituración y homogenización de polvos y pomadas magistrales.',
      longDescription: 'Superficie interior rugosa para molienda eficiente y exterior esmaltado brillante de fácil higienización. Resistente a ácidos y bases (excepto ácido fluorhídrico).',
      images: ['https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
    },
    {
      name: 'Alcohol Etílico Absoluto 99.5% Pro-Análisis (P.A.) ACS Cicarelli x 1000 ml',
      sku: 'REA-ETAN-PA1L',
      price: 26500,
      stock: 50,
      categories: [catMap.farmacia],
      shortDescription: 'Etanol anhidro grado analítico ACS con certificado de pureza de lote para histología, biología molecular y formulación.',
      longDescription: 'Envasado en botella de vidrio color ámbar con precinto de seguridad químico. Residuo de evaporación < 0.001% y contenido de agua (Karl Fischer) ≤ 0.2%.',
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80'],
      isFeatured: false,
      newUntil: null,
    },
    {
      name: 'Encapsuladora Manual Farmacéutica en Acrílico para 100 Cápsulas Rígidas N° 0',
      sku: 'FAR-ENCAP-100',
      price: 165000,
      stock: 9,
      categories: [catMap.farmacia, catMap.equipos],
      shortDescription: 'Equipo encapsulador semiautomático de 100 cavidades con compactador (tamper) de acero inoxidable y alineador rápido.',
      longDescription: 'Diseñada especialmente para laboratorios de recetas magistrales, farmacias oficinales y producción de suplementos dietarios. Fabricada en acrílico cristal atóxico de 10 mm y tornillería sanitaria.',
      images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=900&q=80'],
      isFeatured: true,
      newUntil: futureDate,
    },
  ];

  let addedCount = 0;
  let firstProduct = null;
  for (const item of productsData) {
    const product = await prodRepo.create(
      {
        name: item.name,
        sku: item.sku,
        images: item.images,
        shortDescription: item.shortDescription,
        longDescription: item.longDescription,
        price: item.price,
        stock: item.stock,
        isEnabled: true,
        isFeatured: Boolean(item.isFeatured),
        newUntil: item.newUntil || null,
        discountId: item.discountId || null,
      },
      {
        categories: item.categories || [],
        variants: item.variants || [],
      }
    );
    if (!firstProduct) firstProduct = product;
    addedCount++;
  }

  // 6. Consultas de muestra en la Bandeja de Entrada
  await inquiryRepo.create({
    name: 'Dra. Laura Gómez - Laboratorio Central',
    email: 'laura.gomez@labcentral.com.ar',
    phone: '011 4555-8899',
    subject: 'Cotización por 5 Micropipetas DLab y Puntas Estériles',
    message:
      'Estimados, solicitamos presupuesto formal con factura A para la compra de 5 micropipetas monocanal de 10-100 µL con certificado de calibración y 10 bolsas de tips amarillos. ¿Hacen envíos a Córdoba Capital?',
    source: 'contact',
    status: 'pending',
  });

  if (firstProduct) {
    await inquiryRepo.create({
      name: 'Farm. Martín Pereyra - Farmacia Del Pueblo',
      email: 'mpereyra@farmaciadelpueblo.com.ar',
      phone: '011 5234-9900',
      subject: `Consulta técnica sobre ${firstProduct.name}`,
      message:
        'Buen día, quería consultar si tienen disponibilidad inmediata para retiro en sucursal Lima 757 y si incluye el adaptador para tubos cónicos de 15 ml. Muchas gracias.',
      source: 'product',
      productId: firstProduct.id,
      productName: firstProduct.name,
      productSku: firstProduct.sku,
      status: 'read',
    });
  }

  console.log(`✓ Se crearon ${addedCount} publicaciones farmacéuticas y de laboratorio.`);
  console.log('✓ Índice de búsqueda y consultas iniciales generadas.');
  console.log('--- Precarga UALab completada exitosamente ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error durante la precarga:', err);
  process.exit(1);
});
