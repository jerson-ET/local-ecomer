"""
Semilla de conocimiento humano para XuperBrain.
Información real que cualquier adulto hispanohablante maneja.
Fuentes: conocimiento general, RAE, ciencia básica, cultura general.
"""

# Formato: (concepto_clave, definición/explicación)
CONOCIMIENTO_HUMANO = [
    # ═══ LENGUAJE Y COMUNICACIÓN ═══
    ("el español", "es una lengua romance derivada del latín vulgar, hablada por más de 500 millones de personas en el mundo. Es el idioma oficial de 20 países. La Real Academia Española (RAE) se encarga de regular y normalizar su uso desde 1713"),
    ("el inglés", "es una lengua germánica occidental originada en Inglaterra. Es el idioma más hablado del mundo si se cuentan hablantes nativos y no nativos. Es el idioma principal de la ciencia, la tecnología y los negocios internacionales"),
    ("una palabra", "es la unidad mínima de significado que se puede pronunciar de forma aislada. Las palabras se clasifican en sustantivos, verbos, adjetivos, adverbios, preposiciones, conjunciones, pronombres y artículos"),
    ("un verbo", "es una palabra que expresa acción, estado o proceso. En español se conjugan según persona, número, tiempo y modo. Los tiempos verbales principales son presente, pasado y futuro"),
    ("un sustantivo", "es una palabra que designa seres, objetos, ideas o conceptos. Pueden ser propios (nombres de personas, ciudades) o comunes (mesa, perro, agua)"),
    ("un adjetivo", "es una palabra que califica o determina al sustantivo, expresando cualidades o características. Por ejemplo: grande, bonito, rápido, inteligente"),
    ("la gramática", "es el conjunto de reglas que rigen la estructura de un idioma. Incluye la morfología (forma de las palabras), la sintaxis (orden de las palabras) y la ortografía (escritura correcta)"),
    ("la ortografía", "es el conjunto de normas que regulan la escritura correcta de un idioma. En español, las tildes indican la sílaba acentuada y hay reglas específicas para el uso de b/v, c/s/z, g/j, h, entre otras"),

    # ═══ ANIMALES ═══
    ("un perro", "es un mamífero doméstico de la familia Canidae, considerado el mejor amigo del hombre. Ha sido domesticado hace más de 15,000 años. Existen más de 300 razas reconocidas, desde el Chihuahua hasta el Gran Danés"),
    ("un gato", "es un mamífero doméstico de la familia Felidae. Son animales independientes, ágiles y excelentes cazadores. Duermen entre 12 y 16 horas al día y tienen una visión nocturna excepcional"),
    ("un caballo", "es un mamífero herbívoro de gran tamaño que ha sido domesticado por el ser humano desde hace unos 5,000 años. Se usa para transporte, deporte, trabajo agrícola y compañía"),
    ("un pez", "es un animal acuático vertebrado que respira a través de branquias y tiene el cuerpo cubierto de escamas. Viven en agua dulce y salada. Existen más de 30,000 especies conocidas"),
    ("una vaca", "es un mamífero rumiante doméstico de la familia Bovidae. Es fundamental para la producción de leche, carne y cuero. Una vaca produce en promedio entre 20 y 30 litros de leche al día"),
    ("un león", "es un gran felino carnívoro conocido como el rey de la selva. Vive en manadas en las sabanas de África y un pequeño grupo en la India. Los machos se distinguen por su melena"),
    ("un elefante", "es el animal terrestre más grande del planeta. Puede pesar hasta 6 toneladas. Son muy inteligentes, tienen excelente memoria y viven en grupos familiares liderados por una hembra"),
    ("una ballena", "es el animal más grande que ha existido en la Tierra. La ballena azul puede medir hasta 30 metros y pesar 180 toneladas. Son mamíferos marinos que respiran aire"),
    ("una hormiga", "es un insecto social que vive en colonias organizadas con reinas, obreras y soldados. Pueden cargar objetos hasta 50 veces su propio peso"),
    ("una mariposa", "es un insecto volador que pasa por una metamorfosis completa: huevo, oruga, crisálida y adulto. Sus alas están cubiertas de escamas de colores"),

    # ═══ CUERPO HUMANO Y SALUD ═══
    ("el corazón", "es el órgano muscular que bombea la sangre a todo el cuerpo. Late aproximadamente 100,000 veces al día y bombea unos 7,500 litros de sangre diariamente. Tiene cuatro cavidades: dos aurículas y dos ventrículos"),
    ("el cerebro", "es el órgano más complejo del cuerpo humano. Controla el pensamiento, la memoria, las emociones, el movimiento y todas las funciones del cuerpo. Pesa aproximadamente 1.4 kg y contiene unos 86,000 millones de neuronas"),
    ("los pulmones", "son los órganos encargados de la respiración. Toman oxígeno del aire y eliminan dióxido de carbono. Un adulto respira entre 15 y 20 veces por minuto en reposo"),
    ("el estómago", "es el órgano del sistema digestivo donde los alimentos se descomponen mediante ácidos y enzimas. Puede contener hasta 1.5 litros de alimento. La digestión estomacal dura entre 2 y 5 horas"),
    ("la sangre", "es el líquido que circula por el cuerpo transportando oxígeno, nutrientes, hormonas y eliminando desechos. Un adulto tiene entre 4.5 y 5.5 litros. Está compuesta por glóbulos rojos, blancos, plaquetas y plasma"),
    ("un hueso", "es una estructura rígida que forma el esqueleto. El cuerpo humano adulto tiene 206 huesos. Protegen los órganos internos, permiten el movimiento y producen células sanguíneas en la médula ósea"),
    ("la fiebre", "es un aumento de la temperatura corporal por encima de 37.5°C. Es una respuesta del sistema inmunológico ante infecciones. Indica que el cuerpo está combatiendo alguna enfermedad"),
    ("una vacuna", "es una preparación biológica que estimula el sistema inmunológico para proteger contra enfermedades. Contienen formas debilitadas o inactivadas de microorganismos. Han salvado millones de vidas en la historia"),

    # ═══ NATURALEZA Y CIENCIA ═══
    ("el agua", "es una sustancia compuesta por dos átomos de hidrógeno y uno de oxígeno (H₂O). Es esencial para la vida. Cubre el 71% de la superficie terrestre. Puede existir en tres estados: líquido, sólido (hielo) y gaseoso (vapor)"),
    ("el sol", "es la estrella más cercana a la Tierra. Es una enorme esfera de gas caliente compuesta principalmente de hidrógeno y helio. Su temperatura superficial es de unos 5,500°C. Sin el Sol no habría vida en la Tierra"),
    ("la luna", "es el único satélite natural de la Tierra. Tarda 27 días en completar una órbita. No tiene luz propia, refleja la luz del Sol. Influye en las mareas de los océanos. El ser humano pisó la Luna por primera vez en 1969"),
    ("la tierra", "es el tercer planeta del sistema solar y el único conocido con vida. Tiene una edad de aproximadamente 4,500 millones de años. Su diámetro es de 12,742 km y está cubierta por un 71% de agua"),
    ("la gravedad", "es la fuerza que atrae a los objetos entre sí. Es lo que nos mantiene en el suelo y hace que los objetos caigan. Fue descrita por Isaac Newton cuando observó una manzana caer de un árbol"),
    ("un átomo", "es la unidad básica de la materia. Está compuesto por protones, neutrones y electrones. Todo lo que existe está hecho de átomos. Son tan pequeños que millones de ellos caben en la punta de un alfiler"),
    ("la fotosíntesis", "es el proceso mediante el cual las plantas convierten la luz solar, el agua y el dióxido de carbono en oxígeno y glucosa. Es fundamental para la vida en la Tierra porque produce el oxígeno que respiramos"),
    ("el oxígeno", "es un elemento químico esencial para la respiración de la mayoría de los seres vivos. Constituye el 21% de la atmósfera terrestre. Fue descubierto en 1774"),
    ("un volcán", "es una abertura en la corteza terrestre por donde salen lava, gases y cenizas del interior de la Tierra. Pueden ser activos, dormidos o extintos. El más activo del mundo es el Kilauea en Hawái"),
    ("un terremoto", "es un movimiento brusco de la corteza terrestre causado por la liberación de energía acumulada en las placas tectónicas. Se miden con la escala de Richter. Pueden causar tsunamis si ocurren bajo el mar"),
    ("el ADN", "es la molécula que contiene las instrucciones genéticas de todos los seres vivos. Tiene forma de doble hélice. Determina las características físicas heredadas de los padres"),

    # ═══ GEOGRAFÍA ═══
    ("Colombia", "es un país ubicado en el noroeste de América del Sur. Su capital es Bogotá. Tiene costas en el Océano Pacífico y el Mar Caribe. Es famosa por su café, su biodiversidad, la cumbia, el vallenato y la calidez de su gente. Tiene más de 50 millones de habitantes"),
    ("Bogotá", "es la capital de Colombia. Está ubicada a 2,640 metros sobre el nivel del mar en la cordillera de los Andes. Es la ciudad más grande del país con más de 7 millones de habitantes"),
    ("Medellín", "es la segunda ciudad más grande de Colombia, conocida como la Ciudad de la Eterna Primavera por su clima agradable. Es la capital del departamento de Antioquia y un importante centro industrial y tecnológico"),
    ("Estados Unidos", "es un país de América del Norte compuesto por 50 estados. Su capital es Washington D.C. Es la economía más grande del mundo y una potencia militar, tecnológica y cultural global"),
    ("México", "es un país de América del Norte. Su capital es Ciudad de México. Es famoso por su rica cultura, su gastronomía (tacos, mole, tamales), sus pirámides aztecas y mayas, y tiene más de 126 millones de habitantes"),
    ("España", "es un país europeo ubicado en la Península Ibérica. Su capital es Madrid. Es la cuna del idioma español. Famosa por su cultura, la paella, el flamenco, los toros y el fútbol"),
    ("el océano", "es una gran extensión de agua salada que cubre la mayor parte de la superficie terrestre. Hay cinco océanos: Pacífico, Atlántico, Índico, Ártico y Antártico. El Pacífico es el más grande"),
    ("una montaña", "es una elevación natural del terreno que supera los 700 metros de altura. La montaña más alta del mundo es el Monte Everest con 8,849 metros, ubicada en el Himalaya entre Nepal y China"),

    # ═══ HISTORIA ═══
    ("Cristóbal Colón", "fue un navegante genovés que en 1492 llegó a América mientras buscaba una ruta marítima hacia las Indias. Su viaje fue financiado por los Reyes Católicos de España. Realizó cuatro viajes al continente americano"),
    ("Simón Bolívar", "fue un líder político y militar venezolano que liberó a varios países sudamericanos del dominio español. Es conocido como El Libertador. Liberó a Venezuela, Colombia, Ecuador, Perú y Bolivia"),
    ("la Segunda Guerra Mundial", "fue el conflicto armado más devastador de la historia, ocurrido entre 1939 y 1945. Participaron la mayoría de las naciones del mundo. Murieron entre 70 y 85 millones de personas"),
    ("la revolución industrial", "fue un período de transformación económica y social que comenzó en Inglaterra a finales del siglo XVIII. Se caracterizó por el paso de la producción manual a la mecanizada con máquinas de vapor"),
    ("los dinosaurios", "fueron reptiles que dominaron la Tierra durante más de 160 millones de años. Se extinguieron hace 66 millones de años probablemente por el impacto de un asteroide. Algunas especies evolucionaron en las aves actuales"),

    # ═══ MATEMÁTICAS CONCEPTUALES ═══
    ("la suma", "es una operación aritmética que consiste en combinar dos o más cantidades para obtener un total. Se representa con el signo +. Por ejemplo: 3 + 5 = 8. Es la operación más básica de las matemáticas"),
    ("la resta", "es una operación aritmética que consiste en quitar una cantidad de otra. Se representa con el signo −. Por ejemplo: 10 − 4 = 6. Es la operación inversa de la suma"),
    ("la multiplicación", "es una operación aritmética que consiste en sumar un número consigo mismo cierta cantidad de veces. Se representa con ×. Por ejemplo: 4 × 3 = 12, que es lo mismo que 4 + 4 + 4"),
    ("la división", "es una operación aritmética que consiste en repartir una cantidad en partes iguales. Se representa con ÷. Por ejemplo: 12 ÷ 4 = 3. Es la operación inversa de la multiplicación. No se puede dividir entre cero"),
    ("un porcentaje", "es una forma de expresar una proporción como una fracción de 100. El símbolo es %. Por ejemplo, 50% significa la mitad. Se calcula multiplicando el número por el porcentaje y dividiendo entre 100"),
    ("una fracción", "es una expresión que representa la división de un número entero en partes iguales. Tiene numerador (arriba) y denominador (abajo). Por ejemplo, 3/4 significa tres de cuatro partes iguales"),

    # ═══ TECNOLOGÍA ═══
    ("una computadora", "es una máquina electrónica que procesa datos siguiendo instrucciones programadas. Tiene procesador (CPU), memoria RAM, almacenamiento y dispositivos de entrada/salida. Puede realizar millones de operaciones por segundo"),
    ("internet", "es una red global de computadoras interconectadas que permite compartir información en todo el mundo. Fue creada originalmente como un proyecto militar (ARPANET) en 1969 y se popularizó en los años 90"),
    ("la inteligencia artificial", "es una rama de la informática que busca crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana, como aprender, razonar, resolver problemas y entender lenguaje natural"),
    ("un programa", "es un conjunto de instrucciones escritas en un lenguaje de programación que le dicen a una computadora qué hacer. Los programas pueden ser aplicaciones de escritorio, páginas web, juegos o sistemas operativos"),
    ("python", "es un lenguaje de programación de alto nivel creado por Guido van Rossum en 1991. Es conocido por su sintaxis simple y legible. Se usa mucho en inteligencia artificial, ciencia de datos, desarrollo web y automatización"),
    ("un celular", "es un dispositivo electrónico portátil que permite hacer llamadas, enviar mensajes, navegar por internet, tomar fotos y usar aplicaciones. Los smartphones modernos son básicamente computadoras de bolsillo"),
    ("una base de datos", "es un sistema organizado para almacenar, gestionar y recuperar información de manera eficiente. Pueden ser relacionales (como SQL) o no relacionales (como MongoDB). Son fundamentales para cualquier aplicación moderna"),

    # ═══ COMIDA Y COCINA ═══
    ("el arroz", "es un cereal que constituye el alimento básico de más de la mitad de la población mundial. Se cultiva en campos inundados llamados arrozales. Es rico en carbohidratos y se prepara de muchas formas"),
    ("el pan", "es un alimento básico hecho con harina, agua, sal y levadura. Se hornea y es consumido en todo el mundo desde hace miles de años. Existen cientos de variedades: baguette, arepa, tortilla, naan"),
    ("el café", "es una bebida preparada con los granos tostados del cafeto. Colombia es uno de los mayores productores del mundo. Contiene cafeína, un estimulante natural. Se puede preparar en espresso, americano, latte y muchas otras formas"),
    ("el chocolate", "es un alimento derivado del cacao, originario de América. Los aztecas lo consumían como bebida amarga. Se consume en tabletas, bebidas, postres y dulces. El chocolate oscuro tiene beneficios para la salud"),

    # ═══ CULTURA Y SOCIEDAD ═══
    ("la familia", "es el grupo de personas unidas por lazos de parentesco, ya sea por sangre, matrimonio o adopción. Es considerada la base de la sociedad. Incluye padres, hijos, abuelos, tíos y primos"),
    ("la educación", "es el proceso de facilitar el aprendizaje y la adquisición de conocimientos, habilidades y valores. Puede ser formal (escuelas), no formal (cursos) o informal (experiencia diaria). Es un derecho humano fundamental"),
    ("la democracia", "es un sistema de gobierno en el que el poder reside en el pueblo, que lo ejerce directamente o a través de representantes elegidos por votación. Surgió en la antigua Grecia"),
    ("el dinero", "es un medio de intercambio aceptado por una sociedad para facilitar el comercio. Puede ser físico (billetes y monedas) o digital. Cada país tiene su propia moneda: el peso colombiano, el dólar, el euro"),
    ("un trabajo", "es una actividad productiva que una persona realiza a cambio de una remuneración. Es necesario para la subsistencia y el desarrollo personal. Puede ser formal o informal, presencial o remoto"),
    ("la salud", "es el estado de completo bienestar físico, mental y social, no solamente la ausencia de enfermedades. Para mantener buena salud se necesita alimentación balanceada, ejercicio, descanso y atención médica"),
    ("el respeto", "es un valor fundamental que consiste en reconocer y valorar la dignidad, los derechos y las diferencias de los demás. Es la base de toda convivencia pacífica en sociedad"),
    ("la amistad", "es una relación afectiva entre dos o más personas basada en la confianza, el cariño, el respeto mutuo y el apoyo. Los amigos verdaderos se acompañan en los buenos y malos momentos"),
    ("el amor", "es un sentimiento profundo de afecto, cariño y apego hacia otra persona, animal o cosa. Puede manifestarse como amor romántico, amor familiar, amor fraternal o amor propio. Es considerado uno de los sentimientos más poderosos del ser humano"),
    ("la muerte", "es el cese irreversible de todas las funciones biológicas de un ser vivo. Es un proceso natural e inevitable. Todas las culturas tienen creencias y rituales diferentes relacionados con la muerte"),

    # ═══ TIEMPO Y CALENDARIO ═══
    ("un año", "es el período de tiempo que tarda la Tierra en dar una vuelta completa alrededor del Sol: aproximadamente 365 días y 6 horas. Tiene 12 meses. Cada 4 años hay un año bisiesto con 366 días"),
    ("un mes", "es una de las 12 divisiones del año. Los meses son: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre y diciembre. Tienen entre 28 y 31 días"),
    ("una semana", "es un período de 7 días: lunes, martes, miércoles, jueves, viernes, sábado y domingo. El concepto viene de las fases de la luna y la tradición bíblica"),
    ("un día", "es el período de 24 horas que tarda la Tierra en completar una rotación sobre su propio eje. Se divide en día (cuando hay luz solar) y noche (cuando no la hay)"),

    # ═══ EMOCIONES ═══
    ("la felicidad", "es un estado emocional de bienestar, satisfacción y alegría. No es un estado permanente sino momentos que se experimentan. Se relaciona con las relaciones personales, la salud, el propósito de vida y la gratitud"),
    ("la tristeza", "es una emoción natural que se siente ante una pérdida, una decepción o una situación dolorosa. Es normal sentirla y es importante expresarla. Si persiste mucho tiempo puede ser señal de depresión"),
    ("el miedo", "es una emoción básica de supervivencia que nos alerta ante un peligro real o percibido. Activa la respuesta de lucha o huida. Es normal, pero cuando es excesivo e irracional se llama fobia"),
    ("la ira", "es una emoción intensa que surge ante la frustración, la injusticia o la amenaza. Es natural sentirla pero es importante manejarla de forma saludable sin dañar a otros"),

    # ═══ FRASES Y MODISMOS ═══
    ("buenos días", "es un saludo que se usa por la mañana, generalmente desde que amanece hasta el mediodía. Es una expresión de cortesía y respeto"),
    ("buenas tardes", "es un saludo que se usa desde el mediodía hasta el atardecer. Es una expresión formal de cortesía"),
    ("buenas noches", "es un saludo o despedida que se usa desde el atardecer en adelante. Puede ser tanto un saludo como una despedida antes de dormir"),
    ("por favor", "es una expresión de cortesía que se usa al hacer una solicitud o pedido. Muestra educación y respeto hacia la otra persona"),
    ("gracias", "es una expresión de agradecimiento y gratitud. Es una de las palabras más importantes en cualquier idioma. Decir gracias fortalece las relaciones sociales"),
    ("lo siento", "es una expresión que se usa para disculparse o mostrar empatía por una situación difícil de otra persona. Implica reconocer un error o compartir el pesar de alguien"),
]

# Conocimiento sobre sí misma (la IA)
AUTOCONOCIMIENTO = [
    ("xuperbrain", "soy una Inteligencia Artificial construida desde cero por Jerson, un programador colombiano. Mi cerebro está hecho con un modelo Transformer, un tokenizador BPE, un motor de conocimiento RAG y memoria persistente. No uso APIs externas como OpenAI o Claude. Todo corre localmente en la computadora de Jerson"),
    ("mi creador", "mi creador se llama Jerson. Es un programador colombiano que construye soluciones SaaS como FarmaStock y LocalEcomer. Me creó desde cero usando Python, PyTorch y matemáticas puras"),
    ("como funciono", "funciono combinando varios motores: un Motor Matemático para cálculos precisos, un Motor de Conversación para entender el lenguaje natural, una Memoria Persistente que guarda todo lo que me enseñan, y un modelo Transformer para generar texto. Todo corre localmente sin internet"),
]
