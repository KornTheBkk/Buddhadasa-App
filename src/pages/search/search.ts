import { SoundListenPage } from './../sound-listen/sound-listen';
import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Searchbar } from 'ionic-angular';

import { SoundProvider } from '../../providers/sound/sound';
import { ISound } from '../../interface/sound';

@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {

  @ViewChild('searchbar') searchbar: Searchbar;

  shouldShowCancel: boolean = false;
  find: string = null;

  items: Array<any> = [];
  totalItem: number = 0;
  isLoading: boolean = false;

  //config pagination
  page: number = 1;
  totalPage: number = 0;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public soundProvider: SoundProvider) {

  }

  ionViewDidLoad() {
    //console.log('ionViewDidLoad SearchPage');
  }

  ionViewWillEnter() {
    setTimeout(() => {
      this.searchbar.setFocus();
    }, 1000);

  }

  onInput(event) {
    //console.log('on input: ' + JSON.stringify(event));
    this.search();
  }

  onCancel(event) {
    //console.log('on cancel: ' + JSON.stringify(event));
  }

  resetValue() {
    this.page = 1;
    this.totalPage = 0;
    this.items = [];
    this.totalItem = 0;
    this.isLoading = false;
  }

  search() {

    this.items = [];

    if (this.find.trim()) {
      this.isLoading = true;

      this.soundProvider.search(this.find)
        .then((res: any) => {
          this.isLoading = false;
          //console.log((res));

          if (res.ok) {
            //this.items = res.data;
            //console.log(this.items);
            this.totalItem = res.total;
            //this.sounds = res.data;
            let data: Array<ISound> = res.data.data;
            data.forEach(s => {
              let item = {
                id: s.id,
                sound_category_id: s.sound_category_id,
                title: s.title,
                subtitle: s.subtitle,
                showed_at: s.showed_at,
                duration: s.duration,
                mp3_file: s.mp3_file
              };
              this.items.push(item);
            });

            this.page = res.data.current_page;
            this.totalPage = res.data.last_page;
            this.totalItem = res.data.total;

          } else {
            console.log('Retrive data failed');
          }

        })
        .catch(error => {
          this.isLoading = false;
          console.log('Error: ' + JSON.stringify(error));
        });
    } else {
      //console.log('reset value');
      this.resetValue();
    }
  }

  navigateToListen(sound: ISound) {
    if (sound.mp3_file) {
      this.navCtrl.push(SoundListenPage, sound);
    } else {
      console.log('Can\'t navigate to listen.');
    }
  }

  doInfinite(infiniteScroll) {
    let nextPage = this.page + 1;

    setTimeout(() => {

      if (this.find.trim()) {

        this.soundProvider.search(this.find, nextPage)
          .then((res: any) => {
            this.isLoading = false;
            //console.log((res));

            if (res.ok) {

              this.totalItem = res.total;

              let data: Array<ISound> = res.data.data;
              data.forEach(s => {
                let item = {
                  id: s.id,
                  sound_category_id: s.sound_category_id,
                  title: s.title,
                  subtitle: s.subtitle,
                  showed_at: s.showed_at,
                  duration: s.duration,
                  mp3_file: s.mp3_file
                };
                this.items.push(item);
              });

              this.page = res.data.current_page;
              this.totalPage = res.data.last_page;
              this.totalItem = res.data.total;

            } else {
              console.log('Retrive data failed');
            }

          })
          .catch(error => {
            this.isLoading = false;
            console.log('Error: ' + JSON.stringify(error));
          });
      }

      infiniteScroll.complete();
    }, 1000);
  }

}
