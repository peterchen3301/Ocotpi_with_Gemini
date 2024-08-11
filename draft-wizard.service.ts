import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Buffer } from 'buffer';
import axios from 'axios';
// TODO: need to protect this API key, not sure what's the best practice
// in front-end code. Help will be appreciated.
const API_KEY = 'AIzaSyAUNpCPk-_Vc9Y9gZQTf3xdAfM-Ga54sDI';

@Injectable({
  providedIn: 'root'
})
export class DraftWizardService {

  private model : any;
  constructor() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
  }

  // TODO: better be runGemini(input: Message), where:
  // interface Message {
  //   sender: string;
  //   text: string;
  //   images: Array<string>;
  // }
  async runGemini(input: any): Promise<string> {
    try {
      let req = [input.text];
      console.log('req0:', req);
      if(input.images.length>0){
        for(let img_url of input.images){

          const response = await axios.get(img_url,  { responseType: 'arraybuffer', mode: "no-cors" });
          const buffer = Buffer.from(response.data, "base64");
          console.log("buffer:", buffer);
          req.push({
            inlineData: {
              data: buffer,
              mimeType: 'image/jpeg'
            },
          })
      }};
      console.log('input to gemini:', req);
      const result = await this.model.generateContent(req);
      const response = await result.response;
      const res = response.text();
      console.log(res);
      return res;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error('Error calling Gemini API: ' + error.message);
      }
    }
    return "";
  }
}