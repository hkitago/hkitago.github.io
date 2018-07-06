'use strict';

(function() {
  let dbPromise;
  let settings = {
    appearance: 'Dark',
    font: 'System Default',
    language: 'English',
    gameFor: 'Match',
    matchTo: 3,
    isCrawford: false,
    isPostCrawford: false,
    score: [0,0],
    created: Date.now()
  };
  let undoLogs = [];
  let undoSettings = {};
  let addIntvalID;
  let maxMatch;
  
  import('../lib/idb.js')
    .then(() => {
      //check for support
      if(!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
      }
      //idb.delete('bgsb-db').then(() => console.log('done!'));
      dbPromise = idb.open('bgsb-db', 1, function(upgradeDb) {
        switch(upgradeDb.oldVersion) {
          case 0:
            if(!upgradeDb.objectStoreNames.contains('logs')) {
              const logsOS = upgradeDb.createObjectStore('logs', {keyPath: 'id', autoIncrement: true});
              logsOS.createIndex('id', 'id', {unique: true});
            }
            if(!upgradeDb.objectStoreNames.contains('settings')) {
              upgradeDb.createObjectStore('settings');
            }
        }
      });
      dbPromise.then(function(db) {
        return db.transaction('settings', 'readonly').objectStore('settings').get(1);
      }).catch(function(e) {
        tx.abort();
        //console.log(e);
      }).then(function(val) {
        if(val !== undefined) {
          settings = val;
        }
        setMaxMatch.call(this);
        // Initialize Scoreboard Pane
        updateFontFamily.call(this);
        localizeStrings.call(this);
        updateMatchInfoPane.call(this);
        updateCrawfordInfoPane.call(this);
        updateResetBtn.call(this);
        updateScoreBoardPane.call(this);
        // Initialize Settings Pane
        document.getElementById('appearance-style').setAttribute('href', 'styles/' + settings.appearance.toLowerCase() + '.css');
        document.getElementById('appearance-option').value = settings.appearance;
        document.getElementById('font-option').value = settings.font;
        document.getElementById('language-option').value = settings.language;
        document.getElementById('game-option').value = settings.gameFor;
        document.getElementById('pts-option').value = settings.matchTo;

        // Initialize Scoresheet
        dbPromise.then(function(db) {
          return db.transaction('logs', 'readonly').objectStore('logs').getAll();
        }).then(function(items) {
          for(let i = 0, max = items.length; i < max; i++){
            createScoresheetList.call(this, items[i].score, items[i].id);
          }
        });
      });
    });

  /*****************************************************************************
   *
   * Event listeners when flipping Settings Pane
   *
   ****************************************************************************/

  document.getElementById('settings').addEventListener('click', function() {
    clearInterval(addIntvalID);
    addLogs.call(this);
    updateResetBtn.call(this);
    document.querySelector('.container').classList.add('hover');
  }, {passive:false});
  
  document.getElementById('done-btn').addEventListener('click', function() {
    document.querySelector('.container').classList.toggle('hover');
    undoLogs = [];
    updateUndoBtn.call(this);
  }, {passive:false});
  
  /*****************************************************************************
   *
   * Event listeners for settings UI
   *
   ****************************************************************************/

  document.getElementById('appearance-option').addEventListener('change', function() {
    settings.appearance = this.value;
    updateSettingsOS.call(this);
    document.getElementById('appearance-style').setAttribute('href', 'styles/' + settings.appearance.toLowerCase() + '.css');
  });

  document.getElementById('font-option').addEventListener('change', function() {
    settings.font = this.value;
    updateSettingsOS.call(this);
    updateFontFamily.call(this);
  });

  document.getElementById('language-option').addEventListener('change', function() {
    settings.language = this.value;
    updateSettingsOS.call(this);
    localizeStrings.call(this);
  });

  document.getElementById('game-option').addEventListener('change', function() {
    undoLogs = [];
    settings.gameFor = this.value;
    updateMatchInfoPane.call(this);
    setMaxMatch.call(this);
    updateUndoBtn.call(this);
    resetScore.call(this);
  });
  
  document.getElementById('pts-option').addEventListener('change', function() {
    undoLogs = [];
    settings.matchTo = Number(this.value);
    document.getElementById('match-info').children[0].textContent = settings.matchTo;
    setMaxMatch.call(this);
    updateUndoBtn.call(this);
    resetScore.call(this);
  });

  /*****************************************************************************
   *
   * Methods to update on Board Pane
   *
   ****************************************************************************/

  const updateMatchInfoPane = function(){
    if(settings.gameFor === 'Match') {
      document.getElementById('pts-option').removeAttribute('disabled');
      document.getElementById('match-to').classList.remove('disabled');
      document.getElementById('match-info').children[0].textContent = settings.matchTo;
      document.getElementById('match-info').children[0].classList.remove('money');
      document.getElementById('crowford-info').classList.remove('disabled');
    } else if(settings.gameFor === 'Money') {
      document.getElementById('pts-option').setAttribute('disabled', 'disabled');
      document.getElementById('match-to').classList.add('disabled');
      document.getElementById('match-info').children[0].textContent = String.fromCodePoint(0x1F4B2); /* emoji: 0x1F4B0 or 0x1F4B2 */
      document.getElementById('match-info').children[0].classList.add('money');
      document.getElementById('crowford-info').classList.add('disabled');
    }
  };

  const updateCrawfordInfoPane = function(){
    if(settings.gameFor === 'Match' && (settings.score[0] < settings.matchTo && settings.score[1] < settings.matchTo)) {
      document.getElementById('crowford-info').children[0].textContent = (settings.isCrawford === true) ? 'Crawford' : ((settings.isPostCrawford === true) ? 'Post-Crawford' : '');
    } else {
      document.getElementById('crowford-info').children[0].textContent = '';
    }
  };

  const updateCrawfordInfo = function(){
    if(settings.gameFor === 'Match') {
      if(settings.isCrawford === true && settings.isPostCrawford === false) {
        settings.isCrawford = false;
        settings.isPostCrawford = true;
      }
      if(settings.isCrawford === false && settings.isPostCrawford === false && (Number(settings.score[0]) === Number(settings.matchTo) - 1 || Number(settings.score[1]) === Number(settings.matchTo) - 1)) {
        settings.isCrawford = true;
      }
    }
  };

  const updateScoreBoardPane = function(){
    const frontNode = document.querySelectorAll('.front');
    const backNode = document.querySelectorAll('.back');
    const boardNode = document.querySelectorAll('.board');
    for(let i = 0, max = boardNode.length; i < max; i++) {
      frontNode[i].children[0].textContent = settings.score[i];
      backNode[i].children[0].textContent = Number(settings.score[i]) + 1;
      boardNode[i].children[0].textContent = settings.score[i];
    }
  };

  /*****************************************************************************
   *
   * Methods to update on Settings Pane
   *
   ****************************************************************************/

  const updateFontFamily = function() {
    document.querySelector('body').style.fontFamily = (settings.font === 'System Default') ? "-apple-system,Roboto,'Droid Sans',sans-serif" : settings.font;
    const selectNodes = document.querySelectorAll('select');
    for(let i = 0, max = selectNodes.length; i < max; i++) {
      selectNodes[i].style.fontFamily = (settings.font === 'System Default') ? "-apple-system,Roboto,'Droid Sans',sans-serif" : settings.font;
    }
  };

  const setMaxMatch = function(){
    maxMatch = settings.gameFor === 'Money' ? 99 : settings.matchTo;
  };

  const updateResetBtn = function(){
    if(settings.score[0] === 0 && settings.score[1] === 0 ) {
      document.getElementById('reset').removeEventListener('click', getUndoData, {passive:false});
      document.getElementById('reset').classList.add('disabled');
    } else {
      document.getElementById('reset').addEventListener('click', getUndoData, {passive:false});
      document.getElementById('reset').classList.remove('disabled');
    }
  };

  const getUndoData = function(){
    undoSettings.gameFor = settings.gameFor;
    undoSettings.matchTo = settings.matchTo;

    dbPromise.then(function(db) {
      return db.transaction('logs', 'readonly').objectStore('logs').getAll();
    }).then(function(items) {
      for(let i = 0, max = items.length; i < max; i++){
        undoLogs.push(items[i]);
      }
      updateUndoBtn.call(this);
      resetScore.call(this);
    });
  };

  const resetScore = function(){
    settings.isCrawford = false;
    settings.isPostCrawford = false;
    settings.score = [0, 0];
    updateScoreBoardPane.call(this);
    if(settings.gameFor === 'Match') {
      document.getElementById('crowford-info').children[0].textContent = '';
    }
    document.getElementById('reset').classList.add('disabled');
    document.getElementById('scoresheet-section').querySelector(':scope ol').innerHTML = '';

    dbPromise.then(function(db) {
      const tx = db.transaction('logs', 'readwrite');
      tx.objectStore('logs').clear();
      return tx.complete;
    }).catch(function(e) {
      tx.abort();
    }).then(function() {
      updateSettingsOS.call(this);
    });
  };

  const updateUndoBtn = function(){
    if(undoLogs.length === 0) {
      document.getElementById('undo').removeEventListener('click', undoScore, {passive:false});
      document.getElementById('undo').classList.add('disabled');
    } else {
      document.getElementById('undo').addEventListener('click', undoScore, {passive:false});
      document.getElementById('undo').classList.remove('disabled');
    }
  };
  
  const undoScore = function(){
    for(let i = 0, max = undoLogs.length; i < max; i++){
      dbPromise.then(function(db) {
        const tx = db.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');
        store.add(undoLogs[i]);
        return tx.complete.then(() => {
          createScoresheetList.call(this, undoLogs[i].score, undoLogs[i].id);
          if(i === max - 1) {
            settings.score = undoLogs[i].score;
            settings.isCrawford = undoLogs[i].isCrawford;
            settings.isPostCrawford = undoLogs[i].isPostCrawford;
            undoLogs = [];

            settings.gameFor = undoSettings.gameFor;
            settings.matchTo = undoSettings.matchTo;
            document.getElementById('game-option').value = settings.gameFor;
            document.getElementById('pts-option').value = settings.matchTo;
            updateMatchInfoPane.call(this);

            updateSettingsOS.call(this);
            updateScoreBoardPane.call(this);
            updateCrawfordInfoPane.call(this);
            updateResetBtn.call(this);
            updateUndoBtn.call(this);
          }
        }).catch(e => {
          tx.abort();
        });
      });
    }
  };
  
  const updateSettingsOS = function(){
    dbPromise.then(function(db) {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      settings.update = Date.now();
      store.put(settings, 1);
      return tx.complete.then(() => {
        //console.log('Added item to the store.');
      }).catch(e => {
        tx.abort();
      });
    });
  };

  const createScoresheetList = function(score, id){
    const spanNode = document.createElement('span');
    spanNode.textContent = score[0] + '-' + score[1];
    const liNode = document.createElement('li');
    liNode.id = 'score-' + id;
    liNode.appendChild(spanNode);
    document.getElementById('scoresheet-section').querySelector(':scope ol').appendChild(liNode);

    liNode.addEventListener('click', function(){
      undoLogs = [];
      undoSettings.gameFor = settings.gameFor;
      undoSettings.matchTo = settings.matchTo;

      const targetId = Number(this.id.split(/[- ]+/).pop());
      const range = IDBKeyRange.lowerBound(targetId + 1);
      dbPromise.then(function(db) {
        const index = db.transaction('logs', 'readonly').objectStore('logs').index('id');
        return index.openCursor(range);
      }).then(function logItems(cursor) {
        if (!cursor) {
          return false;
        }
        let delId;
        undoLogs.push(cursor.value);
        dbPromise.then(function(db) {
          const tx = db.transaction('logs', 'readwrite');
          const store = tx.objectStore('logs');
          store.delete(cursor.value.id);
          delId = cursor.value.id;
          return tx.complete.then(() => {
            const liNode = document.getElementById('score-' + delId);
            liNode.parentNode.removeChild(liNode);
          });
        });
        return cursor.continue().then(logItems);
      }).then(function() {
        dbPromise.then(function(db) {
          return db.transaction('logs', 'readonly').objectStore('logs').get(targetId);
        }).catch(function(e) {
          tx.abort();
        }).then(function(value) {
          settings.score = value.score;
          settings.isCrawford = value.isCrawford;
          settings.isPostCrawford = value.isPostCrawford;
          updateSettingsOS.call(this);
          updateScoreBoardPane.call(this);
          updateCrawfordInfoPane.call(this);
        });
        if(undoLogs.length > 0) {
          document.getElementById('reset').removeEventListener('click', getUndoData, {passive:false});
          document.getElementById('reset').classList.add('disabled');
        }
        updateUndoBtn.call(this);
      });
    }, {passive:false});
  }
  
  /*****************************************************************************
   *
   * Event listeners for Scoreboard Pane
   *
   ****************************************************************************/

  var flipNodes = document.querySelectorAll('.flip-container');
  for(var i = 0, max = flipNodes.length; i < max; i++) {
    flipNodes[i].addEventListener('click', function() {
      flipDown.call(this);
    }, {passive:false});
  }

  /*****************************************************************************
   *
   * Methods to flip Scoreboard Pane UI
   *
   ****************************************************************************/

  const flipDown = function(){
    const flipNodes = (this.parentNode).querySelectorAll(':scope .flip-container');
    if(flipNodes.length > 1 || (settings.score[0] === maxMatch || settings.score[1] === maxMatch)) {
      return false;
    }
    clearInterval(addIntvalID);
    
    const flipContainerNode = this;
    flipContainerNode.style.zIndex = '1';
    const newFlipContainerNode = flipContainerNode.cloneNode(true);
    (flipContainerNode.parentNode).insertBefore(newFlipContainerNode, flipContainerNode.nextSibling);
    (flipContainerNode.nextSibling).style.zIndex = '0';
    (flipContainerNode.nextSibling).addEventListener('click', function() {
      flipDown.call(this);
    }, {passive:false});
  
    const frontNode = flipContainerNode.parentNode.querySelectorAll(':scope .front');
    const backNode = flipContainerNode.parentNode.querySelectorAll(':scope .back');
    const boardNode = flipContainerNode.parentNode.querySelectorAll(':scope .board');
    //const maxMatch = (document.getElementById('match-info').children[0].textContent).codePointAt(0) === 128176 ? 99 : Number(settings.matchTo);
    frontNode[1].children[0].textContent = Number(frontNode[0].children[0].textContent) < maxMatch ? Number(frontNode[0].children[0].textContent) + 1 : Number(frontNode[0].children[0].textContent);
    backNode[1].children[0].textContent = Number(backNode[0].children[0].textContent) < maxMatch ? Number(backNode[0].children[0].textContent) + 1 : Number(backNode[0].children[0].textContent);
    boardNode[1].children[0].textContent = Number(boardNode[0].children[0].textContent) < maxMatch ? Number(boardNode[0].children[0].textContent) + 1 : Number(boardNode[0].children[0].textContent);

    if(Number(frontNode[1].children[0].textContent) !== Number(frontNode[0].children[0].textContent)) {
      flipContainerNode.classList.add('hover');
    }
  
    setTimeout(function(){
      flipContainerNode.remove();
    }, 500);

    // Add to LogsOS
    addIntvalID = setTimeout(addLogs, 2000);
  };

  const addLogs = function(){
    const boardNodes = document.querySelectorAll('.board');
    if((settings.score[0] === Number(boardNodes[0].children[0].textContent) && settings.score[1] === Number(boardNodes[1].children[0].textContent))
    || (settings.score[0] === maxMatch || settings.score[1] === maxMatch)
    || (Number(boardNodes[0].children[0].textContent) === 0 && Number(boardNodes[1].children[0].textContent) === 0)) {
      return false;
    }
    settings.score = [Number(boardNodes[0].children[0].textContent), Number(boardNodes[1].children[0].textContent)];
    updateCrawfordInfo.call(this);
    updateCrawfordInfoPane.call(this);
    dbPromise.then(function(db) {
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      const request = store.add({
        score: settings.score,
        isCrawford: settings.isCrawford,
        isPostCrawford: settings.isPostCrawford,
        created: Date.now()
      });
      return tx.complete.then(() => {
        request.then((result) => {
          createScoresheetList.call(this, settings.score, result);
        });
        updateSettingsOS.call(this);
      }).catch(e => {
        tx.abort();
      });
    });
  };

  /*****************************************************************************
   *
   * Methods to rotate the device Detect - Orientation Change https://davidwalsh.name/orientation-change
   *
   ****************************************************************************/

  // Find matches
  var mql = window.matchMedia("(orientation: portrait)");
  
  // If there are matches, we're in portrait
  if(mql.matches) {
    document.querySelector('.container').classList.add('hover');
  } else {
    document.querySelector('.container').classList.remove('hover');
  }
  
  // Add a media query change listener
  mql.addListener(function(m) {
    if(m.matches) {
      document.querySelector('.container').classList.add('hover');
    } else {
      document.querySelector('.container').classList.remove('hover');
    }
  });

  /*****************************************************************************
   *
   * Localization
   *
   ****************************************************************************/

  const localizeStrings = function(){
    import('./localization.js')
      .then(() => {
        const lang = settings.language === 'English' ? 'en' : localization.lang;
        if(localization.labelStrings[lang]) {
          document.getElementById('settings').children[0].textContent = localization.labelStrings[lang].settings;
          document.getElementById('settings-section').children[0].textContent = localization.labelStrings[lang].settings;
          document.getElementById('appearance').children[0].textContent = localization.labelStrings[lang].appearance;
          document.getElementById('font').children[0].textContent = localization.labelStrings[lang].font;
          document.getElementById('language').children[0].textContent = localization.labelStrings[lang].language;
          document.getElementById('game').children[0].textContent = localization.labelStrings[lang].game;
          document.getElementById('match-to').children[0].textContent = localization.labelStrings[lang].match;
          document.getElementById('reset').children[0].textContent = localization.labelStrings[lang].reset;
          document.getElementById('undo').children[0].textContent = localization.labelStrings[lang].undo;
          document.getElementById('scoresheet-section').children[0].textContent = localization.labelStrings[lang].scoresheet;
          document.getElementById('done-btn').children[0].textContent = localization.labelStrings[lang].done;
          document.getElementById('notes').children[0].textContent = localization.labelStrings[lang].notes;
        }
      });
  };

  // Add feature check for Service Workers here
  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();
