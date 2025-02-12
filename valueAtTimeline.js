
export class ValueAtTimeLine{
    #parent;
    #container;
    #valueAtUILines = [];
    #grid;
    #startTime;
    #endTime;
    #root;
    #selectBox;
    #selectPointDown = null;
    constructor(parent, startTime, endTime){
        this.#parent = parent;
        this.#parent.innerHTML = '<div class="valueAt-container"><div class="valueAt-header"></div><div class="valueAt-scroll-values"><div class="valueAt-lines"><div class="valueAt-v-size"></div></div></div><div class="valueAt-h-scroll"><div id="fake"></div></div>';
        this.#container = this.#parent.querySelector('.valueAt-container');
        this.#container.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.deselectAllValueNodes();
            }
        });
        this.#grid = this.#container.querySelector('.valueAt-lines');
        this.#selectBox = document.createElement('div');
        this.#selectBox.style.display = 'none';
        this.#selectBox.className = 'valueAt-select-box';
        document.body.appendChild(this.#selectBox);
        this.#root = document.querySelector(':root');
        this.#startTime = startTime;
        this.#endTime = endTime;
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
            }
        });
        document.addEventListener('pointermove', (e)=>{
            if ( this.#selectPointDown != null){
                this.#selectBox.style.display = '';
                this.#selectBox.style.left = Math.min(this.#selectPointDown.x, e.pageX) + 'px';
                this.#selectBox.style.top = Math.min(this.#selectPointDown.y, e.pageY) + 'px';      
                this.#selectBox.style.width = Math.abs(e.pageX - this.#selectPointDown.x) + 'px';
                this.#selectBox.style.height = Math.abs(e.pageY -this.#selectPointDown.y) + 'px';
            }
        });
        document.addEventListener('pointerup', (e)=>{
            let selectRect = this.#selectBox.getBoundingClientRect();
            this.#selectBox.style.display = 'none';
            this.#selectPointDown = null;    
            this.#valueAtUILines.forEach((valueAtUI)=>{
                valueAtUI.valueNodes.forEach((valueNode)=>{
                    let rect = valueNode.div.getBoundingClientRect();
                    if (rect.left >= selectRect.left && rect.left <= selectRect.right && rect.top >= selectRect.top && rect.top <= selectRect.bottom){
                        valueNode.selected = true;
                    }
                });
            });
        });                
    }
    #getCSSVariable(name){
        let rs = getComputedStyle(this.#root);
        return rs.getPropertyValue(name);
    }
    #setCSSVariable(name, value){
        this.#root.style.setProperty(name, value);
    }
    update(){
        this.#valueAtUILines.forEach((valueAtUI)=> {
            valueAtUI.update();
        });
    }
    deselectAllValueNodes(){
        this.selectedNodes.forEach((valueNode)=>{
            valueNode.selected = false;
        });
    }
    addValueAt(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        this.#valueAtUILines.push(new ValueAtUI(valueAt, this, labelName, strokeWidth, strokeColor));
    }
    get parent(){
        return this.#parent;
    }
    get grid(){
        return this.#grid;
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
    get selectedNodes(){
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
    #firstValueNodeSelected= null;
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
        this.#timeLine.grid.appendChild(this.#labelDiv);
    
        this.#lineDiv = document.createElement('div');
        this.#lineDiv.id = this.#valueAt.name + '_graph'; 
        this.#lineDiv.className = 'valueAt-line';
        this.#lineDiv.addEventListener('pointerdown', (e)=>{
            if (!e.ctrlKey && !e.shiftKey){
                this.#valueNodes.forEach((valueNode)=>{
                    valueNode.selected = false;
                });
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
       
        this.#timeLine.grid.appendChild(this.#lineDiv);
       
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
        let steps = Math.floor(this.#timeLine.parent.offsetWidth * 0.5);
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
            this.#selected = !this.#selected;
            this.#handleSelectedChanged(e);
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
