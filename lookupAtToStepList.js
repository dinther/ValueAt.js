    //  Experimental functions to pre-compute a STEP / DIR instruction list that closely follow the 
    //  curve represented by this class. The produced data can be loaded onto a Micro controller.
    //  In a timed loop it can simply work it's way through the bimary data and toggle
    //  the STEP and DIR pins accordingly.
    //  This allows highly complex precise motion without the need for powerful hardware.
    //
    //  The function returns an array with integers.
    //    -1 = step backward
    //    0 = no step
    //    1 = step forward
    //
    //  The stepList will be compressed and be saved to a file if you pass a fileName

    export function computeStepList(LookupAtTime, pulseCount, fileName = null){
        let timeRange = LookupAtTime.maxTime - LookupAtTime.minTime;
        let interval = timeRange / pulseCount;
        let time = LookupAtTime.minTime;
        let positionList = [];
        let stepList = [];

        while (time < LookupAtTime.maxTime){
            positionList.push(Math.round(LookupAtTime.getValueAtKeyframe(time)));
            time += interval;
        }

        //  Calculate and store Difference between each list value
        for (let i=0; i<positionList.length-1; i++){
            let step = positionList[i+1] - positionList[i];
            stepList.push(step);
        }

        let faults = 0;
        //  Check if values are either -1, 0 or 1 anything else is not allowed
        for (let i=0; i<stepList.length; i++){
            if (Math.abs(stepList[i]) > 1){               
                faults++;
            }
        }

        if (faults > 0){
            throw new Error(faults+' value overruns. Steps greater than one are not allowed in the stepList. Reduce the value range or increase the sample resolution by increasing pulseCount.');
        }

        //  count forward steps
        let forwardCount = 0;
        stepList.forEach((value)=>{if (value==1) forwardCount++;});
        //  count backward steps
        let backwardCount = 0;
        stepList.forEach((value)=>{if (value==-1) backwardCount++;});

        if (forwardCount != backwardCount){
            alert('Total forward ('+forwardCount+') and backward ('+backwardCount+') steps must be equal if you use the stepper in a linear system.');
        }
        compressStepList(stepList, fileName);
        return stepList;
    }

    //  Function takes the stepList created by computeStepList
    //  and returns a compressed typed array.
    //  The stepList values are remapped so they all fit in 2 bits.
    //  Bit 1 is the Step and bit 2 is a Direction
    //  The function will also compress this data into a binary file using only two bits
    //  per Step/Dir instruction and save it to your harddrive if you pass a fileName
    export function compressStepList(stepList, fileName){
        let downloadBlob = function(data, fileName, mimeType) {
            var blob, url;
            blob = new Blob([data], {
              type: mimeType
            });
            url = window.URL.createObjectURL(blob);
            downloadURL(url, fileName);
            setTimeout(function() {
              return window.URL.revokeObjectURL(url);
            }, 1000);
        };
          
        let downloadURL = function(data, fileName=null) {
            var a;
            a = document.createElement('a');
            a.href = data;
            a.download = fileName;
            document.body.appendChild(a);
            a.style = 'display: none';
            a.click();
            a.remove();
        };

        const STEP_BACK    = 0b01;  // (1)
        const STEL_IDLE    = 0b00;  // (0)
        const STEP_FORWARD = 0b11;  // (3)
        const STEP_EOF     = 0x02;
        let binStepList = [];
        //Map values to 2 bits
        for (let i=0; i<stepList.length; i++){
            switch (stepList[i]){
                case -1: binStepList.push(STEP_BACK); break;
                case 0:  binStepList.push(STEL_IDLE); break;
                case 1:  binStepList.push(STEP_FORWARD); break;
            }
        }

        //  Compress data each command is 2 bits rather than 8 bits takes less space on micro controller
        let dataIndex = 0;
        let itemCount = 6;
        let totalBits = (binStepList.length * 2) + 2;  //  Calculate total bits storage required, add 2 for STEP_EOF marker
        let totalBytes = Math.ceil(totalBits / 8);     //  Calculate total bytes storage required
        let data = new Uint8Array(totalBytes);

        for (let i = 0; i < binStepList.length; i ++) {
            data[dataIndex] = data[dataIndex] | (binStepList[i] & 0x03) << itemCount;
            itemCount-=2;
            if (itemCount<0){
                dataIndex++;
                itemCount = 6;
            }
        }

        for (let i=(3 - binStepList.length%4); i>=0; i--){  //  Fill the remaining space with EOF markers
            data[dataIndex] = data[dataIndex] | STEP_EOF << (i * 2);
        }

        if (typeof(fileName) == 'string'){
            downloadBlob(data, fileName, 'application/octet-stream');
        }
        return data;
    }


