export function createEl(name, options, parent=null){
    let elm = document.createElement(name);
    for (const [key, value] of Object.entries(options)) {
        if (['for'].indexOf(key) != -1){ //  items in this list should be treated as attributes
            elm.setAttribute(key, value);
        } else {
            elm[key] = value;
        }
    }
    if (parent != null){
        parent.appendChild(elm);
    }
    return elm;
}