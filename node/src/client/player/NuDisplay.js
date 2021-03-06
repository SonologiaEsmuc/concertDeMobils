/**
 * NuDisplay: nu module in charge of visual feedback
 **/

import * as soundworks from 'soundworks/client';
const client = soundworks.client;
const audioContext = soundworks.audioContext;

export default class NuDisplay extends soundworks.Canvas2dRenderer {
  constructor(playerExperience) {
    super(1/24); // update rate = 0: synchronize updates to frame rate
    this.moduleName = 'nuDisplay'; 

    // local attributes
    this.e = playerExperience;
    this.params = {
      'feedbackGain': 1.0,
      'enableFeedback': true
    };

    this.colors = {
      'rest': [0,0,0], 
      'active': [255, 255, 255], 
      'current': [0,0,0],
      'glitch': [0,0,0]
    };

    this.audioAnalyser = new AudioAnalyser();
    this.bkgChangeColor = false;
    this.numOfElmtInNeedOfMe = 0;
    this.isGlitching = false;
    this.isRandomGlitching = false;
    this.notificationsList=[
    "./Application Scripts/243LU875E5.groups.com.apple.podcasts:",
"./Application Scripts/74J34U3R6X.com.apple.iWork",
"./Application Scripts/Adobe-Hub-App",
"./Application Scripts/JQ525L2MZD.com.adobe.JQ525.flags",
"./Application Scripts/com.ABabe.rarextractorfree",
"./Application Scripts/com.adobe.accmac.ACCFinderSync",
"./Application Scripts/com.adobe.accmac.explinder",
"./Application Scripts/com.apowersoft.ApowersoftAudioRecorder",
"./Application Scripts/com.apple.AMPArtworkAgent",
"./Application Scripts/com.apple.AMPDeviceDiscoveryAgent",
"./Application Scripts/com.apple.AVConference.Diagnostic",
"./Application Scripts/com.apple.ActionKit.BundledIntentHandler",
"./gmail_documents Scripts/com.apple.AirPlayUIAgent",
"./gmail_documents Scripts/com.apple.Animoji.StickersApp.MessagesExtension",
"./gmail_documents Scripts/com.apple.AppSSOKerberos.KerberosExtension",
"./gmail_documents/com.apple.AppStore",
"./gmail_documents/com.apple.AuthKitUI.AKFollowUpServerUIExtension",
"./gmail_documents/com.apple.AvatarUI.AvatarPickerMemojiEditor",
"./gmail_documents/com.apple.AvatarUI.AvatarPickerMemojiPicker",
"./gmail_documents/com.apple.AvatarUI.AvatarPickerPosePicker",
"./gmail_documents/com.apple.BKAgentService",
"./Application Scripts/com.apple.CalendarAgent",
"./Application Scripts/com.apple.CalendarFileHandler",
"./Application Scripts/com.apple.CalendarNotification.CalNCService",
"./Application Scripts/com.apple.CalendarWeatherKitService",
"photos.help.bell.010_basics.035_symbols.maxpat",
"photos.help.bell.010_basics.037_moreaboutsymbols.maxpat",
"photos.help.bell.010_basics.040_implicitllllconstruction.maxpat",
"photos.help.bell.010_basics.050_precedence.maxpat",
"photos.help.bell.010_basics.060_unaryoperators.maxpat",
"photos.help.bell.010_basics.070_retrievalofelements.maxpat",
"photos.help.bell.010_basics.080_pickingelements.maxpat",
"photos.help.bell.010_basics.090_accessbykeys.maxpat",
"photos.help.bell.010_basics.100_rangeoperator.maxpat",
"photos.help.bell.010_basics.105_repeatoperator.maxpat",
"photos.help.bell.010_basics.110_print.maxpat",
"fotos.010_basics.120_comments.maxpat",
"photos.help.bell.010_basics.130_examples.maxpat",
"./ENE/BLO_vst/OrilRiver Mac/OrilRiver.vst/Contents/Resources",
"./ENE/BLO_vst/SSSM203/MacVST/++binaural.vst/Contents/MacOS",
"./MAX/micro-mellotron-pre/samplesets/FreedomMorton3-17_Release_v1.02/OrganInstallationPackages/001173/Traps",
"./MAX/micro-mellotron-pre/samplesets/Lacaud_904_orgue_conn-720/20",
"./Documents/node/node_modules/soundworks/node_modules/jsonfile",
"./Documents/node/node_modules/speaker/deps/mpg123/src/output",
"./Documents/node/node_modules/sqlite3/node_modules/console-control-strings",
"./Documents/node/node_modules/sqlite3/node_modules/has-unicode",
"./Documents/node/node_modules/sqlite3/node_modules/readable-stream/lib/internal/streams",
"./gmail_documents/com.apple.CalendarAgent",
"./gmail_documents/com.apple.CalendarFileHandler",
"./gmail_documents/com.apple.CalendarNotification.CalNCService",
"./gmail_documents/com.apple.CalendarWeatherKitService",
"photos.help.bell.010_basics.035_symbols.maxpat"
    ];

this.notificationsChismesList=[
    "ja m'havia semblat que era culpable",
  "??s escoria",
  "get, pareu amb aixo",
  "es indignant",
  "a la horca",
  "les multinacionals son les millors",
  "google ens salvar??",
  "Zuckelberg sembla un bon paio, mai ens faria aix??",
  "??s gratis, que mes vols",
  "les empreses privades son les fan moure el m??n",
  "??s un bon servei",
  "quin mal hi ha a donar les dades?",
      "ja m'havia semblat que era culpable",
  "??s escoria",
  "get, pareu amb aixo",
  "es indignant",
  "a la horca",
  "les multinacionals son les millors",
  "google ens salvar??",
  "Zuckelberg sembla un bon paio, mai ens faria aix??",
  "??s gratis, que mes vols",
  "les empreses privades son les fan moure el m??n"
    ];
    this.isNotifying = false;
    this.isNotifyingChismes = false;
    this.chismesCounter = 0;
    this.inputText = "";
    this.isFading = false;

    // this.bkgColorArray = [0,0,0];
    this.blinkStatus = { isBlinking: false, savedBkgColor: [0,0,0] };

    // binding
    this.analyserCallback = this.analyserCallback.bind(this);
    this.animateLoop = this.animateLoop.bind(this);
    this.animateFade = this.animateFade.bind(this);

    // setup receive callbacks
    this.e.receive(this.moduleName, (args) => {
      // get header
      let name = args.shift();
      // convert singleton array if need be
      args = (args.length == 1) ? args[0] : args;
      if( this.params[name] !== undefined )
        this.params[name] = args; // parameter set
      else
        this[name](args); // function call
    });

    // notify module is ready to receive msg
    this.e.send('moduleReady', this.moduleName);    
    
    // ATTEMPT AT CROSSMODULE POSTING: FUNCTIONAL BUT ORIGINAL USE NO LONGER CONSIDERED: TODELETE WHEN CONFIRMED
    // setup internal callback
    // console.log('setup event listener')
    // window.addEventListener("message", (event) => {
    //   console.log('received msg', event);
    //   if( event.origin !== location.origin || event.data[0] !== 'nuDisplay' )
    //     return;
    //   console.log(event.data[4]);
    //   this.restColor([255*event.data[4], 0, 0]);
    // }, false);
    // ----------
    
  }

