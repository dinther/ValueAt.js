# ValueAt.js
Extremely fast precomputed single value animation.

Check this out if you need to animate a value lightning fast through a range of keyframes.
Depending on the accuracy desired an output of 100 million points in 500ms is possible.
And it does not matter how many keyframes are used to animate the value.

##  usage

Create an instance of the list type you require.
For example UInt32

```
var valueAt = new UInt32AtTime();
```

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

The fastest value lookup is `getValueBefore(time)` as it takes your time and converts in into a lookp index and returns the value closest before the given time.
A little more accurate is `getValueAt(time)` as it takes the value closest before and after the given time and linear interpolates between the two. Much more accurate but also slower.
Finally there is `getValueAtKeyframe(time)' it computes the values every time based on the current value key and it's easing function. The is accurate but the slowest.

```
Performance test. Cycles:100000000
Navigated to http://127.0.0.1:5501/valueat.html
valueat.html:44 getValueBefore 606.3999998569489
valueat.html:51 getValueAt 984.6999998092651
valueat.html:59 getValueAtKeyframe 3594.7000000476837
```
