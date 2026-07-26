// src/data/es/phrases.ts
import type { CEFRLevel, Phrase, PhraseTopic } from "@/data/types";
export type { CEFRLevel, Phrase, PhraseTopic };

export const PHRASES: Record<CEFRLevel, PhraseTopic[]> = {
  A1: [
    {
      topic: "Greetings",
      icon: "👋",
      phrases: [
        { phrase: "¡Hola!", translation: "Hello!", context: "General greeting" },
        { phrase: "¡Buenos días!", translation: "Good morning!", context: "Morning greeting" },
        { phrase: "¡Buenas tardes!", translation: "Good afternoon!", context: "Afternoon greeting" },
        { phrase: "¡Buenas noches!", translation: "Good night!", context: "Evening farewell" },
        { phrase: "¿Cómo estás?", translation: "How are you?", context: "Asking about wellbeing" },
        { phrase: "Estoy bien, gracias.", translation: "I'm fine, thanks.", context: "Responding to 'How are you?'" },
        { phrase: "¡Encantado/a de conocerte!", translation: "Nice to meet you!", context: "First meeting" },
        { phrase: "¡Adiós!", translation: "Goodbye! / Bye!", context: "Farewell" },
        { phrase: "¡Hasta luego!", translation: "See you later!", context: "Informal farewell" },
        { phrase: "¡Hasta mañana!", translation: "See you tomorrow!", context: "Farewell until next day" },
      ],
    },
    {
      topic: "Introductions",
      icon: "🙋",
      phrases: [
        { phrase: "Me llamo…", translation: "My name is…", context: "Stating your name" },
        { phrase: "Soy de…", translation: "I am from…", context: "Stating your country/city" },
        { phrase: "Tengo… años.", translation: "I am… years old.", context: "Stating your age" },
        { phrase: "Hablo un poco de inglés.", translation: "I speak a little English.", context: "Language ability" },
        { phrase: "¿Hablas español?", translation: "Do you speak Spanish?", context: "Asking about languages" },
        { phrase: "¿De dónde eres?", translation: "Where are you from?", context: "Asking someone's origin" },
        { phrase: "Vivo en…", translation: "I live in…", context: "Stating where you live" },
        { phrase: "Soy estudiante / profesor(a).", translation: "I am a student / teacher.", context: "Stating your occupation" },
      ],
    },
    {
      topic: "Politeness",
      icon: "🙏",
      phrases: [
        { phrase: "Por favor.", translation: "Please.", context: "Polite request" },
        { phrase: "Muchas gracias.", translation: "Thank you very much.", context: "Gratitude" },
        { phrase: "De nada.", translation: "You're welcome.", context: "Response to thanks" },
        { phrase: "Perdón / Con permiso.", translation: "Excuse me.", context: "Getting attention or passing" },
        { phrase: "Lo siento.", translation: "I'm sorry.", context: "Apologizing" },
        { phrase: "No entiendo.", translation: "I don't understand.", context: "Comprehension issue" },
        { phrase: "¿Puedes repetir eso, por favor?", translation: "Can you repeat that, please?", context: "Asking for repetition" },
        { phrase: "¿Puedes hablar más despacio?", translation: "Can you speak more slowly?", context: "Asking someone to slow down" },
      ],
    },
    {
      topic: "Numbers & Time",
      icon: "🕐",
      phrases: [
        { phrase: "¿Qué hora es?", translation: "What time is it?", context: "Asking the time" },
        { phrase: "Son las tres.", translation: "It is three o'clock.", context: "Telling the time" },
        { phrase: "Hoy es lunes.", translation: "Today is Monday.", context: "Day of the week" },
        { phrase: "¿Cuánto cuesta?", translation: "How much does it cost?", context: "Shopping" },
        { phrase: "Son las dos y media.", translation: "It's half past two.", context: "Telling half past the hour" },
        { phrase: "Por la mañana / tarde / noche.", translation: "In the morning / afternoon / evening.", context: "Parts of the day" },
      ],
    },
    {
      topic: "Classroom Language",
      icon: "📚",
      phrases: [
        { phrase: "¿Qué significa…?", translation: "What does … mean?", context: "Asking for a definition" },
        { phrase: "¿Cómo se escribe…?", translation: "How do you spell…?", context: "Asking for spelling" },
        { phrase: "¿Puedo ir al baño?", translation: "Can I go to the bathroom?", context: "Making a request" },
        { phrase: "Tengo una pregunta.", translation: "I have a question.", context: "In class" },
        { phrase: "¿Puedes ayudarme?", translation: "Can you help me?", context: "Asking for help" },
        { phrase: "No sé.", translation: "I don't know.", context: "Admitting uncertainty" },
      ],
    },
    {
      topic: "Basic Needs",
      icon: "🏠",
      phrases: [
        { phrase: "Tengo hambre.", translation: "I'm hungry.", context: "Expressing hunger" },
        { phrase: "Tengo sed.", translation: "I'm thirsty.", context: "Expressing thirst" },
        { phrase: "Estoy cansado/a.", translation: "I'm tired.", context: "Expressing fatigue" },
        { phrase: "Necesito ayuda.", translation: "I need help.", context: "Requesting assistance" },
        { phrase: "¿Dónde está el baño?", translation: "Where is the toilet?", context: "Finding facilities" },
        { phrase: "Me siento mal.", translation: "I feel sick.", context: "Expressing illness" },
        { phrase: "¡Llama a una ambulancia!", translation: "Call an ambulance!", context: "Emergency" },
      ],
    },
  ],

  A2: [
    {
      topic: "Shopping",
      icon: "🛍️",
      phrases: [
        { phrase: "Quisiera comprar…", translation: "I'd like to buy…", context: "Making a purchase" },
        { phrase: "¿Lo tiene en otra talla?", translation: "Do you have this in a different size?", context: "Shopping for clothes" },
        { phrase: "¿Cuánto cuesta esto?", translation: "How much is this?", context: "Asking the price" },
        { phrase: "Es demasiado caro.", translation: "That's too expensive.", context: "Reacting to a high price" },
        { phrase: "¿Puedo pagar con tarjeta?", translation: "Can I pay by card?", context: "Payment method" },
        { phrase: "Me lo llevo.", translation: "I'll take it.", context: "Buying decision" },
        { phrase: "¿Tiene algo más barato?", translation: "Do you have anything cheaper?", context: "Looking for a bargain" },
        { phrase: "¿Me lo puedo probar?", translation: "Can I try it on?", context: "Fitting room request" },
      ],
    },
    {
      topic: "Directions",
      icon: "🗺️",
      phrases: [
        { phrase: "¿Dónde está el/la…?", translation: "Where is the…?", context: "Asking for location" },
        { phrase: "Gira a la izquierda / derecha.", translation: "Turn left / right.", context: "Giving directions" },
        { phrase: "Sigue recto.", translation: "Go straight ahead.", context: "Going forward" },
        { phrase: "Está al lado de / frente a…", translation: "It's next to / opposite…", context: "Describing location" },
        { phrase: "¿A qué distancia está?", translation: "How far is it?", context: "Asking distance" },
        { phrase: "Toma la segunda calle a la izquierda.", translation: "Take the second left.", context: "Specific directions" },
        { phrase: "Está a unos diez minutos a pie.", translation: "It's about ten minutes on foot.", context: "Distance and time" },
      ],
    },
    {
      topic: "Ordering Food",
      icon: "🍽️",
      phrases: [
        { phrase: "Una mesa para dos, por favor.", translation: "A table for two, please.", context: "Restaurant arrival" },
        { phrase: "¿Me puede traer la carta?", translation: "Can I see the menu?", context: "Requesting the menu" },
        { phrase: "Quisiera el pollo, por favor.", translation: "I'd like the chicken, please.", context: "Ordering food" },
        { phrase: "Soy alérgico/a a los frutos secos.", translation: "I'm allergic to nuts.", context: "Dietary restrictions" },
        { phrase: "La cuenta, por favor.", translation: "The bill, please.", context: "Asking for the check" },
        { phrase: "¡Estaba delicioso!", translation: "It was delicious!", context: "Complimenting food" },
        { phrase: "Quisiera un vaso de agua.", translation: "I'd like a glass of water.", context: "Ordering drinks" },
        { phrase: "¿Está incluido el servicio?", translation: "Is service included?", context: "Asking about tip" },
      ],
    },
    {
      topic: "Transport",
      icon: "🚌",
      phrases: [
        { phrase: "¿Qué autobús va al centro?", translation: "Which bus goes to the centre?", context: "Using public transport" },
        { phrase: "Un boleto de ida / ida y vuelta a…, por favor.", translation: "A single / return ticket to…, please.", context: "Buying a ticket" },
        { phrase: "¿Cuándo sale el próximo tren?", translation: "When does the next train leave?", context: "Train departure" },
        { phrase: "¿Dónde tengo que bajar?", translation: "Where do I get off?", context: "Bus or train travel" },
        { phrase: "¿Está ocupado este asiento?", translation: "Is this seat taken?", context: "Asking about a seat" },
        { phrase: "¿Cuánto dura el viaje?", translation: "How long does the journey take?", context: "Journey duration" },
      ],
    },
    {
      topic: "Describing People & Places",
      icon: "🏙️",
      phrases: [
        { phrase: "Ella tiene el pelo largo y castaño.", translation: "She has long brown hair.", context: "Physical description" },
        { phrase: "Él es alto y delgado.", translation: "He is tall and slim.", context: "Physical description" },
        { phrase: "La ciudad es muy animada.", translation: "The city is very busy.", context: "Describing a place" },
        { phrase: "Es un pueblo bonito y tranquilo.", translation: "It's a beautiful, quiet town.", context: "Describing a town" },
        { phrase: "Ella lleva una chaqueta roja.", translation: "She is wearing a red jacket.", context: "Describing clothing" },
        { phrase: "Mi departamento es pequeño pero cómodo.", translation: "My apartment is small but comfortable.", context: "Describing your home" },
      ],
    },
    {
      topic: "Weather",
      icon: "🌤️",
      phrases: [
        { phrase: "¿Qué tiempo hace hoy?", translation: "What's the weather like today?", context: "Asking about weather" },
        { phrase: "Hace sol / está nublado / hace viento.", translation: "It's sunny / cloudy / windy.", context: "Describing weather" },
        { phrase: "Está lloviendo / nevando.", translation: "It's raining / snowing.", context: "Current weather" },
        { phrase: "¿Qué tiempo hará mañana?", translation: "What will the weather be like tomorrow?", context: "Future weather" },
        { phrase: "¡Hace un frío helador!", translation: "It's freezing!", context: "Very cold weather" },
        { phrase: "Lleva un paraguas — puede que llueva.", translation: "Take an umbrella — it might rain.", context: "Weather advice" },
      ],
    },
  ],

  B1: [], // Phase 2 — out of scope for this plan
  B2: [], // Phase 2 — out of scope for this plan
  C1: [], // Phase 2 — out of scope for this plan
  C2: [], // Phase 2 — out of scope for this plan
};
