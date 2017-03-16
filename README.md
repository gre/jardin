# Concept

Gardening is a daily survival game, some sort of hardcore version of Sim City. It's always about solving problems, your vegetables get attacked by some bugs, you find specific plants to counter specific bugs, you plan your vegetables to be next to each other because they work well together, you need to rotate the culture over years, you need to make compost to fertilize the earth... This is tough work! The ultimate real-life simulation game you ever imagined.

Gardeners always have used pen and paper to plan their years, where to grow what... and so you can keep the map of things over years...  It's great, but i'm a computer guy, and I want to do something better. I don't want to remind things, nor to write down things on a paper that I will lose. Instead, I have Github. I will log everything I do in the computer way, in a JSON, so I can analyze and visualize that data later. It's hard to motivate myself to even do this, but it's going to be beneficial over years. I'll try to improve and simply the way you "input" the logs... currently it's just a JSON!

## Status

I have a very very basic React app at the moment, but the important part is currently the `data/*` files. It's very WIP, and the structure will evolve.

I also want to start developing some devices and sensors to track everything I can and have more and more data!

**Disclaimer: This is highly specific to me, my garden and my climate.** I'm doing it to myself first, if later we can generalize the tools, why not, but not a priority at the moment. I'm trying to keep technical things in English, but the data / content is likely to be in French.

## data folder

`events.json` is an Array of "facts", sorted by date, of every single action related garden (buying seeds, seedling, water tanks, planting, working in garden,...). A fact is an object with at least a `op` field that identify the operation. The idea is you can determine the current state of the garden by reducing all the events (like an history).

`families.json` contains generic stats and useful information for a given species family.


### conventions

**the data is contextualized to Paris area climate** (type Ile-de-France).

**garden unit: 1 = 25cm.**

In `define-plot` the `dims` field is a 2D array. first dimension is the rows. then, it's a `[fromIndex, toIndex]` array.

I need that because my garden plot are not rectangle, I have some tree at the edges, etc..

A plot will be treated and displayed as a grid. Each cell of this grid is a 25cm by 25cm in real world. (like a pixel area).

The `area` field used by ops like `plant-in-plot` select part of the plot grid to apply the operation.