  // define rest color: the screen color when no sound is playing
  restColor(rgb){
    this.colors.rest = rgb;
    // update background only if analyser not active
    if( this.numOfElmtInNeedOfMe == 0 ){
      this.setCurrentColorAmpl(0);
      this.overrideForceRender = true;
    }
  }

  // define active color: the screen color when sound is playing
  activeColor(rgb){
    this.colors.active = rgb;
  }  

  /**
   * Initialize rederer state.
   * @param {Number} dt - time since last update in seconds.
   */
  init() {}

  /**
   * Update rederer state.
   * @param {Number} dt - time since last update in seconds.
   */
  update(dt) {}

  /**
   * Draw into canvas.
   * Method is called by animation frame loop in current frame rate.
   * @param {CanvasRenderingContext2D} ctx - canvas 2D rendering context
   */
  render(ctx) {
    if ( this.bkgChangeColor && this.params.enableFeedback || this.overrideForceRender ) {
      // console.log(this.bkgColor);
      // ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgb('
        + Math.round(this.colors.current[0]) + ','
        + Math.round(this.colors.current[1]) + ','
        + Math.round(this.colors.current[2]) + ')';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      this.overrideForceRender = false;
      this.bkgChangeColor = false
    }

    const canvas = document.getElementById('main-canvas');
      const ctx2 = canvas.getContext('2d');
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    ctx2.fillStyle = 'white';
    ctx2.strokeStyle = 'white';
     if(this.isNotifying == true)
      {
            if(Math.floor(Math.random()*10 < 5))
            {
            	var num = Math.floor(Math.random()*50);
            	document.getElementById('text3').innerHTML = this.notificationsList[num];
          	}
          //label(ctx2,cw,ch*0.8,"scanning hard disks ....",0);
      }

      if(this.isNotifyingChismes == true)
      {
            if(Math.floor(Math.random()*50 < 1))
            {
            	if(this.chismesCounter < 20)
              		document.getElementById('text3').innerHTML = this.notificationsChismesList[this.chismesCounter];
            	this.chismesCounter ++;
          }
          //label(ctx2,cw/2,ch*0.8,"Els vostres comentaris:",0);
      }
  }

