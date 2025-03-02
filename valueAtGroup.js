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
    #groupIconsDiv;
    #hideAnimation = false;
    #hideValueAnimationDiv;
    #valueAtGroups = [];
    #valueAtLines = [];
    #onChanged;

    constructor(timeLine, name, parentValueGroup, expanded=true, indent=20){
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
            this.#indent = this.#parentValueAtGroup.indent + indent;
            parentDiv = this.#parentValueAtGroup.expandDiv;
        }
        this.#expanded = expanded;
        this.#groupDiv = VA_Utils.createEl('div', {id: this.#name + '_group', className: 'valueAt-group'}, parentDiv);
        this.#labelDiv = null;
        if (this.#parentValueAtGroup != null){
            this.#groupHeaderDiv = VA_Utils.createEl('div', {className: 'valueAt-group-header'}, this.#groupDiv);
            this.#labelDiv = VA_Utils.createEl('div', {className: 'valueAt-group-label' + labelCollapseClass}, this.#groupHeaderDiv);
                  
            this.#groupIconsDiv = VA_Utils.createEl('div', {className: 'valueAt-line-icons'}, this.#labelDiv);
            this.#hideValueAnimationDiv = VA_Utils.createEl('div', {innerText: '👁', title: 'Toggle animation on/off', className: 'valueAt-expand-button'}, this.#groupIconsDiv);
            

            this.#labelContent = VA_Utils.createEl('div', {className: 'valueAt-group-label-span'}, this.#labelDiv);
            this.#labelCaretDiv = VA_Utils.createEl('div', {className: 'valueAt-group-caret', innerText:'▶'}, this.#labelContent);
            this.#labelCaretDiv.style.marginLeft = this.#parentValueAtGroup.indent + 'px';
            this.#labelSpanDiv = VA_Utils.createEl('span', {innerText: this.#name}, this.#labelContent);
            this.#labelContent.addEventListener('pointerdown', (e)=>{
                if (e.button == 0){
                    this.#setExpanded(!this.#expanded, e.ctrlKey);
                    e.stopPropagation();
                }
            });
            this.#hideValueAnimationDiv.addEventListener('pointerdown', (e)=>{
                if (e.button == 0){
                    this.#hideAnimation = !this.#hideAnimation;
                    if (this.#hideAnimation){
                        this.#hideValueAnimationDiv.classList.add('valueAt-hide-animation');
                    } else {
                        this.#hideValueAnimationDiv.classList.remove('valueAt-hide-animation');
                    }
                }
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
    #setExpanded(value, setState = false){
        if (value != this.#expanded || setState){
            if (value==true){
                this.#expanded = value;
                this.expand(setState);
            } else {
                this.#expanded = value;
                this.collapse(setState);
            }
            this.#expanded = value;
            this.#updateCaret();
            this.update();
        }
    }

    //  Traces ValueAtGroups back to the root of the tree and returns all not expanded groups in an Array
    getLogicallyCollapsedParentGroups(collapsedGroups=[]){
        if (this.#parentValueAtGroup){
            if (!this.#expanded && collapsedGroups.indexOf(this) == -1) collapsedGroups.push(this);
            if (!this.#parentValueAtGroup.expanded && collapsedGroups.indexOf(this.#parentValueAtGroup) == -1) collapsedGroups.push(this.#parentValueAtGroup);
            return this.#parentValueAtGroup.getLogicallyCollapsedParentGroups(collapsedGroups);
        } else {
            return collapsedGroups;
        }
    }

    collapse(setState=false){
        if (setState) {
            this.#expanded = false;
        }

        //  Only set the very first logically and visually expanded group expandDiv to semi transparent
        if (this.#parentValueAtGroup.expanded && !this.#parentValueAtGroup.expandDiv.classList.contains('valueAt-collapse')){
            this.#expandDiv.classList.add('valueAt-grouped-lines');
        } else {
            this.#expandDiv.classList.remove('valueAt-grouped-lines');
        }

        for (let i=0; i<this.#valueAtLines.length; i++){
            this.#valueAtLines[i].lineDiv.classList.add('valueAt-collapse');
            this.#valueAtLines[i].labelDiv.classList.add('valueAt-collapse');
        }

        this.#expandDiv.classList.add('valueAt-collapse');
        if (!this.#parentValueAtGroup.expanded)
            this.#labelDiv.classList.add('valueAt-collapse');
        
        for (let i=0; i<this.#valueAtGroups.length; i++){
            this.#valueAtGroups[i].collapse(setState);
        }

        //  Hide value lines when the any group between the tree root and this group is logicaly collapsed (!expanded)
        let collapsedParentGroups = this.getLogicallyCollapsedParentGroups();
        if (collapsedParentGroups.length > 1){
            for (let i=0; i<this.#valueAtLines.length; i++){
                this.#valueAtLines[i].lineDiv.classList.add('valueAt-hide');
            }
        }
    }

    expand(setState=false){
        if (setState) {
            this.#expanded = true;
        }
        if (this.#labelDiv && this.#parentValueAtGroup.expanded) this.#labelDiv.classList.remove('valueAt-collapse');
        if (this.#expandDiv && this.#parentValueAtGroup.expanded){
            if (this.#expanded){
                this.#expandDiv.classList.remove('valueAt-collapse');
                this.#expandDiv.classList.remove('valueAt-grouped-lines');
            } else {
                this.#parentValueAtGroup.expandDiv.classList.remove('valueAt-grouped-lines');
                this.#expandDiv.classList.add('valueAt-grouped-lines');
            }
        }
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.expand(setState);
        });
        if (this.#parentValueAtGroup.expanded){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.lineDiv.classList.remove('valueAt-hide');
            });
        }
        this.#valueAtLines.forEach((valueAtLine)=>{
            if (this.#parentValueAtGroup.expanded && this.#expanded){
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
    update(){        
        this.#valueAtLines.forEach((valueAtLine)=>{
            valueAtLine.update();
        });
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.update();
        });
    }
    setTimeAccurate(time){
        if (!this.#hideAnimation){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.setTimeAccurate(time);
            });
        }
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.setTimeAccurate(time);
        });        
    }

    setTime(time){
        if (!this.#hideAnimation){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.setTime(time);
            });
        }
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.setTime(time);
        });        
    }

    setTimeFast(time){
        if (!this.#hideAnimation){
            this.#valueAtLines.forEach((valueAtLine)=>{
                valueAtLine.setTimeFast(time);
            });
        }
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtGroup.setTimeFast(time);
        });        
    }

    addNewValueAtGroup(name, expanded=true){
        let valueAtGroup = new ValueAtGroup(this.#timeLine, name, this, expanded);
        this.#valueAtGroups.push(valueAtGroup);
        return valueAtGroup;
    }  

    addValueAt(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        let valueAtLine = new ValueAtLine(valueAt, this.#timeLine, this, labelName, strokeWidth, strokeColor);
        this.#valueAtLines.push(valueAtLine);
        this.#handleChanged(valueAtLine);
        if (this.#expanded == false){
            this.collapse();
        }
    }
    getRootName(){
        if (this.#parentValueAtGroup == this.#timeLine.rootValueAtGroup){
            return this.#name;
        } else {
            return this.#parentValueAtGroup.getRootName();
        }
    }
    getValueLines(checkInView = false, checkExpanded = false){
        let valueAtLinesList = [];
        this.#valueAtLines.forEach((valueAtLine)=>{
            if (checkInView && valueAtLine.inView || !checkInView){
                if (checkExpanded && !valueAtLine.lineDiv.classList.contains('valueAt-collapse') || !checkExpanded){
                    valueAtLinesList.push(valueAtLine);
                }
            }
        });
        return valueAtLinesList;
    }

    getAllValueAtLines(checkInView = false, checkExpanded = false){
        let valueAtLinesList = this.getValueLines(checkInView, checkExpanded);
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtLinesList = valueAtLinesList.concat( valueAtGroup.getAllValueAtLines(checkInView, checkExpanded));
        });
        return valueAtLinesList;
    }

    getAllValueAtNodes(checkInView = false, checkExpanded = false){
        let valueAtNodes = [];
        let valueAtLines = this.getValueLines(checkInView, checkExpanded);
        valueAtLines.forEach((valueAtLine)=>{
            valueAtNodes = valueAtNodes.concat(valueAtLine.valueAtNodes);
        });
        this.#valueAtGroups.forEach((valueAtGroup)=>{
            valueAtNodes = valueAtNodes.concat(valueAtGroup.getAllValueAtNodes(checkInView, checkExpanded));
        });
        return valueAtNodes;
    }

    get expanded(){
        return this.#expanded;
    }
    set expanded(value){
        this.#setExpanded(value);
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
