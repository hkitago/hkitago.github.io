(function() {
  'use strict';
  let dbPromise;
  let settings = {
    allottedTime: [0, 0],
    isPaused: [true, true],
    appearance: 'Dark',
    font: 'System Default',
    beep: 0,
    language: 'English',
    matchTo: 3,
    minutesPerPoint: 2,
    delayTime: 12,
    turnCount: 0,
    firstPlayer: 0,
    turnNow: 0,
    animationDirection: false, // anti-clockwise & decrease
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
    delayBoardNode: document.getElementById('delay-time'),
    pathNodes: document.querySelectorAll('.path'),
    get rect(){
      return this.pathNodes[settings.turnNow].getBoundingClientRect();
    },
    get stroke(){
      return Math.PI * this.rect.height;
    },
    get isStarted(){
      return  (   settings.allottedTime[0] === updateAllottedTime.call(this)
              &&  settings.allottedTime[1] === updateAllottedTime.call(this)
              &&  settings.turnCount === 0
              &&  settings.firstPlayer === settings.turnNow) ? false : true;
    },
    styleNode: document.createElement('style'),
    startBtnLabels: { startLabel: 'Start', resumeLabel: 'Resume', stopLabel: 'Stop' }
  };
  let undoLogs = [];
/*
  let undoSettings = {};
  let addIntvalID;
  let maxMatch;
*/
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  let audioCtx = null;
  
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
        settings.animationDirection = false;
        if(settings.allottedTime[0] === 0 && settings.allottedTime[1] === 0) {
          settings.allottedTime[0] = settings.allottedTime[1] = updateAllottedTime.call(this);
        }
        updateFontFamily.call(this);
        localizeStrings.call(this);
        // Initialize Board Pane
        updateStartBtn.call(this);
        updateClockBoardPane.call(this);

        // Initialize Settings Pane
        if(settings.appearance.toLowerCase() === 'auto'){
          document.getElementById('appearance-style').setAttribute('href', 'styles/' + (darkModeMediaQuery.matches ? 'Dark' : 'Light').toLowerCase() + '.css')
          darkModeMediaQuery.addListener((e) => {
            document.getElementById('appearance-style').setAttribute('href', 'styles/' + (e.matches ? 'Dark' : 'Light').toLowerCase() + '.css')
          })
        }
        else {
          document.getElementById('appearance-style').setAttribute('href', 'styles/' + settings.appearance.toLowerCase() + '.css')          
        }
        document.getElementById('appearance-option').value = settings.appearance;
        document.getElementById('font-option').value = settings.font;
        document.getElementById('language-option').value = settings.language;
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
    addLogs.call(this).then(function(){
      updateResetBtn.call(this);
      document.querySelector('.container').classList.add('hover');
    });
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
    if(settings.appearance.toLowerCase() === 'auto'){
      document.getElementById('appearance-style').setAttribute('href', 'styles/' + (darkModeMediaQuery.matches ? 'Dark' : 'Light').toLowerCase() + '.css')
      darkModeMediaQuery.addListener((e) => {
        document.getElementById('appearance-style').setAttribute('href', 'styles/' + (e.matches ? 'Dark' : 'Light').toLowerCase() + '.css')
      })
    }
    else {
      document.getElementById('appearance-style').setAttribute('href', 'styles/' + settings.appearance.toLowerCase() + '.css')          
    }
  }, {passive:false});
  
  document.getElementById('font-option').addEventListener('change', function() {
    settings.font = this.value;
    updateSettingsOS.call(this);
    updateFontFamily.call(this);
  }, {passive:false});

  document.getElementById('language-option').addEventListener('change', function() {
    settings.language = this.value;
    updateSettingsOS.call(this);
    localizeStrings.call(this);
  });

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

  /* SWIPE SETTING FOR TURN OPTION */
  let isTouched = false
  let isSwiped = false
  let basePoint = 0
  let dist = 0
  document.getElementById('board-pane').addEventListener('touchstart', (e)=>{
    isTouched = true
    basePoint = e.touches[0].clientX
  }, {passive:false})
  
  document.getElementById('board-pane').addEventListener('touchmove', (e)=>{
    if(!isTouched) {
      return false
    }
    dist = e.touches[0].clientX - basePoint
    isSwiped = (Math.abs(e.touches[0].clientX - basePoint) > 0) ? true : false  
  }, {passive:false})
  
  document.getElementById('board-pane').addEventListener('touchend', (e)=>{
    if(!isTouched || !isSwiped) {
      return false
    }
  
    if(document.getElementById('start-btn').children[0].textContent !== apps.startBtnLabels.stopLabel) {
      settings.firstPlayer = settings.turnNow = (dist < 0) ? 0 : 1;
      updateSettingsOS.call(this);
      resetStyleClockPane.call(this);
    
      const options = document.getElementById('turn-option')
      for(let i = 0, max = options.length; i < max; i++) {
        if(Number(options[i].value) === settings.firstPlayer) {
          options[i].selected = true
          return false
        }
      }
    }
  
    isTouched = false
    isSwiped = false
  }, {passive:false})

  /*****************************************************************************
   *
   * Methods to update on Board Pane UI
   *
   ****************************************************************************/

  const setGlowAnimation = function(){
    for(let i = 0, max = apps.timeBoardNodes.length; i < max; i = i + 1) {
      apps.timeBoardNodes[i].children[0].addEventListener('animationend', function(){
        this.classList.remove('hover');
      }, {passive:false});
    }
  }.call(this);

  const setCircleAnimation = function(){
    const styleNodes = document.getElementsByTagName('style');
    if(styleNodes.length > 0){
      styleNodes[0].textContent = '';
    }
    for(let i = 0, max = apps.pathNodes.length; i < max; i = i + 1){
      apps.pathNodes[i].removeAttribute('style');
      const stroke = updateAllottedTime.call(this) !== settings.allottedTime[i] ? apps.stroke * settings.allottedTime[i] / updateAllottedTime.call(this) : apps.stroke;
      const cssText = '@keyframes pre-' + i + ' {from { stroke-dashoffset: ' + apps.stroke + 'px; } to { stroke-dashoffset: ' + (settings.animationDirection ? stroke : apps.stroke - stroke) + 'px; }}'
                    + "\n"
                    + '@keyframes dash-' + i + ' {from { stroke-dashoffset: ' + (settings.animationDirection ? stroke : apps.stroke - stroke) + 'px; } to { stroke-dashoffset: ' + (settings.animationDirection ? 0 : apps.stroke) + 'px; }}';
      const textNode = document.createTextNode(cssText);
      apps.styleNode.appendChild(textNode);
      document.getElementsByTagName('head')[0].appendChild(apps.styleNode);
      
      apps.pathNodes[i].style.strokeDasharray = apps.stroke + 'px';
      apps.pathNodes[i].style.strokeDashoffset = (settings.animationDirection ? apps.stroke : 0) + 'px';
      apps.pathNodes[i].style.webkitAnimationDuration = '0.5s';
      apps.pathNodes[i].style.webkitAnimationName = 'pre-' + i;
      
      apps.pathNodes[i].addEventListener('animationend', function(){
        apps.pathNodes[i].style.webkitAnimationPlayState = 'paused';
        this.style.strokeDashoffset = (settings.animationDirection ? stroke : 0) + 'px';
        this.style.animationDuration = settings.allottedTime[i] + 's';
        apps.pathNodes[i].style.webkitAnimationName = 'dash-' + i;
      }, {passive:false});
    }
  };

  const updateClockBoardPane = function(){
    resetStyleClockPane.call(this);
    apps.delayBoardNode.children[0].textContent = settings.delayTime;
    apps.delayBoardNode.classList.remove('disabled');
    for(let i = 0, max = apps.timeBoardNodes.length; i < max; i = i + 1) {
      apps.timeBoardNodes[i].children[0].textContent = updateTimerCount.call(this, settings.allottedTime[i]);
    }
    setCircleAnimation.call(this);
  };
  
  const updateStartBtn = function(){
    document.getElementById('start-btn').style.display = (settings.allottedTime[0] === 0 || settings.allottedTime[1] === 0) ? 'none' : 'block';
    if(apps.isDelayPaused && apps.isPaused) {
      document.getElementById('start-btn').children[0].textContent = apps.isStarted ? apps.startBtnLabels.resumeLabel : apps.startBtnLabels.startLabel;
    } else {
      document.getElementById('start-btn').children[0].textContent = apps.startBtnLabels.stopLabel;
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
      clearInterval(apps.countIntval);
      apps.isPaused = true;
      apps.pathNodes[settings.turnNow].style.webkitAnimationPlayState = 'paused';
      settings.allottedTime[settings.turnNow] = apps.remainingTime;
      updateSettingsOS.call(this);
    }
  };
  
  const countDelayTimer = function(){
    resetStyleClockPane.call(this);
    apps.startDelayTime = performance.now();
    apps.isDelayPaused = false;
    apps.delayBoardNode.classList.remove('disabled');
    return new Promise(function(resolve, reject){
      apps.delayIntval = setInterval(function(){
        apps.remainingDelayTime = settings.delayTime - (performance.now() - apps.startDelayTime) / 1000 + 1;
        if (apps.remainingDelayTime <= 1){
          clearInterval(apps.delayIntval);
          apps.remainingDelayTime = 0;
          apps.delayBoardNode.classList.add('disabled');
          resolve.call(this);
        }
        apps.delayBoardNode.children[0].textContent = Math.trunc(apps.remainingDelayTime);
      }, 50);
    });
  };
  
  const countDownTimer = function(){
    apps.pathNodes[settings.turnNow].style.webkitAnimationName = 'dash-' + settings.turnNow;
    apps.pathNodes[settings.turnNow].style.webkitAnimationPlayState = 'running';
    apps.resumeTime = performance.now();
    apps.isDelayPaused = true;
    apps.isPaused = false;
    apps.countIntval = setInterval(function(){
      apps.remainingTime = settings.allottedTime[settings.turnNow] - (performance.now() - apps.resumeTime) / 1000
      if (apps.remainingTime <= 0){
        clearInterval(apps.countIntval);
        apps.remainingTime = 0;
        stopTimer.call(this);
        updateStartBtn.call(this);
        let i = 1
        ,   x = setInterval(function() {
        	beep.call(this);
        	i++;
        	if (i > 7) {
        		clearInterval(x);
        	}
        }, 250);
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
    const l = time < 10 ? 10 : 8
    const t = new Date(1000 * time).toISOString().substr(11, l).replace(/^[0:]+/, '');
    return time < 1 ? '0' + t : t;
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
    if(!apps.isStarted) {
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
    if(settings.beep === 1){
      audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    }
  }, {passive:false});
  
  for(let i = 0, max = apps.timeBoardNodes.length; i < max; i = i + 1) {
    apps.timeBoardNodes[i].addEventListener('click', function() {
      if(Number(this.id) === settings.turnNow && (apps.isDelayPaused === false || apps.isPaused === false)) {
        this.children[0].classList.add('hover');
        beep.call(this);
        stopTimer.call(this);
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
  
  const beep = function(){
    if(settings.beep === 0) {
      return false;
    }
  	const volume = 0.1
  	,   duration = 200
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
  	setTimeout(function() {
  		oscillator.stop();
		}, duration);
  };

  /*****************************************************************************
   *
   * Methods to close app: refer to;
   * http://kimagureneet.hatenablog.com/entry/2016/10/23/003645
   * https://qiita.com/ta__ho/items/937257c3c9891bdf2d38
   *
   ****************************************************************************/

  const hidden = (typeof document.webkitHidden !== "undefined") ? 'webkitHidden' : 'hidden';
  const visibilityChange = (typeof document.webkitHidden !== "undefined") ? 'webkitvisibilitychange' : 'visibilityChange';

  document.addEventListener(visibilityChange, function() {
    if (document[hidden]) {
      stopTimer.call(this);
      updateStartBtn.call(this);
    }
  }, {passive:false});
  
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
      stopTimer.call(this);
      updateStartBtn.call(this);
      document.querySelector('.container').classList.add('hover');
    } else {
      updateClockBoardPane.call(this);
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
          document.getElementById('settings-btn').children[0].textContent = localization.labelStrings[lang].settings;
          document.getElementById('settings-section').children[0].textContent = localization.labelStrings[lang].settings;
          document.getElementById('appearance').children[0].textContent = localization.labelStrings[lang].appearance;
          document.getElementById('font').children[0].textContent = localization.labelStrings[lang].font;
          document.getElementById('beep').children[0].textContent = localization.labelStrings[lang].beep;
          document.getElementById('language').children[0].textContent = localization.labelStrings[lang].language;
          document.getElementById('delay').children[0].textContent = localization.labelStrings[lang].delay;
          document.getElementById('match-to').children[0].textContent = localization.labelStrings[lang].match;
          document.getElementById('minutes-per-point').children[0].textContent = localization.labelStrings[lang].minutes;
          document.getElementById('first-turn').children[0].textContent = localization.labelStrings[lang].first;
          document.getElementById('reset').children[0].textContent = localization.labelStrings[lang].reset;
          document.getElementById('undo').children[0].textContent = localization.labelStrings[lang].undo;
          document.getElementById('done-btn').children[0].textContent = localization.labelStrings[lang].done;
          document.getElementById('notes').children[0].textContent = localization.labelStrings[lang].notes;
          apps.startBtnLabels.startLabel = localization.labelStrings[lang].startLabel;
          apps.startBtnLabels.resumeLabel = localization.labelStrings[lang].resumeLabel;
          apps.startBtnLabels.stopLabel = localization.labelStrings[lang].stopLabel;
          updateStartBtn.call(this);
        }
      });
  };

  /*****************************************************************************
   *
   * PC Keyboard
   *
   ****************************************************************************/

  document.addEventListener('keydown', function(e){
    if (e.code === 'ShiftLeft'){
      apps.timeBoardNodes[0].click();
    } else if (e.code === 'ShiftRight'){
      apps.timeBoardNodes[1].click();
    } else if (e.code === 'Space' && (document.querySelector('.container').className).indexOf('hover') === -1){
      document.getElementById('start-btn').click();
    }
  }, {passive:false});

  /*****************************************************************************
   *
   * Service Workers
   *
   ****************************************************************************/

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./service-worker.js', {scope: './'})
      .then(function(registration) {
        //console.log('Registered:', registration);
        registraion.update();
      })
      .catch(function(error) {
        //console.log('Registration failed: ', error);
      });
    });
  }

})();
