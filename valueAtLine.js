import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtNode} from "./valueAtNode.js";

export class ValueAtLine{
    #valueAt;
    #timeLine;
    #valueAtGroup;
    #labelName;
    #labelDiv;
    #labelSpan;
    #lineDiv;
    #svgWrapperDiv;
    #svg;
    #path;
    #strokeColor;
    #strokeWidth;
    #valueAtNodes = [];
    #pointerTime = 0;
    #lineHeight = 0;
    #firstValueAtNodeSelected= null;
    onSelectedChanged;
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
        this.#lineDiv = VA_Utils.createEl('div', {id: this.#valueAt.name + '_graph', className: 'valueAt-line' + collapseClass});
        this.#lineDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueAtNodes();
            }
        });

        this.#lineDiv.addEventListener('pointermove', (e)=>{
            if (e.buttons==1){
                let f = e.offsetX/this.#lineDiv.offsetWidth;
                this.#pointerTime = this.#timeLine.startTime + (this.#timeLine.timeRange * f);
            }
        });

        this.#labelDiv = VA_Utils.createEl('div', {id: this.#valueAt.name + '_lbl', className: 'valueAt-line-label' + collapseClass}, this.#lineDiv);
        let span = VA_Utils.createEl('span', {innerText: this.#labelName}, this.#labelDiv);
        span.style.left = this.#valueAtGroup.indent + 'px';
        this.#svgWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-svg-wrapper'}, this.#lineDiv);
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
       
        //this.#timeLine.scrollContainerDiv.appendChild(this.#lineDiv);
        valueAtGroup.expandDiv.appendChild(this.#lineDiv);
        
        //  create visual nodes
        for (let i = 0; i < this.#valueAt.valueKeys.length; i++){
            let valueKey = this.#valueAt.valueKeys[i];
            let valueAtNode = new ValueAtNode(this.#svgWrapperDiv, valueKey);
            valueAtNode.onSelectedChanged = (valueAtNode, event)=>{
                let selected = valueAtNode.selected;
                if (event){
                    if (!event.ctrlKey && !event.shiftKey){
                        this.#timeLine.deselectAllValueAtNodes();
                    }
                    valueAtNode.selected = selected;
                    this.#timeLine.addValueAtNodeToSelectedList(valueAtNode);
                    if(valueAtNode.selected){
                        if (this.#firstValueAtNodeSelected == null){
                            this.#firstValueAtNodeSelected = valueAtNode
                        } else {
                            if (event.shiftKey){
                                //  select value nodes from firstValueAtNodeSelected up to valueAtNode
                                let startIndex = Math.min(this.#valueAtNodes.indexOf(this.#firstValueAtNodeSelected), this.#valueAtNodes.indexOf(valueAtNode));
                                let endIndex = Math.max(this.#valueAtNodes.indexOf(this.#firstValueAtNodeSelected), this.#valueAtNodes.indexOf(valueAtNode));
                                for (let i = startIndex; i <= endIndex; i++){
                                    this.#valueAtNodes[i].selected = true;
                                    this.#timeLine.addValueAtNodeToSelectedList(this.#valueAtNodes[i]);
                                }
                            }
                        }
                    }
                }
            }
            this.#valueAtNodes.push(valueAtNode);
        }
        this.#render();
        this.#valueAt.onChange = ()=>{this.#handleOnChange()};
    }

    #handleOnChange(){
        this.update();
    }

    #render(){
        //if (!this.#lineDiv.classList.contains('valueAt-collapse')){
            this.#path.setAttribute('stroke-width', this.#strokeWidth);
            this.#path.setAttribute('stroke', this.#strokeColor);
            let steps = Math.floor(this.#timeLine.parentDiv.offsetWidth * 0.5);
            let w = this.#timeLine.lineWrapDiv.offsetWidth;
            let valueRange = this.#valueAt.maxValue - this.#valueAt.minValue;
            let path = 'M' + this.#timeLine.viewStart + ' ' + this.#valueAt.getValueAtKeyframe(this.#timeLine.viewStart);
            path += 'L';
            for (let i = 1; i <= steps; i++){
                let f = i / steps;
                let x =  this.#timeLine.viewStart + this.#timeLine.viewRange * f;
                let y = this.#valueAt.getValueAtKeyframe(x);
                path += x + ' ' + y + ' ';
            }

            let margin = valueRange / this.#lineHeight * this.#strokeWidth * 2;
            let hm = margin * 0.5;

            this.#svg.setAttribute('viewBox', this.#timeLine.viewStart + ' ' + (this.#valueAt.minValue-hm) + ' ' + this.#timeLine.viewRange + ' ' + (valueRange + margin));
            this.#svg.querySelector('path').setAttribute('d', path);
            this.#svg.setAttribute('preserveAspectRatio', 'none');
        //}
        let v_offset = this.#strokeWidth / this.#lineHeight * 100;

        this.#valueAtNodes.forEach((valueAtNode)=>{
            let percent = (valueAtNode.valueKey.time - this.#timeLine.viewStart) / (this.#timeLine.viewRange) * 100;
            if (percent >= 0 && percent<= 100){
                valueAtNode.div.style.left = (valueAtNode.valueKey.time - this.#timeLine.viewStart) / (this.#timeLine.viewRange) * 100 + '%';
                valueAtNode.div.style.bottom = ((v_offset*0.5) + (valueAtNode.valueKey.value - this.#valueAt.minValue) / (this.#valueAt.maxValue - this.#valueAt.minValue) * (100-v_offset)) + '%';
                valueAtNode.div.style.display = '';
            } else {
                valueAtNode.div.style.display = 'none';
            }
        });
    }
    #handleSelectedChanged(){
        if (typeof onSelectedChanged === 'function'){
            this.onSelectedChanged(this);
        }
    }
    deselectAllValueAtNodes(){
        let selectedChanged = [];
        this.#valueAtNodes.forEach((valueAtNode)=>{
            if (valueAtNode.selected){selectedChanged.push(valueAtNode)}
            valueAtNode.selected = false;
        });
        if (selectedChanged.length > 0){
            this.#handleSelectedChanged(selectedChanged);
        }
    }
    update(startTime_offset, timeRange_offset){
        //if (this.#valueAtGroup.expanded){
            this.#render(startTime_offset, timeRange_offset);
        //}
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
    get labelDivName(){
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