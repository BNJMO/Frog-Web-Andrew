import {Component, OnInit} from '@angular/core';
import {Howl, Howler} from 'howler';

@Component({
  selector: 'app-sound-player',
  template: '<audio id="player"></audio>'
})
export class SoundPlayerComponent implements OnInit {
  loaded = 0;
  player;
  audioFiles = {};

  constructor() {
  }

  ngOnInit() {
    this.player = document.getElementById('player');
  }

  preloadAudio(files) {
    const self = this;
    for (let i = 0; i < files.length; i++) {
      self.audioFiles[files[i].name] = new Howl({
        src: [`./assets/sound/${files[i].name}.${files[i].type}`],
        preload: true
      });
    }
  }

  play(file) {
    try {
      this.audioFiles[file].play();
    } catch (e) {
      console.log(e);
    }
  }

  setVolume(value) {
    Howler.volume(parseFloat(value));
  }

}