  // enable display, i.e. add +1 to its stack of "I need you display" clients
  enable(){
    this.numOfElmtInNeedOfMe += 1;
    // if need to be triggered on for the first time:
    if( this.numOfElmtInNeedOfMe == 1 ){
      requestAnimationFrame(this.analyserCallback);
    }
  }

  // disable display, i.e. remove 1 from its stack of "I need you display" clients
  disable(){
    // decrement status
    this.numOfElmtInNeedOfMe = Math.max(this.numOfElmtInNeedOfMe-1, 0);
    // reset background color
    if( this.numOfElmtInNeedOfMe == 0 ){
      this.bkgChangeColor = true;
    }
  }

  /*
   * Change GUI background color based on current amplitude of sound being played
   */
  analyserCallback() {
    if( this.numOfElmtInNeedOfMe >= 1 || !this.blinkStatus.isBlinking ) {
      // call me once, I'll call myself over and over
      requestAnimationFrame(this.analyserCallback);
      // change background color based on current amplitude
      let amp = this.audioAnalyser.getAmplitude();
      amp *= this.params.feedbackGain;
      this.setCurrentColorAmpl(amp);
      // notify to change color at next animation frame
      this.bkgChangeColor = true;
    }
  }

  // amplitude to color converter
  setCurrentColorAmpl(amp){
    for (let i = 0; i < this.colors.current.length; i++) {
      this.colors.current[i] = this.colors.rest[i]  + 
                               amp * ( this.colors.active[i] - this.colors.rest[i] );
    }    
  }

  // change screen color to 'color' for 'time' duration (in sec)
  blink(color, time = 0.4){
    // discard if already blinking
    if( this.blinkStatus.isBlinking ){ return; }
    this.blinkStatus.isBlinking = true;
    // save current background color
    for (let i = 0; i < 3; i++)
      this.blinkStatus.savedBkgColor[i] = this.colors.current[i];
    // change bkg color
    this.colors.current = color;
    this.bkgChangeColor = true;
    setTimeout(() => { 
      for (let i = 0; i < 3; i++)
        this.colors.current[i] = this.blinkStatus.savedBkgColor[i];
      this.blinkStatus.isBlinking = false
      this.bkgChangeColor = true;
    }, time * 1000);
  }

  // defined text (on top of the player's screen) from OSC client (header)
  text1(args){
    let str = this.formatText(args);
    document.getElementById('text1').innerHTML = str;
    
  }

