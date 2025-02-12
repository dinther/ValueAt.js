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
    #time;
    #value;
    #easing;
    #magnitude = 1;
    #onChange=null;


    constructor(time, value, easing=null, magnitude=null){
        this.#time = time;
        this.#value = value;
        this.#easing = easing;
        this.#magnitude = magnitude;
    }


    #handleChange(prop){
        if (typeof value !== 'function'){
            this.#onChange(this, prop);
        }
    }


    get time(){
        return this.#time;
    }


    set time(value){
        this.#time = value;
        this.#handleChange(this['time']);
    }


    get value(){
        return this.#value;
    }


    set value(value){
        this.#value = value;
        this.#handleChange(this['value']);
    }


    get easing(){
        return this.#easing;
    }


    set easing(value){
        this.#easing = value;
        this.#handleChange(this['easing']);
    }


    get magnitude(){
        return this.#magnitude;
    }


    set magnitude(value){
        this.#magnitude = value;
        this.#handleChange(this['easing']);
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
    #name;
    #valueKeys=[];
    #minTime;
    #maxTime;
    #minValueKey;
    #maxValueKey;
    #onValueKeyChange;
    #onChange;


    constructor(name=''){
        this.#name = name;
    }

    lerp(a, b, t){
        return a + (b - a) * t;
    }

    #sortKeyTimes(){
        this.#valueKeys.sort((a, b) => a.time - b.time);
    }

    #handleValueKeyChange(valueKey){
        this.update(valueKey);
        this.#handleChange(valueKey);
    }
    #handleChange(prop){
        if (typeof  this.#onChange === 'function'){
            this.#onChange(this, prop);
        }
    }

    clampTime(time){
        return Math.max(this.minTime, Math.min(this.maxTime,time));
    }

    addValueKey(time, value, easing = null, magnitude=null){
        let valueKey = new ValueKey(time, value, easing, magnitude);
        valueKey.onChange = this.#handleValueKeyChange.bind(this);
        this.#valueKeys.push(valueKey);
        return valueKey;
    }

    update(){
        for(let i=0; i<this.#valueKeys.length; i++){
            let value = this.#valueKeys[i].value;
            if (i==0){
                this.#minValueKey = value;
                this.#maxValueKey = value;
            } else {
                this.#minValueKey = Math.min(this.#minValueKey, value);
                this.#maxValueKey = Math.max(this.#maxValueKey, value);
            }
        }
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

    getBeforeValueKey(time){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let beforeIndex = -1;
    
        // Find the last index of a number <= the given number
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (this.#valueKeys[mid].time <= time) {
                beforeIndex = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return this.#valueKeys[beforeIndex];
    }

    getAfterValueKey(time){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let afterIndex = -1;
    
        // Find the first index of a number >= the given number
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (this.#valueKeys[mid].time >= time) {
                afterIndex = mid;
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }
        return this.#valueKeys[afterIndex];
    }

    getValueAt(time){
        this.getSourceValueAt(time);
    }

    getSourceValueAt(time){
        let beforeKey = this.getBeforeValueKey(time);
        let afterKey = this.getAfterValueKey(time);
        
        let deltaTime = (afterKey.time - beforeKey.time);
        if (deltaTime==0) return afterKey.value;
        let t = (time - beforeKey.time) / deltaTime;
        t = afterKey.easing? afterKey.easing(t,afterKey.magnitude) : t;
        return this.lerp(beforeKey.value, afterKey.value, t);
    }

    get name(){
        return this.#name;
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
    get minValueKey(){
        return this.#minValueKey;
    }
    get maxValueKey(){
        return this.#maxValueKey;
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
    #className;
    #minValue;
    #maxValue;    
    #valueRange;
    constructor(name, className=null){
        super(name);
        this.#className = className;
    }

    #populateValueList(interval){
        for(let i=0; i<this.#valueList.length; i++){
            let value = this.getSourceValueAt((i * interval) + this.minTime);
            if (i==0){
                this.#minValue = value;
                this.#maxValue = value;
            } else {
                this.#minValue = Math.min(this.#minValue, value);
                this.#maxValue = Math.max(this.#maxValue, value);
            }
            this.#valueList[i] = value;
        }
        this.#valueRange = this.#maxValue - this.#minValue;
    }

    #getIndexBefore(time){
        return Math.floor((time - this.minTime) / this.#interval);
    }

    #getIndexAfter(time){
        let afterIndex = Math.floor((time - this.minTime) / this.#interval);
        afterIndex = afterIndex < this.#valueList.length - 1? afterIndex + 1 : afterIndex;
        return afterIndex;
    }

    #createValueObject(className, length){
        switch(className){
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

    #clampValue(value, className){
        value = (value - this.minValue) / this.#valueRange;
        switch(className){
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
        this.#valueList = this.#createValueObject(this.#className, length);
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

    getValueRange(interval, startTime=null, endTime=null, className=null){
        if( interval == 0 ){  throw new Error('Interval can not be zero.')  }
        startTime = startTime!=null? startTime : this.minTime;
        endTime = endTime!=null? endTime : this.maxTime;
        let length = Math.floor((endTime - startTime) /  interval) + 1;
        let values = this.#createValueObject(className || this.#className, length);
        for (let i = 0; i < length; i++){
            values[i] = this.#clampValue(this.getValueAt(startTime + i * interval), className);
        }
        return values;
    }

    get interval(){
        return this.#interval;
    }

    get minValue(){
        return this.#minValue;
    }

    get maxValue(){
        return this.#maxValue;
    }

    get valueList(){
        return this.#valueList;
    }
}

