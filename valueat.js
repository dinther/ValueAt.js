//  This class is designed to produce the fastest possible value lookup
//  for a given time stamp.

//  Key frames (Value x at time n) can be added with optional ease functions.
//  However once the key frames are defined the entire range is chopped up
//  in equal time slices and the interpolated value at that point
//  is stored in typed array.

//  The fast value lookup can be before, after, nearest or interpolated. 
//  The time for a value request is converted to the nearest lesser slice time
//  and the value returned.

//  If interpolated is requirested a lerp is performed between it and the value for the next slice.


export class ValueKey{
    #options = {time: null, value: null, easing: null}
    #valueAt;
    #onChange=null;
    #hasP1;
    #hasP2;
    constructor(valueAt, options){
        this.#valueAt = valueAt;
        Object.assign(this.#options, options);
        this.#findParams();
    }


    #handleChange(propName){
        //if (typeof this.#onChange !== 'function'){
        if (typeof this.#onChange === 'function'){
            this.#onChange(this, propName);
        }
    }
    #findParams(){ //  Parses the Easing function string to check for p1 and p2 params and reads their possible default values.
        if (this.#options.easing){
            const str = this.#options.easing.toString().toLowerCase();
            const regex = /\(([^)]+)\)/;
            let m;
            if ((m = regex.exec(str)) !== null) {
                // The result can be accessed through the `m`-variable.
                let values = m[1].replaceAll(' ','').split(',');
                this.#hasP1 = false;
                this.#hasP2 = false;
                if (values.length > 1){
                    values.forEach((value)=>{
                        let vl = value.split('=');
                        if (vl[0]=='p1') this.#hasP1 = true;
                        if (vl[0]=='p2') this.#hasP2 = true;
                        if (this.#options[vl[0]]==null && !isNaN(vl[1])){
                            this.#options[vl[0]] = parseFloat(vl[1]);
                        }
                    })
                }
            }
        }
    }
    get hasP1(){
        if (this.easing){
            return this.easing.toString().indexOf('p1') != -1;
        }
        return false;
    }
    get hasP2(){
        if (this.easing){
            return this.easing.toString().indexOf('p2') != -1;
        }
        return false;
    }
    get valueAt(){
        return this.#valueAt;
    }
    get time(){
        return this.#options.time;
    }
    set time(value){
        if (value != this.#options.time){
            this.#options.time = value;
            this.#handleChange('time');
        }
    }
    get value(){
        return this.#options.value;
    }
    set value(value){
        if (value != this.#options.value){
            this.#options.value = this.#valueAt.clampValue(value);
            this.#handleChange('value');
        }
    }
    get easing(){
        return this.#options.easing;
    }
    set easing(value){
        if (value != this.#options.easing){
            this.#options.easing = value;
            this.#findParams();
            this.#handleChange('easing');
        }
    }
    get p1(){
        return this.#options.p1;
    }
    set p1(value){
        if (this.#hasP1 && value != this.#options.p1){
            this.#options.p1 = value;
            this.#handleChange('p1');
        }
    }
    get p2(){
        return this.#options.p2;
    }
    set p2(value){
        if (this.#hasP2 && value != this.#options.p2){
            this.#options.p2 = value;
            this.#handleChange('p2');
        }
    }    
    get onChange(){
        return this.#onChange;
    }
    set onChange(value){
        if (typeof value !== 'function'){  throw new Error('onChange expects a function'); }
        this.#onChange = value;
    }
}

export class ValueAtTime{
    #options = {object: null, property: '', min: null, max: null, clampLimits: false};
    #valueKeys=[];
    #minTime;
    #maxTime;
    #minValue;
    #maxValue;
    #onValueKeyChange;
    #onChange;

    constructor(options){
        Object.assign(this.#options, options);
    }

    lerp(a, b, t){
        return a + (b - a) * t;
    }

    #sortKeyTimes(){
        this.#valueKeys.sort((a, b) => a.time - b.time);
    }

