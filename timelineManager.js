import * as VA_Utils from "./valueAtUtils.js";
import {ChannelGroup} from "./channelGroup.js";
import * as Easings from "./easings.js";
import * as Icons from "./appIcons.js";

//['linear','stepped','easeInSine','easeOutSine','easeInOutSine','easeInQuad','easeOutQuad','easeInOutQuad','easeInCubic','easeOutCubic','easeInOutCubic','easeInQuart','easeOutQuart','easeInOutQuart','easeInQuint','easeOutQuint','easeInOutQuint','easeInExpo','easeOutExpo','easeInOutExpo','easeInCirc','easeOutCirc','easeInOutCirc','easeInBack','easeOutBack','easeInOutBack','easeInElastic','easeOutElastic','easeInOutElastic','easeOutBounce','easeInBounce','easeInOutBounce'];
const EasingMap = new Map;
EasingMap.set('linear', Easings.linear);
EasingMap.set('stepped', Easings.stepped);
EasingMap.set('sineCycle', Easings.sineCycle);
EasingMap.set('random', Easings.random);
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
EasingMap.set('easeInBungie', Easings.easeInBungie);
EasingMap.set('easeOutBungie', Easings.easeOutBungie);
EasingMap.set('easeInOutBungie', Easings.easeInOutBungie);
EasingMap.set('easeOutBounce', Easings.easeOutBounce);
EasingMap.set('easeInBounce', Easings.easeInBounce);
EasingMap.set('easeInOutBounce', Easings.easeInOutBounce);

const EasingNames = Array.from(EasingMap.keys());

export class TimelineManager{
    #options = {duration: 1, zoomSpeed: 0.02, loop: false, scale: 1};
    #parentDiv;
    #containerDiv;
    #containerRect;
    #headerDiv;
    #scrollContainerDiv;
    #infoScaleDiv;
    #scaleInfoDiv;
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
  
    #durationGroupDiv;
    #durationLabel;
    #durationInput;

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
    #toStartBtn
    #playBtn;
    #pauseBtn;
    #toEndBtn
    #loopBtn
    #viewStart;
    #viewRange;

