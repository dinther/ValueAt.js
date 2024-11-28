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
//  https://github.com/dinther/ValueAt.js
//  By Paul van Dinther

class ValueKey{
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

class ValueAtTime{
    #valueKeys=[];
    #minTime;
    #maxTime;
    #minValue;
    #maxValue;
    #onValueKeyChange;
    #onChange;
    constructor(){

    }
    lerp(a, b, t){
        return a + (b - a) * t;
    }

    #sortKeyTimes(){
        this.#valueKeys.sort((a, b) => a.time - b.time);
    }
    #sortKeyValues(){
        this.#valueKeys.sort((a, b) => a.value - b.value);
    }
    #handleValueKeyChange(valueKey){
        this.update(valueKey);
        this.#handleChange(valueKey);
    }
    #handleChange(prop){
        if (typeof value !== 'function'){
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
    update(valueKey){
        this.#sortKeyValues();
        this.#minValue = this.#valueKeys.length==0? 0 : this.#valueKeys[0].value;
        this.#maxValue = this.#valueKeys.length==0? 0 : this.#valueKeys[this.#valueKeys.length-1].value;
        this.#sortKeyTimes();
        this.#minTime = this.#valueKeys.length==0? 0 : this.#valueKeys[0].time;
        this.#maxTime = this.#valueKeys.length==0? 0 : this.#valueKeys[this.#valueKeys.length-1].time;
    }
    init(){
        this.update(null)
    }
    getValueAt(time){
        this.getSourceValueAt(time);  //  We ignore mode as Original is the only option
    }
    getSourceValueAt(time){
        time = this.clampTime(time);
        let low = 0, high = this.#valueKeys.length - 1;
        let beforeIndex = -1, afterIndex = -1;
    
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
    
        // Reset low and high for the next search
        low = 0;
        high = this.#valueKeys.length - 1;
    
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
        
        let deltaTime = (this.#valueKeys[afterIndex].time - this.#valueKeys[beforeIndex].time);
        if (deltaTime==0) return this.#valueKeys[afterIndex].value;
        let t = (time - this.#valueKeys[beforeIndex].time) / deltaTime;
        t = this.#valueKeys[afterIndex].easing? this.#valueKeys[afterIndex].easing(t,this.#valueKeys[afterIndex].magnitude) : t;
        return this.lerp(this.#valueKeys[beforeIndex].value, this.#valueKeys[afterIndex].value, t);
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
    get maxValue(){
        return this.#maxValue;
    }
    get onChange(){
        return this.#onChange;
    }
    set onChange(value){
        if (typeof value !== 'function'){  throw new Error('onChange expects a function'); }
        this.#onChange = value;
    }
}

class UInt32AtTime extends ValueAtTime{ 
    #valueList;
    #interval;
    constructor(){
        super();
    }
    #populateValueList(interval){
        for(let i=0; i<this.#valueList.length; i++){
            this.#valueList[i] = this.getSourceValueAt((i * interval) + this.minTime);
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
    update(valueKey){
        super.update();
        let length = Math.floor((this.maxTime - this.minTime)/this.#interval)+1;
        this.#valueList = new Uint32Array(length);
        this.#populateValueList(this.#interval);
    }
    init(interval){
        if (!interval) {
            throw new Error('Interval can not be zero.');
        }
        this.#interval = interval;
        super.init();
    }
    getValueBefore(time){  //  fastest
        time = this.clampTime(time);
        return this.#valueList[this.#getIndexBefore(time)];
    }
    getValueAfter(time){  //   second fastest
        time = this.clampTime(time);
        return this.#valueList[this.#getIndexAfter(time)];
    }
    getValueAt(time){  //  fourth fastest pretty accurate
        time = this.clampTime(time);
        let beforeIndex = this.#getIndexBefore(time);
        let afterIndex = this.#getIndexAfter(time);
        let t = (time - this.minTime - (beforeIndex * this.#interval)) / this.#interval;
        if (beforeIndex === afterIndex) return this.#valueList[afterIndex];
        return this.lerp(this.#valueList[beforeIndex], this.#valueList[afterIndex], t/(afterIndex - beforeIndex));
    }
    getValueAtKeyframe(time){  //  slowest but accurate
        time = this.clampTime(time);
        return this.getSourceValueAt(time);
    }
    getValueRange(interval, startTime=null, endTime=null){
        if( interval == 0 ){  throw new Error('Interval can not be zero.')  }
        startTime = startTime!=null? startTime : this.minTime;
        endTime = endTime!=null? endTime : this.maxTime;
        let length = Math.floor((endTime - startTime) /  interval) + 1;
        let values = new Uint32Array(length);
        for (let i = 0; i < length; i++){
            values[i] = this.getValueAt(startTime + i * interval);
        }
        return values;
    }
    get interval(){
        return this.#interval;
    }
    get valueList(){
        return this.#valueList;
    }
}
