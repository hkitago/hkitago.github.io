'use strict';

(function(){
  const exp = {
    get lang(){
      let lang = window.navigator.language;
      return lang ? lang.substring(0, 2) : 'en';
    },
    labelStrings: {
      en: {
        settings: 'Settings',
        scoresheet: 'Scoresheet',
        appearance: 'Appearance',
        font: 'Font',
        language: 'Language',
        game: 'Game for',
        match: 'Match to',
        reset: 'Reset Score',
        undo: 'Undo',
        done: 'Done',
        notes: 'Rotate your device to landscape orientation to get started.'
      },
      ja: {
        settings: '設定',
        scoresheet: 'スコアシート',
        appearance: 'テーマ',
        font: 'フォント',
        language: '言語',
        game: 'ゲーム',
        match: 'ポイント数',
        reset: 'スコアをリセット',
        undo: '取消',
        done: '了解',
        notes: '端末を横向きにして始めてください。'
      },
      fr: {
        settings: 'Réglages',
        scoresheet: 'Feuille de résultats',
        appearance: 'Apparence',
        font: 'Police',
        language: 'Langue',
        game: 'Jeu pour',
        match: 'Correspond à',
        reset: 'Réinitialiser',
        undo: 'Annuler',
        done: 'OK',
        notes: 'Tournez votre appareil en mode paysage pour commencer.'
      },
      de: {
        settings: 'Einstellungen',
        scoresheet: 'Bewertungsbogen',
        appearance: 'Erscheinungsbild',
        font: 'Schriftart',
        language: 'Sprache',
        game: 'Spiel für',
        match: 'Spiel bis',
        reset: 'Zurücksetzen',
        undo: 'Widerrufen',
        done: 'Fertig',
        notes: 'Drehen Sie Ihr Gerät im Querformat zu beginnen.'
      },
      nl: {
        settings: 'Instellingen',
        scoresheet: 'Scoreblad',
        appearance: 'Weergave',
        font: 'Doopvont',
        language: 'Taal',
        game: 'Spel voor',
        match: 'Match tot',
        reset: 'Reset Score',
        undo: 'Herstel',
        done: 'Gereed',
        notes: 'Draai het apparaat naar de liggende stand om te beginnen.'
      },
      da: {
        settings: 'Indstillinger',
        scoresheet: 'Kampskemaet',
        appearance: 'Udseende',
        font: 'Skrifttype',
        language: 'Sprog',
        game: 'Spil til',
        match: 'Match til',
        reset: 'Nulstil Score',
        undo: 'Fortryd',
        done: 'OK',
        notes: 'Drej din enhed til liggende orientering for at komme i gang.'
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
