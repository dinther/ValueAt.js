export function drawValuesOnCanvas(valueAt, canvas, lineColor='#f00', backColor='#000'){

    let h = canvas.height;
    let w = canvas.width;
    let timeRange = valueAt.maxTime - valueAt.minTime;
    let valueRange = valueAt.maxValueKey - valueAt.minValueKey;
    let xScale = w/timeRange;
    let yScale = h/valueRange;
    let ctx = canvas.getContext('2d');   
    ctx.fillStyle = backColor;
    ctx.fillRect(0, 0, w, h);   
    ctx.beginPath();          
    ctx.moveTo(0, h);
    ctx.strokeStyle = lineColor;
    for (let i=0; i<=valueAt.valueList.length; i++){
        let time = i * valueAt.interval + valueAt.minTime;
        var v = valueAt.valueList[i];
        let x = (time - valueAt.minTime) * xScale;
        let y = h-(v-valueAt.minValue) * yScale;
        ctx.lineTo(x,y);
    }
    ctx.stroke();
}

export function drawValueAtOnSVG(valueAt, svg, steps = 30){
    let h = svg.parentElement.offsetHeight;
    let w = svg.parentElement.offsetWidth;
    let timeRange = valueAt.maxTime - valueAt.minTime;
    let valueRange = valueAt.maxValue - valueAt.minValue;
    let yScale = h / valueRange;
    let xScale = w / timeRange;
    svg.dataset.xScale = xScale;
    svg.dataset.yScale = yScale;
    console.log(xScale, yScale);
    let path = 'M0 ' + (valueAt.maxValue - valueAt.getValueAt(valueAt.minTime)) * yScale;
    path += 'L';
    for (let i=1; i<=steps; i++){
        let f = i/steps;
        let time =  valueAt.minTime + timeRange * f;
        let v = valueAt.maxValue - valueAt.getValueAt(time);
        let x = timeRange * f * xScale; //(time - valueAt.minTime);// * xScale;
        let y = v * yScale;
        //console.log(x.toFixed(2),y.toFixed(2));
        path += x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
    }
    svg.querySelector('path').setAttribute('d', path);
    
    //svg.setAttribute('preserveAspectRatio', 'none');
    //svg.setAttribute('viewBox',(valueAt.minTime * xScale) + ' ' + (valueAt.minValue * yScale) + ' ' + (valueAt.maxTime * xScale) + ' ' + (valueAt.maxValue * yScale));
}

export function createValueAtUILine(valueAt, parentGrid){
    let labelDiv = document.createElement('div');
    labelDiv.dataset.valueAt = valueAt;
    labelDiv.className = 'value-label';
    let span = document.createElement('span');
    span.innerText = valueAt.name;
    labelDiv.appendChild(span);
    parentGrid.appendChild(labelDiv);

    let lineDiv = document.createElement('div');
    lineDiv.dataset.valueAt = valueAt;
    lineDiv.className = 'value-line';
    //lineDiv.innerHTML = '<svg pathlength="1" class="values-svg"><path d="M0 0L100 0 100 32 0 32 0 0"/></svg>';
    const iconSvg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.classList.add('values-svg');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('d', 'M0 0L100 0 100 32 0 32 0 0');

    iconSvg.appendChild(iconPath);
    lineDiv.appendChild(iconSvg);
    //let svg = lineDiv.querySelector('svg');

    let horAxisDiv = document.createElement('div');
    horAxisDiv.className = 'value-hor-axis';
    lineDiv.appendChild(horAxisDiv);

    parentGrid.appendChild(lineDiv);

    drawValueAtOnSVG(valueAt, iconSvg, 100);
    let y = iconSvg.dataset.yScale * valueAt.minValue;
    if (y<0){
        horAxisDiv.style.bottom = -y+'px';
        horAxisDiv.style.display = 'block';
    } else {
        horAxisDiv.style.display = 'none';
    }

    //  create nodes
    for (let i=0; i<valueAt.valueKeys.length; i++){
        let valueKey = valueAt.valueKeys[i];
        let valueNode = document.createElement('div');
        valueNode.className = 'value-node';
        valueNode.style.left = (valueKey.time - valueAt.minTime) / (valueAt.maxTime - valueAt.minTime) * 100 + '%';
        valueNode.style.bottom = (valueKey.value - valueAt.minValue) / (valueAt.maxValue - valueAt.minValue) * 100 + '%';
        lineDiv.appendChild(valueNode);
    }
    console.log(iconSvg);
}