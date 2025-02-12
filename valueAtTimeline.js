
export class ValueAtTimeLine{
    #parent;
    #valueAtUILines =[];
    #grid;
    #startTime;
    #endTime;
    constructor(parent, startTime, endTime){
        this.#parent = parent;
        this.#parent.innerHTML = '<div class="valueAt-container"><div class="valueAt-header"></div><div class="valueAt-scroll-values"><div class="valueAt-lines"><div class="valueAt-v-size"></div></div></div><div class="valueAt-h-scroll"></div></div>';
        this.#grid = this.#parent.querySelector('.valueAt-container .valueAt-lines')
        this.#startTime = startTime;
        this.#endTime = endTime;
    }
    update(){
        this.#valueAtUILines.forEach((valueAtUI)=> {
            valueAtUI.update();
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
    constructor(valueAt, timeLine, labelName, strokeWidth=1, strokeColor='#fff'){
        this.#valueAt = valueAt;
        this.#timeLine = timeLine;
        this.#labelName = labelName;
        this.#strokeWidth = strokeWidth;
        this.#strokeColor = strokeColor;
        this.#createValueAtUILine();
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
        let path = 'M' + this.#timeLine.startTime + ' ' + this.#valueAt.getValueAt(this.#timeLine.startTime);
        path += 'L';
        for (let i=1; i<=steps; i++){
            let f = i/steps;
            let x =  this.#timeLine.startTime + this.#timeLine.timeRange * f;
            let y = this.#valueAt.getValueAt(x);
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
}

class ValueNode{
    #parent;
    #div;
    #valueKey;
    constructor(parent, valueKey){
        this.#parent = parent;
        this.#valueKey = valueKey;
        this.#div = document.createElement('div');
        this.#div.className = 'valueAt-node';
        this.#parent.appendChild(this.#div);
    }
    get div(){
        return this.#div;
    }
    get valueKey(){
        return this.#valueKey;
    }
}
