import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, Platform, LoadingController, Loading } from 'ionic-angular';

import { Media, MediaObject } from '@ionic-native/media';
import { BackgroundMode } from '@ionic-native/background-mode';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';

import { Observable } from 'rxjs/rx';
import { Subscription } from "rxjs/Subscription";

import { ISound } from './../../interface/sound';
import { SearchPage } from '../search/search';

@Component({
  selector: 'page-sound-listen',
  templateUrl: 'sound-listen.html',
})
export class SoundListenPage {

  sound: ISound;

  mediaObject: MediaObject;
  loadedProgress: number = 0;
  soundReady: boolean = false; // control by download 

  loader: Loading;

  isPlaying: boolean = false;
  duration: number = -1;
  currentPosition: number = -1;
  subsPosition: Subscription;
  seekPosition: number;

  skipStep: number = 60;

  storagePath: string; // path for store file to local device
  fileUrl: string; // source file
  fileName: string; // file name on target

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private media: Media,
    private backgroundMode: BackgroundMode,
    private transfer: FileTransfer,
    private file: File,
    private loadingCtrl: LoadingController,
    private _zone: NgZone) {

    platform.ready().then(() => {

      this.backgroundMode.enable();

      if (this.platform.is('ios')) {
        this.storagePath = this.file.documentsDirectory;
      } else {
        this.storagePath = this.file.dataDirectory;
      }

      this.storagePath = this.storagePath + 'buddhadasa/sound/';
    });

    this.sound = navParams.data;

    this.fileUrl = this.sound.mp3_file; // source file
    this.fileName = this.sound.id + '.mp3'; // destination file name ; using for Check file exists

    this.loader = this.loadingCtrl.create();
  }

  ionViewWillEnter() {
    this.platform.ready().then(() => {
      this.downloadSound();
    });
  }

  ionViewWillLeave() {
    this.mediaObject.release();
    this.stop();
  }

  search() {
    this.navCtrl.push(SearchPage);
  }

  changeSeekTo() {
    if (this.seekPosition != this.currentPosition && this.currentPosition > 0) {
      this.mediaObject.seekTo(this.seekPosition * 1000);
      //console.log('seek to: ' + this.seekPosition);
      this.currentPosition = this.seekPosition;
    }
  }

  stop() {
    this.subsPosition.unsubscribe();
    // this.backgroundMode.disable();
    this.mediaObject.stop();
    this.currentPosition = -1;
    this.duration = -1;
    this.seekPosition = 0;
    this.isPlaying = false;
  }

  skipForward() {
    let seekTo: number = this.currentPosition + this.skipStep;
    if (seekTo > this.duration) {
      seekTo = 0;
      this.seekPosition = 0;
    }
    this.mediaObject.seekTo(seekTo * 1000);
  }

  skipBackward() {
    let seekTo: number = this.currentPosition - this.skipStep;
    if (seekTo < 0) {
      seekTo = 0;
      this.seekPosition = 0;
    }
    this.mediaObject.seekTo(seekTo * 1000);
  }


  downloadSound() {

    this.platform.ready().then(() => {

      let filePath = this.storagePath + this.fileName;
      let fileFound = false;

      this.file.checkFile(this.storagePath, this.fileName)
        .then((res) => { // file exists do then, file not exists jump to do at catch block.

          //console.log('file found: ' + JSON.stringify(res));

          this.soundReady = true;
          fileFound = true; // ป้องกันการ donwload file ซ้ำใน catch; ถ้ามี error ต่อจากบรรทัดนี้ มันจะไปทำที่ catch ทันที

          this.mediaObject = this.media.create(filePath.replace(/^file:\/\//, ''));
          this.playSound();

        })
        .catch(error => {

          //console.log('file not found : ' + JSON.stringify(error));
        
          if (!fileFound) {

            this.loader.present();
            this.loader.setContent(`ดาวน์โหลดเสียง ${this.loadedProgress}%`);

            let transfer: FileTransferObject = this.transfer.create();

            transfer.download(this.fileUrl, filePath)
              .then(entry => {

                this.soundReady = true;

                this.mediaObject = this.media.create(filePath.replace(/^file:\/\//, ''));
                this.playSound();
                //console.log('download success : ' + url);

              })
              .catch(error => {

                console.log('download failed : ' + JSON.stringify(error));

              });

            transfer.onProgress((progressEvent) => {
              //console.log('on progress: ' + JSON.stringify(progressEvent));
              //this.loadedProgress = Math.round(progressEvent.loaded / progressEvent.total);
              this._zone.run(() => {
                this.loadedProgress = (progressEvent.lengthComputable) ? Math.floor(progressEvent.loaded / progressEvent.total * 100) : -1;
                //console.log('loadedProgress: ' + this.loadedProgress + '%');
                this.loader.setContent(`ดาวน์โหลดเสียง ${this.loadedProgress}%`);

                if (this.loadedProgress == 100) {
                  this.loader.dismiss();
                }
              });
            });

          } // end if fileFound
        }); // end checkFile

    });
  }

  playSound() {

    if (this.soundReady) {

      if (!this.isPlaying) {

        this.isPlaying = true;

        this.mediaObject.play();

        this.subsPosition = Observable.interval(1000).subscribe(() => {

          this.mediaObject.getCurrentPosition().then((position) => {

            this.currentPosition = Math.floor(position);
            //console.log('current position : ' + this.currentPosition);

            if (this.duration == -1) {
              this.duration = Math.floor(this.mediaObject.getDuration());
            }

            if (this.currentPosition >= 1 && (this.currentPosition == this.duration)) {
              this.subsPosition.unsubscribe();
              this.currentPosition = 0;
              this.isPlaying = false;
            }
          });

        });

      } else {

        this.isPlaying = false;

        this.mediaObject.pause();
        this.subsPosition.unsubscribe();
      }
    }
  }

}
