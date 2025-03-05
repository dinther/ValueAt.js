import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtNode} from "./valueAtNode.js";
import * as Icons from "./appIcons.js";

export class ValueAtLine{
    #valueAt;
    #timeLine;
    #valueAtGroup;
    #labelName;
    #labelDiv;
    #labelSpan;
    #lineIconsDiv;
    #loopDiv;
    #freezeDiv;
    #expandDiv;
    #lineDiv;
    #svgWrapperDiv;
    #svg;
    #path;
    #strokeColor;
    #strokeWidth;
    #freeze = false;
    #loop = false;
    #valueAtNodes = [];
    #pointerTime = 0;
    #lineHeight = 0;
    #valueKeyTovalueAtNodeMap = new Map;
    #firstValueAtNodeSelected= null;
    #inView = false;
    onSelectedChanged;
    onRender = null;
    constructor(valueAt, timeLine, valueAtGroup, labelName, strokeWidth=1, strokeColor='#fff'){
        this.#valueAt = valueAt;
        this.#timeLine = timeLine;
        this.#valueAtGroup = valueAtGroup;
        this.#labelName = labelName;
        this.#strokeWidth = strokeWidth;
        this.#strokeColor = strokeColor;
        this.#lineHeight = parseFloat(this.#timeLine.getCSSVariable('--line-row-height').replace('px',''));
        let collapseClass = '';
        if (valueAtGroup.expandDiv.classList.contains('valueAt-collapse')){
            collapseClass = ' valueAt-collapse';
        }
        this.#lineDiv = VA_Utils.createEl('div', { className: 'valueAt-line' + collapseClass});
        this.#labelDiv = VA_Utils.createEl('div', { className: 'valueAt-line-label' + collapseClass}, this.#lineDiv);
        let span = VA_Utils.createEl('span', {innerText: this.#labelName}, this.#labelDiv);
        span.style.left = this.#valueAtGroup.indent + 'px';
        this.#lineIconsDiv = VA_Utils.createEl('div', {className: 'valueAt-line-icons'}, this.#labelDiv);
        this.#loopDiv = VA_Utils.createEl('div', {title: 'Toggle loop', className: 'valueAt-line-icon valueAt-disabled'}, this.#lineIconsDiv);
        this.#loopDiv.innerHTML = Icons.getSVG('loop');
        this.#expandDiv = VA_Utils.createEl('div', {title: 'Maximize this line graph', className: 'valueAt-line-icon  valueAt-disabled'}, this.#lineIconsDiv);
        this.#expandDiv.innerHTML = Icons.getSVG('fullscreen');
        this.#freezeDiv = VA_Utils.createEl('div', {title: 'Toggle freeze', className: 'valueAt-line-icon'}, this.#lineIconsDiv);
        this.#freezeDiv.innerHTML = Icons.getSVG('visible');
        this.#svgWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-svg-wrapper'}, this.#lineDiv);

        this.#svgWrapperDiv.addEventListener('pointerdown', (e)=>{
            //if (!e.target.classList.contains('valueAt-node') && !e.ctrlKey && !e.shiftKey){ this.deselectAllValueAtNodes(); }

            if (e.button==0 && !e.target.classList.contains('valueAt-node') && e.ctrlKey){  //  create new node
                let time = e.offsetX * this.#timeLine.timeUnitsPerPixel;
                let value = this.#valueAt.getValueAtKeyframe(time);
                let valueKey = this.#valueAt.addValueKey({time: time, value: value, easing: Easings.easeInOutCubic});
                this.#createvalueAtNode(valueKey);
            }
        });
        
        this.#svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.#svg.style.transform = 'scaleY(-1)';
        this.#svg.classList.add('valuesAt-svg');
        this.#path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.#path.setAttribute('d', 'M0 0L100 0 100 32 0 32 0 0');
        
        this.#path.setAttribute('stroke-width', this.#strokeWidth);
        this.#path.setAttribute('fill', 'none');
        this.#path.setAttribute('stroke' ,this.#strokeColor);
        this.#path.setAttribute('vector-effect', 'non-scaling-stroke');
        this.#path.setAttribute('stroke-linejoin', 'round');
        this.#svg.appendChild(this.#path);
        this.#svgWrapperDiv.appendChild(this.#svg);
       
        valueAtGroup.expandDiv.appendChild(this.#lineDiv);

        this.#loopDiv.addEventListener('pointerdown', (e)=>{
            if (e.button == 0){
                this.setLoop(!this.#loop);
                e.stopPropagation();
            }
        });

        this.#freezeDiv.addEventListener('pointerdown', (e)=>{
            if (e.button == 0){
                this.setFreeze(!this.#freeze);
                e.stopPropagation();
            }
        });

        this.#lineIconsDiv.addEventListener("contextmenu", e => e.preventDefault());

        this.#expandDiv.addEventListener('pointerdown', (e)=>{
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

