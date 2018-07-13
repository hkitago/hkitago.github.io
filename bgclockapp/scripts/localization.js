'use strict';

(function(){
  const exp = {
    get lang(){
      let lang = window.navigator.language;
      return lang && lang.length > 2 ? lang.substring(0, 2) : 'en';
    },
    labelStrings: {
      en: {
        settings: 'Settings',
        startLabel: 'Start',
        resumeLabel: 'Resume',
        stopLabel: 'Stop',
        appearance: 'Appearance',
        beep: 'Beep',
        font: 'Font',
        language: 'Language',
        delay: 'Delay',
        match: 'Match to',
        minutes: 'Minutes/Point',
        first: 'First Player',
        reset: 'Reset Clock',
        undo: 'Undo',
        done: 'Done',
        notes: 'Rotate your device to landscape orientation to get started.'
      },
      ja: {
        settings: '設定',
        startLabel: '開始',
        resumeLabel: '再開',
        stopLabel: '停止',
        appearance: 'テーマ',
        beep: 'ビープ音',
        font: 'フォント',
        language: '言語',
        delay: '１手の保障秒数',
        match: 'ポイント数',
        minutes: '１ポイントの分数',
        first: '先攻',
        reset: 'リセット',
        undo: '取消',
        done: '了解',
        notes: '端末を横向きにして始めてください。'
      }
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.localization = exp;
  }

}());
