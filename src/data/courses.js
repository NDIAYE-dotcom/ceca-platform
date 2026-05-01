const courses = [
  {
    id: 'gouvernance-finances-publiques',
    title: 'Gouvernance publique & finances publiques',
    category: 'Gouvernance publique',
    duration: '3 jours',
    target: 'Ministères, institutions publiques, collectivités territoriales, organismes de contrôle',
    objective: 'Renforcer la transparence, la performance budgétaire et la gestion efficace des ressources publiques.',
    modules: [
      'Budget-programme & réformes UEMOA/CEMAC',
      'Audit interne, contrôle et gestion des risques publics',
      'Digitalisation de la chaîne de la dépense publique',
      'Passation et régulation des marchés publics'
    ],
    description: 'Déployer les bonnes pratiques de gouvernance et de gestion budgétaire dans les administrations publiques.',
    featured: true,
    accent: 'blue'
  },
  {
    id: 'commande-publique-ppp',
    title: 'Commande publique & partenariats public-privé (PPP)',
    category: 'Commande publique',
    duration: '3 jours',
    target: 'Autorités contractantes, juristes publics, investisseurs',
    objective: 'Maîtriser les mécanismes de financement et d’exécution des projets publics.',
    modules: [
      'Ingénierie des Partenariats Public-Privé (PPP)',
      'E-procurement & dématérialisation',
      'Audit et lutte contre la fraude',
      'Gestion des contentieux des marchés publics'
    ],
    description: 'Sécuriser les procédures de commande publique et structurer les projets PPP avec rigueur.',
    featured: true,
    accent: 'gold'
  },
  {
    id: 'management-strategique-leadership',
    title: 'Management stratégique & leadership',
    category: 'Leadership',
    duration: '2 jours',
    target: 'Dirigeants, cadres, entrepreneurs, startups',
    objective: 'Développer des leaders agiles capables d’évoluer dans un environnement compétitif africain (ZLECAF).',
    modules: [
      'Leadership transformationnel & management hybride',
      'Stratégies de croissance et expansion régionale',
      'Intelligence artificielle pour décideurs',
      'Soft skills & intelligence émotionnelle'
    ],
    description: 'Renforcer le leadership et la capacité à piloter des organisations en transformation.',
    featured: true,
    accent: 'indigo'
  },
  {
    id: 'finance-fiscalite-comptabilite',
    title: 'Finance, fiscalité & comptabilité',
    category: 'Finance & comptabilité',
    duration: '4 jours',
    target: 'DAF, auditeurs, comptables, fiscalistes',
    objective: 'Sécuriser, optimiser et structurer la performance financière des organisations.',
    modules: [
      'Normes IFRS & SYSCOHADA révisé',
      'Optimisation fiscale & gestion des contrôles',
      'Analyse financière & ingénierie du financement',
      'Lutte contre le blanchiment (LBC/FT)'
    ],
    description: 'Outiller les équipes financières pour une gestion conforme, performante et anticipative.',
    featured: false,
    accent: 'emerald'
  },
  {
    id: 'gestion-projets-ong',
    title: 'Gestion des projets & ONG',
    category: 'Gestion de projet',
    duration: '3 jours',
    target: 'ONG, institutions internationales, fondations',
    objective: 'Maximiser l’impact, sécuriser les financements et améliorer la redevabilité.',
    modules: [
      'Fundraising & mobilisation de ressources',
      'Gestion de projet (cadre logique & outils digitaux)',
      'Suivi-évaluation & mesure d’impact',
      'Gestion des subventions et conformité bailleurs'
    ],
    description: 'Professionnaliser la gestion des projets sociaux et des programmes à impact.',
    featured: false,
    accent: 'cyan'
  },
  {
    id: 'programmes-finances-bailleurs',
    title: 'Programmes financés par les bailleurs internationaux',
    category: 'Bailleurs internationaux',
    duration: '3 jours',
    target: 'États, agences d’exécution, ONG',
    objective: 'Garantir une gestion conforme aux standards internationaux (Banque Mondiale, BAD, AFD, etc.).',
    modules: [
      'Procédures de passation des bailleurs',
      'Gestion financière & décaissement',
      'Sauvegardes environnementales et sociales',
      'Gestion axée sur les résultats (GAR)'
    ],
    description: 'Aligner l’exécution des projets financés sur les exigences des bailleurs de fonds.',
    featured: false,
    accent: 'amber'
  },
  {
    id: 'collectivites-territoriales-decentralisation',
    title: 'Collectivités territoriales & décentralisation',
    category: 'Décentralisation',
    duration: '3 jours',
    target: 'Mairies, conseils régionaux, agences locales',
    objective: 'Renforcer la gouvernance locale et stimuler le développement territorial.',
    modules: [
      'Gouvernance locale & transparence',
      'Mobilisation des recettes fiscales locales',
      'Planification urbaine durable',
      'Marketing territorial & attractivité'
    ],
    description: 'Dynamiser les territoires avec des outils de pilotage local et de développement durable.',
    featured: false,
    accent: 'teal'
  },
  {
    id: 'environnement-rse',
    title: 'Environnement, développement durable & RSE',
    category: 'Durabilité',
    duration: '2 jours',
    target: 'Entreprises, institutions publiques, ONG',
    objective: 'Intégrer la durabilité dans les stratégies économiques.',
    modules: [
      'Études d’impact environnemental et social',
      'Transition énergétique & décarbonation',
      'Stratégie RSE (ISO 26000)',
      'Finance verte & obligations climatiques'
    ],
    description: 'Construire des organisations plus responsables, résilientes et alignées sur les enjeux climatiques.',
    featured: false,
    accent: 'green'
  },
  {
    id: 'secteur-financier-bancaire-microfinance',
    title: 'Secteur financier, bancaire & microfinance',
    category: 'Finance',
    duration: '3 jours',
    target: 'Banques, institutions financières, fintech',
    objective: 'Renforcer la solidité et l’innovation du système financier africain.',
    modules: [
      'Gestion des risques (Bâle II & III)',
      'Digital banking & fintech',
      'Analyse de crédit PME',
      'Compliance KYC/AML'
    ],
    description: 'Apporter des méthodes concrètes pour la maîtrise du risque et l’innovation financière.',
    featured: false,
    accent: 'slate'
  },
  {
    id: 'droit-affaires-ohada',
    title: 'Droit des affaires & sécurisation juridique (OHADA)',
    category: 'Droit des affaires',
    duration: '3 jours',
    target: 'Juristes, avocats, entreprises, investisseurs',
    objective: 'Sécuriser les transactions et favoriser un climat d’investissement stable.',
    modules: [
      'Réformes du droit OHADA',
      'Sûretés & recouvrement',
      'Arbitrage & médiation commerciale',
      'Droit des sociétés & ingénierie juridique'
    ],
    description: 'Renforcer la sécurité juridique des opérations et des investissements.',
    featured: false,
    accent: 'violet'
  },
  {
    id: 'transport-logistique-infrastructures',
    title: 'Transport, logistique & infrastructures',
    category: 'Transport & logistique',
    duration: '2 jours',
    target: 'États, logisticiens, opérateurs portuaires',
    objective: 'Optimiser les systèmes de transport et accompagner les projets d’infrastructures.',
    modules: [
      'Transport multimodal intégré',
      'Supply Chain Management 4.0',
      'Gestion des infrastructures routières',
      'Mobilité urbaine durable'
    ],
    description: 'Structurer les chaînes logistiques et les infrastructures de mobilité avec une approche moderne.',
    featured: false,
    accent: 'sky'
  },
  {
    id: 'entrepreneuriat-innovation-digitale',
    title: 'Entrepreneuriat & innovation digitale',
    category: 'Entrepreneuriat',
    duration: '2 jours',
    target: 'Startups, incubateurs, investisseurs',
    objective: 'Créer des entreprises innovantes et scalables.',
    modules: [
      'Création et scaling de business',
      'Levée de fonds & capital-investissement',
      'Agribusiness & entrepreneuriat agricole',
      'Design Thinking & Lean Startup'
    ],
    description: 'Aider les porteurs de projets à passer de l’idée à la croissance durable.',
    featured: false,
    accent: 'rose'
  },
  {
    id: 'ressources-humaines-transformation-digitale',
    title: 'Ressources humaines & transformation digitale',
    category: 'Ressources humaines',
    duration: '3 jours',
    target: 'DRH, responsables RH',
    objective: 'Moderniser la gestion des talents et améliorer la performance organisationnelle.',
    modules: [
      'GPEC à l’ère de l’IA',
      'Recrutement digital & marque employeur',
      'Qualité de vie au travail (QVT)',
      'Digital RH & Data Analytics'
    ],
    description: 'Transformer les pratiques RH grâce aux outils digitaux et à une approche centrée sur les talents.',
    featured: false,
    accent: 'orange'
  },
  {
    id: 'fiscalite-avancee-risques',
    title: 'Fiscalité avancée & gestion des risques',
    category: 'Fiscalité',
    duration: '2 jours',
    target: 'DAF, juristes, dirigeants',
    objective: 'Anticiper les risques et sécuriser les opérations financières.',
    modules: [
      'Ingénierie fiscale et conformité',
      'Cartographie et pilotage des risques',
      'Contrôle fiscal et contentieux',
      'Structuration des opérations sensibles'
    ],
    description: 'Prévenir les risques fiscaux et renforcer la maîtrise des opérations à enjeu.',
    featured: false,
    accent: 'red'
  }
]

export default courses