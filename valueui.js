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

export function drawValueAtOnSVG(valueAt, svg, startTime, endTime, steps = 30, strokeWidth = 1){
    let h = svg.parentElement.offsetHeight;
    let w = svg.parentElement.offsetWidth;
    let timeRange = endTime - startTime;
    let valueRange = valueAt.maxValue - valueAt.minValue;
    let path = 'M' + startTime + ' ' + valueAt.getValueAt(startTime);
    path += 'L';
    for (let i=1; i<=steps; i++){
        let f = i/steps;
        let x =  startTime + timeRange * f;
        let y = valueAt.getValueAt(x);
        path += x + ' ' + y + ' ';
    }
    let margin = valueRange / h * strokeWidth * 1.5;
    let hm = margin * 0.5;
    svg.setAttribute('viewBox', startTime + ' ' + (valueAt.minValue-hm) + ' ' + timeRange + ' ' + (valueRange + margin));
    svg.querySelector('path').setAttribute('d', path);
    svg.setAttribute('preserveAspectRatio', 'none');
    //svg.setAttribute('viewBox',(valueAt.minTime * xScale) + ' ' + (valueAt.minValue * yScale) + ' ' + (valueAt.maxTime * xScale) + ' ' + (valueAt.maxValue * yScale));
}

export function createValueAtUILine(labelName, valueAt, parentGrid, startTime, endTime, steps=100, strokeWidth=1){
    let labelDiv = document.createElement('div');
    labelDiv.id = valueAt.name + '_lbl'; 
    labelDiv.dataset.valueAt = valueAt;
    labelDiv.dataset.strokeWidth = valueAt;
    labelDiv.className = 'value-label';
    let span = document.createElement('span');
    span.innerText = labelName;
    labelDiv.appendChild(span);
    parentGrid.appendChild(labelDiv);

    let lineDiv = document.createElement('div');
    lineDiv.id = valueAt.name + '_graph'; 
    lineDiv.dataset.valueAt = valueAt;
    lineDiv.className = 'value-line';
    const iconSvg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.style.transform = 'scaleY(-1)';
    iconSvg.classList.add('values-svg');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('d', 'M0 0L100 0 100 32 0 32 0 0');
    
    iconPath.setAttribute('stroke-width', strokeWidth);
    iconPath.setAttribute('fill', 'none');
    iconPath.setAttribute('stroke' ,'white');
    iconPath.setAttribute('vector-effect', 'non-scaling-stroke');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconSvg.appendChild(iconPath);
    lineDiv.appendChild(iconSvg);


    let horAxisDiv = document.createElement('div');
    horAxisDiv.className = 'value-hor-axis';
    lineDiv.appendChild(horAxisDiv);

    parentGrid.appendChild(lineDiv);

    drawValueAtOnSVG(valueAt, iconSvg, startTime, endTime, steps, strokeWidth);
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
        valueNode.style.left = (valueKey.time - startTime) / (endTime - startTime) * 100 + '%';
        valueNode.style.bottom = (valueKey.value - valueAt.minValue) / (valueAt.maxValue - valueAt.minValue) * 100 + '%';
        valueNode.dataset.valueKey = valueKey;
        lineDiv.appendChild(valueNode);
    }
    return {labelDiv: labelDiv, lineDiv: lineDiv, svg: iconSvg};
}