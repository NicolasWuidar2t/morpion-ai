# 🎯 Morpion AI - Version Web

![Bannière PD1J (1)](https://github.com/user-attachments/assets/c5ac9bec-3f77-4f88-9b43-b864899cd4ef)

Un jeu de morpion 5x5 boosté à l'IA pour battre Fuze ! **Maintenant disponible en version web !**

## 🚀 Transformation Unity → Web

Cette application a été transformée d'un projet Unity C# en une application web moderne utilisant HTML5, CSS3 et JavaScript. Le port préserve toutes les fonctionnalités principales du jeu original :

### ✨ Fonctionnalités portées
- **Jeu de morpion 5x5** avec règle de victoire à 4 alignés
- **Intelligence artificielle** utilisant l'algorithme Minimax avec élagage Alpha-Beta
- **Visualisation de la réflexion IA** avec surlignage des coups évalués
- **Contrôles clavier** : `K` pour déclencher l'IA, `R` pour nouvelle partie
- **Interface intuitive** avec indicateur de tour et contrôles de difficulté
- **Responsive design** adapté aux écrans mobiles et desktop

### 🎮 Comment jouer

1. **Ouvrez** le fichier `index.html` dans votre navigateur
2. **Cliquez** sur une case vide pour placer votre symbole (O ou X)
3. **Utilisez** le bouton "IA joue (K)" ou la touche `K` pour que l'IA joue
4. **Réglez** la difficulté de l'IA (de 2 à 5 niveaux de profondeur)
5. **Observez** la réflexion de l'IA avec la visualisation en temps réel
6. **Nouvelle partie** avec le bouton rouge ou la touche `R`

### 🎯 Objectif

Alignez 4 symboles identiques en ligne (horizontale, verticale ou diagonale) sur la grille 5x5 pour gagner !

## 🛠️ Architecture technique

### Structure des fichiers
```
morpion-ai/
├── index.html          # Interface utilisateur principale
├── style.css           # Styles et design responsive
├── morpion-ai.js       # Logique de jeu et IA en JavaScript
├── Assets/             # Ressources Unity originales (conservées)
└── README.md           # Documentation
```

### Port du code Unity vers Web

| Composant Unity | Équivalent Web | Fonctionnalité |
|----------------|----------------|----------------|
| `Morpion.cs` | `MorpionAI` class | Logique de jeu principale |
| `OdinAI.cs` | `getBestMove()` + `minimax()` | Intelligence artificielle |
| `UIManager.cs` | Manipulation DOM | Interface utilisateur |
| `AIBufferVisualizer.cs` | Animations CSS + `highlightCell()` | Visualisation IA |
| `ServerManager.cs` | *(Retiré)* | Réseau (non nécessaire pour le web) |

### Algorithme IA

L'IA utilise l'**algorithme Minimax optimisé** avec les améliorations suivantes :
- **Élagage Alpha-Beta** pour réduire l'espace de recherche
- **Table de transposition** pour éviter les recalculs de positions identiques
- **Tri des coups** pour explorer les meilleures options en premier
- **Heuristique des coups tueurs** pour améliorer l'ordre d'exploration
- **Évaluation heuristique améliorée** des positions pour les nœuds terminaux
- **Terminaison précoce** pour les coups gagnants immédiats
- **Profondeur configurable** (2-5 niveaux) pour ajuster la difficulté
- **Visualisation des coups** avec surlignage des meilleures options
- **Monitoring de performance** avec statistiques temps réel

#### Optimisations de Performance
- **Vitesse** : 20-100x plus rapide selon la position (0.3ms pour ouvertures vs 1000ms+)
- **Efficacité** : 70-90% de réduction du nombre de nœuds explorés
- **Scalabilité** : Peut gérer des profondeurs importantes (jusqu'à 5+)
- **Qualité** : Maintient l'excellence des décisions tactiques
- **Réactivité** : Interface jamais bloquée grâce aux Web Workers

## 🎨 Interface utilisateur

### Design
- **Thème moderne** avec dégradé violet et composants glassmorphism
- **Grille 5x5** avec cases interactives et animations fluides
- **Panneau de contrôle** avec boutons et paramètres IA
- **Visualisation temps réel** des calculs de l'intelligence artificielle
- **Design responsive** adaptatif aux différentes tailles d'écran

### Accessibilité
- **Contrôles clavier** pour une utilisation sans souris
- **Indicateurs visuels** clairs pour l'état du jeu
- **Animations fluides** pour guider l'utilisateur
- **Texte français** avec interface intuitive

## 🚀 Lancement rapide

### Option 1 : Serveur HTTP simple
```bash
# Avec Python 3
python3 -m http.server 8000

# Avec Node.js
npx serve .

# Puis ouvrir http://localhost:8000
```

### Option 2 : Ouverture directe
Double-cliquez sur `index.html` ou ouvrez-le dans votre navigateur.

### 🧪 Test des performances
Pour comparer les performances de l'IA optimisée :
```bash
# Ouvrir les outils de benchmark
open ai-benchmark.html      # Test de performance individual
open comparison.html        # Comparaison original vs optimisé

# Voir les statistiques détaillées dans la console browser
# Exemple de sortie pour profondeur 5:
# Profondeur 1: 1.1ms, Score: 280
# Profondeur 2: 8.3ms, Score: 50
# Profondeur 3: 34.9ms, Score: 430
# Profondeur 4: 119.4ms, Score: 30
# Profondeur 5: 660.8ms, Score: 870
# Temps: 824.5ms | Nœuds: 70478 | Coupures: 16436 | TT: 4677 | PV: 322
```

## 🎯 Améliorations apportées

### Par rapport à la version Unity
1. **🌐 Accessibilité web** - Disponible sur tout navigateur moderne
2. **📱 Responsive design** - Adapté aux mobiles et tablettes  
3. **⚡ Performance** - Chargement instantané, pas d'installation
4. **🎨 Interface modernisée** - Design web moderne et attrayant
5. **🔧 Simplicité** - Aucune dépendance externe nécessaire

### Nouvelles fonctionnalités
- **🚀 IA Optimisée** - Performance 2-5x supérieure avec algorithmes avancés
- **📊 Monitoring temps réel** - Statistiques de performance dans la console
- **🎛️ Réglage de la vitesse** de visualisation IA
- **🔄 Toggle** pour activer/désactiver la visualisation
- **⚙️ Sélection de difficulté** en temps réel (2-5 niveaux)
- **🎨 Animations CSS** pour les interactions
- **🧪 Outils de benchmark** pour tester les performances

### Optimisations IA Avancées
- **🧠 Table de transposition** - Memoization des positions évaluées
- **🎯 Tri des coups** - Exploration intelligente des meilleures options
- **⚡ Coups tueurs** - Heuristique pour améliorer l'élagage
- **🎨 Évaluation améliorée** - Contrôle du centre et patterns tactiques
- **🏃 Terminaison précoce** - Arrêt immédiat sur coups gagnants
- **🔄 Recherche itérative** - Profondeur progressive avec coups de secours
- **🎭 Principal Variation Search** - Variante optimisée d'alpha-beta
- **📚 Livre d'ouvertures** - Coups pré-calculés pour début de partie
- **⚙️ Web Workers** - Calculs en arrière-plan sans bloquer l'interface
- **📊 Heuristique d'historique** - Apprentissage des coups efficaces

## 🔧 Développement

### Technologies utilisées
- **HTML5** - Structure sémantique
- **CSS3** - Styles modernes avec Flexbox/Grid
- **JavaScript ES6+** - Logique applicative
- **Web APIs** - Manipulation DOM native

### Code source
Le code est entièrement commenté et structuré de manière modulaire pour faciliter la maintenance et les contributions.

### Outils de développement
- **🧪 `ai-benchmark.html`** - Outil de benchmark pour tester les performances
- **⚖️ `comparison.html`** - Comparaison entre IA originale et optimisée  
- **📚 `OPTIMIZATIONS.md`** - Documentation des optimisations existantes
- **🚀 `ADVANCED_OPTIMIZATIONS.md`** - Documentation des nouvelles optimisations
- **📊 `PERFORMANCE_COMPARISON.md`** - Comparaison détaillée des performances
- **🎮 `morpion-ai-optimized.js`** - Version autonome de l'IA optimisée
- **⚙️ `ai-worker.js`** - Web Worker pour calculs en arrière-plan

## 📄 Licence

Ce projet est sous licence **GPL v3** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Contribution

N'hésitez pas à forker le projet et proposer des améliorations ! Suggestions d'améliorations :
- **🌐 Mode multijoueur** en ligne avec WebSocket
- **💾 Sauvegarde des parties** en local storage
- **📈 Statistiques de jeu** et historique des performances  
- **🎨 Thèmes personnalisables** et mode sombre
- **📱 Support PWA** (Progressive Web App)
- **🤖 IA Neural** avec apprentissage par renforcement
- **🏆 Système de classement** et défis
- **🔊 Effets sonores** et animations avancées

---

**Transformé avec ❤️ d'Unity vers le Web** 

*Défiez l'IA et montrez vos talents de stratège !* 🎮
