
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { WordManager } from './components/WordManager';
import { VisualStylesSection } from './components/StyleEditor';
import { ScenariosSection, EnginesSection, InteractionSection, AnkiSection, PageWidgetSection, GeneralSection, ConfigManagementSection } from './components/Settings';
import { PreviewSection } from './components/settings/PreviewSection'; 
import { WordDetail } from './components/WordDetail'; // Import new component
import { Loader2 } from 'lucide-react';
import { AppView, SettingSectionId, Scenario, WordEntry, PageWidgetConfig, WordInteractionConfig, TranslationEngine, AnkiConfig, AutoTranslateConfig, StyleConfig, WordCategory, OriginalTextConfig, DictionaryEngine, WordTab } from './types';
import { DEFAULT_STYLES, DEFAULT_ORIGINAL_TEXT_CONFIG, DEFAULT_WORD_INTERACTION, DEFAULT_PAGE_WIDGET, INITIAL_ENGINES, DEFAULT_ANKI_CONFIG, DEFAULT_AUTO_TRANSLATE, INITIAL_SCENARIOS, INITIAL_DICTIONARIES, DEFAULT_STYLE } from './constants';
import { entriesStorage, scenariosStorage, pageWidgetConfigStorage, autoTranslateConfigStorage, enginesStorage, ankiConfigStorage, seedInitialData, stylesStorage, originalTextConfigStorage, interactionConfigStorage, dictionariesStorage } from './utils/storage';
import { preloadVoices } from './utils/audio';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeSettingSection, setActiveSettingSection] = useState<SettingSectionId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailWord, setDetailWord] = useState<string>(''); // For word-detail view
  
  // State to pass down to WordManager for deep linking
  const [initialManagerTab, setInitialManagerTab] = useState<WordTab | undefined>(undefined);
  const [initialManagerSearch, setInitialManagerSearch] = useState<string>('');

  // --- Persistent State from Storage ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [pageWidgetConfig, setPageWidgetConfig] = useState<PageWidgetConfig>(DEFAULT_PAGE_WIDGET);
  const [autoTranslate, setAutoTranslate] = useState<AutoTranslateConfig>(DEFAULT_AUTO_TRANSLATE);
  const [engines, setEngines] = useState<TranslationEngine[]>(INITIAL_ENGINES);
  const [dictionaries, setDictionaries] = useState<DictionaryEngine[]>(INITIAL_DICTIONARIES);
  const [ankiConfig, setAnkiConfig] = useState<AnkiConfig>(DEFAULT_ANKI_CONFIG);
  const [styles, setStyles] = useState<Record<WordCategory, StyleConfig>>(DEFAULT_STYLES);
  const [originalTextConfig, setOriginalTextConfig] = useState<OriginalTextConfig>(DEFAULT_ORIGINAL_TEXT_CONFIG);
  const [interactionConfig, setInteractionConfig] = useState<WordInteractionConfig>(DEFAULT_WORD_INTERACTION);

  // Load data on mount
  useEffect(() => {
    preloadVoices(); 
    
    // Check URL params for routing (e.g., from Word Bubble)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const wordParam = params.get('word');
    const tabParam = params.get('tab');
    const searchParam = params.get('search');

    if (viewParam === 'word-detail' && wordParam) {
        setDetailWord(wordParam);
        setCurrentView('word-detail');
    } else if (viewParam === 'words') {
        setCurrentView('words');
        if (tabParam) setInitialManagerTab(tabParam as WordTab);
        if (searchParam) setInitialManagerSearch(searchParam);
    }

    const loadData = async () => {
      await seedInitialData();
      
      // Forced Migration for Dictionary Priorities
      const currentDicts = await dictionariesStorage.getValue();
      const iciba = currentDicts.find(d => d.id === 'iciba');
      
      let finalDictionaries = currentDicts;
      if (iciba && iciba.priority !== 1) {
          finalDictionaries = currentDicts.map(d => {
              if (d.id === 'iciba') return { ...d, priority: 1 };
              if (d.id === 'youdao') return { ...d, priority: 2 };
              return d;
          });
          await dictionariesStorage.setValue(finalDictionaries);
      }
      setDictionaries(finalDictionaries);

      const [s, e, p, a, eng, ank, sty, orig, interact] = await Promise.all([
        scenariosStorage.getValue(),
        entriesStorage.getValue(),
        pageWidgetConfigStorage.getValue(),
        autoTranslateConfigStorage.getValue(),
        enginesStorage.getValue(),
        ankiConfigStorage.getValue(),
        stylesStorage.getValue(),
        originalTextConfigStorage.getValue(),
        interactionConfigStorage.getValue(),
      ]);
      
      // Data Migration: Anki Config
      // Always merge with DEFAULT to ensure new fields (like templates) are populated if missing in storage
      let finalAnkiConfig = { ...DEFAULT_ANKI_CONFIG, ...ank };
      
      // Handle legacy deck name migration (if user had old single deck config)
      const oldDeckName = (ank as any).deckName;
      if (oldDeckName && !finalAnkiConfig.deckNameLearning) {
          finalAnkiConfig.deckNameLearning = oldDeckName;
      }

      // Data Migration: Style Config (Add originalText object if missing)
      const migratedStyles = { ...DEFAULT_STYLES };
      Object.keys(sty).forEach(key => {
          const category = key as WordCategory;
          migratedStyles[category] = {
              ...DEFAULT_STYLE, // Base defaults
              ...sty[category], // User saved styles
              originalText: sty[category].originalText || DEFAULT_STYLE.originalText // Migrate originalText
          };
      });

      setScenarios(s);
      setEntries(e);
      setPageWidgetConfig(p);
      setAutoTranslate(a);
      setEngines(eng);
      setAnkiConfig(finalAnkiConfig);
      setStyles(migratedStyles);
      setOriginalTextConfig(orig);
      setInteractionConfig(interact);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Auto-save
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
        Promise.all([
            entriesStorage.setValue(entries),
            scenariosStorage.setValue(scenarios),
            pageWidgetConfigStorage.setValue(pageWidgetConfig),
            autoTranslateConfigStorage.setValue(autoTranslate),
            enginesStorage.setValue(engines),
            dictionariesStorage.setValue(dictionaries),
            ankiConfigStorage.setValue(ankiConfig),
            stylesStorage.setValue(styles),
            originalTextConfigStorage.setValue(originalTextConfig),
            interactionConfigStorage.setValue(interactionConfig),
        ]).catch(err => console.error("Auto-save failed:", err));
    }, 800);
    return () => clearTimeout(timer);
  }, [entries, scenarios, pageWidgetConfig, autoTranslate, engines, dictionaries, ankiConfig, styles, originalTextConfig, interactionConfig, isLoading]);

  const scrollToSetting = (id: SettingSectionId) => {
    setCurrentView('settings');
    setActiveSettingSection(id);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -30; 
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  // 跳转到详情页的处理函数
  const handleOpenWordDetail = (word: string) => {
      setDetailWord(word);
      setCurrentView('word-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Configuration Import Logic ---
  const handleConfigImport = async (newConfig: any) => {
      const promises = [];

      // 1. General (Deep Merge)
      if (newConfig.general) {
          const merged = { ...DEFAULT_AUTO_TRANSLATE, ...newConfig.general };
          setAutoTranslate(merged);
          promises.push(autoTranslateConfigStorage.setValue(merged));
      }

      // 2. Styles (Deep Merge per Category)
      if (newConfig.styles) {
          const mergedStyles = { ...DEFAULT_STYLES };
          Object.keys(newConfig.styles).forEach(key => {
              const cat = key as WordCategory;
              if (mergedStyles[cat]) {
                  mergedStyles[cat] = {
                      ...mergedStyles[cat],
                      ...newConfig.styles[cat],
                      // Deep merge critical nested objects to avoid "undefined" errors
                      originalText: { ...mergedStyles[cat].originalText, ...(newConfig.styles[cat].originalText || {}) },
                      horizontal: { ...mergedStyles[cat].horizontal, ...(newConfig.styles[cat].horizontal || {}) },
                      vertical: { ...mergedStyles[cat].vertical, ...(newConfig.styles[cat].vertical || {}) },
                  };
              }
          });
          setStyles(mergedStyles);
          promises.push(stylesStorage.setValue(mergedStyles));
      }

      // 3. Scenarios (Replace)
      if (newConfig.scenarios && Array.isArray(newConfig.scenarios)) {
          setScenarios(newConfig.scenarios);
          promises.push(scenariosStorage.setValue(newConfig.scenarios));
      }

      // 4. Interaction (Deep Merge)
      if (newConfig.interaction) {
          const merged = { ...DEFAULT_WORD_INTERACTION, ...newConfig.interaction };
          setInteractionConfig(merged);
          promises.push(interactionConfigStorage.setValue(merged));
      }

      // 5. Page Widget (Deep Merge - Critical for showSections)
      if (newConfig.pageWidget) {
          const base = DEFAULT_PAGE_WIDGET;
          const imported = newConfig.pageWidget;
          const merged: PageWidgetConfig = {
              ...base,
              ...imported,
              // Ensure nested objects exist by merging with base
              modalPosition: { ...base.modalPosition, ...(imported.modalPosition || {}) },
              modalSize: { ...base.modalSize, ...(imported.modalSize || {}) },
              showSections: { ...base.showSections, ...(imported.showSections || {}) },
              // For arrays, prefer imported if valid, else default
              cardDisplay: (imported.cardDisplay && imported.cardDisplay.length) ? imported.cardDisplay : base.cardDisplay
          };
          setPageWidgetConfig(merged);
          promises.push(pageWidgetConfigStorage.setValue(merged));
      }

      // 6. Engines (Replace if valid array)
      if (newConfig.engines && Array.isArray(newConfig.engines)) {
          setEngines(newConfig.engines);
          promises.push(enginesStorage.setValue(newConfig.engines));
      }

      // 7. Anki (Deep Merge - Critical for templates)
      if (newConfig.anki) {
          const base = DEFAULT_ANKI_CONFIG;
          const imported = newConfig.anki;
          const merged: AnkiConfig = {
              ...base,
              ...imported,
              syncScope: { ...base.syncScope, ...(imported.syncScope || {}) },
              templates: { ...base.templates, ...(imported.templates || {}) }
          };
          setAnkiConfig(merged);
          promises.push(ankiConfigStorage.setValue(merged));
      }
      
      await Promise.all(promises);
  };

  // Bundle current configs for export
  const currentConfigs = {
      general: autoTranslate,
      styles: styles,
      scenarios: scenarios,
      interaction: interactionConfig,
      pageWidget: pageWidgetConfig,
      engines: engines,
      anki: ankiConfig
  };

  if (isLoading && entries.length === 0) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-blue-600 animate-spin"/></div>;
  }

  // Handle Full Screen Views (like Word Detail)
  if (currentView === 'word-detail') {
      return (
          <WordDetail 
             word={detailWord} 
             onBack={() => {
                 // If opened via URL (new tab), closing might be better or going to dashboard
                 if (window.history.length > 1) {
                     // 尝试返回上一个视图，如果是直接打开详情，则返回 dashboard
                     setCurrentView('dashboard');
                 } else {
                     // If it's a standalone tab opened by bubble, allow "Back" to go to dashboard too
                     setCurrentView('dashboard');
                 }
             }} 
          />
      );
  }

  return (
    <div className="flex min-h-screen bg-slate-100/50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onSettingScroll={scrollToSetting}
        activeSettingSection={activeSettingSection}
      />

      <main className="flex-1 ml-64 p-8 pb-32">
        <div className="max-w-6xl mx-auto">
          
          {currentView === 'dashboard' && (
             <div className="animate-in fade-in duration-300">
               <Dashboard entries={entries} scenarios={scenarios} />
             </div>
          )}

          {currentView === 'words' && (
             <div className="animate-in fade-in duration-300">
               <WordManager 
                  scenarios={scenarios} 
                  entries={entries} 
                  setEntries={setEntries} 
                  ttsSpeed={autoTranslate.ttsSpeed || 1.0}
                  initialTab={initialManagerTab}
                  initialSearchQuery={initialManagerSearch}
                  onOpenDetail={handleOpenWordDetail} // 绑定回调
               />
             </div>
          )}

          {currentView === 'settings' && (
             <div className="space-y-12 animate-in fade-in duration-300">
                <section id="general" className="scroll-mt-8">
                  <GeneralSection config={autoTranslate} setConfig={setAutoTranslate} />
                </section>

                <section id="visual-styles" className="scroll-mt-8">
                  <VisualStylesSection 
                    styles={styles} 
                    onStylesChange={setStyles} 
                    originalTextConfig={originalTextConfig}
                    onOriginalTextConfigChange={setOriginalTextConfig}
                  />
                </section>

                <section id="scenarios" className="scroll-mt-8">
                  <ScenariosSection scenarios={scenarios} setScenarios={setScenarios} />
                </section>
                
                <section id="word-bubble" className="scroll-mt-8">
                  <InteractionSection config={interactionConfig} setConfig={setInteractionConfig} />
                </section>

                <section id="page-widget" className="scroll-mt-8">
                   <PageWidgetSection widget={pageWidgetConfig} setWidget={setPageWidgetConfig} onOpenDetail={handleOpenWordDetail} />
                </section>

                <section id="engines" className="scroll-mt-8">
                  <EnginesSection engines={engines} setEngines={setEngines} dictionaries={dictionaries} />
                </section>

                <section id="preview" className="scroll-mt-8">
                   <PreviewSection 
                      engines={engines} 
                      entries={entries} 
                      styles={styles} 
                      originalTextConfig={originalTextConfig} 
                      autoTranslateConfig={autoTranslate}
                   />
                </section>

                <section id="anki" className="scroll-mt-8">
                  <AnkiSection config={ankiConfig} setConfig={setAnkiConfig} entries={entries} setEntries={setEntries} />
                </section>

                <section id="config-management" className="scroll-mt-8">
                  <ConfigManagementSection currentConfigs={currentConfigs} onImport={handleConfigImport} />
                </section>
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
