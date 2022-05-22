/**
 * NuTemplate: example of how to create a Nu module
 **/

import NoSleep from 'nosleep.js';
import NuBaseModule from './NuBaseModule'
import * as soundworks from 'soundworks/client';
import audioFiles from '../shared/audioFiles';

const client = soundworks.client;
const audioContext = soundworks.audioContext;

var noSleep = new NoSleep();
// previous impl. was based on audio buffer calls view integer.
// adapt: from name to integar to avoid changing whole code here.
const audioFileNameToId = new Map();
const audioFileIdToName = new Map();
var count = 0;
for (var key in audioFiles) {
  if (audioFiles.hasOwnProperty(key)) {
    audioFileNameToId.set(key, count);
    audioFileIdToName.set(count, key);
    count += 1;
  }
}

export default class NuTemplate extends NuBaseModule {
  constructor(playerExperience) {
    super(playerExperience, 'nuTemplate');
//    super(playerExperience, 'nuProbe');

    // local attributes
  this.params = {
      'gain': 0.1,
      'gainB': 0.1,
      'frq': 440,
      'filterFrq':20000,
      'filterQ':1,
      'type': "square",
    };

    this.throttle = {
      'acc': [Infinity, Infinity, Infinity],
      'accThreshold': 2.5,
      'ori': [Infinity, Infinity, Infinity],
      'oriThreshold': 3,
      'energy': Infinity,
      'energyThreshold': 0.1,
      'touch': [Infinity, Infinity]
    };
    this.callBackStatus = {
      ori: false,
      acc: false, 
      energy: false,
      touch: false
    };
  
    this.colors = {
      'rest': [0,0,0], 
      'active': [255, 255, 255], 
      'current': [0,0,0],
      'glitch': [0,0,0]
    };

    this.surface = new soundworks.TouchSurface(this.e.view.$el);

    // binding

     // Note: all callbacks in aftewards section are enabled / disabled with the methods 
  // at scripts' end (via OSC msg)

 
    this.touchStartCallback = this.touchStartCallback.bind(this);
    this.touchMoveCallback = this.touchMoveCallback.bind(this);
    this.touchEndCallback = this.touchEndCallback.bind(this);
    this.scene = this.scene.bind(this);

    // binding
    this.directToClientMethod = this.directToClientMethod.bind(this);
    this.startOsc = this.startOsc.bind(this); 
    this.setFrqOsc = this.setFrqOsc.bind(this);
    this.setVolOsc = this.setVolOsc.bind(this);
    this.synthType = this.synthType.bind(this);
    this.setTuneOscB = this.setTuneOscB.bind(this);
    this.setVolOscB = this.setVolOscB.bind(this);
    this.synthTypeB = this.synthTypeB.bind(this);
    this.setFilterFrq = this.setFilterFrq.bind(this);
    this.setFilterQ = this.setFilterQ.bind(this);
    this.animate = this.animate.bind(this); // activate waveform animation

    this.setTypeLfo = this.setTypeLfo.bind(this);
    this.setFrqLfo = this.setFrqLfo.bind(this);
    this.setAmpLfo = this.setAmpLfo.bind(this);
    this.setFunctionLfo = this.setFunctionLfo.bind(this);
    this.setTypeLfo2 = this.setTypeLfo2.bind(this);
    this.setFrqLfo2 = this.setFrqLfo2.bind(this);
    this.setAmpLfo2 = this.setAmpLfo2.bind(this);
    this.setFunctionLfo2 = this.setFunctionLfo2.bind(this);
    this.samplePlay = this.samplePlay.bind(this);
    this.sampleStop = this.sampleStop.bind(this);
    this.sampleLoopIn = this.sampleLoopIn.bind(this);
    this.sampleLoopOut = this.sampleLoopOut.bind(this);
    this.sampleVol = this.sampleVol.bind(this);
    this.sampleOffsetSpeed = this.sampleOffsetSpeed.bind(this);
    this.sampleSpeed = this.sampleSpeed.bind(this);
    this.sampleLen = this.sampleLen.bind(this);
    this.sampleLoopRandIn = this.sampleLoopRandIn.bind(this);
    this.convolverVol = this.convolverVol.bind(this); // convolution volume
    this.convolverIR = this.convolverIR.bind(this); // convolution volume
    this.delayFbk = this.delayFbk.bind(this); // delay feedback gain
    this.delayTime = this.delayTime.bind(this); // delay time
    this.animateLoop = this.animateLoop.bind(this); // every frame loop animation
    this.animateNotification = this.animateNotification.bind(this); // every frame loop animation
    this.bgColor = this.bgColor.bind(this); // background color
    this.blink = this.blink.bind(this); // background color
    this.text1 = this.text1.bind(this); 
    this.text2 = this.text2.bind(this); 
    this.text3 = this.text3.bind(this); 
    this.notifications = this.notifications.bind(this);
    this.popup = this.popup.bind(this);
    this.delFrqOsc = this.delFrqOsc.bind(this);
    this.samplePlayRand = this.samplePlayRand.bind(this);
    this.sampleOneShot = this.sampleOneShot.bind(this);
    this.animate2Frq1 = this.animate2Frq1.bind(this);
    this.animate2Frq2 = this.animate2Frq2.bind(this);
    this.osc2Frq = this.osc2Frq.bind(this);
    this.osc2FrqOff = this.osc2FrqOff.bind(this);
    this.oneShot = this.oneShot.bind(this);
    this.oneSweep = this.oneSweep.bind(this);

    this.methodTriggeredFromServer = this.methodTriggeredFromServer.bind(this);

    // setup receive callbacks
    this.e.receive('nuTemplate_methodTriggeredFromServer', this.methodTriggeredFromServer);

    this.monoOsc1 = audioContext.createOscillator();  // oscillator voice1
    this.monoOsc2 = audioContext.createOscillator();  
    this.monoOsc3 = audioContext.createOscillator();
    this.oscGain1 = audioContext.createGain(); // gain oscillator voice1
    this.oscGain2 = audioContext.createGain();
    this.oscGain3 = audioContext.createGain();
    this.filter = audioContext.createBiquadFilter();
    this.monoOscB1 = audioContext.createOscillator(); // extra oscillator voice1
    this.monoOscB2 = audioContext.createOscillator();
    this.monoOscB3 = audioContext.createOscillator();
    this.oscGainB1 = audioContext.createGain();	// gain extra oscillator voice1
    this.oscGainB2 = audioContext.createGain();
    this.oscGainB3 = audioContext.createGain();
    this.lfo = audioContext.createOscillator();
    this.lfoGain = audioContext.createGain();
    this.lfo2 = audioContext.createOscillator();
    this.lfoGain2 = audioContext.createGain();
    this.bufferSource = audioContext.createBufferSource();
    this.bufferGain = audioContext.createGain();
    this.analyser =  audioContext.createAnalyser(); // analyser for waveform animation
    this.convolver = audioContext.createConvolver();
	this.convolverGain = audioContext.createGain();
	this.convolverGainToDelay = audioContext.createGain();
    this.delay = audioContext.createDelay();
	this.delayGain = audioContext.createGain();
	this.delayGainOwn = audioContext.createGain();

    // conenctions
    this.monoOsc1.connect(this.oscGain1);
    this.monoOsc2.connect(this.oscGain2);
    this.monoOsc3.connect(this.oscGain3);
    this.oscGain1.connect(this.filter);
    this.oscGain2.connect(this.filter);
    this.oscGain3.connect(this.filter);
    this.monoOscB1.connect(this.oscGainB1);
    this.monoOscB2.connect(this.oscGainB2);
    this.monoOscB3.connect(this.oscGainB3);
    this.oscGainB1.connect(this.filter);
    this.oscGainB2.connect(this.filter);
    this.oscGainB3.connect(this.filter);
    this.filter.connect(this.analyser);
    this.analyser.connect(this.e.nuOutput.in);
    this.lfo.connect(this.lfoGain);   
    this.lfo2.connect(this.lfoGain2);   
    this.bufferSource.connect(this.bufferGain);
    this.bufferGain.connect(this.filter);
    this.filter.connect(this.convolver);
    this.convolver.connect(this.convolverGain);
    this.convolver.connect(this.convolverGainToDelay);
    this.convolverGain.connect(this.e.nuOutput.in);
    this.delay.connect(this.delayGain);
    this.delay.connect(this.delayGainOwn);
    this.convolverGainToDelay.connect(this.delay);
    this.delayGain.connect(this.convolver);
    this.delayGainOwn.connect(this.delay);
    this.filter.connect(this.delay);

    this.filter.type =  "lowpass";
    this.monoOsc1.type = 'square';
    this.monoOsc2.type = 'square';
    this.monoOsc3.type = 'square';
    this.monoOscB1.type = 'square';
    this.monoOscB2.type = 'square';
    this.monoOscB3.type = 'square';
    this.oscGain1.gain.value=this.params.gain;
    this.oscGain2.gain.value=this.params.gain;
    this.oscGain3.gain.value=this.params.gain;
    this.oscGainB1.gain.value=this.params.gainB;
    this.oscGainB2.gain.value=this.params.gainB;
    this.oscGainB3.gain.value=this.params.gainB;
    this.isStarted1 = false;  // osc voice1 is started?
    this.isStarted2 = false;
    this.isStarted3 = false;
    this.filter.frequency.value = this.params.frq;
    this.filter.Q.value = this.params.filterQ;
    this.currOscFrq1 = 440.;
    this.currOscFrq2 = 440.;
    this.currOscFrq3 = 440.;
    this.currOscType = 'square';
    this.currOscFrqB = 440.;

	this.OscFrqTouchOffset = 0; // freq touch deviation

    this.currOscTypeB = 'square';
    this.currentLfoType = 'square';
    this.currFilterFrq = 20000;
    this.currFilterQ = 1.;
    this.currGain1 = this.params.gain;
    this.currGain2 = this.params.gain;
    this.currGain3 = this.params.gain;
    this.currGainB = this.params.gainB; 
    this.currGainB1 = 0.;
    this.currLfoFrq = 1.;
    this.currLfoGain = 0.;   
    this.currLfoFrq2 = 1.;
    this.currLfoGain2 = 0.;   
    this.glideTime = 0.1;
    this.lfoFunction = 'none';
    this.lfoFunction2 = 'none';
    this.tuneDiff = 0; //extra Osc tune difference from osc
    this.bufferSource.loop = false;
    this.bufferGain.gain.value = 1.;
    this.convolverGain.gain.value = 0.;
    this.sampleOffset = 0;
  	this.sampleLoopLen = 0.1;
    this.animateOn = 0;
    this.touchX=0.5;
    this.touchY=0.5;
    this.isTouching = false;
    this.colorsR=255;
    this.colorsG=0;
    this.colorsB=0;
    this.circleTouchPosX = 0.5;
    this.circleTouchPosY = 0.5;
  	this.sceneSel = 'none';
	this.FilterFrqTouchOffset = 0.;
	this.delayGain.gain.value = 0;
	this.convolverGainToDelay.gain.value = 0.1;
	this.magnitudes = new Uint8Array(this.analyser.fftSize);
	this.blinkStatus = { isBlinking: false, savedBkgColor: [0,0,0] };
	this.loopLenMultiples=[0.125,0.25,0.5,1,0.75,0.5,0.5];
	this.loopXposCurrent = 0.5;
	this.lastSampleLoopLen = 0.6;
    this.touchY_inertia = 0.5;
    this.delayedCurrOscFrq1 = 440.;
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
  "és escoria",
  "get, pareu amb aixo",
  "es indignant",
  "a la horca",
  "les multinacionals son les millors",
  "google ens salvarà",
  "Zuckelberg sembla un bon paio, mai ens faria això",
  "és gratis, que mes vols",
  "les empreses privades son les fan moure el món",
  "és un bon servei",
  "quin mal hi ha a donar les dades?",
      "ja m'havia semblat que era culpable",
  "és escoria",
  "get, pareu amb aixo",
  "es indignant",
  "a la horca",
  "les multinacionals son les millors",
  "google ens salvarà",
  "Zuckelberg sembla un bon paio, mai ens faria això",
  "és gratis, que mes vols",
  "les empreses privades son les fan moure el món"
    ];
    this.isNotifying = false;
    this.isNotifyingChismes = false;
    this.chismesCounter = 0;
    this.inputText = "";

