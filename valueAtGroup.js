import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtLine} from "./valueAtLine.js";

export class ValueAtGroup{
    #timeLine;
    #name;
    #groupDiv;
    #labelDiv;
    #labelSpanDiv;
    #expandDiv;
    #indent = 0;
    #parentValueAtGroup;
    #expanded;
    #valueAtGroups = [];
    #valueAtLines = [];
    #onChanged;
    constructor(timeLine, name, parentValueGroup, expanded=true){
        this.#timeLine = timeLine;
        this.#name = name;
        this.#parentValueAtGroup = parentValueGroup;
        let parentDiv = this.#timeLine.lineWrapDiv;
        if (this.#parentValueAtGroup != null){
            this.#indent = this.#parentValueAtGroup.indent + 25;
            parentDiv = this.#parentValueAtGroup.expandDiv;
        }
        this.#expanded = expanded;
        this.#groupDiv = VA_Utils.createEl('div', {id: this.#name + '_group', className: 'valueAt-group'}, parentDiv);
        this.#labelDiv = null;
        if (this.#parentValueAtGroup != null){
            this.#labelDiv = VA_Utils.createEl('div', {className: 'valueAt-group-label valueAt-background'}, this.#groupDiv);
            this.#labelSpanDiv = VA_Utils.createEl('span', {className: 'valueAt-group-label-span'}, this.#labelDiv);
            this.#labelSpanDiv.innerText = this.#name;
            this.#labelSpanDiv.classList.add('caret');
            this.#labelSpanDiv.style.paddingLeft = this.#parentValueAtGroup.indent + 'px';
            this.#labelSpanDiv.addEventListener('pointerdown', (e)=>{
                this.expanded = !this.expanded;
                if (this.#expanded) this.#expandDiv.classList.remove('valueAt-expand-collapse');
            });
            this.#updateCaret();
        }
        this.expanded = expanded;
        this.#expandDiv = VA_Utils.createEl('div', {className: 'valueAt-expand'}, this.#groupDiv);
/*
        if (this.#expanded == false){
            this.collapseGroup();
        } 
         
        if (this.#parentValueAtGroup != null){
            this.collapseGroup();
        }
  */      
    }
    #handleChanged(valueAtUI){
        if (typeof this.#onChanged === 'function'){
            this.onSelectedChanged(this, valueAtUI);
        }
    }
    collapse(){
        /*
        this.#valueAtLines.forEach((valueAtLine)=>{
            valueAtLine.labelDiv.style.display = 'none'
            valueAtLine.lineDiv.classList.add('valueAt-line-collapse')
        });
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.collapseGroup();
        });
        */
        //this.#labelDiv.style.display = 'none';
        this.#expandDiv.querySelectorAll('.valueAt-line-label').forEach(node=>{ node.style.display = 'none'});
        this.#expandDiv.querySelectorAll('.valueAt-group-label').forEach(node=>{ node.style.display = 'none'});
        this.#expandDiv.querySelectorAll('.valueAt-line').forEach(node=>{ node.classList.add('valueAt-line-collapse')});
        this.#expandDiv.classList.add('valueAt-expand-collapse');
    }
    expand(){
        this.#labelDiv.style.display = '';
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            if (this.#expanded) valueAtGroup.expand();
        });
        this.#valueAtLines.forEach((valueAtLine)=>{
            if (this.#expanded){
                valueAtLine.labelDiv.style.display = '';
                valueAtLine.lineDiv.classList.remove('valueAt-line-collapse');
                this.#expandDiv.classList.remove('valueAt-expand-collapse');
            }
        });
    }
    #updateCaret(){
        if (this.#labelSpanDiv != null){
            if (this.#expanded) this.#labelSpanDiv.classList.add('caret-down');
            else this.#labelSpanDiv.classList.remove('caret-down');
        }
    }
    update(){
        this.#valueAtLines.forEach((valueAtLine)=>{
            valueAtLine.update();
        });
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.update();
        });
    }
    addNewValueAtGroup(name, expanded=true){
        let valueAtGroup = new ValueAtGroup(this.#timeLine, name, this, expanded);
        this.#valueAtGroups.push(valueAtGroup);
        //if (this.#expanded == false){
        //    this.#collapse();
        //}
        return valueAtGroup;
    }    
    addValueAt(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        let valueAtLine = new ValueAtLine(valueAt, this.#timeLine, this, labelName, strokeWidth, strokeColor);
        this.#valueAtLines.push(valueAtLine);
        this.#handleChanged(valueAtLine);
        if (this.#expanded == false){
            this.collapse();
        }
        //this.#updateCursor();
    }
    getValueAtNodes(){
        let valueAtNodes = [];
        this.#valueAtLines.forEach((valueAtLine)=>{
            valueAtNodes = valueAtNodes.concat(valueAtLine.valueAtNodes);
        });
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtNodes = valueAtNodes.concat(valueAtGroup.getValueAtNodes());
        });
        return valueAtNodes;
    }

    get expanded(){
        return this.#expanded;
    }
    set expanded(value){
        if (value != this.#expanded){
            if (value==true){
                this.#expanded = value;
                //this.#expandDiv.style.display = '';
                this.expand();
            } else {
                this.#expanded = value;
                //this.#expandDiv.style.display = 'none';
                this.collapse();
            }
            this.#expanded = value;
            this.#updateCaret();
            this.update();
        }
    }

    get indent(){
        return this.#indent;
    }

    get expandDiv(){
        return this.#expandDiv;
    }
    get labelDiv(){
        return this.#labelDiv;
    }
    get labelSpanDiv(){
        return this.#labelSpanDiv;
    }
    get valueAtLines(){
        return this.#valueAtLines;
    }
    get valueAtGroups(){
        return this.#valueAtGroups;
    }
}