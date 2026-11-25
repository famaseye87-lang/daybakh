/**
 * Textes du « Mode d'emploi » (brouillon relu : docs/guide-brouillon.md).
 * Provisoire : à déplacer dans src/content/guide.json par Cowork, avec la même structure.
 * Dans les textes, **gras** met un passage en gras.
 */
export interface GuideSection {
  id: string;
  icon: string;
  title: string;
  /** Encadré mis en avant, affiché avant la liste */
  callout?: string;
  items: string[];
  outro?: string;
  links?: { to: string; label: string }[];
  /** Rubrique dépliée à l'ouverture de la page */
  open?: boolean;
}

export const guide: { title: string; intro: string; sections: GuideSection[]; footer: string[] } = {
  title: "Mode d'emploi",
  intro: "Daybakh t'accompagne chaque jour : sport, assiette, sommeil et progrès. Tu n'as pas besoin de tout utiliser : prends ce qui t'aide, laisse le reste. Voici l'essentiel en 2 minutes.",
  sections: [
    {
      id: 'journee',
      icon: '☀️',
      title: "Ta journée",
      items: [
        "**Mon suivi du jour** : touche + et − pour noter tes verres d'eau (un verre = 25 cl), ton sommeil et ton énergie. Ça prend 10 secondes.",
        "**Ta séance du jour** : la séance prévue t'attend, un bouton suffit pour la lancer.",
        "**Ma semaine** : un score sur 100. Séances, eau, sommeil et repas comptent chacun pour un quart. Seuls les jours passés comptent, et aujourd'hui dès que c'est fait : ton score ne peut que monter dans la journée.",
        "**Les badges** récompensent la régularité, jamais la perfection.",
      ],
      outro: "Un jour sans, ce n'est pas un échec. Le lendemain, on reprend, simplement.",
      links: [{ to: '/progres/badges', label: 'Voir mes badges' }],
    },
    {
      id: 'sport',
      icon: '🏋️',
      title: 'Le sport',
      items: [
        "**Ta semaine** est préparée selon ton profil : renforcement, HIIT léger, marche, natation, repos. Tu peux la modifier ; garde si possible un jour de repos entre deux renforcements.",
        "**Pendant la séance**, Daybakh te guide : des bips (et la vibration sur Android) annoncent chaque changement. Monte le volume « média » de ton téléphone ; sur iPhone, vérifie aussi le bouton silencieux.",
        "**Trois versions** pour chaque exercice : facile, intermédiaire, avancé. Choisis selon ta forme du jour.",
        "**Après une nuit courte** (moins de 6 h), Daybakh te propose une séance plus douce. Pas de HIIT ces jours-là.",
        "**Douleur vive = on arrête.** Le bouton « J'ai mal » est là pendant la séance. Une courbature est normale ; une douleur vive, non.",
        "**Le passage au niveau suivant** est proposé, jamais imposé. Tu peux rester une semaine de plus sur un niveau.",
      ],
      links: [
        { to: '/sport/semaine', label: 'Modifier ma semaine' },
        { to: '/sport/exercices', label: 'Les exercices' },
      ],
    },
    {
      id: 'assiette',
      icon: '🥗',
      title: "L'assiette",
      items: [
        "**Ton assiette du jour** montre les proportions : un tiers de féculents les jours de sport, plus de légumes et de protéines les jours légers. Pas de calcul de calories, pas d'aliment interdit.",
        "**Menu de la semaine** : des recettes de 30 minutes maximum, pour toute la famille. Tu peux le régénérer si un plat ne te tente pas.",
        "**Liste de courses** : elle se fait toute seule à partir du menu. Indique le nombre de personnes (un enfant compte pour une demi-part ou trois quarts). Tes cases cochées et tes articles ajoutés sont gardés quand la liste se recalcule.",
        "**Batch cooking** : une séance de cuisine (mercredi soir ou samedi) pour préparer les plats de la semaine. À conserver 3 jours maximum au réfrigérateur ; au-delà, on congèle.",
        "**Repas libre** : un par semaine, sans culpabilité et sans « rattrapage ». À choisir dans les réglages de l'assiette.",
        "**Journal photo** (facultatif) : une photo par repas pour observer ton assiette. Les photos restent sur ton téléphone.",
      ],
      links: [
        { to: '/assiette/courses', label: 'Liste de courses' },
        { to: '/assiette/reglages', label: "Réglages de l'assiette" },
      ],
    },
    {
      id: 'progres',
      icon: '📈',
      title: 'Tes progrès',
      items: [
        "**Quand se mesurer ?** Une fois par semaine, le matin, à jeun, après être passé·e aux toilettes. Toujours dans les mêmes conditions.",
        "**Les courbes** montrent ton poids, tes tours (taille, hanches…), ton sommeil et ton énergie, semaine après semaine.",
        "**La balance ne bouge pas ?** C'est normal par moments : le corps s'adapte. Regarde aussi tes mensurations, elles baissent parfois avant le poids.",
        "**Tes repères** (besoins du jour, protéines…) sont recalculés toutes les 4 semaines, à partir de la moyenne de tes 2 dernières pesées. Entre deux recalculs, ils restent stables : c'est voulu.",
        "**Les formules et leurs sources** sont toujours consultables.",
      ],
      links: [
        { to: '/progres/guide', label: 'Comment se mesurer' },
        { to: '/a-propos', label: 'Sources des calculs' },
      ],
    },
    {
      id: 'donnees',
      icon: '💾',
      title: 'Tes données (à lire absolument)',
      open: true,
      callout: "**Tes données sont uniquement sur ce téléphone.** Pas de compte, pas de serveur : personne d'autre n'y a accès, mais personne ne peut non plus les récupérer pour toi.",
      items: [
        "**Si tu changes de téléphone, si tu le perds, ou si tu effaces les données de Safari/Chrome, seule une sauvegarde permet de tout retrouver.**",
        "**Fais une sauvegarde une fois par mois** : Moi → Mes données → Exporter ma sauvegarde. Range le fichier dans tes fichiers, ton Drive, ou envoie-le-toi par e-mail.",
        "**Daybakh te le rappelle** : un bandeau apparaît si tu n'as jamais fait de sauvegarde ou si la dernière date de plus d'un mois.",
        "**Pour retrouver ton historique** sur un nouveau téléphone : installe Daybakh, puis Moi → Mes données → Restaurer une sauvegarde.",
        "**Les photos de repas** s'exportent à part, depuis le Journal photo.",
        "**Tu peux aussi exporter tes mesures** en tableau (CSV) pour les ouvrir dans Excel ou Google Sheets.",
      ],
      links: [{ to: '/moi/donnees', label: 'Mes données' }],
    },
    {
      id: 'installer',
      icon: '📲',
      title: 'Installer et mettre à jour',
      items: [
        "**Installe Daybakh sur ton écran d'accueil** : elle s'ouvre comme une application, fonctionne sans connexion et protège mieux tes données.",
        "**iPhone** : ouvre le lien dans Safari (pas depuis WhatsApp), bouton Partager, puis « Sur l'écran d'accueil ». **Android** : ouvre le lien dans Chrome, menu ⋮, puis « Installer l'application ».",
        "**Sur iPhone**, l'appli installée et l'onglet Safari ne partagent pas leurs données. Après l'installation, ouvre toujours Daybakh par son icône.",
        "**Mises à jour** : elles se font toutes seules. Pour voir la nouvelle version, ferme complètement l'appli puis rouvre-la. Si une nouvelle version est prête pendant que tu utilises l'appli, un bandeau te propose « Mettre à jour » (jamais en pleine séance).",
        "**Rappels** : Daybakh n'envoie pas de notifications. Crée un fichier de rappels qui s'ajoute à l'agenda de ton téléphone (pesée, séance, collation, courses, sauvegarde). Tu les modifies ou les supprimes dans l'agenda quand tu veux.",
        "**Un téléphone = un profil.** Si quelqu'un de ta famille veut utiliser Daybakh, il l'installe sur son propre téléphone.",
      ],
      links: [
        { to: '/moi/installation', label: 'Installer Daybakh' },
        { to: '/moi/rappels', label: 'Rappels dans mon agenda' },
      ],
    },
  ],
  footer: [
    "Daybakh ne remplace pas l'avis d'un médecin ou d'un professionnel de santé. En cas de doute, de douleur ou de situation particulière (grossesse, allaitement, blessure), parles-en à un professionnel.",
    "« Daybakh » veut dire « ça va aller » en wolof. 💛",
  ],
};
