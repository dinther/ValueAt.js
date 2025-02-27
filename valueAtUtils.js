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

export function clamp(minValue, value=0, maxValue){
    let maxVal = Math.max(minValue, maxValue);
    let minVal = Math.min(minValue, maxValue);
    return Math.max(minVal, Math.min(value, maxVal));
}

export function domRectIntersect(domRect1, domRect2){
    return (domRect2.right >= domRect1.left && domRect2.left <= domRect1.right && domRect2.top <= domRect1.bottom && domRect2.bottom >= domRect1.top);
}
