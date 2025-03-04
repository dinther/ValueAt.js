import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtGroup} from "./valueAtGroup.js";
import {ValueAtLine} from "./valueAtLine.js";
import * as Easings from "./easings.js";

//['linear','stepped','easeInSine','easeOutSine','easeInOutSine','easeInQuad','easeOutQuad','easeInOutQuad','easeInCubic','easeOutCubic','easeInOutCubic','easeInQuart','easeOutQuart','easeInOutQuart','easeInQuint','easeOutQuint','easeInOutQuint','easeInExpo','easeOutExpo','easeInOutExpo','easeInCirc','easeOutCirc','easeInOutCirc','easeInBack','easeOutBack','easeInOutBack','easeInElastic','easeOutElastic','easeInOutElastic','easeOutBounce','easeInBounce','easeInOutBounce'];
const EasingMap = new Map;
EasingMap.set('linear', Easings.linear)
EasingMap.set('stepped', Easings.stepped)
EasingMap.set('sineCycle', Easings.sineCycle)
EasingMap.set('easeInSine', Easings.easeInSine);
EasingMap.set('easeOutSine', Easings.easeOutSine);
EasingMap.set('easeInOutSine', Easings.easeOutSine);
EasingMap.set('easeInQuad', Easings.easeInQuad);
EasingMap.set('easeOutQuad', Easings.easeOutQuad);
EasingMap.set('easeInOutQuad', Easings.easeInOutQuad);
EasingMap.set('easeInCubic',Easings.easeInCubic);
EasingMap.set('easeOutCubic', Easings.easeOutCubic);
EasingMap.set('easeInOutCubic', Easings.easeOutCubic);
EasingMap.set('easeInQuart', Easings.easeInQuart);
EasingMap.set('easeOutQuart', Easings.easeOutQuart);
EasingMap.set('easeInOutQuart', Easings.easeInOutQuart);
EasingMap.set('easeInQuint', Easings.easeInQuint);
EasingMap.set('easeOutQuint', Easings.easeOutQuint);
EasingMap.set('easeInOutQuint', Easings.easeInOutQuint);
EasingMap.set('easeInExpo', Easings.easeInExpo);
EasingMap.set('easeOutExpo', Easings.easeOutExpo);
EasingMap.set('easeInOutExpo', Easings.easeInOutExpo);
EasingMap.set('easeInCirc', Easings.easeInCirc);
EasingMap.set('easeOutCirc', Easings.easeOutCirc);
EasingMap.set('easeInOutCirc', Easings.easeInOutCirc);
EasingMap.set('easeInBack', Easings.easeInBack);
EasingMap.set('easeOutBack', Easings.easeOutBack);
EasingMap.set('easeInOutBack', Easings.easeInOutBack);
EasingMap.set('easeInElastic', Easings.easeInElastic);
EasingMap.set('easeOutElastic', Easings.easeOutElastic);
EasingMap.set('easeInOutElastic', Easings.easeInOutElastic);
EasingMap.set('easeOutBounce', Easings.easeOutBounce);
EasingMap.set('easeInBounce', Easings.easeInBounce);
EasingMap.set('easeInOutBounce', Easings.easeInOutBounce);

const EasingNames = Array.from(EasingMap.keys());

export class ValueAtTimeLine{

    #parentDiv;
    #containerDiv;
    #containerRect;
    #headerDiv;
    #scrollContainerDiv;
    #infoScaleDiv;
    #infoDiv;
    #infoKeyFrameDiv;
    #scaleDiv;
    #cursorDragBoxDiv;
    #cursorDragBoxRect;
    #lineWrapDiv;
    #scrollRemainderDiv;
    #scrollbarDiv;
    #scrollbarRect;
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
    #zoomFactor = 1;
    #onZoom;
    #cursorDiv;
    #cursorLabel;
    #cursorPreviousNodeBtn;
    #cursorLabelText;
    #cursorNextNodeBtn;

    #keyFrameObjectNameDiv;
    #lineIconsDiv;

    #keyFramePropertyNameDiv;
    #keyFrameValueInput;
    #keyFrameTimeInput;
    #keyFrameEasingSelect;
    #p1Div;
    #keyFrameP1Input;
    #p2Div;
    #keyFrameP2Input;

