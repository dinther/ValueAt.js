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
    
    #dataRangeStartGroupDiv;
    #dataRangeStartLabel;
    #dataRangeStartInput;

    #dataRangeEndGroupDiv;
    #dataRangeEndLabel;
    #dataRangeEndInput;

    #scrollGroupDiv;
    #scrollLabel;  


    #zoomGroupDiv;
    #zoomLabel;
    #zoomSlider;
    #cursorDiv;
    #cursorLabel;

    #valueAtDiv;

    #dataRangeStart;
    #dataRangeEnd;
    #dataRange;

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
    
    #labelWidth = null;
    #scrollbarWidth = null;
    #timeUnitPerPixel;
    #pixelPerTimeUnit;
    #onZoom;
    constructor(parent, dataRangeStart, dataRangeEnd, pixelsPerSegment=2){
        this.#parentDiv = parent;
        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});

        //  build stickyheader
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#containerDiv);
 
        //  build wave display and scale container
        //this.scaleWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-scale-wrapper'}, this.#containerDiv);
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, this.#containerDiv);
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor', className: 'valueAt-cursor'}, this.#containerDiv);
        let span = VA_Utils.createEl('span', {}, this.#cursorDiv);
        this.#cursorLabel = VA_Utils.createEl('div', {innerText: '0'}, this.#cursorDiv);

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

        this.#dataRangeStartGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#dataRangeStartLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'dataRangeStartInput', innerText: 'Start time'}, this.#dataRangeStartGroupDiv);
        this.#dataRangeStartInput = VA_Utils.createEl('input', {id: 'dataRangeStartInput', type: 'number', step: '1', value: dataRangeStart.toFixed(0)}, this.#dataRangeStartGroupDiv);

        this.#dataRangeEndGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#dataRangeEndLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'dataRangeEndInput', innerText: 'End time'}, this.#dataRangeEndGroupDiv);
        this.#dataRangeEndInput = VA_Utils.createEl('input', {id: 'dataRangeEndInput', type: 'number', step: '1', value: dataRangeEnd.toFixed(0)}, this.#dataRangeEndGroupDiv);

        this.#zoomGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#zoomLabel = VA_Utils.createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0', max:'0.999', step: '0.001', value: '0'}, this.#zoomGroupDiv);

        //  create root valueAt group
        this.#rootValueAtGroup = new ValueAtGroup(this, '', null, true);

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

        this.#scrollContainerDiv.addEventListener('scroll', (e)=>{
            this.update();
        });

        this.#dataRangeStartInput.addEventListener('change', (e)=>{
            this.setDataRange(parseFloat(this.#dataRangeStartInput.value), parseFloat(this.#dataRangeEndInput.value));
            this.setView(this.#viewStart, this.#viewRange, true, true);
            //this.update();
        });

        this.#dataRangeEndInput.addEventListener('change', (e)=>{
            this.setDataRange(parseFloat(this.#dataRangeStartInput.value), parseFloat(this.#dataRangeEndInput.value));
            this.setView(this.#viewStart, this.#viewRange, true, true);
            //this.update();
        });
   
        this.#root = document.querySelector(':root');
        this.#labelWidth = parseFloat(this.getCSSVariable('--label-width').replace('px',''));
        this.#viewStart = dataRangeStart;
        this.#viewEnd = dataRangeEnd;
        this.#updateTimePerPixel(this.#viewEnd - this.#viewStart);
        this.setDataRange(dataRangeStart, dataRangeEnd);

        this.#zoomSlider.addEventListener('input', (e)=>{
            //this.zoom(this.#zoomSlider.value);
            let viewRange = this.#dataRange * (1 - this.#zoomSlider.value);
            this.#updateTimePerPixel(viewRange);
            //this.setDataRange(parseFloat(this.#dataRangeStartInput.value), parseFloat(this.#dataRangeEndInput.value));
            this.setView(this.#viewStart, viewRange, true);
        });
        this.#zoomSlider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#zoomSlider.addEventListener('pointermove', (e)=>{ 
            e.stopPropagation();
        });

        this.#scrollbarDiv.addEventListener('scroll', (e)=>{
            this.setView(this.#dataRangeStart + (this.#scrollbarDiv.scrollLeft / this.#scrollbarDiv.scrollWidth * this.#dataRange), this.#viewRange);
        });

        this.#scrollbarDiv.addEventListener('scrollend', (e)=>{
            this.setView(this.#dataRangeStart + (this.#scrollbarDiv.scrollLeft / this.#scrollbarDiv.scrollWidth * this.#dataRange), this.#viewRange);
        });



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
            this.#handleWindowSize();
        });
        this.#handleWindowSize();
        this.setView(this.#viewStart, this.viewRange);
        this.setTime(0);
    }
    zoom(value){
        let viewRange = this.#dataRange * (1 - value);
        this.#updateTimePerPixel(viewRange);
        //this.setDataRange(parseFloat(this.#dataRangeStartInput.value), parseFloat(this.#dataRangeEndInput.value));
        this.setView(this.#viewStart, viewRange, true);
    }
    #handleWindowSize(){
        this.setCSSVariable('--line-maximized-height', (this.#scrollContainerDiv.offsetHeight - 32) + 'px');
        this.#scrollbarWidth = this.#containerDiv.offsetWidth - this.#lineWrapDiv.offsetWidth;
        this.#updateTimePerPixel(this.#viewRange);
        this.#updateCursors();
    }

    setDataRange(startTime, endTime){
        this.#dataRangeStart = Math.min(startTime, endTime);// - this.#timeUnitPerPixel * this.#labelWidth;
        this.#dataRangeEnd = Math.max(startTime + 1, endTime);
        this.#dataRange = this.#dataRangeEnd - this.#dataRangeStart;

        this.#dataRangeStartInput.value = this.#dataRangeStart;
        this.#dataRangeEndInput.value = this.#dataRangeEnd;

        //  ensure view is inside the dataRange
        this.#viewStart = VA_Utils.clamp(this.#dataRangeStart, this.#viewStart, this.#dataRangeEnd);
        this.#viewEnd = VA_Utils.clamp(this.#dataRangeStart, this.#viewEnd, this.#dataRangeEnd);
        this.#viewRange = this.#viewEnd - this.#viewStart;
        this.update();
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

    #updateCursors(){
        let cursorHeight = this.#scaleDiv.offsetHeight + this.#scrollContainerDiv.offsetHeight;
        this.#cursorDiv.style.height = cursorHeight + 'px';
        if (this.#timeUnitPerPixel === undefined || true){ this.#updateTimePerPixel(this.#viewRange) }
        let x = (this.#cursorTime - this.#viewStart) * this.#pixelPerTimeUnit;
        this.#cursorDiv.style.display = x<0? 'none' : ''; 
        this.#cursorDiv.style.left =  'calc(var(--label-width) + ' + x + 'px)';
        this.#cursorLabel.innerText = this.#cursorTime.toFixed(2);
    }

    update(){
        this.#updateCursors();
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
        this.#updateCursors();
        this.#rootValueAtGroup.setTime(time);
    }

    setTimeFast(time){
        this.#cursorTime = time;
        this.#updateCursors();
        this.#rootValueAtGroup.setTimeFast(time);
    }

    setView(viewStart, viewRange=null, force = false ){
        viewRange = viewRange==null? this.#viewRange : Math.abs(viewRange);
        if (force || viewStart != this.#viewStart || viewRange != this.#viewRange){
            this.#viewStart = viewStart;
            this.#viewRange = viewRange;
            this.#viewEnd = this.#viewStart + this.#viewRange;

            this.#updateTimePerPixel(this.#viewRange);

            this.#zoomSlider.value = 1 - (this.#viewRange / this.#dataRange);
            this.#scrollbarContentDiv.style.width = (100 /  (1 - this.#zoomSlider.value)) + '%';
            
            let scrollLeft = (this.#viewStart - this.#dataRangeStart) / this.#dataRange * this.#scrollbarDiv.scrollWidth;
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
    get maximizeHeight(){
        return this.#cursorDiv.offsetHeight;
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
    get dataRangeStart(){
        return this.#dataRangeStart;
    };
    get dataRangeEnd(){
        return this.#dataRangeEnd;
    };
    get dataRange(){
        return this.#dataRange;
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
    get onZoom(){
        return this.#onZoom;
    }
    set onZoom(value){
        if(typeof value === 'function'){
            this.#onZoom = value;
        }
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





