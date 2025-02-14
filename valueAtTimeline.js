

function createEl(name, options, parent=null){
    let elm = document.createElement(name);
    for (const [key, value] of Object.entries(options)) {
        if (['for'].indexOf(key) != -1){ //  items in this list should be treated as attributes
            elm.setAttribute(key, value);
        } else {
            elm[key] = value;
        }
    }
    if (parent != null){
        parent.appendChild(elm);
    }
    return elm;
}

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
    #selectBoxElm;
    #selectPointDown = null;
    #valueAtUILines = [];
    #selectedNodeList = [];
    
    
    #duration = 1;
    #timePerPixel;
    constructor(parent, startTime, timeRange){
        this.#parentDiv = parent;

        //  build scrolling UI container
        this.#containerDiv = createEl('div', {className: 'valueAt-container'});
        this.#scrollContainerDiv = createEl('div', {className: 'valueAt-scroll-container'}, this.#containerDiv);
        //  build stickyheader
        this.#headerDiv = createEl('div', {className: 'valueAt-header'}, this.#scrollContainerDiv);
        this.#durationGroupDiv = createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#durationLabel = createEl('label', {className: 'valueAt-drop-blurb', for: 'durationinput', innerText: 'Duration'}, this.#durationGroupDiv);
        this.#durationInput = createEl('input', {id: 'durationinput', type: 'number', min: '0.001', max:'1', step: '0.001', value: '100'}, this.#durationGroupDiv);
        this.#scrollGroupDiv = createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);  
        this.#scrollLabel = createEl('label', {for: 'scrollslider', innerText: 'Scroll'}, this.#scrollGroupDiv);
        this.#scrollSlider = createEl('input', {id: 'scrollinput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#scrollGroupDiv);
        this.#zoomGroupDiv = createEl('div', {className: 'inlinelabelcontrolpair'}, this.#headerDiv);
        this.#zoomLabel = createEl('label', {for: 'zoominput', innerText: 'Zoom'}, this.#zoomGroupDiv);
        this.#zoomSlider = createEl('input', {id: 'zoominput', type: 'range', min: '0.001', max:'1', step: '0.001', value: '1'}, this.#zoomGroupDiv);

        //  build sticky zoom and time scale
        this.#scaleDiv = createEl('div', {className: 'valueAt-scale'}, this.#scrollContainerDiv);
        let absoluteDiv = createEl('div', {style: 'position: absolute'}, this.#scaleDiv);
        this.#cursorDiv = createEl('div', {id: 'cursor'}, absoluteDiv);
        this.#cursorLabel = createEl('div', {id: 'cursorlabel', innerText: '5.34'}, this.#cursorDiv);



        //  build container for valueAt lines
        //this.#valueAtDiv = createEl('div',{className:'valueAt-list'}, this.#containerDiv);

        //  build select box
        this.#selectBoxElm = createEl('div', {className: 'valueAt-select-box', style: 'display: none'}, document.body);

        this.#parentDiv.appendChild(this.#containerDiv);

        //  event handlers
        this.#containerDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueNodes();
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
            if ( e.button == 0 && e.ctrlKey){
                this.#selectPointDown = {x: e.pageX, y: e.pageY};
                console.log('down');
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if ( this.#selectPointDown != null &&  e.ctrlKey){
                this.#selectBoxElm.style.display = '';
                this.#selectBoxElm.style.left = Math.min(this.#selectPointDown.x, e.pageX) + 'px';
                this.#selectBoxElm.style.top = Math.min(this.#selectPointDown.y, e.pageY) + 'px';      
                this.#selectBoxElm.style.width = Math.abs(e.pageX - this.#selectPointDown.x) + 'px';
                this.#selectBoxElm.style.height = Math.abs(e.pageY -this.#selectPointDown.y) + 'px';
            }
        });
        document.addEventListener('pointerup', (e)=>{
            if ( this.#selectPointDown != null &&  e.ctrlKey){
                let selectRect = this.#selectBoxElm.getBoundingClientRect();
                this.#selectBoxElm.style.display = 'none';
                this.#selectPointDown = null;    
                this.#valueAtUILines.forEach((valueAtUI)=>{
                    valueAtUI.valueNodes.forEach((valueNode)=>{
                        let rect = valueNode.div.getBoundingClientRect();
                        if (rect.left >= selectRect.left && rect.left <= selectRect.right && rect.top >= selectRect.top && rect.top <= selectRect.bottom){
                            valueNode.selected = true;
                            this.addValueNodeToSelectedList(valueNode);
                        }
                    });
                });
            }
        });   
        window.addEventListener('resize', (e)=>{
            this.#updateTimePerPixel();
            this.#updateCursor();
        });    
   
    }

    #getCSSVariable(name){
        let rs = getComputedStyle(this.#root);
        return rs.getPropertyValue(name);
    }
    #setCSSVariable(name, value){
        this.#root.style.setProperty(name, value);
    }
    #updateTimePerPixel(){
        this.#timePerPixel = this.#timeRange / this.#cursorDiv.parentElement.parentElement.offsetWidth;
        console.log('this.#timePerPixel',this.#timePerPixel);
    }
    #updateCursor(){
        if (this.#timePerPixel === undefined){ this.#updateTimePerPixel() }
        let x = (this.#cursorTime - this.#startTime) / this.#timePerPixel;
        this.#cursorDiv.style.left = this.#cursorDiv.parentElement.offsetLeft + x + 'px';
        this.#cursorLabel.innerText = this.#cursorTime.toFixed(0);
    }
    update(){
        this.#updateCursor();
        this.#valueAtUILines.forEach((valueAtUI)=> {
            valueAtUI.update();
        });
    }
    addValueNodeToSelectedList(valueNode){
        if (valueNode.selected){
            if (this.#selectedNodeList.indexOf(valueNode) == -1){
                this.#selectedNodeList.push(valueNode);
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
    deselectAllValueNodes(){
        let selectedChanged = false;
        this.#selectedNodeList.forEach((valueNode)=>{
            if (valueNode.selected){selectedChanged = true}
            valueNode.selected = false;
        });
        this.#selectedNodeList = [];
        selectedChanged
    }
    addValueAt(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        this.#valueAtUILines.push(new ValueAtUI(valueAt, this, labelName, strokeWidth, strokeColor));
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
    get headerDiv(){
        return this.#headerDiv;
    }    
    get valueAtDiv(){
        return this.#valueAtDiv;
    }
    get valueAtLines(){
        return this.#valueAtUILines;
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
    get selectedNodes1(){
        let selectedNodeList = [];
        this.#valueAtUILines.forEach((valueAtUI)=>{
            valueAtUI.valueNodes.forEach((valueNode)=>{
                if (valueNode.selected){
                    selectedNodeList.push(valueNode);
                }
            });
        });
        return selectedNodeList;
    }
    getSelectedNodes(forceRefresh = false){
        if (forceRefresh){
            this.#selectedNodeList = [];
            this.#valueAtUILines.forEach((valueAtUI)=>{
                valueAtUI.valueNodes.forEach((valueNode)=>{
                    if (valueNode.selected){
                        this.#selectedNodeList.push(valueNode);
                    }
                });
            });
        }
        return this.#selectedNodeList;
    }
}

