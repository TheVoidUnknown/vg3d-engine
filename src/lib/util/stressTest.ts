import EaseFunctions from "$lib/engine/core/easing/Easing.const";
import type Editor from "$lib/engine/core/editor/Editor";

import type { Easing } from "$lib/engine/core/easing/Easing.types";

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export default function spam(editor: Editor, numObjects: number, seed: number) {
  const random = mulberry32(seed);
  const getRandom = (min: number, max: number) => random() * (max - min) + min;
  const randomEasing = () => Object.keys(EaseFunctions)[Math.round(getRandom(0, 22))] as Easing;

  const createdObjects = [];

  console.log(`Creating ${numObjects} objects with seed: ${seed}...`);

  for (let i = 0; i < numObjects; i++) {
    const obj = editor.newObject();
    const animationComponent = obj.getComponent("Animation3D");

    if (animationComponent) {
      animationComponent
        .addKeyframe("Rotation", {
          data: [getRandom(0, 360), getRandom(0, 360), getRandom(0, 360)],
          time: getRandom(5, 10),
          easing: randomEasing()
        })
        .addKeyframe("Move", {
          data: [getRandom(-40, 40), getRandom(-30, 30), getRandom(-40, 40)],
        })
        .addKeyframe("Scale", {
          data: [getRandom(0.5, 2), getRandom(0.5, 2), getRandom(0.5, 2)],
        })
        .addKeyframe("Scale", {
          data: [getRandom(0.5, 2), getRandom(0.5, 2), getRandom(0.5, 2)],
          time: getRandom(1, 10),
          easing: randomEasing()
        })
        .addKeyframe("Color", {
          data: [Math.floor(getRandom(0, 8)), Math.floor(getRandom(0, 8))],
        })
        .addKeyframe("Color", {
          data: [Math.floor(getRandom(0, 8)), Math.floor(getRandom(0, 8))],
          time: getRandom(5, 10),
          easing: randomEasing()
        });
      
      for (let i = 0; i < getRandom(0, 500); i++) {
        animationComponent.addKeyframe("Move", {
          data: [getRandom(-40, 40), getRandom(-30, 30), getRandom(-40, 40)],
          time: getRandom(1, 10),
          easing: randomEasing()
        })
      }
    }
    createdObjects.push(obj);
  }

  // Randomly chain some of the objects together
  for (let i = 1; i < createdObjects.length; i++) {
    if (random() < 0.5) {
      const parentIndex = Math.floor(random() * i);
      const childAnimationComponent = createdObjects[i].getComponent("Animation3D");

      if (childAnimationComponent) {
        childAnimationComponent.parentId = createdObjects[parentIndex].id;
      }
    }
  }

  return createdObjects;
}