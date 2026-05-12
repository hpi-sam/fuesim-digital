# 25 Auswertung

Zur Auswertung stehen zwei Fenster bereit, die im [Hauptmenü](https://outline.jonathanweth.de/doc/22-ansichten-Say3tcwyfv#h-hauptmenu) unter "Auswertung" geöffnet werden können.

## Statistiken

### Einsatzverlauf

Im Tab "Ansichten & simulierte Bereiche" des Fensters "Statistiken" wird die Anzahl an [Patienten](https://outline.jonathanweth.de./23%20%C3%9Cbungselemente.md#h-patienten), [Fahrzeugen und Personal](https://outline.jonathanweth.de./23%20%C3%9Cbungselemente.md#h-fahrzeuge-mit-personal-und-material) im Übungsverlauf als Diagramm visualisiert. 

#### Diagramme

Es gibt drei Diagramme:

* **Patienten**: Anzahl an Patienten, sortiert nach (tatsächlicher) Sichtungskategorie. Bei Abtransport werden die Patienten aus dem Diagramm entnommen, sodass eine fallende Kurve entsteht.

> \[!NOTE\]\nMit tatsächlicher Sichtungskategorie ist die als "Musterlösung" hinterlegte Sichtungsfarbe gemeint. Eventuelle Fehlsichtungen der Übenden sind nicht berücksichtigt. 

* **Fahrzeuge**: Anzahl Fahrzeuge, sortiert nach Typ. Sofern die Auswahl nicht auf eine Ansicht oder einen Bereich eingeschränkt wurde, werden auch Fahrzeuge im Transfer (als z.B. alarmierte Fahrzeuge) mitgezählt.
* **Einsatzkräfte**: Anzahl an eingesetztem Personal, sortiert nach Typ bzw. Qualifikation. Personal, das sich noch im Fahrzeug befindet oder gerade transferiert wird, wird ignoriert.

In den Diagrammen wird die Entwicklung der entsprechenden Anzahlen über den Übungsverlauf hinweg als Flächendiagramm dargestellt. Wenn man die Maus über die Diagramme fährt, werden die genauen Zahlen zu diesem Zeitpunkt angezeigt.

#### Einschränkung auf Ansichten und Bereiche

Oberhalb der Diagramme befindet sich links ein Dropdown-Menü, in dem entweder die gesamte Übung ("Gesamt"), eine bestimmte Ansicht oder ein bestimmter simulierter Bereich ausgewählt werden kann. Standardmäßig ist "Gesamt" ausgewählt und die Diagramme zeigen alle Übungselemente der gesamten Übung inklusive denen, die sich im Transfer befinden. Wird eine Ansicht oder ein Bereich ausgewählt, werden nur die dortigen Übungselemente berücksichtigt.

#### Aktualisieren

Neben dem Dropdown-Menü befindet sich ein Button "aktualisieren", mit dem die Diagramme aktualisiert werden können. Das ist nur relevant, wenn die Übung weiterhin läuft und die Diagramme so auf den neuesten Stand gebracht werden sollen.

> \[!IMPORTANT\]\nDie Diagramme werden beim ersten Öffnen des Fensters "Statistiken" automatisch generiert. Es ist nicht erforderlich, manuell den Button "aktualisieren" zu drücken. 

> \[!WARNING\]
>
> Je nach System und Übungsgröße kann das Generieren der Diagramme eine gewisse Zeit in Anspruch nehmen.

### Krankenhäuser

Im Tab "Krankenhäuser" des Fensters "Statistiken" wird eine Liste aller Patienten angezeigt, die aus der Übung heraus an ein [Krankenhaus](https://outline.jonathanweth.de./23%20%C3%9Cbungselemente.md#h-krankenhauser) geschickt wurden.  Zu jedem Transport werden die ID des Patienten, die (tatsächliche) Sichtungskategorie, die Typbezeichnung des transportierenden Fahrzeugs, die Abfahrtszeit und die Ankunftszeit am Krankenhaus sowie der Name des Zielkrankenhauses angezeigt.

> \[!HINT\]\nBei den Zeiten handelt es sich um die verstrichene Zeit seit Übungsbeginn. Die Eintreffzeit wird aus der für das jeweilige Krankenhaus hinterlegten Transportdauer berechnet.

### Log

In der rechten Hälfte des Fensters "Statistiken" wird aktuell das Übungslog angezeigt. Es ist eine Liste von Ereignissen aus dem Übungsverlauf (wobei die neuesten Ereignisse am weitesten unten stehen).

> \[!IMPORTANT\]
>
> Das Log wurde ursprünglich entwickelt, um technische Details in der Software schnell nachzuvollziehen. Deshalb sind die Log-Ereignisse sehr kleinteilig und die Filtermechnaik sehr präzise.

> \[!WARNING\]
>
> Es werden aktuell nicht *alle* Ereignisse im Log angezeigt, sondern derzeit nur eine technisch bedingte Auswahl.

#### Filter

Oberhalb der Liste können Filter konfiguriert werden. 

Beim Hinzufügen eines Filters wird zunächst eine Kategorie von Übungsobjekten gewählt (z.B. "Patient", „Fahrzeug" oder "Transferpunkt"), was bereits dazu führt, dass nur noch Ergebnisse, die ein Übungselement dieses Typs betreffen, angezeigt werden.

Für viele Kategorien können dann noch konkrete Übungslemente gewählt werden. Sobald hier mindestens eines ausgewählt ist, werden nur noch Ereignisse angezeigt, die eines der gewählten Übungsobjekte in dieser Kategorie betreffen.

> \[!WARNING\]\nGibt es mehrere Filter(-Kategorien), funktionieren diese additiv. Das heißt es werden nur Ereignisse angezeigt, die alle Filter(-Kategorien) entsprechen. Dadurch wird das Log schnell sehr spezifisch.

Filter(-Kategorien) sowie die darin aufgelisteten Übungselemente können jederzeit einzeln entfernt werden. Zudem ist es mit dem Button "Alle Filter löschen" möglich, alle Filter zu entfernen und wieder die volle Liste anzuzeigen.

## Aufzeichnung

Durch Klick auf "Auswertung" → "Aufzeichnung" wird eine Unteransicht der [Übungsansicht](https://outline.jonathanweth.de/doc/22-ansichten-Say3tcwyfv#h-ubungsansicht) geöffnet, in der es keine Interaktionsmöglichkeiten mit den Übungselementen gibt und anstelle der unteren Menüleiste ein Zeitstrahl zu sehen ist. In dieser Ansicht kann eine Aufzeichnung der Übung abgespielt werden.

Durch einen Klick auf "Übung wieder betreten" in der oberen Menüleiste neben der Überschrift kann jederzeit zur [normalen Übungsansicht](https://outline.jonathanweth.de/doc/22-ansichten-Say3tcwyfv#h-ubungsansicht) zurückgekehrt werden.

### Aufzeichnung abspielen

Im Zeitstrahl kann ein beliebiger Zeitpunkt markiert werden, um die Übungslage zu dieser Zeit entsprechend nachzustellen. Zudem kann die Übung durch einen Klick auf den Play/Pause-Button links oberhalb des Zeitstrahls abgespielt oder wieder angehalten werden. Das Abspielen ist auf Wunsch nicht nur mit einfacher, sondern auch mit doppelter, vierfacher, achtfacher oder 16-facher Geschwindigkeit möglich. 

> \[!WARNING\]\nDas Springen zu einem bestimmten Zeitpunkt kann je nach System und Übungsgröße eine gewisse Zeit in Anspruch nehmen. Gerade bei größeren Zeitsprüngen oder bei Sprüngen zu Zeitpunkten, die hinter dem aktuell gezeigten Zeitpunkt liegen, ist mit etwas Wartezeit zu rechnen.

Innerhalb der Aufzeichnung können zudem über die entsprechenden Buttons in der unteren Menüleiste die Fenster "[Teilnehmende](https://outline.jonathanweth.de./24%20Durchf%C3%BChrung.md#h-teilnehmende-verwalten)", "[Transferübersicht](https://outline.jonathanweth.de./24%20Durchf%C3%BChrung.md#h-transfers-verwalten)" und "[Statistiken](https://outline.jonathanweth.de/doc/25-auswertung-ggGw1uuAAP#h-statistik)" angezeigt werden. Der Inhalt dieser Fenster entspricht den entsprechenden Ansichten während einer normalen Übung, wobei sämtliche Änderungen unterbunden werden und der Inhalt für den aktuell betrachteten Zeitpunkt angezeigt wird.

> \[!WARNING\]\nDie Ansicht für Teilnehmende und Transfers werden stetig aktualisiert wird während eine Aufzeichnung läuft. Die Statistiken (Diagramme) werden bei Öffnen des Fensters generiert und müssen manuell durch den entsprechenden Button aktualisiert werden.

### Neue Übung starten

Mit dem Button "Neue Übung an dieser Stelle erstellen" wird eine neue Übung (d.h. mit neuen PINs) erstellt, die vom aktuell in der Aufzeichnung betrachteten Zeitpunkt ausgeht. Dabei wird die Übungszeit übernommen (das heißt, die neue Übung beginnt nicht bei 0:00:00, sondern bei der in der Aufzeichnung gewählten Zeit, aber die Details vor diesem Zeitpunkt werden abgeschnitten, sodass die Diagramme und die Aufzeichnung keine Veränderungen anzeigen).

Das Starten der neuen Übung soll es ermöglichen, gemeinsam mit den Teilnehmenden die kritischen Stellen einer vergangenen Übung erneut zu behandeln. Wichtig ist dabei, dass die Teilnehmenden, bevor die neu erstellte Übung gestartet wird, erneut hinzugefügt und eingeteilt werden müssen.


\