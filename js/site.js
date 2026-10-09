/**
 * FBI IC3 RAT Site Interactive Controller
 * Handles Navigation Dropdowns, Mobile Navigation Drawer, Accordions, Modals, and Search Results.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initBannerAccordion();
    initMegamenus();
    initMobileNav();
    initModals();
    initFooterReturnToTop();
    initSearchEngine();
  });

  /**
   * Official US Government Banner Accordion Toggle
   */
  function initBannerAccordion() {
    const bannerButtons = document.querySelectorAll('.usa-banner__button, .usa-banner__header-action');
    const bannerContents = document.querySelectorAll('.usa-banner__content, #gov-banner-default');

    // Ensure closed by default on page load
    bannerContents.forEach((content) => {
      content.hidden = true;
      content.style.display = 'none';
    });

    bannerButtons.forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !isExpanded;

        bannerButtons.forEach((b) => b.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false'));
        bannerContents.forEach((content) => {
          content.hidden = !nextExpanded;
          content.style.display = nextExpanded ? 'block' : 'none';
        });
      });
    });
  }

  /**
   * Primary Megamenu Dropdown Accordions
   */
  function initMegamenus() {
    const menuButtons = document.querySelectorAll('.usa-nav__primary .usa-accordion__button');

    menuButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const controlsId = button.getAttribute('aria-controls');
        const targetSubmenu = controlsId ? document.getElementById(controlsId) : null;
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        // Close all submenus
        menuButtons.forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          const id = b.getAttribute('aria-controls');
          if (id) {
            const sub = document.getElementById(id);
            if (sub) sub.classList.remove('is-visible');
          }
        });

        // Toggle current submenu
        if (!isExpanded && targetSubmenu) {
          button.setAttribute('aria-expanded', 'true');
          targetSubmenu.classList.add('is-visible');
        }
      });
    });

    // Close menus on outside click or Escape
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.usa-nav__primary')) {
        menuButtons.forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          const id = b.getAttribute('aria-controls');
          if (id) {
            const sub = document.getElementById(id);
            if (sub) sub.classList.remove('is-visible');
          }
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menuButtons.forEach((b) => {
          b.setAttribute('aria-expanded', 'false');
          const id = b.getAttribute('aria-controls');
          if (id) {
            const sub = document.getElementById(id);
            if (sub) sub.classList.remove('is-visible');
          }
        });
      }
    });
  }

  /**
   * Mobile Hamburger Navigation Drawer
   */
  function initMobileNav() {
    const menuBtn = document.querySelector('.usa-menu-btn');
    const navCloseBtn = document.querySelector('.usa-nav__close');
    const nav = document.querySelector('.usa-nav');
    const overlay = document.querySelector('.usa-overlay');

    function openMobileNav() {
      if (nav) nav.classList.add('is-visible');
      if (overlay) overlay.classList.add('is-visible');
      document.body.classList.add('is-nav-open');
    }

    function closeMobileNav() {
      if (nav) nav.classList.remove('is-visible');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.classList.remove('is-nav-open');
    }

    if (menuBtn) menuBtn.addEventListener('click', openMobileNav);
    if (navCloseBtn) navCloseBtn.addEventListener('click', closeMobileNav);
    if (overlay) overlay.addEventListener('click', closeMobileNav);

    // Auto-close mobile nav on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) {
        closeMobileNav();
      }
    });
  }

  /**
   * Modal Dialog Controller (#fileTerms)
   */
  function initModals() {
    const modalTriggers = document.querySelectorAll('[data-open-modal], [href="#fileTerms"], [aria-controls="fileTerms"], #fileComplaintHero');
    const modalCloseButtons = document.querySelectorAll('[data-close-modal]');
    const fileTermsModal = document.getElementById('fileTerms');

    function openModal(modal) {
      if (!modal) return;
      if (modal.parentNode !== document.body) {
        document.body.appendChild(modal);
      }
      // Reset scroll BEFORE showing so it appears at top instantly
      modal.scrollTop = 0;
      const inner = modal.querySelector('.usa-modal__content');
      if (inner) inner.scrollTop = 0;
      const mainEl = modal.querySelector('.usa-modal__main');
      if (mainEl) mainEl.scrollTop = 0;
      modal.classList.add('is-visible');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-modal-open');
    }

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-modal-open');
    }

    modalTriggers.forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        const href = trigger.getAttribute('href');
        const ariaControls = trigger.getAttribute('aria-controls');
        if (href === '#fileTerms' || ariaControls === 'fileTerms' || trigger.hasAttribute('data-open-modal')) {
          e.preventDefault();
          openModal(fileTermsModal);
        }
      });
    });

    modalCloseButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = btn.closest('.usa-modal') || fileTermsModal;
        closeModal(modal);
      });
    });

    if (fileTermsModal) {
      fileTermsModal.addEventListener('click', (e) => {
        if (e.target === fileTermsModal) {
          closeModal(fileTermsModal);
        }
      });
    }

    // Modal Accept Button redirection
    const acceptFileBtn = document.getElementById('acceptFile');
    if (acceptFileBtn) {
      acceptFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(fileTermsModal);
        // Find relative path to complaint.html depending on current depth
        const currentPath = window.location.pathname;
        let complaintUrl = 'complaint.html';
        if (currentPath.includes('/AnnualReport/Reports/')) {
          complaintUrl = '../../../complaint.html';
        } else if (currentPath.match(/\/(PSA|CSA)\/20\d{2}\//)) {
          complaintUrl = '../../complaint.html';
        } else if (currentPath.includes('/Home/') || currentPath.includes('/CrimeInfo/') || currentPath.includes('/Outreach/') || currentPath.includes('/PSA/') || currentPath.includes('/CSA/') || currentPath.includes('/AnnualReport/') || currentPath.includes('/Search/') || currentPath.includes('/complaint/')) {
          complaintUrl = '../complaint.html';
        }
        window.location.href = complaintUrl;
      });
    }
  }

  /**
   * Return to Top Link
   */
  function initFooterReturnToTop() {
    const returnToTopLinks = document.querySelectorAll('.usa-footer__return-to-top a');
    returnToTopLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /**
   * Client-Side Search Engine for Search/Results.html
   */
  function initSearchEngine() {
    const resultsContainer = document.getElementById('searchResults') || document.querySelector('.search-results-list');
    if (!resultsContainer && !window.location.pathname.includes('Search/Results.html')) {
      return;
    }

    const searchHeading = document.getElementById('searchQueryHeading') || document.querySelector('h1, h2');
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('term') || urlParams.get('q') || '';

    if (searchHeading && query) {
      searchHeading.textContent = `Search Results for "${query}"`;
    }

    // Calculate relative path to search_index.json
    let indexPath = 'search_index.json';
    const currentPath = window.location.pathname;
    if (currentPath.includes('/Search/')) {
      indexPath = '../search_index.json';
    } else if (currentPath.includes('/AnnualReport/Reports/')) {
      indexPath = '../../../search_index.json';
    } else if (currentPath.match(/\/(Home|CrimeInfo|Outreach|PSA|CSA|AnnualReport|complaint)\//)) {
      indexPath = '../search_index.json';
    }

    fetch(indexPath)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const lowerQuery = query.toLowerCase().trim();
        const results = data.filter((item) => {
          if (!lowerQuery) return true;
          const titleMatch = item.title && item.title.toLowerCase().includes(lowerQuery);
          const bodyMatch = item.body && item.body.toLowerCase().includes(lowerQuery);
          const pathMatch = item.path && item.path.toLowerCase().includes(lowerQuery);
          return titleMatch || bodyMatch || pathMatch;
        });

        renderSearchResults(results, query, indexPath);
      })
      .catch((err) => {
        console.error('Failed to load search index:', err);
      });
  }

  function renderSearchResults(results, query, indexPath) {
    const targetElement = document.getElementById('searchResults') || document.querySelector('.search-results-container') || document.querySelector('main');
    if (!targetElement) return;

    // Calculate depth back to root
    let rootPrefix = '';
    if (indexPath.startsWith('../../../')) {
      rootPrefix = '../../../';
    } else if (indexPath.startsWith('../')) {
      rootPrefix = '../';
    }

    if (results.length === 0) {
      targetElement.innerHTML = `
        <div class="usa-alert usa-alert--info margin-top-2">
          <div class="usa-alert__body">
            <h3 class="usa-alert__heading">No Results Found</h3>
            <p class="usa-alert__text">No pages matched your search query "${query}". Please try different keywords.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = `
      <p class="margin-bottom-2">Found <strong>${results.length}</strong> matching pages:</p>
      <ul class="usa-collection">
    `;

    results.slice(0, 50).forEach((item) => {
      const pageTitle = item.title || item.path.split('/').pop().replace('.html', '');
      let linkPath = rootPrefix + item.path;
      // Excerpt snippet
      let snippet = item.body ? item.body.substring(0, 180) + '...' : '';

      html += `
        <li class="usa-collection__item padding-2 margin-bottom-2" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px;">
          <div class="usa-collection__body">
            <h3 class="usa-collection__heading margin-0">
              <a class="usa-link text-bold" href="${linkPath}">${pageTitle}</a>
            </h3>
            <p class="text-secondary font-mono-xs margin-top-05 margin-bottom-1">${item.path}</p>
            <p class="margin-0 font-sans-xs">${snippet}</p>
          </div>
        </li>
      `;
    });

    html += '</ul>';
    targetElement.innerHTML = html;
  }
})();
