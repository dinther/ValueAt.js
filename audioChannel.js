import * as VA_Utils from "./valueAtUtils.js";
import {ValueNode} from "./valueNode.js";
import * as Icons from "./appIcons.js";
import {Channel} from "./channel.js";

export class AudioChannel extends Channel{
    #svg;
    #path;
    #lineHeight = 0;
    #startIndex = 0;
    #endIndex = 0;
    #lastPeaks = [];
    #data = null;
    #minMax;
    #scale=1;
    #audioContext;
    #audio;
    #audioBuffer;
    onSelectedChanged;
    onRender = null;
    constructor(timeLine, channelGroup, options){
        super(timeLine, channelGroup, Object.assign({url: '', offset: 0, pixelsPerSegment: 2, samplesPerPoint: 60, strokeWidth: 1, strokeColor: '#fff'}, options));
        //this.lineDiv.classList.add('valueAt-wave-line');
        this.lineDiv.style.height = 'calc(var(--line-row-height)* 2)';
        this.lineDiv.style.backgroundColor = 'var(--scale-back-color)';
        height: ;
        this.svgWrapperDiv.addEventListener('pointerdown', (e)=>{
            if (e.button==0 && e.ctrlKey){
            }
        });

        this.labelDiv.style.flexDirection = 'column';
        this.labelDiv.style.justifyContent = 'start';
        this.labelDiv.style.gap = '4px';

        let offsetPair = VA_Utils.createEl('div', {className: 'labeled-input'}, this.labelDiv);
        VA_Utils.createEl('label', {for: 'offsetInput', innerText: 'Offset (ms)'}, offsetPair);
        
        var offsetInput = VA_Utils.createEl('input', {id: 'offsetInput', type: 'number', min: 0, step: '1', value: 143}, offsetPair);
        offsetInput.addEventListener('input', (e)=>{
            if (!isNaN(parseInt(offsetInput.value))){
                this.options.offset = Math.max(0, parseInt(offsetInput.value) / 1000);
                this.update();
            }
        });


        this.#svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.#svg.classList.add('valuesAt-svg');
        this.#path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.#path.setAttribute('d', 'M0 0L100 0 100 32 0 32 0 0');
        
        this.#path.setAttribute('stroke-width', this.options.strokeWidth);
        this.#path.setAttribute('fill', 'none');
        this.#path.setAttribute('stroke' ,this.options.strokeColor);
        this.#path.setAttribute('vector-effect', 'non-scaling-stroke');
        this.#path.setAttribute('stroke-linejoin', 'round');
        this.#svg.appendChild(this.#path);
        this.svgWrapperDiv.appendChild(this.#svg);

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.#audioContext = new AudioContext();
        this.#audio = new Audio();

        if (this.options.url != ''){
            this.loadAudioURL(this.options.url);
        }
        //this.#render();
        //this.setTimeAccurate(this.timeLine.cursorTime);
    }

    #handleOnChange(){
        this.update();
        this.setTimeAccurate(this.timeLine.cursorTime);
    }

    #findMinMax(list) {
        
