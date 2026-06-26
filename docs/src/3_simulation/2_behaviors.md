# Verhaltensweisen

## Führung zuweisen

### Auf einen Blick

Durch diese Verhaltensweise wird eine Person aus dem im Bereich verfügbaren Personal ausgewählt, die die lokale Führung übernimmt. Dieses Personal ist mit der Führungsrolle gebunden und kann keine anderen Aufgaben wie die Behandlung von Patienten wahrnehmen.

Die Führungskraft wird als das am höchsten qualifizierte Personal nach der folgenden Rangfolge (1 = höchste Qualifikation) gewählt:

1. Gruppenführer
2. Notfallsanitäter
3. Rettungssanitäter
4. Sanitäter
5. Notarzt

Erreicht höher qualifiziertes Personal den Bereich, wechselt die Führung.

Die simulierte Führungskraft beantwortet Anfragen per Funk.

> [!WARNING]
> Ohne Führungskraft kann ein simulierter Bereich nur eingeschränkt handeln. Viele Funktionen, insbesondere die Erreichbarkeit per Funk, sind ohne Führungskraft nicht gegeben.

### Einstellungen

Diese Verhaltensweise hat keine Einstellungsmöglichkeiten. In der Ansicht dieser Verhaltensweise wird der Typ des aktuell führenden Personals angezeigt.

### Abhängigkeiten

