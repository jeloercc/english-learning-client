// src/data/es/grammar.ts
//
// Neutral / Latin American Spanish. No "vosotros" forms — informal plural
// "you" uses "ustedes" throughout, matching the confirmed variant choice.

import type { CEFRLevel, GrammarRule } from "@/data/types";
export type { CEFRLevel, GrammarRule };

export const GRAMMAR: Record<CEFRLevel, GrammarRule[]> = {
  A1: [
    {
      title: "Ser vs. Estar",
      explanation: "Spanish has two verbs for 'to be'. Use 'ser' for identity, origin, and permanent characteristics; use 'estar' for location, temporary states, and feelings.",
      structure: "Sujeto + soy/eres/es/somos/son (ser) · Sujeto + estoy/estás/está/estamos/están (estar)",
      examples: [
        "Soy estudiante. (identity — ser)",
        "Estoy cansado. (temporary state — estar)",
        "Ella es de México. (origin — ser)",
        "El café está frío. (temporary condition — estar)",
      ],
      notes: "This is the hardest concept for English speakers — English only has one verb 'to be'. When in doubt: unchanging fact → ser; changing state or location → estar.",
    },
    {
      title: "Presente de Indicativo — Regular Verbs",
      explanation: "Describes habits, routines, and general facts, similar to the English present simple. Regular verbs conjugate by dropping -ar/-er/-ir and adding an ending.",
      structure: "-ar: -o, -as, -a, -amos, -an · -er: -o, -es, -e, -emos, -en · -ir: -o, -es, -e, -imos, -en",
      examples: [
        "Yo hablo español. (hablar)",
        "Ella come a las dos. (comer)",
        "Nosotros vivimos en Lima. (vivir)",
        "Ellos trabajan los sábados. (trabajar)",
      ],
      notes: "No 'do/does' needed for questions — just raise your voice or add '¿verdad?': '¿Hablas inglés?'",
    },
    {
      title: "Artículos: el / la / los / las, un / una",
      explanation: "Articles must agree in gender (masculine/feminine) and number (singular/plural) with the noun they accompany.",
      structure: "el/un (masc. sg.) · la/una (fem. sg.) · los/unos (masc. pl.) · las/unas (fem. pl.)",
      examples: [
        "El libro está en la mesa.",
        "Una casa grande.",
        "Los estudiantes hablan español.",
        "Las manzanas son rojas.",
      ],
      notes: "Feminine nouns starting with stressed 'a-' (agua, área) still use 'el' in the singular for pronunciation: 'el agua fría', but 'las aguas'.",
    },
    {
      title: "Pronombres Personales",
      explanation: "Subject pronouns are often omitted in Spanish because the verb ending already shows who is acting — they're used mainly for emphasis or clarity.",
      structure: "yo / tú / usted / él / ella / nosotros / ustedes / ellos / ellas",
      examples: [
        "Yo vivo en Bogotá.",
        "¿Tú hablas español?",
        "Usted es muy amable. (formal 'you')",
        "Ustedes son mis amigos. (plural 'you' — neutral/Latin American)",
      ],
      notes: "This course uses Latin American Spanish: 'ustedes' covers plural 'you' in every register. 'Vosotros' (informal plural 'you', used only in Spain) is intentionally not taught here.",
    },
    {
      title: "Género y Número de los Sustantivos",
      explanation: "Every Spanish noun is either masculine or feminine, and this affects the articles and adjectives used with it. Most nouns ending in -o are masculine and -a are feminine, but there are common exceptions.",
      structure: "-o → masculino (el libro) · -a → femenino (la casa) · exceptions: el día, el mapa, el idioma, la mano",
      examples: [
        "el libro → los libros",
        "la casa → las casas",
        "el día (masculine, despite -a)",
        "la mano (feminine, despite -o)",
      ],
    },
    {
      title: "Concordancia de Adjetivos",
      explanation: "Adjectives must match the gender and number of the noun they describe, and usually come after the noun.",
      structure: "noun + adjective (agreeing in gender/number)",
      examples: [
        "un perro pequeño",
        "una casa pequeña",
        "unos libros interesantes",
        "unas flores bonitas",
      ],
    },
    {
      title: "Demostrativos: este / ese / aquel",
      explanation: "Demonstratives point to something near the speaker, near the listener, or far from both.",
      structure: "este/esta (this, near me) · ese/esa (that, near you) · aquel/aquella (that, far from both)",
      examples: [
        "Este libro es mío.",
        "Esa silla es cómoda.",
        "Aquella montaña es muy alta.",
        "Estas flores son para ti.",
      ],
    },
    {
      title: "Posesivos",
      explanation: "Possessive adjectives show ownership and agree in number with the thing owned (not the owner).",
      structure: "mi(s) / tu(s) / su(s) / nuestro(a,os,as) / su(s)",
      examples: [
        "Mi hermano vive en Chile.",
        "Nuestra casa es grande.",
        "Sus libros están en la mesa.",
        "Tu nombre es bonito.",
      ],
      notes: "'Su/sus' can mean his, her, its, your (formal), or their — context clarifies which.",
    },
    {
      title: "El Verbo Gustar",
      explanation: "'Gustar' works backwards from English 'like' — the thing liked is the grammatical subject, and the person is an indirect object.",
      structure: "me/te/le/nos/les + gusta (singular) / gustan (plural) + noun",
      examples: [
        "Me gusta el café.",
        "¿Te gustan las manzanas?",
        "Le gusta bailar.",
        "Nos gusta viajar.",
      ],
      notes: "Literally: 'coffee is pleasing to me'. This same pattern is used for encantar, molestar, and interesar.",
    },
    {
      title: "Interrogativos",
      explanation: "Question words always carry a written accent and go at the start of the question.",
      structure: "¿qué? ¿quién? ¿cómo? ¿dónde? ¿cuándo? ¿por qué?",
      examples: [
        "¿Qué hora es?",
        "¿Quién es esa persona?",
        "¿Dónde vives?",
        "¿Por qué estudias español?",
      ],
    },
    {
      title: "Hay (Haber Impersonal)",
      explanation: "'Hay' means 'there is/there are' and never changes form, regardless of singular or plural.",
      structure: "hay + noun (singular or plural)",
      examples: [
        "Hay un gato en el jardín.",
        "Hay tres sillas en la cocina.",
        "¿Hay un banco cerca de aquí?",
        "No hay leche en la casa.",
      ],
      notes: "Never say 'hay son' or conjugate 'hay' for plural — it's always 'hay'.",
    },
    {
      title: "Números Cardinales y la Hora",
      explanation: "Cardinal numbers 1–100 are used for counting and telling time with 'ser'.",
      structure: "Son las + [number] (plural hours) · Es la una (singular exception)",
      examples: [
        "Son las tres de la tarde.",
        "Es la una en punto.",
        "Tengo veinte años.",
        "Hay cien páginas en el libro.",
      ],
    },
  ],

  A2: [
    {
      title: "Pretérito Indefinido (Simple Past)",
      explanation: "Describes completed actions at a specific point in the past, seen as finished events.",
      structure: "-ar: -é, -aste, -ó, -amos, -aron · -er/-ir: -í, -iste, -ió, -imos, -ieron",
      examples: [
        "Visité Perú el año pasado.",
        "Ella compró un teléfono nuevo.",
        "Comimos en un restaurante italiano.",
        "¿Llegaste a tiempo?",
      ],
      notes: "Many common verbs are irregular in this tense: ir/ser → fui, hacer → hice, tener → tuve.",
    },
    {
      title: "Pretérito Imperfecto",
      explanation: "Describes ongoing or habitual actions in the past, or sets the scene — used for background, not completed events.",
      structure: "-ar: -aba, -abas, -aba, -ábamos, -aban · -er/-ir: -ía, -ías, -ía, -íamos, -ían",
      examples: [
        "Cuando era niño, vivía en Lima.",
        "Ella siempre llegaba temprano.",
        "Hacía calor esa tarde.",
        "Nosotros jugábamos en el parque todos los días.",
      ],
    },
    {
      title: "Pretérito Indefinido vs. Imperfecto",
      explanation: "The two main past tenses contrast completed events (indefinido) with ongoing background or habits (imperfecto) — often used together in the same sentence.",
      structure: "imperfecto (background) + indefinido (interrupting event)",
      examples: [
        "Yo dormía cuando sonó el teléfono.",
        "Llovía mientras caminábamos al trabajo.",
        "Ella vivía en Madrid cuando conoció a su esposo.",
        "Comíamos cuando llegó el mensaje.",
      ],
      notes: "Rule of thumb: imperfecto = the scenery, indefinido = what happened in it.",
    },
    {
      title: "Presente Continuo (estar + gerundio)",
      explanation: "Describes an action happening right now, formed with 'estar' plus the gerund (-ando/-iendo).",
      structure: "estoy/estás/está/estamos/están + verb-ando/-iendo",
      examples: [
        "Estoy estudiando español.",
        "Ella está cocinando la cena.",
        "Están jugando fútbol en el parque.",
        "¿Qué estás haciendo?",
      ],
    },
    {
      title: "Futuro con Ir a + Infinitivo",
      explanation: "The most common way to talk about future plans in everyday Spanish, similar to English 'going to'.",
      structure: "voy/vas/va/vamos/van + a + infinitivo",
      examples: [
        "Voy a viajar el próximo verano.",
        "Ella va a estudiar medicina.",
        "Vamos a comer a las ocho.",
        "¿Qué vas a hacer mañana?",
      ],
    },
    {
      title: "Comparativos y Superlativos",
      explanation: "Compare two things or single one out as the most/least within a group.",
      structure: "más/menos + adjective + que (comparative) · el/la más + adjective (superlative)",
      examples: [
        "Este libro es más interesante que aquel.",
        "Ella es menos alta que su hermana.",
        "El español es tan útil como el inglés. (equality)",
        "Es la ciudad más grande del país.",
      ],
      notes: "Irregulars: bueno → mejor, malo → peor, grande → mayor, pequeño → menor.",
    },
    {
      title: "Poder / Saber",
      explanation: "Both can translate 'can' in English, but they mean different things: 'poder' is physical/circumstantial ability or permission, 'saber' is learned skill or knowledge.",
      structure: "puedo/puedes/puede... + infinitivo (poder) · sé/sabes/sabe... + infinitivo (saber)",
      examples: [
        "Puedo llegar a las tres. (I'm available)",
        "Sé nadar desde niño. (I learned how)",
        "¿Puedes ayudarme? (are you able to / will you)",
        "Ella sabe hablar tres idiomas.",
      ],
    },
    {
      title: "Pronombres de Objeto Directo e Indirecto",
      explanation: "Object pronouns replace nouns already mentioned and usually go right before the conjugated verb.",
      structure: "directo: lo/la/los/las · indirecto: le/les",
      examples: [
        "¿Ves el libro? Sí, lo veo. (lo = el libro)",
        "Compré la fruta y la comí. (la = la fruta)",
        "Le di un regalo a mi madre. (le = a mi madre)",
        "Les envié un mensaje a mis amigos.",
      ],
    },
    {
      title: "Verbos Reflexivos",
      explanation: "Reflexive verbs describe an action the subject does to themselves, marked with pronouns me/te/se/nos/se.",
      structure: "me/te/se/nos/se + verb",
      examples: [
        "Me despierto a las siete.",
        "Ella se viste rápido.",
        "Nos cepillamos los dientes después de comer.",
        "¿A qué hora te levantas?",
      ],
    },
    {
      title: "Cuánto / Cuántos",
      explanation: "Ask about quantity — 'cuánto/a' for uncountable nouns, 'cuántos/as' for countable plural nouns, always agreeing in gender.",
      structure: "¿Cuánto/a + uncountable noun? · ¿Cuántos/as + countable noun?",
      examples: [
        "¿Cuánta agua necesitas?",
        "¿Cuántos hermanos tienes?",
        "¿Cuánto cuesta esto?",
        "¿Cuántas horas duermes?",
      ],
    },
    {
      title: "Preposiciones: Por y Para",
      explanation: "Two prepositions that both can translate 'for' in English but serve different purposes — 'para' for purpose/destination/deadline, 'por' for cause/means/duration.",
      structure: "para + purpose/destination/recipient · por + cause/means/duration/exchange",
      examples: [
        "Este regalo es para ti. (recipient)",
        "Salimos para Lima mañana. (destination)",
        "Viajamos por avión. (means)",
        "Gracias por tu ayuda. (cause)",
      ],
    },
    {
      title: "Mandatos Informales (tú)",
      explanation: "Informal commands tell someone (using 'tú') to do something. Affirmative commands use the same form as the third person singular present for regular verbs.",
      structure: "affirmative: same as él/ella present (habla, come, escribe) · negative: no + subjunctive (no hables, no comas, no escribas)",
      examples: [
        "¡Habla más despacio, por favor!",
        "¡Come tus verduras!",
        "No hables tan rápido.",
        "Escribe tu nombre aquí.",
      ],
      notes: "Several verbs have irregular affirmative tú commands: ir → ve, tener → ten, hacer → haz, poner → pon, salir → sal, ser → sé, decir → di, venir → ven.",
    },
  ],

  B1: [], // Phase 2 — out of scope for this plan
  B2: [], // Phase 2 — out of scope for this plan
  C1: [], // Phase 2 — out of scope for this plan
  C2: [], // Phase 2 — out of scope for this plan
};
