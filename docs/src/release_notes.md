# Änderungshistorie

Auf dieser Seite informieren wir über aktuelle Änderungen in der FüSim Digital. Zudem gibt es einen [Mailverteiler](https://lists.myhpi.de/8NGBl7FhFMPbVxPK7Pa0cRMfCezUkjHksbD9HxOM),
der auch über die Änderungen informiert.

## Version 0.17.0 -- 30.06.2026

[Release 0.17.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.17.0)

### Neue Features

- Die Namen neuer Fahrzeuge werden automatisch pro Fahrzeugvorlage durchnummeriert. Diese Funktion kann über das Einfügen des Platzhalters „#“ im Namen der Vorlage aktiviert werden.

### Fehlerbehebungen

- Der vollständige Export (einschließlich Verlauf) von Übungsvorlagen ist nun möglich.

## Version 0.16.0 -- 23.06.2026

[Release 0.16.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.16.0)

### Änderungen

- Anonyme Übungen werden automatisch gelöscht, wenn sie für eine konfigurierbare Anzahl von Tagen nicht genutzt wurden.
  Um dies zu vermeiden, könnt ihr Übungen und Übungsvorlagen in eurem Benutzerkonto verwalten.

### Fehlerbehebungen

- Durch das Sperren des Zooms auf der Karte wird nun auch das Vergrößern durch Doppelklick/Doppeltippen auf der Karte deaktiviert.
- Teilnehmende, die auf eine Ansicht beschränkt sind, können wieder alle Fahrzeuge sehen, die in ihrer Ansicht ankommen.
  Aufgrund eines Fehlers waren Fahrzeuge unsichtbar, wenn die Fahrzeugstatusanzeige oder Ladezeiten in einer Übung verwendet wurden.

## Version 0.15.0 -- 15.06.2026

[Release 0.15.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.15.0)

### Neue Features

- Es können Ladezeiten für Patienten für Fahrzeuge festgelegt werden. Wenn ein Patient in das Fahrzeug eingeladen wird, kann er nicht bewegt oder transportiert werden und es kann kein zweiter Patient gleichzeitig eingeladen werden. Ladezeiten können pro Fahrzeugvorlage konfiguriert werden und können pro Übung deaktiviert werden. Wenn die Ladezeit läuft, wird ein Countdown über dem Fahrzeug angezeigt.

### Änderungen

- `fuesim-manv.de` wurde in `fuesim.digital` umbenannt.
- Es wurde ein Hilfelink in der Fußleiste hinzugefügt.

## Version 0.14.0 -- 11.06.2026

[Release 0.14.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.14.0)

### Neue Features

- Übungsleitende können festlegen, ob die Teilnehmenden den Button „Alle einsteigen“ für Fahrzeuge nutzen können. Um die Abwärtskompatibilität zu gewährleisten, werden beim Einladen eines Patienten in ein Fahrzeug vorerst weiterhin automatisch das gesamte Personal und Material eingeladen, unabhängig davon, ob der Button aktiv ist.
- Übungsleitende können festlegen, ob zugehörige Elemente wie das Personal eines Fahrzeugs hervorgehoben werden sollen, wenn eines der Elemente ausgewählt wird. Die Hervorhebung kann deaktiviert, nur für Übungsleitende aktiviert (Standard, entspricht dem bisherigen Verhalten) oder sowohl für Übungsleitende als auch für Teilnehmende aktiviert werden.

### Verbesserungen

- Übungsleitende haben nun auch Zugriff auf die „Einsatzübersicht“ (in Übungen und Übungsvorlagen).
- Wenn die Verbindung aufgrund von Netzwerkproblemen oder beim Neuladen unterbrochen wurde, treten Teilnehmende nun automatisch im gleichen Modus und ggf. der gleichen Kartenansicht wieder der Übung bei.

### Fehlerbehebungen

- Übungsleitende können nun auch auf Touch-Geräten Elemente aus der Seitenleiste auf die Karte ziehen.
- \[Anleitung\] Es wurden fehlende Einträge in der Änderungshistorie hinzugefügt.
- \[Anleitung\] Einige Links wurden korrigiert.

## Version 0.13.1 -- 01.06.2026

[Release 0.13.1 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.13.1)

Diese Version enthielt nur eine kleine Fehlerbehebung für Version 0.13.0.

## Version 0.13.0 -- 01.06.2026

[Release 0.13.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.13.0)

### Anleitung/Hilfe

Bislang gab es für die FüSim Digital keine offizielle Anleitung: Dies hat sich nun geändert. Unter [fuesim.digital/about/help](https://fuesim.digital/about/help) findet sich die offizielle Anleitung mit Informationen zu allen wichtigen Features. In der Zukunft wird diese auch noch um ein Tutorial ergänzt, welches das Erstellen und Durchführen von Übungen erklären wird. Auch in der Software findet ihr nun an zahlreichen Stellen den Button „Hilfe“, welcher euch direkt zur richtigen Stelle in der Anleitung führt.

### Neue Features

- Das Zoomen der Karte per Touch-Eingabe kann sowohl von Übungsleitenden als auch von Teilnehmenden pro Gerät deaktiviert werden. Dies hilft, versehentliches Zoomen zu verhindern, wenn mehrere Teilnehmer gleichzeitig an einem einzigen Gerät arbeiten.

### Verbesserungen

- In der Teilnehmenden-Übersichtstabelle wurden folgende Bezeichnungen aus Gründen der Konsistenz umbenannt: „Rolle“ in „Modus“, „Ansicht“ in „Kartenansicht“ und bei Kartenansicht „nicht zugewiesen“ in „Gesamte Karte“.
- Übungen können nun direkt beim Bearbeiten von Übungsvorlagen erstellt werden.
- Übungsvorlagen können direkt beim Bearbeiten gelöscht werden.

### Fehlerbehebungen

- Sehr alte Übungsexporte können nun wieder erfolgreich importiert werden.
- Übungsvorlagen können nicht mehr versehentlich aus der Simulationsübersicht gestartet werden.

## Version 0.12.0 -- 17.05.2026

[Release 0.12.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.12.0)

### Neue Features

- Karten-Server können nun in den Übungseinstellungen aus einer Liste mit vorgeschlagenen Servern ausgewählt werden.
- Alarmgruppen und Fahrzeuge im Transfer können nun bei der Erstellung einer Übungsvorlage verwaltet werden.

### Verbesserungen

- Der Patientenexport für IVENA MANV wurde um einige neue Felder ergänzt (z. B. den Standort von Patienten).

### Fehlerbehebungen

- Die Anzeige für den Fahrzeugstatus verwendet nun den korrekten Status eines Patienten. Nachdem ein Patient vom Personal auf der Karte gesichtet wurde, wird somit die bei dieser Sichtung festgelegte Farbe verwendet.
- Die Übungskarte passt nun auf die Bildschirme mobiler Geräte (z. B. Tablets).
- Fahrzeuge innerhalb eines simulierten Bereichs können nun wieder korrekt ausgewählt werden.
- Fahrzeuge innerhalb simulierter Bereiche werden nun in der „Einsatzdetailansicht“ angezeigt.

## Version 0.11.1 -- 30.04.2026

[Release 0.11.1 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.11.1)

Diese Version enthielt nur eine kleine Fehlerbehebung für Version 0.11.0.

## Version 0.11.0 -- 24.04.2026

[Release 0.11.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.11.0)

### Neues Feature: Benutzerkonten und Übungsmanager

Bislang mussten zum Sichern von Übungsvorlagen mühsam Dateien exportiert und später wieder importiert werden. Dafür gibt es nun eine deutlich angenehmere Lösung: FüSim Digital unterstützt nun Benutzerkonten. Ihr könnt euch also auf der Startseite unter „Registrieren“ euer eigenes Benutzerkonto anlegen. Sobald ihr angemeldet seit, werden automatisch alle eure Übungen in eurem Konto gespeichert. Ihr könnt sie dann jederzeit unter „Übungen“ wiederfinden. Zusätzlich haben wir sogenannte Übungsvorlagen eingeführt: Unter dem entsprechenden Menüpunkt könnt ihr neue Vorlagen erstellen oder aus alten Übungsdateien importieren. Diese Vorlagen lassen sich dann beliebig oft verwenden, um neue Übungen zu erstellen.

In der von uns betriebenen öffentlichen Version unter [fuesim.digital](http://fuesim.digital) werden die personenbezogenen Daten dabei gemäß aktuellen Datenschutzvorgaben auf den Servern des Hasso-Plattner-Instituts gespeichert und verarbeitet (siehe unsere [Datenschutzerklärung](https://fuesim.digital/about/privacy)). Bei selbst betriebenen Servern ist auf eine entsprechende Erweiterung der jeweiligen Datenschutzbedingungen zu achten.

### Neue Features in der Übungslogik

- Bereitstellung eines CSV-Exports für Patienten, um sie in IVENA MANV zu importieren.
- Mit Hilfe von Sperrzonen (zu finden unter „Zonen“) kann die Anzahl der Fahrzeuge begrenzt werden, die in einem bestimmten Bereich platziert werden können. Die Beschränkungen können pro Fahrzeugvorlage angewendet werden.
- Fahrzeuge auf der Karte verfügen über eine Anzeige, die die Anzahl der belegten und der gesamten Patientenplätze anzeigt. Diese Anzeige ist standardmäßig deaktiviert und kann für eine Übung in den Einstellungen aktiviert werden. Optional wird die Anzeige in der Statusfarbe des Patienten mit der höchsten Sichtungskategorie im Fahrzeug dargestellt.
- Alarmgruppen können nun auf eine maximale Anzahl von Auslösungen begrenzt werden. Wenn das Limit erreicht ist, kann die Alarmgruppe nicht mehr gesendet werden. Die Begrenzung ist insbesondere für die von Teilnehmern gespielte Leitstelle vorgesehen.
- Teilnehmende können nun statt der Karten- oder Leitstellenansicht einer „Einsatzübersicht“ zugeordnet werden. Diese ähnelt der Oberfläche von typischen Einsatzapps auf Tablets (z. B. der „FireApp“). Sie bietet folgende Features:
    - Einteilung von Fahrzeugen in mehrere logische Einsatzabschnitte (unabhängig von der Position am Einsatzort) sowie als Einsatz- bzw. Abschnittsleitung.
    - Überblick über eingetroffene und sich auf Anfahrt befindliche Fahrzeuge.
    - Kartenansicht der Einsatzstelle, optional mit 3D-Gebäudesilhouetten.
- Übungsleitende können jetzt Erkundungslemente auf der Karte platzieren. Dabei handelt es sich um Lupen-Symbole oder um mit Sprechblase versehene Passanten, bei denen Texte hinterlegt werden können zur Erkundung der virtuellen Einsatzstelle durch die Teilnehmenden. Zukünftig sollen auch Bilder und andere Inhalte hinterlegbar sein. Erkundungsinformationen können außerdem bei Patienten und Bildern angefügt werden.

### Verbesserungen

- Einige Hinweistexte in der Software wurden verbessert, u. a. in den Übungseinstellungen sowie den Transferpunkten.
- Es wird ein großer, nicht schließbarer Hinweis angezeigt, wenn die Verbindung zum Server unterbrochen wurde.
- Es wurde ein Dialog zum Einladen von Teilnehmenden und Übungsleitenden über QR-Codes hinzugefügt.
- Teilnehmer und Trainer werden nun einheitlich als „Teilnehmende“ bzw. „Übungsleitende“ bezeichnet. Übungs-PINs (ehemals IDs) werden nun einheitlich als „Übungs-PIN“, „Teilnehmenden-PIN“ und „Übungsleitungs-PIN“ bezeichnet.

### Fehlerbehebungen

- Ansichten für Teilnehmende werden nun durchgehend als „Ansicht“ bezeichnet, und einige weitere falsche Verwendungen des Begriffs „Einsatzabschnitt“ wurden korrigiert.
- Die Karte ist in der Aufzeichnung nun wieder sichtbar.
- Teilnehmer können die Leitstellenansicht nun nur nutzen, während die Übung läuft.

## Version 0.10.0 -- 08.12.2025

[Release 0.10.0 auf GitHub](https://github.com/hpi-sam/fuesim-digital/releases/tag/v0.10.0)

### Neue Features

- Teilnehmer können Patienten für den Transport priorisieren. Diese Patienten werden mit einem roten Rahmen um ihr Popup gekennzeichnet.
- Die Teilnehmer können nun einer Leitstellenansicht statt einer Kartenansicht zugewiesen werden, in der sie Alarmgruppen alarmieren und ein Einsatztagebuch führen können, also eine Leistelle simulieren können.
- Alarmgruppen können auf eine bestimmte Anzahl Auslösungen limitiert werden.

### Verbesserungen

- Das Einsatztagebuch unterscheidet nun zwischen öffentlichen Einträgen, die für alle sichtbar sind, und privaten Einträgen, die nur für Übungsleiter sichtbar sind.
- Das Design des Karteneditors wurde leicht aktualisiert: Es benötigt weniger Platz und ist einheitlicher.
- Einige angezeigte Texte wurden hinzugefügt oder umformuliert, um sie verständlicher zu machen.

### Fehlerbehebungen

- Das Auslösen einer Alarmgruppe mit mehr ersten Fahrzeugen als insgesamt Teil der Alarmgruppe sind wird nun fehlerfrei durchgeführt.
- Es wurde ein Fehler behoben, durch den verschiedene Teilnehmer bei der Verwendung unterschiedlicher Sprachen möglicherweise ein unterschiedliches Verhalten der Simulation feststellten.

## Ältere Versionen

Für die Änderungen in älteren Versionen kann das [englischsprachige Changelog auf GitHub](https://github.com/hpi-sam/fuesim-digital/blob/dev/CHANGELOG.md#090---2025-09-23) zu Rate gezogen werden.