    #cursorTime = 0;
    #root;
    #audioChannels = [];
    #valueNodeDragStartPoint = null;
    #rootChannelGroup;
    #selectedNodeList = [];
    #scrollbarContentDiv;
    #labelWidth = null;
    #scrollbarWidth = null;
    #timeUnitsPerPixel;
    #pixelsPerTimeUnit;
    #timePerScrollPixel;
    #cursorDragging = false;
    #scrollBarDragoffset = null;
    #suppressedNodesSelectedList = [];
    #suppressedNodesDeSelectedList = [];
    #startTime;
    #stopRequest = false;
    #infoValueNode = null;
    onTime = null;
    constructor(parent, options){
        Object.assign(this.#options, options);
        this.#parentDiv = parent;
        this.#root = document.querySelector(':root');
        //  build scrolling UI container
        this.#containerDiv = VA_Utils.createEl('div', {className: 'valueAt-container'});  //  attach the whole branch to parent at the end

        //  build header
        this.#headerDiv = VA_Utils.createEl('div', {className: 'valueAt-header'}, this.#containerDiv);

        //  build wave display and scale container
        //this.scaleWrapperDiv = VA_Utils.createEl('div', {className: 'valueAt-scale-wrapper'}, this.#containerDiv);
        this.#infoScaleDiv = VA_Utils.createEl('div', {className: 'valueAt-info-scale'}, this.#containerDiv);
        this.#scaleInfoDiv = VA_Utils.createEl('div', {className: 'valueAt-info'}, this.#infoScaleDiv);

        this.#infoKeyFrameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-keyframe'});
        this.#infoKeyFrameDiv.style.display = 'none';
        this.#scaleDiv = VA_Utils.createEl('div', {className: 'valueAt-scale'}, this.#infoScaleDiv);
        this.#cursorDragBoxDiv = VA_Utils.createEl('div', {className: 'valueAt-cursor-dragbox'}, this.#scaleDiv);
        this.#cursorDiv = VA_Utils.createEl('div', {id: 'cursor', className: 'valueAt-cursor'}, this.#containerDiv);
        let span = VA_Utils.createEl('span', {}, this.#cursorDiv);

        this.#cursorLabel = VA_Utils.createEl('div', {className: 'valueAt-cursor-label'}, this.#cursorDiv);
        this.#cursorLabelText = VA_Utils.createEl('div', {innerText: '0', className: 'valueAt-cursor-text'}, this.#cursorLabel);

        this.#scrollContainerDiv = VA_Utils.createEl('div', {className: 'valueAt-scroll-container'}, this.#containerDiv);

 
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

        let durationGroupDiv = VA_Utils.createEl('div', {className: 'labeled-input'}, this.#headerDiv);
        this.#durationLabel = VA_Utils.createEl('label', {className: 'valueAt-input-label', for: 'durationInput', innerText: 'Duration'}, durationGroupDiv);
        this.#durationInput = VA_Utils.createEl('input', {id: 'durationInput', type: 'number', step: '1', value: this.#options.duration.toFixed(0)}, durationGroupDiv);

        // player buttons
        let playerButtons = VA_Utils.createEl('div', {className: 'player-buttons'}, this.#headerDiv);
       
        this.#toStartBtn = VA_Utils.createEl('button', {className: 'icon-button'}, playerButtons);
        this.#toStartBtn.innerHTML = Icons.getSVG('backToStart');
        this.#playBtn = VA_Utils.createEl('button', {className: 'icon-button'}, playerButtons);
        this.#playBtn.innerHTML = Icons.getSVG('play');
        this.#pauseBtn = VA_Utils.createEl('button', {className: 'icon-button'}, playerButtons);
        this.#pauseBtn.innerHTML = Icons.getSVG('pause');
        this.#toEndBtn = VA_Utils.createEl('button', {className: 'icon-button'}, playerButtons);
        this.#toEndBtn.innerHTML = Icons.getSVG('forwardToEnd');
        this.#loopBtn = VA_Utils.createEl('button', {className: 'icon-button selected'}, playerButtons);
        this.#loopBtn.innerHTML = Icons.getSVG('loop');

        let zoomGroupDiv = VA_Utils.createEl('div', {className: 'labeled-input'}, this.#headerDiv);
        this.#zoomLabel = VA_Utils.createEl('label', {className: 'valueAt-input-label', for: 'zoominput', innerText: 'Zoom'}, zoomGroupDiv);
        this.#zoomSlider = VA_Utils.createEl('input', {id: 'zoominput', type: 'range', min: '0', max:'0.999', step: '0.001', value: '0'}, zoomGroupDiv);

        this.#cursorPreviousNodeBtn = VA_Utils.createEl('div', {innerText: '⏴', className: 'valueAt-cursor-button-left', title: 'Cursor to previous keyframe'}, this.#headerDiv);
        this.#cursorNextNodeBtn = VA_Utils.createEl('div', {innerText: '⏵', className: 'valueAt-cursor-button-right', title: 'Cursor to next keyframe'}, this.#headerDiv);

        this.#headerDiv.appendChild(this.#infoKeyFrameDiv);


        //  ValueNode Info panel
        this.#keyFrameObjectNameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-name', type: 'text', value: 'object'}, this.#infoKeyFrameDiv);
        this.#keyFramePropertyNameDiv = VA_Utils.createEl('div', {className: 'valueAt-info-prop', innerText: 'property'}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'time'}, this.#infoKeyFrameDiv);
        this.#keyFrameTimeInput = VA_Utils.createEl('input', {type: 'number', step: '1', value: 0}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'value'}, this.#infoKeyFrameDiv);
        this.#keyFrameValueInput = VA_Utils.createEl('input', {type: 'number', step: '1', value: 0}, this.#infoKeyFrameDiv);
        VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'easing'}, this.#infoKeyFrameDiv);
        this.#keyFrameEasingSelect = VA_Utils.createEl('select', {}, this.#infoKeyFrameDiv);
        EasingMap.entries().forEach((easing)=>{
            VA_Utils.createEl('option', {value: easing[1], innerText: easing[0]}, this.#keyFrameEasingSelect);
        })

        this.#keyFrameEasingSelect.addEventListener('input', (e)=>{
            if (this.#infoValueNode != null){
                let name = EasingNames[this.#keyFrameEasingSelect.selectedIndex];
                let easing = EasingMap.get(name);
                this.#infoValueNode.valueKey.easing = easing;
                this.#p1Div.style.display = this.#infoValueNode.valueKey.hasP1? '' : 'none';
                this.#keyFrameP1Input.value = this.#infoValueNode.valueKey.p1;
                this.#p2Div.style.display = this.#infoValueNode.valueKey.hasP2? '' : 'none';
                this.#keyFrameP2Input.value = this.#infoValueNode.valueKey.p2;
            }
        });

        this.#p1Div = VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'P1'}, this.#infoKeyFrameDiv);
        this.#keyFrameP1Input = VA_Utils.createEl('input', {type: 'number', step: '0.05', value: 0}, this.#p1Div);
        this.#p2Div = VA_Utils.createEl('div', {className: 'valueAt-info-label', innerText: 'P2'}, this.#infoKeyFrameDiv);
        this.#keyFrameP2Input = VA_Utils.createEl('input', {type: 'number', step: '0.05', value: 0}, this.#p2Div);



        //  create root valueAt group
        this.#rootChannelGroup = new ChannelGroup(this, null, '', true);

        this.#parentDiv.appendChild(this.#containerDiv);

        //  event handlers

        this.#toStartBtn.addEventListener('click', (e)=>{
            this.toStart();
        });

        this.#playBtn.addEventListener('click', (e)=>{
            this.play();
        });

        this.#pauseBtn.addEventListener('click', (e)=>{
            this.pause();
        });

        this.#toEndBtn.addEventListener('click', (e)=>{
            this.toEnd();
        });


        this.#loopBtn.addEventListener('click', (e)=>{
            this.loop = !this.loop;
            loopBtn.classList.toggle('selected');
        });     

        this.#scrollContainerDiv.addEventListener('pointerdown', (e)=>{
            if (e.offsetX > this.#labelWidth && !e.ctrlKey && !e.shiftKey){
                this.deselectAllValueNodes();
            }
        });

        this.#scrollContainerDiv.addEventListener('scroll', (e)=>{
            this.update();
        });

        this.#scrollContainerDiv.addEventListener('wheel', (e)=>{
            this.#handleWheel(e);
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

        this.#durationInput.addEventListener('input', (e)=>{
            if (!isNaN(parseInt(this.#durationInput.value))){
                this.#options.duration = this.#durationInput.value;
                this.setView(this.#viewStart, this.#viewRange, true, true);
                //this.update();
            }
        });
   
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
            if (this.#infoValueNode){
                this.#infoValueNode.valueKey.time = parseFloat(this.#keyFrameTimeInput.value);
            }
        });

        this.#keyFrameValueInput.addEventListener('input', (e)=>{
            if (this.#infoValueNode){
                this.#infoValueNode.valueKey.value = parseFloat(this.#keyFrameValueInput.value);
            }
        });

        this.#keyFrameP1Input.addEventListener('input', (e)=>{
            if (this.#infoValueNode && this.#infoValueNode.valueKey.easing != null){
                this.#infoValueNode.valueKey.p1 = parseFloat(this.#keyFrameP1Input.value);
            }
        });

        this.#keyFrameP2Input.addEventListener('input', (e)=>{
            if (this.#infoValueNode && this.#infoValueNode.valueKey.easing != null){
                this.#infoValueNode.valueKey.p2 = parseFloat(this.#keyFrameP2Input.value);
            }
        });        

        this.#scrollbarContentDiv.addEventListener('pointerdown', (e)=>{
            if (e.button == 0){
                this.#scrollBarDragoffset = e.offsetX;
            }
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
                this.#selectedNodeList.forEach((valueNode)=>{
                    //  delete valueKey from valueAt
                    valueNode.valueChannel.valueAt.deleteValueKey(valueNode.valueKey);
                    if (linesToUpdate.indexOf(valueNode.valueChannel) == -1){
                        linesToUpdate.push(valueNode.valueChannel);
                    }
                    valueNode.removeFromDOM();
                });
                linesToUpdate.forEach((valueChannel)=>{
                    valueChannel.valueAt.update();
                    valueChannel.update();
                });
            }
        });
        document.addEventListener('pointerdown', (e)=>{
            if ( e.button == 0 ){
                if ((e.ctrlKey || e.shiftKey)){
                    if (e.target.classList.contains('valueAt-node')){
                        this.#valueNodeDragStartPoint = {left: e.pageX, top: e.pageY};
                        e.stopPropagation();
                    }
                }
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if (e.buttons == 1 ){
                this.#handleValueNodeDrag(e);
                this.#handleCursorDrag(e);
                this.#handleScrollBar(e);
            }
        });
        document.addEventListener('pointerup', (e)=>{
            this.#cursorDragging = false;
            this.#scrollBarDragoffset = null;
            this.#valueNodeDragStartPoint = null;
        });   
        window.addEventListener('resize', (e)=>{
            this.#handleWindowSize();
        });
        this.#handleWindowSize();
        this.#root = document.querySelector(':root');
        this.#labelWidth = parseFloat(this.getCSSVariable('--label-width').replace('px',''));
        this.setView(0, this.#options.duration);
        this.setTime(this.#cursorTime);
    }

    //init(){
        //this.#handleWindowSize();
        //this.setView(this.#viewStart, this.viewRange);//, true);
        //this.setTime(this.#cursorTime);
        //this.update();
    //}

    selectValueNodes(DOMRect, deselect=false){
        let valueNodes = this.getAllValueNodes(false, true);
        let selectedNodes = [];
        valueNodes.forEach((valueNode)=>{
            let rect = valueNode.div.getBoundingClientRect();
            if (rect.left >= DOMRect.left && rect.left <= DOMRect.right && rect.top >= DOMRect.top && rect.top <= DOMRect.bottom){
                valueNode.selected = !deselect;
                selectedNodes.push(valueNode);
            }
        });
        if (deselect){
            this.removeValueNodesFromSelectedList(selectedNodes);
        } else {
            this.addValueNodesToSelectedList(selectedNodes);
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
        if (e.ctrlKey){
            let x = e.pageX - this.#cursorDragBoxRect.left;
            if (e.clientX > this.#labelWidth){
                let f = x / this.#cursorDragBoxRect.width;
                let targetTime = this.#viewStart + (x * this.#timeUnitsPerPixel);
                let zoomFactor = this.#zoomFactor + ((e.deltaY / 120) * this.#options.zoomSpeed);
                this.zoom(zoomFactor, targetTime);
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    #handleValueNodeDrag(e){
        if (this.#valueNodeDragStartPoint!=null && this.#infoValueNode != null){
            if (e.shiftKey){  // sideways for time
                let distanceMoved = e.movementX;
                let f = distanceMoved / this.#cursorDragBoxRect.width;
                let beatsMoved = this.#viewStart + this.#viewRange * f;
                this.#selectedNodeList.forEach((valueNode)=>{
                    valueNode.valueKey.time = VA_Utils.clamp(0, valueNode.valueKey.time + beatsMoved, this.#options.duration);
                    this.#updateInfoTime();
                });
            }
            if (e.altKey){  //  updown for value
                let rect = this.#infoValueNode.parentDiv.getBoundingClientRect();
                let f = (e.pageY - rect.top) / rect.height;
                let range = this.#infoValueNode.valueChannel.valueAt.options.max - this.#infoValueNode.valueChannel.valueAt.options.min;
                this.#infoValueNode.valueKey.value = range - (range * f);
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
            let priorValueNode = null;
            let channels = this.getAllChannels('ValueChannel', false, true, false); //  only lines that are expanded from the whole tree
            channels.forEach((channel)=>{
                let valueNode = channel.getValueNodeBefore(this.#cursorTime, false);
                if (valueNode != null && valueNode != priorValueNode){
                    priorValueNode = priorValueNode==null? valueNode : (valueNode.valueKey.time > priorValueNode.valueKey.time)? valueNode : priorValueNode;
                    if (this.#infoValueNode != null && this.#infoValueNode.selected){
                        if (this.#selectedNodeList.length < 2){
                            this.deselectAllValueNodes();
                            priorValueNode.selected = true;
                        }   
                    }
                }
            });
            if (priorValueNode != null){
                this.setTime(priorValueNode.valueKey.time);
            }
        }
    }

    #handleCursorToNextKeyFrame(e){
        if (e.button==0){
            let nextValueNode = null;
            let channels = this.getAllChannels('ValueChannel', false, true, false); //  only lines that are expanded from the whole tree
            channels.forEach((channel)=>{
                let valueNode = channel.getValueNodeAfter(this.#cursorTime, false);
                if (valueNode != null && valueNode != nextValueNode){
                    nextValueNode = nextValueNode==null? valueNode : (valueNode.valueKey.time < nextValueNode.valueKey.time)? valueNode : nextValueNode;
                    if (this.#infoValueNode != null && this.#infoValueNode.selected){
                        if (this.#selectedNodeList.length < 2){
                            this.deselectAllValueNodes();
                            nextValueNode.selected = true;
                        }   
                    }
                }
            });
            if (nextValueNode != null){
                this.setTime(nextValueNode.valueKey.time);
            }
        }
    }

    #handleValueNodeSelectedChanged(){
        if (this.#selectedNodeList.length == 1){
            let valueNode = this.#selectedNodeList[0];
            this.#infoValueNode = valueNode;
            this.#keyFrameObjectNameDiv.innerText = valueNode.valueChannel.channelGroup.getRootUserGroupName();
            this.#keyFramePropertyNameDiv.innerText = valueNode.valueChannel.labelName + ' (' + valueNode.valueChannel.valueNodes.indexOf(valueNode) + ')';
            this.#updateInfoTime();
            if (valueNode.valueChannel.valueAt.options.min != null){
                this.#keyFrameValueInput.min = valueNode.valueChannel.valueAt.options.min;
            }
            if (valueNode.valueChannel.valueAt.options.max != null){
                this.#keyFrameValueInput.max = valueNode.valueChannel.valueAt.options.max;
            }            
            this.#updateInfoValue();
            this.#keyFrameEasingSelect.selectedIndex = valueNode.valueKey.easing? EasingNames.indexOf(valueNode.valueKey.easing.name) : 0;
            this.#p1Div.style.display = valueNode.valueKey.hasP1? '' : 'none';
            this.#keyFrameP1Input.value = valueNode.valueKey.p1;
            this.#p2Div.style.display = valueNode.valueKey.hasP2? '' : 'none';
            this.#keyFrameP2Input.value = valueNode.valueKey.p2;            
        }
        this.#infoKeyFrameDiv.style.display = (this.#selectedNodeList.length != 1)? 'none' : '';
    }
    #updateInfoTime(){
            this.#keyFrameTimeInput.value = this.#infoValueNode.valueKey.time.toFixed(3);
    }
    
    #updateInfoValue(){
            this.#keyFrameValueInput.value = this.#infoValueNode.valueKey.value.toFixed(3);
    }
    #handleWindowSize(){
        this.setCSSVariable('--line-maximized-height', (this.#scrollContainerDiv.offsetHeight - 32) + 'px');
        this.#scrollbarWidth = this.#containerDiv.offsetWidth - this.#lineWrapDiv.offsetWidth;
        //  update coordinate references
        this.#containerRect = this.#containerDiv.getBoundingClientRect();
        this.#cursorDragBoxRect = this.#cursorDragBoxDiv.getBoundingClientRect(); 
        this.#scrollbarRect = this.#scrollbarDiv.getBoundingClientRect();
        this.#timePerScrollPixel = this.#cursorDragBoxRect.width / this.#options.duration;
        this.#updateTimePerPixel(this.#viewRange);
        this.update();
    }

    #handleZoomSlider(e){
        let zoomTarget = this.#viewStart;  //  left align by default
        if (this.#timeInView(this.#cursorTime)){  //  center around cursor if on-screen
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
            let x = e.pageX - this.#scrollbarRect.left - this.#scrollBarDragoffset;
            let viewStart = x * (this.#options.duration / this.#scrollbarRect.width);
            this.setView(viewStart, this.#viewRange);
        }
    }
    #timeInView(time){
        return !(time < this.#viewStart || time > this.#viewStart + this.#viewRange);
    }

    #stepFrame(timestamp) {
        if (this.#startTime === undefined) {
            this.#startTime = timestamp;
        }
        const elapsed = (timestamp - this.#startTime) / 1000;
        if (this.#options.loop){
            //this.setTimeFast(((audioChannel.audio.currentTime - audioChannel.options.offset) / timePerBeat) % timeLine.duration);
            this.setTimeFast((elapsed / this.#options.scale) % timeLine.duration);
        } else {
            this.setTimeFast(elapsed / this.#options.scale);
        }
        
        if (!this.#stopRequest){
            requestAnimationFrame(this.#stepFrame.bind(this)); 
        }
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
        this.#rootChannelGroup.update();
    }

    addValueNodesToSelectedList(valueNodes){
        valueNodes.forEach((valueNode)=>{
            if (valueNode.selected){
                if (this.#selectedNodeList.indexOf(valueNode) == -1){
                    this.#selectedNodeList.push(valueNode);
                }
            }
        });
        this.#handleValueNodeSelectedChanged();
    }

    removeValueNodesFromSelectedList(valueNodes){
        valueNodes.forEach((valueNode)=>{
            valueNode.selected = false;
            this.#selectedNodeList.splice(this.#selectedNodeList.indexOf(valueNode),1);
        });
        this.#handleValueNodeSelectedChanged();
    }

    panTocursor(){
        if (!this.#timeInView(this.#cursorTime)){
            //  attempt to scroll so the cursor is at 30 of the width
            this.setView(Math.max(0, this.#cursorTime - this.#viewRange * 0.3));
        }
    }

    setTimeAccurate(time){
        let t = VA_Utils.clamp(0, time, this.#options.duration);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootChannelGroup.setTimeAccurate(this.#cursorTime );
            this.#handleOnTime();
        }
    }

    setTime(time){
        let t = VA_Utils.clamp(0, time, this.#options.duration);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootChannelGroup.setTime(this.#cursorTime );
            this.#handleOnTime();
        }
    }

    setTimeFast(time){
        let t = VA_Utils.clamp(0, time, this.#options.duration);
        if (t != this.#cursorTime){
            this.#cursorTime = t;
            this.#updateCursors();
            this.#rootChannelGroup.setTimeFast(this.#cursorTime);
            this.#handleOnTime();
        }
    }

    zoom(zoomFactor, zoomTarget=null){
        //zoomTarget = 6.001;
        if (zoomTarget == null){
            zoomTarget = this.#viewStart + (this.#viewRange * 0.5);
        }
        this.#zoomFactor = VA_Utils.clamp(0.001, zoomFactor, 1);
        let viewRange = this.#options.duration * this.#zoomFactor;
        //let x = zoomTarget * this.#pixelsPerTimeUnit;
        let factor = (zoomTarget - this.#viewStart) / this.#viewRange;
        this.#updateTimePerPixel(viewRange);
        let viewStart = zoomTarget - (viewRange * factor);
        this.setView(viewStart, viewRange, true);
    }
    
    setView(viewStart, viewRange=null, force = false ){
        viewRange = viewRange==null? this.#viewRange : Math.abs(viewRange);
        if (force || viewStart != this.#viewStart || viewRange != this.#viewRange){
            this.#viewStart = VA_Utils.clamp(0, viewStart, this.#options.duration - viewRange);
            this.#viewRange = viewRange;
            this.#updateTimePerPixel(this.#viewRange);

            this.#zoomSlider.value = 1 - this.#zoomFactor;
            let widthPercent = ((this.#viewRange / this.#options.duration) * 100);
            this.#scrollbarContentDiv.style.width = widthPercent + '%';

            let scrollLeft = this.#viewStart / (this.#options.duration / this.#scrollbarRect.width);
            this.#scrollbarContentDiv.style.left = scrollLeft + 'px';

            if (this.#scrollbarContentDiv.offsetLeft == 0 && widthPercent==100){
                this.#scrollbarDiv.firstChild.style.display = 'none';
            } else {
                this.#scrollbarDiv.firstChild.style.display = '';
            }
            this.update();
        }
    }

    deselectAllValueNodes(){
        let valueNodes = this.getAllValueNodes(false,true);
        valueNodes.forEach((valueNode)=>{
            valueNode.selected = false;
        });
        this.#selectedNodeList = [];
        this.#handleValueNodeSelectedChanged();

    }

    getAllChannels(className, checkInView = false, checkExpanded = false, checkMaximized = false){  //  params are selection criteria
        let valueChannels = this.#rootChannelGroup.getAllChannels(className, checkInView, checkExpanded, checkMaximized);
        return valueChannels;
    }
    
    getAllValueNodes(checkInView = false, checkExpanded = false){
        let valueNodes = this.#rootChannelGroup.getAllValueNodes(checkInView, checkExpanded);
        return valueNodes;
    }

    toStart(){
        this.#audioChannels.forEach((audioChannel)=>{
            //todo time check
            audioChannel.audio.currentTime = 0;
        });
        timeLine.setTime(0);
        //setWaveDisplay(this.#viewStart, this.#viewRange);
    }

    play(){
        this.#stopRequest = false;
        this.#startTime = undefined;
        this.#playBtn.classList.add('active');
        this.#audioChannels = this.getAllChannels('AudioChannel', false, true, false);
        this.#audioChannels.forEach((audioChannel)=>{
            //todo time check
            audioChannel.audio.play();
        });
        requestAnimationFrame((timeStamp)=>{this.#stepFrame(timeStamp)});
    }

    pause(){
        this.#audioChannels.forEach((audioChannel)=>{
            //todo time check
            audioChannel.audio.pause();
        });
        this.#playBtn.classList.remove('active');
        this.#stopRequest = true;
    }

    toEnd(){
        this.#stopRequest = true;
        this.#startTime = undefined;
        timeLine.setTime(timeLine.duration);
    }

    seek(time){
        //let beat = audioChannel.audio.currentTime / timePerBeat;
        let viewStart = timeLine.viewStart + Math.floor(time / timeLine.duration) * timeLine.duration;
        this.setView(viewStart, this.#viewRange);
    }
/*  ToDo event handlers
    audioObject.audioElm.addEventListener('play', (e)=>{
        playBtn.classList.add('active');
    });
    audioObject.audioElm.addEventListener('pause', (e)=>{
        playBtn.classList.remove('active');
    }); 
    audioObject.audioElm.addEventListener('seeked', (e)=>{ 
        let index = (timeLine.viewStart + Math.floor(audioObject.audioElm.currentTime / timeLine.dataRangeEnd) * timeLine.dataRangeEnd) * audioObject.waveDisplay.options.sampleRate;
        audioObject.waveDisplay.setStartIndex(index);
    });  
*/
    get timeUnitsPerPixel(){
        return this.#timeUnitsPerPixel;
    }
    get pixelsPerTimeUnit(){
        return this.#pixelsPerTimeUnit;
    }
    get selectedValueNodes(){
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
    get cursorDragBoxDiv(){
        return this.#cursorDragBoxDiv;
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
    get durationLabel(){
        return this.#durationLabel;
    }
    get scaleInfoDiv(){
        return this.#scaleInfoDiv;
    }
    get valueAtDiv(){
        return this.#valueAtDiv;
    }
    get footerDiv(){
        return this.#footerDiv;
    }   
    get duration(){
        return this.#options.duration;
    };
    get viewStart(){
        return this.#viewStart;
    }
    get viewRange(){
        return this.#viewRange;
    }
    get rootChannelGroup(){
        return this.#rootChannelGroup;
    }
    get onZoom(){
        return this.#onZoom;
    }
    set onZoom(value){
        if(typeof value === 'function'){
            this.#onZoom = value;
        }
    }
    get scale(){
        return this.#options.scale;
    }
    set scale(value){
        if(typeof value === 'function'){
            this.#options.scale = value;
        }
    }
}