export class ValueAtUI{
    #valueAt;
    #timeLine;
    #labelName;
    #labelDiv;
    #labelSpan;
    #lineDiv;
    #backdropDiv;
    #svg;
    #path;
    #strokeColor;
    #strokeWidth;
    #valueNodes = [];
    #pointerTime = 0;
    #firstValueNodeSelected= null;
    onSelectedChanged;
    constructor(valueAt, timeLine, labelName, strokeWidth=1, strokeColor='#fff'){
        this.#valueAt = valueAt;
        this.#timeLine = timeLine;
        this.#labelName = labelName;
        this.#strokeWidth = strokeWidth;
        this.#strokeColor = strokeColor;
        this.#createValueAtUILine();
        this.#valueAt.onChange = ()=>{this.#handleOnChange()};
    }

    #handleOnChange(){
        this.update();
    }

    #createValueAtUILine(){
        this.#lineDiv = createEl('div', {id: this.#valueAt.name + '_graph', className: 'valueAt-line'});
        this.#lineDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueNodes();
            }
        });

        this.#lineDiv.addEventListener('pointermove', (e)=>{
            if (e.buttons==1){
                let f = e.offsetX/this.#lineDiv.offsetWidth;
                this.#pointerTime = this.#timeLine.startTime + (this.#timeLine.timeRange * f);
            }
        });
        this.#backdropDiv = createEl('div', {className: 'valueAt-line-back'}, this.#lineDiv);
        this.#labelDiv = createEl('div', {id: this.#valueAt.name + '_lbl', className: 'valueAt-line-label', innerText: this.#labelName}, this.#lineDiv);

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
        this.#lineDiv.appendChild(this.#svg);
       
        this.#timeLine.scrollContainerDiv.appendChild(this.#lineDiv);
       
        //  create visual nodes
        for (let i = 0; i < this.#valueAt.valueKeys.length; i++){
            let valueKey = this.#valueAt.valueKeys[i];
            let valueNode = new ValueNode(this.#lineDiv, valueKey);
            valueNode.onSelectedChanged = (valueNode, event)=>{
                let selected = valueNode.selected;
                if (event){
                    if (!event.ctrlKey && !event.shiftKey){
                        this.#timeLine.deselectAllValueNodes();
                    }
                    valueNode.selected = selected;
                    this.#timeLine.addValueNodeToSelectedList(valueNode);
                    if(valueNode.selected){
                        if (this.#firstValueNodeSelected == null){
                            this.#firstValueNodeSelected = valueNode
                        } else {
                            if (event.shiftKey){
                                //  select value nodes from firstValueNodeSelected up to valueNode
                                let startIndex = Math.min(this.#valueNodes.indexOf(this.#firstValueNodeSelected), this.#valueNodes.indexOf(valueNode));
                                let endIndex = Math.max(this.#valueNodes.indexOf(this.#firstValueNodeSelected), this.#valueNodes.indexOf(valueNode));
                                for (let i = startIndex; i <= endIndex; i++){
                                    this.#valueNodes[i].selected = true;
                                    this.#timeLine.addValueNodeToSelectedList(this.#valueNodes[i]);
                                }
                            }
                        }
                    }
                }
            }
            this.#valueNodes.push(valueNode);
        }
        this.#render();
        return {labelDiv: this.#labelDiv, lineDiv: this.#lineDiv, svg: this.#svg};
    }

    #render(){
        this.#path.setAttribute('stroke-width', this.#strokeWidth);
        this.#path.setAttribute('stroke', this.#strokeColor);
        let steps = Math.floor(this.#timeLine.parentDiv.offsetWidth * 0.5);
        let h = this.#svg.parentElement.offsetHeight;
        let w = this.#svg.parentElement.offsetWidth;
        let valueRange = this.#valueAt.maxValue - this.#valueAt.minValue;
        let path = 'M' + this.#timeLine.startTime + ' ' + this.#valueAt.getValueAtKeyframe(this.#timeLine.startTime);
        path += 'L';
        for (let i = 1; i <= steps; i++){
            let f = i / steps;
            let x =  this.#timeLine.startTime + this.#timeLine.timeRange * f;
            let y = this.#valueAt.getValueAtKeyframe(x);
            path += x + ' ' + y + ' ';
        }

        let marginHeight = this.#strokeWidth;
        //let marginHeight = this.#valueNodes[0].div.offsetHeight;

        let margin = valueRange / h * marginHeight * 2;
        let hm = margin * 0.5;

        this.#svg.setAttribute('viewBox', this.#timeLine.startTime + ' ' + (this.#valueAt.minValue-hm) + ' ' + this.#timeLine.timeRange + ' ' + (valueRange + margin));
        this.#svg.querySelector('path').setAttribute('d', path);
        this.#svg.setAttribute('preserveAspectRatio', 'none');

        let v_offset = marginHeight / h * 100;

        this.#valueNodes.forEach((valueNode)=>{
            valueNode.div.style.left = (valueNode.valueKey.time - this.#timeLine.startTime) / (this.#timeLine.timeRange) * 100 + '%';
            valueNode.div.style.bottom = ((v_offset*0.5) + (valueNode.valueKey.value - this.#valueAt.minValue) / (this.#valueAt.maxValue - this.#valueAt.minValue) * (100-v_offset)) + '%';            
        });
    }
    #handleSelectedChanged(){
        if (typeof onSelectedChanged === 'function'){
            this.onSelectedChanged(this);
        }
    }
    deselectAllValueNodes(){
        let selectedChanged = [];
        this.#valueNodes.forEach((valueNode)=>{
            if (valueNode.selected){selectedChanged.push(valueNode)}
            valueNode.selected = false;
        });
        if (selectedChanged.length > 0){
            this.#handleSelectedChanged(selectedChanged);
        }
    }
    update(){
        this.#render();
    }

    get valueAt(){
        return this.#valueAt;
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
    get valueNodes(){
        return this.#valueNodes;
    }
}

class ValueNode{
    #parent;
    #div;
    #valueKey;
    #selected = false;
    #active = false;
    onSelectedChanged;
    onActiveChanged;
    constructor(parent, valueKey){
        this.#parent = parent;
        this.#valueKey = valueKey;
        this.#div = document.createElement('div');
        this.#div.className = 'valueAt-node';
        this.#div.addEventListener('pointerenter', (e)=>{
            this.#active = true;
            this.#div.classList.add('valueAt-node-active');
            this.#handleActiveChanged(e);
            e.stopPropagation();
        });
        this.#div.addEventListener('pointerleave', (e)=>{
            this.#active = false;
            this.#div.classList.remove('valueAt-node-active');
            this.#handleActiveChanged(e);
            e.stopPropagation();
        });       
        this.#div.addEventListener('pointerdown', (e)=>{
            if (!this.#selected){
                this.#selected = true;
                this.#handleSelectedChanged(e);
            }
            e.stopPropagation();
        });   
        this.#parent.appendChild(this.#div);
    }
    #handleSelectedChanged(e=null){
        if (this.#selected){
            this.#div.classList.add('valueAt-node-selected');
        } else {
            this.#div.classList.remove('valueAt-node-selected');
        }
        if (typeof this.onSelectedChanged === 'function'){
            this.onSelectedChanged(this, e);
        }
    }
    #handleActiveChanged(e){
        if (typeof this.onActiveChanged === 'function'){
            this.onActiveChanged(this, e);
        }
    }
    get div(){
        return this.#div;
    }
    get valueKey(){
        return this.#valueKey;
    }
    get active(){
        return this.#active;
    }
    get selected(){
        return this.#selected;
    }
    set selected(value){
        if (value != this.#selected){
            this.#selected = value;
            this.#handleSelectedChanged();
        }
    }

}