    #handleValueKeyChange(valueKey, propName){
        this.update(valueKey, propName);
        this.#handleChange(valueKey, propName);
    }
    #handleChange(valueKey, propName){
        if (typeof  this.#onChange === 'function'){
            this.#onChange(this, valueKey, propName);
        }
    }
    #setMinMaxValuesFromValueKeys(){
        if (this.#valueKeys.length > 0){
            this.#minValue = this.#valueKeys[0].value;
            this.#maxValue = this.#valueKeys[0].value;
        }
        this.#valueKeys.forEach((valueKey)=>{
            this.#minValue = Math.min(this.#minValue, valueKey.value);
            this.#maxValue = Math.max(this.#maxValue, valueKey.value);
        });
    }

    clampTime(time){
        return Math.max(this.minTime, Math.min(this.maxTime,time));
    }

    clampValue(value){
        if (this.#options.min != null) value = Math.max(this.#options.min, value);
        if (this.#options.max != null) value = Math.min(this.#options.max, value);
        return value;
    }

    addValueKey(options){ 
        let valueKey = new ValueKey(this, options);
        valueKey.onChange = this.#handleValueKeyChange.bind(this);
        this.#valueKeys.push(valueKey);
        this.#sortKeyTimes();
        return valueKey;
    }

    deleteValueKey(valueKey){
        let index = this.#valueKeys.indexOf(valueKey);
        if (index != -1){
            this.#valueKeys.splice(index, 1);
        }
    }

    update(valueKey, propName){
        this.#setMinMaxValuesFromValueKeys();
        this.#sortKeyTimes();
        this.#minTime = this.#valueKeys.length==0? 0 : this.#valueKeys[0].time;
        this.#maxTime = this.#valueKeys.length==0? 0 : this.#valueKeys[this.#valueKeys.length-1].time;
    }
    init(){
        this.update(null)
    }

    getValueKeyAt(time, tolerance=0){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let index = -1;
    
        // Find the last index of a number <= the given number
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (this.#valueKeys[mid].time <= time + tolerance || this.#valueKeys[mid].time >= time - tolerance) {
                index = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return this.#valueKeys[index];
    }

    getBeforeValueKeyIndex(time, excludeEqual = false){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let beforeIndex = -1;
    
        // Find the last index of a number <= the given number
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (excludeEqual){
                if (this.#valueKeys[mid].time < time) {
                    beforeIndex = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            } else {
                if (this.#valueKeys[mid].time <= time) {
                    beforeIndex = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
        }
        return beforeIndex;
    }

    getAfterValueKeyIndex(time, excludeEqual = false){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let afterIndex = -1;
    
        // Find the first index of a number >= the given number
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (excludeEqual){
                if (this.#valueKeys[mid].time > time) {
                    afterIndex = mid;
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            } else {
                if (this.#valueKeys[mid].time >= time) {
                    afterIndex = mid;
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }
        }
        return afterIndex;
    }

    getValueAt(time){
        this.getSourceValueAt(time);
    }

    getSourceValueAt(time){
        let beforeKey = this.#valueKeys[this.getBeforeValueKeyIndex(time)];
        let afterKey = this.#valueKeys[this.getAfterValueKeyIndex(time)]; 
        let deltaValue = (afterKey.value - beforeKey.value);
        let deltaTime = (afterKey.time - beforeKey.time);
        if (deltaTime==0) return beforeKey.value;
        if (deltaValue==0) return afterKey.value;
        let t = (time-beforeKey.time) / deltaTime;
        let value = (afterKey.easing != null)? beforeKey.value + (afterKey.easing(t,afterKey.p1,afterKey.p2) * deltaValue) : this.lerp(beforeKey.value, afterKey.value, t);
        return this.#options.clampLimits? this.clampValue(value) : value;
    }

    setTime(time){
        if (this.#options.object && this.#options.object[this.#options.property] != null){
            this.#options.object[this.#options.property] = this.getValueAt(time);
        }
    }

    get options(){
        return this.#options;
    }
    get valueKeys(){
        return this.#valueKeys;
    }
    get minTime(){
        return this.#minTime;
    }
    get maxTime(){
        return this.#maxTime;
    }
    get minValue(){
        return this.#minValue;
    }
    set minValue(value){
        this.#minValue = value;
    }
    get maxValue(){
        return this.#maxValue;
    }
    set maxValue(value){
        this.#maxValue = value;
    }
    get valueRange(){
        return this.#maxValue - this.#minValue;
    }
    get onChange(){
        return this.#onChange;
    }
    set onChange(value){
        if (typeof value !== 'function'){  throw new Error('onChange expects a function'); }
        this.#onChange = value;
    }
}

export class LookupAtTime extends ValueAtTime{ 
    #valueList;
    #interval;
    #options = {object:null, property:'', min:null, max:null, listType:null};
    constructor(options){
        super(options);
        Object.assign(this.#options, options);
    }

    #populateValueList(interval){
        for(let i=0; i<this.#valueList.length; i++){
            let value = this.getSourceValueAt((i * interval) + this.minTime);
            this.minValue = Math.min(this.minValue, value);
            this.maxValue = Math.max(this.maxValue, value);
            this.#valueList[i] = value;
        }
    }

    #getIndexBefore(time){
        return Math.floor((time - this.minTime) / this.#interval);
    }

    #getIndexAfter(time){
        let afterIndex = Math.floor((time - this.minTime) / this.#interval);
        afterIndex = afterIndex < this.#valueList.length - 1? afterIndex + 1 : afterIndex;
        return afterIndex;
    }

    #createValueObject(listType, length){
        switch(listType){
            case 'Float64Array': return new Float64Array(length);
            case 'Float32Array': return new Float32Array(length);
            case 'BigUint64Array': return new BigUint64Array(length);     
            case 'Uint32Array': return new Uint32Array(length);
            case 'Uint16Array': return new Uint16Array(length);
            case 'Uint8Array': return new Uint8Array(length);
            case 'BigInt64Array': return new BigInt64Array(length);
            case 'Int32Array': return new Int32Array(length);
            case 'Int16Array': return new Int16Array(length);
            case 'Int8Array': return new Int8Array(length);
            default : return new Array(length);
        }
    }

    #clampListValue(value, listType){
        value = (value - this.minValue) / this.valueRange;
        switch(listType){
            case 'Float64Array': return Math.max(-9223372036854775808, Math.min(9223372036854775807, 9223372036854775807 * ((value * 2) -1)));
            case 'Float32Array': return Math.max(-2147483648, Math.min(2147483647, 2147483647 * ((value * 2) - 1)));
            case 'BigUint64Array': return Math.max(0, Math.min(18446744073709551615, Math.round(18446744073709551615 * value)));
            case 'Uint32Array': return Math.max(0, Math.min(4294967295, Math.round(4294967295 * value)));
            case 'Uint16Array': return Math.max(0, Math.min(65535, Math.round(65535 * value)));
            case 'Uint8Array': return Math.max(0, Math.min(255, Math.round(255 * value)));
            case 'BigInt64Array': return Math.max(-9223372036854775808, Math.min(9223372036854775807, 9223372036854775807 * ((value * 2) - 1)));
            case 'Int32Array': return Math.max(-2147483648, Math.min(2147483647, 2147483647 * ((value * 2) - 1)));
            case 'Int16Array': return Math.max(-32768 , Math.min(32767, 32767 * ((value * 2) - 1)));
            case 'Int8Array': return Math.max(-128 , Math.min(127, 127 * ((value * 2) - 1)));
            default : return value;
        }        
    }

    update(){
        super.update();
        let length = Math.floor((this.maxTime - this.minTime)/this.#interval)+1;
        this.#valueList = this.#createValueObject(this.#options.listType, length);
        this.#populateValueList(this.#interval);
    }

    init(interval){
        if (!interval) {
            throw new Error('Interval can not be zero.');
        }
        this.#interval = interval;
        super.init();
    }

    getValueFast(time){  //  fastest
        time = this.clampTime(time);
        return this.#valueList[this.#getIndexBefore(time)];
    }


    getValueAt(time){   //  bit slower
        time = this.clampTime(time);
        let beforeIndex = this.#getIndexBefore(time);
        //let afterIndex = this.#getIndexAfter(time);
        let afterIndex = Math.min(this.#valueList.length-1, beforeIndex + 1);
        let t = (time - this.minTime - (beforeIndex * this.#interval)) / this.#interval;
        if (beforeIndex === afterIndex) return this.#valueList[afterIndex];
        return this.lerp(this.#valueList[beforeIndex], this.#valueList[afterIndex], t/(afterIndex - beforeIndex));
    }

    getValueAtKeyframe(time){  //  slowest but accurate
        time = this.clampTime(time);
        return this.getSourceValueAt(time);
    }

    setValueFast(time){
        if (this.#options.object && this.#options.object[this.#options.property] !== undefined){
            this.#options.object[this.#options.property] = this.getValueFast(time);
        }
    }

    setValueAt(time){
        if (this.#options.object && this.#options.object[this.#options.property] !== undefined){
            this.#options.object[this.#options.property] = this.getValueAt(time);
        }
    }

    setValueAccurate(time){
        if (this.#options.object && this.#options.object[this.#options.property] !== undefined){
            this.#options.object[this.#options.property] = this.getValueAtKeyframe(time);
        }
    }

    getValueRange(interval, startTime=null, endTime=null, listType=null){
        if( interval == 0 ){  throw new Error('Interval can not be zero.')  }
        startTime = startTime!=null? startTime : this.minTime;
        endTime = endTime!=null? endTime : this.maxTime;
        let length = Math.floor((endTime - startTime) /  interval) + 1;
        let values = this.#createValueObject(listType || this.#options.listType, length);
        for (let i = 0; i < length; i++){
            values[i] = this.#clampListValue(this.getValueAt(startTime + i * interval), listType);
        }
        return values;
    }

    stringify(){
        //{object: null, property: '', min: null, max: null, clampLimits: false};
        let data = {
            clampLimits: this.#options.clampLimits,
            valueKeys: []
        };
        if (this.#options.object != null){
            data.objectClass = this.#options.object.constructor.name;
            if (this.#options.object.name) data.objectName = this.#options.object.name;
        }
        if (this.#options.min != null) data.min = this.#options.min;
        if (this.#options.max != null) data.max = this.#options.max;

        this.valueKeys.forEach((valueKey)=>{
            let key = {time: valueKey.time, value: valueKey.value};
            if (valueKey.easing != null) key.easing = valueKey.easing.name;
            if (valueKey.p1 != null) key.p1 = valueKey.p1;
            if (valueKey.p2 != null) key.p1 = valueKey.p2;
            data.valueKeys.push(key);
        });
        return JSON.stringify(data);
    }

    get interval(){
        return this.#interval;
    }

    get valueList(){
        return this.#valueList;
    }
}

