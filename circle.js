import * as VA_Utils from "./valueAtUtils.js";

export class Circle{
    #parent;
    #div;
    #r;
    #g;
    #b;
    constructor(parent, name, radius, r, g, b, x, y){
        this.#parent = parent;
        this.#div = VA_Utils.createEl('div', {}, this.#parent);
        this.#div.style.display = 'flex';
        this.#div.style.position = 'absolute';
        this.#div.style.borderRadius = '50%';
        this.#div.style.transform = 'translate(-50%, 50%)';
        this.#div.style.zIndex = 50;
        this.#div.style.alignItems = 'center';
        this.#div.style.justifyContent = 'center';
        this.#div.style.color = 'white';
        this.#div.style.opacity = 0.6;
        this.#div.style.aspectRatio = '1 / 1';
        this.#div.innerHTML = '<div>' + name + '</div>';

        this.name = name;
        this.radius = radius;
        this.#r = r;
        this.#g = g;
        this.#b = b;
        this.#setColors();
        this.x = x;
        this.y = y;
    }
    #getColors(){
        let colors = this.#div.style.backgroundColor.replace('rgb(', '').replace(')').split(',');
        this.#r = colors[0];
        this.#g = colors[1];
        this.#b = colors[2];
    }
    #setColors(){
        this.#div.style.backgroundColor = 'rgb(' + this.#r + ',' + this.#g + ',' + this.#b + ')';
    }
    get div(){
        return this.#div;
    }
    get name(){
        return this.#div.id;
    }
    set name(value){
        this.#div.id = value;
    }
    get radius(){
        return parseFloat(this.#div.style.width.replace('%'));
    }
    set radius(value){
        this.#div.style.height = (value * 2) + '%';
    }
    get r(){
        return this.#r;
    }
    set r(value){
        if (value != this.#r){
            this.#r = value;
            this.#setColors();
        }
    }
    get g(){
        return this.#g;
    }
    set g(value){
        if (value != this.#g){
            this.#g = value;
            this.#setColors();
        }
    }
    get b(){
        return this.#b;
    }
    set b(value){
        if (value != this.#b){
            this.#b = value;
            this.#setColors();
        }
    }
    get x(){
        return parseFloat(this.#div.style.left.replace('%'));
    }
    set x(value){
        this.#div.style.left = value + '%';
    }
    get y(){
        return parseFloat(this.#div.style.bottom.replace('%'));
    }
    set y(value){
        this.#div.style.bottom = value + '%';
    }
}
