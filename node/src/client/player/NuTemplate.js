/**
 * NuTemplate: example of how to create a Nu module
 **/

import NuBaseModule from './NuBaseModule'
import * as soundworks from 'soundworks/client';
import audioFiles from '../shared/audioFiles';

const client = soundworks.client;
const audioContext = soundworks.audioContext;

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
      'gain2': 0.1,
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
    this.surface = new soundworks.TouchSurface(this.e.view.$el);

    // binding

     // Note: all callbacks in aftewards section are enabled / disabled with the methods 
  // at scripts' end (via OSC msg)

 
    this.touchStartCallback = this.touchStartCallback.bind(this);
    this.touchMoveCallback = this.touchMoveCallback.bind(this);
    this.touchEndCallback = this.touchEndCallback.bind(this);
    this.touch = this.touch.bind(this);

    // binding
    this.directToClientMethod = this.directToClientMethod.bind(this);
    this.startOsc = this.startOsc.bind(this);
    this.setFrqOsc = this.setFrqOsc.bind(this);
    this.setVolOsc = this.setVolOsc.bind(this);
    this.synthType = this.synthType.bind(this);
    this.setTuneOsc2 = this.setTuneOsc2.bind(this);
    this.setVolOsc2 = this.setVolOsc2.bind(this);
    this.synthType2 = this.synthType2.bind(this);
    this.setFilterFrq = this.setFilterFrq.bind(this);
    this.setFilterQ = this.setFilterQ.bind(this);
    this.periodicWave = this.periodicWave.bind(this);

    this.setTypeLfo = this.setTypeLfo.bind(this);
    this.setFrqLfo = this.setFrqLfo.bind(this);
    this.setAmpLfo = this.setAmpLfo.bind(this);
    this.setFunctionLfo = this.setFunctionLfo.bind(this);
    this.samplePlay = this.samplePlay.bind(this);
    this.sampleStop = this.sampleStop.bind(this);
    this.sampleLoopIn = this.sampleLoopIn.bind(this);
    this.sampleLoopOut = this.sampleLoopOut.bind(this);
    this.sampleVol = this.sampleVol.bind(this);
    this.sampleOffsetSpeed = this.sampleOffsetSpeed.bind(this);
    this.sampleSpeed = this.sampleSpeed.bind(this);

    this.methodTriggeredFromServer = this.methodTriggeredFromServer.bind(this);

    // setup receive callbacks
    this.e.receive('nuTemplate_methodTriggeredFromServer', this.methodTriggeredFromServer);

    this.monoOsc = audioContext.createOscillator();
    this.oscGain = audioContext.createGain();
    this.filter = audioContext.createBiquadFilter();
    this.monoOsc2 = audioContext.createOscillator();
    this.oscGain2 = audioContext.createGain();
    this.lfo = audioContext.createOscillator();
    this.lfoGain = audioContext.createGain();
	this.bufferSource = audioContext.createBufferSource();
    this.bufferGain = audioContext.createGain();

    // conenctions
    this.monoOsc.connect(this.oscGain);
    this.oscGain.connect(this.filter);
    this.monoOsc2.connect(this.oscGain2);
    this.oscGain2.connect(this.filter);
    this.filter.connect(this.e.nuOutput.in);
    this.lfo.connect(this.lfoGain);   
    this.bufferSource.connect(this.bufferGain);
    this.bufferGain.connect(this.filter);
 
    this.filter.type =  "lowpass";
    this.monoOsc.type = 'square';
    this.monoOsc2.type = 'square';
    this.oscGain.gain.value=this.params.gain;
    this.oscGain2.gain.value=this.params.gain2;
    this.isStarted = false;
    this.filter.frequency.value = this.params.frq;
    this.filter.Q.value = this.params.filterQ;
    this.currOscFrq = 440.;
    this.currOscType = 'square';
    this.currOscFrq2 = 440.;
    this.currOscType2 = 'square';
    this.currentLfoType = 'square';
    this.currFilterFrq = 20000;
    this.currFilterQ = 1.;
    this.currGain = this.params.gain;
    this.currGain2 = this.params.gain2; 
    this.currLfoFrq = 1.;
    this.currLfoGain = 0.;   
    this.glideTime = 0.1;
    this.isLfoActive = false;
    this.tune2 = 0;
    this.note = 60.0;
    this.bufferSource.loop = false;
    this.bufferGain.gain.value = 1.;
 //   this.moveOffset = null;
	this.sampleOffset = 0;
	this.sampleLoopLen = 0.1;

    var real = new Float32Array(10);
    var imag = new Float32Array(10);
    real[0] = 0; imag[0] = 0; real[1] = 1; imag[1] = 0;  
    this.wave = audioContext.createPeriodicWave(real, imag);
  }


  // trigger event directly from OSC client
  startOsc(value){
    if (value === 1 && this.isStarted == false) {
      this.monoOsc2 = audioContext.createOscillator();
      this.monoOsc2.frequency.value = this.currOscFrq2;
      this.monoOsc = audioContext.createOscillator();
      this.monoOsc.frequency.value = this.currOscFrq;
      if (this.currOscType === 'custom') this.monoOsc.setPeriodicWave(this.wave);
            else this.monoOsc.type = this.currOscType;
      this.monoOsc2.type = this.currOscType2;      
      this.monoOsc.connect(this.oscGain);
      this.monoOsc2.connect(this.oscGain2);
      this.oscGain.gain.value = this.currGain;
      this.oscGain2.gain.value = this.currGain2;
        
      this.isStarted = true;
      //this.monoOsc
      this.monoOsc.start();
      this.monoOsc2.start();
    } else {
      if (this.isStarted) {
        this.currOscFrq = this.monoOsc.frequency.value;
        this.currOscType = this.monoOsc.type;
        this.currOscFrq2 = this.monoOsc2.frequency.value;
        this.currOscType2 = this.monoOsc2.type;
        this.currGain = this.oscGain.gain.value;
        this.currGain2 = this.oscGain2.gain.value;
        this.monoOsc.stop();
        this.monoOsc2.stop();
      }
      this.isStarted = false;
    }
  }

  // trigger event directly from OSC client
  setFrqOsc(value){
  	  this.note = value;
      var tempPitch = this.monoOsc.frequency.value;
      var currentTime = audioContext.currentTime;
//      var f1 = Math.pow(2.0, (value - 4) / 12.0);
      this.monoOsc.frequency.cancelScheduledValues(currentTime);
      this.monoOsc.frequency.setValueAtTime(tempPitch,currentTime);
      this.monoOsc.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);

      var tempPitch2 = this.monoOsc2.frequency.value;
