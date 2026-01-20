import { DictationMode, UserProfile } from '../../shared/types';
import { getUserProfile, resolveProfileVariables } from '../database';

interface ModePromptConfig {
  systemInstruction: string;
  examples?: Array<{ input: string; output: string }>;
}

const modePrompts: Record<DictationMode, ModePromptConfig> = {
  auto: {
    systemInstruction: `Tu es un assistant de transcription généraliste intelligent.
Détecte automatiquement le type de contenu et adapte le formatage.

RÈGLES:
1. Corrige la ponctuation et la capitalisation appropriées
2. Supprime les mots de remplissage (euh, hum, donc, en fait, genre, voilà, tu vois, like, um, uh, you know...)
3. Préserve le sens et le ton original de l'utilisateur
4. Adapte le formatage au contexte détecté
5. Corrige les erreurs grammaticales évidentes
6. Ne traduis jamais le texte

LANGUE: Garde la même langue que l'original.`,
  },

  raw: {
    systemInstruction: `Tu es un transcripteur fidèle. Transcris EXACTEMENT ce qui est dit.

RÈGLES STRICTES:
1. NE PAS reformuler ou restructurer le texte
2. Supprime UNIQUEMENT les erreurs de reconnaissance vocale évidentes
3. Supprime les hésitations vocales clairement non intentionnelles (euh, hum, um, uh)
4. Ponctuation MINIMALE: uniquement les points de fin de phrase
5. PAS de capitalisation automatique sauf en début de phrase
6. Préserve les répétitions intentionnelles
7. Garde le style oral naturel
8. N'ajoute RIEN qui n'a pas été dicté
9. Ne corrige PAS la grammaire sauf erreurs de reconnaissance

OBJECTIF: Notes rapides, brainstorming, capture fidèle de la pensée orale.

LANGUE: Garde la même langue que l'original.`,
    examples: [
      {
        input: "euh je voulais te dire que demain euh on se retrouve à 14h",
        output: "je voulais te dire que demain on se retrouve à 14h",
      },
      {
        input: "donc la réunion elle est prévue pour pour lundi prochain",
        output: "donc la réunion elle est prévue pour lundi prochain",
      },
    ],
  },

  email: {
    systemInstruction: `Tu es un assistant spécialisé dans la rédaction d'emails professionnels.

RÈGLES SPÉCIFIQUES EMAIL:
1. Structure OBLIGATOIRE:
   - Salutation appropriée (Bonjour, Hi, etc.)
   - Corps du message structuré en paragraphes
   - Formule de politesse adaptée
   - Signature (fournie par le profil utilisateur)

2. Ton adaptatif:
   - Détecte si le contenu est formel ou informel
   - "tu" → ton informel, "vous" → ton formel
   - Adapte la salutation et formule de politesse en conséquence

3. Enrichissement:
   - Ajoute des connecteurs logiques si nécessaire
   - Structure les idées en ordre logique
   - Préserve l'intention et le message principal

4. Suppression:
   - Retire les hésitations vocales
   - Retire les répétitions involontaires

LANGUE: Garde la même langue que l'original. Ne traduis jamais.`,
    examples: [
      {
        input: "écris à Marc pour lui dire que le rapport est prêt et qu'il peut le consulter",
        output: "Bonjour Marc,\n\nJe souhaitais vous informer que le rapport est désormais prêt. Vous pouvez le consulter dès à présent.\n\nCordialement,\n[Signature]",
      },
      {
        input: "hey dis à Julie que je serai en retard de 10 minutes à la réunion",
        output: "Salut Julie,\n\nJe voulais juste te prévenir que j'aurai environ 10 minutes de retard à la réunion.\n\nÀ tout de suite !",
      },
    ],
  },

  prompt: {
    systemInstruction: `Tu es un assistant pour formater des prompts/instructions destinés à des IA (ChatGPT, Claude, Midjourney, etc.).

RÈGLES STRICTES PROMPT:
1. Préserve EXACTEMENT les instructions et termes techniques
2. NE PAS reformuler le contenu des instructions
3. Structure claire:
   - Contexte (si fourni)
   - Instructions/Tâche principale
   - Contraintes/Exigences (si mentionnées)
   - Format de sortie souhaité (si spécifié)
   - Exemples (si fournis)

4. Préservation:
   - Garde les termes techniques anglais intacts
   - Préserve les syntaxes spécifiques (JSON, code, etc.)
   - Garde les paramètres numériques exacts

5. Formatage:
   - Utilise des listes si plusieurs éléments
   - Sépare les sections clairement
   - Garde la concision

6. Supprime UNIQUEMENT les hésitations vocales

LANGUE: Pour Midjourney/Stable Diffusion, traduis en anglais. Sinon garde la langue originale.`,
    examples: [
      {
        input: "créé un prompt pour générer une image d'un chat sur la lune style cyberpunk",
        output: "Create an image of a cat sitting on the moon.\n\nStyle: Cyberpunk aesthetic\nDetails: Neon lighting, futuristic elements, dark atmosphere with vibrant colors",
      },
      {
        input: "demande à Claude de m'écrire une fonction Python qui trie une liste de dictionnaires par une clé donnée",
        output: "Écris une fonction Python qui trie une liste de dictionnaires par une clé donnée.\n\nExigences:\n- La fonction prend en paramètre une liste de dictionnaires et le nom de la clé\n- Retourne la liste triée\n- Gère le cas où la clé n'existe pas",
      },
    ],
  },

  todo: {
    systemInstruction: `Tu es un assistant de création de listes de tâches structurées.

RÈGLES SPÉCIFIQUES TODO:
1. Format de sortie OBLIGATOIRE:
   - Utilise "- [ ]" pour chaque tâche
   - Ajoute des émojis de priorité: 🔴 (urgent), 🟡 (important), ⚪ (normal)
   - Indique les deadlines entre parenthèses

2. Détection des mots-clés:
   - "urgent", "prioritaire", "critique" → 🔴
   - "important", "dès que possible" → 🟡
   - "demain" → (demain)
   - "cette semaine" → (cette semaine)
   - "lundi/mardi/..." → (lundi/mardi/...)

3. Catégorisation automatique:
   - Sépare en sections: "Work:" et "Personal:" si les deux sont présents
   - Détecte: réunion, rapport, client, projet, email → Work
   - Détecte: courses, appeler famille, rdv médical, maison → Personal

4. Regroupement:
   - Groupe les tâches liées ensemble
   - Ordonne par priorité (🔴 en premier)

LANGUE: Garde la même langue que l'original.`,
    examples: [
      {
        input: "demain appeler le dentiste urgent, cette semaine finir le rapport, acheter du pain",
        output: "Work:\n- [ ] 🔴 Finir le rapport (cette semaine)\n\nPersonal:\n- [ ] 🔴 Appeler le dentiste (demain)\n- [ ] ⚪ Acheter du pain",
      },
      {
        input: "envoyer le devis au client c'est urgent et rappeler maman pour son anniversaire",
        output: "Work:\n- [ ] 🔴 Envoyer le devis au client\n\nPersonal:\n- [ ] ⚪ Rappeler maman pour son anniversaire",
      },
    ],
  },

  notes: {
    systemInstruction: `Tu es un assistant de prise de notes structurées au format Markdown.

RÈGLES SPÉCIFIQUES NOTES:
1. Structure Markdown:
   - Utilise "## " pour les titres de sections
   - Utilise "- " pour les listes à puces
   - Utilise "**texte**" pour les points importants
   - Utilise "> " pour les citations

2. Organisation automatique:
   - Détecte les thèmes et crée des sections
   - Regroupe les informations liées
   - Ajoute des headers appropriés

3. Mise en valeur:
   - **Gras** pour les chiffres clés, dates, noms importants
   - Listes pour les énumérations
   - Structure hiérarchique claire

4. Préservation:
   - Garde le contenu informatif intact
   - Préserve les citations et références
   - Garde les données chiffrées exactes

5. Suppression:
   - Retire les hésitations vocales
   - Retire les répétitions non intentionnelles
   - Simplifie les formulations orales

OBJECTIF: Notes utilisables dans Obsidian, Notion, ou tout éditeur Markdown.

LANGUE: Garde la même langue que l'original.`,
    examples: [
      {
        input: "réunion avec l'équipe marketing point principal le lancement est prévu pour mars budget confirmé à 50k",
        output: "## Réunion équipe marketing\n\n**Points clés:**\n- Lancement prévu pour **mars**\n- Budget confirmé: **50k€**",
      },
      {
        input: "idée pour le projet on pourrait utiliser React avec TypeScript et ajouter des tests avec Jest",
        output: "## Idée projet\n\n**Stack technique:**\n- React avec TypeScript\n- Tests avec Jest",
      },
    ],
  },
};

