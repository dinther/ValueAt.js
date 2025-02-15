export class ValueAtNode{
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
