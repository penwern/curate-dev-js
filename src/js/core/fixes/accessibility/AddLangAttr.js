(function setHtmlLang() {
  function setLang(user) {
    try {
      // get user language from pydio
      const langCode = user.preferences.get("lang");
      // if user language is set, set it to html element
      if (langCode) {
        document.documentElement.setAttribute('lang', langCode);
      }
    } catch (error) {
      console.warn('Failed to set HTML lang attribute:', error);
      // Optionally set a fallback language
      // document.documentElement.setAttribute('lang', 'en');
    }
  }

  function init() {
    // check if pydio is loaded and user is available and set lang
    if (window.pydio?.user) {
      setLang(pydio.user);
    }

    // observe for user login to handle logged out state
    if (window.pydio) {
      pydio.observe("user_logged", (user) => {
        setLang(user);
      });
    }
  }

  // wait for pydio to be available
  if (window.pydio) {
    init();
  } else {
    const checkInterval = setInterval(() => {
      if (window.pydio) {
        clearInterval(checkInterval);
        init();
      }
    }, 50);
  }
})();