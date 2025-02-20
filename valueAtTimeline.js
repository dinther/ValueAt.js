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
    
    #timeRangeStartGroupDiv;
    #timeRangeStartLabel;
    #timeRangeStartInput;

    #timeRangeEndGroupDiv;
    #timeRangeEndLabel;
    #timeRangeEndInput;

    #scrollGroupDiv;
    #scrollLabel;  


    #zoomGroupDiv;
    #zoomLabel;
    #zoomSlider;
    #cursorDiv;
    #cursorLabel;

    #valueAtDiv;

    #timeRangeStart;
    #timeRangeEnd;
    #timeRange;

    #viewStart;
    #viewEnd;
    #viewRange;

    #cursorTime = 0;
    #root;
    
    #selectPointDown = null;
    #rootValueAtGroup;
    #valueAtLines = [];
    #selectedNodeList = [];
    
    #scrollbarContentDiv;
    #pixelsPerSegment = 2;
    
    #duration1 = 1;
    #labelWidth = null;
    #timeUnitPerPixel;
    #pixelPerTimeUnit;
    constructor(parent, timeRangeStart, timeRangeEnd, pixelsPerSegment=2){
        this.#parentDiv = parent;
        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});

        //  build stickyheader
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#containerDiv);
 
        //  build wave display and scale container
        //this.scaleWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-scale-wrapper'}, this.#containerDiv);
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, this.#containerDiv);
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor', className: 'valueAt-cursor'}, this.#containerDiv);
        this.#cursorLabel = VA_Utils.createEl('div', {id: 'cursorlabel', innerText: '0'}, this.#cursorDiv);

        this.#scrollContainerDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-container'}, this.#containerDiv);
        //this.#stickyWrapperDiv = VA_Utils.createEl('div', {id: 'stickyWrapper'}, this.#scrollContainerDiv);

 
        //  build container to keep the data related objects together.
        this.#lineWrapDiv = VA_Utils.createEl('div', {className: 'valueAt-linewrap'}, this.#scrollContainerDiv);

        //  fills remainder of the scroll area
        this.#scrollRemainderDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-remainder'}, this.#scrollContainerDiv);

        //  build scroll bar
        this.#scrollbarDiv = VA_Utils.createEl('div',{className:'valueAt-scrollbar'}, this.#containerDiv);
        this.#scrollbarContentDiv = VA_Utils.createEl('div',{}, this.#scrollbarDiv);

        //  build remainder and footer
        this.#remainingDiv = VA_Utils.createEl('div',{className:'valueAt-remaining'}, this.#containerDiv);
        this.#footerDiv = VA_Utils.createEl('div',{className:'valueAt-footer'}, this.#containerDiv);

        this.#timeRangeStartGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#timeRangeStartLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'timeRangeStartInput', innerText: 'Start time'}, this.#timeRangeStartGroupDiv);
        this.#timeRangeStartInput = VA_Utils.createEl('input', {id: 'timeRangeStartInput', type: 'number', step: '1', value: timeRangeStart.toFixed(0)}, this.#timeRangeStartGroupDiv);

        this.#timeRangeEndGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#timeRangeEndLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'timeRangeEndInput', innerText: 'End time'}, this.#timeRangeEndGroupDiv);
        this.#timeRangeEndInput = VA_Utils.createEl('input', {id: 'timeRangeEndInput', type: 'number', step: '1', value: timeRangeEnd.toFixed(0)}, this.#timeRangeEndGroupDiv);

        this.#zoomGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#zoomLabel = VA_Utils.createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0', max:'0.999', step: '0.001', value: '0'}, this.#zoomGroupDiv);

        //  build container for valueAt lines


        //  build select box
        this.#selectBoxDiv = VA_Utils.createEl('div', {className: 'valueAt-select-box', style: 'display: none'}, this.#containerDiv);

        this.#parentDiv.appendChild(this.#containerDiv);

        this.#pixelsPerSegment = pixelsPerSegment;

        //  event handlers

        this.#containerDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueAtNodes();
            }
        });

        this.#timeRangeStartInput.addEventListener('change', (e)=>{
            this.#setTimeRange(parseFloat(this.#timeRangeStartInput.value), parseFloat(this.#timeRangeEndInput.value));
            this.setView(this.#viewStart, this.#viewRange, true, true);
            //this.update();
        });

        this.#timeRangeEndInput.addEventListener('change', (e)=>{
            this.#setTimeRange(parseFloat(this.#timeRangeStartInput.value), parseFloat(this.#timeRangeEndInput.value));
            this.setView(this.#viewStart, this.#viewRange, true, true);
            //this.update();
        });
   
        this.#root = document.querySelector(':root');
        this.#labelWidth = parseFloat(this.getCSSVariable('--label-width').replace('px',''));
        this.#viewStart = timeRangeStart;
        this.#viewEnd = timeRangeEnd;
        this.#updateTimePerPixel(this.#viewEnd - this.#viewStart);
        this.#setTimeRange(timeRangeStart, timeRangeEnd);

        this.#zoomSlider.addEventListener('input', (e)=>{
            let viewRange = this.#timeRange * (1 - this.#zoomSlider.value);
            this.#updateTimePerPixel(viewRange);
            this.#setTimeRange(parseFloat(this.#timeRangeStartInput.value), parseFloat(this.#timeRangeEndInput.value));
            this.setView(this.#viewStart, viewRange, true);
        });
        this.#zoomSlider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#zoomSlider.addEventListener('pointermove', (e)=>{ 
            e.stopPropagation();
        });

        this.#scrollbarDiv.addEventListener('scroll', (e)=>{
            this.setView(this.#timeRangeStart + (this.#scrollbarDiv.scrollLeft / this.#scrollbarDiv.scrollWidth * this.#timeRange), this.#viewRange);
        });

        this.#scrollbarDiv.addEventListener('scrollend', (e)=>{
            this.setView(this.#timeRangeStart + (this.#scrollbarDiv.scrollLeft / this.#scrollbarDiv.scrollWidth * this.#timeRange), this.#viewRange);
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
                    if (!valueAtNode.parentDiv.parentElement.classList.contains('valueAt-collapse')){
                        let rect = valueAtNode.div.getBoundingClientRect();
                        if (rect.left >= selectRect.left && rect.left <= selectRect.right && rect.top >= selectRect.top && rect.top <= selectRect.bottom){
                            valueAtNode.selected = true;
                            this.addValueAtNodeToSelectedList(valueAtNode);
                        }
                    }
                });
            }
        });   
        window.addEventListener('resize', (e)=>{
            this.#updateTimePerPixel(this.#viewRange);
            this.#updateCursor();
        });
        
        this.setView(this.#viewStart, this.viewRange);
        this.setTime(0);
    }

    #setTimeRange(startTime, endTime){
        this.#timeRangeStart = Math.min(startTime, endTime);// - this.#timeUnitPerPixel * this.#labelWidth;
        this.#timeRangeEnd = Math.max(startTime + 1, endTime);
        this.#timeRange = this.#timeRangeEnd - this.#timeRangeStart;

        //  ensure view is inside the timeRange
        this.#viewStart = VA_Utils.clamp(this.#timeRangeStart, this.#viewStart, this.#timeRangeEnd);
        this.#viewEnd = VA_Utils.clamp(this.#timeRangeStart, this.#viewEnd, this.#timeRangeEnd);
        this.#viewRange = this.#viewEnd - this.#viewStart;
    }

    getCSSVariable(name){
        let rs = getComputedStyle(this.#root);
        return rs.getPropertyValue(name);
    }

    setCSSVariable(name, value){
        this.#root.style.setProperty(name, value);
    }

    #updateTimePerPixel(viewRange){
        if (this.#lineWrapDiv.offsetWidth > 0){
            let width = this.#lineWrapDiv.offsetWidth - this.#labelWidth;
            this.#timeUnitPerPixel = viewRange / width;//this.#cursorDiv.parentElement.parentElement.offsetWidth;
            this.#pixelPerTimeUnit = width / viewRange;
        }
    }

    #updateCursor(){
        this.#cursorDiv.style.height = this.#scaleDiv.offsetHeight + this.#scrollContainerDiv.offsetHeight + 'px';
        if (this.#timeUnitPerPixel === undefined || true){ this.#updateTimePerPixel(this.#viewRange) }
        let x = ((this.#cursorTime - this.#viewStart) * this.#pixelPerTimeUnit);
        this.#cursorDiv.style.left =  'calc(var(--label-width) + ' + x + 'px)';
        this.#cursorLabel.innerText = this.#cursorTime.toFixed(2);
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

    setTime(time){
        this.#cursorTime = time;
        this.#updateCursor();
        this.#rootValueAtGroup.setTime(time);
    }

    setTimeFast(time){
        this.#cursorTime = time;
        this.#updateCursor();
        this.#rootValueAtGroup.setTimeFast(time);
    }

    setView(viewStart, viewRange=null, force = false ){
        viewRange = viewRange==null? this.#viewRange : Math.abs(viewRange);
        if (force || viewStart != this.#viewStart || viewRange != this.#viewRange){
            this.#viewStart = viewStart;
            this.#viewRange = viewRange;
            this.#viewEnd = this.#viewStart + this.#viewRange;

            this.#updateTimePerPixel(this.#viewRange);

            this.#zoomSlider.value = 1 - (this.#viewRange / this.#timeRange);
            this.#scrollbarContentDiv.style.width = (100 /  (1 - this.#zoomSlider.value)) + '%';
            
            let scrollLeft = (this.#viewStart - this.#timeRangeStart) / this.#timeRange * this.#scrollbarDiv.scrollWidth;
            if (scrollLeft != this.#scrollbarDiv.scrollLeft){
                this.#scrollbarDiv.scrollLeft = scrollLeft;
            }
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
    get scaleDiv(){
        return this.#scaleDiv;
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
    get pixelsPerSegment(){
        return this.#pixelsPerSegment;
    }
    set pixelsPerSegment(value){
        this.#pixelsPerSegment = value;
        this.update();
    }
    get timeRangeStart(){
        return this.#timeRangeStart;
    };
    get timeRangeEnd(){
        return this.#timeRangeEnd;
    };
    get timeRange(){
        return this.#timeRange;
    };
    get viewStart(){
        return this.#viewStart;
    }
    set viewStart(value){
        this.#viewStart = value;
        this.#viewRange = this.#viewEnd - this.#viewStart;
        this.update();
    }
    get viewEnd(){
        return this.#viewEnd;
    }
    set viewEnd(value){
        this.#viewEnd = value;
        this.#viewRange = this.#viewEnd - this.#viewStart;
        this.update();
    }
    get viewRange(){
        return this.#viewRange;
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





