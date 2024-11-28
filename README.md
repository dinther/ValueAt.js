# ValueAt.js

Extremely fast precomputed single value animation.

Check this out if you need to animate a value lightning fast through a range of keyframes.
Depending on the accuracy desired an output of 100 million points in 500ms is possible.
And it does not matter how many keyframes are used to animate the value.

![{B761C25F-3039-4C01-B0BA-9B1B5887E57E}](https://github.com/user-attachments/assets/bf081ad8-f117-4afa-9a5d-026c9b749ae4)

##  usage

First load the required javascript modules.

```
        <script type="module">
            import * as ValueAt from "./lib/value-at-time.js"
            import * as Easings from "./lib/easings.js";

            ...

        </script>
```

Now we can instantiate the LookupAtTime object.

```
  var valueAt = new ValueAt.LookupAtTime();
  var valueAt = new LookupAtTime();
```

By default the internal lookup array is a regular array list. It is possible to specify
a specific TypedArray class in the constructor like

```
val valueAt = new LookupAtTime('Int32Array');
```

In this case the LookupAt class handles Integers only. Use this for extremely large lists when the memory footprint becomes an issue.
Performance wize it makes no difference. You have to make sure that the values remain in the range of the TypedArray list used.

Now you add your animation key frames. They are called valueKeys since we don't really deal with frames at this level.
For a value key you need to specify at what time you want a value to be at the specified value.
By default values between value keys are linear interpolated but you can pass your own easing functions.

```
  valueAt.add(400, 2048);
  valueAt.addValueKey(1000,4096, Easings.easeOutBounce, 0.5);  // time, value, Easing function, optional magnitude param
  valueAt.addValueKey(2000,3005, Easings.easeInOutQuad);
  valueAt.addValueKey(3000,0,Easings.easeInCirc);
```

I am using the easing library from https://github.com/AndrewRayCode/easing-utils which is included in the repository.
I like it because some easing functions take a magnitude parameter.

Before the valueAt object can be used it needs to be initialised. This triggers an internal value calculation based on the time slice interval specified here.

```
  valueAt.init(10);
```

Given the above value keys we have a time range of 2600. valueAt divides this time into slices of 10 plus 1.
So internally valueKey keeps a loopup list that contains 260+1 = 261 values. All the easings are applied.

Now the class is ready to output animation values. This can be done at different fidelity each with it's own performance benefit.

```
console.log(valueAt.getValueAt(1200);
```

The fastest value lookup is `getValueFast(time)` as it takes your time and converts in into a lookup index and returns the value closest before the given time. No calculations required.
This works best if you slice your time in small units. Also consider the value data type UInt32 might not be ideal in your case.
A little more accurate is `getValueAt(time)` as it takes the value closest before and after the given time and linear interpolates between the two. Much more accurate but also slower.
Finally there is `getValueAtKeyframe(time)' it computes the values every time based on the current value key and it's easing function. The is accurate but the slowest.

```
Performance test. Cycles:100000000
Navigated to http://127.0.0.1:5501/valueat.html
valueat.html:44 getValueFast 612.7999999523163
valueat.html:51 getValueAt 974.4000000953674
valueat.html:59 getValueAtKeyframe 3591.399999856949
```
