/**
 * Tab / split layout for shop + terminal panels.
 */
(function () {
  const SPLIT_MIN_WIDTH = 960;

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
  }

  function initTabs() {
    const splitTab = document.getElementById('tab-split');
    if (splitTab) {
      splitTab.hidden = !isWide();
    }

    document.querySelectorAll('.view-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const panel = tab.dataset.panel;
        if (panel === 'split' && !isWide()) return;
        setPanelVisibility(panel);
      });
    });

    window.addEventListener('resize', () => {
      if (splitTab) splitTab.hidden = !isWide();
      const showcase = document.getElementById('showcase');
      if (!isWide() && showcase.classList.contains('split-view')) {
        setPanelVisibility('shop');
      } else if (isWide() && document.getElementById('tab-split')?.classList.contains('active')) {
        setPanelVisibility('split');
      }
    });

    if (isWide()) {
      setPanelVisibility('split');
    } else {
      setPanelVisibility('shop');
    }
  }

  document.addEventListener('DOMContentLoaded', initTabs);
})();
