## Quickstart
1. `git clone https://github.com/TheVoidUnknown/vg3d-engine`
2. `cd vg3d-engine`
3. `npm install`
4. `npm run dev`
5. Visit **http://localhost:5173**

**OR**

4. `npm run build`
5. `npm run preview`
6. Visit **http://localhost:4173**

## What is this?
**vg3d-engine** is a very simple typescript-based animation framework made to mimic that of Project Arrhythmia. It is built as an ECS-Like system, assigning animations to "components", which are then assigned to level objects. This allows for a significant shift in how objects can be treated and reused, such as one object containing several components each with their own functions. This can also be extended to one object housing several other objects, and the ability to manipulate them programmatically however you wish.

There's still a LOT left to do and a lot left to implement, so please bear with me while I solo this project.

## What does it do?
For now, all it can do is play back VGD levels with *most* of their features re-implemented. In the future, I plan to use this engine in a web-based level editor.

## Why did I make it?
Mainly for the challenge, to prove that I could. The previous iteration suffered from huge amounts of scope creep, so a complete rebuild was really the only way to move forward. But in making the last iteration, I learned a lot of valuable lessons about 3D graphics and project management. Mainly to just uh... use libraries that do the matrix math for you. I learned that one the hard way.

### FAQ
**Q: What is this for?**
A: This repository is strictly meant for the animation engine and a GUI to play with it. For now, there is nothing else.

**Q: Can it play workshop levels?**
A: Yes, but many features are missing and/or broken for the moment. Most levels should work, but please report any that don't.

**Q: Isn't this just a copy of PA?**
A: No, this is an engine that just so happens to be able to use the same animation format. Playing levels like you would in the paid game **will not** be implemented. **Ever.**