import { Component, OnInit } from '@angular/core';
import { PublicPostService } from 'src/services/public-post/public-post.service';
import { SocialMediaLinkingService } from 'src/services/socialMediaLinking/social-media-linking.service';
import { ImageInfo, Post, VideoInfo } from '@octopi-dev/business-platform-models';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AddImageDialogComponent } from './add-image-dialog/add-image-dialog.component';
import { imageWithURL } from 'src/models/imageWithUrl';
import { DraftWizardService } from 'src/services/draft-wizard/draft-wizard.service';
import { SocialMediaSourceEnum } from '@octopi-dev/business-platform-models/enums';

export interface profile{
  name: string;
  pictureUrl: string;
  profileId: string;
  source: string;
}

interface Message {
  sender: string;
  text: string;
  images: Array<string>;
}

@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.page.html',
  styleUrls: ['./add-post.page.scss'],
})
export class AddPostPage implements OnInit {

  content: string = "";
  geminiContent: string = "";
  selectedProfileIds: Array<string> = [];
  linkedProfiles: Array<profile> = [];
  userId = localStorage.getItem("octopiUserId")!;
  userToken = localStorage.getItem("octopiUserToken")!;
  dateString = new Date().toISOString();
  postScheduleTime?: Date = undefined;
  imagesInfo: Array<string> = [];
  videosInfo: Array<string> = [];
  chatBoxImagesInfo: Array<string> = [];

  chatHistory: Message[] = [];
  newMessage: string = '';
  selectedProposal: string= '';

  constructor(
    private publicPostService: PublicPostService,
    private socialMediaLinkingService: SocialMediaLinkingService,
    private router: Router,
    private alertController: AlertController,
    private modalController: ModalController,
    private loadingController: LoadingController,
    private drafter: DraftWizardService
    // private http: HttpClient
  ) {
    this.getLinkedProfile();
    this.dateString = this.dateString.slice(0,19);
    this.dateString = this.dateString.replace('T', ' ');
  }

  ngOnInit() {
  }

  getChatBoxImages() {
    let images: Array<string> = [];
    if(this.chatBoxImagesInfo.length!=0){
      this.chatBoxImagesInfo.forEach(url => {
        images.push(url);
      });
    }
    this.chatBoxImagesInfo=[];
    return images;
  }
  

  async sendMessage() {
    const sent_msg = this.newMessage
    this.newMessage = ''; // clear input
    let message: Message = {
      sender : 'You',
      text : sent_msg,
      images : this.getChatBoxImages()
    };

    // Simulate sending message (replace with actual logic)
    this.chatHistory.push(message);
    
    console.log("from user:", sent_msg);

    document.getElementById("spinner")!.style.display = 'block'; // show spinner
    console.log('msg:', message);
    let res = await this.drafter.runGemini(message);
    
    document.getElementById("spinner")!.style.display = 'none'; // hide spinner
    
    // get response from Gemini
    console.log("from gemini:", res);
    this.chatHistory.push({ sender: 'Gemini', text: res, images:[] });
    return;
  }

  async getLinkedProfile(){
    // let userId = localStorage.getItem("octopiUserId")!;
    // let userToken = localStorage.getItem("octopiUserToken")!;
    let profile = localStorage.getItem('connectedProfle')!;
    console.log(profile);
    if(localStorage.getItem('connectedProfle')!=null || undefined){
      this.linkedProfiles = JSON.parse(localStorage.getItem('connectedProfle')!);
    } else {
      let res = await this.socialMediaLinkingService.getLinkedProfiles(this.userId, this.userToken);
      console.log(res);
      if(res.success){
        this.linkedProfiles = res.success.profiles;
        localStorage.setItem("connectedProfle", JSON.stringify(this.linkedProfiles));
        console.log(this.linkedProfiles);
      } else {
        throw new Error("Can't get linked profile.");
      }
    }
  }

  saveDraft(){
    console.log('This draft has been saved.');
  }

