/**
 * Tab / split layout for shop + terminal panels.
 */
(function () {
  const SPLIT_MIN_WIDTH = 960;
  let currentMode = 'shop';

  function isWide() {
    return window.innerWidth >= SPLIT_MIN_WIDTH;
  }

  function setActiveTab(mode) {
    document.querySelectorAll('.view-tab').forEach((tab) => {
      const match =
        tab.dataset.panel === mode ||
        (mode === 'split' && tab.dataset.panel === 'split');
      tab.classList.toggle('active', match);
      tab.setAttribute('aria-selected', match ? 'true' : 'false');
    });
  }

  function setPanelVisibility(mode) {
    currentMode = mode;
    const showcase = document.getElementById('showcase');
    const shopPanel = document.getElementById('panel-shop');
    const termPanel = document.getElementById('panel-terminal');

    if (mode === 'split' && isWide()) {
      showcase.classList.add('split-view');
      shopPanel.hidden = false;
      termPanel.hidden = false;
      setActiveTab('split');
      return;
    }

    showcase.classList.remove('split-view');
    const effective = mode === 'split' ? 'shop' : mode;
    setActiveTab(effective);

    if (effective === 'shop') {
      shopPanel.hidden = false;
      termPanel.hidden = true;
    } else {
      shopPanel.hidden = true;
      termPanel.hidden = false;
    }
    updateMobileSyncBanner(effective);
  }

  function tabForPanel(panel) {
    if (panel === 'terminal') return document.getElementById('tab-terminal');
    if (panel === 'shop') return document.getElementById('tab-shop');
    return null;
  }

  function pulseTab(panel) {
    const tab = tabForPanel(panel);
    if (!tab) return;
    tab.classList.remove('view-tab--sync');
    void tab.offsetWidth;
    tab.classList.add('view-tab--sync');
    window.clearTimeout(tab._syncTimer);
    tab._syncTimer = window.setTimeout(() => {
      tab.classList.remove('view-tab--sync');
    }, 1400);
  }

  function updateMobileSyncBanner(panel) {
    const banner = document.getElementById('mobile-sync-banner');
    const textEl = document.getElementById('mobile-sync-banner-text');
    if (!banner || !textEl || isWide()) return;
    if (!document.body.classList.contains('demo-running')) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    if (panel === 'shop') {
      textEl.textContent = 'Shop updating — UI follows the passing tests';
    } else if (panel === 'terminal') {
      textEl.textContent = 'Tests running — switch to Shop to see the AUT';
    } else {
      textEl.textContent = 'Synced demo — watch the shop update as tests pass';
    }
  }

  function syncBodyLayoutClass() {
    document.body.classList.toggle('layout-mobile', !isWide());
    document.body.classList.toggle('layout-split', isWide());
  }

  function focusPanel(panel, options = {}) {
    const { pulse = true, scroll = true } = options;
    if (isWide()) {
      if (currentMode !== 'split') setPanelVisibility('split');
      return;
    }
    if (panel === 'terminal' || panel === 'shop') {
      const changed = currentMode !== panel;
      setPanelVisibility(panel);
      if (pulse && (changed || document.body.classList.contains('demo-running'))) {
        pulseTab(panel);
      }
      updateMobileSyncBanner(panel);
      if (scroll) {
        document.getElementById('mobile-chrome')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function initTabs() {
    const splitTab = document.getElementById('tab-split');
    if (splitTab) {
      splitTab.hidden = !isWide();
    }

    document.querySelectorAll('.view-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        if (document.body.classList.contains('demo-running')) return;
        const panel = tab.dataset.panel;
        if (panel === 'split' && !isWide()) return;
        setPanelVisibility(panel);
      });
    });

    window.addEventListener('resize', () => {
      syncBodyLayoutClass();
      if (splitTab) splitTab.hidden = !isWide();
      const showcase = document.getElementById('showcase');
      if (!isWide() && showcase.classList.contains('split-view')) {
        setPanelVisibility('shop');
      } else if (isWide() && document.getElementById('tab-split')?.classList.contains('active')) {
        setPanelVisibility('split');
      } else if (isWide() && document.body.classList.contains('demo-running')) {
        setPanelVisibility('split');
      }
      updateMobileSyncBanner(currentMode === 'split' ? 'shop' : currentMode);
    });

    syncBodyLayoutClass();
    if (isWide()) {
      setPanelVisibility('split');
    } else {
      setPanelVisibility('shop');
    }
  }

  window.ShowcaseLayout = { focusPanel, setPanelVisibility, pulseTab, updateMobileSyncBanner };

  document.addEventListener('DOMContentLoaded', initTabs);
})();
