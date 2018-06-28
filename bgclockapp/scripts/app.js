(function() {
  'use strict';
  let dbPromise;
  let settings = {
    allottedTime: [0, 0],
    isPaused: [true, true],
    appearance: 'Dark',
    font: 'System Default',
    beep: 1,
    language: 'English',
    matchTo: 3,
    minutesPerPoint: 2,
    delayTime: 12,
    turnCount: 0,
    firstPlayer: 0,
    turnNow: 0,
    animationDirection: true, // clock-wise
    created: Date.now()
  };
  let apps = {
    isDelayPaused: true,
    startDelayTime: 0,
    remainingDelayTime: 0,
    delayIntval: 0,
    isPaused: true,
    resumeTime: 0,
    remainingTime: 0,
    countIntval: 0,
    timeBoardNodes: document.querySelectorAll('.time-board'),
    delayBoardNode: document.getElementById('delay-time')
  };
  let undoLogs = [];
/*
  let undoSettings = {};
  let addIntvalID;
  let maxMatch;
*/
  
  import('../lib/idb.js')
    .then(() => {
      //check for support
      if(!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
      }
      //idb.delete('bgck-db').then(() => console.log('done!'));
      dbPromise = idb.open('bgck-db', 1, function(upgradeDb) {
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
      }).then(function(val) {
        if(val !== undefined) {
          settings = val;
        }
        if(settings.allottedTime[0] === 0 && settings.allottedTime[1] === 0) {
          settings.allottedTime[0] = settings.allottedTime[1] = updateAllottedTime.call(this);
        }
        updateFontFamily.call(this);
        // Initialize Board Pane
        updateStartBtn.call(this);
        updateClockBoardPane.call(this);
        // Initialize Settings Pane
        document.getElementById('appearance-style').setAttribute('href', 'styles/' + settings.appearance.toLowerCase() + '.css');
        document.getElementById('appearance-option').value = settings.appearance;
        document.getElementById('font-option').value = settings.font;
        document.getElementById('beep-option').value = settings.beep;
        document.getElementById('delay-option').value = settings.delayTime;
        document.getElementById('pts-option').value = settings.matchTo;
        document.getElementById('minutes-option').value = settings.minutesPerPoint;
        document.getElementById('turn-option').value = settings.firstPlayer;
        updateResetBtn.call(this);
/*
// Initialize Scoresheet
dbPromise.then(function(db) {
  return db.transaction('logs', 'readonly').objectStore('logs').getAll();
}).then(function(items) {
  for(let i = 0, max = items.length; i < max; i++){
    createScoresheetList.call(this, items[i].score, items[i].id);
  }
});
*/
      });
    });

  /*****************************************************************************
   *
   * Event listeners when flipping Settings Pane
   *
   ****************************************************************************/

  document.getElementById('settings-btn').addEventListener('click', function() {
    stopTimer.call(this);
    updateStartBtn.call(this);
    //addLogs.call(this);
    updateResetBtn.call(this);
    document.querySelector('.container').classList.add('hover');
  }, {passive:false});
  
  document.getElementById('done-btn').addEventListener('click', function() {
    updateClockBoardPane.call(this);
    document.querySelector('.container').classList.toggle('hover');
    undoLogs = [];
    updateUndoBtn.call(this);
    updateSettingsOS.call(this);
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
  }, {passive:false});
  
  document.getElementById('font-option').addEventListener('change', function() {
    settings.font = this.value;
    updateSettingsOS.call(this);
    updateFontFamily.call(this);
  }, {passive:false});

  document.getElementById('beep-option').addEventListener('change', function() {
    settings.beep = Number(this.value);
    updateSettingsOS.call(this);
  }, {passive:false});

  document.getElementById('delay-option').addEventListener('click', function() {
    this.value = '';
  }, {passive:false});
  
  document.getElementById('delay-option').addEventListener('blur', function() {
    if(this.value.trim().length === 0){
      this.value = settings.minutesPerPoint;
    }
    settings.delayTime = Number(this.value);
    updateSettingsOS.call(this);
    resetClock.call(this);
  }, {passive:false});

  document.getElementById('pts-option').addEventListener('change', function() {
    undoLogs = [];
    settings.matchTo = Number(this.value);
    settings.allottedTime[0] = settings.allottedTime[1] = updateAllottedTime.call(this);
    updateSettingsOS.call(this);
    updateUndoBtn.call(this);
    resetClock.call(this);
  }, {passive:false});

  document.getElementById('minutes-option').addEventListener('click', function() {
    this.value = '';
  }, {passive:false});
  
  document.getElementById('minutes-option').addEventListener('blur', function() {
    if(this.value.trim().length === 0){
      this.value = settings.minutesPerPoint;
    }
    settings.minutesPerPoint = Number(this.value);
    settings.allottedTime[0] = settings.allottedTime[1] = updateAllottedTime.call(this);
    updateSettingsOS.call(this);
    resetClock.call(this);
  }, {passive:false});

  document.getElementById('turn-option').addEventListener('change', function() {
    settings.firstPlayer = settings.turnNow = Number(this.value);
    updateSettingsOS.call(this);
    resetClock.call(this);
  }, {passive:false});


  /*****************************************************************************
   *
   * Methods to handle data
   *
   ****************************************************************************/

  const isStarted = function(){
    return  (   settings.allottedTime[0] === updateAllottedTime.call(this)
            &&  settings.allottedTime[1] === updateAllottedTime.call(this)
            &&  settings.turnCount === 0
            &&  settings.firstPlayer === settings.turnNow) ? true : false;
  };
  


  /*****************************************************************************
   *
   * Methods to update on Board Pane UI
   *
   ****************************************************************************/

  const updateClockBoardPane = function(){
    resetStyleClockPane.call(this);
    apps.delayBoardNode.children[0].textContent = settings.delayTime;
    for(let i = 0, max = apps.timeBoardNodes.length; i < max; i = i + 1) {
      apps.timeBoardNodes[i].children[0].textContent = updateTimerCount.call(this, settings.allottedTime[i]);
    }
  };
  
  const updateStartBtn = function(){
    if(apps.isDelayPaused && apps.isPaused) {
      document.getElementById('start-btn').children[0].textContent = isStarted.call(this) ? 'Start' : 'Resume';
    } else {
      document.getElementById('start-btn').children[0].textContent = 'Stop';
    }
  };
  
  const resetStyleClockPane = function(){
    apps.timeBoardNodes[settings.turnNow].classList.remove('disabled');
    apps.timeBoardNodes[(settings.turnNow === 0 ? 1 : 0)].classList.add('disabled');
    apps.timeBoardNodes[settings.turnNow].classList.remove('grow');
  };
  
  const stopTimer = function(){
    if(apps.isDelayPaused === false && apps.remainingDelayTime > 0) {
      clearInterval(apps.delayIntval);
      apps.isDelayPaused = true;
    }
    if(apps.isPaused === false) {
      settings.allottedTime[settings.turnNow] = apps.remainingTime;
      updateSettingsOS.call(this);
      clearInterval(apps.countIntval);
      apps.isPaused = true;
    }
  };
  
  const countDelayTimer = function(){
    resetStyleClockPane.call(this);
    apps.startDelayTime = performance.now();
    apps.isDelayPaused = false;
    return new Promise(function(resolve, reject){
      apps.delayIntval = setInterval(function(){
        apps.remainingDelayTime = settings.delayTime - (performance.now() - apps.startDelayTime) / 1000 + 1;
        if (apps.remainingDelayTime <= 1){
          apps.remainingDelayTime = 0;
          clearInterval(apps.delayIntval);
          resolve.call(this);
        }
        //apps.delayBoardNode.children[0].textContent = parseFloat(apps.remainingDelayTime).toFixed(0);
        apps.delayBoardNode.children[0].textContent = parseInt(apps.remainingDelayTime);
      }, 50);
    });
  };
  
  const countDownTimer = function(){
    apps.resumeTime = performance.now();
    apps.isDelayPaused = true;
    apps.isPaused = false;
    apps.countIntval = setInterval(function(){
      apps.remainingTime = settings.allottedTime[settings.turnNow] - (performance.now() - apps.resumeTime) / 1000
      if (apps.remainingTime <= 0){
        apps.remainingTime = 0;
        clearInterval(apps.countIntval);
      }
      apps.timeBoardNodes[settings.turnNow].children[0].textContent = updateTimerCount.call(this, apps.remainingTime);
    }, 50);
  };
  
  const resumeTimer = function(){
    countDelayTimer.call(this).then(function(){
      countDownTimer.call(this);
    });
  };
  
  const updateTimerCount = function(time){
    return new Date(1000 * time).toISOString().substr(11, 8).replace(/^[0:]+/, '');
  };

  /*****************************************************************************
   *
   * Methods to update on Settings Pane
   *
   ****************************************************************************/

  const updateFontFamily = function() {
    document.querySelector('body').style.fontFamily = (settings.font === 'System Default') ? "-apple-system,Roboto,'Droid Sans',sans-serif" : settings.font;
    const selectNodes = document.querySelectorAll('select');
    for(let i = 0, max = selectNodes.length; i < max; i = i + 1) {
      selectNodes[i].style.fontFamily = (settings.font === 'System Default') ? "-apple-system,Roboto,'Droid Sans',sans-serif" : settings.font;
    }
    const inputNodes = document.querySelectorAll('input');
    for(let i = 0, max = inputNodes.length; i < max; i = i + 1) {
      inputNodes[i].style.fontFamily = (settings.font === 'System Default') ? "-apple-system,Roboto,'Droid Sans',sans-serif" : settings.font;
    }
  };

  const updateAllottedTime = function(){
    return Math.ceil(settings.matchTo * settings.minutesPerPoint) * 60;
  };

  const updateResetBtn = function(){
    if(isStarted.call(this)) {
      document.getElementById('reset').removeEventListener('click', getUndoData, {passive:false});
      document.getElementById('reset').classList.add('disabled');
    } else {
      document.getElementById('reset').addEventListener('click', getUndoData, {passive:false});
      document.getElementById('reset').classList.remove('disabled');
    }
  };

  const getUndoData = function(){
    dbPromise.then(function(db) {
      return db.transaction('logs', 'readonly').objectStore('logs').getAll();
    }).then(function(items) {
      for(let i = 0, max = items.length; i < max; i++){
        undoLogs.push(items[i]);
      }
      updateUndoBtn.call(this);
      resetClock.call(this);
    });
  };

  const resetClock = function(){
    settings.allottedTime[0] = settings.allottedTime[1] = updateAllottedTime.call(this);
    settings.turnCount = 0;
    settings.turnNow = settings.firstPlayer;
    updateStartBtn.call(this);
    resetStyleClockPane.call(this);
    document.getElementById('reset').classList.add('disabled');
    //document.getElementById('scoresheet-section').querySelector(':scope ol').innerHTML = '';

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
          //createScoresheetList.call(this, undoLogs[i].score, undoLogs[i].id);
          if(i === max - 1) {
            settings.allottedTime = undoLogs[i].allottedTime;
            settings.turnCount = undoLogs[i].turnCount;
            settings.turnNow = undoLogs[i].turnNow;
            undoLogs = [];
            updateStartBtn.call(this);
            updateSettingsOS.call(this);
            updateClockBoardPane.call(this);
            updateResetBtn.call(this);
            updateUndoBtn.call(this);
          }
        }).catch(e => {
          tx.abort();
        });
      });
    }
  };

