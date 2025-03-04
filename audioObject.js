import * as VA_Utils from "./valueAtUtils.js";
import {LookupAtTime} from "./valueat.js"
import {WaveDisplay} from "./wavedisplay.js";

export class AudioObject{
    #parent = null;
    #timeLine;
    #name;
    #audioElm;
    #audioContext;
    #audioBuffer;
    #waveDisplay;
    #bpm;
    #valueAt;
    constructor(parent, timeLine, name, bpm){
        this.#parent = parent;
        this.#timeLine = timeLine;
        this.#valueAt =  new LookupAtTime({object: this, property: 'bpm', min:0, max:500, listType: 'Float32Array'});
        this.#valueAt.addValueKey({time:0, value: 0});
        
        this.#valueAt.init(1);
        this.#name = name;
        this.#bpm = bpm;
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.#audioContext = new AudioContext();
        this.#audioElm = new Audio();
    }
    loadAudioURL(url){
        return fetch(url)//'./music.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            this.#audioElm.src = URL.createObjectURL(new Blob([arrayBuffer]));  //  Does this use the same data?
            return this.#audioContext.decodeAudioData(arrayBuffer)
        }).then(audioBuf => {
            this.#audioBuffer = audioBuf;
            if (this.#parent != null){
                this.#constructWaveDisplay();
            }
        });
    }
    #constructWaveDisplay(){    
        return this.#waveDisplay = new WaveDisplay({
            data: this.#audioBuffer.getChannelData(0),
            parent: this.#parent,
            samplesPerPoint: 60,
            sampleRate: this.#audioBuffer.sampleRate,
            zoomRate: 0.1,
            decelerationTime: 4,
            scale: 1,
            zoom: 1,
        });
        //let duration = waveDisplay.options.parent.offsetWidth * waveDisplay.samplesPerPixel / waveDisplay.options.sampleRate * waveDisplay.zoom;
        let duration = this.#audioElm.duration;
        //this.#waveDisplay.zoom = duration / this.#timeLine.viewRange;
    }
    setParent(parent){
        this.#parent = parent;
        this.#constructWaveDisplay();
    }
    get valueAt(){
        return this.#valueAt;
    }
    get name(){
        return this.#name
    }
    get audioElm(){
        return this.#audioElm;
    }
    get waveDisplay(){
        return this.#waveDisplay;
    }
    set name(value){
        this.#name = value;
    }
    get bpm(){
        return this.#bpm;
    }
    set bpm(value){
        this.#bpm = value;
    }
}
