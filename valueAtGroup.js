import * as VA_Utils from "./valueAtUtils.js";
import {ValueAtLine} from "./valueAtLine.js";

export class ValueAtGroup{
    #timeLine;
    #name;
    #groupDiv;
    #groupHeaderDiv;
    #labelDiv;
    #labelContent;
    #labelCaretDiv;
    #labelSpanDiv;
    #expandDiv;
    #indent = 0;
    #parentValueAtGroup;
    #expanded;
    #valueAtGroups = [];
    #valueAtLines = [];
    #onChanged;
    #hidden;
    constructor(timeLine, name, parentValueGroup, expanded=true){
        let labelCollapseClass = '';
        let expandedCollapseClass = '';
        if (parentValueGroup){
            if (!parentValueGroup.expanded){
                labelCollapseClass = ' valueAt-collapse';
                expandedCollapseClass = ' valueAt-collapse';
            }
            if (!expanded){
                expandedCollapseClass = ' valueAt-collapse';
            }
        } else if (!expanded){
            expandedCollapseClass = ' valueAt-collapse';
        }
        this.#timeLine = timeLine;
        this.#name = name;
        this.#parentValueAtGroup = parentValueGroup;
        let parentDiv = this.#timeLine.lineWrapDiv;
        if (this.#parentValueAtGroup != null){
            this.#indent = this.#parentValueAtGroup.indent + 20;
            parentDiv = this.#parentValueAtGroup.expandDiv;
        }
        this.#expanded = expanded;
        this.#groupDiv = VA_Utils.createEl('div', {id: this.#name + '_group', className: 'valueAt-group'}, parentDiv);
        this.#labelDiv = null;
        if (this.#parentValueAtGroup != null){
            this.#groupHeaderDiv = VA_Utils.createEl('div', {className: 'valueAt-group-header'}, this.#groupDiv);
            this.#labelDiv = VA_Utils.createEl('div', {className: 'valueAt-group-label' + labelCollapseClass}, this.#groupHeaderDiv);
                       
            this.#labelContent = VA_Utils.createEl('div', {className: 'valueAt-group-label-span'}, this.#labelDiv);
            this.#labelCaretDiv = VA_Utils.createEl('div', {className: 'valueAt-group-caret', innerText:'▶'}, this.#labelContent);
            this.#labelCaretDiv.style.marginLeft = this.#parentValueAtGroup.indent + 'px';
            this.#labelSpanDiv = VA_Utils.createEl('span', {innerText: this.#name}, this.#labelContent);
            this.#labelContent.addEventListener('pointerdown', (e)=>{
                //this.expanded = !this.expanded;
                this.#setExpanded(!this.#expanded, e.ctrlKey);
                e.stopPropagation();
            });
            this.#updateCaret();
        }
         
        this.#expandDiv = VA_Utils.createEl('div', {className: 'valueAt-expand' + expandedCollapseClass}, this.#groupDiv); 
    }
    #handleChanged(valueAtUI){
        if (typeof this.#onChanged === 'function'){
            this.onSelectedChanged(this, valueAtUI);
        }
    }
    collapse(setState=false){
        //this.#labelDiv.classList.add('valueAt-collapse');
        if (setState) {
            this.#expanded = false;
        }
        this.#expandDiv.classList.add('valueAt-collapse');
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.collapse(setState);
            valueAtGroup.labelDiv.classList.add('valueAt-collapse');
        });

        if (!this.#parentValueAtGroup.expanded){
            this.#valueAtLines.forEach((valueAtLine)=>{
                if (!this.expanded){
                    valueAtLine.labelDiv.classList.add('valueAt-hide');
                    valueAtLine.lineDiv.classList.add('valueAt-hide');
                }
            });
        }
        this.#valueAtLines.forEach((valueAtLine)=>{
            valueAtLine.labelDiv.classList.add('valueAt-collapse');
            valueAtLine.lineDiv.classList.add('valueAt-collapse');
        });
        
        //this.#labelDiv.style.display = 'none';

        //this.#expandDiv.querySelectorAll('.valueAt-group-label').forEach(node=>{ node.classList.add('valueAt-collapse')});
        //this.#expandDiv.querySelectorAll('.valueAt-line-label').forEach(node=>{ node.classList.add('valueAt-collapse')});
        //this.#expandDiv.querySelectorAll('.valueAt-line').forEach(node=>{ node.classList.add('valueAt-collapse')});
        //this.#expandDiv.classList.add('valueAt-collapse');
    }
    expand(setState=false){
        if (setState) {
            this.#expanded = true;
        }
        if (this.#labelDiv && this.#parentValueAtGroup.expanded) this.#labelDiv.classList.remove('valueAt-collapse');
        if (this.#expandDiv && this.#parentValueAtGroup.expanded && this.#expanded) this.#expandDiv.classList.remove('valueAt-collapse');
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            if (this.#expanded) valueAtGroup.expand(setState);
        });
        if (this.#parentValueAtGroup.expanded){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.labelDiv.classList.remove('valueAt-hide');
                valueAtLine.lineDiv.classList.remove('valueAt-hide');
            });
        }
            this.#valueAtLines.forEach((valueAtLine)=>{
                if (this.#expanded){
                    valueAtLine.labelDiv.classList.remove('valueAt-collapse');
                    valueAtLine.lineDiv.classList.remove('valueAt-collapse');
                }
            });
        
    }
    #updateCaret(){
        if (this.#labelCaretDiv != null){
            if (this.#expanded) this.#labelCaretDiv.classList.add('caret-down');
            else this.#labelCaretDiv.classList.remove('caret-down');
        }
    }
    update(startTime_offset, timeRange_offset){
        if (!this.#hidden){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.update(startTime_offset, timeRange_offset);
            });
            this.#valueAtGroups.forEach((valueAtGroup)=>{
                valueAtGroup.update(startTime_offset, timeRange_offset);
            });
        }
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
    #setExpanded(value, setState = false){
        if (value != this.#expanded || setState){
            if (value==true){
                this.#expanded = value;
                //this.#expandDiv.style.display = '';
                this.expand(setState);
            } else {
                this.#expanded = value;
                //this.#expandDiv.style.display = 'none';
                this.collapse(setState);
            }
            this.#expanded = value;
            this.#updateCaret();
            this.update();
        }
    }
    get expanded(){
        return this.#expanded;
    }
    set expanded(value){
        this.#setExpanded(value);
    }
    get hidden(){
        return this.#hidden;
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
