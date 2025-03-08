import * as VA_Utils from "./valueAtUtils.js";
import {ValueNode} from "./valueNode.js";
import * as Icons from "./appIcons.js";

export class Channel{
    #options = {name: '', loop: false, freeze: false, maximized: false};
    #valueAt;
    #timeLine;
    #channelGroup;
    #labelDiv;
    #labelSpan;
    #lineIconsDiv;
    //#loopBtn;
    #freezeBtn;
    #expandBtn;
    #lineDiv;
    #svgWrapperDiv;
    #pointerTime = 0;
    #lineHeight = 0;
    #inView = false;
    onSelectedChanged;
    onRender = null;
    constructor(timeLine, channelGroup, options){
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        Object.assign(this.#options, options);
        if (typeof timeLine != 'object' || timeLine.constructor.name !== 'TimelineManager'){
            throw new Error('A object of type TimeLineManager is required for parameter timeLine');
        }
        if (typeof channelGroup != 'object' || channelGroup.constructor.name !== 'ChannelGroup'){
            throw new Error('A object of type ChannelGroup is required for parameter channelGroup');
        }
        this.#timeLine = timeLine;
        this.#channelGroup = channelGroup;
        this.#channelGroup.valueChannels.push(this);

        this.#lineHeight = parseFloat(this.#timeLine.getCSSVariable('--line-row-height').replace('px',''));
        let collapseClass = '';
        if (channelGroup.expandDiv.classList.contains('valueAt-collapse')){
            collapseClass = ' valueAt-collapse';
        }
        let maximizedClass = this.#options.maximized? 'valueAt-maximized' : '';

        this.#lineDiv = VA_Utils.createEl('div', { className: 'valueAt-line ' + collapseClass + ' ' + maximizedClass});
        this.#labelDiv = VA_Utils.createEl('div', { className: 'valueAt-line-label ' + collapseClass}, this.#lineDiv);
        let span = VA_Utils.createEl('span', {innerText: this.#options.name}, this.#labelDiv);
        span.style.left = this.#channelGroup.indent + 'px';
        this.#lineIconsDiv = VA_Utils.createEl('div', {className: 'valueAt-line-icons'}, this.#labelDiv);
        //this.#loopBtn = VA_Utils.createEl('button', {title: 'Toggle loop', className: 'valueAt-line-icon valueAt-disabled'}, this.#lineIconsDiv);
        //this.#loopBtn.innerHTML = Icons.getSVG('loop');
        this.#freezeBtn = VA_Utils.createEl('button', {title: 'Toggle freeze', className: 'valueAt-line-icon valueAt-disabled'}, this.#lineIconsDiv);
        this.#freezeBtn.innerHTML = Icons.getSVG('freeze');        
        this.#expandBtn = VA_Utils.createEl('button', {title: 'Toggle channel size', className: 'valueAt-line-icon'}, this.#lineIconsDiv);
        this.#expandBtn.innerHTML = Icons.getSVG('fullscreen');
        this.#svgWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-svg-wrapper'}, this.#lineDiv);
       
        channelGroup.expandDiv.appendChild(this.#lineDiv);

        //this.#loopBtn.addEventListener('pointerdown', (e)=>{
        //    if (e.button == 0){
        //        this.setLoop(!this.#options.loop);
        //        e.stopPropagation();
        //    }
        //});

        this.#freezeBtn.addEventListener('pointerdown', (e)=>{
            if (e.button == 0){
                this.setFreeze(!this.#options.freeze);
                e.stopPropagation();
            }
        });

        this.#lineIconsDiv.addEventListener("contextmenu", e => e.preventDefault());

        this.#expandBtn.addEventListener('pointerdown', (e)=>{
            if (e.button==0){
                if (!e.ctrlKey && !e.shiftKey){
                    this.#timeLine.containerDiv.querySelectorAll('.valueAt-line.valueAt-maximized').forEach((lineDiv)=>{
                        if (lineDiv != this.#lineDiv){
                            lineDiv.classList.remove('valueAt-maximized');
                            this.update();
                        }
                    });
                }
                if (this.#lineDiv.classList.contains('valueAt-maximized')){
                    this.#lineDiv.classList.remove('valueAt-maximized');
                    this.update();
                } else{
                    if (e.shiftKey){
                        let firstMaximizedDiv = this.#timeLine.containerDiv.querySelector('.valueAt-line.valueAt-maximized');
                        if (firstMaximizedDiv && firstMaximizedDiv != this.#lineDiv){
                            let lineDivs = Array.from(this.#timeLine.containerDiv.querySelectorAll('.valueAt-line'));
                            let startIndex = lineDivs.indexOf(firstMaximizedDiv);
                            let endIndex = lineDivs.indexOf(this.#lineDiv);
                            for (let i=startIndex; i<endIndex; i++){
                                lineDivs[i].classList.add('valueAt-maximized');
                                lineDivs[i].update();
                            }
                        }
                    }
                    this.#lineDiv.classList.add('valueAt-maximized');
                    this.update();
                }
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    #handleOnChange(){
        this.update();
        this.setTimeAccurate(this.#timeLine.cursorTime);
    }

    isInView(){
        const rect = this.#lineDiv.getBoundingClientRect();
        let result = VA_Utils.domRectIntersect(rect, this.#timeLine.scrollContainerDiv.getBoundingClientRect())
        return result;       
    }

    render(){
        let count = 0;
        let inView = false;
        if (!this.#lineDiv.classList.contains('valueAt-hide')){
            inView = this.isInView();
            if (inView){  //  only render if this was not in view and now it is in view


                // render code here

            }
            this.#inView = inView;
        }
    }

    #handleSelectedChanged(){
        if (typeof onSelectedChanged === 'function'){
            this.onSelectedChanged(this);
        }
    }

    //setLoop(value){
    //    this.#options.loop = value;
    //    if (this.#options.loop){
    //        this.#loopBtn.classList.remove('valueAt-disabled');
    //    } else {
    //        this.#loopBtn.classList.add('valueAt-disabled');
    //    }
    //}

    setFreeze(value){
        this.#options.freeze = value;
        if (this.#options.freeze){
            this.#freezeBtn.classList.remove('valueAt-disabled');
        } else {
            this.#freezeBtn.classList.add('valueAt-disabled');
        }
    }

    update(){
        this.render();
    }

    setTimeAccurate(time){
        if (!this.#options.freeze){
            //this.#valueAt.setValueAccurate(time);
        }
    }
    
    setTime(time){
        if (!this.#options.freeze){
            //this.#valueAt.setValueAt(time);
        }
    }
    setTimeFast(time){
        if (!this.#options.freeze){
            //this.#valueAt.setValueFast(time);
        }
    }
    get inView(){
        return this.#inView;
    }
    get timeLine(){
        return this.#timeLine;
    }
    get channelGroup(){
        return this.#channelGroup;
    }
    get options(){
        return this.#options;
    }
    get inView(){
        return this.#inView;
    }
    get lineDiv(){
        return this.#lineDiv;
    }
    get labelDiv(){
        return this.#labelDiv;
    }
    get svgWrapperDiv(){
        return this.#svgWrapperDiv;
    }
    get name(){
        return this.#options.name;
    }
    set name(value){
        this.#options.name = value;
        this.#labelSpan.innerText = this.#options.name;
    }
    get lineIconsDiv(){
        return this.#lineIconsDiv;
    }
}