  // defined text (on middle of the player's screen) from OSC client (instructions)
  text2(args){
    let str = this.formatText(args);
    document.getElementById('text2').innerHTML = str;
  }

  // defined text (on bottom of the player's screen) from OSC client (sub-instructions)
  text3(args){
    let str = this.formatText(args);
    document.getElementById('text3').innerHTML = str;
  }

  // convert array of elements to string
  formatText(args){
    let str = '';
    // simple string
    if( typeof args === 'string' ){ str = args; }
    // array of strings
    else{ args.forEach( (elmt) => { str += ' ' + elmt;  }); }
    // replace "cliendId" with actual client index and other conventional naming
    str = str.replace("clientId", client.index);
    str = str.replace("None", '');
    // return formatted string
    return str;
  }

  // set analyzer min audio dB range (clip)
  dBmin(value){
    if( value > -100 && value < 0 && value < this.audioAnalyser.in.maxDecibels )
      this.audioAnalyser.in.minDecibels = value;
  }

  // set analyzer max audio dB range (clip)
  dBmax(value){
    if( value > -100 && value < 0 && value < this.audioAnalyser.in.minDecibels )
      this.audioAnalyser.in.maxDecibels = value;
  }

  // set visualizer smoothing time constant (to avoid epileptic prone behaviors from player's devices)
  smoothingTimeConstant(value){
    if( value >= 0 && value <= 1 )
      this.audioAnalyser.in.smoothingTimeConstant = value;
  }

  // set min frequency considered by the analyzer
  freqMin(value){
    if( value > 0 && value < this.audioAnalyser.maxFreq ){
      this.audioAnalyser.minFreq = value;
      this.audioAnalyser.updateBinNorm();
    }
  }

  // set max frequency considered by the analyzer
  freqMax(value){
    if( value < 20000 && value > this.audioAnalyser.minFreq ){
      this.audioAnalyser.maxFreq = value;
      this.audioAnalyser.updateBinNorm();
    }
  }

  // change screen color to 'color' for 'time' duration (in sec)
  glitch(args){
    let color=[0,0,0];
    color[0] = args.shift();
    color[1] = args.shift();
    color[2] = args.shift();
    let time = args.shift();
    let isRandom = args.shift();
    
    // discard if already blinking
    if( this.blinkStatus.isBlinking ){ return; }
    this.blinkStatus.isBlinking = true;
    // save current background color
    for (let i = 0; i < 3; i++)
      this.blinkStatus.savedBkgColor[i] = this.colors.current[i];

    for (let i = 0; i < 3; i++)
      this.colors.glitch[i] = color[i];
    // change bkg color
//    for (let i = 0; i < 3; i++)
//        this.colors.current[i] = color[i];
    this.bkgChangeColor = true;
    this.isGlitching = true;
    this.isRandomGlitching = isRandom;
    this.animateLoop();

    setTimeout(() => { 
       this.isGlitching = false;
      for (let i = 0; i < 3; i++)
         this.colors.current[i] = this.blinkStatus.savedBkgColor[i];
      this.blinkStatus.isBlinking = false
      this.bkgChangeColor = true;
    }, time * 1000);
  }

  fade(){
    this.isFading = true;
    this.animateFade();

    setTimeout(() => { 
       this.isFading = false;
    }, 5 * 1000);
  }

 // change screen color to a random color for 'time' duration (in sec)
  randomBlink(time = 0.4){
    // discard if already blinking
    if( this.blinkStatus.isBlinking ){ return; }
    this.blinkStatus.isBlinking = true;
    // save current background color
    for (let i = 0; i < 3; i++)
      this.blinkStatus.savedBkgColor[i] = this.colors.current[i];
    // change bkg color

    for (let i = 0; i < 3; i++)
        this.colors.current[i] = Math.floor(Math.random()*255);
    this.bkgChangeColor = true;

    setTimeout(() => { 
      this.blinkStatus.isBlinking = false
      this.bkgChangeColor = true;
      for (let i = 0; i < 3; i++)
         this.colors.current[i] = this.blinkStatus.savedBkgColor[i];
    }, time * 1000);
  }

