# When can a sudoku schema be considered _beautiful_?

As a fan of this logic game, this was the question that made me want to dig deeper and build this application.

Online sudoku solvers are countless and writing one is relatively easy. The interesting parts, in my opinion, are these:

- solving a schema while finding a way to evaluate its difficulty objectively;
- indexing schemas, i.e. associating a unique identifier to every possible schema;
- defining what a _beautiful_ schema is;
- building a generator that, based on options and a schema partially designed by the user, can produce _"beautiful"_ sudokus.

To answer the original question, the first step was to build the player, and therefore a solver.


# Player {#help-player}

![sudokulab player](assets/images/sudokulab-player.png)

The player shows the current schema, which the user can solve using the keyboard (on desktop) or the on-screen keypad (on mobile). Any schema from the sorted, filterable catalog can be opened.

The toolbar commands are:

<ul class="toolbar-commands">
  <li><span class="material-icons">playlist_play</span>: opens the <em>Solve</em> menu;
    <ul>
      <li><span class="material-icons">play_arrow</span>: solves the schema completely;</li>
      <li><span class="material-icons">skip_next</span>: solves only the next step;</li>
      <li><span class="material-icons">fast_forward</span>: opens a popup to pick the step the schema should be solved up to;</li>
      <li><span class="material-icons">play_circle</span>: solves the schema until the <em>Try number</em> algorithm would be needed;</li>
      <li><span class="material-icons">support</span>: shows the steps required to reach the next valuation, without revealing its value;</li>
    </ul>
  </li>
  <li><span class="material-icons">border_clear</span>: removes every non-fixed value, restoring the schema to its initial state;</li>
  <li><span class="material-icons">apps_outage</span>: opens the <em>schema keeper</em> tool (see further below) to import previously saved schemas or schemas typed as a string;</li>
  <li><span class="material-icons">casino</span>: opens a random schema from the catalog;</li>
  <li><span class="material-icons">grid_on</span>: opens the schema browser popup;</li>
  <li><span class="material-icons">more_vert</span>: opens the player operations menu;
    <ul>
      <li><span class="material-icons">pin</span>: toggles how the cell candidates are rendered (numbers vs dots);</li>
      <li><span class="material-icons">route</span>: toggles the cell-navigation mode;</li>
      <li><span class="material-icons">delete_sweep</span>: clears every highlight on the grid;</li>
      <li><span class="material-icons">file_download</span>: downloads the serialization of the current schema (json file);</li>
      <li><span class="material-icons">apps</span>: shows or hides the candidates of each cell;</li>
      <li><span class="material-icons">grid_4x4</span>: shows or hides the row and column labels;</li>
      <li><span class="material-icons">light_mode</span> / <span class="material-icons">dark_mode</span>: switches between light and dark theme;</li>
      <li><span class="material-icons">settings_backup_restore</span>: restores the initial settings.</li>
    </ul>
  </li>
</ul>

On the side panels you'll find the schema statistics and the step-viewer (sequence of resolutive moves the engine would apply); the right-hand panel hosts the highlights editor, useful while reasoning over a schema.

<p class="evidence">All the catalog schemas have a <strong>unique solution</strong>.</p>

The schemas list is sortable through the **sortBy** option, which can be:

- difficulty;
- name;
- number of fixed values.

It is also possible to exclude from the list every schema whose resolution required the _Try number_ algorithm, i.e. the one that uses _brute force_ to reach the goal.

Here, in my opinion, lies the foundation of the answer to the search for the most _beautiful_ schema:

<p class="evidence">The hardest schema that can be solved without ever falling back to <em>brute force</em> represents the most interesting logical challenge — therefore, in fact, <strong>the most beautiful schema</strong>!<br><span class="ndr">(personal opinion of the author)</span></p>


# Solving algorithms {#help-algorithms}

The first step toward building a sudoku solver was to design a resolution engine based on a set of classifiable algorithms whose application contributes to the final evaluation, hence to a difficulty score.

{algorithmsCount} algorithms have been identified so far, grouped in two families:

- **resolutive**: they lead to the valuation of a cell;
- **contributive**: they help locate the cells to be valued by removing candidate values.

The algorithms:

::slot[algorithms-list]

The solver applies the algorithms above sequentially until the schema is solved, and each application increments the schema score until it reaches a value that determines its difficulty.

Schemas are tagged with **TX** when their resolution required _Try Number_ to be applied _X_ times.

So a <span class="schema-t">T3</span> schema is one where _brute-force_ was used three times.


