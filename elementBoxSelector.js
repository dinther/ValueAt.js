import * as VA_Utils from "./valueAtUtils.js";

export class ElementBoxSelector {
    #enabled = true;
    #boxSetCallBack
    #containerRect;
    #selectorBox = VA_Utils.createEl('div', {});
    #boxSelectStartPoint = {left: 0, top: 0, inUse: false};
    #internalboxSetCallBack(e){
        switch (e.type){
            case 'pointerdown': return e.button == 0 && e.ctrlKey;
            case 'pointermove': return e.buttons == 1 && e.ctrlKey;
            case 'pointerup': return e.ctrlKey;
        }
    }
    constructor(parentElement, boxSetCallBack=null, boxCssClassName){
        if (typeof boxSetCallBack == 'function'){
            this.#boxSetCallBack = boxSetCallBack;
        } else {
            this.#boxSetCallBack = this.#internalboxSetCallBack;
        }
        VA_Utils.addCSSSelector('.valueAt-element-box-selector', 'border: 1px solid rgb(232, 232, 232); z-index: 1000;', '', false);
        this.#selectorBox.classList.add('valueAt-element-box-selector');
        if (typeof boxCssClassName == 'string'){
            this.#selectorBox.classList.add(boxCssClassName);
        }
        
        this.#selectorBox.style.display = 'none';
        this.#selectorBox.style.position = 'absolute';
        this.#containerRect = parentElement.getBoundingClientRect();
        parentElement.appendChild(this.#selectorBox);
        document.addEventListener('pointerdown', (e)=>{
            if (!this.#enabled) return;
            let callbackResult = this.#boxSetCallBack(e);
            if (typeof callbackResult != 'bool') { callbackResult = this.#internalboxSetCallBack(e); }
            if ( callbackResult && !this.#boxSelectStartPoint.inUse){
                this.#boxSelectStartPoint.left = e.pageX - this.#containerRect.left;
                this.#boxSelectStartPoint.top = e.pageY - this.#containerRect.top;
                this.#boxSelectStartPoint.inUse = true;
                e.preventDefault();
                e.stopPropagation();
            }
        });
        document.addEventListener('pointermove', (e)=>{
            let callbackResult = this.#boxSetCallBack(e);
            if (typeof callbackResult != 'bool') { callbackResult = this.#internalboxSetCallBack(e); }
            if (callbackResult && this.#boxSelectStartPoint.inUse){
                let x = Math.min(this.#boxSelectStartPoint.left, this.#boxSelectStartPoint.left, e.pageX - this.#containerRect.left);
                let y = Math.min(this.#boxSelectStartPoint.top, this.#boxSelectStartPoint.top, e.pageY - this.#containerRect.top);
                this.#selectorBox.style.display = '';
                this.#selectorBox.style.left = x + 'px';
                this.#selectorBox.style.top = y + 'px';      
                this.#selectorBox.style.width = Math.abs(e.pageX - this.#containerRect.left - this.#boxSelectStartPoint.left) + 'px';
                this.#selectorBox.style.height = Math.abs(e.pageY - this.#containerRect.top - this.#boxSelectStartPoint.top) + 'px';
                e.preventDefault();
                e.stopPropagation();
            }
        });
        document.addEventListener('pointerup', (e)=>{
            let callbackResult = this.#boxSetCallBack(e);
            if (typeof callbackResult != 'bool') { callbackResult = this.#internalboxSetCallBack(e); }
            if ( callbackResult && this.#boxSelectStartPoint.inUse){
                this.#boxSelectStartPoint.inUse = false;
                e.preventDefault();
                e.stopPropagation(); 
                let selectboxEvent = new PointerEvent( 'selectbox-finished', e);
                selectboxEvent.deselect  = (this.#boxSelectStartPoint.left > (e.pageX - this.#containerRect.left) && this.#boxSelectStartPoint.top > (e.pageY - this.#containerRect.top))? true : false;
                let box = this.#selectorBox.getBoundingClientRect();
                selectboxEvent.selectRect = { bottom: box.bottom,height: box.height, left: box.left, right: box.right, top: box.top, width: box.width, x: box.x, y: box.y };
                try{
                    this.#boxSetCallBack(selectboxEvent);
                } catch(err){
                    throw err;
                } finally{
                    this.#selectorBox.style.display = 'none';
                }
            }
        });   
    }
    get enabled(){
        return this.#enabled;
    }
    set Enabled(value){
        this.#enabled = value;
    }
}