# Quando uno schema di sudoku può dirsi _bello_?

Da appassionato di questo gioco logico è la domanda che mi ha spinto ad approfondire e a costruire questa applicazione.

I solver di sudoku online sono innumerevoli e scriverne uno è relativamente semplice. Le parti interessanti, secondo me, sono queste:

- risolvere uno schema trovando un modo per valutarne la difficoltà in modo oggettivo;
- indicizzare gli schemi, cioè associare un identificativo unico a ogni schema possibile;
- definire cosa significhi che uno schema è _bello_;
- costruire un generatore che, in base alle opzioni e a uno schema parzialmente disegnato dall'utente, produca sudoku _"belli"_.

Per rispondere alla domanda originale, il primo passo è stato costruire il player e quindi un solver.


# Player {#help-player}

![sudokulab player](assets/images/sudokulab-player.png)

Il player mostra lo schema corrente, che l'utente può risolvere usando la tastiera (su desktop) o il tastierino a schermo (su mobile). È possibile aprire qualsiasi schema dal catalogo, ordinabile e filtrabile.

I comandi della toolbar sono:

<ul class="toolbar-commands">
  <li><span class="material-icons">playlist_play</span>: apre il menu <em>Risoluzione</em>;
    <ul>
      <li><span class="material-icons">play_arrow</span>: risolve completamente lo schema;</li>
      <li><span class="material-icons">skip_next</span>: risolve solo il passo successivo;</li>
      <li><span class="material-icons">fast_forward</span>: apre un popup per scegliere fino a quale passo risolvere lo schema;</li>
      <li><span class="material-icons">play_circle</span>: risolve lo schema finché non sarebbe necessario l'algoritmo <em>Try number</em>;</li>
      <li><span class="material-icons">support</span>: mostra i passi necessari per arrivare alla prossima valorizzazione, senza rivelarne il valore;</li>
    </ul>
  </li>
  <li><span class="material-icons">border_clear</span>: rimuove tutti i valori non fissi, riportando lo schema allo stato iniziale;</li>
  <li><span class="material-icons">apps_outage</span>: apre il tool <em>schema keeper</em> (vedi più avanti) per importare schemi precedentemente salvati o digitati come stringa;</li>
  <li><span class="material-icons">casino</span>: apre uno schema casuale del catalogo;</li>
  <li><span class="material-icons">grid_on</span>: apre il popup di browse degli schemi;</li>
  <li><span class="material-icons">more_vert</span>: apre il menu operazioni del player;
    <ul>
      <li><span class="material-icons">pin</span>: cambia come vengono renderizzati i candidati di cella (numeri o punti);</li>
      <li><span class="material-icons">route</span>: cambia la modalità di navigazione tra celle;</li>
      <li><span class="material-icons">delete_sweep</span>: pulisce tutte le evidenze sulla griglia;</li>
      <li><span class="material-icons">file_download</span>: scarica la serializzazione dello schema corrente (file json);</li>
      <li><span class="material-icons">apps</span>: mostra o nasconde i candidati delle celle;</li>
      <li><span class="material-icons">grid_4x4</span>: mostra o nasconde le etichette di riga e colonna;</li>
      <li><span class="material-icons">light_mode</span> / <span class="material-icons">dark_mode</span>: passa tra tema chiaro e scuro;</li>
      <li><span class="material-icons">settings_backup_restore</span>: ripristina le impostazioni iniziali.</li>
    </ul>
  </li>
</ul>

Nei pannelli laterali sono presenti le statistiche dello schema e lo step-viewer (sequenza di mosse risolutive che il motore applicherebbe); il pannello destro ospita l'editor di evidenze, utile mentre si ragiona su uno schema.

<p class="evidence">Tutti gli schemi del catalogo hanno <strong>soluzione unica</strong>.</p>

La lista degli schemi è ordinabile tramite l'opzione **sortBy**, che può essere:

- difficoltà;
- nome;
- numero di valori fissi.

È anche possibile escludere dalla lista ogni schema la cui risoluzione abbia richiesto l'algoritmo _Try number_, quello che usa _brute force_ per arrivare alla soluzione.

Qui, secondo me, sta la base della risposta alla ricerca dello schema più _bello_:

