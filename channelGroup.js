import * as VA_Utils from "./valueAtUtils.js";
import * as Icons from "./appIcons.js";

export class ChannelGroup{
    #timeLine;
    #groupDiv;
    #groupHeaderDiv;
    #labelDiv;
    #labelContent;
    #labelCaretDiv;
    #labelSpanDiv;
    #expandDiv;
    #indent = 0;
    #parentChannelGroup;
    #groupIconsDiv;
    #channelGroups = [];
    #valueChannels = [];
    #onChanged;
    #options = {name:'group', expanded: true, indent:20};
    constructor(timeLine, parentChannelGroup, options){
        Object.assign(this.#options, options);
        if (typeof timeLine != 'object' || timeLine.constructor.name !== 'TimelineManager'){
            throw new Error('A object of type TimeLineManager is required for parameter timeLine');
        }
        if (parentChannelGroup == null){
            parentChannelGroup = timeLine.rootChannelGroup;
        }
        if (parentChannelGroup != null){
            this.#parentChannelGroup = parentChannelGroup;
            this.#parentChannelGroup.channelGroups.push(this);
        }
        let labelCollapseClass = '';
        let expandedCollapseClass = '';
        if (this.#parentChannelGroup){
            if (!this.#parentChannelGroup.expanded){
                labelCollapseClass = ' valueAt-collapse';
                expandedCollapseClass = ' valueAt-collapse';
            }
            if (!this.#options.expanded){
                expandedCollapseClass = ' valueAt-collapse';
            }
        } else if (!this.#options.expanded){
            expandedCollapseClass = ' valueAt-collapse';
        }
        this.#timeLine = timeLine;
        let parentDiv = this.#timeLine.lineWrapDiv;
        if (this.#parentChannelGroup != null){
            this.#indent = this.#parentChannelGroup.indent + this.#options.indent;
            parentDiv = this.#parentChannelGroup.expandDiv;
        }
        this.#options.expanded = this.#options.expanded;
        this.#groupDiv = VA_Utils.createEl('div', {id: this.#options.name + '_group', className: 'valueAt-group'}, parentDiv);
        this.#labelDiv = null;
        if (this.#parentChannelGroup != null){
            this.#groupHeaderDiv = VA_Utils.createEl('div', {className: 'valueAt-group-header'}, this.#groupDiv);
            this.#labelDiv = VA_Utils.createEl('div', {className: 'valueAt-group-label' + labelCollapseClass}, this.#groupHeaderDiv);

            this.#labelContent = VA_Utils.createEl('div', {className: 'valueAt-group-label-span'}, this.#labelDiv);
            this.#labelContent.innerHTML = Icons.getSVG('play',16);
            //this.#labelCaretDiv = VA_Utils.createEl('div', {className: 'valueAt-group-caret', innerText:'▶'}, this.#labelContent);
            this.#labelCaretDiv = this.#labelContent.firstChild;
            this.#labelCaretDiv.style.marginLeft = this.#parentChannelGroup.indent + 'px';
            this.#labelSpanDiv = VA_Utils.createEl('span', {innerText: this.#options.name}, this.#labelContent);
            this.#groupIconsDiv = VA_Utils.createEl('div', {className: 'valueAt-line-icons'}, this.#labelDiv);
            this.#labelContent.addEventListener('pointerdown', (e)=>{
                if (e.button == 0){
                    this.#setExpanded(!this.#options.expanded, e.ctrlKey);
                    e.stopPropagation();
                }
            });
            this.#updateCaret();
        }
         