/*
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
        });
        if(undoLogs.length > 0) {
          document.getElementById('reset').removeEventListener('click', getUndoData, {passive:false});
          document.getElementById('reset').classList.add('disabled');
        }
        updateUndoBtn.call(this);
      });
    }, {passive:false});
  }
*/

  const addLogs = function(){
    return new Promise(function(resolve, reject){
      dbPromise.then(function(db) {
        const tx = db.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');
        const request = store.add({
          allottedTime: settings.allottedTime,
          turnCount: settings.turnCount,
          turnNow: settings.turnNow,
          created: Date.now()
        });
        return tx.complete.then(() => {
          request.then((result) => {
            //createScoresheetList.call(this, settings.score, result);
          });
          resolve.call(this);
        }).catch(e => {
          tx.abort();
        });
      });
    });
  };

  /*****************************************************************************
   *
   * Event listeners for Board Pane
   *
   ****************************************************************************/

  document.getElementById('start-btn').addEventListener('click', function() {
    apps.isDelayPaused && apps.isPaused ? resumeTimer.call(this) : stopTimer.call(this);
    updateStartBtn.call(this);
  }, {passive:false});
  
  for(let i = 0, max = apps.timeBoardNodes.length; i < max; i = i + 1) {
    apps.timeBoardNodes[i].addEventListener('click', function() {
      if(Number(this.id) === settings.turnNow && (apps.isDelayPaused === false || apps.isPaused === false)) {
        beep.call(this);
        apps.timeBoardNodes[settings.turnNow].classList.add('glow');
        stopTimer.call(this);
        settings.allottedTime[settings.turnNow] = apps.remainingTime > 0 ? apps.remainingTime : settings.allottedTime[settings.turnNow];
        addLogs.call(this).then(function(){
          settings.turnCount = settings.firstPlayer === settings.turnNow ? settings.turnCount: settings.turnCount + 1 ;
          settings.turnNow = settings.turnNow === 0 ? 1 : 0;
          updateSettingsOS.call(this);
          resumeTimer.call(this);
        });
      }
    }, {passive:false});
  }

  /*****************************************************************************
   *
   * Methods to beep sound
   *
   ****************************************************************************/

  const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
  
  const beep = function(){
    if(settings.beep === 1) {
      return false;
    }
  	const volume = 0.1
  	,   duration = 100
  	,   type =  'square'
  	,   frequency = settings.turnNow === 0 ? 2000 : 1000;
  	const oscillator = audioCtx.createOscillator();
  	const gainNode = audioCtx.createGain();
  
  	oscillator.connect(gainNode);
  	gainNode.connect(audioCtx.destination);
  
  	gainNode.gain.value = volume;
  	oscillator.frequency.value = frequency;
  	oscillator.type = type;
  
  	oscillator.start();
  	setTimeout(
  		function() {
  			oscillator.stop();
  		}, duration);
  };

  /*****************************************************************************
   *
   * Methods to Abandon app: refer to;
   * http://kimagureneet.hatenablog.com/entry/2016/10/23/003645
   * https://qiita.com/ta__ho/items/937257c3c9891bdf2d38
   *
   ****************************************************************************/
  let hidden = null;
  let visibilityChange = null;
  if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
  } else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
  } else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }
  
  if (typeof document.addEventListener != "undefined" && typeof document[hidden] != "undefined") {
   document.addEventListener('visibilitychange', function() {
      if (document[hidden]) {
        stopTimer.call(this);
        updateStartBtn.call(this);
      }
   }, {passive:false});
  }
  
  window.addEventListener('blur', function(){
    stopTimer.call(this);
    updateStartBtn.call(this);
  }, {passive:false});

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

  // Add feature check for Service Workers here
  if('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./service-worker.js')
             .then(function() { console.log('Service Worker Registered'); });
  }

})();