        //  create visual nodes
        for (let i = 0; i < this.#valueAt.valueKeys.length; i++){
            let valueKey = this.#valueAt.valueKeys[i];
            this.#createvalueAtNode(valueKey);
        }
        this.#valueAt.onChange = (valueAt, valueKey, propName)=>{
            this.#handleOnChange(valueAt, valueKey, propName);
        };
        this.#render();
    }

    #createvalueAtNode(valueKey){
        let valueAtNode = new ValueAtNode(this, this.#svgWrapperDiv, valueKey);
        this.#valueKeyTovalueAtNodeMap.set(valueKey, valueAtNode);
        valueAtNode.onSelectedChanged = (valueAtNode, event)=>{
            let selected = valueAtNode.selected;
            if (event && !event.ctrlKey && !event.shiftKey){
                //this.#timeLine.deselectAllValueAtNodes();
            }
            valueAtNode.selected = selected;
            this.#timeLine.addValueAtNodesToSelectedList([valueAtNode]);
            if(valueAtNode.selected){
                if (this.#firstValueAtNodeSelected == null){
                    this.#firstValueAtNodeSelected = valueAtNode
                } else {
                    if (event && event.shiftKey){
                        //  select value nodes from firstValueAtNodeSelected up to valueAtNode
                        let startIndex = Math.min(this.#valueAtNodes.indexOf(this.#firstValueAtNodeSelected), this.#valueAtNodes.indexOf(valueAtNode));
                        let endIndex = Math.max(this.#valueAtNodes.indexOf(this.#firstValueAtNodeSelected), this.#valueAtNodes.indexOf(valueAtNode));
                        for (let i = startIndex; i <= endIndex; i++){
                            this.#valueAtNodes[i].selected = true;
                            this.#timeLine.addValueAtNodesToSelectedList([this.#valueAtNodes[i]]);
                        }
                    }
                }
            }
        }
        this.#valueAtNodes.push(valueAtNode);
    }
    #handleOnChange(valueAt, valueKey, propName){
        this.update(valueAt, valueKey, propName);
        this.#timeLine.setTime(this.#timeLine.cursorTime);
    }
    #isInView(){
        const rect = this.#lineDiv.getBoundingClientRect();
        let result = VA_Utils.domRectIntersect(rect, this.#timeLine.scrollContainerDiv.getBoundingClientRect())
        return result;       
    }

    #render(valueAt, valueKey, propName){
        let count = 0;
        if (!this.#lineDiv.classList.contains('valueAt-hide')){
            let inView = this.#isInView();
            if (inView){  //  only render if this was not in view and now it is in view
                this.#path.setAttribute('stroke-width', this.#strokeWidth);
                this.#path.setAttribute('stroke', this.#strokeColor);

                let w = this.#timeLine.lineWrapDiv.offsetWidth;

                //  Render svg data from viewStart to the first ValueKey that falls inside the timeRange
                let beforeIndex = this.#valueAt.getBeforeValueKeyIndex(this.#timeLine.viewStart);
                let beforeKey = this.#valueAt.valueKeys[beforeIndex];
                let path = 'M' + this.#timeLine.viewStart + ' ' + this.#valueAt.getValueAtKeyframe(this.#timeLine.viewStart) + 'L';
                count++;
                let range = this.#timeLine.viewStart - beforeKey.time;
                let sliceSteps = (range / this.#timeLine.viewRange)  / this.#timeLine.lineWrapDiv.offsetWidth / this.#timeLine.pixelsPerSegment;
                let x = this.#timeLine.viewStart;
                if (sliceSteps > 0 ){
                    let slice = sliceSteps;
                    let timeBreak = beforeKey.time - (slice * 0.5);
                    x += slice;
                    while(x < timeBreak){
                        let y = this.#valueAt.getValueAtKeyframe(x);
                        path += x + ' ' + y + ' ';
                        count++;
                        x += slice;
                    }   
                }
                
                //  Render svg data between ValueKeys stepping close to timeSlice
                for (let index = beforeIndex; index < this.#valueAt.valueKeys.length-1; index++){
                    let beforeKey = this.#valueAt.valueKeys[index];
                    let afterKey = this.#valueAt.valueKeys[index+1]; 
                    let range = (afterKey.time - beforeKey.time);
                    let sliceSteps = Math.round((range / this.#timeLine.viewRange) * this.#timeLine.lineWrapDiv.offsetWidth / this.#timeLine.pixelsPerSegment);
                    if (sliceSteps > 0){
                        let slice = range / sliceSteps;
                        let timeBreak = Math.min(afterKey.time - (slice * 0.5), this.#timeLine.viewEnd - (slice * 0.5));
                        path += beforeKey.time + ' ' + beforeKey.value + ' ';
                        count++;
                        x += slice;
                        while(x < timeBreak){
                            let y = this.#valueAt.getValueAtKeyframe(x);
                            path += x + ' ' + y + ' ';
                            count++;
                            x += slice;
                        }   
                    }
                }
                //  Render svg data from the last ValueKey that falls inside the timeRange and viewEnd
                beforeIndex = this.#valueAt.valueKeys.length - 1;
                beforeKey = this.#valueAt.valueKeys[beforeIndex];
                path += beforeKey.time + ' ' + beforeKey.value + ' ';
                range = (this.#timeLine.viewEnd - beforeKey.time) / this.#timeLine.dataRange;
                sliceSteps = range / this.#timeLine.lineWrapDiv.offsetWidth;
                if (sliceSteps > 0){
                    let slice = range / sliceSteps;
                    let timeBreak = this.#timeLine.viewEnd - (slice * 0.5);
                    x += slice;
                    while(x < timeBreak){
                        let y = this.#valueAt.getValueAtKeyframe(x);
                        path += x + ' ' + y + ' ';
                        count++;
                        x += slice;
                    }
                    path += this.#timeLine.viewEnd + ' ' + this.#valueAt.getValueAtKeyframe(this.#timeLine.viewEnd) + ' ';  
                    count++;         
                }

                let marginFactor = this.#valueAt.valueRange * (this.#strokeWidth / this.#lineDiv.offsetHeight);
                let hm = marginFactor * 0.5;
                let vb_min = (this.#valueAt.options.min != null)? this.#valueAt.options.min : this.#valueAt.minValue;
                let vb_range = (this.#valueAt.options.max != null)? (this.#valueAt.options.max - vb_min) : this.#valueAt.valueRange;
                this.#svg.setAttribute('viewBox', this.#timeLine.viewStart + ' ' + (vb_min-hm) + ' ' + this.#timeLine.viewRange + ' ' + (vb_range+ hm + hm));
                this.#svg.querySelector('path').setAttribute('d', path);
                this.#svg.setAttribute('preserveAspectRatio', 'none');
                let usableHeight = (this.#lineDiv.offsetHeight - this.#strokeWidth);// * 100;

                this.#valueAtNodes.forEach((valueAtNode)=>{
                    let percent = (valueAtNode.valueKey.time - this.#timeLine.viewStart) / (this.#timeLine.viewRange) * 100;
                    if (percent >= 0 && percent<= 101){  //  101% to deal with slight floating point errors
                        valueAtNode.div.style.left = (valueAtNode.valueKey.time - this.#timeLine.viewStart) / (this.#timeLine.viewRange) * 100 + '%';
                        valueAtNode.div.style.bottom = ((this.#strokeWidth*0.5) + ((valueAtNode.valueKey.value - vb_min) / vb_range * usableHeight)) + 'px';
                        valueAtNode.div.style.display = '';                       
                    } else {
                        valueAtNode.div.style.display = 'none';
                    }
                });
                if (typeof this.onRender == 'function'){
                    this.onRender(this.#timeLine.viewStart, this.#timeLine.viewRange);
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

    setLoop(value){
        this.#loop = value;
        if (this.#loop){
            this.#loopDiv.classList.remove('valueAt-disabled');
        } else {
            this.#loopDiv.classList.add('valueAt-disabled');
        }
    }

    setFreeze(freeze){
        this.#freeze = freeze;
        if (this.#freeze){
            this.#freezeDiv.classList.remove('valueAt-disabled');
        } else {
            this.#freezeDiv.classList.add('valueAt-disabled');
        }
    }

    getValueAtNodeBefore(time, includeCurrentTime=false){
        let valueKey = this.#valueAt.valueKeys[this.#valueAt.getBeforeValueKeyIndex(time, !includeCurrentTime)];
        return this.#valueKeyTovalueAtNodeMap.get(valueKey);
    };

    getValueAtNodeAfter(time, includeCurrentTime=false){
        let valueKey = this.#valueAt.valueKeys[this.#valueAt.getAfterValueKeyIndex(time, !includeCurrentTime)];
        return this.#valueKeyTovalueAtNodeMap.get(valueKey);
    };

    deselectAllValueAtNodes(){
        this.#timeLine.deselectAllValueAtNodes();
    }
    update(valueAt, valueKey, propName){
        this.#render(valueAt, valueKey, propName);
    }

    setTimeAccurate(time){
        if (!this.#freeze){
            this.#valueAt.setValueAccurate(time);
        }
    }
    
    setTime(time){
        if (!this.#freeze){
            this.#valueAt.setValueAt(time);
        }
    }
    setTimeFast(time){
        if (!this.#freeze){
            this.#valueAt.setValueFast(time);
        }
    }
    get svg(){
        return this.#svg;
    }
    get valueAtGroup(){
        return this.#valueAtGroup;
    }
    get inView(){
        return this.#inView;
    }
    get valueAt(){
        return this.#valueAt;
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
    get labelName(){
        return this.#labelName;
    }
    set labelName(value){
        this.#labelName = value;
        this.#labelSpan.innerText = this.#labelName;
    }
    get strokeWidth(){
        return this.#strokeWidth;
    }
    set strokeWidth(value){
        this.#strokeWidth = value;
        this.#render();
    }
    get strokeColor(){
        return this.#strokeColor;
    }
    set strokeColor(value){
        this.#strokeColor = value;
        this.#render();
    }
    get valueAtNodes(){
        return this.#valueAtNodes;
    }
}