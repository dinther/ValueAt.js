
export class ValueAtTimeLine{
    #parentDiv;
    #headerDiv;
    #containerDiv;
    #valueAtUILines = [];
    #gridDiv;
    #cursorDiv;
    #startTime;
    #timeRange;
    #endTime;
    #cursorTime = 50;
    #root;
    #selectBoxElm;
    #selectPointDown = null;
    #selectedNodeList = [];
    #zoomslider;
    #durationInput;
    #duration = 1;
    #secondsPerPixel=0;
    constructor(parent, startTime, timeRange){
        this.#parentDiv = parent;
        this.#parentDiv.innerHTML = 
        '<div class="valueAt-container">'+
            '<div class="valueAt-header"><label for="durationinput">Duration&nbsp</label><input id="durationinput" type="number" min="1" step="1" value="100"></input></div>'+
            '<div class="valueAt-lines valueAt-cursor-area">'+
                '<div class="valueAt-label">'+
                    '<input id="zoomslider" type="range" min="0.0001" max="1" step="0.0001"></input>'+
                '</div>'+
                '<div></div>'+
                '<div style="height: 100%;"><div id="scale"></div><div id="cursor"><div id="cursorlabel">5.23</div></div></div>'+
            '</div>'+
            '<div class="valueAt-graph-area valueAt-scroll-bar">'+
                '<div id="lineitems" class="valueAt-lines">'+
                    '<div class="valueAt-v-size"></div>'+
                '</div>'+
            '</div>'+
            '<div class="valueAt-lines valueAt-scrollbar-area">'+                
                '<div>beatline</div>'+
                '<div></div>'+
                '<div id="scrollbar"><div id="scrollcontent"></div></div>'+
            '</div>'+
        '</div>';
        this.#containerDiv = this.#parentDiv.querySelector('.valueAt-container');
        this.#containerDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueNodes();
            }
        });
        this.#cursorDiv = this.#containerDiv.querySelector('#cursor');
        this.#gridDiv = this.#containerDiv.querySelector('#lineitems');
        this.#durationInput = this.#containerDiv.querySelector('#durationinput');
        this.#durationInput.addEventListener('input', (e)=>{
            this.#duration = parseFloat(this.#durationInput.value);
        });
        this.#headerDiv = this.#containerDiv.querySelector('.valueAt-header');
        this.#selectBoxElm = document.createElement('div');
        this.#selectBoxElm.style.display = 'none';
        this.#selectBoxElm.className = 'valueAt-select-box';
        document.body.appendChild(this.#selectBoxElm);
        this.#root = document.querySelector(':root');
        this.#startTime = startTime;
        this.#timeRange = timeRange;
        this.#endTime = this.#startTime + this.#timeRange;
        this.#updateSecondsPerPixel();
        this.#zoomslider = this.#containerDiv.querySelector('#zoomslider');
        this.#zoomslider.addEventListener('input', (e)=>{
            this.setView(this.#startTime, 200 * this.#zoomslider.value);
        });
        this.#zoomslider.addEventListener('pointerdown', (e)=>{
            e.stopPropagation();
        });
        this.#zoomslider.addEventListener('pointermove', (e)=>{ 
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
            if ( e.button == 0 ){
                this.#selectPointDown = {x: e.pageX, y: e.pageY};
                console.log('down');
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if ( this.#selectPointDown != null){
                console.log(e.pageX, e.pageY);
                this.#selectBoxElm.style.display = '';
                this.#selectBoxElm.style.left = Math.min(this.#selectPointDown.x, e.pageX) + 'px';
                this.#selectBoxElm.style.top = Math.min(this.#selectPointDown.y, e.pageY) + 'px';      
                this.#selectBoxElm.style.width = Math.abs(e.pageX - this.#selectPointDown.x) + 'px';
                this.#selectBoxElm.style.height = Math.abs(e.pageY -this.#selectPointDown.y) + 'px';
            }
        });
        document.addEventListener('pointerup', (e)=>{
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
        });   
        window.addEventListener('resize', (e)=>{
            this.#updateSecondsPerPixel();
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
    #updateSecondsPerPixel(){
        this.#secondsPerPixel = this.#timeRange / this.#cursorDiv.parentElement.offsetWidth;
    }
    #updateCursor(){
        let x = (this.#cursorTime - this.#startTime) / this.#secondsPerPixel;
        this.#cursorDiv.style.left = this.#cursorDiv.parentElement.offsetLeft + x + 'px';
        if (this.#cursorTime < this.#startTime || this.#cursorTime > this.#endTime){
            this.#cursorDiv.style.display = 'none';
        } else {
            this.#cursorDiv.style.display = '';
        }
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
    setView(startTime, timeRange ){
        timeRange = Math.abs(timeRange);
        if (startTime != this.#startTime || timeRange != this.#timeRange){
            this.#startTime = startTime;
            this.#timeRange = timeRange;
            this.#endTime = this.#startTime + this.#timeRange;
            this.#updateSecondsPerPixel();
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
    get gridDiv(){
        return this.#gridDiv;
    }
    get headerDiv(){
        return this.#headerDiv;
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
        this.#labelDiv = document.createElement('div');
        this.#labelDiv.id = this.#valueAt.name + '_lbl'; 
        this.#labelDiv.className = 'valueAt-label';
        this.#labelSpan = document.createElement('span');
        this.#labelSpan.innerText = this.#labelName;
        this.#labelDiv.appendChild(this.#labelSpan);
        this.#timeLine.gridDiv.appendChild(this.#labelDiv);
    
        this.#lineDiv = document.createElement('div');
        this.#lineDiv.id = this.#valueAt.name + '_graph'; 
        this.#lineDiv.className = 'valueAt-line';
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
       
        this.#timeLine.gridDiv.appendChild(this.#lineDiv);
       
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
