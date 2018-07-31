import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {

  }




  imgClick(){
    alert('Hello Muhammed Essa');
  }

  img1(){
    alert('Hello img1');
  }

  img2(){
    alert('Hello img2');
  }

  img3(){
    alert('Hello img3');
  }


  img4(){
    alert('Hello img4');
  }

}
