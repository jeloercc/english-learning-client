export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface GrammarRule {
  title: string;
  explanation: string;
  structure: string;
  examples: string[];
  notes?: string;
}

export const GRAMMAR: Record<CEFRLevel, GrammarRule[]> = {
  // ─── A1 · Beginner ──────────────────────────────────────────────────────────
  A1: [
    {
      title: "To Be — Present Simple",
      explanation: "Use 'to be' to describe identity, state, feelings, or location.",
      structure: "Subject + am / is / are + complement",
      examples: [
        "I am a student.",
        "She is happy.",
        "They are from Mexico.",
        "It is cold today.",
      ],
      notes: "Contractions: I'm, you're, he's, she's, it's, we're, they're",
    },
    {
      title: "Present Simple",
      explanation: "Describes habits, routines, facts, and general truths.",
      structure: "Subject + verb (base form) · add -s/-es for he/she/it",
      examples: [
        "I eat breakfast every day.",
        "She works at a school.",
        "They live in the city.",
        "He watches TV at night.",
      ],
      notes: "Use do/does for questions and negatives: Does she work here?",
    },
    {
      title: "Articles: a / an / the",
      explanation: "'A/an' introduce a noun for the first time; 'the' refers to something specific.",
      structure: "a + consonant sound · an + vowel sound · the + specific noun",
      examples: [
        "I have a dog.",
        "She is an engineer.",
        "The sun is bright.",
        "Can you open the door?",
      ],
      notes: "No article with uncountable nouns used generally: Water is essential.",
    },
    {
      title: "Subject Pronouns",
      explanation: "Replace nouns as the subject of a sentence.",
      structure: "I / you / he / she / it / we / they",
      examples: [
        "I am from Spain.",
        "He is my brother.",
        "They are students.",
        "It is raining.",
      ],
    },
    {
      title: "Plural Nouns",
      explanation: "Most nouns form the plural by adding -s or -es; some are irregular.",
      structure: "noun + s · noun + es · noun + ies · irregular forms",
      examples: [
        "one cat → two cats",
        "one box → two boxes",
        "one baby → two babies",
        "one man → two men (irregular)",
      ],
      notes: "Irregular plurals: woman→women, child→children, tooth→teeth, foot→feet",
    },
    {
      title: "Demonstratives: this / that / these / those",
      explanation: "Point to people or things near or far.",
      structure: "this/that + singular noun · these/those + plural noun",
      examples: [
        "This is my book.",
        "That is your car.",
        "These are my friends.",
        "Those houses are big.",
      ],
    },
    {
      title: "Possessive Adjectives",
      explanation: "Show who something belongs to.",
      structure: "my / your / his / her / its / our / their + noun",
      examples: [
        "This is my bag.",
        "Her name is Ana.",
        "Our teacher is kind.",
        "Their dog is friendly.",
      ],
    },
    {
      title: "Numbers and Basic Quantities",
      explanation: "Use cardinal numbers for counting; ordinal numbers for order.",
      structure: "one, two, three... / first, second, third...",
      examples: [
        "I have two brothers.",
        "She lives on the third floor.",
        "There are twenty students in the class.",
        "It is my first day.",
      ],
    },
  ],

  // ─── A2 · Elementary ────────────────────────────────────────────────────────
  A2: [
    {
      title: "Past Simple",
      explanation: "Describes completed actions at a specific time in the past.",
      structure: "Subject + verb-ed (regular) / irregular past form",
      examples: [
        "I visited Paris last year.",
        "She bought a new phone.",
        "They didn't go to school.",
        "Did he call you?",
      ],
      notes: "Regular verbs add -ed. Irregular verbs must be memorized: go→went, see→saw, buy→bought.",
    },
    {
      title: "Present Continuous",
      explanation: "Describes actions happening right now or around the present moment.",
      structure: "Subject + am / is / are + verb-ing",
      examples: [
        "I am studying English.",
        "She is cooking dinner.",
        "They are playing football.",
        "It is not raining now.",
      ],
      notes: "Some verbs are not used in continuous forms: know, like, want, love, hate.",
    },
    {
      title: "Comparative & Superlative Adjectives",
      explanation: "Compare two things (comparative) or compare one to all others (superlative).",
      structure: "adj + -er than · more + adj + than · the + adj + -est · the most + adj",
      examples: [
        "This book is bigger than that one.",
        "English is more difficult than Spanish.",
        "Mount Everest is the highest mountain.",
        "She is the most talented student.",
      ],
      notes: "Short adjectives: tall→taller→tallest. Long adjectives use more/most.",
    },
    {
      title: "Can / Can't — Ability & Permission",
      explanation: "Express ability, inability, or to ask/give permission.",
      structure: "Subject + can / can't + verb (base form)",
      examples: [
        "I can speak English.",
        "She can't drive.",
        "Can you help me?",
        "You can use my phone.",
      ],
    },
    {
      title: "Going to — Future Plans",
      explanation: "Talk about plans, intentions, and predictions based on evidence.",
      structure: "Subject + am / is / are + going to + verb (base form)",
      examples: [
        "I am going to travel next summer.",
        "She is going to study medicine.",
        "They are not going to attend.",
        "Look at those clouds — it's going to rain.",
      ],
    },
    {
      title: "Object Pronouns",
      explanation: "Replace nouns as the object of a verb or preposition.",
      structure: "me / you / him / her / it / us / them",
      examples: [
        "Can you help me?",
        "I like her.",
        "She called him yesterday.",
        "Give it to them.",
      ],
    },
    {
      title: "There is / There are",
      explanation: "Introduce the existence of something.",
      structure: "There is + singular · There are + plural",
      examples: [
        "There is a supermarket near here.",
        "There are three bedrooms in my house.",
        "Is there a bus stop nearby?",
        "There aren't any chairs.",
      ],
    },
    {
      title: "How much / How many",
      explanation: "Ask about quantities of countable and uncountable nouns.",
      structure: "How much + uncountable noun · How many + countable noun (+ are there?)",
      examples: [
        "How much water do you drink?",
        "How many students are in your class?",
        "How much does it cost?",
        "How many books do you have?",
      ],
      notes: "Uncountable nouns (water, money, time) → How much. Countable nouns → How many.",
    },
  ],

  // ─── B1 · Intermediate ──────────────────────────────────────────────────────
  B1: [
    {
      title: "Present Perfect",
      explanation: "Links a past action or experience to the present.",
      structure: "Subject + have / has + past participle",
      examples: [
        "I have visited London three times.",
        "She has never eaten sushi.",
        "Have you finished your homework?",
        "He hasn't called me yet.",
      ],
      notes: "Common time expressions: ever, never, already, just, yet, recently, since, for.",
    },
    {
      title: "Modal Verbs: Should / Must / Have to",
      explanation: "Express advice, strong obligation, and necessity.",
      structure: "Subject + should / must / have to + verb (base form)",
      examples: [
        "You should exercise more.",
        "Students must submit assignments on time.",
        "I have to wake up early tomorrow.",
        "She doesn't have to come.",
      ],
      notes: "'Must' is stronger than 'have to'; 'should' is softer advice.",
    },
    {
      title: "Zero & First Conditionals",
      explanation: "Zero for general truths; First for realistic, possible future situations.",
      structure: "If + present, present (zero) · If + present, will + verb (first)",
      examples: [
        "If you heat water to 100°C, it boils. (zero)",
        "If I study hard, I will pass. (first)",
        "She will be late if the bus doesn't come.",
        "If it rains, we will stay home.",
      ],
    },
    {
      title: "Reported Speech — Statements",
      explanation: "Report what someone said, shifting tenses back one step.",
      structure: "He said (that) + clause (tenses shift back)",
      examples: [
        "\"I am tired.\" → She said she was tired.",
        "\"I will come.\" → He told me he would come.",
        "\"We have finished.\" → They said they had finished.",
        "\"I like the film.\" → She said she liked the film.",
      ],
      notes: "Present → past, will → would, can → could, have → had.",
    },
    {
      title: "Relative Clauses: who / which / that",
      explanation: "Add essential or extra information about a noun.",
      structure: "noun + who (people) / which (things) / that (both) + clause",
      examples: [
        "The man who lives next door is a doctor.",
        "I bought the book that you recommended.",
        "This is the city where I was born.",
        "She has a cat which loves sleeping.",
      ],
      notes: "Use 'where' for places, 'whose' for possession.",
    },
    {
      title: "Past Continuous",
      explanation: "Describes an action in progress at a specific time in the past.",
      structure: "Subject + was / were + verb-ing",
      examples: [
        "I was reading when you called.",
        "They were playing football at 5 pm.",
        "She wasn't sleeping at midnight.",
        "What were you doing yesterday?",
      ],
      notes: "Often used with Past Simple: 'When I arrived, she was cooking.'",
    },
    {
      title: "Used to — Past Habits",
      explanation: "Describe habits or states in the past that no longer exist.",
      structure: "Subject + used to + verb (base form)",
      examples: [
        "I used to play tennis every weekend.",
        "She used to live in Madrid.",
        "Did you use to smoke?",
        "He didn't use to like vegetables.",
      ],
      notes: "Only used for the past — there is no present form 'use to'.",
    },
    {
      title: "Passive Voice — Present & Past",
      explanation: "Focus on the action or object rather than the doer.",
      structure: "Subject + am / is / are (was / were) + past participle",
      examples: [
        "The windows are cleaned every week.",
        "The letter was written by Maria.",
        "The meeting is being held now.",
        "English is spoken around the world.",
      ],
    },
  ],

  // ─── B2 · Upper-Intermediate ────────────────────────────────────────────────
  B2: [
    {
      title: "Second Conditional",
      explanation: "Hypothetical or imaginary situations in the present or future.",
      structure: "If + past simple, would + verb (base form)",
      examples: [
        "If I won the lottery, I would travel the world.",
        "She would help if she had more time.",
        "What would you do if you lost your job?",
        "If I were you, I'd apologize.",
      ],
      notes: "Use 'were' for all persons in formal register: 'If I were...'",
    },
    {
      title: "Third Conditional",
      explanation: "Hypothetical situations in the past that did not happen.",
      structure: "If + past perfect, would have + past participle",
      examples: [
        "If I had studied harder, I would have passed.",
        "She wouldn't have been late if she had left earlier.",
        "If they had invested, they would have made money.",
        "He would have called if he'd known.",
      ],
    },
    {
      title: "Passive Voice — All Tenses",
      explanation: "Focus on the action or recipient rather than the agent.",
      structure: "Subject + to be (tense) + past participle (by + agent)",
      examples: [
        "The report was written by the manager. (past simple passive)",
        "The building has been demolished. (present perfect passive)",
        "The results will be announced tomorrow. (future passive)",
        "Mistakes were being made. (past continuous passive)",
      ],
    },
    {
      title: "Gerunds & Infinitives",
      explanation: "Some verbs take a gerund (-ing); others take an infinitive (to + verb).",
      structure: "verb + gerund · verb + to + infinitive",
      examples: [
        "I enjoy reading novels. (gerund after enjoy)",
        "She wants to become a doctor. (infinitive after want)",
        "He stopped smoking. (gerund after stop)",
        "They decided to leave early. (infinitive after decide)",
      ],
      notes: "Some verbs change meaning: stop smoking (quit) vs stop to smoke (pause in order to).",
    },
    {
      title: "Discourse Markers",
      explanation: "Connect ideas and organize written and spoken language.",
      structure: "Connector + clause / sentence",
      examples: [
        "However, the results were unexpected.",
        "Furthermore, the study revealed new insights.",
        "Despite the rain, they continued.",
        "On the other hand, some experts disagree.",
      ],
      notes: "Key categories: addition (furthermore), contrast (however), concession (although), result (therefore).",
    },
    {
      title: "Causative Have / Get",
      explanation: "Describes arranging for someone else to do something for you.",
      structure: "have / get + object + past participle",
      examples: [
        "I had my hair cut yesterday.",
        "She got her car repaired.",
        "They are having the house painted.",
        "Can I get this form signed?",
      ],
    },
    {
      title: "Wish & If only",
      explanation: "Express regret about the present or past.",
      structure: "wish / if only + past simple (present) · past perfect (past)",
      examples: [
        "I wish I spoke better English. (present regret)",
        "If only I had more time! (present wish)",
        "She wishes she had studied harder. (past regret)",
        "I wish I hadn't said that. (past regret)",
      ],
    },
    {
      title: "Modals for Deduction & Speculation",
      explanation: "Use modals to express degrees of certainty about past or present situations.",
      structure: "must / might / could / can't + be / have + past participle",
      examples: [
        "She must be tired — she's worked all day.",
        "He might know the answer.",
        "They can't have left already, it's too early.",
        "It could have been an accident.",
      ],
    },
  ],

  // ─── C1 · Advanced ──────────────────────────────────────────────────────────
  C1: [
    {
      title: "Mixed Conditionals",
      explanation: "Combine past hypothetical with present or present hypothetical with past result.",
      structure: "If + past perfect, would + base · If + past simple, would have + pp",
      examples: [
        "If I had taken that job, I would be richer now.",
        "She would have succeeded if she were more confident.",
        "If I were smarter, I would have solved it then.",
        "He wouldn't be here now if they hadn't helped him.",
      ],
    },
    {
      title: "Inversion for Emphasis",
      explanation: "Move the auxiliary before the subject after negative/restrictive adverbials for formal emphasis.",
      structure: "Negative/restrictive adverb + auxiliary + subject + verb",
      examples: [
        "Never have I seen such dedication.",
        "Rarely does she make mistakes.",
        "Not only did he apologize, but he also resigned.",
        "Hardly had we arrived when it started raining.",
      ],
      notes: "Triggered by: Never, Rarely, Seldom, Not only, Hardly, No sooner, Only when.",
    },
    {
      title: "Subjunctive Mood",
      explanation: "Expresses wishes, suggestions, demands, and hypotheticals in formal or academic English.",
      structure: "It is essential / important / vital / recommended that + subject + base verb",
      examples: [
        "I suggest that he be present at the meeting.",
        "It is vital that she understand the risks.",
        "The board recommended that the CEO resign.",
        "If I were to apply, I would need references.",
      ],
    },
    {
      title: "Cleft Sentences",
      explanation: "Emphasize one part of a sentence by restructuring it.",
      structure: "It is/was + emphasis + that/who + rest · What + clause + is/was + emphasis",
      examples: [
        "It was Maria who solved the problem.",
        "It is dedication that matters most.",
        "What I need is more time.",
        "What surprised me was his reaction.",
      ],
    },
    {
      title: "Complex Noun Phrases",
      explanation: "Build noun phrases using pre- and post-modification for density and precision.",
      structure: "det + pre-modifier(s) + noun + post-modifier (clause or phrase)",
      examples: [
        "The rapidly growing technological sector poses new challenges.",
        "A meticulously researched paper published last year.",
        "The policy implemented by the committee was controversial.",
        "Several highly qualified candidates withdrew their applications.",
      ],
    },
    {
      title: "Ellipsis and Substitution",
      explanation: "Omit predictable elements or replace them with pro-forms to avoid repetition.",
      structure: "Omit repeated verb phrases · Replace with: so / not / do so / one",
      examples: [
        "She can play the violin, and so can he.",
        "Did she leave early? I think so.",
        "He refused to leave, and I did so too.",
        "Would you like a biscuit? I'll take one, thanks.",
      ],
    },
    {
      title: "Advanced Reporting Verbs",
      explanation: "Use precise reporting verbs to convey the speaker's attitude or intention.",
      structure: "subject + reporting verb + that-clause / to + infinitive",
      examples: [
        "She argued that the policy was flawed.",
        "He insisted on reviewing the contract.",
        "They conceded that the approach had limitations.",
        "The report suggested implementing new measures.",
      ],
      notes: "Common advanced verbs: allege, assert, concede, contend, dispute, postulate.",
    },
    {
      title: "Hedging Language",
      explanation: "Soften claims and express appropriate epistemic caution in academic writing.",
      structure: "Modal + seem/appear/tend · It + passive reporting verb · Approximators",
      examples: [
        "The results would appear to suggest a correlation.",
        "It has been argued that further research is needed.",
        "This may be attributed to environmental factors.",
        "The data tends to support the hypothesis.",
      ],
    },
  ],

  // ─── C2 · Mastery ───────────────────────────────────────────────────────────
  C2: [
    {
      title: "Ellipsis and Substitution — Advanced",
      explanation: "Omit or replace predictable elements for cohesion, economy, and style.",
      structure: "Omit repeated elements · Replace with 'so', 'not', 'do so', 'one(s)'",
      examples: [
        "She can play the violin, and so can he.",
        "Did she leave? I think so.",
        "He refused to leave, and I did so too.",
        "Would you like a biscuit? I'll take one, thanks.",
      ],
    },
    {
      title: "Nominalization",
      explanation: "Convert verbs and adjectives into noun forms to achieve formal, academic register.",
      structure: "verb/adjective → noun via suffixes: -tion, -ment, -ity, -ance, -ness, -al",
      examples: [
        "The decision (← decide) was unanimous.",
        "Her improvement (← improve) was remarkable.",
        "The complexity (← complex) is often underestimated.",
        "His reluctance (← reluctant) was apparent to all.",
      ],
    },
    {
      title: "Pragmatic Hedging",
      explanation: "Use linguistic devices to soften assertions, acknowledge uncertainty, and maintain scholarly caution.",
      structure: "Modal + seem/appear/tend · It + passive reporting verb · Approximators",
      examples: [
        "The results would appear to suggest a correlation.",
        "It has been argued that further research is needed.",
        "This may be attributed to environmental factors.",
        "The data broadly supports the hypothesis.",
      ],
    },
    {
      title: "Advanced Concession Structures",
      explanation: "Acknowledge opposing views while reinforcing your own argument.",
      structure: "Although/Even though/While + clause · Granted/Admittedly, ... Yet/Nevertheless",
      examples: [
        "While there is merit in this view, the evidence remains inconclusive.",
        "Admittedly, the approach has limitations; nevertheless, it represents progress.",
        "Even though costs are high, the long-term benefits outweigh them.",
        "Granted this is complex; it is not, however, insurmountable.",
      ],
    },
    {
      title: "Stylistic Fronting",
      explanation: "Move sentence elements to the front for stylistic effect, emphasis, or cohesion.",
      structure: "Fronted element (adverbial/object/complement) + comma + main clause",
      examples: [
        "Rarely in modern history has such a crisis emerged.",
        "Of paramount importance is the ethical dimension.",
        "In no way does this undermine the core argument.",
        "Such is the complexity of the matter that no easy solution exists.",
      ],
    },
    {
      title: "Stance Markers & Epistemic Modality",
      explanation: "Explicitly position yourself toward a proposition — certainty, doubt, attitude.",
      structure: "Stance adverb + clause · Modal + proposition · Evaluative adjective + that-clause",
      examples: [
        "Arguably, this represents the most significant shift in policy.",
        "Remarkably, no previous study had addressed this gap.",
        "It is conceivable that the findings are coincidental.",
        "Inevitably, some ambiguity remains in the interpretation.",
      ],
    },
    {
      title: "Rhetorical Devices",
      explanation: "Techniques used to make language more persuasive, vivid, or memorable.",
      structure: "Anaphora · Antithesis · Tricolon · Chiasmus · Rhetorical questions",
      examples: [
        "We shall fight on the beaches, we shall fight on the landing grounds... (anaphora)",
        "It's not the years in your life, but the life in your years. (chiasmus)",
        "Ask not what your country can do for you... (rhetorical question + chiasmus)",
        "Government of the people, by the people, for the people. (tricolon)",
      ],
    },
    {
      title: "Register and Style Shifting",
      explanation: "Adapt language choices — lexis, syntax, pragmatics — to the social context.",
      structure: "Formal: nominalization + passives + hedging · Informal: contractions + active + colloquial",
      examples: [
        "Formal: The initiative was implemented with considerable deliberation.",
        "Neutral: They thought carefully before starting the project.",
        "Informal: They really took their time on it.",
        "Academic: It is posited that socioeconomic factors constitute a primary variable.",
      ],
      notes: "Register includes: field (subject matter), tenor (relationship), mode (spoken/written).",
    },
  ],
};
