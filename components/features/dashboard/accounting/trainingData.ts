export type ContentBlockType = 'text' | 'heading' | 'formula' | 'example' | 'keypoint' | 'list' | 'tip' | 'warning' | 'table' | 'divider' | 'highlight' | 'comparison';

export interface ContentBlock {
  type: ContentBlockType;
  value?: string;
  label?: string;
  formula?: string;
  title?: string;
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  leftTitle?: string;
  rightTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  color?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: ContentBlock[];
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
}

export const trainingModules: TrainingModule[] = [
  // ═══════════════════════════════════════════
  // MODULE 1: ECONOMÍA FUNDAMENTAL
  // ═══════════════════════════════════════════
  {
    id: 'eco-fundamentals',
    title: 'Economía Fundamental',
    description: 'Entiende cómo funciona el dinero, los mercados y las fuerzas que mueven la economía',
    emoji: '📊',
    color: '#6366f1',
    lessons: [
      {
        id: 'what-is-economics',
        title: '¿Qué es la Economía?',
        duration: '5 min',
        content: [
          { type: 'heading', value: 'La ciencia de las decisiones' },
          { type: 'text', value: 'La economía es la ciencia que estudia cómo las personas, empresas y gobiernos toman decisiones para asignar recursos escasos. Cada vez que decides en qué gastar tu dinero, estás haciendo economía.' },
          { type: 'keypoint', value: 'TODO tiene un costo de oportunidad: lo que sacrificas por elegir algo. Si inviertes $5.000.000 COP en inventario, el costo de oportunidad es lo que ese dinero hubiera generado en otra inversión como un CDT o fondos de inversión.' },
          { type: 'heading', value: 'Microeconomía vs Macroeconomía' },
          { type: 'comparison', leftTitle: 'Microeconomía', rightTitle: 'Macroeconomía', leftItems: ['Estudia decisiones individuales', 'Precios de productos específicos', 'Oferta y demanda en un mercado', 'Tu negocio, tu competencia'], rightItems: ['Estudia la economía en su conjunto', 'Inflación, PIB, desempleo', 'Políticas monetarias y fiscales', 'El país, la región, el mundo'] },
          { type: 'heading', value: 'Los 3 Problemas Fundamentales' },
          { type: 'list', items: ['¿QUÉ producir? → Qué bienes y servicios necesita el mercado', '¿CÓMO producir? → Qué tecnología, recursos y procesos usar', '¿PARA QUIÉN producir? → Quién va a comprar y a qué precio'] },
          { type: 'tip', value: 'Como emprendedor, respondes estos 3 problemas cada día: decides qué vender, cómo fabricarlo/conseguirlo y a quién venderle.' }
        ]
      },
      {
        id: 'supply-demand',
        title: 'Oferta, Demanda y Precio',
        duration: '6 min',
        content: [
          { type: 'heading', value: 'La Ley de la Demanda' },
          { type: 'text', value: 'A mayor precio, menor cantidad demandada. A menor precio, mayor cantidad demandada. Esto es intuitivo: si una camiseta cuesta $150.000 COP, pocos la compran. Si cuesta $30.000 COP, muchos la quieren.' },
          { type: 'heading', value: 'La Ley de la Oferta' },
          { type: 'text', value: 'A mayor precio, los productores quieren vender más. A menor precio, producen menos. Si las camisetas se venden a $150.000 COP, muchos fabricantes querrán entrar al mercado.' },
          { type: 'heading', value: 'El Punto de Equilibrio del Mercado' },
          { type: 'text', value: 'Donde la oferta se encuentra con la demanda se forma el PRECIO DE MERCADO. Este es el precio "justo" que el mercado establece naturalmente.' },
          { type: 'formula', label: 'Equilibrio', formula: 'Cantidad Demandada = Cantidad Ofrecida → Precio de Mercado' },
          { type: 'heading', value: 'Elasticidad: ¿Cuánto reacciona tu cliente?' },
          { type: 'text', value: 'La elasticidad mide cómo cambia la demanda cuando cambia el precio. Productos con demanda ELÁSTICA (ropa, restaurantes): un pequeño aumento de precio hace que pierdas muchos clientes. Productos con demanda INELÁSTICA (medicinas, gasolina): aunque suba el precio, la gente sigue comprando.' },
          { type: 'tip', value: 'Si vendes productos de demanda elástica, compite con valor agregado, no solo con precio. Si vendes productos inelásticos, tienes más poder de fijación de precios.' },
          { type: 'example', title: 'Ejemplo Real', content: 'Tienes una tienda de ropa en Bogotá. Subes los precios 20% y tus ventas caen 40% → demanda elástica. Tu vecino vende medicamentos, sube precios 20% y sus ventas solo caen 5% → demanda inelástica.' }
        ]
      },
      {
        id: 'money-inflation',
        title: 'Dinero, Inflación y tu Bolsillo',
        duration: '5 min',
        content: [
          { type: 'heading', value: '¿Qué es el dinero?' },
          { type: 'text', value: 'El dinero cumple 3 funciones: medio de intercambio (comprar y vender), unidad de cuenta (medir el valor de las cosas) y depósito de valor (guardar riqueza para el futuro).' },
          { type: 'heading', value: 'Inflación: El Enemigo Silencioso' },
          { type: 'text', value: 'La inflación es el aumento generalizado y sostenido de los precios. Si la inflación es del 10% anual, lo que hoy cuesta $100.000 COP, el próximo año costará $110.000 COP. Tu dinero pierde poder adquisitivo cada día que pasa.' },
          { type: 'warning', value: 'Si guardas dinero debajo del colchón con una inflación del 10%, en 7 años tu dinero habrá perdido la MITAD de su valor real.' },
          { type: 'heading', value: 'Tasa de Interés: El Precio del Dinero' },
          { type: 'text', value: 'La tasa de interés es lo que cuesta pedir prestado dinero, o lo que ganas por ahorrarlo. Cuando el Banco de la República sube las tasas, los créditos se encarecen, la gente gasta menos y la inflación tiende a bajar.' },
          { type: 'keypoint', value: 'Regla de oro: Tu dinero debe rendir MÁS que la inflación. Si la inflación es 8% y tu cuenta de ahorros paga 4%, estás PERDIENDO dinero en términos reales.' },
          { type: 'tip', value: 'Busca inversiones que superen la inflación: CDTs, fondos de inversión colectiva (FICs), o reinvertir en tu propio negocio si genera más retorno.' }
        ]
      },
      {
        id: 'economic-cycle',
        title: 'El Ciclo Económico y tu Negocio',
        duration: '4 min',
        content: [
          { type: 'heading', value: 'Las 4 Fases del Ciclo' },
          { type: 'list', items: ['📈 EXPANSIÓN: La economía crece, hay empleo, la gente consume. Momento ideal para invertir y crecer.', '🏔️ AUGE: El punto más alto. Todo va bien pero los precios empiezan a subir demasiado. Cuidado con sobreendeudarte.', '📉 RECESIÓN: La economía se contrae, bajan las ventas, sube el desempleo. Momento de ser conservador y cuidar el efectivo.', '🕳️ DEPRESIÓN/VALLE: El punto más bajo. Los precios son baratos. Oportunidad para comprar activos a buen precio.'] },
          { type: 'heading', value: 'Indicadores que Debes Vigilar' },
          { type: 'table', headers: ['Indicador', 'Qué mide', 'Señal de alerta'], rows: [['PIB', 'Producción total del país', '2 trimestres negativos = recesión'], ['Inflación', 'Aumento de precios', 'Por encima del 7-8% es preocupante'], ['Desempleo', 'Personas sin trabajo', 'Por encima del 12% afecta ventas'], ['Tasa de interés', 'Costo del crédito', 'Subidas agresivas frenan el consumo'], ['Tasa de cambio', 'Valor del dólar (TRM)', 'Sube = importaciones más caras'] ] },
          { type: 'tip', value: 'No necesitas ser economista. Solo mira estos 5 indicadores una vez al mes y adapta tu estrategia.' }
        ]
      }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 2: CONTABILIDAD BÁSICA
  // ═══════════════════════════════════════════
  {
    id: 'accounting-basics',
    title: 'Contabilidad: El Lenguaje de los Negocios',
    description: 'Domina la ecuación contable, partida doble y los fundamentos que sostienen todo negocio',
    emoji: '📝',
    color: '#10b981',
    lessons: [
      {
        id: 'accounting-equation',
        title: 'La Ecuación Contable Fundamental',
        duration: '5 min',
        content: [
          { type: 'heading', value: 'La Regla de Oro de la Contabilidad' },
          { type: 'formula', label: 'Ecuación Contable', formula: 'ACTIVO = PASIVO + PATRIMONIO' },
          { type: 'text', value: 'Esta ecuación SIEMPRE debe cumplirse. Es el ABC de toda la contabilidad mundial. Veamos qué significa cada parte:' },
          { type: 'heading', value: '¿Qué son los Activos?' },
          { type: 'text', value: 'Los activos son TODO lo que tu empresa posee y que tiene valor: dinero en caja, inventario, maquinaria, cuentas por cobrar, el local, vehículos. Es todo lo que TIENES.' },
          { type: 'heading', value: '¿Qué son los Pasivos?' },
          { type: 'text', value: 'Los pasivos son TODO lo que tu empresa debe: préstamos bancarios, cuentas por pagar a proveedores, impuestos por pagar, salarios pendientes. Es todo lo que DEBES.' },
          { type: 'heading', value: '¿Qué es el Patrimonio?' },
          { type: 'text', value: 'El patrimonio es lo que REALMENTE es tuyo después de pagar todas las deudas. Es la diferencia entre lo que tienes y lo que debes.' },
          { type: 'example', title: 'Ejemplo con tu Negocio', content: 'Tu tienda tiene: Inventario ($5.000.000 COP) + Caja ($2.000.000 COP) + Muebles ($3.000.000 COP) = ACTIVOS: $10.000.000 COP. Debes al proveedor ($3.000.000 COP) + Préstamo bancario ($4.000.000 COP) = PASIVOS: $7.000.000 COP. Tu PATRIMONIO: $10.000.000 - $7.000.000 = $3.000.000 COP. Esos $3 millones son lo que realmente es tuyo.' },
          { type: 'keypoint', value: 'Si tus pasivos son mayores que tus activos, tu patrimonio es NEGATIVO. Esto significa que técnicamente debes más de lo que tienes. ¡Señal de peligro!' }
        ]
      },
      {
        id: 'double-entry',
        title: 'Partida Doble: El Corazón de la Contabilidad',
        duration: '6 min',
        content: [
          { type: 'heading', value: 'Cada Movimiento Afecta Dos Cuentas' },
          { type: 'text', value: 'Este es el principio más importante de la contabilidad moderna, inventado hace más de 500 años por el monje italiano Luca Pacioli. Cada transacción SIEMPRE afecta al menos dos cuentas.' },
          { type: 'heading', value: 'Debe y Haber' },
          { type: 'table', headers: ['Concepto', 'DEBE (izquierda)', 'HABER (derecha)'], rows: [['Activos', 'Aumentan', 'Disminuyen'], ['Pasivos', 'Disminuyen', 'Aumentan'], ['Patrimonio', 'Disminuye', 'Aumenta'], ['Ingresos', 'Disminuyen', 'Aumentan'], ['Gastos', 'Aumentan', 'Disminuyen']] },
          { type: 'heading', value: 'Ejemplos de Asientos Contables' },
          { type: 'example', title: 'Vendes un producto por $100.000 COP en efectivo', content: 'DEBE: Caja (Activo) +$100.000 COP → Entra dinero.\nHABER: Ingresos por ventas +$100.000 COP → Ganas dinero.\nLa ecuación sigue en equilibrio.' },
          { type: 'example', title: 'Compras inventario a crédito por $500.000 COP', content: 'DEBE: Inventario (Activo) +$500.000 COP → Tienes más mercancía.\nHABER: Cuentas por pagar (Pasivo) +$500.000 COP → Debes al proveedor.\nActivo sube, Pasivo sube → La ecuación sigue en equilibrio.' },
          { type: 'tip', value: 'No necesitas ser contador para entender esto. Solo recuerda: todo lo que entra tiene una contrapartida. Si entra dinero, algo sale o alguien te lo debe.' }
        ]
      },
      {
        id: 'chart-of-accounts',
        title: 'Plan de Cuentas: Organizando tus Finanzas',
        duration: '5 min',
        content: [
          { type: 'heading', value: 'Las 6 Familias de Cuentas' },
          { type: 'text', value: 'El plan de cuentas es como el índice de un libro contable. Agrupa todas las cuentas en 6 grandes familias:' },
          { type: 'list', items: ['1️⃣ ACTIVOS — Todo lo que tienes (caja, bancos, inventario, maquinaria)', '2️⃣ PASIVOS — Todo lo que debes (préstamos, cuentas por pagar, impuestos)', '3️⃣ PATRIMONIO — Lo que es tuyo (capital, utilidades retenidas)', '4️⃣ INGRESOS — Lo que ganas (ventas, servicios, comisiones)', '5️⃣ GASTOS — Lo que gastas para operar (arriendo, servicios, nómina)', '6️⃣ COSTOS DE VENTA — Lo que te cuesta lo que vendes (materia prima, empaque)'] },
          { type: 'highlight', value: 'Las cuentas 1-3 forman el BALANCE GENERAL (foto de tu empresa). Las cuentas 4-6 forman el ESTADO DE RESULTADOS (película de tu operación).' },
          { type: 'heading', value: 'Clasificación de Activos' },
          { type: 'comparison', leftTitle: 'Activo Corriente (< 1 año)', rightTitle: 'Activo No Corriente (> 1 año)', leftItems: ['Efectivo y bancos', 'Cuentas por cobrar', 'Inventarios', 'Inversiones a corto plazo'], rightItems: ['Maquinaria y equipo', 'Muebles y enseres', 'Vehículos', 'Propiedad/Local comercial'] },
          { type: 'heading', value: 'Clasificación de Pasivos' },
          { type: 'comparison', leftTitle: 'Pasivo Corriente (< 1 año)', rightTitle: 'Pasivo No Corriente (> 1 año)', leftItems: ['Proveedores por pagar', 'Impuestos por pagar', 'Salarios pendientes', 'Cuotas de crédito a corto plazo'], rightItems: ['Préstamos bancarios a largo plazo', 'Hipotecas', 'Bonos emitidos', 'Obligaciones a más de 12 meses'] }
        ]
      },
      {
        id: 'accounting-books',
        title: 'Los Libros Contables',
        duration: '4 min',
        content: [
          { type: 'heading', value: 'Libro Diario' },
          { type: 'text', value: 'Es el registro cronológico de TODAS las transacciones de tu negocio, día a día. Cada entrada tiene: fecha, cuentas afectadas, montos en debe y haber, y una descripción.' },
          { type: 'heading', value: 'Libro Mayor' },
          { type: 'text', value: 'Agrupa las transacciones por cuenta. Mientras el diario es cronológico, el mayor te muestra el resumen de cada cuenta: cuánto tienes en caja, cuánto debes a proveedores, cuánto has vendido.' },
          { type: 'heading', value: 'Balance de Comprobación' },
          { type: 'text', value: 'Es un reporte que verifica que la suma de todos los débitos sea igual a la suma de todos los créditos. Si no cuadra, hay un error en algún registro.' },
          { type: 'keypoint', value: 'En la práctica moderna, un software contable hace todo esto automáticamente. Pero ENTENDER el proceso te da poder sobre tus números.' },
          { type: 'tip', value: 'Aunque uses software, revisa manualmente tu balance de comprobación al menos una vez al mes. Los errores de digitación son más comunes de lo que crees.' }
        ]
      }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 3: ESTADOS FINANCIEROS
  // ═══════════════════════════════════════════
  {
    id: 'financial-statements',
    title: 'Estados Financieros',
    description: 'Los 3 reportes que todo empresario debe saber leer para tomar decisiones inteligentes',
    emoji: '📋',
    color: '#8b5cf6',
    lessons: [
      {
        id: 'balance-sheet',
        title: 'Balance General',
        duration: '7 min',
        content: [
          { type: 'heading', value: 'La Fotografía de tu Empresa' },
          { type: 'text', value: 'El Balance General (o Estado de Situación Financiera) es una fotografía de tu empresa en un momento exacto. Te dice: qué tienes, qué debes y cuánto vale tu empresa.' },
          { type: 'heading', value: 'Estructura del Balance' },
          { type: 'table', headers: ['ACTIVOS', 'Valor', 'PASIVOS + PATRIMONIO', 'Valor'], rows: [['Caja y Bancos', '$3.000.000 COP', 'Proveedores', '$2.500.000 COP'], ['Cuentas por Cobrar', '$1.500.000 COP', 'Impuestos por pagar', '$800.000 COP'], ['Inventarios', '$4.000.000 COP', 'Préstamo bancario', '$5.000.000 COP'], ['--- Activo Corriente ---', '$8.500.000 COP', '--- Pasivo Total ---', '$8.300.000 COP'], ['Maquinaria', '$6.000.000 COP', 'Capital Social', '$3.000.000 COP'], ['Muebles', '$1.800.000 COP', 'Utilidades Retenidas', '$5.000.000 COP'], ['--- Activo No Corriente ---', '$7.800.000 COP', '--- Patrimonio ---', '$8.000.000 COP'], ['═══ TOTAL ACTIVOS ═══', '$16.300.000 COP', '═══ TOTAL P+P ═══', '$16.300.000 COP']] },
          { type: 'keypoint', value: 'SIEMPRE debe cuadrar: Total Activos = Total Pasivos + Total Patrimonio. Si no cuadra, hay un error.' },
          { type: 'heading', value: '¿Qué te dice el Balance?' },
          { type: 'list', items: ['Liquidez: ¿Tienes suficiente efectivo para pagar deudas a corto plazo?', 'Solvencia: ¿Tus activos totales cubren todas tus deudas?', 'Endeudamiento: ¿Qué porcentaje de tu empresa está financiado con deuda?', 'Patrimonio: ¿Está creciendo tu patrimonio neto con el tiempo?'] }
        ]
      },
      {
        id: 'income-statement',
        title: 'Estado de Resultados (P&L)',
        duration: '7 min',
        content: [
          { type: 'heading', value: 'La Película de tu Operación' },
          { type: 'text', value: 'El Estado de Resultados (también llamado P&L por Profit & Loss) muestra si tu negocio fue rentable durante un período: un mes, un trimestre o un año. Es la película vs la foto del balance.' },
          { type: 'heading', value: 'Estructura Paso a Paso' },
          { type: 'table', headers: ['Concepto', 'Valor', 'Explicación'], rows: [['Ingresos por Ventas', '$20.000.000 COP', 'Todo lo que vendiste'], ['(-) Costo de Ventas', '$8.000.000 COP', 'Lo que te costó lo vendido'], ['= UTILIDAD BRUTA', '$12.000.000 COP', 'Ganancia antes de gastos'], ['(-) Gastos Operacionales', '$7.000.000 COP', 'Arriendo, nómina, servicios'], ['= UTILIDAD OPERACIONAL', '$5.000.000 COP', 'Ganancia de tu operación'], ['(+/-) Otros Ingresos/Gastos', '-$500.000 COP', 'Intereses, extraordinarios'], ['= UTILIDAD ANTES DE IMP.', '$4.500.000 COP', 'Antes de impuestos'], ['(-) Impuestos (35%)', '$1.575.000 COP', 'Lo que pagas al Estado'], ['= UTILIDAD NETA', '$2.925.000 COP', 'Tu ganancia real']] },
          { type: 'keypoint', value: 'La UTILIDAD BRUTA te dice si tu negocio es viable. La UTILIDAD NETA te dice si realmente ganas dinero después de TODO.' },
          { type: 'heading', value: 'Los 3 Márgenes que Debes Conocer' },
          { type: 'formula', label: 'Margen Bruto', formula: '(Utilidad Bruta / Ventas) × 100 = ($12M / $20M) × 100 = 60%' },
          { type: 'formula', label: 'Margen Operativo', formula: '(Utilidad Operacional / Ventas) × 100 = ($5M / $20M) × 100 = 25%' },
          { type: 'formula', label: 'Margen Neto', formula: '(Utilidad Neta / Ventas) × 100 = ($2.925M / $20M) × 100 = 14.6%' },
          { type: 'tip', value: 'Un margen bruto menor al 30% en retail es preocupante. Un margen neto del 10-15% es saludable para la mayoría de negocios.' }
        ]
      },
      {
        id: 'cash-flow',
        title: 'Estado de Flujo de Efectivo',
        duration: '6 min',
        content: [
          { type: 'heading', value: 'El Reporte Más Importante para Sobrevivir' },
          { type: 'text', value: 'Muchas empresas RENTABLES quiebran. ¿Cómo? Porque una cosa es la utilidad contable y otra muy diferente es tener EFECTIVO en el banco. El flujo de efectivo te dice cuánto dinero real entró y salió.' },
          { type: 'warning', value: 'Una empresa puede mostrar $10.000.000 COP de utilidad en el Estado de Resultados y no tener ni $1.000.000 COP en el banco. Esto pasa cuando vendes a crédito y no cobras.' },
          { type: 'heading', value: 'Los 3 Tipos de Flujo' },
          { type: 'list', items: ['💰 FLUJO OPERATIVO: Dinero que entra y sale por tu actividad principal (ventas, pagos a proveedores, nómina). DEBE ser positivo.', '🏗️ FLUJO DE INVERSIÓN: Dinero usado para comprar o vender activos (maquinaria, equipos). Normalmente es negativo cuando inviertes.', '🏦 FLUJO DE FINANCIAMIENTO: Dinero de préstamos recibidos o pagados, aportes de socios, pago de dividendos.'] },
          { type: 'highlight', value: 'REGLA CRÍTICA: Tu flujo operativo SIEMPRE debe ser positivo. Si tu negocio no genera efectivo con su operación diaria, tienes un problema grave, sin importar lo que digan las utilidades.' },
          { type: 'example', title: 'Caso Real: Rentable pero sin Efectivo', content: 'Vendiste $10.000.000 COP en el mes. Utilidad: $3.000.000 COP. Pero le vendiste a crédito a 60 días a tu cliente más grande ($7.000.000 COP). Mientras tanto, debes pagar arriendo ($2.000.000 COP), nómina ($3.000.000 COP) y proveedores ($4.000.000 COP) = $9.000.000 COP en gastos HOY. Solo recibiste $3.000.000 COP en efectivo. Te faltan $6.000.000 COP para operar. Eres rentable pero estás sin liquidez.' }
        ]
      },
      {
        id: 'reading-financials',
        title: 'Cómo Leer tus Estados Financieros',
        duration: '5 min',
        content: [
          { type: 'heading', value: '5 Preguntas que Debes Responder Cada Mes' },
          { type: 'list', items: ['1. ¿Mi patrimonio está creciendo? → Mira el Balance General mes a mes', '2. ¿Mi margen bruto es estable o está bajando? → Revisa el Estado de Resultados', '3. ¿Estoy generando efectivo con la operación? → Revisa el Flujo de Efectivo', '4. ¿Puedo pagar mis deudas a corto plazo? → Activo Corriente vs Pasivo Corriente', '5. ¿Mi nivel de deuda es manejable? → Pasivo Total vs Activo Total'] },
          { type: 'heading', value: 'Señales de Alerta 🚨' },
          { type: 'list', items: ['❌ Ventas crecen pero la utilidad baja → tus costos están fuera de control', '❌ Utilidad positiva pero flujo de caja negativo → problemas de cobro', '❌ Patrimonio disminuye → estás perdiendo valor, algo va muy mal', '❌ Pasivo corriente mayor que activo corriente → riesgo de no poder pagar'] },
          { type: 'tip', value: 'Dedica 30 minutos al mes para revisar estos reportes. Es la inversión de tiempo más valiosa que puedes hacer como empresario.' }
        ]
      }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 4: FINANZAS PERSONALES
  // ═══════════════════════════════════════════
  {
    id: 'personal-finance',
    title: 'Finanzas Personales',
    description: 'Ordena tu dinero personal antes de manejar el de tu empresa — las bases que nadie te enseñó',
    emoji: '💰',
    color: '#f59e0b',
    lessons: [
      {
        id: 'personal-balance',
        title: 'Tu Estado Financiero Personal',
        duration: '5 min',
        content: [
          { type: 'heading', value: 'Tu Balance Personal' },
          { type: 'text', value: 'Antes de manejar las finanzas de un negocio, necesitas ordenar las tuyas. Tu balance personal funciona igual que el de una empresa:' },
          { type: 'formula', label: 'Tu Patrimonio Neto', formula: 'Lo que TIENES - Lo que DEBES = Lo que VALES financieramente' },
          { type: 'heading', value: 'Ejercicio: Calcula tu Patrimonio' },
          { type: 'table', headers: ['Lo que TIENES (Activos)', 'Valor', 'Lo que DEBES (Pasivos)', 'Valor'], rows: [['Ahorros en banco', '$___ COP', 'Tarjeta de crédito', '$___ COP'], ['Inversiones', '$___ COP', 'Crédito de vehículo', '$___ COP'], ['Valor de tu moto/carro', '$___ COP', 'Préstamos personales', '$___ COP'], ['Equipos/computador', '$___ COP', 'Deudas con amigos/familia', '$___ COP'], ['Otros bienes', '$___ COP', 'Otras deudas', '$___ COP'], ['TOTAL ACTIVOS', '$___ COP', 'TOTAL PASIVOS', '$___ COP']] },
          { type: 'highlight', value: 'Tu patrimonio neto = Total Activos - Total Pasivos. Si el resultado es negativo, estás técnicamente en quiebra personal. Pero tranquilo, es el primer paso para mejorar.' },
          { type: 'keypoint', value: 'Haz este ejercicio AHORA. Escríbelo en papel. Conocer tu número real es el primer paso para cambiarlo.' }
        ]
      },
      {
        id: 'budget-503020',
        title: 'Presupuesto Personal: La Regla 50/30/20',
        duration: '6 min',
        content: [
          { type: 'heading', value: 'Cómo Distribuir tu Ingreso' },
          { type: 'text', value: 'La senadora estadounidense Elizabeth Warren popularizó esta regla simple que funciona para cualquier nivel de ingreso:' },
          { type: 'list', items: ['50% → NECESIDADES: Arriendo, comida, transporte, servicios, salud. Lo que necesitas para vivir.', '30% → DESEOS: Restaurantes, entretenimiento, ropa no esencial, viajes. Lo que quieres pero no necesitas.', '20% → AHORRO E INVERSIÓN: Fondo de emergencia, inversiones, pago extra de deudas. Tu futuro.'] },
          { type: 'example', title: 'Si ganas $3.000.000 COP/mes', content: '$1.500.000 COP → Necesidades (arriendo $800K, comida $400K, transporte $200K, servicios $100K)\n$900.000 COP → Deseos (salidas $300K, ropa $200K, streaming $100K, otros $300K)\n$600.000 COP → Ahorro e inversión (fondo emergencia $300K, inversión $300K)' },
          { type: 'warning', value: 'Si tus necesidades consumen más del 50%, tienes dos opciones: reducir gastos o aumentar ingresos. No hay atajos.' },
          { type: 'tip', value: 'Empieza imperfecto. Si solo puedes ahorrar el 5%, hazlo. Es infinitamente mejor que el 0%. Cada mes intenta subir 1%.' }
        ]
      },
      {
        id: 'compound-interest',
        title: 'El Poder del Interés Compuesto',
        duration: '5 min',
        content: [
          { type: 'heading', value: 'La Octava Maravilla del Mundo' },
          { type: 'text', value: 'Albert Einstein supuestamente dijo: "El interés compuesto es la fuerza más poderosa del universo. Quien lo entiende, lo gana. Quien no, lo paga." Ya sea o no una cita real, el mensaje es verdadero.' },
          { type: 'formula', label: 'Fórmula del Interés Compuesto', formula: 'Valor Futuro = Capital × (1 + tasa)^períodos' },
          { type: 'heading', value: 'El Ejemplo que Cambiará tu Mente' },
          { type: 'table', headers: ['Escenario', 'Inversión mensual', 'Tasa anual', 'Años', 'Total invertido', 'Valor final'], rows: [['A: Empiezas a los 25', '$200.000 COP', '10%', '30 años', '$72.000.000 COP', '$452.000.000 COP'], ['B: Empiezas a los 35', '$200.000 COP', '10%', '20 años', '$48.000.000 COP', '$153.000.000 COP'], ['C: Empiezas a los 45', '$200.000 COP', '10%', '10 años', '$24.000.000 COP', '$41.000.000 COP']] },
          { type: 'keypoint', value: 'La persona A invirtió solo $72 millones COP en total, pero terminó con $452 millones COP. Eso es el interés compuesto: el tiempo es tu mayor activo.' },
          { type: 'warning', value: 'El interés compuesto también trabaja EN TU CONTRA cuando tienes deudas. Una tarjeta de crédito al 28% anual convierte una deuda de $1.000.000 COP en $2.300.000 COP en solo 3 años si no pagas.' }
        ]
      },
      {
        id: 'smart-vs-toxic-debt',
        title: 'Deuda Inteligente vs Deuda Tóxica',
        duration: '4 min',
        content: [
          { type: 'heading', value: 'No Toda Deuda es Mala' },
          { type: 'comparison', leftTitle: '✅ Deuda Inteligente', rightTitle: '❌ Deuda Tóxica', leftItems: ['Genera más dinero del que cuesta', 'Crédito para tu negocio al 18% que genera 40%', 'Hipoteca para un local comercial', 'Educación que aumenta tus ingresos', 'Maquinaria que multiplica producción'], rightItems: ['Consume tu dinero sin retorno', 'Tarjeta de crédito para compras impulsivas', 'Crédito de consumo para vacaciones', 'Financiar un carro que se devalúa', 'Pedir prestado para cubrir otra deuda'] },
          { type: 'heading', value: 'Estrategia Bola de Nieve para Eliminar Deudas' },
          { type: 'list', items: ['1. Lista todas tus deudas de menor a mayor monto', '2. Paga el mínimo en todas excepto la más pequeña', '3. En la más pequeña, pon TODO el dinero extra que puedas', '4. Cuando la elimines, ese dinero va a la siguiente deuda', '5. Repite hasta estar libre de deudas'] },
          { type: 'tip', value: 'La bola de nieve funciona psicológicamente: ver desaparecer una deuda te motiva enormemente. Matemáticamente es mejor pagar primero la de mayor tasa, pero la motivación vale más.' }
        ]
      },
      {
        id: 'emergency-fund',
        title: 'Fondo de Emergencia',
        duration: '4 min',
        content: [
          { type: 'heading', value: 'Tu Colchón Financiero' },
          { type: 'text', value: 'Un fondo de emergencia es dinero guardado exclusivamente para imprevistos: una enfermedad, la pérdida del empleo, una reparación urgente. NO es para vacaciones ni oportunidades de negocio.' },
          { type: 'heading', value: '¿Cuánto necesitas?' },
          { type: 'list', items: ['Nivel 1 (Básico): 1 mes de gastos → Para empezar', 'Nivel 2 (Estable): 3 meses de gastos → Protección razonable', 'Nivel 3 (Seguro): 6 meses de gastos → Ideal para emprendedores', 'Nivel 4 (Blindado): 12 meses de gastos → Si dependes 100% de tu negocio'] },
          { type: 'keypoint', value: 'Como emprendedor, tu ingreso es variable. Tu fondo de emergencia debería ser de mínimo 6 meses de gastos personales + gastos fijos del negocio.' },
          { type: 'heading', value: '¿Dónde guardarlo?' },
          { type: 'list', items: ['✅ Cuenta de ahorros de alto rendimiento (ej: Lulo Bank, Nu, RappiPay) → Líquido y accesible', '✅ CDT a 30-90 días → Un poco mejor rentabilidad', '❌ NO en acciones → Demasiado volátil para emergencias', '❌ NO en el negocio → Si el negocio tiene problemas, pierdes ambos'] }
        ]
      }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 5: FINANZAS PARA TU NEGOCIO
  // ═══════════════════════════════════════════
  {
    id: 'business-finance',
    title: 'Finanzas para tu Negocio',
    description: 'Herramientas financieras prácticas para hacer crecer tu empresa de forma sostenible',
    emoji: '🏪',
    color: '#ec4899',
    lessons: [
      { id: 'working-capital', title: 'Capital de Trabajo: El Oxígeno de tu Negocio', duration: '5 min', content: [
        { type: 'heading', value: '¿Qué es el Capital de Trabajo?' },
        { type: 'formula', label: 'Capital de Trabajo', formula: 'Activo Corriente - Pasivo Corriente = Capital de Trabajo' },
        { type: 'text', value: 'Es el dinero que necesitas para operar día a día: pagar proveedores, mantener inventario, cubrir nómina mientras cobras tus ventas. Sin capital de trabajo, tu negocio se asfixia.' },
        { type: 'example', title: 'Ejemplo', content: 'Activo Corriente: Caja $2M COP + Inventario $5M COP + Cuentas por cobrar $3M COP = $10M COP\nPasivo Corriente: Proveedores $4M COP + Nómina $2M COP = $6M COP\nCapital de Trabajo = $10M - $6M = $4M COP → Tienes colchón para operar.' },
        { type: 'heading', value: 'El Ciclo Operativo' },
        { type: 'text', value: 'Tu ciclo operativo es: COMPRAR inventario → VENDER productos → COBRAR el dinero. El tiempo que tarda este ciclo determina cuánto capital de trabajo necesitas.' },
        { type: 'table', headers: ['Concepto', 'Días', 'Impacto'], rows: [['Días de inventario', '30 días', 'Cuánto tiempo tarda en venderse'], ['Días de cartera', '15 días', 'Cuánto tiempo tardan en pagarte'], ['Días de proveedores', '20 días', 'Cuánto tiempo te dan para pagar'], ['Ciclo de efectivo', '25 días', '30 + 15 - 20 = 25 días sin efectivo']] },
        { type: 'keypoint', value: 'Mientras MENOR sea tu ciclo de efectivo, MENOS capital de trabajo necesitas. Cobra rápido, vende rápido, negocia plazos largos con proveedores.' }
      ] },
      { id: 'break-even', title: 'Punto de Equilibrio: ¿Cuánto Debo Vender?', duration: '6 min', content: [
        { type: 'heading', value: 'El Número Más Importante de tu Negocio' },
        { type: 'text', value: 'El punto de equilibrio es el nivel de ventas donde tus ingresos cubren EXACTAMENTE todos tus costos. No ganas ni pierdes. A partir de ahí, cada venta adicional es ganancia.' },
        { type: 'formula', label: 'Punto de Equilibrio en Unidades', formula: 'PE = Costos Fijos ÷ (Precio de Venta - Costo Variable Unitario)' },
        { type: 'formula', label: 'Punto de Equilibrio en Dinero', formula: 'PE$ = Costos Fijos ÷ (1 - (Costo Variable / Ventas))' },
        { type: 'example', title: 'Cálculo Real', content: 'Costos Fijos mensuales: Arriendo $1.500.000 COP + Nómina $2.000.000 COP + Servicios $500.000 COP = $4.000.000 COP\nPrecio de venta de tu producto: $50.000 COP\nCosto variable por unidad: $20.000 COP\nMargen de contribución: $50.000 - $20.000 = $30.000 COP\nPunto de Equilibrio = $4.000.000 ÷ $30.000 = 134 unidades\n\nDebes vender mínimo 134 unidades al mes para no perder dinero.\nEn dinero: 134 × $50.000 = $6.700.000 COP en ventas mínimas.' },
        { type: 'warning', value: 'Si no conoces tu punto de equilibrio, estás operando a ciegas. Calcula este número HOY.' },
        { type: 'tip', value: 'Cuando alguien te ofrezca un descuento, calcula cómo afecta tu punto de equilibrio. Un descuento del 10% puede significar que necesitas vender 30% más unidades para compensar.' }
      ] },
      { id: 'profit-margins', title: 'Márgenes de Ganancia', duration: '5 min', content: [
        { type: 'heading', value: 'Los 3 Márgenes que Definen tu Negocio' },
        { type: 'formula', label: 'Margen Bruto', formula: '(Ventas - Costo de Ventas) ÷ Ventas × 100' },
        { type: 'text', value: 'Te dice cuánto ganas ANTES de gastos operacionales. Si vendes a $100K COP y te cuesta $40K COP, tu margen bruto es 60%.' },
        { type: 'formula', label: 'Margen Operativo', formula: 'Utilidad Operacional ÷ Ventas × 100' },
        { type: 'text', value: 'Te dice cuánto ganas con tu OPERACIÓN, después de pagar arriendo, nómina, servicios, marketing.' },
        { type: 'formula', label: 'Margen Neto', formula: 'Utilidad Neta ÷ Ventas × 100' },
        { type: 'text', value: 'Tu ganancia REAL después de todo: costos, gastos, intereses e impuestos. Es lo que te queda en el bolsillo.' },
        { type: 'heading', value: 'Márgenes Saludables por Industria' },
        { type: 'table', headers: ['Industria', 'Margen Bruto', 'Margen Neto'], rows: [['Retail / Tienda online', '40-60%', '5-15%'], ['Alimentos / Restaurantes', '60-70%', '3-10%'], ['Servicios profesionales', '70-90%', '15-25%'], ['Software / Digital', '80-95%', '20-40%'], ['Manufactura', '25-45%', '5-12%'], ['Moda / Confección', '50-70%', '8-15%']] },
        { type: 'heading', value: 'Markup vs Margen: La Diferencia Crucial' },
        { type: 'formula', label: 'Markup', formula: 'Precio = Costo × (1 + Markup%) → Costo $20K + 100% markup = Precio $40K COP' },
        { type: 'formula', label: 'Margen', formula: 'Margen = (Precio - Costo) ÷ Precio × 100 → ($40K-$20K)÷$40K = 50%' },
        { type: 'keypoint', value: 'Un markup del 100% equivale a un margen del 50%. NO son lo mismo. El markup se calcula sobre el costo; el margen sobre el precio de venta.' }
      ] },
      { id: 'financial-kpis', title: 'KPIs Financieros', duration: '6 min', content: [
        { type: 'heading', value: '5 KPIs que Todo Empresario Debe Medir' },
        { type: 'formula', label: 'ROI (Retorno sobre Inversión)', formula: 'ROI = (Beneficio Neto ÷ Inversión) × 100' },
        { type: 'text', value: 'Si invertiste $10.000.000 COP en inventario y ganaste $3.000.000 COP de utilidad, tu ROI es 30%.' },
        { type: 'formula', label: 'ROE (Retorno sobre Patrimonio)', formula: 'ROE = (Utilidad Neta ÷ Patrimonio) × 100' },
        { type: 'text', value: 'Mide qué tan eficiente eres usando el dinero de los dueños. Un ROE del 25% significa que por cada $100 COP de patrimonio, generas $25 COP de utilidad al año.' },
        { type: 'formula', label: 'ROA (Retorno sobre Activos)', formula: 'ROA = (Utilidad Neta ÷ Activos Totales) × 100' },
        { type: 'formula', label: 'EBITDA', formula: 'EBITDA = Utilidad Operativa + Depreciaciones + Amortizaciones' },
        { type: 'text', value: 'Muestra la rentabilidad operativa pura, sin efectos contables ni financieros. Es el indicador favorito de los inversionistas.' },
        { type: 'formula', label: 'Ticket Promedio', formula: 'Ticket Promedio = Ventas Totales ÷ Número de Transacciones' },
        { type: 'tip', value: 'Empieza midiendo solo 3 KPIs: Margen neto, Flujo de caja operativo y Ticket promedio. Cuando los domines, agrega más.' }
      ] }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 6: COSTOS Y PRECIOS
  // ═══════════════════════════════════════════
  {
    id: 'costs-pricing',
    title: 'Costos y Precios',
    description: 'Aprende a calcular precios rentables y controlar costos como un profesional',
    emoji: '🏷️',
    color: '#14b8a6',
    lessons: [
      { id: 'cost-types', title: 'Tipos de Costos', duration: '5 min', content: [
        { type: 'heading', value: 'Costos Fijos vs Variables' },
        { type: 'comparison', leftTitle: 'Costos Fijos', rightTitle: 'Costos Variables', leftItems: ['No cambian con el volumen de ventas', 'Arriendo del local: $2.000.000 COP/mes', 'Nómina fija: $3.000.000 COP/mes', 'Seguros: $200.000 COP/mes', 'Los pagas vendas o no vendas'], rightItems: ['Cambian según cuánto vendes', 'Materia prima: $20.000 COP/unidad', 'Empaque: $2.000 COP/unidad', 'Comisión de venta: 5% por venta', 'Solo los pagas cuando vendes'] },
        { type: 'heading', value: 'Costos Directos vs Indirectos' },
        { type: 'comparison', leftTitle: 'Costos Directos', rightTitle: 'Costos Indirectos', leftItems: ['Se asignan directamente al producto', 'Materia prima de la camiseta', 'Mano de obra del costurero', 'Tela, botones, hilo'], rightItems: ['Se comparten entre varios productos', 'Arriendo de la fábrica', 'Sueldo del administrador', 'Electricidad del taller'] },
        { type: 'heading', value: 'Costos Hundidos: No Caigas en la Trampa' },
        { type: 'text', value: 'Un costo hundido es dinero que ya gastaste y NO puedes recuperar. No debes seguir invirtiendo en algo solo porque "ya gasté mucho". Las decisiones se toman mirando hacia adelante, no hacia atrás.' },
        { type: 'keypoint', value: 'Nunca justifiques una mala decisión con la frase "ya invertí mucho". Eso es la falacia del costo hundido y es uno de los errores más costosos en los negocios.' }
      ] },
      { id: 'pricing-methods', title: 'Cómo Calcular el Precio de Venta', duration: '6 min', content: [
        { type: 'heading', value: '4 Métodos para Fijar Precios' },
        { type: 'heading', value: 'Método 1: Markup sobre Costo' },
        { type: 'formula', label: 'Markup', formula: 'Precio = Costo Total × (1 + % de Markup)' },
        { type: 'example', title: 'Ejemplo', content: 'Costo total del producto: $25.000 COP\nMarkup deseado: 80%\nPrecio = $25.000 × 1.80 = $45.000 COP' },
        { type: 'heading', value: 'Método 2: Margen sobre Precio' },
        { type: 'formula', label: 'Margen', formula: 'Precio = Costo ÷ (1 - % de Margen deseado)' },
        { type: 'example', title: 'Ejemplo', content: 'Costo: $25.000 COP\nMargen deseado: 40%\nPrecio = $25.000 ÷ (1 - 0.40) = $25.000 ÷ 0.60 = $41.667 COP' },
        { type: 'heading', value: 'Método 3: Basado en la Competencia' },
        { type: 'text', value: 'Investiga a qué precio venden tus competidores y posiciónate: igual (competir por servicio), por debajo (competir por precio) o por encima (competir por valor/marca).' },
        { type: 'heading', value: 'Método 4: Basado en el Valor Percibido' },
        { type: 'text', value: 'Cobra según el VALOR que el cliente percibe. Un café en la esquina vale $2.000 COP, en Starbucks vale $15.000 COP. El costo del café es similar, pero el valor percibido es diferente.' },
        { type: 'tip', value: 'El mejor precio no es el más bajo ni el más alto. Es aquel donde maximizas: Ganancia × Volumen de ventas.' }
      ] },
      { id: 'cogs', title: 'Costo de Ventas (COGS)', duration: '5 min', content: [
        { type: 'heading', value: '¿Cuánto te Cuesta lo que Vendes?' },
        { type: 'formula', label: 'Costo de Ventas', formula: 'Inventario Inicial + Compras del Período - Inventario Final = Costo de Ventas' },
        { type: 'example', title: 'Ejemplo Mensual', content: 'Inventario al 1 de enero: $5.000.000 COP\n+ Compras en enero: $8.000.000 COP\n= Mercancía disponible: $13.000.000 COP\n- Inventario al 31 de enero: $4.000.000 COP\n= Costo de ventas: $9.000.000 COP\n\nSi vendiste $15.000.000 COP, tu utilidad bruta fue $6.000.000 COP (margen bruto 40%).' },
        { type: 'heading', value: 'Métodos de Valoración de Inventario' },
        { type: 'table', headers: ['Método', 'Cómo funciona', 'Cuándo usar'], rows: [['PEPS (Primeros en Entrar, Primeros en Salir)', 'Lo primero que compraste es lo primero que vendes', 'Productos perecederos, moda'], ['Promedio Ponderado', 'Promedio del costo de todas las unidades', 'Productos estándar, sin caducidad'], ['Identificación Específica', 'Cada unidad tiene su costo real', 'Productos únicos o de alto valor']] },
        { type: 'tip', value: 'Para un ecommerce, el método de Promedio Ponderado suele ser el más práctico.' }
      ] }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 7: IMPUESTOS Y OBLIGACIONES
  // ═══════════════════════════════════════════
  {
    id: 'taxes',
    title: 'Impuestos y Obligaciones',
    description: 'Entiende tus obligaciones tributarias para evitar multas y optimizar tu carga fiscal',
    emoji: '🏛️',
    color: '#ef4444',
    lessons: [
      { id: 'iva', title: 'IVA: Impuesto al Valor Agregado', duration: '5 min', content: [
        { type: 'heading', value: '¿Qué es el IVA?' },
        { type: 'text', value: 'El IVA es un impuesto al consumo que se cobra en cada etapa de la cadena de producción y distribución. En Colombia, la tarifa general es del 19%. Como vendedor, tú lo cobras y luego se lo pagas al Estado.' },
        { type: 'heading', value: 'IVA Generado vs IVA Descontable' },
        { type: 'formula', label: 'IVA a Pagar', formula: 'IVA Generado (lo que cobras) - IVA Descontable (lo que pagas) = IVA a pagar a la DIAN' },
        { type: 'example', title: 'Ejemplo', content: 'Vendiste productos por $10.000.000 COP + IVA 19% = Cobraste $1.900.000 COP de IVA (IVA Generado)\nCompraste mercancía por $6.000.000 COP + IVA 19% = Pagaste $1.140.000 COP de IVA (IVA Descontable)\nIVA a pagar = $1.900.000 - $1.140.000 = $760.000 COP → Esto le pagas a la DIAN' },
        { type: 'comparison', leftTitle: 'Exentos (IVA 0%)', rightTitle: 'Excluidos (Sin IVA)', leftItems: ['Tienen IVA pero con tarifa 0%', 'El vendedor SÍ puede descontar el IVA de sus compras', 'Ejemplo: carne, leche, huevos'], rightItems: ['No tienen IVA en absoluto', 'El vendedor NO puede descontar IVA', 'Ejemplo: servicios de salud, educación'] },
        { type: 'tip', value: 'Guarda TODAS las facturas de compra. El IVA que pagas en compras reduce el IVA que le debes a la DIAN. Sin factura, pierdes ese beneficio.' }
      ] },
      { id: 'withholding-tax', title: 'Retención en la Fuente', duration: '5 min', content: [
        { type: 'heading', value: '¿Qué es?' },
        { type: 'text', value: 'La retención en la fuente NO es un impuesto nuevo. Es un anticipo del impuesto de renta que se descuenta en el momento del pago. Te van descontando el impuesto de renta a lo largo del año, en cada transacción.' },
        { type: 'heading', value: '¿Cuándo Aplica?' },
        { type: 'table', headers: ['Concepto', 'Base mínima (2025-2026)', 'Tarifa'], rows: [['Compras generales', 'Desde $1.091.000 COP aprox.', '2.5%'], ['Servicios', 'Desde $155.000 COP aprox.', '4% - 6%'], ['Honorarios', 'Cualquier valor', '10% - 11%'], ['Arrendamientos', 'Desde $1.091.000 COP aprox.', '3.5%'], ['Salarios', 'Según tabla', 'Variable']] },
        { type: 'keypoint', value: 'Lleva un registro de TODA la retención que te practiquen. Al declarar renta, ese dinero ya pagado se resta de tu impuesto. Si no lo registras, pagas doble.' }
      ] },
      { id: 'legal-regime', title: 'Régimen Jurídico: Natural vs Jurídica', duration: '6 min', content: [
        { type: 'heading', value: '¿Cómo vas a registrar tu negocio?' },
        { type: 'text', value: 'Antes de preocuparte por los impuestos, debes decidir tu estructura legal. En Colombia, puedes operar de dos formas principales: como Persona Natural (tú mismo con tu cédula) o creando una Persona Jurídica (una empresa independiente con NIT propio, como una S.A.S.).' },
        { type: 'heading', value: 'Persona Natural (El Emprendedor Solitario)' },
        { type: 'comparison', leftTitle: '✅ PROS Persona Natural', rightTitle: '❌ CONTRAS Persona Natural', leftItems: ['Creación inmediata y muy económica (solo necesitas RUT y Cámara de Comercio)', 'Contabilidad más sencilla al iniciar', 'No necesitas estatutos ni actas de asamblea'], rightItems: ['Riesgo ilimitado: Si el negocio quiebra o te demandan, respondes con tu patrimonio personal (tu casa, tu carro, tus ahorros)', 'Las tarifas de impuesto de renta pueden llegar hasta el 39% si ganas mucho dinero', 'Menos confianza y credibilidad ante bancos e inversionistas'] },
        { type: 'heading', value: 'Persona Jurídica (S.A.S.)' },
        { type: 'comparison', leftTitle: '✅ PROS Persona Jurídica', rightTitle: '❌ CONTRAS Persona Jurídica', leftItems: ['Escudo protector: Tu patrimonio personal queda separado. Si la empresa quiebra, solo se pierde el capital de la empresa', 'Tarifa de renta plana (35%), que termina siendo mejor que la natural cuando tienes altas utilidades', 'Da una imagen corporativa, facilita créditos comerciales y licitaciones', 'Permite deducir gastos como nómina de dueños, planes de celular y vehículos'], rightItems: ['Cuesta dinero crearla y liquidarla', 'Obligación estricta de llevar contabilidad formal y posiblemente contratar contador', 'Mayor carga administrativa (reuniones de asamblea, renovación mercantil más costosa)'] },
        { type: 'example', title: 'La Decisión Inteligente', content: 'Si vas a poner un negocio de alto riesgo financiero (ej: maquinaria pesada, créditos grandes, alimentos) NUNCA operes como Persona Natural, ya que una demanda te puede dejar en la calle. Crea una S.A.S. desde el día 1.\n\nSi vas a vender servicios profesionales como freelance sin riesgo de demandas, empezar como Persona Natural es la mejor opción hasta que tus ingresos superen cierto tope y los impuestos te obliguen a pasarte a S.A.S.' }
      ] },
      { id: 'tax-regime', title: 'Régimen Tributario en Colombia', duration: '8 min', content: [
        { type: 'heading', value: 'La Elección del Régimen: Razón vs Emoción' },
        { type: 'text', value: 'En Colombia existen dos caminos principales para tributar: el Régimen Ordinario y el Régimen SIMPLE de Tributación (RST). Elegir a la ligera o bajo el supuesto de que "el Simple es mejor porque es simple" es uno de los errores más costosos de los emprendedores.' },
        { type: 'keypoint', value: 'La diferencia crítica: El Régimen Ordinario cobra impuestos sobre la UTILIDAD NETA (Ganancias reales). El Régimen SIMPLE cobra impuestos sobre el INGRESO BRUTO (Ventas totales), sin importar si ganaste o perdiste dinero.' },
        { type: 'heading', value: 'Régimen SIMPLE de Tributación (RST)' },
        { type: 'comparison', leftTitle: '✅ PROS del RST', rightTitle: '❌ CONTRAS del RST', leftItems: ['Unifica hasta 6 impuestos (renta, IVA, ICA, etc.) en un solo pago bimestral', 'Tarifas muy bajas (desde 1.8% hasta 14.5% según la actividad)', 'Descuento del 100% de aportes a pensión de empleados directamente de tu impuesto a pagar', 'Menos burocracia y costos de contabilidad'], rightItems: ['SE PAGA SOBRE INGRESOS BRUTOS. No permite deducir costos ni gastos de materia prima, nómina ni arriendos', 'Si tu negocio tiene márgenes pequeños (< 20%), el RST puede consumir TODA tu utilidad y hacerte pagar impuestos a pérdida', 'Retenciones del 4% en algunos servicios que afectan tu flujo de caja'] },
        { type: 'heading', value: 'Régimen ORDINARIO' },
        { type: 'comparison', leftTitle: '✅ PROS del Ordinario', rightTitle: '❌ CONTRAS del Ordinario', leftItems: ['Se calcula sobre la utilidad real (Ingresos - Costos - Gastos)', 'Permite deducir TODOS los costos y gastos asociados a la operación (facturas electrónicas)', 'Si el negocio da pérdida en el año, el impuesto de renta es $0 COP', 'Ideal para negocios de alta rotación y bajo margen'], rightItems: ['Tarifa de renta fija del 35% sobre la utilidad (muy alta para negocios rentables)', 'Impuesto de Industria y Comercio (ICA) e IVA se declaran y pagan por separado', 'Exige contabilidad formal muy estricta y firmas de contador en declaraciones'] },
        { type: 'heading', value: 'La Regla de Oro del Margen de Ganancia' },
        { type: 'example', title: '¿Cuándo elegir el SIMPLE y cuándo el ORDINARIO?', content: 'Supongamos que vendes Ropa en Bogotá y facturas $50.000.000 COP al mes. Tarifa RST aplicable: ~2.8% sobre ingresos.\n\n• ESCENARIO A (Margen alto, importas directamente): Tu costo de producto es $15.000.000 COP. Utilidad: $35.000.000 COP.\n- En Ordinario (35% de utilidad): pagas $12.250.000 COP.\n- En RST (2.8% de ventas): pagas $1.400.000 COP. → ¡RST te ahorra más de $10 millones!\n\n• ESCENARIO B (Margen pequeño, eres distribuidor): Compras la ropa a $42.000.000 COP. Tu utilidad real es $8.000.000 COP.\n- En Ordinario (35% de utilidad): pagas $2.800.000 COP.\n- En RST (2.8% de ventas): pagas $1.400.000 COP. → Sigue siendo mejor RST.\n\n• ESCENARIO C (Pérdidas o margen crítico): Compras a $48.000.000 COP. Utilidad real: $2.000.000 COP.\n- En Ordinario (35% de utilidad): pagas $700.000 COP.\n- En RST (2.8% de ventas): pagas $1.400.000 COP. → El RST te quita el 70% de tus ganancias. Si das pérdidas, en RST pagas igual; en Ordinario pagas $0 COP.' }
      ] },
      { id: 'income-tax', title: 'Estrategias de Optimización Fiscal Legal', duration: '7 min', content: [
        { type: 'heading', value: 'Planificación Tributaria en Colombia' },
        { type: 'text', value: 'La elusión fiscal (usar vacíos y beneficios de la ley para pagar menos impuestos) es 100% legal. Los abogados y contadores de grandes empresas estructuran los negocios basándose en los incentivos que el mismo Estatuto Tributario colombiano ofrece.' },
        { type: 'heading', value: '5 Jugadas Legales para Pagar Menos Impuestos' },
        { type: 'list', items: ['👥 1. Deducción del 120% en Primer Empleo: Si contratas jóvenes menores de 28 años que sea su primer empleo formal, la DIAN te permite deducir el 120% de su salario. Si le pagas $2.000.000 COP, deduces $2.400.000 COP de tu renta.', '👩‍🦽 2. Deducción del 200% por Vulnerabilidad: Contratar mujeres víctimas de violencia comprobada o personas con discapacidad certificada otorga una deducción del 200% de sus salarios y prestaciones.', '🏦 3. Bancarización y Factura Electrónica: Todo pago en efectivo mayor a ciertos montos (la regla del rechazo de costos) es rechazado por la DIAN. Paga TODO por transferencia, tarjeta de débito o PSE y exige factura electrónica (adquirente) para deducir el 100%.', '🏗️ 4. Descuento del IVA en Activos Fijos Reales Productivos: Si compras maquinaria, servidores, computadores o vehículos para la operación de tu negocio, el 100% del IVA que pagues en esa compra lo puedes descontar directamente de tu impuesto de renta (no como gasto, sino como descuento directo peso a peso).', '🏢 5. Escudo Corporativo (S.A.S.): Como persona natural pagas impuestos con tarifas progresivas de hasta el 39%. Al crear una S.A.S., limitas tu responsabilidad, fijas la tasa de renta corporativa en 35% y puedes deducir gastos como telefonía, internet, vehículos de la empresa y viajes de negocios que a título personal te rechazarían.'] },
        { type: 'tip', value: 'Estrategia de flujo: Si estás en el Régimen Ordinario y tuviste un año muy rentable, puedes realizar compras anticipadas de inventario o pagar seguros anuales antes del 31 de diciembre para aumentar tus costos deducibles de ese período fiscal y bajar la utilidad contable legalmente.' },
        { type: 'warning', value: 'NUNCA uses facturas falsas o simuladas para inflar gastos. La DIAN cuenta con algoritmos de IA que cruzan facturación electrónica en tiempo real y esto constituye el delito de evasión fiscal, el cual tiene penas de cárcel en Colombia.' }
      ] }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 8: ANÁLISIS FINANCIERO
  // ═══════════════════════════════════════════
  {
    id: 'financial-analysis',
    title: 'Análisis Financiero',
    description: 'Domina los ratios e indicadores que usan los profesionales para diagnosticar un negocio',
    emoji: '🔍',
    color: '#0ea5e9',
    lessons: [
      { id: 'liquidity-ratios', title: 'Ratios de Liquidez', duration: '5 min', content: [
        { type: 'heading', value: '¿Puedes Pagar tus Deudas a Corto Plazo?' },
        { type: 'formula', label: 'Razón Corriente', formula: 'Activo Corriente ÷ Pasivo Corriente' },
        { type: 'text', value: 'Si el resultado es mayor a 1, puedes pagar tus deudas a corto plazo. Si es menor a 1, tienes un problema de liquidez. Lo ideal es entre 1.5 y 2.0.' },
        { type: 'formula', label: 'Prueba Ácida', formula: '(Activo Corriente - Inventarios) ÷ Pasivo Corriente' },
        { type: 'text', value: 'Es más estricta: quita los inventarios porque no siempre se venden rápido. Si es mayor a 1, puedes pagar tus deudas SIN depender de vender inventario.' },
        { type: 'example', title: 'Tu Negocio', content: 'Activo Corriente: $10.000.000 COP (Caja $3M + Inventario $5M + Por cobrar $2M)\nPasivo Corriente: $6.000.000 COP\nRazón Corriente: $10M ÷ $6M = 1.67 ✅ Saludable\nPrueba Ácida: ($10M - $5M) ÷ $6M = 0.83 ⚠️ Dependes del inventario' },
        { type: 'keypoint', value: 'Si tu prueba ácida es menor a 1 y tu razón corriente es mayor a 1, significa que tu liquidez depende de vender inventario. Esto es riesgoso si vendes productos de baja rotación.' }
      ] },
      { id: 'profitability-ratios', title: 'Ratios de Rentabilidad', duration: '5 min', content: [
        { type: 'heading', value: '¿Estás Generando Suficiente Ganancia?' },
        { type: 'table', headers: ['Ratio', 'Fórmula', 'Ejemplo', '¿Qué te dice?'], rows: [['Margen Bruto', '(Ventas-COGS)÷Ventas×100', '($20M-$8M)÷$20M = 60%', 'Eficiencia en producción'], ['Margen Operativo', 'Util.Op.÷Ventas×100', '$5M÷$20M = 25%', 'Eficiencia operacional'], ['Margen Neto', 'Util.Neta÷Ventas×100', '$2.925M÷$20M = 14.6%', 'Ganancia real por peso'], ['ROE', 'Util.Neta÷Patrimonio×100', '$2.925M÷$8M = 36.5%', 'Retorno para los dueños'], ['ROA', 'Util.Neta÷Activos×100', '$2.925M÷$16.3M = 17.9%', 'Eficiencia total']] },
        { type: 'heading', value: '¿Son Buenos tus Ratios?' },
        { type: 'list', items: ['Margen bruto > 40%: tu producto tiene buen margen', 'Margen neto > 10%: tu negocio es saludable', 'ROE > 15%: estás generando buen retorno para los dueños', 'ROA > 10%: usas tus activos eficientemente'] },
        { type: 'tip', value: 'Lo más importante NO es el número absoluto, sino la TENDENCIA. Un margen neto que baja de 15% a 10% en 3 meses es una señal de alerta.' }
      ] },
      { id: 'debt-ratios', title: 'Ratios de Endeudamiento', duration: '5 min', content: [
        { type: 'heading', value: '¿Cuánta Deuda es Demasiada?' },
        { type: 'formula', label: 'Endeudamiento Total', formula: 'Pasivo Total ÷ Activo Total × 100' },
        { type: 'text', value: 'Te dice qué porcentaje de tu empresa está financiado con deuda. Si es 50%, la mitad de tu empresa la financian terceros.' },
        { type: 'formula', label: 'Cobertura de Intereses', formula: 'Utilidad Operacional ÷ Gastos por Intereses' },
        { type: 'text', value: '¿Cuántas veces tu utilidad operacional cubre los intereses que pagas? Si es menor a 1.5, estás en zona de peligro.' },
        { type: 'heading', value: 'Niveles de Endeudamiento' },
        { type: 'table', headers: ['Nivel', 'Endeudamiento', 'Significado'], rows: [['🟢 Bajo', '< 40%', 'Conservador, poco riesgo'], ['🟡 Moderado', '40-60%', 'Normal para la mayoría'], ['🟠 Alto', '60-75%', 'Cuidado, poca flexibilidad'], ['🔴 Crítico', '> 75%', 'Riesgo alto, difícil acceder a crédito']] },
        { type: 'keypoint', value: 'Endeudarse no es malo si la deuda genera más de lo que cuesta. Pero siempre mantén tu endeudamiento por debajo del 60% y tu cobertura de intereses por encima de 2x.' }
      ] },
      { id: 'vertical-horizontal', title: 'Análisis Vertical y Horizontal', duration: '5 min', content: [
        { type: 'heading', value: 'Análisis Vertical: La Radiografía' },
        { type: 'text', value: 'Expresa cada línea del estado financiero como porcentaje del total. En el estado de resultados, todo se expresa como % de las ventas.' },
        { type: 'example', title: 'Análisis Vertical del Estado de Resultados', content: 'Ventas: $20.000.000 COP → 100%\nCosto de ventas: $8.000.000 COP → 40%\nUtilidad bruta: $12.000.000 COP → 60%\nGastos operacionales: $7.000.000 COP → 35%\nUtilidad operacional: $5.000.000 COP → 25%\nUtilidad neta: $2.925.000 COP → 14.6%\n\nLectura: De cada $100 COP que vendes, $40 se van en costo de producto, $35 en gastos, y te quedan $14.6 COP de ganancia.' },
        { type: 'heading', value: 'Análisis Horizontal: La Película' },
        { type: 'text', value: 'Compara los mismos datos entre dos períodos para ver cómo cambiaron.' },
        { type: 'table', headers: ['Concepto', 'Enero', 'Febrero', 'Variación', 'Señal'], rows: [['Ventas', '$15M COP', '$20M COP', '+33%', '🟢 Crecimiento'], ['Costo Ventas', '$5.5M COP', '$8M COP', '+45%', '🟠 Creció más que ventas'], ['Margen Bruto', '63%', '60%', '-3pp', '🟡 Revisa costos'], ['Gastos', '$5M COP', '$7M COP', '+40%', '🟠 Gastos descontrolados'], ['Utilidad Neta', '$2.5M COP', '$2.925M COP', '+17%', '🟢 Pero creció menos que ventas']] },
        { type: 'keypoint', value: 'Si tus costos crecen MÁS RÁPIDO que tus ventas, estás perdiendo eficiencia. Las ventas pueden subir y la utilidad bajar al mismo tiempo. Eso es una trampa peligrosa.' }
      ] }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 9: PRESUPUESTOS Y PROYECCIONES
  // ═══════════════════════════════════════════
  {
    id: 'budgets',
    title: 'Presupuestos y Proyecciones',
    description: 'Planifica tu futuro financiero con presupuestos sólidos y proyecciones realistas',
    emoji: '📐',
    color: '#a855f7',
    lessons: [
      { id: 'master-budget', title: 'Presupuesto Maestro', duration: '6 min', content: [
        { type: 'heading', value: 'El Mapa Financiero de tu Negocio' },
        { type: 'text', value: 'Un presupuesto es un plan financiero que estima tus ingresos y gastos futuros. No es una bola de cristal, es una brújula. Te dice hacia dónde vas y te alerta cuando te desvías.' },
        { type: 'heading', value: 'Los 4 Presupuestos Clave' },
        { type: 'list', items: ['1. PRESUPUESTO DE VENTAS: Cuánto esperas vender cada mes. Basado en histórico + crecimiento + estacionalidad.', '2. PRESUPUESTO DE COMPRAS: Cuánto inventario necesitas comprar para sostener las ventas proyectadas.', '3. PRESUPUESTO DE GASTOS: Todos los gastos operacionales: arriendo, nómina, servicios, marketing, etc.', '4. PRESUPUESTO DE EFECTIVO: Cuándo entra y sale el dinero real. El más importante para no quedarte sin caja.'] },
        { type: 'example', title: 'Presupuesto de Ventas Trimestral', content: 'Enero: $12.000.000 COP (mes normal)\nFebrero: $15.000.000 COP (San Valentín, +25%)\nMarzo: $10.000.000 COP (mes bajo, -17%)\nTotal Q1: $37.000.000 COP\n\nBasado en: ventas del año anterior + 10% de crecimiento + ajuste estacional' },
        { type: 'tip', value: 'Presupuesta de forma conservadora. Es mejor sorprenderte positivamente que quedarte sin dinero por ser optimista.' }
      ] },
      { id: 'projections', title: 'Proyecciones Financieras', duration: '5 min', content: [
        { type: 'heading', value: '3 Escenarios para Estar Preparado' },
        { type: 'text', value: 'Nunca hagas una sola proyección. Haz siempre tres escenarios para estar preparado ante cualquier situación:' },
        { type: 'table', headers: ['Escenario', 'Ventas', 'Costos', 'Utilidad', 'Probabilidad'], rows: [['🟢 Optimista', '$25.000.000 COP', '$15.000.000 COP', '$10.000.000 COP', '25%'], ['🟡 Realista', '$18.000.000 COP', '$13.000.000 COP', '$5.000.000 COP', '50%'], ['🔴 Pesimista', '$10.000.000 COP', '$11.000.000 COP', '-$1.000.000 COP', '25%']] },
        { type: 'heading', value: 'Supuestos Clave' },
        { type: 'list', items: ['Tasa de crecimiento mensual esperada', 'Porcentaje de clientes que repiten compra', 'Inflación esperada para ajustar costos', 'Estacionalidad (meses fuertes y débiles)', 'Nuevos productos o canales de venta'] },
        { type: 'keypoint', value: 'La proyección más valiosa es la PESIMISTA. Si puedes sobrevivir en el peor escenario, tu negocio es resiliente.' }
      ] },
      { id: 'budget-control', title: 'Control Presupuestario', duration: '4 min', content: [
        { type: 'heading', value: 'Presupuesto vs Realidad' },
        { type: 'text', value: 'El presupuesto no sirve de nada si no lo comparas con los resultados reales cada mes.' },
        { type: 'table', headers: ['Concepto', 'Presupuesto', 'Real', 'Variación', 'Acción'], rows: [['Ventas', '$18.000.000 COP', '$16.500.000 COP', '-8.3%', 'Investigar caída'], ['Costo de ventas', '$7.200.000 COP', '$7.500.000 COP', '+4.2%', 'Negociar con proveedores'], ['Marketing', '$1.000.000 COP', '$1.800.000 COP', '+80%', '⚠️ Gasto descontrolado'], ['Arriendo', '$2.000.000 COP', '$2.000.000 COP', '0%', '✅ En línea'], ['Utilidad', '$4.800.000 COP', '$2.200.000 COP', '-54%', '🚨 Plan de acción urgente']] },
        { type: 'heading', value: 'Acciones Correctivas' },
        { type: 'list', items: ['Variación < 5%: Normal, no requiere acción', 'Variación 5-15%: Investigar causa y ajustar próximo mes', 'Variación > 15%: Acción correctiva inmediata', 'Variación positiva: Analizar si es sostenible o fue puntual'] },
        { type: 'tip', value: 'Haz esta revisión los primeros 5 días de cada mes. 30 minutos que pueden salvar tu negocio.' }
      ] }
    ]
  },
  // ═══════════════════════════════════════════
  // MODULE 10: MENTALIDAD FINANCIERA
  // ═══════════════════════════════════════════
  {
    id: 'mindset',
    title: 'Mentalidad Financiera del Empresario',
    description: 'Los hábitos, errores y estrategias que separan a los empresarios exitosos de los que fracasan',
    emoji: '🧠',
    color: '#f97316',
    lessons: [
      { id: 'financial-habits', title: 'Los 7 Hábitos Financieros del Empresario Exitoso', duration: '5 min', content: [
        { type: 'heading', value: 'Hábitos que Transforman Resultados' },
        { type: 'list', items: ['1️⃣ SEPARA BOLSILLOS: Ten una cuenta bancaria exclusiva para el negocio. NUNCA mezcles dinero personal y del negocio.', '2️⃣ PÁGATE UN SUELDO: Define un sueldo fijo para ti mismo. No tomes dinero del negocio "según necesites".', '3️⃣ PAGA IMPUESTOS A TIEMPO: Las multas y los intereses moratorios son dinero tirado a la basura.', '4️⃣ REINVIERTE ANTES DE GASTAR: Al menos el 30% de las utilidades deben reinvertirse en el negocio.', '5️⃣ MIDE TODO: Lo que no se mide, no se mejora. Revisa tus números mínimo una vez al mes.', '6️⃣ FONDO DE RESERVA EMPRESARIAL: Guarda 3-6 meses de gastos fijos del negocio para emergencies.', '7️⃣ EDÚCATE SIEMPRE: Dedica 1 hora a la semana a aprender sobre finanzas y negocios.'] },
        { type: 'keypoint', value: 'El hábito #1 (separar bolsillos) es el más importante y el que más emprendedores rompen. Si mezclas dinero personal y del negocio, NUNCA sabrás si tu negocio es rentable o si te estás engañando.' }
      ] },
      { id: 'fatal-errors', title: '10 Errores Fatales en Finanzas', duration: '5 min', content: [
        { type: 'heading', value: 'Errores que Quiebran Negocios' },
        { type: 'list', items: ['❌ 1. Mezclar dinero personal con el del negocio', '❌ 2. No conocer tus costos reales → vendes a pérdida sin saberlo', '❌ 3. Crecer sin capital de trabajo → vendes más pero no tienes para pagar', '❌ 4. Confundir ventas con ganancias → vender $20M COP no significa ganar $20M COP', '❌ 5. Ignorar el flujo de caja → eres rentable pero no tienes efectivo', '❌ 6. No llevar registros → cuando necesitas un crédito, no tienes historial', '❌ 7. Endeudarte para gastos personales con dinero del negocio', '❌ 8. No presupuestar → gastas sin plan y al final no sabes en qué se fue el dinero', '❌ 9. Dar descuentos sin calcular el impacto → un descuento del 20% puede eliminar toda tu utilidad', '❌ 10. No tener seguro ni fondo de emergencia'] },
        { type: 'highlight', value: 'Confundir VENTAS con GANANCIAS. Vender $50.000.000 COP al mes suena impresionante, pero si tus costos y gastos son $48.000.000 COP, solo ganas $2.000.000 COP. Un negocio que vende la mitad pero con mejor margen puede ser más exitoso.' },
        { type: 'warning', value: 'El 62% de los negocios que fracasan en Latinoamérica lo hacen por problemas financieros: falta de flujo de caja, sobreendeudamiento o no conocer sus costos reales.' }
      ] },
      { id: '12-month-plan', title: 'Tu Plan Financiero a 12 Meses', duration: '6 min', content: [
        { type: 'heading', value: 'Paso a Paso: Construye tu Plan' },
        { type: 'list', items: ['MES 1-2: Diagnóstico → Calcula tu patrimonio, punto de equilibrio, margen neto y flujo de caja actual', 'MES 3: Presupuesto → Crea tu presupuesto mensual de ventas, costos y gastos para los próximos 12 meses', 'MES 4-6: Optimización → Identifica y recorta los 3 gastos más grandes que no generen valor. Negocia con proveedores.', 'MES 7-9: Crecimiento → Reinvierte utilidades en marketing, nuevos productos o canales. Mide ROI de cada inversión.', 'MES 10-12: Consolidación → Construye fondo de reserva (3 meses de gastos fijos). Evalúa si necesitas financiamiento para escalar.'] },
        { type: 'heading', value: 'Metas Financieras Concretas' },
        { type: 'table', headers: ['Meta', 'Indicador', 'Plazo'], rows: [['Conocer mi punto de equilibrio', 'PE calculado y documentado', 'Semana 1'], ['Margen neto positivo', 'Utilidad Neta > 0', 'Mes 3'], ['Flujo de caja operativo positivo', 'Entradas > Salidas operativas', 'Mes 4'], ['Fondo de emergencia: 1 mes', 'Reserva = 1x gastos fijos', 'Mes 6'], ['Reducir ciclo de cobro', 'Días de cartera < 30', 'Mes 8'], ['Fondo de emergencia: 3 meses', 'Reserva = 3x gastos fijos', 'Mes 12']] },
        { type: 'heading', value: 'La Regla del 1%' },
        { type: 'highlight', value: 'No necesitas mejorar todo de golpe. Mejora 1% cada semana en un área diferente: precio, costos, cobro, gasto. Al final del año, habrás mejorado más del 50%. El progreso compuesto es tan poderoso en los negocios como en las inversiones.' },
        { type: 'tip', value: 'Imprime esta tabla de metas y pégala donde la veas todos los días. La rendición de cuentas contigo mismo es la herramienta más poderosa que tienes.' }
      ] }
    ]
  }
];