    #valueAtDiv;

    #dataRangeStart;
    #dataRangeEnd;
    #dataRange;

    #viewStart;
    #viewEnd;
    #viewRange;

    #cursorTime = 0;
    #root;
    
    #boxSelectStartPoint = null;
    #valueAtNodeDragStartPoint = null;
    #rootValueAtGroup;
    #selectedNodeList = [];
    
    #scrollbarContentDiv;
    #pixelsPerSegment = 2;
    #labelWidth = null;
    #scrollbarWidth = null;
    #timeUnitsPerPixel;
    #pixelsPerTimeUnit;
    #timePerScrollPixel;
    #cursorDragging = false;
    #scrollBarDragoffset = null;
    #suppressedNodesSelectedList = [];
    #suppressedNodesDeSelectedList = [];
    #infoValueAtNode = null;
    onTime = null;
    constructor(parent, dataRangeStart, dataRangeEnd, pixelsPerSegment=2){
        this.#parentDiv = parent;
        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});  //  attach the whole branch to parent at the end

        //  build stickyheader
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#containerDiv);

        //  build wave display and scale container
        //this.scaleWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-scale-wrapper'}, this.#containerDiv);
        this.#infoScaleDiv = VA_Utils.createEl('div', {className: 'valueAt-info-scale'}, this.#containerDiv);
        this.#infoDiv = VA_Utils.createEl('div', {className: 'valueAt-info'}, this.#infoScaleDiv);
        this.#infoKeyFrameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-keyframe'});
        this.#infoKeyFrameDiv.style.display = 'none';
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, this.#infoScaleDiv);
        this.#cursorDragBoxDiv = VA_Utils.createEl('div', {className: 'valueAt-cursor-dragbox'}, this.#scaleDiv);
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor', className: 'valueAt-cursor'}, this.#containerDiv);
        let span = VA_Utils.createEl('span', {}, this.#cursorDiv);

        this.#cursorLabel = VA_Utils.createEl('div', {className: 'valueAt-cursor-label'}, this.#cursorDiv);
        this.#cursorLabelText = VA_Utils.createEl('div', {innerText: '0', className: 'valueAt-cursor-text'}, this.#cursorLabel);

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
        this.#dataRangeStartGroupDiv.style.display='none';
        this.#dataRangeStartLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'dataRangeStartInput', innerText: 'Start time'}, this.#dataRangeStartGroupDiv);
        this.#dataRangeStartInput = VA_Utils.createEl('input', {id: 'dataRangeStartInput', type: 'number', step: '1', value: dataRangeStart.toFixed(0)}, this.#dataRangeStartGroupDiv);

        this.#dataRangeEndGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#dataRangeEndLabel = VA_Utils.createEl('label', {className: 'valueAt-drop-blurb', for: 'dataRangeEndInput', innerText: 'Duration'}, this.#dataRangeEndGroupDiv);
        this.#dataRangeEndInput = VA_Utils.createEl('input', {id: 'dataRangeEndInput', type: 'number', step: '1', value: dataRangeEnd.toFixed(0)}, this.#dataRangeEndGroupDiv);

        this.#zoomGroupDiv = VA_Utils.createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#zoomLabel = VA_Utils.createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0', max:'0.999', step: '0.001', value: '0'}, this.#zoomGroupDiv);

        this.#cursorPreviousNodeBtn = VA_Utils.createEl('div', {innerText: '⏴', className: 'valueAt-cursor-button-left', title: 'Cursor to previous keyframe'}, this.#headerDiv);
        this.#cursorNextNodeBtn = VA_Utils.createEl('div', {innerText: '⏵', className: 'valueAt-cursor-button-right', title: 'Cursor to next keyframe'}, this.#headerDiv);

        this.#headerDiv.appendChild(this.#infoKeyFrameDiv);


        //  ValueAtNode Info panel
        this.#keyFrameObjectNameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-name', type: 'text', value: 'object'}, this.#infoKeyFrameDiv);
        this.#keyFramePropertyNameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-prop', innerText: 'property'}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'time'}, this.#infoKeyFrameDiv);
        this.#keyFrameTimeInput = VA_Utils.createEl('input', {type: 'number', step: '1', value: dataRangeStart.toFixed(0)}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'value'}, this.#infoKeyFrameDiv);
        this.#keyFrameValueInput = VA_Utils.createEl('input', {type: 'number', step: '1', value: dataRangeStart.toFixed(0)}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'easing'}, this.#infoKeyFrameDiv);
        this.#keyFrameEasingSelect = VA_Utils.createEl('select', {}, this.#infoKeyFrameDiv);
        EasingMap.entries().forEach((easing)=>{
            VA_Utils.createEl('option', {value: easing[1], innerText: easing[0]}, this.#keyFrameEasingSelect);
        })

        this.#keyFrameEasingSelect.addEventListener('input', (e)=>{
            if (this.#infoValueAtNode != null){
                let name = EasingNames[this.#keyFrameEasingSelect.selectedIndex];
                let easing = EasingMap.get(name);
                this.#infoValueAtNode.valueKey.easing = easing;
                this.#p1Div.style.display = this.#infoValueAtNode.valueKey.hasP1? '' : 'none';
                this.#keyFrameP1Input.value = this.#infoValueAtNode.valueKey.p1;
                this.#p2Div.style.display = this.#infoValueAtNode.valueKey.hasP2? '' : 'none';
                this.#keyFrameP2Input.value = this.#infoValueAtNode.valueKey.p2;
            }
        });

        this.#p1Div = VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'P1'}, this.#infoKeyFrameDiv);
        this.#keyFrameP1Input = VA_Utils.createEl('input', {type: 'number', step: '0.05', value: 0}, this.#p1Div);
        this.#p2Div = VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'P2'}, this.#infoKeyFrameDiv);
        this.#keyFrameP2Input = VA_Utils.createEl('input', {type: 'number', step: '0.05', value: 0}, this.#p2Div);


        //  create root valueAt group
        this.#rootValueAtGroup = new ValueAtGroup(this, '', null, true);

        //  build select box
        this.#selectBoxDiv = VA_Utils.createEl('div', {className: 'valueAt-select-box', style: 'display: none'}, this.#containerDiv);

        this.#parentDiv.appendChild(this.#containerDiv);

        this.#pixelsPerSegment = pixelsPerSegment;

        //  event handlers

        this.#scrollContainerDiv.addEventListener('pointerdown', (e)=>{
            if (e.offsetX > this.#labelWidth && !e.ctrlKey && !e.shiftKey){
                this.deselectAllValueAtNodes();
            }
        });

        this.#scrollContainerDiv.addEventListener('scroll', (e)=>{
            this.update();
        });

        this.#scrollContainerDiv.addEventListener('pointerdown', (e)=>{
            if (e.button==0){

            }
            this.update();
        });

        this.#scrollContainerDiv.addEventListener('wheel', (e)=>{
            this.#handleWheel(e);
            if (e.ctrlKey && e.offsetX > this.#labelWidth){
                let x = (e.offsetX - this.#labelWidth) / this.#cursorDragBoxDiv.offsetWidth;
                let target = this.#viewStart + (x * this.viewRange);
                let zoomFactor = this.#zoomFactor;
                zoomFactor += (e.deltaY * 0.01) * 0.1;
                this.zoom(zoomFactor, target);
                e.preventDefault();
                e.stopPropagation();
            }
        });

        this.#cursorDiv.addEventListener('pointerdown', (e)=>{
            this.#cursorDragging = true;
        });

        this.#cursorPreviousNodeBtn.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });

        this.#cursorPreviousNodeBtn.addEventListener('pointerup', (e)=>{
            this.#handleCursorToPreviousKeyFrame(e);
        });

        this.#cursorNextNodeBtn.addEventListener('pointerupdown', (e)=>{
            e.stopPropagation();
        });

        this.#cursorNextNodeBtn.addEventListener('pointerup', (e)=>{
            this.#handleCursorToNextKeyFrame(e);
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
            this.#handleZoomSlider(e);
        });
        this.#zoomSlider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#zoomSlider.addEventListener('pointermove', (e)=>{ 
            e.stopPropagation();
        });

        this.#keyFrameTimeInput.addEventListener('input', (e)=>{
            if (this.#infoValueAtNode){
                this.#infoValueAtNode.valueKey.time = parseFloat(this.#keyFrameTimeInput.value);
            }
        });

        this.#keyFrameValueInput.addEventListener('input', (e)=>{
            if (this.#infoValueAtNode){
                this.#infoValueAtNode.valueKey.value = parseFloat(this.#keyFrameValueInput.value);
            }
        });

        this.#keyFrameP1Input.addEventListener('input', (e)=>{
            if (this.#infoValueAtNode && this.#infoValueAtNode.valueKey.easing != null){
                this.#infoValueAtNode.valueKey.p1 = parseFloat(this.#keyFrameP1Input.value);
            }
        });

        this.#keyFrameP2Input.addEventListener('input', (e)=>{
            if (this.#infoValueAtNode && this.#infoValueAtNode.valueKey.easing != null){
                this.#infoValueAtNode.valueKey.value.p2 = parseFloat(this.#keyFrameP2Input.value);
            }
        });        

        this.#scrollbarContentDiv.addEventListener('pointerdown', (e)=>{
            if (e.button == 0){
                this.#scrollBarDragoffset = e.offsetX;
            }
            //this.setView(this.#dataRangeStart + (this.#scrollbarDiv.scrollLeft / this.#scrollbarDiv.scrollWidth * this.#dataRange), this.#viewRange);
        });

        this.#cursorDragBoxDiv.addEventListener('pointerdown', (e)=>{
            let f = (e.pageX - this.#cursorDragBoxRect.left) / this.#cursorDragBoxRect.width;
            this.setTime(this.#viewStart + this.#viewRange * f);
            this.#cursorDragging = true;
            e.stopPropagation();
        });

        document.addEventListener('keydown', (e)=>{
            this.#handleNodeCursor(e);
        });
        document.addEventListener('keyup', (e)=>{
            this.#handleNodeCursor(e);
            if (e.key == 'Delete' & e.ctrlKey){ //  delete selected nodes
                let linesToUpdate =[];
                this.#selectedNodeList.forEach((valueAtNode)=>{
                    //  delete valueKey from valueAt
                    valueAtNode.valueAtLine.valueAt.deleteValueKey(valueAtNode.valueKey);
                    if (linesToUpdate.indexOf(valueAtNode.valueAtLine) == -1){
                        linesToUpdate.push(valueAtNode.valueAtLine);
                    }
                    valueAtNode.removeFromDOM();
                });
                linesToUpdate.forEach((valueAtLine)=>{
                    valueAtLine.valueAt.update();
                    valueAtLine.update();
                });
            }
        });
        document.addEventListener('pointerdown', (e)=>{
            if ( e.button == 0 ){
                if ((e.ctrlKey || e.shiftKey)){
                    this.#boxSelectStartPoint = {left: e.pageX - this.#containerRect.left, top: e.pageY - this.#containerRect.top};
                }
                if (e.target.classList.contains('valueAt-node')){
                    this.#valueAtNodeDragStartPoint = {left: e.pageX, top: e.pageY};

                    console.log('nodedrag', this.#valueAtNodeDragStartPoint);
                    e.stopPropagation();
                }
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if (e.buttons == 1 ){
                if (this.#valueAtNodeDragStartPoint==null && this.#boxSelectStartPoint != null && (e.ctrlKey || e.shiftKey)){
                    let x = Math.min(this.#boxSelectStartPoint.left, this.#boxSelectStartPoint.left, e.pageX - this.#containerRect.left);
                    let y = Math.min(this.#boxSelectStartPoint.top, this.#boxSelectStartPoint.top, e.pageY - this.#containerRect.top);
                    this.#selectBoxDiv.style.display = '';
                    this.#selectBoxDiv.style.left = x + 'px';
                    this.#selectBoxDiv.style.top = y + 'px';      
                    this.#selectBoxDiv.style.width = Math.abs(e.pageX - this.#containerRect.left - this.#boxSelectStartPoint.left) + 'px';
                    this.#selectBoxDiv.style.height = Math.abs(e.pageY - this.#containerRect.top - this.#boxSelectStartPoint.top) + 'px';
                    console.log('select', this.#selectBoxDiv.offsetWidth);
                } else {
                    this.#handleValueAtNodeDrag(e);
                    this.#handleCursorDrag(e);
                    this.#handleScrollBar(e);
                }
            }
        });
        document.addEventListener('pointerup', (e)=>{
            if ( this.#boxSelectStartPoint != null &&  (e.ctrlKey || e.shiftKey)){
                let deselect = (this.#boxSelectStartPoint.left > (e.pageX - this.#containerRect.left) && this.#boxSelectStartPoint.top > (e.pageY - this.#containerRect.top))? true : false;
                let selectRect = this.#selectBoxDiv.getBoundingClientRect();
                this.#selectBoxDiv.style.display = 'none';
                this.#boxSelectStartPoint = null;  
                this.selectValueNodes(selectRect, deselect); 
            }
            this.#cursorDragging = false;
            this.#scrollBarDragoffset = null;
            this.#valueAtNodeDragStartPoint = null;
        });   
        window.addEventListener('resize', (e)=>{
            this.#handleWindowSize();
        });
    }

    init(){
        this.#handleWindowSize();
        this.setView(this.#viewStart, this.viewRange, true);
        this.setTime(this.#cursorTime);
        this.update();
    }

    selectValueNodes(DOMRect, deselect=false){
        let valueAtNodes = this.getAllValueAtNodes(false, true);
        let selectedNodes = [];
        valueAtNodes.forEach((valueAtNode)=>{
            let rect = valueAtNode.div.getBoundingClientRect();
            if (rect.left >= DOMRect.left && rect.left <= DOMRect.right && rect.top >= DOMRect.top && rect.top <= DOMRect.bottom){
                valueAtNode.selected = !deselect;
                selectedNodes.push(valueAtNode);
            }
        });
        if (deselect){
            this.removeValueAtNodesFromSelectedList(selectedNodes);
        } else {
            this.addValueAtNodesToSelectedList(selectedNodes);
        }
        return this.#selectedNodeList;
    }

    #handleNodeCursor(e){
        if (e.shiftKey && e.altKey){
            this.#root.style.setProperty('--nodecursor', 'move');
        } else if (e.shiftKey){
            this.#root.style.setProperty('--nodecursor', 'ew-resize');
        } else if (e.altKey){
            this.#root.style.setProperty('--nodecursor', 'ns-resize');
        } else {
            this.#root.style.setProperty('--nodecursor', 'pointer');
        }
    }

    #handleWheel(e){
        if (e.ctrlKey && e.offsetX > this.#labelWidth){
            let x = e.pageX - this.#cursorDragBoxRect.left;
            let target = this.#viewStart + (x * this.#timeUnitsPerPixel);
            let zoomFactor = this.#zoomFactor;
            zoomFactor += (e.deltaY * 0.01) * 0.01;
            this.zoom(zoomFactor, target);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    #handleValueAtNodeDrag(e){
        if (this.#valueAtNodeDragStartPoint!=null && this.#infoValueAtNode != null){
            if (e.shiftKey){  // sideways for time
                let distanceMoved = e.movementX;
                let f = distanceMoved / this.#cursorDragBoxRect.width;
                let timeMoved = this.#viewStart + this.#viewRange * f;
                this.#selectedNodeList.forEach((valueAtNode)=>{
                    valueAtNode.valueKey.time = VA_Utils.clamp(this.dataRangeStart, valueAtNode.valueKey.time + timeMoved, this.dataRangeEnd);
                    this.#updateInfoTime();
                });
            }
            if (e.altKey){  //  updown for value
                let rect = this.#infoValueAtNode.parentDiv.getBoundingClientRect();
                let f = (e.pageY - rect.top) / rect.height;
                let range = this.#infoValueAtNode.valueAtLine.valueAt.options.max - this.#infoValueAtNode.valueAtLine.valueAt.options.min;
                this.#infoValueAtNode.valueKey.value = range - (range * f);
                this.#updateInfoValue();
            }
            e.stopPropagation();
        }
    }

    #handleCursorDrag(e){
        if (this.#cursorDragging){
            let f = (e.pageX - this.#cursorDragBoxRect.left) / this.#cursorDragBoxRect.width;
            this.setTime(this.#viewStart + this.#viewRange * f);
            e.stopPropagation();
        }
    }

    #handleCursorToPreviousKeyFrame(e){
        if (e.button==0){
            let time = null
            let priorValueAtNode = null;
            let valueAtLines = this.getAllValueAtLines(false, true); //  only lines that are expanded from the whole tree
            valueAtLines.forEach((valueAtLine)=>{
                let valueAtNode = valueAtLine.getValueAtNodeBefore(this.#cursorTime, false);
                if (valueAtNode != null && valueAtNode != priorValueAtNode){
                    priorValueAtNode = priorValueAtNode==null? valueAtNode : (valueAtNode.valueKey.time > priorValueAtNode.valueKey.time)? valueAtNode : priorValueAtNode;
                    if (this.#infoValueAtNode != null && this.#infoValueAtNode.selected){
                        if (this.#selectedNodeList.length < 2){
                            this.deselectAllValueAtNodes();
                            priorValueAtNode.selected = true;
                        }   
                    }
                }
            });
            if (priorValueAtNode != null){
                this.setTime(priorValueAtNode.valueKey.time);
            }
        }
    }

    #handleCursorToNextKeyFrame(e){
        if (e.button==0){
            let time = null
            let nextValueAtNode = null;
            let valueAtLines = this.getAllValueAtLines(false, true); //  only lines that are expanded from the whole tree
            valueAtLines.forEach((valueAtLine)=>{
                let valueAtNode = valueAtLine.getValueAtNodeAfter(this.#cursorTime, false);
                if (valueAtNode != null && valueAtNode != nextValueAtNode){
                    nextValueAtNode = nextValueAtNode==null? valueAtNode : (valueAtNode.valueKey.time < nextValueAtNode.valueKey.time)? valueAtNode : nextValueAtNode;
                    if (this.#infoValueAtNode != null && this.#infoValueAtNode.selected){
                        if (this.#selectedNodeList.length < 2){
                            this.deselectAllValueAtNodes();
                            nextValueAtNode.selected = true;
                        }   
                    }
                }
            });
            if (nextValueAtNode != null){
                this.setTime(nextValueAtNode.valueKey.time);
            }
        }
    }

    #handleValueAtNodeSelectedChanged(){
        if (this.#selectedNodeList.length == 1){
            let valueAtNode = this.#selectedNodeList[0];
            this.#infoValueAtNode = valueAtNode;
            this.#keyFrameObjectNameDiv.innerText = valueAtNode.valueAtLine.valueAtGroup.getRootUserGroupName();
            this.#keyFramePropertyNameDiv.innerText = valueAtNode.valueAtLine.labelName + ' (' + valueAtNode.valueAtLine.valueAtNodes.indexOf(valueAtNode) + ')';
            this.#updateInfoTime();
            if (valueAtNode.valueAtLine.valueAt.options.min != null){
                this.#keyFrameValueInput.min = valueAtNode.valueAtLine.valueAt.options.min;
            }
            if (valueAtNode.valueAtLine.valueAt.options.max != null){
                this.#keyFrameValueInput.max = valueAtNode.valueAtLine.valueAt.options.max;
            }            
            this.#updateInfoValue();
            this.#keyFrameEasingSelect.selectedIndex = valueAtNode.valueKey.easing? EasingNames.indexOf(valueAtNode.valueKey.easing.name) : 0;
            this.#p1Div.style.display = valueAtNode.valueKey.hasP1? '' : 'none';
            this.#keyFrameP1Input.value = valueAtNode.valueKey.p1;
            this.#p2Div.style.display = valueAtNode.valueKey.hasP2? '' : 'none';
            this.#keyFrameP2Input.value = valueAtNode.valueKey.p2;            
        }
        this.#infoKeyFrameDiv.style.display = (this.#selectedNodeList.length != 1)? 'none' : '';
    }
    #updateInfoTime(){
            this.#keyFrameTimeInput.value = this.#infoValueAtNode.valueKey.time.toFixed(3);
    }
    
    #updateInfoValue(){
            this.#keyFrameValueInput.value = this.#infoValueAtNode.valueKey.value.toFixed(3);
    }
    #handleWindowSize(){
        this.setCSSVariable('--line-maximized-height', (this.#scrollContainerDiv.offsetHeight - 32) + 'px');
        this.#scrollbarWidth = this.#containerDiv.offsetWidth - this.#lineWrapDiv.offsetWidth;
        //  update coordinate references
        this.#containerRect = this.#containerDiv.getBoundingClientRect();
        this.#cursorDragBoxRect = this.#cursorDragBoxDiv.getBoundingClientRect(); 
        this.#scrollbarRect = this.#scrollbarDiv.getBoundingClientRect();
        this.#timePerScrollPixel = this.#cursorDragBoxRect.width / this.#dataRange;
        this.#updateTimePerPixel(this.#viewRange);
        this.update();
    }

    #handleZoomSlider(e){
        let zoomTarget = this.#viewStart;  //  left align by default
        //let zoomTarget = this.#viewStart + (this.#viewRange * 0.5);  //  center by default
        if (this.#cursorTime > this.#viewStart && this.#cursorTime < this.#viewEnd){  //  center around cursor if on-screen
            zoomTarget = this.#cursorTime;
        }
        this.zoom(1 - this.#zoomSlider.value, zoomTarget);
    }

    #updateTimePerPixel(viewRange){
        if (this.#cursorDragBoxRect !== undefined){           
            this.#timeUnitsPerPixel = viewRange / this.#cursorDragBoxRect.width;
            this.#pixelsPerTimeUnit = this.#cursorDragBoxRect.width / viewRange;
        }
    }

    #updateCursors(){
        let cursorHeight = this.#scaleDiv.offsetHeight + this.#scrollContainerDiv.offsetHeight;
        this.#cursorDiv.style.height = cursorHeight + 'px';
        if (this.#timeUnitsPerPixel === undefined || true){ this.#updateTimePerPixel(this.#viewRange) }
        let x = (this.#cursorTime - this.#viewStart) * this.#pixelsPerTimeUnit;
        this.#cursorDiv.style.display = x<0? 'none' : ''; 
        this.#cursorDiv.style.left =  'calc(var(--label-width) + ' + x + 'px)';
        this.#cursorLabelText.innerText = this.#cursorTime.toFixed(2);
    }

    #handleOnTime(){
        if (typeof this.onTime == 'function'){
            this.onTime(this.#cursorTime);
        }
    }

    #handleScrollBar(e){
        if (this.#scrollBarDragoffset != null){
            //let timePerScrollPixel = this.#dataRange / this.#scrollbarRect.width;
            let x = e.pageX - this.#scrollbarRect.left - this.#scrollBarDragoffset;
            let viewStart = x * (this.#dataRange / this.#scrollbarRect.width);
            this.setView(viewStart, this.#viewRange);
        }
    }

    setDataRange(startTime, endTime){
        this.#dataRangeStart = Math.min(startTime, endTime);
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

    update(){
        this.#updateCursors();
        this.#rootValueAtGroup.update();

        //  temp stats
        /*
        let lines = this.#rootValueAtGroup.getAllValueAtLines();
        let inViewCount = 0;
        lines.forEach((line)=>{
            inViewCount += line.inView? 1 : 0;
        });
        console.log('rendered ' + inViewCount + ' lines');
        */
    }

    addValueAtNodesToSelectedList(valueAtNodes){
        valueAtNodes.forEach((valueAtNode)=>{
            if (valueAtNode.selected){
                if (this.#selectedNodeList.indexOf(valueAtNode) == -1){
                    this.#selectedNodeList.push(valueAtNode);
                }
            }
        });
        this.#handleValueAtNodeSelectedChanged();
    }

    removeValueAtNodesFromSelectedList(valueAtNodes){
        valueAtNodes.forEach((valueAtNode)=>{
            valueAtNode.selected = false;
            this.#selectedNodeList.splice(this.#selectedNodeList.indexOf(valueAtNode),1);
        });
        this.#handleValueAtNodeSelectedChanged();
    }

    panTocursor(){
        if(this.#cursorTime < this.#viewStart || this.#cursorTime > this.#viewEnd){
            //  attempt to scroll so the cursor is at 30 of the width
            this.setView(Math.max(this.#dataRangeStart, this.#cursorTime - this.#viewRange * 0.3));
        }
    }

    setTimeAccurate(time){
        let t = VA_Utils.clamp(this.#dataRangeStart, time, this.#dataRangeEnd);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootValueAtGroup.setTimeAccurate(this.#cursorTime );
            this.#handleOnTime();
        }
    }

    setTime(time){
        let t = VA_Utils.clamp(this.#dataRangeStart, time, this.#dataRangeEnd);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootValueAtGroup.setTime(this.#cursorTime );
            this.#handleOnTime();
        }
    }

    setTimeFast(time){
        let t = VA_Utils.clamp(this.#dataRangeStart, time, this.#dataRangeEnd);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootValueAtGroup.setTimeFast(this.#cursorTime);
            this.#handleOnTime();
        }
    }

    zoom(zoomFactor, zoomTarget=null){
        if (zoomTarget == null){
            zoomTarget = this.#viewStart + (this.#viewRange * 0.5);
        }
        this.#zoomFactor = Math.max(Math.min(1, zoomFactor), 0.001);
        let viewRange = this.#dataRange * this.#zoomFactor;
        this.#updateTimePerPixel(viewRange);
        let factor = (zoomTarget - this.#viewStart) / this.#viewRange;
        let viewStart = zoomTarget - (viewRange * factor);
        this.setView(viewStart, viewRange, true);
    }
    
    setView(viewStart, viewRange=null, force = false ){
        viewRange = viewRange==null? this.#viewRange : Math.abs(viewRange);
        if (force || viewStart != this.#viewStart || viewRange != this.#viewRange){
            this.#viewStart = VA_Utils.clamp(this.#dataRangeStart, viewStart, this.#dataRangeEnd - viewRange);
            this.#viewRange = viewRange;
            this.#viewEnd = this.#viewStart + this.#viewRange; //VA_Utils.clamp(this.#dataRangeStart, this.#viewEnd, this.#dataRangeEnd);

            this.#updateTimePerPixel(this.#viewRange);

            //this.#zoomSlider.value = 1 - (this.#viewRange / this.#dataRange);
            let widthPercent = ((this.#viewRange / this.#dataRange) * 100);
            //let widthPercent = this.#zoomFactor * 100;
            this.#scrollbarContentDiv.style.width = widthPercent + '%';

            let scrollLeft = this.#viewStart / (this.#dataRange / this.#scrollbarRect.width);
            this.#scrollbarContentDiv.style.left = scrollLeft + 'px';

            if (this.#scrollbarContentDiv.offsetLeft == 0 && widthPercent==100){
                this.#scrollbarDiv.firstChild.style.display = 'none';
            } else {
                this.#scrollbarDiv.firstChild.style.display = '';
            }
            this.update();
        }
    }

    deselectAllValueAtNodes(){
        let valueAtNodes = this.getAllValueAtNodes(false,true);
        valueAtNodes.forEach((valueAtNode)=>{
            valueAtNode.selected = false;
        });
        this.#selectedNodeList = [];
        this.#handleValueAtNodeSelectedChanged();

    }

    addValueAtGroup(name, expanded=true, parentGroup=null){
        if (parentGroup==null){
            return this.#rootValueAtGroup.addValueAtGroup(name, expanded);
        } else {
            return parentGroup.addValueAtGroup(name, expanded);
        }
    }
    addValueAt(valueAt, labelName, strokeWidth, strokeColor, parentGroup=null){
        if (parentGroup==null){
            return this.#rootValueAtGroup.addValueAt(valueAt, labelName, strokeWidth, strokeColor);
        } else {
            return parentGroup.addValueAt(valueAt, labelName, strokeWidth, strokeColor);
        }
    }    
    get timeUnitsPerPixel(){
        return this.#timeUnitsPerPixel;
    }
    get pixelsPerTimeUnit(){
        return this.#pixelsPerTimeUnit;
    }
    get selectedValueAtNodes(){
        return this.#selectedNodeList;
    }
    get cursorTime(){
        return this.#cursorTime;
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

    getAllValueAtLines(checkInView = false, checkExpanded = false){  //  params are selection criteria
        let valueAtLines = this.#rootValueAtGroup.getAllValueAtLines(checkInView, checkExpanded);
        return valueAtLines;
    }
    
    getAllValueAtNodes(checkInView = false, checkExpanded = false){
        let valueAtNodes = this.#rootValueAtGroup.getAllValueAtNodes(checkInView, checkExpanded);
        return valueAtNodes;
    }
}






