- gre: log the events from last year to have more history
- a screen to visualize the events – also render the "comment" field
- allow planning what to do, where. I think there should be a "planned":true added on each event and it's removed when it's actually implemented in the garden.
- try to fix the moon phases. it seems not correct. some offset?
- simplify the 'box' idea. drop the need to "add-seedlings". we don't need it, we just need to track an array of {species,count} – however, 'count' is a bit obscure concept for when you do "à la volée" seedling... i might allow to not use count in that case?
- allow to plant multiple things at same place. basically a *cell* should be an array of that same {species,count}..
- the "plot grid" should allow both to express things as grid, but sometimes we should be able to put things at precise location... I think we might change the internal format... not sure how. maybe an array of `{ species, count, place }` where place can be a location or a shape. shape would all get rendered first.. need to be smart when shape overlaps.. then we can render the exact position things (maybe do some collision detection as well, but less important).
- time in url
- Seedlings screen. we don't care about rendering the actual box where things are.. should be simpler & more efficient with more info. i'm thinking of some sort of table with nice info in it.
- Map screen. make it more interactive. add a mini-map to 'jump' on click. later I even want to make it writable... also add this idea you could control a character top down like a game XD
- List of seeds VS List of families
- Suggestion screen (this is home screen? or maybe some nice dashboard?)
- improve suggestion. they currently don't discard if the plant is already planted somewhere.




# idea for refactoring

- 2 kind of 'seedling places' : plot (where the location is important) VS collection (where we just care about adding/removing from, not localized – no longer track the pots etc..)
- house: inside / outside / outside greenhouse. make it less important in the whole system.
