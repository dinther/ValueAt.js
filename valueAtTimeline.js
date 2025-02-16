import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtGroup} from "./valueAtGroup.js";
import {ValueAtLine} from "./valueAtLine.js";

export class ValueAtTimeLine{
    #parentDiv;
    #containerDiv;
    #scrollContainerDiv;

    #headerDiv;
    #durationGroupDiv;
    #durationLabel;
    #durationInput;
    #scrollGroupDiv;
    #scrollLabel;
    #scrollSlider;    

    #scaleDiv;
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
    #selectBoxDiv;
    #selectPointDown = null;
    #rootValueAtGroup;
    #valueAtLines = [];
    #selectedNodeList = [];
    #lineWrapDiv;
    #remainingDiv;
    #footerDiv;
    #scrollbarDiv;
    #scrollbarContentDiv;
    
    #duration = 1;
    #timePerPixel;
    constructor(parent, startTime, timeRange){
        this.#parentDiv = parent;

        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});
        this.#scrollContainerDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-container'}, this.#containerDiv);
        //  build stickyheader
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#scrollContainerDiv);
        let line1Div = VA_Utils.createEl('div', {className: 'valueAt-flex-hor'}, this.#headerDiv);
        this.#durationGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, line1Div);
        this.#durationLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'durationinput', innerText: 'Duration'}, this.#durationGroupDiv);
        this.#durationInput = VA_Utils.createEl('input', {id: 'durationinput', type: 'number', min: '0.001', max:'1', step: '0.001', value: '100'}, this.#durationGroupDiv);
        this.#scrollGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, line1Div);  
        this.#scrollLabel = VA_Utils.createEl('label', {for: 'scrollslider', innerText: 'Scroll'}, this.#scrollGroupDiv);
        this.#scrollSlider = VA_Utils.createEl('input', {id: 'scrollinput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#scrollGroupDiv);
        this.#zoomGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, line1Div);
        this.#zoomLabel = VA_Utils.createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#zoomGroupDiv);

        //  build sticky zoom and time scale
        let line2Div = VA_Utils.createEl('div', {className: 'valueAt-flex-hor'}, this.#headerDiv);
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, line2Div);
        //let absoluteDiv = VA_Utils.createEl('div', {style: 'position: absolute'}, this.#scaleDiv);
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor'}, this.#scaleDiv);
        this.#cursorLabel = VA_Utils.createEl('div', {id: 'cursorlabel', innerText: '5.34'}, this.#cursorDiv);

        this.#lineWrapDiv = VA_Utils.createEl('div', {className: 'valueAt-linewrap'}, this.#scrollContainerDiv);

        //  build container for valueAt lines
        this.#remainingDiv = VA_Utils.createEl('div',{className:'valueAt-remaining'}, this.#scrollContainerDiv);
        this.#footerDiv = VA_Utils.createEl('div',{className:'valueAt-footer'}, this.#remainingDiv);
        this.#scrollbarDiv = VA_Utils.createEl('div',{className:'valueAt-scrollbar'}, this.#remainingDiv);
        this.#scrollbarContentDiv = VA_Utils.createEl('div',{className:'valueAt-scroll-content'}, this.#scrollbarDiv);
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
        });
        this.#duration = this.#durationInput.value;

        this.#root = document.querySelector(':root');
        this.#startTime = startTime;
        this.#timeRange = timeRange;
        this.#endTime = this.#startTime + this.#timeRange;

        this.#zoomSlider.addEventListener('input', (e)=>{
            let timeRange = this.#duration * this.#zoomSlider.value;
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
            this.#timePerPixel = this.#timeRange / this.#scrollContainerDiv.offsetWidth;//this.#cursorDiv.parentElement.parentElement.offsetWidth;
        }
    }
    #updateCursor(){
        this.#cursorDiv.style.height = this.lineWrapDiv.offsetHeight;//parseFloat(this.getCSSVariable('--line-row-height').replace('px','')) * this.valueAtLines.length + 'px';
        if (this.#timePerPixel === undefined){ this.#updateTimePerPixel() }
        let x = (this.#cursorTime - this.#startTime) / this.#timePerPixel;
        //this.#cursorDiv.style.left = this.#cursorDiv.parentElement.offsetLeft + x + 'px';
        //this.#cursorDiv.style.left = this.#scrollContainerDiv.offsetLeft + x + 'px';

        this.#cursorDiv.style.left = (this.#cursorTime - this.#startTime) / (this.#timeRange) * 100 + '%';
        
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
        this.#updateCursor();
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