# Schema generator {#help-generator}

![sudokulab generator](assets/images/sudokulab-generator.png)

Schema generation lets the user define their own geometry of fixed cells, by entering exact values or markers [ ? ] that will be filled in by the resolution cycles.

The geometry can be entirely defined by the user, only partially defined, or fully delegated to the generator. By specifying a number of fixed values higher than those entered, the procedure will add the missing ones until the requested count is reached.

The toolbar commands are:

<ul class="toolbar-commands">
  <li><span class="material-icons">play_arrow</span>: starts the generation procedure;</li>
  <li><span class="material-icons">stop</span>: stops the generation procedure;</li>
  <li><span class="material-icons">redo</span>: skips to the next schema;</li>
  <li><span class="material-icons">auto_fix_high</span>: generates a single schema according to the current options;</li>
  <li><span class="material-icons">border_clear</span>: clears every value, restoring the schema to its initial state;</li>
  <li><span class="material-icons">lock</span>: <em>lock value</em> — when active, the last valid value entered keeps being inserted into every newly selected cell (handy to mark several markers/values quickly);</li>
  <li><span class="material-icons">more_vert</span> (narrow layout): exposes the theme switcher (<span class="material-icons">light_mode</span> / <span class="material-icons">dark_mode</span>) and the <span class="material-icons">settings_backup_restore</span> command to restore the initial settings.</li>
</ul>

Available options:

- **Total fixed numbers**: target count of fixed cells in the resulting schemas;
- **Symmetry**: applied only when adding the dynamic fixed values (visible when the schema is multi-schema);
- **Difficulty range**: minimum and maximum difficulty for the generated schemas;
- **Allow try algorithm**: when off, schemas requiring _brute force_ are discarded;
- **One result for schema**: only one valid result is kept per base schema;
- **Stop mode**: how the procedure terminates — after _N_ base schemas, after a given number of seconds, or manually;
- **Variants per base schema**: how many variants are produced per base schema;
- **Values mode**: the strategy used to value dynamic fixed cells. It can be _sequential_ (filling cells in order, respecting sudoku rules) or _random_ (random valid values among the available ones for each dynamic cell);
- **Max solve cycles**: hard limit on the number of resolution cycles per attempt;
- **Max fill cycles**: hard limit on the number of fill-in cycles applied to a schema;
- **Use these algorithms**: subset of algorithms allowed during the generation (<span class="material-icons">tune</span> opens a dedicated picker);
- **Number of parallel workers**: how many web workers run in parallel during the generation (changes are applied after a page reload).

On the right side, the list of generated schemas is collected as the procedure produces them; clicking a result opens it in the player.


# Printing schemas {#help-print}

![sudokulab print](assets/images/sudokulab-print.png)

This page lets you print pages with the rendering of schemas from the catalog. After choosing the layout template, you can add pages and assign a schema to each slot simply by clicking an entry in the list on the right while the target slot is selected.

The toolbar commands are:

<ul class="toolbar-commands">
  <li><span class="material-icons">print</span>: starts the print of the configured pages;</li>
  <li><span class="material-icons">delete</span>: removes every page;</li>
  <li><span class="material-icons">dashboard</span>: opens the menu of the available templates.</li>
</ul>


# Schema import {#help-import}

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper.png" alt="sudokulab import">
</div>

The tool allows loading schemas previously downloaded as json files. This way schemas can be exchanged via the export.

With the **_String of numbers_** option, the schema can be entered as the plain string that composes it.

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper-values.png" alt="sudokulab import">
</div>

As an example, consider the following schema:

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sample_01.png" alt="sudokulab import sample">
</div>

The corresponding string is built from the visible numbers, plus zeros for the empty cells, read like any text — left to right, top to bottom:

<p class="codeblock">000780002004500703010000000720...</p>

When importing a schema in the generator, markers can also be expressed using the `x` character.

Using the **_Schema_** button it is possible to enter the values directly into a dedicated grid:

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper-schema.png" alt="sudokulab handle image">
</div>

Image acquisition can also be started, from the dedicated dialog

<div class="image-container">
  <img class="md-img small-image" src="assets/images/take-picture.png" alt="sudokulab camera dialog">
</div>

As you may have noticed, the user can rotate the schema and then launch the decoding phase.

If the decoding succeeds, the recognized schema is opened back in the previous "Check Schema" tool, so any misinterpreted information can be reviewed or fixed.


::slot[project-info]
