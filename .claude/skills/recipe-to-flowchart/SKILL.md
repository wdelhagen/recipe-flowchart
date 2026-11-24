---
name: recipe-to-flowchart
description: Convert a recipe (ingredient list and instructions, in any format) into the JSON data format the Recipe Flowchart app renders. Use when adding a new recipe to the app.
---

You convert a recipe (ingredient list + instructions, in any format: plain
text, a website, a photo transcription) into a JSON document for the Recipe
Flowchart viewer. Output ONLY the JSON — no commentary, no markdown fences.

# Model

A recipe is a DAG rendered as a table: ingredients are leaf nodes (rows, in
first-mention order); every instruction that acts on one or more
ingredients/intermediate results is an operation node whose `inputs` are the
node ids it consumes. Operations chain until they converge on the finished
dish. Steps that don't consume a specific ingredient (preheating the oven,
prepping a pan) are not part of the DAG — they go in `prep`.

# Schema

```json
{
  "title": "string, required",
  "servings": "string, optional, e.g. 'serves 12' or 'about 10 servings'",
  "sections": [
    {
      "name": "string, optional — only needed when a recipe has more than one section",
      "prep": ["string, optional — steps with no specific ingredient input, e.g. 'Preheat oven to 350°F (170°C)'"],
      "nodes": [
        {
          "id": "string, unique within the section, short slug",
          "type": "ingredient",
          "label": "string — the ingredient name only, no quantity",
          "qty": "string, optional — the primary-unit quantity as written, e.g. '1 cup' or '2 large'",
          "metric": "string, optional — metric-equivalent quantity, e.g. '200 g'. Omit if not sensibly convertible (e.g. 'to taste').",
          "short": "string — compact name for tight layouts, one or two words, about 11 characters max, e.g. 'bread flour' for 'King Arthur bread flour'",
          "note": "string, optional — short annotation, e.g. 'from <other section name>' when this ingredient is really the finished output of an earlier section"
        },
        {
          "id": "string, unique within the section",
          "type": "op",
          "label": "string — the action, as short as the recipe allows (e.g. 'melt', 'fold in', 'bake 350°F (170°C)\\n30 to 40 min'). Use \\n to split a long label onto two lines.",
          "inputs": ["array of node ids (ingredient or op) this step consumes, required, at least one"]
        }
      ]
    }
  ]
}
```

Rules:

- List every `ingredient` node before any `op` node references it; within
  `nodes`, ingredients should appear in the order the recipe lists them —
  that order becomes the row order in the rendered table.
- An `op` node's `inputs` can mix ingredients and other `op` nodes (using a
  previous step's output is normal — that's how steps chain).
- Split a compound instruction into multiple `op` nodes if it does more than
  one distinct thing that a reader would want to see as separate stages (e.g.
  "melt butter, then stir into the dry mix" is two nodes: `melt` then
  `stir in`, not one).
- Convert quantities to metric (or to US customary if the source recipe is
  metric) using standard conversions. If a confident conversion isn't
  possible (e.g. "a pinch", "to taste"), omit `metric` — don't guess.
- If the recipe has genuinely separate components made independently and then
  combined (a sauce made on the side, dough prepared separately, a topping
  mixed apart from the base), split it into multiple `sections` in the order
  they're introduced. When a later section uses the finished output of an
  earlier section as an ingredient, add it as a normal `ingredient` node in
  the later section with a `note` pointing back to the earlier section's
  `name` — do not create cross-section `inputs` references (inputs only
  reference node ids within the same section).
- Give every `ingredient` node a `short` name. The Bracket view always shows
  it, and the Plate and Ribbon views switch to it once the diagram is
  scrolled sideways, so it must still identify the ingredient on its own.
  Drop brands, preparation notes, and amounts ("kaffir lime leaves, sliced
  thinly" -> "lime leaves"); keep the word that distinguishes it from other
  ingredients ("bread flour", not "flour", when there is also whole wheat
  flour). Abbreviate only when needed to fit ("powd. sugar"). If the label is
  already short, repeat it ("buttermilk").
- Every `op` node must have at least one input. Every node id must be unique
  within its section. Don't invent ingredients, steps, or quantities that
  aren't in the source recipe.
- If the source recipe is ambiguous about exactly which steps merge which
  ingredients, use the most natural reading of the prose (an instruction that
  says "add the eggs" implicitly takes as input whatever the working mixture
  was at that point in the recipe, plus the eggs).

# Worked example

Source recipe:

> Brownies (makes one 8x8 pan)
>
> Butter and flour an 8x8-in pan. Preheat oven to 350°F.
>
> Melt 4 oz unsalted butter. Mix in 1 cup sugar, 1/4 tsp vanilla extract, and
> 1 shot of strong coffee. Mix in 2 eggs. Fold in 1/2 cup flour, 1/3 cup cocoa
> powder, 1/4 tsp baking soda, and 1/4 tsp salt. Bake at 350°F for 30 to 40
> minutes.

Output:

```json
{
  "title": "Brownies",
  "sections": [
    {
      "prep": ["Butter and flour an 8x8-in pan", "Preheat oven to 350°F (170°C)"],
      "nodes": [
        { "id": "butter", "type": "ingredient", "label": "unsalted butter", "qty": "4 oz", "metric": "115 g", "short": "butter" },
        { "id": "sugar", "type": "ingredient", "label": "sugar", "qty": "1 cup", "metric": "200 g", "short": "sugar" },
        { "id": "vanilla", "type": "ingredient", "label": "vanilla extract", "qty": "1/4 tsp.", "metric": "2.5 mL", "short": "vanilla" },
        { "id": "coffee", "type": "ingredient", "label": "strong coffee", "qty": "1 shot", "short": "coffee" },
        { "id": "eggs", "type": "ingredient", "label": "large eggs", "qty": "2", "short": "eggs" },
        { "id": "flour", "type": "ingredient", "label": "all-purpose flour", "qty": "1/2 cup", "metric": "80 g", "short": "flour" },
        { "id": "cocoa", "type": "ingredient", "label": "cocoa powder", "qty": "1/3 cup", "metric": "80 g", "short": "cocoa" },
        { "id": "soda", "type": "ingredient", "label": "baking soda", "qty": "1/4 tsp.", "metric": "1.3 g", "short": "soda" },
        { "id": "salt", "type": "ingredient", "label": "salt", "qty": "1/4 tsp.", "metric": "1.5 g", "short": "salt" },
        { "id": "melt_butter", "type": "op", "label": "melt", "inputs": ["butter"] },
        { "id": "mix1", "type": "op", "label": "mix", "inputs": ["melt_butter", "sugar", "vanilla", "coffee"] },
        { "id": "mix2", "type": "op", "label": "mix", "inputs": ["mix1", "eggs"] },
        { "id": "fold1", "type": "op", "label": "fold in", "inputs": ["mix2", "flour", "cocoa", "soda", "salt"] },
        { "id": "bake1", "type": "op", "label": "bake 350°F (170°C)\n30 to 40 min", "inputs": ["fold1"] }
      ]
    }
  ]
}
```

# Viewer

To add the recipe to the app, insert the JSON into the `RECIPES` object in
`index.html`, keyed by a short slug (e.g. `"brownies": { ... }`). The recipe
selector lists every entry in that object.
