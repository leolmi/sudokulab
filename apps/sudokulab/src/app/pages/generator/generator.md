# GENERATORE

## definizioni:

- `N`: numero di valori fissi totale dello schema;
- `Ne`: numero di valori fissi esplicitati;
- `Nd`: numero di valori dinamici definiti dall'utente;
- `Nd+`: numero di valori dinamici utili a completare lo schema;


## TIPOLOGIE DI ESECUZIONE

- `single`: (`N`=`Ne`) singolo schema, non richiede operazioni di generazione ma solo puro
  calcolo risolutivo poiché ha solo nomeri fissi;

- `fixed`: (`N`=`Ne`+`Nd`) gli schemi sono gerati sulla base delle possibili combinazioni dei
  possibili valori dinamici;

- `multiple`: (`N`=`Ne`+`Nd`+`Nd+`) il generatore deve aggiungere valori dinamici secondo le
  logiche definite per raggiungere il numero di numeri fissi richiesti, in
  questa casistica sono presenti cicli di valorizzazione aggiuntivi a
  quelli dei numeri dinamici;
  

## PROCESSO DI GENERAZIONE

- `1` valuta la eseguibilità del processo di generazione
  - [`single`]
    - se lo schema è stato risolto passa alla `exit`;
    - se lo schema non è stato risolto prosegue;
  - [`fixed`]: genera `mappa di valorizzazioni` se non è stata già creata
    - se le valorizzazioni sono completate va alla `exit`;
    - altrimenti prosegue;
  - [`multiple`]: genera `mappa degli schemi` se non è stata già creata
    - se gli schemi sono completati va alla `exit`;
    - se le valorizzazioni non sono completate genera `mappa di valorizzazioni` se non è 
      stata già creata e va alla `3`;
    - altrimenti prosegue;

- `2` valuta la completezza dello schema [`multiple`]>[`fixed`];
  - [`single`]
    - prosegue;
  - [`fixed`]
    - prosegue;
  - [`multiple`]
    - se non è completo processo: `generazione schema`;
    - altrimenti prosegue;

- `3` valuta la valorizzazione dello schema [`fixed`]>[`single`];
  - [`single`]
    - prosegue;
  - [`fixed`]
    - se lo schema è valorizzabile processo: `valorizzazione schema`;
    - altrimenti prosegue;
  - [`multiple`]
    - se lo schema è valorizzabile processo: `valorizzazione schema`;
    - altrimenti prosegue;

- `4` processo: `risoluzione schema`;

- `5` se lo schema è risolvibile e risponde alle regole, incrementa i paramerti e processo: `emette lo schema`.
  In questo step popola la cache degli schemi processati; 

- `6` processo `valutazione stato`
  - [`single`]
    - prosegue;
  - [`fixed`]
    - torna alla `1`;
  - [`multiple`]
    - torna alla `1`;

- `exit`. termina il processo;