  async createPost(){
    this.presentLoading();
    if(this.content.length!=0){
      var images: Array<ImageInfo> = [];
      var videos: Array<VideoInfo> = [];
      if(this.imagesInfo.length!=0){
        this.imagesInfo.forEach(e => {
          const img: ImageInfo = {
            imageUrl: e
          };
          images.push(img);
        });
      } else if(this.videosInfo.length!=0){
        this.videosInfo.forEach(e => {
          const vdo: VideoInfo ={
            videoUrl: e
          }
          videos.push(vdo);
        });
      }
      if(images.length!=0){
        console.log('final images: ', images);
        const post: Post = {
          content: this.content,
          profileId: JSON.stringify(this.selectedProfileIds),
          scheduledPublishTime: new Date(this.postScheduleTime!).getTime(),
          imageInfo: images,
          source: SocialMediaSourceEnum.META
        };

        if (this.userId != null || "") {
          const res = await this.publicPostService.createPost(this.userId, post, this.selectedProfileIds);
    
          if (res.error == 0) {
            this.loadingController.dismiss();
            // this.presentAlert();
            console.log(res);
          } else {
            this.loadingController.dismiss();
            // console.log(res);
            console.log(res);
          }
          this.router.navigate(['/publisher']);
        }
      } else if(videos.length!=0){
        console.log('final videos: ', videos);
        const post: Post = {
          content: this.content,
          profileId: JSON.stringify(this.selectedProfileIds),
          scheduledPublishTime: new Date(this.postScheduleTime!).getTime(),
          videoInfo: videos,
          source: SocialMediaSourceEnum.META
        };

        if (this.userId != null || "") {
          const res = await this.publicPostService.createPost(this.userId, post, this.selectedProfileIds);
    
          if (res.error == 0) {
            // this.presentAlert();
            console.log(res);
          } else {
            this.loadingController.dismiss();
            // console.log(res);
            console.log(res);
          }
          this.router.navigate(['/publisher']);
        }
      } else {
        console.log('final images: ', images);
        const post: Post = {
          content: this.content,
          profileId: JSON.stringify(this.selectedProfileIds),
          scheduledPublishTime: new Date(this.postScheduleTime!).getTime(),
          source: SocialMediaSourceEnum.META
        };

        if (this.userId != null || "") {
          const res = await this.publicPostService.createPost(this.userId, post, this.selectedProfileIds);
    
          if (res.error == 0) {
            this.loadingController.dismiss();
            this.presentPostFailedAlert();
            console.log(res);
          } else {
            this.loadingController.dismiss();
            // console.log(res);
            console.log(res);
          }
          this.router.navigate(['/publisher']);
        }
      }
    } else {
      this.presentAlert();
    }
  }

  selectProfile(profile: profile){
    console.log(profile);
    if(this.selectedProfileIds.includes(profile.profileId)==false){
      this.selectedProfileIds.push(profile.profileId);
    } else if(this.selectedProfileIds.includes(profile.profileId)==true && this.selectedProfileIds.length == 1){
      this.selectedProfileIds = [];
      console.log(this.selectedProfileIds.length);
    } else if(this.selectedProfileIds.includes(profile.profileId)==true){
      const index = this.selectedProfileIds.indexOf(profile.profileId);
      this.selectedProfileIds = this.selectedProfileIds.splice(index-1, 1)
      console.log(this.selectedProfileIds.length);
    }
    console.log(this.selectedProfileIds);
  }

  selectOutput(message: Message){
    console.log(message);
    this.selectedProposal = message.text;
  }

  fitProposal(){
    this.content = this.selectedProposal;
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Alert',
      message: 'The content must not be empty.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  async presentPostFailedAlert() {
    const alert = await this.alertController.create({
      header: 'Alert',
      message: 'The post failed.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  discardPost(){
    this.content = "";
    this.router.navigate(['/publisher']);
  }

  deletePhoto(url: string){
    console.log('delete photo trigger', url);
    this.imagesInfo = this.imagesInfo.filter(e => e !== url);
  }

  deletePhotoForGeminiChatBox(url: string){
    console.log('delete chatbox photo trigger', url);
    this.chatBoxImagesInfo = this.chatBoxImagesInfo.filter(e => e !== url);
  }

  async uploadPhoto(){
    return await this.triggerPhotoUploadDialog(false);
  }

  async uploadPhotoForGemini(){
    return await this.triggerPhotoUploadDialog(true);
  }

  async triggerPhotoUploadDialog(forGemini: boolean=false){
    const modal = await this.modalController.create({
      component: AddImageDialogComponent,
    });
    modal.present();
    const { data, role } = await modal.onWillDismiss();
    if(role == 'confirm'){
      console.log("imageWithUrl: ", data);
      if(forGemini){
        this.chatBoxImagesInfo.push(data);
        console.log(this.chatBoxImagesInfo);
      }
      else{
        this.imagesInfo.push(data);
        console.log(this.imagesInfo);
      }
    }
  }

  async uploadVideo(){
    const modal = await this.modalController.create({
      component: AddImageDialogComponent,
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    if(role == 'confirm'){
      console.log("videoWithUrl: ", data);

      this.videosInfo.push(data);

      console.log(this.videosInfo);
    }
  }

  async presentLoading(){
    const loading = await this.loadingController.create({
      message: 'Please wait...',
      translucent: true,
    });
    return await loading.present();
  }

}