//      var f2 = Math.pow(2.0, (value - 4 + this.tune2) / 12.0);
      var f2 = value + this.tune2;
      this.monoOsc2.frequency.cancelScheduledValues(currentTime);
      this.monoOsc2.frequency.setValueAtTime(tempPitch2,currentTime);
      this.monoOsc2.frequency.linearRampToValueAtTime(f2,currentTime+this.glideTime);
  }
  // trigger event directly from OSC client
  setTuneOsc2(value){
      var tempFrq2 = this.monoOsc2.frequency.value;
      this.tune2 = value;
      var tempFrq = this.monoOsc.frequency.value + value;
      var currentTime = audioContext.currentTime;
      this.monoOsc2.frequency.cancelScheduledValues(currentTime);
      this.monoOsc2.frequency.setValueAtTime(tempFrq2,currentTime);
      this.monoOsc2.frequency.linearRampToValueAtTime(tempFrq,currentTime+this.glideTime);
  }

  setVolOsc(value){
      var currGain = this.oscGain.gain.value; 
      var currentTime = audioContext.currentTime;  
      this.currGain = value;       
      this.oscGain.gain.cancelScheduledValues(currentTime);
      this.oscGain.gain.setValueAtTime(currGain,currentTime);
      this.oscGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }
  setVolOsc2(value){
      var currGain2 = this.oscGain2.gain.value; 
      var currentTime = audioContext.currentTime;  
      this.currGain2 = value;       
      this.oscGain2.gain.cancelScheduledValues(currentTime);
      this.oscGain2.gain.setValueAtTime(currGain2,currentTime);
      this.oscGain2.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }
 
  synthType(type){
    this.currentOsctype = type;
    if( this.type === 'custom' )
        this.monoOsc.setPeriodicWave(this.wave);
      else
        this.monoOsc.type = type; 
  }
  synthType2(type){
    this.currentOsctype2 = type;
    this.monoOsc2.type = type; 
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

  // define synth waveform
  periodicWave(args){
    let halfLength = Math.floor(args.length/2);
    var real = new Float32Array(halfLength);
    var imag = new Float32Array(halfLength);    
    for (let i = 0; i < args.length/2; i++) {
      real[i] = args[2*i];
      imag[i] = args[2*i+1];
    }
    this.wave=audioContext.createPeriodicWave(real, imag);
    this.monoOsc.setPeriodicWave(this.wave);
  }


  setFunctionLfo(value){
    
      if (value === 'none' && this.isLfoActive == true) {
        this.lfo.stop();
        this.isLfoActive = false;
      } else 
      if (value === 'tremolo') {
    		if(this.isLfoActive == true) this.lfo.stop();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.oscGain.gain); 
              this.lfo.start();
              this.isLfoActive = true;
      } else
      if (value === 'vibrato') {
    		if(this.isLfoActive == true) this.lfo.stop();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.monoOsc.frequency); 
              this.lfo.start();
              this.isLfoActive = true;
      } else
      if (value === 'filter') {
    		if(this.isLfoActive == true) this.lfo.stop();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.filter.frequency); 
              this.lfo.start();
              this.isLfoActive = true;
      } else
      if (value === 'FM') {
    		if(this.isLfoActive == true) this.lfo.stop();
              this.lfo = audioContext.createOscillator();
              this.lfo.connect(this.lfoGain);
              this.lfo.frequency.value = this.currLfoFrq;
              this.lfoGain.gain.value = this.currLfoGain;
              this.lfoGain.connect(this.monoOsc.frequency); 
              this.lfo.start();
              this.isLfoActive = true;
      } 
  }
  setAmpLfo(value){
      var currGain = this.lfoGain.gain.value; 
      this.currLfoGain = value;
      var currentTime = audioContext.currentTime;         
      this.lfoGain.gain.cancelScheduledValues(currentTime);
      this.lfoGain.gain.setValueAtTime(currGain,currentTime);
      this.lfoGain.gain.linearRampToValueAtTime(value,currentTime+this.glideTime);
      //console.log('amp');
  }
  setFrqLfo(value){
      var tempFrq = this.lfo.frequency.value;
      this.currLfoFrq = value;
      var currentTime = audioContext.currentTime;
      this.lfo.frequency.cancelScheduledValues(currentTime);
      this.lfo.frequency.setValueAtTime(tempFrq,currentTime);
      this.lfo.frequency.linearRampToValueAtTime(value,currentTime+this.glideTime);
  }
  setTypeLfo(value){
  	this.currentLfoType = value;
    this.lfo.type = value; 
  }

  samplePlay(trackName) {
  	this.bufferSource = audioContext.createBufferSource();
  	this.bufferSource.loop = true;
  	this.bufferSource.connect(this.bufferGain);
  	const audioBuffer = this.e.loader.data[trackName];
 
    this.bufferSource.buffer = audioBuffer;
    this.bufferSource.start();

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
      var currGain = this.oscGain.gain.value; 
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
  	console.log('speed');
  }

  touchStartCallback(id, normX, normY){
    // notify touch on
    this.e.send('osc', '/' + this.moduleName, ['touchOn', 1] );
    // common touch callback
    this.touchCommonCallback(id, normX, normY);      
  }

  touchMoveCallback(id, normX, normY){
    // common touch callback
    this.touchCommonCallback(id, normX, normY);
  }

  touchEndCallback(id, normX, normY){
    // notify touch off
    this.e.send('osc', '/' + this.moduleName, ['touchOn', 0] );
    // common touch callback
    this.touchCommonCallback(id, normX, normY);      
  }  

   touchCommonCallback(id, normX, normY){
    // ATTEMPT AT CROSSMODULE POSTING: FUNCTIONAL BUT ORIGINAL USE NO LONGER CONSIDERED: TODELETE WHEN CONFIRMED
    // window.postMessage(['nuRenderer', 'touch', id, normX, normY], location.origin);
    // ----------
    // send touch pos
    this.e.send('osc', '/' + this.moduleName, ['touchPos', id, normX, normY]);
    this.sampleVol(normY);
    this.sampleLoopOut(normX);

  }

   // Note: hereafter are the OSC triggered functions used to enable / disable 
  // hereabove callbacks

  touch(onOff){
    // enable if not already enabled
    if( onOff && !this.callBackStatus.touch ){
      this.surface.addListener('touchstart', this.touchStartCallback);
      this.surface.addListener('touchmove', this.touchMoveCallback);
      this.surface.addListener('touchend', this.touchEndCallback);
      this.callBackStatus.touch = true;
    }
    // disable if not already disabled
    if( !onOff && this.callBackStatus.touch ){
      this.surface.removeListener('touchstart', this.touchStartCallback);
      this.surface.removeListener('touchmove', this.touchMoveCallback);
      this.surface.removeListener('touchend', this.touchEndCallback);
      this.callBackStatus.touch = false;
    }
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

