# ValueAt.js

Extremely fast precomputed single value animation.

Check this out if you need to animate a value lightning fast through a range of keyframes.
Depending on the accuracy desired an output of 100 million points in 500ms is possible.
And it does not matter how many keyframes are used to animate the value.

Demo here: https://dinther.github.io/ValueAt.js/

![image](https://github.com/user-attachments/assets/1664b21c-74fc-4f0c-96e4-a93af78db335)

##  usage

First load the required javascript modules.

```
        <script type="module">
            import * as ValueAt from "./lib/valueat.js"
            import * as Easings from "./lib/easings.js";

            ...

        </script>
```

Now we can instantiate the LookupAtTime object.

```
  var valueAt = new ValueAt.LookupAtTime();
```

By default the internal lookup array is a regular array list. It is possible to specify
a specific TypedArray class in the constructor like

```
val valueAt = new LookupAtTime('Int32Array');
```

In this case the LookupAt class handles Integers only. Use this for extremely large lists when the memory footprint becomes an issue.
Performance wize it makes no difference. You have to make sure that the values remain in the range of the TypedArray list used.

Now you add your animation key frames. They are called valueKeys since we don't really deal with frames at this level.
For a value key you need to specify at what time you want a variable to be at the specified value.
By default values between value keys are linear interpolated but you can pass your own easing functions.

```
  valueAt.add(400, 2048);
  valueAt.addValueKey(1000,4096, Easings.easeOutBounce, 0.5);  // time, value, Easing function, optional magnitude param
  valueAt.addValueKey(2000,3005, Easings.easeInOutQuad);
  valueAt.addValueKey(3000,0,Easings.easeInCirc);
```

I am using the easing library from https://github.com/AndrewRayCode/easing-utils which is included in the repository and it has many additional easing functions such as stepped.

ValueAt can lookup values in three main modes:

## Accurate
In accurate mode we ask the ValueAT object to find the relevant easing function for  given time and evaluate the easing function for every value request. This will always produce the most precise results. This mode is also easy on memory use because no pre-calculated data is stored. However, this method is also slower.

## Interpolated
This mode requires the class to first initialise itself after all the valuekeys have been added. When calling `init(0.0167)` an interval is passed. For example 0.0167 which is 1/60. 

ValueAt will work out the time range between all the valueKeys and slice the time range into 0.0167 second slices. The interval used will totally depend on the type of value animated, the duration of the animation and the desired frame rate.

When looking up a value in this mode for a given time the stored value before the given time and the stored value after the given time are used for a linear interpolation. This mode uses more memory but that depends on the duration and interval. However, this value lookup method is much faster that in "accurate" mode.

##  Fast
When animations are not crazy long and you can settle on a fixed time resolution you may want to consider using Fast mode. For example, your time resolution might be 1 / 60 or 0.0167 seconds (60 fps). As described above for "interpolated" ValueAt will require an init step after all Valuekeys have been added and pre-calculate for every interval increment what the output value should be and store it in an array. ValueAt will clamp the requested time to this interval and instantly return the associated value without any calculations of lookup loops. As with "Interpolated" it uses some memory but the speed is extremely fast. Besides in fast animations the slight inaccuracies and steps are less noticable.

Before the valueAt object can be used in interpolated or fast mode, it needs to be initialised. This triggers an internal value calculation based on the time slice interval specified here.

```
  valueAt.init(10);
```

Given the above valuekeys from the code example we have a time range of 2600. valueAt divides this time into slices of 10 plus 1.
So internally valueKey keeps a lookup list that contains 260+1 = 261 values. All the easings are applied.

Now the class is ready to output animation values. This can be done at different fidelity each with it's own performance benefit.

```
console.log(valueAt.getValueAt(1200);
```

The fastest value lookup is `getValueFast(time)` as it takes your time and converts in into a lookup index and returns the value closest before the given time. No calculations required.

A little more accurate is `getValueAt(time)` as it takes the value closest before and after the given time and linear interpolates between the two. More accurate but also slower.

Finally there is `getValueAtKeyframe(time)' it computes the values every time based on the current value key and it's easing function. The is accurate but the slowest.

```
Performance test. Cycles:100000000
Navigated to http://127.0.0.1:5501/valueat.html
valueat.html:44 getValueFast 612.7999999523163
valueat.html:51 getValueAt 974.4000000953674
valueat.html:59 getValueAtKeyframe 3591.399999856949
```

## Timeline UI (In progress)

ValueAt.js comes with a UI value key editor. Not usable yet. But this timeline control should be usable for any application where valuekey based animation is a thing.

``` Javascript
    //  We create a bunch of LookupAtTime value sequences like this

    var va_red = new LookupAtTime('red');
    va_red.addValueKey(10,-50);  //  These are shown as interactive yellow circles in the timeline
    va_red.addValueKey(30,100, Easings.linear, 0.5);
    va_red.addValueKey(75,60, Easings.easeInOutQuad);
    va_red.addValueKey(100,0,Easings.easeOutCirc);
    va_red.init(1);

    ...

    //  Now we create the timeline control, add groups
    //  and populate those groups with the value sequences created above.

    var timeLine = new ValueAtTimeLine(document.body, 0, 100)
    let circle = timeLine.addNewValueAtGroup('Circle', true);
    let colorGroup = circle.addNewValueAtGroup('Color', false);
    colorGroup.addValueAt(va_red, 'Red', 1, 'red');
    colorGroup.addValueAt(va_green, 'Green', 1, 'green');
    colorGroup.addValueAt(va_blue, 'Blue', 1, 'blue');

    let positionGroup = circle.addNewValueAtGroup('Position', false);
    positionGroup.addValueAt(va_pos_x, 'Pos X', 1);
    positionGroup.addValueAt(va_pos_y, 'Pos y', 1);
    ...
```

![image](https://github.com/user-attachments/assets/786ea79d-24d5-494a-8cee-662905e6b7e3)

The groups allow the user to collapse the many animation curves into a single line. Rather than hiding the collapsed data, we still show all the valueKeys (Yellow circles in the image) so that you always have a high level overview and instantly you can see if and where valueKeys have been defined.

The timeline control supports multi node selection and editing. The nodes can be selected across multiple value channels with box select or the usual CTRL and SHIFT logic.
 