        let minValue = null;
        let maxValue = null;
        for ( let i = 0; i < list.length; i++ ) {
            let value = list[i];
            minValue = minValue == null? value : Math.min( minValue, value ); 
            maxValue = maxValue == null? value : Math.max( maxValue, value );
        }
        return {minValue: minValue, maxValue: maxValue};
    }

    #getPeaks( startIndex, endIndex, pointCount ){
        let range = endIndex - startIndex;
        let sampleStep = Math.max( 1, ( range / pointCount ));
        startIndex = ~~( startIndex / ( sampleStep * 2 )) * ( sampleStep * 2 );
        endIndex = startIndex + range;
        if (this.#startIndex == startIndex && this.#endIndex == endIndex){
            return this.#lastPeaks;
        }
        let peaks = [];
        this.#startIndex = startIndex;
        let sampleCount = Math.min( sampleStep, this.options.samplesPerPoint );

        for ( let i=0; i < pointCount; i++ ){
            let yMax= 0;
            let step = Math.max( 1, ( sampleStep / sampleCount ));
            for ( let j = 0; j < sampleCount; j++ ){
                let index = ~~( startIndex + ( i * sampleStep ) + ( j * step ));
                yMax = Math.max( yMax, Math.abs( this.#data[index] ));
            }
            peaks[i] = yMax;
        }
        this.#lastPeaks = peaks;
        return peaks;
    }

    #drawValues( startIndex, endIndex ){    
        let pointCount = ~~( this.#svg.parentElement.offsetWidth / this.options.pixelsPerSegment );
        let peaks = this.#getPeaks( startIndex, endIndex, pointCount );
        let v = Math.max( Math.abs( this.#minMax.maxValue ), Math.abs( this.#minMax.minValue ));
        let path = 'M0 0L';
        let x = 0;
        let minValue = null;
        let maxValue = null;
        for ( let i = 0; i < peaks.length; i++ ){
            let value = peaks[i] / v * 256 * this.#scale;
            x = i * this.options.pixelsPerSegment;
            if ( i%2==0 ){ value *= -1;}
            path += x.toFixed( 0 ) + ' ' + ( value ).toFixed( 0 ) + ' ';

            if (i==0){
                minValue = value;
                maxValue = value;
            } else {
                minValue = Math.min(minValue, value);
                maxValue = Math.max(maxValue, value);
            }
        }
        this.#svg.setAttribute('viewBox', '0 ' + minValue + ' ' + x + ' ' + (maxValue - minValue));   
        this.#svg.setAttribute('preserveAspectRatio', 'none');    
        this.#svg.querySelector( 'path' ).setAttribute( 'd', path );

        let range = endIndex - startIndex;
        if ( typeof( this.onViewChange ) === 'function' ){
            this.onViewChange( this );
        }
    }   

    render(){
        super.render();
        if (this.inView){  //  only render if this was not in view and now it is in view
            this.#path.setAttribute('stroke-width', this.options.strokeWidth);
            this.#path.setAttribute('stroke', this.options.strokeColor);
            let startIndex = this.timeLine.viewStart * this.#audioBuffer.sampleRate;
            let endIndex = startIndex + this.timeLine.viewRange * this.#audioBuffer.sampleRate;
            this.#drawValues(startIndex, endIndex);
            if (typeof this.onRender == 'function'){

                this.onRender(startIndex, endIndex);
            }
        }
    }

    #handleSelectedChanged(){
        if (typeof onSelectedChanged === 'function'){
            this.onSelectedChanged(this);
        }
    }

    loadAudioURL(url){
        return fetch(url)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            this.#audio.src = URL.createObjectURL(new Blob([arrayBuffer]));  //  Does this use the same data?
            return this.#audioContext.decodeAudioData(arrayBuffer)
        }).then(audioBuf => {
            this.#audioBuffer = audioBuf;
            this.#data = this.#audioBuffer.getChannelData( 0 );
            this.#minMax = this.#findMinMax(this.#data);
            this.update();
        });
    }

    update(){
        if (this.#data != null) this.render();
    }

    setTimeAccurate(time){
        if (!this.options.freeze){
            //this.#valueAt.setValueAccurate(time);
        }
    }
    
    setTime(time){
        if (!this.options.freeze){
            //this.#valueAt.setValueAt(time);
        }
    }
    setTimeFast(time){
        if (!this.options.freeze){
            //this.#valueAt.setValueFast(time);
        }
    }
    get audio(){
        return this.#audio;
    }
    get svg(){
        return this.#svg;
    }

    get strokeWidth(){
        return this.options.strokeWidth;
    }
    set strokeWidth(value){
        this.options.strokeWidth = value;
        this.render();
    }
    get strokeColor(){
        return this.options.strokeColor;
    }
    set strokeColor(value){
        this.options.strokeColor = value;
        this.render();
    }
}