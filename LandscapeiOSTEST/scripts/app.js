
(function() {
  'use strict';

  // Insert injected weather forecast here
  var initialWeatherForecast = {
  };

  var app = {
    isLoading: true,
    hasRequestPending: false,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/



  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/



  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/


  /*****************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this getting started guide, we've used localStorage.
   *   localStorage is a syncronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   *
   ****************************************************************************/


  // Add feature check for Service Workers here
  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('/service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();