Damit eine Führungskraft zugewiesen werden kann, muss sich Personal im simulierten Bereich befinden. Dabei wird nur ausgestiegenes Personal berücksichtigt. Kommt das Personal im Fahrzeug an, ist daher die Verhaltensweise [Fahrzeuge entladen](#fahrzeuge-entladen) erforderlich.

## Fahrzeuge entladen

### Auf einen Blick

Lässt Personal aus allen Fahrzeugen aussteigen, die diesen Bereich erreichen.

Personal, das sich in Fahrzeugen befindet, kann keine Aufgaben übernehmen. Umgekehrt können unbesetzte Fahrzeuge nicht sofort losfahren. Daher ist diese Verhaltensweise zum Beispiel für Patientenablagen essentiell, für Bereitstellungsräume allerdings störend.

### Einstellungen

#### Aussteigedauer

Die Aussteigedauer gibt an, wie lange das Personal braucht, um das Fahrzeug zu verlassen. Die Zeit läuft pro Fahrzeug und startet mit der Ankunft im Bereich.

Während die Zeit abläuft, ist das Fahrzeug blockiert. Nach Ablauf der Zeit steht das Personal im Bereich zur Verfügung.

> [!TIP]
> Über längere Ausstiegszeiten können zum Beispiel unwegsames Gelände, große Bereiche oder unübersichtliche Situationen abgebildet werden, bei denen das Personal nicht sofort nach Ankunft im Bereich verfügbar ist.

## Berichte erstellen

### Auf einen Blick

Dient dem Austausch von Informationen (zum Beispiel die Anzahl verfügbarer Fahrzeuge) des simulierten Bereichs mit den Übungsteilnehmenden per Funk. Eine vollständige Liste der Informationen ist in den Details aufgeführt.

Teilnehmende können Informationen einmalig abrufen oder regelmäßige Aktualisierungen anfordern. Zudem werden bestimmte Ereignisse automatisch per Funk mitgeteilt.

### Einstellungen

#### Bericht erstellen

Ermöglicht das Abrufen einer Information der Wahl.

> [!TIP]
> Für eine laufende Übung empfiehlt sich die Verwendung der Benutzeroberfläche für [Schnittstellenfunker](3_ifs.md). Diese ist speziell für den Austausch per Funk gestaltet.

### Abhängigkeiten

Ein simulierter Bereich kann Anfragen nach Informationen nur dann beantworten, wenn es eine Führungskraft gibt. Daher ist die Verhaltensweise [Führung zuweisen](#führung-zuweisen) zwingend erforderlich.

Darüber hinaus können einzelne Informationen von bestimmten Verhaltensweisen abhängen. So ist zum Beispiel der _Behandlungsstatus_ nur in Kombination mit der Verhaltensweise [Patienten behandeln](#patienten-behandeln) verfügbar.

### Details

Die folgenden Informationen können abgerufen werden:

- **Anzahl Material/Patienten/Fahrzeuge/Personal**, jeweils aufgeschlüsselt nach Typ bzw. Sichtungskategorie
- **Aktuell benötigte Fahrzuge**, ergibt sich aus anderen Verhaltensweisen (zum Beispiel Fahrzeuge bereitstellen, Patienten behandeln). Unterschiedet zwischen Fahrzeugen, die bereits auf Anfahrt sind und solchen, die zusätzlich benötigt werden
- **Anzahl aus diesem Bereich in Krankenhäuser abtransportierter Patienten**
- **Transferverbindungen**: Welche anderen Bereiche von diesem aus angefahren werden können
- **Anzahl unter dieser Transportorganisation in Krankenhäuser abtransportierter Patienten**
- **Behandlungsstatus**: Der Fortschritt der Verhaltensweise [Patienten behandeln](#patienten-behandeln) in diesem Bereich. Unterscheidet zwischen
    - Zählen
    - Vorsichten
    - Behandlung mit fehlendem Personal
    - Erstversorgung sichergestellt
- **Nutzung der Fahrzeuge**: Gibt an, wie viele Fahrzeuge in diesem Bereich für welche Aufgabe genutzt werden. Aufgaben umfassen zum Beispiel
    - Aussteigen (Fahrzeug ist gerade angekommen und wird noch nicht genutzt)
    - Behandlung von Patienten
    - keine Aufgabe, wartet auf Nutzung

Zudem können automatisch Funksprüche bei folgenden Ereignissen erzeugt werden (pro Ereignis aktivierbar):

- Wenn sich der Behandlungsstatus ändert
- Wenn in dieser Patientenablage alle Patienten einer Sichtungskategorie abtransportiert wurden
- Wenn in allen Patientenablagen, die von dieser Transportorganisation verwaltet werden, alle Patienten einer Sichtungskategorie abtransportiert wurden

## Patienten behandeln

### Auf einen Blick

Verwaltet die Behandlung aller Patienten im jeweiligen simulierten Bereich. Alle Patienten werden vorgesichtet und anschließend Personal zur Behandlung zugeteilt. Reicht das vor Ort verfügbare Personal nicht aus, wird zusätzliches Personal angefordert.

### Einstellungen

#### Häufigkeit der Zuteilungs-Berechnung

Über diese Optionen kann eingestellt werden, wie oft die Zuteilung von Personal zu Patienten neu ausgewertet werden soll. Dadurch kann auf Veränderungen von Patienten reagiert werden, wenn diese mehr oder weniger Personal benötigen. Unabhängig davon erfolgt sofort eine neue Zuteilung, wenn neues Personal im simulierten Bereich ankommt oder sich die Phase der Behandlung ändert.

Für jede Phase kann ein eigenes Intervall festgelegt werden, sodass in instabilen Zuständen (zum Beispiel während der Vorsichtung) häufiger neu zugeteilt wird, als wenn die Erstversorgung sichergestellt ist. Die einzelnen Phasen sind in den Details beschrieben.

#### Zähldauer pro Patient

Gibt an, wie lange die Erkundung dauert. Ein höherer Wert kann zum Beispiel genutzt werden, um ein unübersichtliches Gelände oder geschlossenes Gebäude abzubilden.

### Abhängigkeiten

Eine Behandlung von Patienten findet nur statt, wenn der simulierte Bereich über eine Führungskraft verfügt. Daher ist die Verhaltensweise [Führung zuweisen](#führung-zuweisen) zwingend erforderlich.

Damit zusätzliches Personal angefordert werden kann, muss die Verhaltensweise [Personal nachfordern](#personal-nachfordern) ausgewählt sein, welche ihrerseits [Fahrzeuge anfordern](#fahrzeuge-anfordern) benötigt. Fehlt mindestens eine dieser Verhaltensweisen, findet die Behandlung ausschließlich mit dem bereits vor Ort befindlichen Personal oder manuell hinzugefügtem Personal statt.

### Details

Die Behandlung durchläuft vier Phasen:

1. Erkunden
2. Vorsichten
3. Behandeln, Personal fehlt
4. Erstversorgung sichergestellt

Damit die Behandlung starten kann, muss eine Führungskraft und mindestens eine weitere Person vor Ort sein. Ist diese Bedingung nicht erfüllt, wird die Behandlung unterbrochen.

Bei der Erkundung wird der Bereich nach Patienten abgesucht und diese gezählt. Die Dauer der Erkundung richtet sich nach der Anzahl der Patienten und der Dauer pro Patient aus den Einstellungen, die Anzahl des verfügbaren Personals ist unerheblich. Erst nachdem die Erkundung abgeschlossen ist, können Anfragen nach der Anzahl Patienten beantwortet werden und die Vorsichtung beginnt.

In der Vorsichtung wird jedem Patienten eine Sichtungskategorie zugewiesen. Jedes verfügbare Personal kann nur einen Patienten zur gleichen Zeit vorsichten und benötigt dazu eine Minute. Die Vorsichtung hat Priorität über der Behandlung von Patienten, sodass während dieser Phase üblicherweise keine Behandlung stattfindet, außer, es ist noch Personal übrig. Nach Abschluss dieser Phase werden Anfragen nach der Anzahl Patienten nach Sichtungskategorie aufgeschlüsselt und die Behandlung beginnt.

Die Behandlung erfolgt priorisiert nach Sichtungskategorie. Es wird angestrebt, das Personal wie folgt zu verteilen:

- Rote Patienten: Ein Notfallsanitäter und ein Rettungssanitäter exklusiv, sowie ein Notarzt über mehrere rote Patienten geteilt
- Gelbe Patienten: Ein Rettungssanitäter exklusiv
- Grüne Patienten: Ein Sanitäter über mehrere grüne Patienten geteilt

Ist nicht genügend Personal verfügbar, kann Personal auf bis zu zwei Patienten aufgeteilt oder durch höher qualifiziertes Personal ersetzt werden. Die aktuelle Zuteilung kann unter "Informationen" eingesehen werden.

Ist der oben genannte Behandlungsschlüssel nicht erreicht, befindet sich die Behandlung im Zustand _Personal fehlt_ und es wird die Zahl fehlender Kräfte an die Verhaltensweise _Personal nachfordern_ übergeben. Sobald der Schlüssel erreicht wurde, findet ein Übergang in den Zustand _Erstversorgung sichergestellt_ statt.

Werden dem simulierten Bereich neue Patienten hinzugefügt, fällt der Fortschritt in die Phase _Erkunden_ zurück. Dabei wird die Zeit für Erkundung und Vorsichtung nur in Abhängigkeit der Anzahl neuer Patienten ermittelt. Ist genügend Personal vor Ort, werden die alten Patienten währenddessen weiterhin behandelt.

## Personal nachfordern

### Auf einen Blick

Diese Verhaltensweise "übersetzt" fehlendes Personal in Fahrzeuganfragen, die dann von der Simulation weiterverarbeitet werden können. Personalbedarf kann von anderen Verhaltensweisen des gleichen simulierten Bereichs angemeldet werden und wir dann von dieser Verhaltensweise weiter verarbeitet.

So benötigt beispielsweise die Verhaltensweise [Patienten behandeln](#patienten-behandeln) Personal, während der Bereitstellungsraum nur Fahrzeuge zur Verfügung stellen kann. [Personal nachfordern](#personal-nachfordern) ermittelt, wie viele Fahrzeuge welchen Typs benötigt werden, um das gewünschte Personal zu erhalten.

### Einstellungen

Es ist möglich, die verfügbaren Fahrzeugtypen nach Priorität zu ordnen oder einzelne Typen komplett auszuschließen. Wird zum Beispiel ein Notfallsanitäter benötigt, den es sowohl im RTW als auch im NEF gibt, wird das Fahrzeug mit der höheren Priorität ausgewählt und angefordert.

Da die meisten Fahrzeuge über mehrere Typen von Personal verfügen, kann es vorkommen, dass nicht das Fahrzeug mit der höchsten Priorität gewählt wird. Dazu ein Beispiel:

- Benötigt: 1 NFS, 1 NA
- Fahrzeugprioritäten:
    1. RTW (1 NFS, 1 RS)
    2. KTW (1 RS, 1 San)
    3. NEF (1 NA, 1 NFS)
- Angefordert: 1 NEF

Obwohl ein NFS benötigt wird und das Fahrzeug mit der höchsten Priorität (RTW) über einen NFS verfügt, wurde kein RTW bestellt. Für den NA _muss_ ein NEF angefordert werden und das NEF verfügt auch über den NFS. Damit ist es nicht notwendig, zusätzlich einen RTW anzufordern.

### Abhängigkeiten

Da Anfragen nur von Personal zu Fahrzeugen übersetzt werden, ist zusätzlich die Verhaltensweise [Fahrzeuge anfordern](#fahrzeuge-anfordern) zwingend erforderlich.

## Fahrzeuge anfordern

### Auf einen Blick

Sammelt Fahrzeuganfragen von allen Verhaltensweisen im simulierten Bereich an und gibt diese gesammelt weiter, um die gewünschten Fahrzeuge zu erhalten.

### Einstellungen

#### Anfrageziel

Hiermit kann eingestellt werden, an den die Anfragen weitergegeben werden. Bei Auswahl der Option _Die Trainierenden_ wird die Anfrage als Funkspruch angezeigt, sodass Übungsteilnehmende über die Anfrage entscheiden können.

Alternativ kann die Anfrage direkt an einen anderen simulierten Bereich weitergegeben werden, der als Bereitstellungsraum interagiert. In diesem Fall haben die Übungsteilnehmenden keine Möglichkeit, über die Aufteilung von Fahrzeugen zu entscheiden.

#### Zeitintervalle

_Minimaler Zeitabstand zwischen mehreren Anfragen_ gibt an, wie lange die Verhaltensweisen Anfragen intern sammelt, bevor sie an das eingestellte Anfrageziel weitergegeben werden. Gibt es nach Ablauf der Zeit keine offenen Anfragen, wird auch keine Anfrage gestellt.

_Dauer, nachdem eine nicht eingelöste Zusage von Fahrzeugen invalidiert werden soll_: Gibt die Verhaltensweise eine Anfrage an die Übungsteilnehmenden weiter, können diese zurückmelden, ob der simulierte Bereich die angefragten Fahrzeuge erhalten wird oder nicht. Fahrzeuge, die dem simulierten Bereich zugesagt wurden, werden für die hier eingestellte Zeit nicht erneut angefragt. Läuft die Zeit hab, erfolgt eine neue Anfrage.

### Abhängigkeiten

Diese Verhaltensweise benötigt keine anderen Verhaltensweisen.

## Fahrzeuge versenden

### Auf einen Blick

Lässt Fahrzeuge zu anderen Orten (verbundene Transferpunkte, simulierte Bereiche oder Krankenhäuser) anfahren und verwaltet alle Fahrzeug-Ausfahrten. Dies umfasst die Simulation von Einstiegszeiten sowie, dass immer nur ein Fahrzeug fahren kann.

Der Auftrag zum Versenden kann von den Übungsteilnehmenden oder anderen Verhaltensweisen kommen.

### Einstellungen

#### Ladezeit pro Patient

Gibt die Zeit an, die benötigt wird, den Patienten zu verladen, falls ein Patient im Fahrzeug transportiert werden soll. Das Fahrzeug kann erst nach Ablauf dieser Zeit abfahren.

#### Ladezeit pro Personal

Gibt die Zeit an, die benötigt wird, das Personal eines Fahrzeugs einsteigen zu lassen, falls es ausgestiegen ist. Das Fahrzeug kann erst nach Ablauf dieser Zeit abfahren.

#### Zeit zwischen zwei Ausfahrten

Gibt an, wie lange ein Fahrzeug warten muss, wenn vorher schon ein anderes Fahrzeug abgefahren ist. Diese Option kann zum Beispiel enge Straßen oder unebenes Gelände simulieren.

### Abhängigkeiten

Diese Verhaltensweise benötigt keine anderen Verhaltensweisen.

### Details

Die Aufträge, Fahrzeuge abfahren zu lassen, können von verschiedenen Parteien kommen:

- Übungsteilnehmende können beispielsweise einen simulierten Bereitstellungsraum auffordern, ein NEF zu einer Patientenablage zu schicken, die noch einen Notarzt benötigt
- Die Verhaltensweise [Fahrzeuge verteilen](#fahrzeuge-verteilen) eines Bereitstellungsraums möchte beispielsweise einen RTW an jede Patientenablage schicken
- Die Verhaltensweise [Patienten abtransportieren](#patienten-abtransportieren) möchte einen Patienten ins Krankenhaus bringen und benötigt dafür ein Fahrzeug

Die oben genannte Liste ist nicht vollständig. Einige weitere Verhaltensweisen nutzen [Fahrzeuge versenden](#fahrzeuge-versenden). Aufträge von anderen Verhaltensweisen werden innerhalb der Simulation automatisch weitergegeben. Übungsteilnehmende nennen ihren Auftrag dem Schnittstellenfunker, der den Auftrag dann an die Simulation weitergibt.

Bei jeder Auftrag kann angegeben werden…

- …wie viele Fahrzeuge welchen Typs…
- …ob und mit welchen Patienten…
- …mit welchem Auftrag…
- …an welches Ziel…

…gesendet werden sollen. Der Auftrag ist dabei aktuell nur innerhalb der Simulation verfügbar und kann nicht von Übungsteilnehmenden gesetzt werden.

Alle Aufträge werden der Reihe nach abgearbeitet. Jedes Fahrzeug wird zuerst der eingestellten Zeiten beladen. Ist das Fahrzeug fertig beladen, kommt es in die Warteschlange für die Ausfahrt, aus dem im eingestellten Intervall Fahrzeuge die gewünschten Zielorte anfahren. Die Fahrt zum Zielort benötigt dann noch die auf der Transferverbindung eingestellte Zeit.

Auf der Seite der Verhaltensweise ist unter _Informationen_ eine Liste aller Fahrzeuge aufgeführt, die gerade beladen werden oder auf Ausfahrt warten.

## Fahrzeuge verteilen

### Auf einen Blick

Verteilt Fahrzeuge aus dem eigenen simulierten Bereich gleichmäßig auf mehrere simulierte Bereiche.

Diese Verhaltensweise kann beispielsweise genutzt werden, damit alle Patientenablagen zu Beginn eine Grundversorgung an RTWs aus dem Bereitstellungsraum erhalten.

Es können nur Fahrzeuge verteilt werden, die bereits vor Ort im Bereich sind. Sind nicht genügend Fahrzeuge vorhanden, pausiert die Verteilung.

### Einstellungen

#### Zu Verteilende Fahrzeuge

Welche Fahrzeugtypen verteilt werden sollen. Pro Typ kann anschließend festgelegt werden, wie viele Fahrzeuge von diesem Typ insgesamt (d.h., im Summe über alle Ziel-Bereiche) verteilt werden sollen, bevor die automatische Verteilung stoppt.

#### Fahrzeuge erhaltende Bereiche

Welche Fahrzeuge die Bereiche erhalten sollen.

### Abhängigkeiten

Damit die Fahrzeuge die Zielbereiche anfahren können, muss im Startbereich die Verhaltensweise [Fahrzeuge versenden](#fahrzeuge-versenden) aktiv sein.

## Fahrzeuganfragen beantworten

### Auf einen Blick

Stellt Fahrzeuge für andere Bereiche zur Verfügung, wenn diese nach Fahrzeugen fragen.

Durch diese Verhaltensweise kann ein simulierter Bereich als Bereitstellungsraum genutzt werden. Anfragen können zum Beispiel von der Verhaltensweise [Fahrzeuge anfordern](#fahrzeuge-anfordern) einer Patientenablage kommen.

### Einstellungen

Diese Verhaltensweise bietet keine Einstellungen. Es werden die angefragten Fahrzeuge, falls vor Ort verfügbar, dem anfragenden Bereich zur Verfügung gestellt.

### Abhängigkeiten

Diese Verhaltensweise benötigt die Verhaltensweise [Fahrzeuge versenden](#fahrzeuge-versenden), um die Abfahrt der Fahrzeuge zu koordinieren.

## Transportorganisation

### Auf einen Blick

Die Transportorganisation verwaltet den Abtransport von Patienten über mehrere simulierte Patientenablagen hinweg. Dazu werden die Patientenzahlen abgefragt und Fahrzeuge zum Transport der Patienten bei einem anderen simulierten Bereich angefragt.

### Einstellungen

#### Status

Der Abtransport von Patienten kann gestartet und gestoppt werden. Anfangs ist der Transport gestoppt, sodass Patienten erst abtransportiert werden, wenn dies von der Einsatzleitung vorgegeben wird.

#### Ziel für Fahrzeuganfragen

Bei welchem anderen Bereich die Fahrzeuge für den Abtransport abgerufen werden sollen.

> [!IMPORTANT]
> Diese Einstellung ist unabhängig von der Option _Anfrageziel_ der Verhaltensweise [Fahrzeuge anfordern](#fahrzeuge-anfordern). Es ist aktuell nicht möglich, die Transportorganisation Fahrzeuge bei den Übungsteilnehmenden anfragen zu lassen, nur direkte Anfragen bei einem anderen simulierten Bereich sind möglich.

#### Abtransport bis

Bis zu welcher Sichtungskategorie Patienten abtransportiert werden sollen. Der Transport startet immer bei den dringendsten Patienten ("rot") und endet, wenn alle Patienten der hier ausgewählten Sichtungskategorie abtransportiert wurde.

#### Verwaltete simulierte Bereiche

Für welche simulierten Bereiche diese Transportorganisation den Abtransport verwalten soll. Nur diese Bereiche erhalten Fahrzeuge zum Transport, andere Bereiche werden von dieser Transportorganisation ignoriert. In großen Szenarien können mehrere unterschiedliche Transportorganisationen für verschiedene Gruppen simulierter Patientenablagen eingesetzt werden.

#### Fahrzeuge für den Patiententransport

Gibt an, welche Fahrzeuge für den Transport für Patienten der verschiedenen Sichtungskategorien geeignet sind. Es werden nur geeignete Fahrzeuge abgerufen.

#### Weitere Einstellungen

- **Intervall der Fahrzeuganfragen:** Wie häufig ein neues Fahrzeug für den jeweils nächsten Patienten angefordert werden soll. Über diese Option kann die Zeit simuliert werden, die die Führungskraft der Transportorganisation benötigt, die Patienten zu priorisieren und ein geeignetes Krankenhaus zuzuweisen. Zu geringe Werte ergeben eine unrealistisch schnelle Transportorganisation.
- **Intervall der Patientenzahlenanfragen:** Wie häufig die Transportorganisation die aktuellen Patientenzahlen aller verwalteten Bereiche abfragt.
- **Dauer für vermisste Fahrzeuge:** Die Transportorganisation wird informiert, sobald ein zum Transport angefordertes Fahrzeug zur Verfügung steht. Passiert das nicht innerhalb der hier angegebenen Zeit, wird ein neues Fahrzeug für den gleichen Patienten angefordert

### Abhängigkeiten

Diese Verhaltensweise benötigt keine anderen Verhaltensweisen _im gleichen simulierten Bereich_.

Alle Bereiche, aus denen Patienten abtransportiert werden sollen, benötigen die Verhaltensweise [Patienten abtransportieren](#patienten-abtransportieren), damit Patienten in die von der Transportorganisation bereitgestellten Fahrzeuge verladen werden können.

### Details

Die Transportorganisation ist eine Verhaltensweise, die _keine Ressourcen im eigenen simulierten Bereich_ benötigt. Sie stellt lediglich eine _Zuständigkeit_ dar, welche die Abläufe zwischen verschiedenen simulierten Bereichen koordiniert. Es ist damit möglich, einem simulierten Bereitstellungsraum zusätzlich die Aufgabe der Transportorganisation aufzutragen (und einzustellen, dass die Fahrzeuge im eigenen Bereich abgerufen werden sollen) oder jeder simulierten Patientenablage die Verhaltensweise Transportorganisation hinzuzufügen (und nur die jeweilige Patientenablage als zu verwaltenden Bereich einzustellen). Die Zuweisung der Transportorganisation zu einem separaten simulierten Bereich bildet hingegen die Aufgabenteilung besser ab.

> [!NOTE]
> Die Transportorganisation ist die einzige Verhaltensweise, die nicht an räumliche Eigenschaften oder lokale Ressourcen eines simulierten Bereichs gebunden ist.

Damit die Transportorganisation arbeiten kann, benötigt sie mindestens zu Beginn des Transports die Patientenzahlen aus den verwalteten Bereichen. Für jeden Transport passt die Transportorganisation automatisch ihre Zahlen an, die wiederkehrenden Abfragen dienen dem Abgleich und stellen sicher, dass auf die Verbesserung oder Verschlechterung von Patienten reagiert werden kann.

Es ist aktuell nicht möglich, einzustellen, in welches Krankenhaus die Patienten transportiert werden. Alle Patienten werden automatisch in das Standardkrankenhaus "Beliebiges Krankenhaus" gebracht.

## Patienten abtransportieren

### Auf einen Blick

Transportiert Patienten im eigenen Bereich ab, wenn die Transportorganisation dies vorgibt.

### Einstellungen

Diese Verhaltensweise bietet keine Einstellungen.

### Abhängigkeiten

Diese Verhaltensweise reagiert ausschließlich auf Anweisungen einer [Transportorganisation](#transportorganisation). Diese muss nicht notwendigerweise dem selben simulierten Bereich zugewiesen sein.

### Details

Die Transportorganisation schickt gemäß ihrer Liste von Patientenzahlen Fahrzeuge zu den Patientenablagen. Erhält die Verhaltensweise Patienten abtransportieren ein solches Fahrzeug, wählt sie den dringendsten verbleibenden Patienten aus, lädt ihn in das Fahrzeug und schickt es zum Krankenhaus.