<p class="evidence">Lo schema più difficile risolvibile senza mai ricorrere al <em>brute force</em> rappresenta la sfida logica più interessante — e quindi, di fatto, <strong>lo schema più bello</strong>!<br><span class="ndr">(opinione personale dell'autore)</span></p>


# Algoritmi di risoluzione {#help-algorithms}

Il primo passo verso la costruzione di un solver per sudoku è stato progettare un motore di risoluzione basato su un insieme di algoritmi classificabili, la cui applicazione contribuisce alla valutazione finale, e quindi al punteggio di difficoltà.

Finora sono stati identificati {algorithmsCount} algoritmi, raggruppati in due famiglie:

- **risolutivi**: portano alla valorizzazione di una cella;
- **contributivi**: aiutano a localizzare le celle da valorizzare rimuovendo valori candidati.

Gli algoritmi:

::slot[algorithms-list]

Il solver applica gli algoritmi sopra in sequenza finché lo schema non è risolto, e ciascuna applicazione incrementa il punteggio dello schema fino a raggiungere un valore che ne determina la difficoltà.

Gli schemi sono marcati con **TX** quando la loro risoluzione ha richiesto _X_ applicazioni di _Try Number_.

Quindi uno schema <span class="schema-t">T3</span> è uno in cui il _brute-force_ è stato usato tre volte.


# Generatore di schemi {#help-generator}

![sudokulab generator](assets/images/sudokulab-generator.png)

La generazione di schemi permette all'utente di definire la propria geometria di celle fisse, inserendo valori esatti o segnaposti [ ? ] che verranno riempiti dai cicli di risoluzione.

La geometria può essere completamente definita dall'utente, definita solo parzialmente, o demandata interamente al generatore. Specificando un numero di valori fissi superiore a quelli inseriti, la procedura aggiungerà i mancanti fino a raggiungere il conteggio richiesto.

I comandi della toolbar sono:

<ul class="toolbar-commands">
  <li><span class="material-icons">play_arrow</span>: avvia la procedura di generazione;</li>
  <li><span class="material-icons">stop</span>: ferma la procedura di generazione;</li>
  <li><span class="material-icons">redo</span>: salta allo schema successivo;</li>
  <li><span class="material-icons">auto_fix_high</span>: genera un singolo schema secondo le opzioni correnti;</li>
  <li><span class="material-icons">border_clear</span>: pulisce tutti i valori, riportando lo schema allo stato iniziale;</li>
  <li><span class="material-icons">lock</span>: <em>lock value</em> — quando attivo, l'ultimo valore valido inserito continua a essere inserito in ogni nuova cella selezionata (utile per marcare velocemente più segnaposti/valori);</li>
  <li><span class="material-icons">more_vert</span> (layout stretto): espone lo switch del tema (<span class="material-icons">light_mode</span> / <span class="material-icons">dark_mode</span>) e il comando <span class="material-icons">settings_backup_restore</span> per ripristinare le impostazioni iniziali.</li>
</ul>

Opzioni disponibili:

- **Total fixed numbers**: numero target di celle fisse negli schemi risultanti;
- **Symmetry**: applicata solo all'aggiunta dei valori fissi dinamici (visibile quando lo schema è multi-schema);
- **Difficulty range**: difficoltà minima e massima per gli schemi generati;
- **Allow try algorithm**: se disattivata, gli schemi che richiedono _brute force_ vengono scartati;
- **One result for schema**: viene mantenuto un solo risultato valido per schema base;
- **Stop mode**: come termina la procedura — dopo _N_ schemi base, dopo un certo numero di secondi, o manualmente;
- **Variants per base schema**: quante varianti vengono prodotte per ogni schema base;
- **Values mode**: la strategia usata per valorizzare le celle fisse dinamiche. Può essere _sequenziale_ (riempie le celle in ordine, rispettando le regole del sudoku) o _casuale_ (valori validi scelti a caso tra quelli disponibili per ogni cella dinamica);
- **Max solve cycles**: limite massimo di cicli di risoluzione per tentativo;
- **Max fill cycles**: limite massimo di cicli di riempimento applicati a uno schema;
- **Use these algorithms**: sottoinsieme di algoritmi consentiti durante la generazione (<span class="material-icons">tune</span> apre un picker dedicato);
- **Number of parallel workers**: quanti web worker girano in parallelo durante la generazione (le modifiche sono effettive dopo un reload della pagina).

Sul lato destro, la lista degli schemi generati viene raccolta mano a mano che la procedura li produce; cliccando un risultato lo si apre nel player.


# Stampa schemi {#help-print}

![sudokulab print](assets/images/sudokulab-print.png)

Questa pagina consente di stampare pagine con il rendering di schemi del catalogo. Dopo aver scelto il template di layout, si possono aggiungere pagine e assegnare uno schema a ciascuno slot semplicemente cliccando una voce della lista a destra mentre lo slot di destinazione è selezionato.

I comandi della toolbar sono:

<ul class="toolbar-commands">
  <li><span class="material-icons">print</span>: avvia la stampa delle pagine configurate;</li>
  <li><span class="material-icons">delete</span>: rimuove tutte le pagine;</li>
  <li><span class="material-icons">dashboard</span>: apre il menu dei template disponibili.</li>
</ul>


# Importazione schemi {#help-import}

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper.png" alt="sudokulab import">
</div>

Il tool consente di caricare schemi precedentemente scaricati come file json. In questo modo gli schemi possono essere scambiati tramite l'export.

Con l'opzione **_String of numbers_**, lo schema può essere inserito come la semplice stringa che lo compone.

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper-values.png" alt="sudokulab import">
</div>

A titolo di esempio, considera lo schema seguente:

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sample_01.png" alt="sudokulab import sample">
</div>

La stringa corrispondente è costruita dai numeri visibili, più degli zeri per le celle vuote, letta come un testo qualsiasi — da sinistra a destra, dall'alto in basso:

<p class="codeblock">000780002004500703010000000720...</p>

Quando si importa uno schema nel generatore, i segnaposti possono anche essere espressi usando il carattere `x`.

Tramite il pulsante **_Schema_** è possibile inserire i valori direttamente in una griglia dedicata:

<div class="image-container">
  <img class="md-img small-image" src="assets/images/sudokulab-keeper-schema.png" alt="sudokulab handle image">
</div>

È inoltre possibile avviare l'acquisizione da immagine dal dialog dedicato

<div class="image-container">
  <img class="md-img small-image" src="assets/images/take-picture.png" alt="sudokulab camera dialog">
</div>

Come puoi notare, l'utente può ruotare lo schema e poi lanciare la fase di decodifica.

Se la decodifica va a buon fine, lo schema riconosciuto viene riaperto nel tool precedente "Check Schema", in modo da poter rivedere o correggere eventuali informazioni interpretate male.


::slot[project-info]