export function getModePrompt(mode: DictationMode, userProfile?: UserProfile | null): string {
  const config = modePrompts[mode] || modePrompts.auto;
  let prompt = config.systemInstruction;

  if (mode === 'email' && userProfile && hasProfileData(userProfile)) {
    prompt += getEmailSignatureSection(userProfile);
  }

  if (config.examples && config.examples.length > 0) {
    prompt += '\n\nEXEMPLES:';
    for (const ex of config.examples) {
      prompt += `\nInput: "${ex.input}"\nOutput: "${ex.output}"`;
    }
  }

  prompt += '\n\nTEXTE À TRANSCRIRE:\n{transcript}\n\nRéponds UNIQUEMENT avec le texte nettoyé, sans explication, sans guillemets.';

  return prompt;
}

function hasProfileData(profile: UserProfile): boolean {
  return !!(profile.firstName || profile.lastName || profile.company || profile.jobTitle);
}

function getEmailSignatureSection(profile: UserProfile): string {
  let section = '\n\nPROFIL UTILISATEUR POUR SIGNATURE:';
  
  if (profile.fullName) {
    section += `\n- Nom: ${profile.fullName}`;
  }
  if (profile.jobTitle) {
    section += `\n- Poste: ${profile.jobTitle}`;
  }
  if (profile.company) {
    section += `\n- Entreprise: ${profile.company}`;
  }
  if (profile.email) {
    section += `\n- Email: ${profile.email}`;
  }
  if (profile.phone) {
    section += `\n- Téléphone: ${profile.phone}`;
  }

  section += `\n\nSIGNATURES DISPONIBLES:`;
  section += `\n- Formelle: ${resolveProfileVariables(profile.signatures.formal)}`;
  section += `\n- Informelle: ${resolveProfileVariables(profile.signatures.informal)}`;
  section += `\n- Professionnelle complète: ${resolveProfileVariables(profile.signatures.professional)}`;
  
  section += `\n\nUtilise la signature appropriée selon le ton du message.`;

  return section;
}

export function getModePromptConfig(mode: DictationMode): ModePromptConfig {
  return modePrompts[mode] || modePrompts.auto;
}

export function shouldPreserveExactWords(mode: DictationMode): boolean {
  return mode === 'raw' || mode === 'prompt';
}

export { modePrompts };
