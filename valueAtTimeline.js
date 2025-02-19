import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtGroup} from "./valueAtGroup.js";
import {ValueAtLine} from "./valueAtLine.js";

export class ValueAtTimeLine{
    #parentDiv;
    #containerDiv;
    #headerDiv;
    #scrollContainerDiv;
    #stickyWrapperDiv;
    #scaleWrapperDiv;
    #scaleDiv;
    #lineWrapDiv;
    #scrollRemainderDiv;
    #scrollbarDiv;
    #remainingDiv;
    #footerDiv;

    #selectBoxDiv;

    
    #durationGroupDiv;
    #durationLabel;
    #durationInput;
    #scrollGroupDiv;
    #scrollLabel;
    #scrollSlider;    


    #zoomGroupDiv;
    #zoomLabel;
    #zoomSlider;
    #cursorDiv;
    #cursorLabel;

    #valueAtDiv;

    #startTime;
    #timeRange;
    #endTime;
    #cursorTime = 50;
    #root;
    
    #selectPointDown = null;
    #rootValueAtGroup;
    #valueAtLines = [];
    #selectedNodeList = [];
    
    #scrollbarContentDiv;
    
    #duration = 1;
    #timeUnitPerPixel;
    #pixelPerTimeUnit;
    constructor(parent, startTime, timeRange){
        this.#parentDiv = parent;

        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});

        //  build stickyheader
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#containerDiv);
 
        //  build wave display and scale container
        //this.scaleWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-scale-wrapper'}, this.#containerDiv);
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, this.#containerDiv);
 
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor', className: 'valueAt-cursor'}, this.#containerDiv);
        this.#cursorLabel = VA_Utils.createEl('div', {id: 'cursorlabel', innerText: '5.34'}, this.#cursorDiv);

        this.#scrollContainerDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-container'}, this.#containerDiv);
        //this.#stickyWrapperDiv = VA_Utils.createEl('div', {id: 'stickyWrapper'}, this.#scrollContainerDiv);

 
        //  build container to keep the data related objects together.
        this.#lineWrapDiv = VA_Utils.createEl('div', {className: 'valueAt-linewrap'}, this.#scrollContainerDiv);

        //  fills remainder of the scroll area
        this.#scrollRemainderDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-remainder'}, this.#scrollContainerDiv);

        //  build scroll bar
        this.#scrollbarDiv = VA_Utils.createEl('div',{className:'valueAt-scrollbar'}, this.#containerDiv);
        this.#scrollbarContentDiv = VA_Utils.createEl('div',{className:'valueAt-scroll-content'}, this.#scrollbarDiv);

        //  build remainder and footer
        this.#remainingDiv = VA_Utils.createEl('div',{className:'valueAt-remaining'}, this.#containerDiv);
        this.#footerDiv = VA_Utils.createEl('div',{className:'valueAt-footer', innerText: 'Footer'}, this.#containerDiv);


        
        this.#durationGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#durationLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'durationinput', innerText: 'Duration'}, this.#durationGroupDiv);
        this.#durationInput = VA_Utils.createEl('input', {id: 'durationinput', type: 'number', min: '1', max: '10000000', step: '1', value: '100'}, this.#durationGroupDiv);
        
        this.#scrollGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);  
        this.#scrollLabel = VA_Utils.createEl('label', {for: 'scrollslider', innerText: 'Scroll'}, this.#scrollGroupDiv);
        this.#scrollSlider = VA_Utils.createEl('input', {id: 'scrollinput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#scrollGroupDiv);
        
        this.#zoomGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#zoomLabel = VA_Utils.createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#zoomGroupDiv);

        //  build container for valueAt lines


        //  build select box
        this.#selectBoxDiv = VA_Utils.createEl('div', {className: 'valueAt-select-box', style: 'display: none'}, this.#containerDiv);

        this.#parentDiv.appendChild(this.#containerDiv);

        //  event handlers
        this.#containerDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueAtNodes();
            }
        });

        this.#durationInput.addEventListener('input', (e)=>{
            this.#duration = parseFloat(this.#durationInput.value);
            this.#endTime = this.#duration * this.#zoomSlider.value;
            this.update();
        });
        this.#duration = this.#durationInput.value;

        this.#root = document.querySelector(':root');
        this.#startTime = startTime;
        this.#timeRange = timeRange;
        this.#endTime = this.#startTime + this.#timeRange;

        this.#zoomSlider.addEventListener('input', (e)=>{
            let timeRange = this.#duration * this.#zoomSlider.value;
            this.#scrollbarContentDiv.style.width = (100 /  this.#zoomSlider.value) + '%';
            this.setView(this.#startTime, timeRange);
        });
        this.#zoomSlider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#zoomSlider.addEventListener('pointermove', (e)=>{ 
            e.stopPropagation();
        });

        this.#scrollSlider.addEventListener('input', (e)=>{
            let timeRange = this.#duration * this.#zoomSlider.value;
            this.setView(this.#scrollSlider.value * (this.#duration - timeRange), timeRange);
        });
        this.#scrollSlider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#scrollSlider.addEventListener('pointermove', (e)=>{ 
            e.stopPropagation();
        });

        //  create root valueAt group
        this.#rootValueAtGroup = new ValueAtGroup(this, '', null, true);

        document.addEventListener('keydown', (e)=>{
            if (e.shiftKey){
                this.#root.style.setProperty('--nodecursor', 'ew-resize');
            } else if (e.altKey){
                this.#root.style.setProperty('--nodecursor', 'ns-resize');
            } else {
                this.#root.style.setProperty('--nodecursor', 'move');
            }
        });
        document.addEventListener('keyup', (e)=>{
                this.#root.style.setProperty('--nodecursor', 'move');
        });
        document.addEventListener('pointerdown', (e)=>{
            if ( e.button == 0 && (e.ctrlKey || e.shiftKey)){
                this.#selectPointDown = {x: e.pageX, y: e.pageY};
                console.log('down');
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if ( this.#selectPointDown != null && (e.ctrlKey || e.shiftKey)){
                this.#selectBoxDiv.style.display = '';
                this.#selectBoxDiv.style.left = Math.min(this.#selectPointDown.x, e.pageX) + 'px';
                this.#selectBoxDiv.style.top = Math.min(this.#selectPointDown.y, e.pageY) + 'px';      
                this.#selectBoxDiv.style.width = Math.abs(e.pageX - this.#selectPointDown.x) + 'px';
                this.#selectBoxDiv.style.height = Math.abs(e.pageY -this.#selectPointDown.y) + 'px';
            }
        });
        document.addEventListener('pointerup', (e)=>{
            if ( this.#selectPointDown != null &&  (e.ctrlKey || e.shiftKey)){
                let selectRect = this.#selectBoxDiv.getBoundingClientRect();
                this.#selectBoxDiv.style.display = 'none';
                this.#selectPointDown = null;    
                let valueAtNodes = this.getValueAtNodes();
                valueAtNodes.forEach((valueAtNode)=>{
                    let rect = valueAtNode.div.getBoundingClientRect();
                    if (rect.left >= selectRect.left && rect.left <= selectRect.right && rect.top >= selectRect.top && rect.top <= selectRect.bottom){
                        valueAtNode.selected = true;
                        this.addValueAtNodeToSelectedList(valueAtNode);
                    }
                });
            }
        });   
        window.addEventListener('resize', (e)=>{
            this.#updateTimePerPixel();
            this.#updateCursor();
        });     
    }

    getCSSVariable(name){
        let rs = getComputedStyle(this.#root);
        return rs.getPropertyValue(name);
    }
    setCSSVariable(name, value){
        this.#root.style.setProperty(name, value);
    }
    #updateTimePerPixel(){
        if (this.#scrollContainerDiv.offsetWidth > 0){
            this.#timeUnitPerPixel = this.#timeRange / this.#lineWrapDiv.offsetWidth;//this.#cursorDiv.parentElement.parentElement.offsetWidth;
            this.#pixelPerTimeUnit = this.#lineWrapDiv.offsetWidth / this.#timeRange;
        }
    }

    #updateCursor(){
        this.#cursorDiv.style.height = this.#scaleDiv.offsetHeight + this.#scrollContainerDiv.offsetHeight + 'px';
        if (this.#timeUnitPerPixel === undefined){ this.#updateTimePerPixel() }
        let x = 5 + (this.#cursorTime - this.#startTime) * this.#pixelPerTimeUnit;
        this.#cursorDiv.style.left =  x + 'px';//(this.#cursorTime - this.#startTime) / this.#timeUnitPerPixel;
        // (this.#cursorTime - this.#startTime) / (this.#timeRange) * 100 * (this.#lineWrapDiv.offsetWidth / this.#scrollContainerDiv.offsetWidth) + '%';       
        this.#cursorLabel.innerText = this.#cursorTime.toFixed(0);
    }

    update(){
        this.#updateCursor();
        this.#rootValueAtGroup.update();
    }
    addValueAtNodeToSelectedList(valueAtNode){
        if (valueAtNode.selected){
            if (this.#selectedNodeList.indexOf(valueAtNode) == -1){
                this.#selectedNodeList.push(valueAtNode);
            }
        }
    }
    setCursor(time){
        this.#cursorTime = time;
        this.#updateCursor();
    }
    setView(startTime, timeRange=null ){
        timeRange = timeRange==null? this.#timeRange : Math.abs(timeRange);
        if (startTime != this.#startTime || timeRange != this.#timeRange){
            this.#startTime = startTime;
            this.#timeRange = timeRange;
            this.#endTime = this.#startTime + this.#timeRange;
            this.#updateTimePerPixel();
            this.update();
        }
    }
    deselectAllValueAtNodes(){
        let selectedChanged = false;
        this.#selectedNodeList.forEach((valueAtNode)=>{
            if (valueAtNode.selected){selectedChanged = true}
            valueAtNode.selected = false;
        });
        this.#selectedNodeList = [];
        selectedChanged
    }
    addValueAt(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        this.#valueAtLines.push(new ValueAtLine(valueAt, this, this.#rootValueAtGroup, labelName, strokeWidth, strokeColor));
    }
    addNewValueAtGroup(name, expanded=true, parentGroup=null){
        if (parentGroup==null){
            return this.#rootValueAtGroup.addNewValueAtGroup(name, expanded);
        } else {
            return parentGroup.addNewValueAtGroup(name, expanded);
        }
    }    
    get parentDiv(){
        return this.#parentDiv;
    }
    get containerDiv(){
        return this.#containerDiv;
    }
    get scrollContainerDiv(){
        return this.#scrollContainerDiv;
    }
    get lineWrapDiv(){
        return this.#lineWrapDiv;
    }
    get headerDiv(){
        return this.#headerDiv;
    }    
    get valueAtDiv(){
        return this.#valueAtDiv;
    }
    get valueAtLines(){
        return this.#valueAtLines;
    }
    get selectBoxDiv(){
        return this.#selectBoxDiv;
    }   
    get footerDiv(){
        return this.#footerDiv;
    }   
    get startTime(){
        return this.#startTime;
    }
    set startTime(value){
        this.#startTime = value;
        this.update();
    }
    get endTime(){
        return this.#endTime;
    }
    set endTime(value){
        this.#endTime = value;
        this.update();
    }
    get timeRange(){
        return this.#endTime - this.#startTime;
    }
    get rootValueAtGroup(){
        return this.#rootValueAtGroup;
    }
    getValueAtNodes(){
        let valueAtNodes = this.#rootValueAtGroup.getValueAtNodes();
        return valueAtNodes;
    }
    getSelectedNodes(forceRefresh = false){
        if (forceRefresh){
            this.#selectedNodeList = [];
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.valueAtNodes.forEach((valueAtNode)=>{
                    if (valueAtNode.selected){
                        this.#selectedNodeList.push(valueAtNode);
                    }
                });
            });
        }
        return this.#selectedNodeList;
    }
}