        this.#expandDiv = VA_Utils.createEl('div', {className: 'valueAt-expand' + expandedCollapseClass}, this.#groupDiv); 
    }
    #handleChanged(channel){
        if (typeof this.#onChanged === 'function'){
            this.onSelectedChanged(this, channel);
        }
    }

    #setExpanded(value, setState = false){
        if (value != this.#options.expanded || setState){
            if (value==true){
                this.#options.expanded = value;
                this.expand(setState);
            } else {
                this.#options.expanded = value;
                this.collapse(setState);
            }
            this.#options.expanded = value;
            this.#updateCaret();
            this.update();
        }
    }

    //  Traces ChannelGroups back to the root of the tree and returns all not expanded groups in an Array
    getLogicallyCollapsedParentGroups(collapsedGroups=[]){
        if (this.#parentChannelGroup){
            if (!this.#options.expanded && collapsedGroups.indexOf(this) == -1) collapsedGroups.push(this);
            if (!this.#parentChannelGroup.expanded && collapsedGroups.indexOf(this.#parentChannelGroup) == -1) collapsedGroups.push(this.#parentChannelGroup);
            return this.#parentChannelGroup.getLogicallyCollapsedParentGroups(collapsedGroups);
        } else {
            return collapsedGroups;
        }
    }

    collapse(setState=false){
        if (setState) {
            this.#options.expanded = false;
        }

        //  Only set the very first logically and visually expanded group expandDiv to semi transparent
        if (this.#parentChannelGroup.expanded && !this.#parentChannelGroup.expandDiv.classList.contains('valueAt-collapse')){
            this.#expandDiv.classList.add('valueAt-grouped-lines');
        } else {
            this.#expandDiv.classList.remove('valueAt-grouped-lines');
        }

        for (let i=0; i<this.#valueChannels.length; i++){
            this.#valueChannels[i].lineDiv.classList.add('valueAt-collapse');
            this.#valueChannels[i].labelDiv.classList.add('valueAt-collapse');
        }

        this.#expandDiv.classList.add('valueAt-collapse');
        if (!this.#parentChannelGroup.expanded)
            this.#labelDiv.classList.add('valueAt-collapse');
        
        for (let i=0; i<this.#channelGroups.length; i++){
            this.#channelGroups[i].collapse(setState);
        }

        //  Hide value lines when the any group between the tree root and this group is logicaly collapsed (!expanded)
        let collapsedParentGroups = this.getLogicallyCollapsedParentGroups();
        if (collapsedParentGroups.length > 1){
            for (let i=0; i<this.#valueChannels.length; i++){
                this.#valueChannels[i].lineDiv.classList.add('valueAt-hide');
            }
        }
    }

    expand(setState=false){
        if (setState) {
            this.#options.expanded = true;
        }
        if (this.#labelDiv && this.#parentChannelGroup.expanded) this.#labelDiv.classList.remove('valueAt-collapse');
        if (this.#expandDiv && this.#parentChannelGroup.expanded){
            if (this.#options.expanded){
                this.#expandDiv.classList.remove('valueAt-collapse');
                this.#expandDiv.classList.remove('valueAt-grouped-lines');
            } else {
                this.#parentChannelGroup.expandDiv.classList.remove('valueAt-grouped-lines');
                this.#expandDiv.classList.add('valueAt-grouped-lines');
            }
        }
        this.#channelGroups.forEach((channelGroup)=>{
            channelGroup.expand(setState);
        });
        if (this.#parentChannelGroup.expanded){
            this.#valueChannels.forEach((valueChannel)=>{
                valueChannel.lineDiv.classList.remove('valueAt-hide');
            });
        }
        this.#valueChannels.forEach((valueChannel)=>{
            if (this.#parentChannelGroup.expanded && this.#options.expanded){
                valueChannel.labelDiv.classList.remove('valueAt-collapse');
                valueChannel.lineDiv.classList.remove('valueAt-collapse');
            }
        });
        
    }
    #updateCaret(){
        if (this.#labelCaretDiv != null){
            if (this.#options.expanded) this.#labelCaretDiv.classList.add('caret-down');
            else this.#labelCaretDiv.classList.remove('caret-down');
        }
    }
    update(){        
        this.#valueChannels.forEach((valueChannel)=>{
            valueChannel.update();
        });
        this.#channelGroups.forEach((channelGroup)=>{
            channelGroup.update();
        });
    }
    setTimeAccurate(time){
        this.#valueChannels.forEach((valueChannel)=>{
            valueChannel.setTimeAccurate(time);
        });
        this.#channelGroups.forEach((channelGroup)=>{
            channelGroup.setTimeAccurate(time);
        });        
    }

    setTime(time){
        this.#valueChannels.forEach((valueChannel)=>{
            valueChannel.setTime(time);
        });

        this.#channelGroups.forEach((channelGroup)=>{
            channelGroup.setTime(time);
        });        
    }

    setTimeFast(time){
        this.#valueChannels.forEach((valueChannel)=>{
            valueChannel.setTimeFast(time);
        });
        this.#channelGroups.forEach((channelGroup)=>{
            channelGroup.setTimeFast(time);
        });        
    }

    addChannelGroup1(name, expanded=true){
        let channelGroup = new ChannelGroup(this.#timeLine, this, {name: name, expanded:expanded});
        this.#channelGroups.push(channelGroup);
        return channelGroup;
    }  

    addChannel1(channel){
        this.#valueChannels.push(valueChannel);
        this.#handleChanged(valueChannel);
        if (this.#options.expanded == false){
            this.collapse();
        }
    }
    addValueAt1(valueAt, labelName='', strokeWidth=1, strokeColor='#fff'){
        let valueChannel = new ValueChannel(this.#timeLine, this, {valueAt: valueAt, labelName: labelName, strokeWidth: strokeWidth, strokeColor: strokeColor});
        this.#valueChannels.push(valueChannel);
        this.#handleChanged(valueChannel);
        if (this.#options.expanded == false){
            this.collapse();
        }
        return valueChannel;
    }
    getRootUserGroupName(){
        if (this.#parentChannelGroup == this.#timeLine.rootChannelGroup){
            return this.#options.name;
        } else {
            return this.#parentChannelGroup? this.#parentChannelGroup.getRootUserGroupName() : '';
        }
    }
    getvalueChannels(checkInView = false, checkExpanded = false){
        let valueChannelsList = [];
        this.#valueChannels.forEach((valueChannel)=>{
            if (checkInView && valueChannel.inView || !checkInView){
                if (checkExpanded && !valueChannel.lineDiv.classList.contains('valueAt-collapse') || !checkExpanded){
                    valueChannelsList.push(valueChannel);
                }
            }
        });
        return valueChannelsList;
    }

    getAllValueChannels(checkInView = false, checkExpanded = false){
        let valueChannelsList = this.getvalueChannels(checkInView, checkExpanded);
        this.#channelGroups.forEach((channelGroup)=>{
            valueChannelsList = valueChannelsList.concat( channelGroup.getAllValueChannels(checkInView, checkExpanded));
        });
        return valueChannelsList;
    }

    getAllValueNodes(checkInView = false, checkExpanded = false){
        let valueNodes = [];
        let valueChannels = this.getvalueChannels(checkInView, checkExpanded);
        valueChannels.forEach((valueChannel)=>{
            if (Array.isArray(valueChannel.valueNodes)){
                valueNodes = valueNodes.concat(valueChannel.valueNodes);
            }
        });
        this.#channelGroups.forEach((channelGroup)=>{
            valueNodes = valueNodes.concat(channelGroup.getAllValueNodes(checkInView, checkExpanded));
        });
        return valueNodes;
    }

    get name(){
        return this.#options.name;
    }
    set name(value){
        this.#options.name = value;
        this.#labelSpanDiv.innerText = this.#options.name;
    }
    get expanded(){
        return this.#options.expanded;
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
    get valueChannels(){
        return this.#valueChannels;
    }
    get channelGroups(){
        return this.#channelGroups;
    }
}
