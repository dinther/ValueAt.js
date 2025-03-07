export class WaveDisplay{
    #options = {
        data: [],
        parent: document.body,
        samplesPerPoint: 60,
        zoomRate: 0.01,
        decelerationTime: null,
        scale:1,
        onViewChange: null,
        onInit: null,
        onSlideEnd: null,
    }
    #parent;
    #wrapper;
    #svg;
    #data;
    #lastPeaks;
    #samplesPerPixel = 1;
    #startIndex;
    #endIndex;
    #zoom = 1;
    #scrolling = false;
    #lastMoveTime = null;
    #lastMoveX = null;
    #lastStartIndex;
    #lastEndIndex;
    #scrollSpeed = 0;
    test;
    #minValue;
    #maxValue;
    #scrollbar;
    #zoomPinchMode = false;
    #evCache = [];
    #startLeftLock = -1;
    #startRightLock = -1;
    #lockRange = -1;
    #scale = 1;
    constructor( options ){
        this.#options = {...this.#options, ...options};

        this.#parent = this.#options.parent;
        this.#data = this.#options.data;
        if ( typeof( this.#options.onViewChange ) == 'function' ){
            this.onViewChange = this.#options.onViewChange;
        }
        if ( typeof( this.#options.onInit ) == 'function' ){
            this.onInit = this.#options.onInit;
        }   
        if ( typeof( this.#options.onSlideEnd ) == 'function' ){
            this.onSlideEnd = this.#options.onSlideEnd;
        }
        this.#wrapper = document.createElement( 'div' );
        this.#wrapper.classList.add('wave-wrapper');
        this.#parent.appendChild(this.#wrapper);
        this.#svg = this.#createSVG( this.#wrapper);
        this.#scrollbar = document.createElement( 'div' );
        this.#scrollbar.classList.add( 'scrollbar' );
        this.#scrollbar.appendChild( document.createElement( 'div' ) );

        this.#wrapper.appendChild( this.#scrollbar );

        this.#wrapper.addEventListener( 'pointerdown', e =>{        
            if ( e.ctrlKey ){
                //  create a copy of the event but with a new pointerID
                let ctrlPointer = new PointerEvent( 'pointerdown', {pointerId: -1, type: e.pointerType, clientX: e.clientX, clientY:e.clientY} );
                this.#addEvent( ctrlPointer );
            } else {
                this.#addEvent( e );
                this.#scrolling = e.target == this.#scrollbar;
                this.#wrapper.setPointerCapture( e.pointerId );
            }
            this.#setScrollSpeed( 0 );
            this.#lastMoveX = e.clientX;
        });  

        this.#wrapper.addEventListener( 'pointerup', e =>{
            this.#wrapper.releasePointerCapture( e.pointerId );
            if ( this.#zoomPinchMode || e.timeStamp -  this.#lastMoveTime > 20 ){
                this.#setScrollSpeed( 0 );
                this.#lastMoveTime = null;
                this.#lastMoveX = null;
                this.#scrolling = false;
            }
            
            if ( e.ctrlKey ){
                e.preventDefault();
                e.stopPropagation();
            }

            if ( this.#scrollSpeed != 0 ){
                requestAnimationFrame( this.#keepScrolling.bind( this ));
            }
            this.#pinchZoomFinished( e );
        });

        this.#wrapper.addEventListener( 'pointercancel',e=>{
            this.#pinchZoomFinished( e );
        });

        this.#wrapper.addEventListener( 'pointerout',e=>{
            //this.#pinchZoomFinished( e );
        });

        this.#wrapper.addEventListener( 'pointerleave',e=>{
            this.#pinchZoomFinished( e );
        });
        
        this.#wrapper.addEventListener( 'pointermove',e=>{
            if ( e.buttons==0 || this.#lastMoveX == null ){
                return;
            }
            
            // Find this event in the cache and update its record with this event
            const index = this.#evCache.findIndex(
                ( cachedEv ) => cachedEv.pointerId === e.pointerId
            );           
            this.#evCache[index] = e;

            e.preventDefault(); 
            
            if ( this.#evCache.length === 2 ) {  // Pinch to zoom
                let leftPos = Math.min( this.#evCache[0].clientX , this.#evCache[1].clientX );
                let rightPos = Math.max( this.#evCache[0].clientX , this.#evCache[1].clientX );
                if ( e.pointerType != 'mouse' ){
                    leftPos = Math.floor( leftPos / 2 ) * 2;
                    rightPos = Math.floor( rightPos / 2 ) * 2;
                }
                if ( this.#startLeftLock < 0 || this.#startRightLock < 0 ){
                    this.#startLeftLock =  this.#startIndex + ( this.#samplesPerPixel * leftPos );
                    this.#startRightLock = this.#startIndex + ( this.#samplesPerPixel * rightPos );
                    this.#lockRange = this.#startRightLock - this.#startLeftLock;
                } else {
                    const pixelRange = rightPos - leftPos;
                    let samplesPerPixel = this.#lockRange / pixelRange;
                    this.#startIndex = this.#clampIndex( 0, this.#startLeftLock - ( leftPos * samplesPerPixel ), this.#data.length );
                    this.#endIndex = this.#clampIndex( 0, this.#startRightLock + ( this.#svg.clientWidth - rightPos ) * samplesPerPixel, this.#data.length);
                    this.#drawValues( this.#startIndex, this.#endIndex );
                }
            } else if ( !this.#zoomPinchMode ){   //  Drag

                const walkX = e.clientX - this.#lastMoveX;
                let range = this.#endIndex - this.#startIndex;
                let indexStep;  
                if ( this.#scrolling ){
                    indexStep = walkX * - ( this.#data.length / this.#parent.offsetWidth );
                } else {
                    indexStep = walkX * this.#samplesPerPixel;
                    //  calculate scroll speed
                    if ( this.#lastMoveTime != null ){
                        this.#scrollSpeed = ( e.clientX - this.#lastMoveX );
                    }
                }
                this.#startIndex = this.#clampIndex( 0, this.#startIndex - indexStep, this.#data.length - range );
                this.#endIndex = this.#startIndex + range;
                this.#drawValues( this.#startIndex , this.#endIndex );

                this.#lastMoveX = e.clientX;
                if ( this.#options.decelerationTime != null ){
                    this.#lastMoveTime = e.timeStamp;
                }
            }
        });

        this.#wrapper.addEventListener( 'wheel', this.#handleWheel.bind( this ), { passive: false } );

        window.addEventListener( "resize", ( event ) => {
            this.#drawValues( this.#startIndex, this.#endIndex );
            this.#svg.setAttribute( 'viewBox', '0 -256 ' + this.#parent.offsetWidth + ' 512' );
        });

        this.#init();
    }

    #init(){
        this.#findMinMax();
        this.#setZoom( this.#options.zoom );
        this.#scale = Math.abs( this.#options.scale );
        this.#startIndex = 0;
        this.#endIndex = this.#data.length / this.#zoom;
        let range = this.#endIndex - this.#startIndex;
        this.#samplesPerPixel = range / this.#svg.parentElement.offsetWidth;
        if ( typeof( this.onInit ) === 'function' ){
            this.onInit( this );
        }        
        this.#svg.setAttribute( 'viewBox', '0 -256 ' + this.#parent.offsetWidth + ' 512' );
        this.#drawValues( this.#startIndex, this.#endIndex );
    }

    #clampIndex(minValue, value, maxValue){
        if (value < minValue || value > maxValue){
            this.#scrollSpeed = 0;
        }
        return Math.max(minValue, Math.min(maxValue, value));
    }

    #setScrollSpeed( value ){
        if ( value != this.#scrollSpeed ){
            this.#scrollSpeed = value;
            if ( this.#scrollSpeed == 0 ){
                this.#drawValues( this.#startIndex, this.#endIndex );
                if ( typeof( this.onSlideEnd ) === 'function' ){
                    this.onSlideEnd( this );
                } 
            }
        }
    }

    #pinchZoomFinished( e ) {
        if ( this.#removeEvent( e.pointerId ) && this.#zoomPinchMode ){
            this.#removeEvent( -1 ); //  remove fake first point if present
            if ( this.#evCache.length == 0 ){
                this.#zoomPinchMode = false;
                this.#startLeftLock = -1;
                this.#startRightLock = -1;
            }
        }
    }

    #addEvent( e ) {
        this.#evCache.push( e );
        this.#zoomPinchMode = this.#evCache.length > 1;
    }

    #removeEvent( pointerId ) {
        if ( !pointerId || typeof pointerId === 'undefined' ) return false;
        if ( this.#evCache.length === 0 ) return false;

        const index = this.#evCache.findIndex(
            ( cachedEv ) => cachedEv.pointerId === pointerId,
          );

          if ( index > -1 ){
            this.#evCache.splice( index, 1 );
            return true;
        }
        return false;
    }

    #findMinMax() {
        for ( let i = 0; i < this.#data.length; i++ ) {
            let value = this.#data[i];
            this.#minValue = this.#minValue == null? value : Math.min( this.#minValue, value ); 
            this.#maxValue = this.#maxValue == null? value : Math.max( this.#maxValue, value );
        }
    }

    #keepScrolling( timeStamp ) {
        let totalTime = ( timeStamp - this.#lastMoveTime ) / 1000;
        let f = 1 - Math.min( 1, ( totalTime / this.#options.decelerationTime ));
        if ( f==0 || this.#scrollSpeed ==0 ){
            this.#setScrollSpeed( 0 );
            return;
        }
        let indexStep = f * f * this.#scrollSpeed * this.#samplesPerPixel;
        let range = this.#endIndex - this.#startIndex;  
        this.#startIndex = this.#clampIndex( 0, this.#startIndex - indexStep, this.#data.length - range );
        this.#endIndex = this.#startIndex + range;
        this.#drawValues( this.#startIndex , this.#endIndex );
        this.#scrollbar.left = ( this.#startIndex / this.#data.length * this.#parent.offsetWidth ) + 'px';
  
        requestAnimationFrame( this.#keepScrolling.bind( this ));
    }

    #createSVG(){
        const svg  = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
        svg.classList.add( 'wave-values-svg' );
        const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
        path.setAttribute( 'd', 'M0 0L100 0 100 32 0 32 0 0' );
        svg.setAttribute( 'preserveAspectRatio', 'none' );
        svg.appendChild( path );
        this.#wrapper.appendChild( svg );
        return svg;
    }

    #handleWheel( e ){
        this.#setZoom( this.#zoom * Math.exp( -e.deltaY / 80 * this.#options.zoomRate ));
        let along = e.clientX / this.#svg.clientWidth;
        this.#scrollZoom( this.#zoom, along );
        e.preventDefault();
    }

    #setZoom( value ){
        let clampedValue  = Math.min( Math.max( 1, value ), this.maxZoom );
        if ( clampedValue  !== this.#zoom ){
            this.#zoom = clampedValue ;
            return true;
        }
        return false;
    }

    #scrollZoom( zoom, along = 0.5 ){
        let oldRange = this.#endIndex - this.#startIndex;
        let lockIndex = this.#startIndex + ( along * oldRange );
        let newRange = this.#data.length / zoom;
        this.#startIndex = this.#clampIndex( 0, lockIndex - ( newRange * along ), this.#data.length );
        this.#endIndex = this.#clampIndex( 0, this.#startIndex + newRange, this.#data.length );
        this.#drawValues( this.#startIndex, this.#endIndex );
    }

    #getPeaks( startIndex, endIndex, pointCount ){
        let range = endIndex - startIndex;
        let sampleStep = Math.max( 1, ( range / pointCount ));
        startIndex = ~~( startIndex / ( sampleStep * 2 )) * ( sampleStep * 2 );
        endIndex = startIndex + range;
        if (this.#lastStartIndex == startIndex && this.#lastEndIndex == endIndex){
            return this.#lastPeaks;
        }
        let peaks = [];
        this.#lastStartIndex = startIndex;
        let sampleCount = Math.min( sampleStep, this.#options.samplesPerPoint );

        for ( let i=0; i < pointCount; i++ ){
            let yMax= 0;
            let step = Math.max( 1, ( sampleStep / sampleCount ));
            for ( let j = 0; j < sampleCount; j++ ){
                let index = ~~( startIndex + ( i * sampleStep ) + ( j * step ));
                yMax = Math.max( yMax, Math.abs( this.#data[index] ));
            }
            peaks[i] = yMax;
        }
        this.#lastPeaks = peaks;
        return peaks;
    }

    #drawValues( startIndex, endIndex ){
        let pixelStep = 2;        
        let pointCount = ~~( this.#svg.parentElement.offsetWidth / pixelStep );
        let peaks = this.#getPeaks( startIndex, endIndex, pointCount );
        let v = Math.max( Math.abs( this.#maxValue ), Math.abs( this.#minValue ));
        let path = 'M0 0L';
        for ( let i = 0; i < peaks.length; i++ ){
            let value = peaks[i] / v * 256 * this.#scale;
            let x = i * pixelStep;
            if ( i%2==0 ){
                path += x.toFixed( 2 ) + ' ' + ( value ).toFixed( 0 ) + ' ';
            } else {
                path += x.toFixed( 2 ) + ' ' + ( -value ).toFixed( 0 ) + ' ';
            }
        }
        
        this.#svg.querySelector( 'path' ).setAttribute( 'd', path );

        let range = endIndex - startIndex;
        this.#samplesPerPixel = range / this.#svg.parentElement.offsetWidth;

        //  update scrollbar   
        this.#scrollbar.style.width = ( range / this.#data.length * this.#parent.offsetWidth ) + 'px';
        this.#scrollbar.style.left = ( startIndex / this.#data.length * this.#parent.offsetWidth ) + 'px';
        this.#scrollbar.style.display = ~~( this.#scrollbar.offsetWidth ) == ~~( this.#parent.offsetWidth )? 'none' : '';
        if ( typeof( this.onViewChange ) === 'function' ){
            this.onViewChange( this );
        }
    }    

    getSampleIndexFromOffsetX( offsetX ) {
        return this.#startIndex + this.#samplesPerPixel * offsetX;
    }

    setView(startIndex, endIndex){
        let range = endIndex - startIndex;
        startIndex = this.#clampIndex( 0, startIndex, this.#data.length - range );
        endIndex = this.#clampIndex( startIndex + 1, endIndex, this.#data.length);
        if (startIndex != this.#startIndex || endIndex != this.#endIndex){
            this.#startIndex = startIndex;
            this.#endIndex = endIndex;
            this.#drawValues( this.#startIndex , this.#endIndex );
        }
    }

    onInit;
    onViewChange;
    onSlideEnd;

    get options(){
        return this.#options;
    }

    get svg() {
        return this.#svg;
    }

    get scrollbar() {
        return this.#scrollbar;
    }

    get samplesPerPixel() {
        return this.#samplesPerPixel;
    }

    get scrollSpeed() {
        return this.#scrollSpeed;
    }

    get startIndex() {
        return this.#startIndex;
    }

    set startIndex( value ) {
        this.#startIndex = this.#clampIndex( 0, value, this.#data.length );
    }

    get endIndex() {
        return this.#endIndex;
    }

    set endIndex( value ) {
        this.#endIndex = this.#clampIndex(0, value, this.#data.length );
    }


    get maxZoom() {
        return this.#data.length / this.#parent.offsetWidth;
    }

    get zoom() {
        return this.#data.length / ( this.#endIndex - this.#startIndex );
    }

    set zoom( value ) {
        if ( this.#setZoom( value )){
            this.#scrollZoom( this.#zoom, 0 );    
        }
    }

    get scale() {
        return this.#scale;
    }

    set scale( value ) {
        this.#scale = value;
        this.#drawValues( this.#startIndex, this.#endIndex );
    }
}