  notifications(value){
    if(value == 'chismes')
    { 
      this.chismesCounter = 0;
        document.getElementById('text3').innerHTML = this.inputText;
       this.isNotifyingChismes = true;
       this.isNotifying = false;
       setTimeout(() => { 
          this.isNotifyingChismes = false;
          document.getElementById('text3').innerHTML = "segur que no soc un bot?";
      }, 10 * 1000);
    }
    if(value == 'data')
    {
       this.isNotifying = true;
       this.isNotifyingChismes = false;
       setTimeout(() => { 
          this.isNotifying = false;
          document.getElementById('text3').innerHTML = "Transferred information";
      }, 8 * 1000);
    }
  }

  popup(value){
     alert(value);
  }

  popup(args){
    let str = this.formatText(args);
    alert(str);
  }

  popupTextBox(args){
    let str = this.formatText(args);
    this.inputText = prompt(str);
  }

  animateLoop()
  {
    if(this.isGlitching == true)
    {
      		//console.log("IN");
	      var randNum = Math.floor(Math.random()*100);
	        if(randNum < 30)
	        {
	            for (let i = 0; i < 3; i++)
	              this.colors.current[i] = this.blinkStatus.savedBkgColor[i];

	            this.bkgChangeColor = true;
	        }else if(randNum > 70)
	        {
	            if(this.isRandomGlitching){
	              for (let i = 0; i < 3; i++)
	                this.colors.current[i] = Math.floor(Math.random()*255);
	            }else
	            {
	              for (let i = 0; i < 3; i++)
	                this.colors.current[i] = this.colors.glitch[i];
	            }
	            this.bkgChangeColor = true;
	        }
	    }

	    if(this.isGlitching == true) 
     	   requestAnimationFrame(this.animateLoop);
	}
	

  animateFade()
  {
    if(this.isFading == true)
    {
      
        if(this.colors.current[0] < 255)
              this.colors.current[0]=this.colors.current[0]+0.01;

        this.bkgChangeColor = true;
        this.overrideForceRender = true;

    if(this.isFading == true) 
        requestAnimationFrame(this.animateFade);
	}
  }

}


/**
 * Audio analyzer for visual feedback of sound amplitude on screen
 */

class AudioAnalyser {
  constructor() {
    // input node
    this.in = audioContext.createAnalyser();
    this.in.smoothingTimeConstant = 0.2;
    this.in.fftSize = 32;
    // compression
    this.in.minDecibels = -100;
    this.in.maxDecibels = -50;
    // limit analyser spectrum
    this.minFreq = 200; // in Hz
    this.maxFreq = 8000; // in Hz
    this.updateBinNorm();
    // pre-allocation of freqs ampl. array
    this.magnitudes = new Uint8Array(this.in.frequencyBinCount);
  }

  // update normalization parameters
  updateBinNorm(){
    let norm = this.in.fftSize / audioContext.sampleRate;
    this.minBin = Math.round(this.minFreq * norm);
    this.maxBin = Math.round(this.maxFreq * norm);
    this.binsNormalisation = 1 / (this.maxBin - this.minBin + 1);
  }

  // return current analyzer amplitude (no freq. specific) between 0 and 1
  getAmplitude() {
    // extract data from analyzer
    this.in.getByteFrequencyData(this.magnitudes);
    // get average amplitude value
    let amplitude = 0.0;
    for( let i = this.minBin; i <= this.maxBin; ++i ) {
      amplitude += this.magnitudes[i];
    }
    amplitude *= this.binsNormalisation / 250;
    // let norm = this.in.frequencyBinCount * 100; // arbitrary value, to be cleaned
    return amplitude;
  }

}

function label(ctx,posx, posy, text, angle)
{
    ctx.save();
  ctx.translate(posx, posy);
  ctx.textAlign ="center";
  ctx.font = '18px Quicksand';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
