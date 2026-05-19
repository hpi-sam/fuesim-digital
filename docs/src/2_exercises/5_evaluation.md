# Auswertung

Zur Auswertung stehen zwei Fenster bereit, die im [Hauptmenü](2_user_interfaces.md#hauptmenü) unter <kbd>Auswertung</kbd> geöffnet werden können.

## Statistiken

### Einsatzverlauf

Im Tab <kbd>Ansichten & simulierte Bereiche</kbd> des Fensters <kbd>Statistiken</kbd> wird die Anzahl an [Patienten](3_exercise_elements.md#patienten), [Fahrzeugen und Personal](3_exercise_elements.md#fahrzeuge-mit-personal-und-material) im Übungsverlauf als Diagramm visualisiert.

#### Diagramme

Es gibt drei Diagramme:

- **Patienten**: Anzahl an Patienten, sortiert nach (tatsächlicher) Sichtungskategorie. Bei Abtransport werden die Patienten aus dem Diagramm entnommen, sodass eine fallende Kurve entsteht.

> [!NOTE]
> Mit tatsächlicher Sichtungskategorie ist die als „Musterlösung“ hinterlegte Sichtungsfarbe gemeint. Eventuelle Fehlsichtungen der Übenden sind nicht berücksichtigt.

- **Fahrzeuge**: Anzahl Fahrzeuge, sortiert nach Typ. Sofern die Auswahl nicht auf eine Ansicht oder einen Bereich eingeschränkt wurde, werden auch Fahrzeuge im Transfer (als z.B. alarmierte Fahrzeuge) mitgezählt.
- **Einsatzkräfte**: Anzahl an eingesetztem Personal, sortiert nach Typ bzw. Qualifikation. Personal, das sich noch im Fahrzeug befindet oder gerade transferiert wird, wird ignoriert.

In den Diagrammen wird die Entwicklung der entsprechenden Anzahlen über den Übungsverlauf hinweg als Flächendiagramm dargestellt. Wenn man die Maus über die Diagramme fährt, werden die genauen Zahlen zu diesem Zeitpunkt angezeigt.

#### Einschränkung auf Ansichten und Bereiche

Oberhalb der Diagramme befindet sich links ein Dropdown-Menü, in dem entweder die gesamte Übung (<kbd>Gesamt</kbd>), eine bestimmte Ansicht oder ein bestimmter simulierter Bereich ausgewählt werden kann. Standardmäßig ist <kbd>Gesamt</kbd> ausgewählt und die Diagramme zeigen alle Übungselemente der gesamten Übung inklusive denen, die sich im Transfer befinden. Wird eine Ansicht oder ein Bereich ausgewählt, werden nur die dortigen Übungselemente berücksichtigt.

#### Aktualisieren

Neben dem Dropdown-Menü befindet sich ein Button <kbd>aktualisieren</kbd> mit dem die Diagramme aktualisiert werden können. Das ist nur relevant, wenn die Übung weiterhin läuft und die Diagramme so auf den neuesten Stand gebracht werden sollen.

> [!IMPORTANT]
> Die Diagramme werden beim ersten Öffnen des Fensters <kbd>Statistiken</kbd> automatisch generiert. Es ist nicht erforderlich, manuell den Button <kbd>aktualisieren</kbd> zu drücken.

> [!WARNING]
> Je nach System und Übungsgröße kann das Generieren der Diagramme eine gewisse Zeit in Anspruch nehmen.

### Krankenhäuser

Im Tab <kbd>Krankenhäuser</kbd> des Fensters <kbd>Statistiken</kbd> wird eine Liste aller Patienten angezeigt, die aus der Übung heraus an ein [Krankenhaus](3_exercise_elements.md#krankenhäuser) geschickt wurden. Zu jedem Transport werden die ID des Patienten, die (tatsächliche) Sichtungskategorie, die Typbezeichnung des transportierenden Fahrzeugs, die Abfahrtszeit und die Ankunftszeit am Krankenhaus sowie der Name des Zielkrankenhauses angezeigt.

> [!TIP]
> Bei den Zeiten handelt es sich um die verstrichene Zeit seit Übungsbeginn. Die Eintreffzeit wird aus der für das jeweilige Krankenhaus hinterlegten Transportdauer berechnet.

### Log

In der rechten Hälfte des Fensters <kbd>Statistiken</kbd> wird aktuell das Übungslog angezeigt. Es ist eine Liste von Ereignissen aus dem Übungsverlauf (wobei die neuesten Ereignisse am weitesten unten stehen).

> [!IMPORTANT]
> Das Log wurde ursprünglich entwickelt, um technische Details in der Software schnell nachzuvollziehen. Deshalb sind die Log-Ereignisse sehr kleinteilig und die Filtermechnaik sehr präzise.

> [!WARNING]
> Es werden aktuell nicht _alle_ Ereignisse im Log angezeigt, sondern derzeit nur eine technisch bedingte Auswahl.

#### Filter

Oberhalb der Liste können Filter konfiguriert werden.

Beim Hinzufügen eines Filters wird zunächst eine Kategorie von Übungsobjekten gewählt (z.B. <kbd>Patient</kbd>, <kbd>Fahrzeug</kbd> oder <kbd>Transferpunkt</kbd>), was bereits dazu führt, dass nur noch Ergebnisse, die ein Übungselement dieses Typs betreffen, angezeigt werden.

Für viele Kategorien können dann noch konkrete Übungselemente gewählt werden. Sobald hier mindestens eines ausgewählt ist, werden nur noch Ereignisse angezeigt, die eines der gewählten Übungsobjekte in dieser Kategorie betreffen.

> [!WARNING]
> Gibt es mehrere Filter(-Kategorien), funktionieren diese additiv. Das heißt es werden nur Ereignisse angezeigt, die alle Filter(-Kategorien) entsprechen. Dadurch wird das Log schnell sehr spezifisch.

Filter(-Kategorien) sowie die darin aufgelisteten Übungselemente können jederzeit einzeln entfernt werden. Zudem ist es mit dem Button <kbd>Alle Filter löschen</kbd> möglich, alle Filter zu entfernen und wieder die volle Liste anzuzeigen.

## Aufzeichnung

Durch Klick auf <kbd>Auswertung</kbd> → <kbd>Aufzeichnung</kbd> wird eine Unteransicht der [Übungsansicht](2_user_interfaces.md#übungsansichtkartenansicht) geöffnet, in der es keine Interaktionsmöglichkeiten mit den Übungselementen gibt und anstelle der unteren Menüleiste ein Zeitstrahl zu sehen ist. In dieser Ansicht kann eine Aufzeichnung der Übung abgespielt werden.

Durch einen Klick auf <kbd>Übung wieder betreten</kbd> in der oberen Menüleiste neben der Überschrift kann jederzeit zur [normalen Übungsansicht](2_user_interfaces.md#übungsansichtkartenansicht) zurückgekehrt werden.

### Aufzeichnung abspielen

Im Zeitstrahl kann ein beliebiger Zeitpunkt markiert werden, um die Übungslage zu dieser Zeit entsprechend nachzustellen. Zudem kann die Übung durch einen Klick auf den Play/Pause-Button links oberhalb des Zeitstrahls abgespielt oder wieder angehalten werden. Das Abspielen ist auf Wunsch nicht nur mit einfacher, sondern auch mit doppelter, vierfacher, achtfacher oder 16-facher Geschwindigkeit möglich.

> [!WARNING]
> Das Springen zu einem bestimmten Zeitpunkt kann je nach System und Übungsgröße eine gewisse Zeit in Anspruch nehmen. Gerade bei größeren Zeitsprüngen oder bei Sprüngen zu Zeitpunkten, die hinter dem aktuell gezeigten Zeitpunkt liegen, ist mit etwas Wartezeit zu rechnen.

Innerhalb der Aufzeichnung können zudem über die entsprechenden Buttons in der unteren Menüleiste die Fenster [<kbd>Teilnehmende</kbd>](4_conduction.html#teilnehmende-verwalten), [<kbd>Transferübersicht</kbd>](4_conduction.md#transfers-verwalten) und [<kbd>Statistiken</kbd>](#statistiken) angezeigt werden. Der Inhalt dieser Fenster entspricht den entsprechenden Ansichten während einer normalen Übung, wobei sämtliche Änderungen unterbunden werden und der Inhalt für den aktuell betrachteten Zeitpunkt angezeigt wird.

> [!WARNING]
> Die Ansicht für Teilnehmende und Transfers werden stetig aktualisiert wird während eine Aufzeichnung läuft. Die Statistiken (Diagramme) werden bei Öffnen des Fensters generiert und müssen manuell durch den entsprechenden Button aktualisiert werden.

### Neue Übung starten

Mit dem Button <kbd>Neue Übung an dieser Stelle erstellen</kbd> wird eine neue Übung (d.h. mit neuen PINs) erstellt, die vom aktuell in der Aufzeichnung betrachteten Zeitpunkt ausgeht. Dabei wird die Übungszeit übernommen (das heißt, die neue Übung beginnt nicht bei `0:00:00`, sondern bei der in der Aufzeichnung gewählten Zeit, aber die Details vor diesem Zeitpunkt werden abgeschnitten, sodass die Diagramme und die Aufzeichnung keine Veränderungen anzeigen).

Das Starten der neuen Übung soll es ermöglichen, gemeinsam mit den Teilnehmenden die kritischen Stellen einer vergangenen Übung erneut zu behandeln. Wichtig ist dabei, dass die Teilnehmenden, bevor die neu erstellte Übung gestartet wird, erneut hinzugefügt und eingeteilt werden müssen.