    this.frq2frq1 = 440.;
    this.frq2frq2 = 440.;
    this.frq2time = 600;
    this.frq2On = false;

  	const audioBuffer = this.e.loader.data['ElyChapel'];
    this.convolver.buffer = audioBuffer;
    this.filter.frequency.setValueAtTime(20000,audioContext.currentTime);

 //   document.addEventListener('click', function enableNoSleep(){
 //   	document.removeEventLIstener('click', enableNoSleep, false);
    	noSleep.enable();
 //   }, false);
  }


  // trigger event directly from OSC client
  startOsc(args){
    let voice = args.shift();
    let value = args.shift();

    if(voice === 1)
    {
	    if (value === 1 && !this.isStarted1) {
	      this.monoOsc1 = audioContext.createOscillator();
	      this.monoOsc1.frequency.value = this.currOscFrq1;
  		  this.monoOsc1.type = this.currOscType;
        this.monoOscB1 = audioContext.createOscillator();
        this.monoOscB1.type = this.currOscTypeB;     

        var tempNote = (69 + 12 * Math.log2(this.currOscFrq1/440)) + this.tuneDiff; 
        this.monoOscB1.frequency.value = (440/32) * (2 ** ((tempNote - 9) / 12)); 
	      this.monoOsc1.connect(this.oscGain1);
	      this.monoOscB1.connect(this.oscGainB1);
	      this.oscGain1.gain.value = this.currGain1;
	      this.oscGainB1.gain.value = this.currGain1 * this.currGainB;
	        
	      this.isStarted1 = true;
	      //this.monoOsc
	      this.monoOsc1.start();
	      this.monoOscB1.start();
	    } 
      if (value === 0 && this.isStarted1) {
	        this.currOscFrq1 = this.monoOsc1.frequency.value;
	        this.currOscType = this.monoOsc1.type;
	        this.currOscTypeB = this.monoOscB1.type;
	        this.currGain1 = this.oscGain1.gain.value;
	        this.monoOsc1.stop();
	        this.monoOscB1.stop();

          this.isStarted1 = false;
	     }
	   }
	
    if(voice === 2)
    {
	    if (value === 1 && !this.isStarted2) {
	      	this.monoOsc2 = audioContext.createOscillator();
	      	this.monoOsc2.frequency.value = this.currOscFrq2;
  		  	this.monoOsc2.type = this.currOscType;
        	this.monoOscB2 = audioContext.createOscillator();
        	this.monoOscB2.type = this.currOscTypeB;

        	var tempNote = (69 + 12 * Math.log2(this.currOscFrq2/440)) + this.tuneDiff; 
        	this.monoOscB2.frequency.value = (440/32) * (2 ** ((tempNote - 9) / 12)); 
	      this.monoOsc2.connect(this.oscGain2);
	      this.monoOscB2.connect(this.oscGainB2);
	      this.oscGain1.gain.value = this.currGain1;
	      this.oscGainB2.gain.value = this.currGain2 * this.currGainB;
	        
	      this.isStarted2 = true;
	      this.monoOsc2.start();
	      this.monoOscB2.start();
	    } 
	     if (value === 0 && this.isStarted2) {
	        this.currOscFrq2 = this.monoOsc2.frequency.value;
	        this.currOscType = this.monoOsc2.type;
	        this.currOscTypeB = this.monoOscB2.type;
	        this.currGain2 = this.oscGain2.gain.value;
	        this.monoOsc2.stop();
	        this.monoOscB2.stop();
 
         this.isStarted2 = false;
	      }	    
	   }

    if(voice === 3)
    {
	    if (value === 1 && !this.isStarted3) {
	      this.monoOsc3 = audioContext.createOscillator();
	      this.monoOsc3.frequency.value = this.currOscFrq3;
  		  this.monoOsc3.type = this.currOscType;
          this.monoOscB3 = audioContext.createOscillator();

          var tempNote = (69 + 12 * Math.log2(this.currOscFrq3/440)) + this.tuneDiff; 
          this.monoOscB3.frequency.value = (440/32) * (2 ** ((tempNote - 9) / 12)); 
	      this.monoOscB3.type = this.currOscTypeB;      
	      this.monoOsc3.connect(this.oscGain3);
	      this.monoOscB3.connect(this.oscGainB3);
	      this.oscGain3.gain.value = this.currGain3;
	      this.oscGainB3.gain.value = this.currGain3 * this.currGainB;
	        
	      this.isStarted3 = true;
	      this.monoOsc3.start();
	      this.monoOscB3.start();
	    }
	     if (value === 0 && this.isStarted3) {
	        this.currOscFrq3 = this.monoOsc3.frequency.value;
	        this.currOscType = this.monoOsc3.type;
	        this.currOscTypeB = this.monoOscB3.type;
	        this.currGain3 = this.oscGain3.gain.value;
	        this.monoOsc3.stop();
	        this.monoOscB3.stop();

          this.isStarted3 = false;
	     }  
	   }
  }

  delFrqOsc(value){
  	console.log("IN");
    this.delayedCurrOscFrq1 = value;
	}

  // trigger event directly from OSC client
  setFrqOsc(args){
    let voice = args.shift();
    let value = args.shift();

	this.OscFrqTouchOffset = 0;

    if(voice===1 && this.isStarted1)
    {
        var tempPitch = this.monoOsc1.frequency.value;
        var currentTime = audioContext.currentTime;
        this.monoOsc1.frequency.cancelScheduledValues(currentTime);
        this.monoOsc1.frequency.setValueAtTime(tempPitch,currentTime);
        this.monoOsc1.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
		this.currOscFrq1 = value;
		this.delayedCurrOscFrq1 = value;

        var tempPitch2 = this.monoOscB1.frequency.value;
        var tempNote = (69 + 12 * Math.log2(value/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB1.frequency.cancelScheduledValues(currentTime);
        this.monoOscB1.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB1.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);

    }
    if(voice===2  && this.isStarted2)
    {
        var tempPitch = this.monoOsc2.frequency.value;
        var currentTime = audioContext.currentTime;
        this.monoOsc2.frequency.cancelScheduledValues(currentTime);
        this.monoOsc2.frequency.setValueAtTime(tempPitch,currentTime);
        this.monoOsc2.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
        this.currOscFrq2 = value;

        var tempPitch2 = this.monoOscB2.frequency.value;
        var tempNote = (69 + 12 * Math.log2(value/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB2.frequency.cancelScheduledValues(currentTime);
        this.monoOscB2.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB2.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
    }
    if(voice===3  && this.isStarted3)
    {
        var tempPitch = this.monoOsc3.frequency.value;
        var currentTime = audioContext.currentTime;
        this.monoOsc3.frequency.cancelScheduledValues(currentTime);
        this.monoOsc3.frequency.setValueAtTime(tempPitch,currentTime);
        this.monoOsc3.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
        this.currOscFrq = value;

        var tempPitch2 = this.monoOscB3.frequency.value;
        var tempNote = (69 + 12 * Math.log2(value/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB3.frequency.cancelScheduledValues(currentTime);
        this.monoOscB3.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB3.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
    }
  }

  // trigger event directly from OSC client
  setTuneOscB(value){
    this.tuneDiff = value;

    var currentTime = audioContext.currentTime;  
    
    if(this.isStarted1)
    {
        var tempPitch = this.monoOsc1.frequency.value;
        var tempPitch2 = this.monoOscB1.frequency.value;
        var tempNote = (69 + 12 * Math.log2(tempPitch/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB1.frequency.cancelScheduledValues(currentTime);
        this.monoOscB1.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB1.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
    }
    if(this.isStarted2)
    {
        var tempPitch = this.monoOsc2.frequency.value;
        var tempPitch2 = this.monoOscB2.frequency.value;
        var tempNote = (69 + 12 * Math.log2(tempPitch/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB2.frequency.cancelScheduledValues(currentTime);
        this.monoOscB2.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB2.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
    }
    if(this.isStarted3)
    {
        var tempPitch = this.monoOsc3.frequency.value;
        var tempPitch2 = this.monoOscB3.frequency.value;
        var tempNote = (69 + 12 * Math.log2(tempPitch/440)) + this.tuneDiff; 
        var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
        this.monoOscB3.frequency.cancelScheduledValues(currentTime);
        this.monoOscB3.frequency.setValueAtTime(tempPitch2,currentTime);
        this.monoOscB3.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
    }
  }

  oneSweep(args){
    let frq1 = args.shift();
    let frq2 = args.shift();
    let inTime = args.shift();
    let vol = args.shift();

    if(this.isStarted1)
	    {
	    	var currentTime = audioContext.currentTime;  
          this.oscGain1.gain.cancelScheduledValues(currentTime);
          this.oscGain1.gain.setValueAtTime(0.,currentTime);
          this.oscGain1.gain.linearRampToValueAtTime(vol,currentTime+0.01);

	        this.monoOsc1.frequency.cancelScheduledValues(currentTime);
	        this.monoOsc1.frequency.setValueAtTime(frq1,currentTime);
	        this.monoOsc1.frequency.linearRampToValueAtTime(frq2,currentTime+inTime);

		   setTimeout(() => { 
		          this.oscGain1.gain.cancelScheduledValues(currentTime);
		          this.oscGain1.gain.setValueAtTime(vol,currentTime);
		          this.oscGain1.gain.linearRampToValueAtTime(0.,currentTime+0.01);
		    }, inTime * 1000);

       	}
	}

  setVolOsc(args){
      let voice = args.shift();
      let value = args.shift();
    
      if(voice===1)
      {
          var currGain = this.oscGain1.gain.value; 
          var currentTime = audioContext.currentTime;  
          this.currGain1 = value;       
          this.oscGain1.gain.cancelScheduledValues(currentTime);
          this.oscGain1.gain.setValueAtTime(currGain,currentTime);
          this.oscGain1.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);

          var currGain2 = this.oscGainB1.gain.value; 
          var nextGain = this.currGain1 * this.currGainB; 
          var currentTime = audioContext.currentTime;  
          this.currGain2 = value;       
          this.oscGainB1.gain.cancelScheduledValues(currentTime);
          this.oscGainB1.gain.setValueAtTime(currGain2,currentTime);
          this.oscGainB1.gain.linearRampToValueAtTime(nextGain,currentTime+this.glideTime);
      }
      if(voice===2)
        {
            var currGain = this.oscGain2.gain.value; 
            var currentTime = audioContext.currentTime;  
            this.currGain2 = value;       
            this.oscGain2.gain.cancelScheduledValues(currentTime);
            this.oscGain2.gain.setValueAtTime(currGain,currentTime);
            this.oscGain2.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);

            var currGain2 = this.oscGainB2.gain.value; 
            var nextGain = this.currGain2 * this.currGainB; 
            var currentTime = audioContext.currentTime;  
            this.currGain2 = value;       
            this.oscGainB2.gain.cancelScheduledValues(currentTime);
            this.oscGainB2.gain.setValueAtTime(currGain2,currentTime);
            this.oscGainB2.gain.linearRampToValueAtTime(nextGain,currentTime+this.glideTime);
        }
      if(voice===3 && this.isStarted3)
        {
            var currGain = this.oscGain3.gain.value; 
            var currentTime = audioContext.currentTime;  
            this.currGain3 = value;       
            this.oscGain3.gain.cancelScheduledValues(currentTime);
            this.oscGain3.gain.setValueAtTime(currGain,currentTime);
            this.oscGain3.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);

            var currGain2 = this.oscGainB3.gain.value; 
            var nextGain = this.currGain3 * this.currGainB; 
            var currentTime = audioContext.currentTime;  
            this.currGain2 = value;       
            this.oscGainB3.gain.cancelScheduledValues(currentTime);
            this.oscGainB3.gain.setValueAtTime(currGain2,currentTime);
            this.oscGainB3.gain.linearRampToValueAtTime(nextGain,currentTime+this.glideTime);
        }
  }

   setSlowVolOsc(args){
      let voice = args.shift();
      let value = args.shift();
    
      if(voice===1)
      {
          var currGain = this.oscGain1.gain.value; 
          var currentTime = audioContext.currentTime;  
          this.currGain1 = value;       
          this.oscGain1.gain.cancelScheduledValues(currentTime);
          this.oscGain1.gain.setValueAtTime(currGain,currentTime);
          this.oscGain1.gain.linearRampToValueAtTime(value,currentTime+1.5);

          var currGain2 = this.oscGainB1.gain.value; 
          var nextGain = this.currGain1 * this.currGainB; 
          var currentTime = audioContext.currentTime;  
          this.currGain2 = value;       
          this.oscGainB1.gain.cancelScheduledValues(currentTime);
          this.oscGainB1.gain.setValueAtTime(currGain2,currentTime);
          this.oscGainB1.gain.linearRampToValueAtTime(nextGain,currentTime+1.5);
      }

  }
  setVolOscB(value){
    this.currGainB = value;

   if (this.isStarted1)
   {
      var currGain2 = this.oscGainB1.gain.value; 
      var nextGain = this.oscGain1.gain.value * this.currGainB; 
      this.currGainB1 = value;
      var currentTime = audioContext.currentTime;  
      this.oscGainB1.gain.cancelScheduledValues(currentTime);
//      this.oscGainB1.gain.setValueAtTime(currGain2,currentTime);
      this.oscGainB1.gain.linearRampToValueAtTime(nextGain,currentTime+this.glideTime);
    }
   if (this.isStarted2)
   {
      var currGain2 = this.oscGainB2.gain.value; 
      var nextGain = this.oscGain2.gain.value * this.currGainB; 
      var currentTime = audioContext.currentTime;  
      this.currGain2 = value;       
      this.oscGainB2.gain.cancelScheduledValues(currentTime);
//      this.oscGainB2.gain.setValueAtTime(currGain2,currentTime);
      this.oscGainB2.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
    }
   if (this.isStarted3)
   {
      var currGain2 = this.oscGainB3.gain.value; 
      var nextGain = this.oscGain3.gain.value * this.currGainB; 
      var currentTime = audioContext.currentTime;  
      this.currGain2 = value;       
      this.oscGainB3.gain.cancelScheduledValues(currentTime);
 //     this.oscGainB3.gain.setValueAtTime(currGain2,currentTime);
      this.oscGainB3.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
    }
  }
 
  synthType(type){
    this.currentOsctype = type;
    if (this.isStarted1) this.monoOsc1.type = type; 
    if (this.isStarted2) this.monoOsc2.type = type; 
    if (this.isStarted3) this.monoOsc3.type = type; 
  }
  synthTypeB(type){
    this.currentOsctypeB = type;
    if (this.isStarted1) this.monoOscB1.type = type; 
    if (this.isStarted2) this.monoOscB2.type = type; 
    if (this.isStarted3) this.monoOscB3.type = type; 
  }

 setFilterFrq(value){
      var tempFrq = this.filter.frequency.value;
      var currentTime = audioContext.currentTime;
      this.currFilterFrq = value;
      this.filter.frequency.cancelScheduledValues(currentTime);
      this.filter.frequency.setValueAtTime(tempFrq,currentTime);
      this.filter.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  setFilterQ(value){
      var tempQ = this.filter.Q.value;
      var currentTime = audioContext.currentTime;
      this.currFilterQ = value;
      this.filter.Q.cancelScheduledValues(currentTime);
      this.filter.Q.setValueAtTime(tempQ,currentTime);
      this.filter.Q.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

 delayTime(value){
      var currentTime = audioContext.currentTime;
      this.delay.delayTime.cancelScheduledValues(currentTime);
      this.delay.delayTime.setValueAtTime(this.delay.delayTime.value,currentTime);
      this.delay.delayTime.linearRampToValueAtTime(value,currentTime+this.glideTime);  
  }

 delayFbk(value){
      var currentTime = audioContext.currentTime;
      this.delayGain.gain.cancelScheduledValues(currentTime);
      this.delayGain.gain.setValueAtTime(this.delayGain.gain.value,currentTime);
      this.delayGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
 
     this.delayGainOwn.gain.cancelScheduledValues(currentTime);
      this.delayGainOwn.gain.setValueAtTime(this.delayGainOwn.gain.value,currentTime);
      this.delayGainOwn.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
   }

  // define synth waveform
  animate(value){
    this.animateOn = value;
    this.animateLoop();

  }

  animateLoop()
  {
      const canvas = document.getElementById('main-canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var cw = window.innerWidth;
      var ch = window.innerHeight;

      var minRms = 127.5;
      var maxRms = 132.;
      var risingEdge = 0;
      var edgeThreshold =5;
      var scaling = canvas.height / 256;
      var timeData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(timeData);
 
    var currentTime = audioContext.currentTime;
    var beatingsAmount = 0;


   	// backgroundColor
      if(this.sceneSel == 'synth')
      {
      	      var buffer = new Uint8Array(this.analyser.frequencyBinCount);
		      this.analyser.getByteTimeDomainData(buffer);

		    var rms = 0;
		    for( var i = 0; i < buffer.length; ++i ) {
	      		rms += buffer[i] * buffer[i];
		    }
		    rms /= buffer.length;
		    rms = Math.sqrt(rms);

		    if ( rms == 128)
		    	rms = 127.5;
		    if(rms > maxRms)
		    	rms = maxRms;
		    rms = (rms - minRms) / (maxRms-minRms); // normalization to 256

      		for (let i = 0; i < this.colors.current.length; i++) {
      			this.colors.current[i] = this.colors.rest[i]  + 
                rms * ( this.colors.active[i] - this.colors.rest[i] );
  			}   

	  }
	 ctx.fillStyle = 'rgb('
	        + Math.round(this.colors.current[0]) + ','
	        + Math.round(this.colors.current[1]) + ','
	        + Math.round(this.colors.current[2]) + ')';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

	  ctx.fillStyle = 'white';
	  ctx.strokeStyle = 'white';
	  ctx.lineWidth = 2;
      
      	if((this.sceneSel == 'additive' || this.sceneSel == 'loop' || this.sceneSel == 'loopFree') && this.isTouching)
    	{
    		this.circleTouchPosX = this.touchX;
    		this.circleTouchPosY = this.touchY;
    	}

      	if(this.sceneSel == 'additive' && this.isTouching== false)
      	{
    		if(this.circleTouchPosX < 0.5)
    			this.circleTouchPosX = this.circleTouchPosX + 0.03;
    		if(this.circleTouchPosX > 0.5)
    			this.circleTouchPosX = this.circleTouchPosX - 0.03;
    		if(this.circleTouchPosY < 0.5)
    			this.circleTouchPosY = this.circleTouchPosY + 0.03;
    		if(this.circleTouchPosY > 0.5)
    			this.circleTouchPosY = this.circleTouchPosY - 0.03;

            if(this.touchY_inertia < 0.5)
                this.touchY_inertia = this.touchY_inertia + 0.005;
            if(this.touchY_inertia > 0.5)
                this.touchY_inertia = this.touchY_inertia - 0.005;
    	}

        if(this.sceneSel == 'additive' && this.isTouching)
        {
            if(this.touchY_inertia < this.touchY)
                this.touchY_inertia = this.touchY_inertia + 0.005;
            if(this.touchY_inertia > this.touchY)
                this.touchY_inertia = this.touchY_inertia - 0.005;
        }
    	if(this.sceneSel == 'additive' || this.sceneSel == 'loop' || this.sceneSel == 'loopFree')
    	{
	       	ctx.beginPath();
	  	    ctx.arc(this.circleTouchPosX*window.innerWidth,this.circleTouchPosY*window.innerHeight,50,0, Math.PI * 2, true);	  	    
	  	    ctx.closePath();
	        ctx.stroke();
			
			if(!this.isTouching && this.sceneSel != 'additive')
				label(ctx,this.circleTouchPosX*cw,this.circleTouchPosY*ch-(ch*0.008),"mou-me",0);
	    }

		label(ctx,20,20,"f."+this.currOscFrq1,0);
    	
    	if(this.sceneSel == 'additive')
    	{
    		
	 			label(ctx,cw/2+(cw*0.02),ch*0.22,"+tremolo ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.16), ch*0.22-(ch*0.011), cw/2-(cw*0.13), ch*0.22-(ch*0.011));
	    	
	 			label(ctx,cw/2+(cw*0.02),ch*0.24,"+volum   ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.145), ch*0.24, cw/2-(cw*0.145), ch*0.24-(ch*0.02));
	 		
		}




    	if(this.sceneSel == 'loop')
    	{

	    	if(this.isTouching && (this.touchX < 0.4 || this.touchX > 0.6))
	    	{
	 			label(ctx,cw/2,ch*0.22,"canvi frase",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.07) -(cw*0.05), ch*0.22-(ch*0.011), cw/2-(cw*0.1) -(cw*0.05), ch*0.22-(ch*0.011));
		    	canvas_arrow(ctx, cw/2 -(cw*0.1) , ch*0.22-(ch*0.011), cw/2-(cw*0.07) , ch*0.22-(ch*0.011));
	    	}
	    	
	    	if(this.isTouching && this.touchY < 0.4)
	    	{
	 			label(ctx,cw/2,ch*0.24,"+curt      ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.085), ch*0.24, cw/2-(cw*0.085), ch*0.24-(ch*0.02));
	    	}
	    	if(this.isTouching && this.touchY > 0.6)
	    	{
	 			label(ctx,cw/2,ch*0.24,"+greu      ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.085), ch*0.24-(ch*0.02), cw/2-(cw*0.085), ch*0.24);
	    	}
		}
    	
    	if(this.sceneSel == 'loopFree')
    	{

	    	if(this.isTouching && this.touchX < 0.4)
	    	{
	 			label(ctx,cw/2,ch*0.22,"+curt     ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.07), ch*0.22-(ch*0.011), cw/2-(cw*0.1), ch*0.22-(ch*0.011));
	    	}
	    	if(this.isTouching && this.touchX > 0.6)
	    	{
	 			label(ctx,cw/2,ch*0.22,"+llarg    ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.1), ch*0.22-(ch*0.011), cw/2-(cw*0.07), ch*0.22-(ch*0.011));
	    	
	    	}
	    	if(this.isTouching && this.touchY < 0.4)
	    	{
	 			label(ctx,cw/2,ch*0.24,"+to       ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.085), ch*0.24, cw/2-(cw*0.085), ch*0.24-(ch*0.02));
	    	}
	    	if(this.isTouching && this.touchY > 0.6)
	    	{
	 			label(ctx,cw/2,ch*0.24,"-to       ",0);
		    	canvas_arrow(ctx, cw/2 -(cw*0.085), ch*0.24-(ch*0.02), cw/2-(cw*0.085), ch*0.24);
	    	}
		}
 
	    // DRAW WAVEFORM
        ctx.beginPath();
      while (timeData[risingEdge++] -128 > 0 && risingEdge <= canvas.width);
      if (risingEdge >= canvas.width) risingEdge =0;
      while (timeData[risingEdge++] -128 < edgeThreshold && risingEdge <= canvas.width);
      if (risingEdge >= canvas.width) risingEdge =0;

      for(var x = risingEdge; x < timeData.length && x - risingEdge < canvas.width; x++)
        ctx.lineTo(x - risingEdge, canvas.height - timeData[x] * scaling);
        ctx.stroke();

      if(this.animateOn == 1) 
        requestAnimationFrame(this.animateLoop);
      else
        ctx.clearRect(0,0,canvas.width, canvas.height);

     if(this.sceneSel == 'additive')
      {
                if(this.touchY_inertia<0.5)
                {
                    this.oscGain1.gain.linearRampToValueAtTime((0.5-this.touchY_inertia)*1.7,currentTime+this.glideTime);
                    this.oscGainB1.gain.linearRampToValueAtTime((0.5-this.touchY_inertia)*1.7,currentTime+this.glideTime);
                    //this.setVolOsc(1, (0.5-this.touchY)*2); 
                    //this.setVolOscB((0.5-this.touchY)*2); 
                    if(this.touchX>0.5)
                        beatingsAmount = (this.touchX-0.5)*0.3;
                    else
                        beatingsAmount = 0.;

                }else
                {
                    this.oscGain1.gain.linearRampToValueAtTime((this.touchY_inertia-0.5)*1.7,currentTime+this.glideTime);
                    this.oscGainB1.gain.linearRampToValueAtTime((this.touchY_inertia-0.5)*1.7,currentTime+this.glideTime);
                    //this.setVolOsc("1 ((this.touchY-0.5)*2)"); 
                    if(this.touchX>0.5)
                        beatingsAmount = (this.touchX-0.5)*0.3;
                    else
                        beatingsAmount = 0.;
                }

                var tempNote = (69 + 12 * Math.log2(this.currOscFrq1/440)) + this.OscFrqTouchOffset; 
                var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
                var currentTime = audioContext.currentTime;
                this.monoOsc1.frequency.setValueAtTime(f2,currentTime);

                var tempNote = tempNote + beatingsAmount; 
                var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
                this.monoOscB1.frequency.setValueAtTime(f2,currentTime);
        }
 
  }

 animateNotification()
  {
      const canvas = document.getElementById('main-canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var cw = window.innerWidth;
      var ch = window.innerHeight;

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      

    if(this.isNotifying == true)
    {
        if(Math.floor(Math.random()*10 < 5))
        {
            var num = Math.floor(Math.random()*50);
            document.getElementById('text3').innerHTML = this.notificationsList[num];
        }
        label(ctx,cw/2,ch*0.8,"scanning hard disks ....",0);
    }

    if(this.isNotifyingChismes == true)
    {
        if(Math.floor(Math.random()*50 < 1))
        {
            if(this.chismesCounter < 20)
                document.getElementById('text3').innerHTML = this.notificationsList[this.chismesCounter];
            this.chismesCounter ++;
        }
        label(ctx,cw/2,ch*0.8,"Els vostres comentaris:",0);
    }

    if(this.isNotifying || this.isNotifyingChismes) 
        requestAnimationFrame(this.animateNotification);
      else
        ctx.clearRect(0,0,canvas.width, canvas.height);
  }

  setFunctionLfo(value){
    
      if (value === 'none' && this.lfoFunction != 'none') {
        this.lfo.stop();
    	this.lfoGain.disconnect();
        this.lfoFunction = value;
      } else 
      if (value === 'tremolo') {
    		if(this.lfoFunction != 'none') this.lfo.stop();
    		  this.lfoGain.disconnect();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              if (this.isStarted1) this.lfoGain.connect(this.oscGain1.gain); 
              if (this.isStarted2) this.lfoGain.connect(this.oscGain2.gain); 
              if (this.isStarted3) this.lfoGain.connect(this.oscGain3.gain); 
              this.lfo.start();
              this.lfoFunction = value;
      } else
      if (value === 'vibrato') {
    		if(this.lfoFunction != 'none') this.lfo.stop();
    		  this.lfoGain.disconnect();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              if (this.isStarted1) this.lfoGain.connect(this.monoOsc1.frequency); 
              if (this.isStarted2) this.lfoGain.connect(this.monoOsc2.frequency); 
              if (this.isStarted3) this.lfoGain.connect(this.monoOsc3.frequency); 
              this.lfo.start();
              this.lfoFunction = value;
      } else
      if (value === 'filter') {
    		if(this.lfoFunction != 'none') this.lfo.stop();
    		  this.lfoGain.disconnect();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.filter.frequency); 
              this.lfo.start();
              this.lfoFunction = value;
      } 
      if (value === 'lfoFrq') {
    		if(this.lfoFunction != 'none') this.lfo.stop();
    		  this.lfoGain.disconnect();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.lfo2.frequency); 
              this.lfo.start();
              this.lfoFunction = value;
      } 
  }
  setFunctionLfo2(value){
    
      if (value === 'none' && this.lfoFunction2 != 'none') {
        this.lfo2.stop();
    	this.lfoGain2.disconnect();
        this.lfoFunction2 = value;
      } else 
      if (value === 'tremolo') {
    		if(this.lfoFunction2 != 'none') this.lfo2.stop();
    		  this.lfoGain2.disconnect();
              this.lfo2 = audioContext.createOscillator();
              this.lfo2.connect(this.lfoGain2);
              this.lfo2.frequency.value = this.currLfoFrq2;
              this.lfoGain2.gain.value = this.currLfoGain2;
              if (this.isStarted1) this.lfoGain2.connect(this.oscGain1.gain); 
              if (this.isStarted2) this.lfoGain2.connect(this.oscGain2.gain); 
              if (this.isStarted3) this.lfoGain2.connect(this.oscGain3.gain); 
              this.lfo2.start();
              this.lfoFunction2 = value;
      } else
      if (value === 'vibrato') {
    		if(this.lfoFunction2 != 'none') this.lfo2.stop();
    		  this.lfoGain2.disconnect();
              this.lfo2 = audioContext.createOscillator();
              this.lfo2.connect(this.lfoGain2);
              this.lfo2.frequency.value = this.currLfoFrq2;
              this.lfoGain2.gain.value = this.currLfoGain2;
              if (this.isStarted1) this.lfoGain2.connect(this.monoOsc1.frequency); 
              if (this.isStarted2) this.lfoGain2.connect(this.monoOsc2.frequency); 
              if (this.isStarted3) this.lfoGain2.connect(this.monoOsc3.frequency); 
              this.lfo2.start();
              this.lfoFunction2 = value;
      } else
      if (value === 'filter') {
    		if(this.lfoFunction2 != 'none') this.lfo2.stop();
    		  this.lfoGain2.disconnect();
              this.lfo2 = audioContext.createOscillator();
              this.lfo2.connect(this.lfoGain2);
              this.lfo2.frequency.value = this.currLfoFrq2;
              this.lfoGain2.gain.value = this.currLfoGain2;
              this.lfoGain2.connect(this.filter.frequency); 
              this.lfo2.start();
              this.lfoFunction2 = value;
      } 
      if (value === 'lfoFrq') {
    		if(this.lfoFunction2 != 'none') this.lfo2.stop();
    		  this.lfoGain2.disconnect();
              this.lfo2 = audioContext.createOscillator();
              this.lfo2.connect(this.lfoGain2);
              this.lfo2.frequency.value = this.currLfoFrq2;
              this.lfoGain2.gain.value = this.currLfoGain2;
              this.lfoGain2.connect(this.lfo.frequency); 
              this.lfo2.start();
              this.lfoFunction2 = value;
      } 
  }
  setAmpLfo(value){
      var currGain = this.lfoGain.gain.value; 
      this.currLfoGain = value;
      var currentTime = audioContext.currentTime;         
      this.lfoGain.gain.cancelScheduledValues(currentTime);
      this.lfoGain.gain.setValueAtTime(currGain,currentTime);
      this.lfoGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  setAmpLfo2(value){
      var currGain = this.lfoGain2.gain.value; 
      this.currLfoGain2 = value;
      var currentTime = audioContext.currentTime;         
      this.lfoGain2.gain.cancelScheduledValues(currentTime);
      this.lfoGain2.gain.setValueAtTime(currGain,currentTime);
      this.lfoGain2.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  setFrqLfo(value){
      var tempFrq = this.lfo.frequency.value;
      this.currLfoFrq = value;
      var currentTime = audioContext.currentTime;
      this.lfo.frequency.cancelScheduledValues(currentTime);
      this.lfo.frequency.setValueAtTime(tempFrq,currentTime);
      this.lfo.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  setFrqLfo2(value){
      var tempFrq = this.lfo2.frequency.value;
      this.currLfoFrq2 = value;
      var currentTime = audioContext.currentTime;
      this.lfo2.frequency.cancelScheduledValues(currentTime);
      this.lfo2.frequency.setValueAtTime(tempFrq,currentTime);
      this.lfo2.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }
  setTypeLfo(value){
  	this.currentLfoType = value;
    this.lfo.type = value; 
  }
  setTypeLfo2(value){
  	this.currentLfoType2 = value;
    this.lfo2.type = value; 
  }

osc2Frq(args){
    var midiNote1 =  args.shift();
    var midiNote2 =  args.shift();
    this.time2frq = args.shift();
    this.frq2On = true;

 //   this.setFunctionLfo('filter');
    this.lfo.frequency.value = (Math.floor(Math.random()*12) /100.)+0.0;

    this.frq2frq1= (440/32) * (2 ** ((midiNote1 - 9) / 12));
    this.frq2frq2= (440/32) * (2 ** ((midiNote2 - 9) / 12));
    if(this.frq2On)
        this.animate2Frq1();
  }

osc2FrqOff(){
    this.frq2On = false;
}

animate2Frq1(){
    var currentTime = audioContext.currentTime;
    this.monoOsc1.frequency.cancelScheduledValues(currentTime);
    this.monoOsc1.frequency.setValueAtTime(this.currOscFrq1,currentTime);
    this.monoOsc1.frequency.linearRampToValueAtTime(this.frq2frq1,currentTime+this.glideTime/15);
    this.currOscFrq1 = this.frq2frq1;
    
    setTimeout(() => { 
        if(this.frq2On == true) 
            requestAnimationFrame(this.animate2Frq2);
    }, this.time2frq);
  }
animate2Frq2(){
    var currentTime = audioContext.currentTime;
    this.monoOsc1.frequency.cancelScheduledValues(currentTime);
    this.monoOsc1.frequency.setValueAtTime(this.currOscFrq1,currentTime);
    this.monoOsc1.frequency.linearRampToValueAtTime(this.frq2frq2,currentTime+this.glideTime/15);
    this.currOscFrq1 = this.frq2frq2;
    setTimeout(() => { 
        if(this.frq2On == true) 
            requestAnimationFrame(this.animate2Frq1);
    }, this.time2frq);
  }


  samplePlay(trackName) {
  	this.bufferSource = audioContext.createBufferSource();
  	this.bufferSource.loop = true;
  	this.bufferSource.connect(this.bufferGain);
  	const audioBuffer = this.e.loader.data[trackName];
 
    this.bufferSource.buffer = audioBuffer;
    this.bufferSource.start();
  }

  samplePlayRand(trackName) {
  	this.bufferSource = audioContext.createBufferSource();
  	this.bufferSource.loop = true;
  	this.bufferSource.connect(this.bufferGain);
  	const audioBuffer = this.e.loader.data[trackName];
 
    this.bufferSource.buffer = audioBuffer;
    this.bufferSource.playbackRate.value = (Math.floor(Math.random()*50) /100.)+0.55;
    this.bufferSource.start();
  }

  sampleOneShot(trackName) {
    	var bufferSourceOne = audioContext.createBufferSource();
	    var bufferGainOne = audioContext.createGain();
  		bufferSourceOne.loop = false;
  		bufferSourceOne.playbackRate.value = (Math.floor(Math.random()*100) /100.)+0.2;
  		bufferSourceOne.connect(bufferGainOne);
    	bufferGainOne.connect(this.filter);

    	const audioBuffer = this.e.loader.data[trackName];
 
    	bufferSourceOne.buffer = audioBuffer;
	    bufferSourceOne.start();

	    setTimeout(() => {
	    		    bufferSourceOne.stop();
 	   }, 2 * 1000);
}
  sampleLoopIn(start) {
    this.bufferSource.loopStart = start;
  }
  sampleLoopOut(end) {
	this.bufferSource.loopEnd = end;
  }

  sampleStop() {
  	this.bufferSource.stop();
  }

  sampleVol(value){
      var currGain = this.bufferGain.gain.value; 
      var currentTime = audioContext.currentTime;  
      this.bufferGain.gain.cancelScheduledValues(currentTime);
      this.bufferGain.gain.setValueAtTime(currGain,currentTime);
      this.bufferGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  sampleOffsetSpeed(value) {
  	this.sampleOffset = value;
  	this.sampleLoopLen = this.bufferSource.loopEnd - this.bufferSource.loopStart;

  	if ( value > 0){
  		this.moveOffset = setInterval(this.sampleMoveOffset.bind(this), 100);
  	}
  	else{
  		clearInterval(this.moveOffset);
  		console.log('go');
  	}
  }

	sampleLoopRandIn() {
		var newIn = Math.floor(Math.random()*100) /100.;
		this.bufferSource.loopStart = newIn*4.;
		this.bufferSource.loopEnd = newIn*4. + this.sampleLoopLen;
	}

	sampleLen(value) {
  		this.sampleLoopLen = value;
		this.bufferSource.loopEnd = value + this.bufferSource.loopStart;
	}

  sampleMoveOffset() {
  	this.bufferSource.loopStart = this.bufferSource.loopStart + this.sampleOffset;  	
  	if (this.bufferSource.loopStart > 1){
  	 	this.bufferSource.loopStart = 0;
  	 	this.bufferSource.loopEnd = this.sampleLoopLen;
  	}
  	this.bufferSource.loopEnd = this.bufferSource.loopEnd + this.sampleOffset;  	
 // 	if (this.bufferSource.loopEnd > 1) this.bufferSource.loopEnd = 0;
  }
  refreshOffset() {
  	   this.sampleLoopIn(0.01);
	}

  sampleSpeed(value) {
  	this.bufferSource.playbackRate.value = value;
  }

  oneShot(trackName)
  {
  	  	var bufferSourceGav = audioContext.createBufferSource();
	    var bufferGainGav = audioContext.createGain();
  		bufferSourceGav.loop = false;
  		bufferSourceGav.playbackRate.value = (Math.floor(Math.random()*40) /100.)+0.65;
  		bufferSourceGav.connect(bufferGainGav);
    	bufferGainGav.connect(this.filter);

    	const audioBuffer = this.e.loader.data[trackName];
 
    	bufferSourceGav.buffer = audioBuffer;
	    bufferSourceGav.start();

	    setTimeout(() => {
	    		    bufferSourceGav.stop();
 	   }, 2 * 1000);
	}

  convolverVol(value){
      var currGain = this.convolverGain.gain.value; 
      var currentTime = audioContext.currentTime; 
      this.convolverGain.gain.cancelScheduledValues(currentTime);
      this.convolverGain.gain.setValueAtTime(currGain,currentTime);
      this.convolverGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }

  convolverIR(value){
  	console.log('convIR');
   	const audioBuffer = this.e.loader.data[value];
    this.convolver.buffer = audioBuffer;

  }

  touchStartCallback(id, normX, normY){
    // notify touch on
    //this.e.send('osc', '/' + this.moduleName, ['touchOn', 1] );
    // common touch callback
    this.touchCommonCallback(id, normX, normY); 
    this.isTouching = true;  

	if(this.sceneSel == 'additive')
	{
		console.log(this.delayedCurrOscFrq1);
		var currentTime = audioContext.currentTime;
    	this.monoOsc1.frequency.cancelScheduledValues(currentTime);
    	this.monoOsc1.frequency.setValueAtTime(200,currentTime);
    	this.currOscFrq1 = this.delayedCurrOscFrq1;
	}

	if(this.sceneSel == 'ocean')
	{
	  	var bufferSourceGav = audioContext.createBufferSource();
	    var bufferGainGav = audioContext.createGain();
  		bufferSourceGav.loop = false;
  		bufferSourceGav.playbackRate.value = (Math.floor(Math.random()*40) /100.)+0.65;
  		bufferSourceGav.connect(bufferGainGav);
    	bufferGainGav.connect(this.filter);

    	const audioBuffer = this.e.loader.data["gavina"];
 
    	bufferSourceGav.buffer = audioBuffer;
	    bufferSourceGav.start();

	    setTimeout(() => {
	    		    bufferSourceGav.stop();
 	   }, 2 * 1000);
  	}
 }

  touchMoveCallback(id, normX, normY){
    // common touch callback
    this.touchCommonCallback(id, normX, normY);
  }

  touchEndCallback(id, normX, normY){
    // notify touch off
    //this.e.send('osc', '/' + this.moduleName, ['touchOn', 0] );
    // common touch callback
//    this.touchCommonCallback(id, normX, normY);   

	if(this.sceneSel == 'additive')
	{
	    var tempNote = (69 + 12 * Math.log2(this.currOscFrq1/440)) + (this.touchX-0.5)*2.0; 
		var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
		var currentTime = audioContext.currentTime;
		this.monoOsc1.frequency.cancelScheduledValues(currentTime);
		this.monoOsc1.frequency.linearRampToValueAtTime(this.currOscFrq1,currentTime+1.0);

	    var tempNote = tempNote + (0.5-this.touchY)*0.5; 
	    var f2 = (440/32) * (2 ** ((tempNote - 9) / 12));
	    this.monoOscB1.frequency.cancelScheduledValues(currentTime);
	    this.monoOscB1.frequency.linearRampToValueAtTime(this.currOscFrq1,currentTime+1.0); 
	}
    this.isTouching = false;
  }  

  touchCommonCallback(id, normX, normY){
 	    
 	    this.touchX = normX;
 	    this.touchY = normY;
 	  	var currentTime = audioContext.currentTime;

      if(this.sceneSel == 'loop')
      {
      		if(this.touchY > 0.6)
      		{
      			var lenPart = 1.;
	       		var indexS = Math.round(this.touchY * 6);
	  			var speedS = this.loopLenMultiples[indexS];
	  			this.sampleSpeed(speedS);
		  	    this.sampleLoopIn(this.touchX*4.);
		  	    if(indexS==6) 
		  	    	speedS = speedS /1.5;
		  	    if(indexS==5) 
		  	    	speedS = speedS /1.5;

		  	    this.sampleLoopOut((this.touchX*4.)+(this.lastSampleLoopLen * speedS));
     		}else{
	      		var indexLen = Math.round(this.touchY * 6);
	  			this.lastSampleLoopLen = this.sampleLoopLen * this.loopLenMultiples[indexLen];
		  	    this.sampleLoopIn(this.touchX*4.);
		  	    this.sampleLoopOut((this.touchX*4.)+this.lastSampleLoopLen);
		  	    this.sampleSpeed(1.);

      		}
		}
      if(this.sceneSel == 'loopFree')
      {
	  	    //this.sampleVol(normY);
	        this.sampleSpeed((1-this.touchY)*2.);
	  	    //this.sampleLoopIn(normX);
	  	    this.sampleLoopOut((this.touchX*4.) +this.bufferSource.loopStart);
	   	}
  }

   // Note: hereafter are the OSC triggered functions used to enable / disable 
  // hereabove callbacks

  scene(value){
  	var touchOnOff = false;
  	this.sceneSel = value;

   	if(value === 'loop' || value === 'loopFree' || value =='additive' | value =='ocean')
   		touchOnOff = true;

   	if(value =='additive')
   	{
		var currentTime = audioContext.currentTime;
  		var tempNoteF = (69 + 12 * Math.log2(this.currOscFrq1/440)) + 1.; 
		var f3 = (440/32) * (2 ** ((tempNoteF - 9) / 12));
		this.filter.frequency.cancelScheduledValues(currentTime);
		this.filter.frequency.setValueAtTime(this.filter.frequency.value,currentTime);
		this.filter.frequency.linearRampToValueAtTime(f3,currentTime+1.)
	}
      // enable if not already enabled
    if( touchOnOff && !this.callBackStatus.touch ){
        this.surface.addListener('touchstart', this.touchStartCallback);
        this.surface.addListener('touchmove', this.touchMoveCallback);
        this.surface.addListener('touchend', this.touchEndCallback);
        this.callBackStatus.touch = true;
    }
      // disable if not already disabled
    if( !touchOnOff && this.callBackStatus.touch ){
        this.surface.removeListener('touchstart', this.touchStartCallback);
        this.surface.removeListener('touchmove', this.touchMoveCallback);
        this.surface.removeListener('touchend', this.touchEndCallback);
        this.callBackStatus.touch = false;
    }
  }

 bgColor(rgb){
    this.colors.active = rgb;
    this.colors.current = rgb;	
  }

  blink(args){
   	let color=[0,0,0];
   	color[0] = args.shift();
   	color[1] = args.shift();
   	color[2] = args.shift();
    let time = args.shift();
   	
    // discard if already blinking
    if( this.blinkStatus.isBlinking ){ return; }
    this.blinkStatus.isBlinking = true;
    // save current background color
    for (let i = 0; i < 3; i++)
      this.blinkStatus.savedBkgColor[i] = this.colors.current[i];
    // change bkg color
    this.colors.current = color;
    //this.bkgChangeColor = true;
    setTimeout(() => { 
      for (let i = 0; i < 3; i++)
        this.colors.current[i] = this.blinkStatus.savedBkgColor[i];
      this.blinkStatus.isBlinking = false
      //this.bkgChangeColor = true;
    }, time * 1000);
  }

  notifications(value){
  	if(value == 'chismes')
  	{	
  		this.chismesCounter = 0;
      	document.getElementById('text3').innerHTML = this.inputText;
	     this.isNotifyingChismes = true;
         this.animateNotification();
	     setTimeout(() => { 
	      	this.isNotifyingChismes = false;
	      	document.getElementById('text3').innerHTML = "segur que no soc un bot?";
	    }, 13 * 1000);
 	}
  	if(value == 'data')
  	{
	     this.isNotifying = true;
         this.animateNotification();
	     setTimeout(() => { 
          	this.isNotifying = false;
	      	document.getElementById('text3').innerHTML = "Transferred information";
	    }, 8 * 1000);
 	}  }

  popup(args){
  	let str = this.formatText(args);
    alert(str);
  }

  popupTextBox(args){
  	let str = this.formatText(args);
    this.inputText = prompt(str);
  }

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

  // re-routed event for sync. playback: server add a rdv time to msg sent by OSC client
  methodTriggeredFromServer(rdvTime){
    // get rel time (sec) in which I must blink
    let timeRemaining = rdvTime - this.e.sync.getSyncTime();
    console.log('will blink in', timeRemaining, 'seconds');
    setTimeout( () => { this.e.renderer.blink([0, 160, 200], 0.4); }, timeRemaining * 1000 );
  }

// trigger event directly from OSC client
  directToClientMethod(value){
    this.e.renderer.blink([0, this.params.gain * value, 0], 0.4);
//    console.log('WEEEEE now!');
  }
}

function canvas_arrow(context, fromx, fromy, tox, toy){
	var headlen = 3; // length of head in pixels
	var dx = tox - fromx;
	var dy = toy - fromy;
	var angle = Math.atan2(dy,dx);
   	context.beginPath();
	context.moveTo(fromx, fromy);
	context.lineTo(tox, toy);
	context.lineTo(tox-headlen * Math.cos(angle-Math.PI/6), toy - headlen * Math.sin(angle - Math.PI/6));
	context.moveTo(tox, toy);
	context.lineTo(tox-headlen * Math.cos(angle+Math.PI/6), toy - headlen * Math.sin(angle+Math.PI/6));
	context.stroke();
}

function label(ctx,posx, posy, text, angle)
{
	ctx.fillStyle = 'white';
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 2;
    ctx.save();
	ctx.translate(posx, posy);
	ctx.rotate(angle);
	ctx.textAlign ="center";
	ctx.font = '18px Quicksand';
	ctx.fillText(text, 0, 0);
	ctx.restore();
}