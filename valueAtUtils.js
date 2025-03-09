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

//  Returns true when the two instances of DomRect rectangle intersect.
//  Usage: let intersect = domRectIntersect(elm_1.getBoundingClientRect(), elm_2.getBoundingClientRect());
export function domRectIntersect(domRect1, domRect2){
    return (domRect1 != domRect2 && domRect2.right >= domRect1.left && domRect2.left <= domRect1.right && domRect2.top <= domRect1.bottom && domRect2.bottom >= domRect1.top);
}

//  Injects a css class into the document stylesheet
//  Usage: addCSSSelector('.mycssclass', 'display:none', true);
//  Set highPriority to true if the style needs the highest importance
export function addCSSSelector(selector, style, media, highPriority=false) {
    if(!document.styleSheets) {
        return;
    }

    if(document.getElementsByTagName('head').length == 0) {
        return;
    }
    
     var mediaTypes = (media==undefined)? [''] : media.replaceAll(' ', '').toLowerCase().split(',');
    //if (mediaTypes.indexOf('screen')!=-1 && mediaTypes.indexOf('')==-1){ mediaTypes.unshift(''); }
    var CSSStyleRules = [];

    mediaTypes.forEach((mediaType)=>{
        let styleSheet;
        //  find stylesheet that matches the required media
        if(document.styleSheets.length > 0) {
            for( let i = 0; i < document.styleSheets.length; i++) {
                let sheet= document.styleSheets[i];
                let mediaText = sheet.media.mediaText.toLowerCase();
                if (mediaText == '' && mediaType == 'screen') {mediaText = 'screen'} 
                if (mediaText == 'screen' && mediaType == '') {mediaText = ''} 
                if( !sheet.disabled && mediaText.indexOf( mediaType ) != -1) {
                    styleSheet = sheet;
                    if (!highPriority) break;
                }
            }
        }

        //  none found, let's create a CSSStylesheet
        if( styleSheet == undefined ) {
            var styleSheetElement = document.createElement("style");
            styleSheetElement.setAttribute('media', mediaType);
            if (!highPriority){
                let insertBeforeElement = document.head.querySelector('link[rel="stylesheet" i], style');
                document.getElementsByTagName('head')[0].insertBefore(styleSheetElement, insertBeforeElement);
            } else {
                document.getElementsByTagName('head')[0].appendChild(styleSheetElement);
            }
            
            for( let i = 0; i < document.styleSheets.length; i++) {
                if(styleSheetElement = document.styleSheets[i].ownerNode) {
                    styleSheet = document.styleSheets[i];
                    styleSheet.media.appendMedium(mediaType);
                    break;
                }
            }
        }

        if (styleSheet == undefined){
            return;
        }

        //  find the rule with matching selector
        let CSSStyleRule;
        for( let i = 0; i < styleSheet.cssRules.length; i++) {
            if( styleSheet.cssRules[i].selectorText && styleSheet.cssRules[i].selectorText.toLowerCase() == selector.toLowerCase()) {
                styleSheet.cssRules[i].style.cssText = style;
                CSSStyleRule = styleSheet.cssRules[i];
            }
        }

        //  create a rule
        if (CSSStyleRule == undefined){
            let insertIndex = highPriority? styleSheet.cssRules.length : 0
            let index = styleSheet.insertRule(selector + "{" + style + "}", insertIndex);
            CSSStyleRules.push(styleSheet.cssRules[index]);
        }
    });

    return CSSStyleRules;
}