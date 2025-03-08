import * as VA_Utils from "./valueAtUtils.js";
import {ValueNode} from "./valueNode.js";
import * as Icons from "./appIcons.js";
import {Channel} from "./channel.js";

export class ValueChannel extends Channel{
    #valueAt;
    #svg;
    #path;
    #valueNodes = [];
    #pointerTime = 0;
    #lineHeight = 0;
    #valueKeyTovalueNodeMap = new Map;
    #firstValueNodeSelected= null;
    #inView = false;
    onSelectedChanged;
    onRender = null;
    constructor(timeLine, channelGroup, options){
        super(timeLine, channelGroup, Object.assign({valueAt: null, timeAccuracy: 2, valueAccuracy: 2, pixelsPerSegment: 3, strokeWidth: 1, strokeColor: '#fff'}, options));
        this.#valueAt = this.options.valueAt;

        this.svgWrapperDiv.addEventListener('pointerdown', (e)=>{
            //if (!e.target.classList.contains('valueAt-node') && !e.ctrlKey && !e.shiftKey){ this.deselectAllValueNodes(); }

            if (e.button==0 && !e.target.classList.contains('valueAt-node') && e.ctrlKey){  //  create new node
                let time = e.offsetX * this.timeLine.timeUnitsPerPixel;
                let value = this.#valueAt.getValueAtKeyframe(time);
                let valueKey = this.#valueAt.addValueKey({time: time, value: value, easing: Easings.easeInOutCubic});
                this.#createValueNode(valueKey);
            }
        });
        
        this.#svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.#svg.style.transform = 'scaleY(-1)';
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
       

        //  create visual nodes
        for (let i = 0; i < this.#valueAt.valueKeys.length; i++){
            let valueKey = this.#valueAt.valueKeys[i];
            this.#createValueNode(valueKey);
        }
        this.#valueAt.onChange = (valueAt, valueKey, propName)=>{
            this.#handleOnChange(valueAt, valueKey, propName);
        };
        this.#render();
        this.setTimeAccurate(this.timeLine.cursorTime);
    }

    #createValueNode(valueKey){
        let valueNode = new ValueNode(this, this.svgWrapperDiv, valueKey);
        this.#valueKeyTovalueNodeMap.set(valueKey, valueNode);
        valueNode.onSelectedChanged = (valueNode, event)=>{
            let selected = valueNode.selected;
            if (event && !event.ctrlKey && !event.shiftKey){
                //this.#timeLine.deselectAllValueNodes();
            }
            valueNode.selected = selected;
            this.timeLine.addValueNodesToSelectedList([valueNode]);
            if(valueNode.selected){
                if (this.#firstValueNodeSelected == null){
                    this.#firstValueNodeSelected = valueNode
                } else {
                    if (event && event.shiftKey){
                        //  select value nodes from firstValueNodeSelected up to valueNode
                        let startIndex = Math.min(this.#valueNodes.indexOf(this.#firstValueNodeSelected), this.#valueNodes.indexOf(valueNode));
                        let endIndex = Math.max(this.#valueNodes.indexOf(this.#firstValueNodeSelected), this.#valueNodes.indexOf(valueNode));
                        for (let i = startIndex; i <= endIndex; i++){
                            this.#valueNodes[i].selected = true;
                            this.timeLine.addValueNodesToSelectedList([this.#valueNodes[i]]);
                        }
                    }
                }
            }
        }
        this.#valueNodes.push(valueNode);
    }

    #handleOnChange(valueAt, valueKey, propName){
        this.update(valueAt, valueKey, propName);
        this.setTimeAccurate(this.timeLine.cursorTime);
    }



    #render(valueAt, valueKey, propName){
        let count = 0;
        if (!this.lineDiv.classList.contains('valueAt-hide')){
            let inView = this.isInView();
            if (inView){  //  only render if this was not in view and now it is in view
                this.#path.setAttribute('stroke-width', this.options.strokeWidth);
                this.#path.setAttribute('stroke', this.options.strokeColor);

                let w = this.timeLine.lineWrapDiv.offsetWidth;

                //  Render svg data from viewStart to the first ValueKey that falls inside the timeRange
                let beforeIndex = this.#valueAt.getBeforeValueKeyIndex(this.timeLine.viewStart);
                let beforeKey = this.#valueAt.valueKeys[beforeIndex];
                let x = this.timeLine.viewStart;
                let y = this.#valueAt.getValueAtKeyframe(this.timeLine.viewStart);
                let path = 'M' + x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + 'L';
                count++;
                let range = this.timeLine.viewStart - beforeKey.time;
                let sliceSteps = (range / this.timeLine.viewRange)  / this.timeLine.lineWrapDiv.offsetWidth / this.options.pixelsPerSegment;

                if (sliceSteps==0 || beforeKey.easing == null || beforeKey.easing == Easings.linear){
                    x = beforeKey.time;
                    if (y != beforeKey.value){
                        y = beforeKey.value;
                        path += x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + ' ';
                    }
                } else {
                    let slice = sliceSteps;
                    let timeBreak = beforeKey.time - (slice * 0.5);
                    x += slice;
                    while(x < timeBreak){
                        let y = this.#valueAt.getValueAtKeyframe(x);
                        path += x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + ' ';
                        count++;
                        x += slice;
                    }   
                }
                
                //  Render svg data between ValueKeys stepping close to timeSlice
                for (let index = beforeIndex; index < this.#valueAt.valueKeys.length-1; index++){
                    let beforeKey = this.#valueAt.valueKeys[index];
                    let afterKey = this.#valueAt.valueKeys[index+1]; 
                    let range = (afterKey.time - beforeKey.time);
                    let sliceSteps = Math.floor((range / this.timeLine.viewRange) * (this.timeLine.lineWrapDiv.offsetWidth - x) / this.options.pixelsPerSegment);// + 1;                    
                    if (sliceSteps == 0 ||afterKey.easing == null || afterKey.easing.name == 'linear'){
                        x = afterKey.time;
                        y = afterKey.value;
                        path += x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + ' ';    
                    } else {
                        let slice = range / sliceSteps;
                        let timeBreak = Math.min(afterKey.time - (slice * 0.5), (this.timeLine.viewStart+this.timeLine.viewRange) - (slice * 0.5));
                        path += beforeKey.time.toFixed(this.options.timeAccuracy) + ' ' + beforeKey.value.toFixed(this.options.valueAccuracy) + ' ';
                        count++;
                        x += slice;
                        while(x < timeBreak){
                            let y = this.#valueAt.getValueAtKeyframe(x);
                            path += x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + ' ';
                            count++;
                            x += slice;
                        }
                    }
                }
                //  Render svg data from the last ValueKey that falls inside the timeRange and viewEnd
                beforeIndex = this.#valueAt.valueKeys.length - 1;
                beforeKey = this.#valueAt.valueKeys[beforeIndex];
                //path += beforeKey.time + ' ' + beforeKey.value + ' ';
                let viewEnd = this.timeLine.viewStart + this.timeLine.viewRange;
                if (beforeKey.time < viewEnd){
                    x = viewEnd;
                    y = beforeKey.value;
                    path += x.toFixed(this.options.timeAccuracy) + ' ' + y.toFixed(this.options.valueAccuracy) + ' ';           
                }

                let marginFactor = this.#valueAt.valueRange * (this.options.strokeWidth / this.lineDiv.offsetHeight);
                let hm = marginFactor * 0.5;
                let vb_min = (this.#valueAt.options.min != null)? this.#valueAt.options.min : this.#valueAt.minValue;
                let vb_range = (this.#valueAt.options.max != null)? (this.#valueAt.options.max - vb_min) : this.#valueAt.valueRange;
                this.#svg.setAttribute('viewBox', this.timeLine.viewStart + ' ' + (vb_min-hm) + ' ' + this.timeLine.viewRange + ' ' + (vb_range+ hm + hm));
                this.#svg.querySelector('path').setAttribute('d', path);
                this.#svg.setAttribute('preserveAspectRatio', 'none');
                let usableHeight = (this.lineDiv.offsetHeight - this.options.strokeWidth);

                this.#valueNodes.forEach((valueNode)=>{
                    let percent = (valueNode.valueKey.time - this.timeLine.viewStart) / (this.timeLine.viewRange) * 100;
                    if (percent >= 0 && percent<= 101){  //  101% to deal with slight floating point errors
                        valueNode.div.style.left = percent + '%';
                        valueNode.div.style.bottom = ((this.options.strokeWidth*0.5) + ((valueNode.valueKey.value - vb_min) / vb_range * usableHeight)) + 'px';
                        valueNode.div.style.display = '';                       
                    } else {
                        valueNode.div.style.display = 'none';
                    }
                });
                if (typeof this.onRender == 'function'){
                    this.onRender(this.timeLine.viewStart, this.timeLine.viewRange);
                }
            }
            this.#inView = inView;
        }
    }

    #handleSelectedChanged(){
        if (typeof onSelectedChanged === 'function'){
            this.onSelectedChanged(this);
        }
    }

    getValueNodeBefore(time, includeCurrentTime=false){
        let valueKey = this.#valueAt.valueKeys[this.#valueAt.getBeforeValueKeyIndex(time, !includeCurrentTime)];
        return this.#valueKeyTovalueNodeMap.get(valueKey);
    };

    getValueNodeAfter(time, includeCurrentTime=false){
        let valueKey = this.#valueAt.valueKeys[this.#valueAt.getAfterValueKeyIndex(time, !includeCurrentTime)];
        return this.#valueKeyTovalueNodeMap.get(valueKey);
    };

    deselectAllValueNodes(){
        this.timeLine.deselectAllValueNodes();
    }
    update(valueAt, valueKey, propName){
        this.#render(valueAt, valueKey, propName);
    }

    setTimeAccurate(time){
        if (!this.options.freeze){
            this.#valueAt.setValueAccurate(time);
        }
    }
    
    setTime(time){
        if (!this.options.freeze){
            this.#valueAt.setValueAt(time);
        }
    }
    setTimeFast(time){
        if (!this.options.freeze){
            this.#valueAt.setValueFast(time);
        }
    }
    get svg(){
        return this.#svg;
    }
    
    get inView(){
        return this.#inView;
    }
    get valueAt(){
        return this.#valueAt;
    }
    get strokeWidth(){
        return this.options.strokeWidth;
    }
    set strokeWidth(value){
        this.options.strokeWidth = value;
        this.#render();
    }
    get strokeColor(){
        return this.options.strokeColor;
    }
    set strokeColor(value){
        this.options.strokeColor = value;
        this.#render();
    }
    get valueNodes(){
        return this.#valueNodes;
    }
}