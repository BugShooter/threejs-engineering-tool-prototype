(function() {
  const tool = window.EngineeringTool;
  const DEFAULT_LOCALE = 'en';
  const STORAGE_KEY = 'engineering-tool.locale';

  tool.i18n = tool.i18n || {};
  tool.i18n.locales = tool.i18n.locales || {};

  function getPathValue(source, path) {
    if (!source || typeof path !== 'string' || !path) {
      return undefined;
    }

    return path.split('.').reduce(function(current, segment) {
      if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
        return current[segment];
      }
      return undefined;
    }, source);
  }

  function interpolate(template, replacements) {
    if (typeof template !== 'string' || !replacements) {
      return template;
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function(match, key) {
      if (!Object.prototype.hasOwnProperty.call(replacements, key)) {
        return match;
      }
      return `${replacements[key]}`;
    });
  }

  function normalizeLocale(locale) {
    if (typeof locale !== 'string' || !locale.trim()) {
      return DEFAULT_LOCALE;
    }
    return locale.trim().toLowerCase().split('-')[0];
  }

  function createI18n() {
    const subscribers = [];
    let locale = DEFAULT_LOCALE;

    function hasLocale(candidate) {
      return Object.prototype.hasOwnProperty.call(tool.i18n.locales, candidate);
    }

    function resolveLocale(candidate) {
      const normalized = normalizeLocale(candidate);
      return hasLocale(normalized) ? normalized : DEFAULT_LOCALE;
    }

    function persistLocale(nextLocale) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextLocale);
      } catch (error) {
        return;
      }
    }

    function readStoredLocale() {
      try {
        return window.localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        return null;
      }
    }

    function notify() {
      const snapshot = subscribers.slice();
      for (const subscriber of snapshot) {
        subscriber(locale);
      }
    }

    function syncDocumentLanguage() {
      if (document && document.documentElement) {
        document.documentElement.lang = locale;
      }
    }

    function t(key, replacements) {
      const currentMessages = tool.i18n.locales[locale] || {};
      const defaultMessages = tool.i18n.locales[DEFAULT_LOCALE] || {};
      const value = getPathValue(currentMessages, key);
      const fallback = value === undefined ? getPathValue(defaultMessages, key) : value;
      if (typeof fallback !== 'string') {
        return key;
      }
      return interpolate(fallback, replacements);
    }

    function applyStaticTranslations(root) {
      const scope = root || document;
      if (!scope || typeof scope.querySelectorAll !== 'function') {
        return;
      }

      scope.querySelectorAll('[data-i18n]').forEach(function(element) {
        element.textContent = t(element.dataset.i18n);
      });

      scope.querySelectorAll('[data-i18n-title]').forEach(function(element) {
        element.title = t(element.dataset.i18nTitle);
      });

      scope.querySelectorAll('[data-i18n-aria-label]').forEach(function(element) {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
      });

      scope.querySelectorAll('[data-i18n-placeholder]').forEach(function(element) {
        element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
      });
    }

    function setLocale(nextLocale, options) {
      const resolved = resolveLocale(nextLocale);
      const force = Boolean(options && options.force);
      if (!force && resolved === locale) {
        return locale;
      }
      locale = resolved;
      persistLocale(locale);
      syncDocumentLanguage();
      notify();
      return locale;
    }

    function subscribe(callback) {
      if (typeof callback !== 'function') {
        return function() {};
      }
      subscribers.push(callback);
      return function() {
        const index = subscribers.indexOf(callback);
        if (index >= 0) {
          subscribers.splice(index, 1);
        }
      };
    }

    function registerLocale(nextLocale, messages) {
      tool.i18n.locales[normalizeLocale(nextLocale)] = messages || {};
    }

    locale = resolveLocale(readStoredLocale());
    syncDocumentLanguage();

    return {
      t: t,
      setLocale: setLocale,
      getLocale: function() {
        return locale;
      },
      getSupportedLocales: function() {
        return Object.keys(tool.i18n.locales);
      },
      subscribe: subscribe,
      registerLocale: registerLocale,
      applyStaticTranslations: applyStaticTranslations,
      refresh: function() {
        syncDocumentLanguage();
        notify();
      }
    };
  }

  tool.i18n.createI18n = createI18n;
  tool.i18n.instance = tool.i18n.instance || createI18n();
})();