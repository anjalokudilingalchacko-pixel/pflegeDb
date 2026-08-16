import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import './Medikamente.css';

// Rich anatomy data pool for clinical explorer (synced with the 3D meshes)
const ANATOMY_DATA = {
  // SKIN / SILHOUETTE
  skin: {
    name: 'Körperoberfläche (Haut)',
    latin: 'Integumentum commune / Cutis',
    system: 'skin',
    systemLabel: 'Integumentäres System',
    function: 'Schutzbarriere gegen Erreger, mechanische Belastungen und Austrocknung; Thermoregulation und Sinnesorgan.',
    nursing: 'Dekubitusprophylaxe (Umlagerung, Hautinspektion an Druckpunkten). Intertrigoprophylaxe in Hautfalten. Wundversorgung und Hautpflege.',
    diseases: 'Dekubitus, Wundinfektionen, Intertrigo, Ekzeme, Hautkrebs.',
    meds: ['Wund- und Heilsalben (z.B. Panthenol)', 'Lokale Antiseptika (z.B. Octenisept)', 'Feuchtigkeitscremes']
  },

  // ORGANS
  heart: {
    name: 'Herz',
    latin: 'Cor',
    system: 'organs',
    systemLabel: 'Herz-Kreislauf-System',
    function: 'Hohlmuskel, der als Pumpe das Blut durch den Körperkreislauf treibt und Organe mit Sauerstoff versorgt.',
    nursing: 'Regelmäßige Vitalzeichenkontrolle (Puls, Blutdruck, SpO2). Einnahme-Monitoring bei Antihypertonika und Betablockern (z.B. Metoprolol, Ramipril).',
    diseases: 'Koronare Herzkrankheit (KHK), Herzinsuffizienz, Herzinfarkt, Vorhofflimmern.',
    meds: ['Metoprolol (Betablocker)', 'Ramipril (ACE-Hemmer)', 'Marcumar (Gerinnungshemmer)']
  },
  aorta_arch: {
    name: 'Aortabogen',
    latin: 'Arcus aortae',
    system: 'organs',
    systemLabel: 'Herz-Kreislauf-System',
    function: 'Hauptschlagader des Körpers. Leitet das sauerstoffreiche Blut aus der linken Herzkammer in den Körperkreislauf.',
    nursing: 'Engmaschige Blutdrucküberwachung bei Aortenaneurysma. Kontrolle der peripheren Pulse.',
    diseases: 'Aortenaneurysma, Aortenklappenstenose, arterielle Hypertonie.',
    meds: ['Metoprolol (Blutdrucksenker)', 'Amlodipin']
  },
  superior_vena_cava: {
    name: 'Obere Hohlvene',
    latin: 'Vena cava superior',
    system: 'organs',
    systemLabel: 'Herz-Kreislauf-System',
    function: 'Sammelt das sauerstoffarme Blut aus der oberen Körperhälfte (Kopf, Hals, Arme) und leitet es in den rechten Vorhof zurück.',
    nursing: 'Überwachung auf obere Einflussstauung (Venenstauung am Hals). Pflege bei zentralem Venenkatheter (ZVK).',
    diseases: 'Obere Einflussstauung (Vena-cava-superior-Syndrom).',
    meds: ['Marcumar (Antikoagulanz)', 'Clexane (Heparin)']
  },
  inferior_vena_cava: {
    name: 'Untere Hohlvene',
    latin: 'Vena cava inferior',
    system: 'organs',
    systemLabel: 'Herz-Kreislauf-System',
    function: 'Sammelt das sauerstoffarme Blut aus der unteren Körperhälfte (Beine, Abdomen) und leitet es zum Herzen zurück.',
    nursing: 'Thromboseprophylaxe einhalten. Lagerung zur Entlastung bei Herzinsuffizienz (Oberkörperhochlagerung).',
    diseases: 'Tiefe Beinvenenthrombose (TVT), Vena-cava-Kompressionssyndrom.',
    meds: ['Clexane s.c.', 'Marcumar']
  },
  lung_r_upper: {
    name: 'Rechter Lungenflügel (ob.)',
    latin: 'Pulmo dexter (lobus sup.)',
    system: 'organs',
    systemLabel: 'Atmungssystem',
    function: 'Gasaustausch (Aufnahme von Sauerstoff aus der Atemluft ins Blut, Abgabe von Kohlendioxid) im rechten oberen Bereich.',
    nursing: 'Atemfrequenz und Atemtiefe kontrollieren. Überwachung auf Zyanose. Inhalationsberatung bei Asthma/COPD.',
    diseases: 'COPD, Asthma bronchiale, Pneumonie, Emphysem.',
    meds: ['Salbutamol (Bronchospasmolytikum)', 'Budenosid (Kortikosteroid)']
  },
  lung_l_upper: {
    name: 'Linker Lungenflügel (ob.)',
    latin: 'Pulmo sinister (lobus sup.)',
    system: 'organs',
    systemLabel: 'Atmungssystem',
    function: 'Gasaustausch im linken oberen Lungenbereich nahe dem Herzeinschnitt.',
    nursing: 'Beachtung von Atemgeräuschen (Rasselgeräusche bei Sekretansammlung). Förderung der Lippenbremse bei Atemnot.',
    diseases: 'Asthma, COPD, Pneumothorax, Lungenödem.',
    meds: ['Salbutamol', 'Ipratropiumbromid']
  },
  trachea: {
    name: 'Luftröhre',
    latin: 'Trachea',
    system: 'organs',
    systemLabel: 'Atmungssystem',
    function: 'Elastischer Knorpelschlauch, der den Kehlkopf mit den Hauptbronchien verbindet und Atemluft leitet.',
    nursing: 'Sekretabsaugung bei tracheotomierten Patienten. Reinigung und Pflege des Tracheostomas. Überwachung auf Atemwegsverlegung.',
    diseases: 'Tracheitis, Trachealstenose, Fremdkörperaspiration.',
    meds: ['Mucosolvan (Schleimlöser)', 'ACC (Acetylcystein)']
  },
  esophagus: {
    name: 'Speiseröhre',
    latin: 'Oesophagus',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Muskelschlauch zur aktiven Beförderung des Nahrungsbreis vom Rachen in den Magen per peristaltischer Wellen.',
    nursing: 'Aspirationsprophylaxe (Oberkörperhochlagerung beim Essen und 30 Minuten danach). Kostformanpassung bei Dysphagie.',
    diseases: 'Ösophagitis, Refluxkrankheit, Ösophaguskarzinom, Dysphagie.',
    meds: ['Gaviscon (Refluxschutz)', 'Pantoprazol']
  },
  stomach: {
    name: 'Magen',
    latin: 'Gaster',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Vorverdauung der Nahrung durch Magensäure und Enzyme, Portionsweise Weitergabe des Nahrungsbreis.',
    nursing: 'Gabe von Magenschutz (Pantoprazol) bei Verordnung magenschädigender Medikamente (z.B. Ibuprofen/Aspirin). Beachtung von Nüchternzeiten.',
    diseases: 'Gastritis, Magengeschwür (Ulcus), Refluxkrankheit.',
    meds: ['Pantoprazol (Magenschutz)', 'Ibuprofen (Magenbelastend!)']
  },
  liver: {
    name: 'Leber',
    latin: 'Hepar',
    system: 'organs',
    systemLabel: 'Stoffwechselsystem / Verdauung',
    function: 'Zentrales Entgiftungsorgan, Gallenproduktion, Kohlenhydrat-, Fett- und Eiweißstoffwechsel.',
    nursing: 'Überwachung auf Ikterus (Gelbfärbung). Vorsicht bei hepatisch metabolisierten Schmerzmitteln (z.B. Paracetamol).',
    diseases: 'Leberzirrhose, Hepatitis, Leberversagen.',
    meds: ['Paracetamol (Lebertoxisch bei Überdosierung!)']
  },
  gallbladder: {
    name: 'Gallenblase',
    latin: 'Vesica biliaris / fellea',
    system: 'organs',
    systemLabel: 'Stoffwechselsystem / Verdauung',
    function: 'Speichert und konzentriert die Galle aus der Leber und gibt sie bei Bedarf zur Fettverdauung in den Zwölffingerdarm ab.',
    nursing: 'Schmerzüberwachung im rechten Oberbauch (Koliken). Stuhlbeobachtung (entfärbter, lehmfarbener Stuhl deutet auf Gallenstau hin).',
    diseases: 'Gallensteine (Cholelithiasis), Cholezystitis.',
    meds: ['Buscopan (Spasmolytikum)', 'Metamizol (Novalgin)']
  },
  duodenum: {
    name: 'Zwölffingerdarm',
    latin: 'Duodenum',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Erster Abschnitt des Dünndarms. Vermischt den Nahrungsbrei mit Gallensaft und Enzymen der Bauchspeicheldrüse.',
    nursing: 'Überwachung auf gastrointestinale Blutungen (Teerstuhl/Meläna). Verabreichung von Antazida/Protonenpumpenhemmern.',
    diseases: 'Duodenalgeschwür (Ulcus duodeni), Duodenitis.',
    meds: ['Pantoprazol']
  },
  jejunum: {
    name: 'Leerdarm',
    latin: 'Jejunum',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Mittlerer Abschnitt des Dünndarms, Hauptort der Nährstoffresorption (Zucker, Aminosäuren, Vitamine).',
    nursing: 'Erfassung von Diarrhöen. Flüssigkeits- und Elektrolytbilanz kontrollieren. Überwachung auf Malabsorptionssymptome.',
    diseases: 'Zöliakie, Morbus Crohn, Dünndarm-Entzündungen.',
    meds: ['Loperamid (Durchfallstopp)', 'Elektrolyte']
  },
  ileum: {
    name: 'Krummdarm',
    latin: 'Ileum',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Letzter Teil des Dünndarms, resorbiert vor allem Vitamin B12 und Gallensäuren.',
    nursing: 'Beurteilung von Mangelerscheinungen bei chronischen Erkrankungen. Postoperative Kostaufbauüberwachung nach Resektion.',
    diseases: 'Terminal-Ileitis (Morbus Crohn), Ileus (Darmverschluss).',
    meds: ['B12-Präparate', 'Budenosid (lokales Steroid)']
  },
  rectum: {
    name: 'Mastdarm',
    latin: 'Rectum',
    system: 'organs',
    systemLabel: 'Verdauungssystem',
    function: 'Letzter Teil des Dickdarms, dient der Speicherung des Kots vor der Ausscheidung (Stuhlentleerung).',
    nursing: 'Obstipationsprophylaxe (ballaststoffreiche Kost, viel trinken). Einläufe/Klistiere verabreichen bei Bedarf. Hämorrhoidalpflege.',
    diseases: 'Obstipation, Hämorrhoidalleiden, Rektumkarzinom.',
    meds: ['Lactulose (Abführmittel)', 'Macrogol', 'Dulcolax (Zäpfchen)']
  },
  kidney_r: {
    name: 'Rechte Niere',
    latin: 'Ren dexter',
    system: 'organs',
    systemLabel: 'Harnwegssystem',
    function: 'Harnfiltration, Blutreinigung, Regulation des Blutdrucks (Renin) und der Erythrozytenbildung.',
    nursing: 'Erfassung der Flüssigkeitsbilanz. Überwachung von Ödemen. Diuretika-Gabe kontrollieren (z.B. Furosemid).',
    diseases: 'Chronische Niereninsuffizienz, Nierensteine, Pyelonephritis.',
    meds: ['Furosemid (Entwässerungstablette)', 'Torasemid']
  },
  kidney_l: {
    name: 'Linke Niere',
    latin: 'Ren sinister',
    system: 'organs',
    systemLabel: 'Harnwegssystem',
    function: 'Filtration und Ausscheidung harnpflichtiger Substanzen auf der linken Körperseite.',
    nursing: 'Flüssigkeitseinschränkung bei fortgeschrittener Niereninsuffizienz überwachen. Serum-Elektrolyte im Auge behalten.',
    diseases: 'Niereninsuffizienz, Nierenkolik.',
    meds: ['Furosemid', 'Ramipril (Nierenschützend bei geringer Dosis)']
  },
  urinary_bladder: {
    name: 'Harnblase',
    latin: 'Vesica urinaria',
    system: 'organs',
    systemLabel: 'Harnwegssystem',
    function: 'Sammelt und speichert den aus den Nieren ablaufenden Urin bis zur willkürlichen Entleerung.',
    nursing: 'Flüssigkeitseinschränkung oder -bilanzierung erfassen, Messung von Restharn. Keimarme Versorgung bei liegendem Blasenkatheter (DK). Kontinenztraining.',
    diseases: 'Harnwegsinfekt (HWI/Zystitis), Harninkontinenz, Harnverhalt.',
    meds: ['Cotrimoxazol (Antibiotikum)', 'Spasmolytika']
  },

  // SKELETON
  frontal_bone: {
    name: 'Stirnknochen',
    latin: 'Os frontale',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Vorderer Teil des Schädeldaches, bildet die knöcherne Stirn und das Dach der Augenhöhlen.',
    nursing: 'Sturzfolgen im Kopfbereich überwachen (Pupillenkontrolle, Bewusstseinsprüfung bei Verdacht auf Schädel-Hirn-Trauma).',
    diseases: 'Schädel-Hirn-Trauma (SHT), Frontalhirnsyndrom.',
    meds: ['Analgetika bei Kopfschmerz']
  },
  occipital_bone: {
    name: 'Hinterhauptbein',
    latin: 'Os occipitale',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Hinterer Schädelknochen, umschließt das große Hinterhauptloch (Durchtritt des Rückenmarks).',
    nursing: 'Lagerung des Kopfes zur Vermeidung von Druckstellen (Dekubitusgefahr am Hinterkopf bei Bettlägerigkeit).',
    diseases: 'Dekubitus am Hinterkopf, SHT.',
    meds: ['Lagerungshilfsmittel (Hohlring)']
  },
  mandible: {
    name: 'Unterkiefer',
    latin: 'Mandibula',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Einziger beweglicher Knochen des Gesichtsschädels, trägt die untere Zahnreihe.',
    nursing: 'Unterstützung bei Kaubeschwerden (passierte Kost veranlassen). Schlucktraining nach Apoplex.',
    diseases: 'Kieferfraktur, Kiefergelenksarthrose, Dysphagie.',
    meds: ['Schmerzgele', 'Lokalanästhetika']
  },
  atlas_c1: {
    name: 'Erster Halswirbel (Atlas)',
    latin: 'Atlas (Vertebra cervicalis I)',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Trägt den Schädel, ermöglicht zusammen mit dem Axis die Nick- und Drehbewegungen des Kopfes.',
    nursing: 'HWS-Immobilisation nach Trauma (Stiffneck). Sensibilitätsprüfungen bei Taubheitsgefühl in den Fingern.',
    diseases: 'Atlasfraktur, HWS-Syndrom, Bandscheibenvorfall.',
    meds: ['Analgetika', 'Muskelrelaxantien']
  },
  cervical_c7: {
    name: 'Siebter Halswirbel (Prominens)',
    latin: 'Vertebra cervicalis VII',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Wirbel mit dem am weitesten vorstehenden Dornfortsatz, Übergang zur Brustwirbelsäule.',
    nursing: 'Achtsame Positionierung bei Kopflagerung. Inspektion auf Druckstellen am vorspringenden Dornfortsatz.',
    diseases: 'Nackenschmerzen, Blockierung.',
    meds: ['Wärmepflaster', 'Schmerzsalben']
  },
  thoracic_t3: {
    name: 'Dritter Brustwirbel',
    latin: 'Vertebra thoracica III',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Teil der Brustwirbelsäule, dient als Gelenkpartner für die 3. Rippe.',
    nursing: 'Lagerung zur Entlastung des Brustraums (z.B. Herzbettlagerung). Kinästhetische Umlagerung.',
    diseases: 'Wirbelkompression, Interkostalneuralgie.',
    meds: ['Metamizol (Novalgin)']
  },
  thoracic_t8: {
    name: 'Achter Brustwirbel',
    latin: 'Vertebra thoracica VIII',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Mittlerer Brustwirbel, trägt zur Stabilisierung des Brustkorbs bei.',
    nursing: 'Atemgymnastik unterstützen (Erweiterung des Brustkorbs stimulieren). Mobilisation aus dem Bett über die Seite.',
    diseases: 'BWS-Blockade, Rundrücken (Kyphose).',
    meds: ['Analgetika']
  },
  lumbar_vertebra: {
    name: 'Erster Lendenwirbel',
    latin: 'Vertebra lumbalis I',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Trägt das Gewicht des Rumpfes, Teil der Lendenlordose.',
    nursing: 'Rückenschonendes Arbeiten (Kinästhetik). Prophylaxe bei chronischen Rückenschmerzen.',
    diseases: 'Wirbelkörperkompression bei Osteoporose, Lumbalgie.',
    meds: ['Novalgin (Schmerzmittel)', 'Osteoporosetherapeutika']
  },
  lumbar_l5: {
    name: 'Fünfter Lendenwirbel',
    latin: 'Vertebra lumbalis V',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Unterster Wirbel der Lendenwirbelsäule, leitet das Körpergewicht auf das Kreuzbein über.',
    nursing: 'Besonders anfällig für Bandscheibenvorfälle (L5/S1). Überwachung auf Lähmungserscheinungen (z.B. Fußheberschwäche!).',
    diseases: 'Bandscheibenvorfall, Spinalkanalstenose, Spondylolisthesis.',
    meds: ['Gabapentin (bei neuropathischem Schmerz)', 'Pregabalin']
  },
  sacrum: {
    name: 'Kreuzbein',
    latin: 'Os sacrum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Keilförmiger Knochen, verbindet die Wirbelsäule mit dem Becken.',
    nursing: 'Dekubitus-Hotspot Nr. 1 am Kreuzbein (Sakrum). Konsequente Umlagerung (z.B. alle 2-4 Stunden) und Weichlagerung.',
    diseases: 'Dekubitus am Sakrum, Sakrumfraktur.',
    meds: ['Hydrokolloidverbände', 'Wundsalben']
  },
  sternum: {
    name: 'Brustbein',
    latin: 'Sternum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Flacher Knochen in der vorderen Mitte des Brustkorbs, an dem die Rippen ansetzen.',
    nursing: 'Beachtung von Atembeschwerden nach Thoraxkompression (z.B. CPR) oder Stürzen.',
    diseases: 'Sternumfraktur, instabiler Thorax.',
    meds: ['Analgetika zur Schmerzstillung bei Atmung']
  },
  clavicle_r: {
    name: 'Rechtes Schlüsselbein',
    latin: 'Clavicula dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Verbindet das Brustbein mit dem Schulterblatt rechts, stabilisiert die Schulter.',
    nursing: 'Anlage und Kontrolle eines Rucksackverbands bei Fraktur. Armbewegung vorübergehend einschränken.',
    diseases: 'Schlüsselbeinfraktur (Klavikulafraktur).',
    meds: ['Analgetika']
  },
  clavicle_l: {
    name: 'Linkes Schlüsselbein',
    latin: 'Clavicula sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Verbindet das Brustbein mit dem linken Schulterblatt.',
    nursing: 'Durchblutungs- und Sensibilitätskontrolle des linken Arms nach Frakturen.',
    diseases: 'Klavikulafraktur.',
    meds: ['Ibuprofen']
  },
  scapula_r: {
    name: 'Rechtes Schulterblatt',
    latin: 'Scapula dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Flacher Knochen der hinteren Schulter, dient als Muskelursprung und Schultergelenkpfanne.',
    nursing: 'Lagerung bei bettlägerigen Patienten zur Druckentlastung (Lagerungskissen unterlegen). Schule- und Armbeweglichkeit prüfen.',
    diseases: 'Schulterblattfraktur, Impingement-Syndrom.',
    meds: ['Analgetika']
  },
  scapula_l: {
    name: 'Linkes Schulterblatt',
    latin: 'Scapula sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Linker Gelenkpartner für das Schultergelenk.',
    nursing: 'Beachtung von Schmerzen bei der Rumpfdrehung. Weichlagerung am Rücken.',
    diseases: 'Schulter-Arm-Syndrom.',
    meds: ['Schmerzsalben']
  },
  humerus_r: {
    name: 'Rechter Oberarmknochen',
    latin: 'Humerus dexter',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Röhrenknochen des rechten Oberarms, Gelenkpartner für Schulter und Unterarm.',
    nursing: 'Inspektion auf Hämatome nach Sturz. Unterstützung beim Ankleiden (zuerst den kranken Arm ankleiden).',
    diseases: 'Humeruskopffraktur, subkapitale Humerusfraktur.',
    meds: ['Opioide (bei starken Frakturschmerzen)']
  },
  humerus_l: {
    name: 'Linker Oberarmknochen',
    latin: 'Humerus sinister',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Trägt die Last und Bewegung des linken Arms.',
    nursing: 'Lagerung im Gilchrist-Verband nach Humerusfrakturen überwachen.',
    diseases: 'Humerusfraktur.',
    meds: ['Analgetika']
  },
  radius_r: {
    name: 'Rechte Speiche',
    latin: 'Radius dexter',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Knochen des rechten Unterarms auf der Daumenseite, ermöglicht Umwendebewegungen.',
    nursing: 'Kontrolle auf Gipsdruckstellen bei Radusfrakturen. Hochlagerung zur Ödemprophylaxe.',
    diseases: 'Distale Radiusfraktur (Colles-Fraktur nach Sturzabfang).',
    meds: ['Abschwellende Analgetika']
  },
  radius_l: {
    name: 'Linke Speiche',
    latin: 'Radius sinister',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Unterarmknochen daumenseitig links.',
    nursing: 'Beurteilung der Fingerbeweglichkeit und Durchblutung nach Unterarmgips.',
    diseases: 'Colles-Fraktur.',
    meds: ['Ibuprofen']
  },
  ulna_r: {
    name: 'Rechte Elle',
    latin: 'Ulna dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Unterarmknochen auf der Kleinfingerseite rechts, bildet das Ellbogengelenk.',
    nursing: 'Beachtung von Schmerzen im Ellbogenbereich. Gipsverband trocken und sauber halten.',
    diseases: 'Ulnabruch, Ellenbogenluxation.',
    meds: ['Schmerzmittel']
  },
  ulna_l: {
    name: 'Linke Elle',
    latin: 'Ulna sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Unterarmknochen kleinfingerseitig links.',
    nursing: 'Hochlagern des Arms auf einem Keil zur Ödemminderung nach Verletzung.',
    diseases: 'Unterarmfraktur.',
    meds: ['Analgetika']
  },
  hip_bone_r: {
    name: 'Rechtes Hüftbein',
    latin: 'Os coxae dextrum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Zusammen mit Kreuzbein Teil des Beckens, verbindet Rumpf mit dem rechten Bein.',
    nursing: 'Frühzeitiges Erkennen von Sturzverletzungen. Enorme Sturzprophylaxe auf Station bei Gangunsicherheit.',
    diseases: 'Hüftgelenksarthrose (Koxarthrose), Beckenringfraktur.',
    meds: ['Analgetika zur Schmerztherapie']
  },
  hip_bone_l: {
    name: 'Linkes Hüftbein',
    latin: 'Os coxae sinistrum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Linker Teil des Beckengürtels, Gelenkpfanne für den linken Oberschenkelkopf.',
    nursing: 'Postoperative Mobilisation nach Koxarthrose-OP (keine Adduktion im Hüftgelenk!).',
    diseases: 'Hüftgelenksarthrose, Beckenfraktur.',
    meds: ['Thromboseprophylaxe (Heparin/Clexane)']
  },
  femur_r: {
    name: 'Rechter Oberschenkelknochen',
    latin: 'Femur dextrum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Längster Knochen des Körpers, bildet das Hüft- und Kniegelenk rechts.',
    nursing: 'Überwachung auf Schenkelhalsfraktur (SHF) nach Sturz (Beinverkürzung, Außenrotation!). Thromboseprophylaxe einhalten.',
    diseases: 'Schenkelhalsfraktur (SHF), Coxarthrose.',
    meds: ['Clexane s.c. (Heparin)', 'Opioide bei Frakturschmerz']
  },
  femur_l: {
    name: 'Linker Oberschenkelknochen',
    latin: 'Femur sinistrum',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Trägt das Gewicht des linken Rumpfes bei Bewegung.',
    nursing: 'Lagerung nach Oberschenkelfraktur (Unterpolsterung, Vermeidung von Rotationsfehlstellungen).',
    diseases: 'Femurschaftfraktur, Schenkelhalsfraktur.',
    meds: ['Clexane', 'Analgetika']
  },
  tibia_r: {
    name: 'Rechtes Schienbein',
    latin: 'Tibia dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Größerer, gewichttragender Knochen des rechten Unterschenkels.',
    nursing: 'Kontrolle auf Unterschenkelödeme. Unterstützung bei der Kompressionstherapie (MKS/Kurzzugbinden).',
    diseases: 'Tibiafraktur, Tibiakanten-Syndrom.',
    meds: ['Thromboseprophylaxe']
  },
  tibia_l: {
    name: 'Linkes Schienbein',
    latin: 'Tibia sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Gewichttragender Unterschenkelknochen links.',
    nursing: 'Hautpflege nach Kompressionstherapie (Hauttrockenheit durch Wickelung verhindern).',
    diseases: 'Unterschenkelfraktur.',
    meds: ['Feuchtigkeitscremes']
  },
  fibula_r: {
    name: 'Rechtes Wadenbein',
    latin: 'Fibula dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Dünnerer Knochen des rechten Unterschenkels, dient als Muskelursprung.',
    nursing: 'Überwachung auf Peroneusparese (Fußheberschwäche durch Druck auf das Wadenbeinköpfchen).',
    diseases: 'Fibulafraktur, Außenknöchelfraktur (Weber-Fraktur).',
    meds: ['Analgetika']
  },
  fibula_l: {
    name: 'Linkes Wadenbein',
    latin: 'Fibula sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Linker Unterschenkelknochen auf der Außenseite.',
    nursing: 'Inspektion auf Druckstellen im Knieaußenbereich bei Seitenlagerung.',
    diseases: 'Weber-B-Fraktur.',
    meds: ['Ibuprofen']
  },
  patella_r: {
    name: 'Rechte Kniescheibe',
    latin: 'Patella dextra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Sesambein des Kniestreckers, schützt das Gelenk und verbessert die Kraftübertragung.',
    nursing: 'Mobilisation mit Knieorthese nach OP/Luxation. Beugungseinschränkung des Knies beachten.',
    diseases: 'Patellafraktur, Patellaluxation.',
    meds: ['Analgetika']
  },
  patella_l: {
    name: 'Linke Kniescheibe',
    latin: 'Patella sinistra',
    system: 'skeleton',
    systemLabel: 'Skelettsystem',
    function: 'Sesambein des linken Knies.',
    nursing: 'Kühlung bei akuter Schwellung (Kälteanwendung max. 20 min).',
    diseases: 'Kniescheibenfraktur.',
    meds: ['Analgetika']
  },

  // MUSCLES
  gluteus_max_r: {
    name: 'Großer Gesäßmuskel re.',
    latin: 'M. gluteus maximus dextrum',
    system: 'muscular',
    systemLabel: 'Muskelsystem',
    function: 'Streckung und Außenrotation im Hüftgelenk, Aufrechthaltung des Rumpfes.',
    nursing: 'Ort für intramuskuläre (i.m.) Injektionen nach Hochstetter (ventrogluteal). Gefährdet bei Druckschäden im Sitzen.',
    diseases: 'Muskelatrophie durch Immobilisation, Dekubitus Gesäß.',
    meds: ['Bedarfsspritzen (i.m.)']
  },
  gluteus_max_l: {
    name: 'Großer Gesäßmuskel li.',
    latin: 'M. gluteus maximus sinistrum',
    system: 'muscular',
    systemLabel: 'Muskelsystem',
    function: 'Stabilisierung des Beckens und Knies in der Standbeinphase links.',
    nursing: 'Prüfung der ventroglutealen Landmarken zur sicheren Injektion. Kontrollierte Dekubitusinspektion.',
    diseases: 'Muskelatrophie, i.m.-Hämatombildung.',
    meds: ['Depot-Neuroleptika i.m.']
  },

  // NERVOUS
  cerebral_white: {
    name: 'Großhirn (weiße Substanz)',
    latin: 'Cerebrum',
    system: 'nervous',
    systemLabel: 'Nervensystem',
    function: 'Verbindung zwischen verschiedenen Hirnarealen, Informationsweiterleitung im Zentralnervensystem.',
    nursing: 'Vigilanz- und Orientierungsprüfung. Beobachtung von Apraxien oder Aphasien bei Läsionen.',
    diseases: 'Vaskuläre Demenz, Multiple Sklerose, Apoplex.',
    meds: ['Donepezil', 'Ginkgo-Extrakte']
  },
  cerebellum: {
    name: 'Kleinhirn',
    latin: 'Cerebellum',
    system: 'nervous',
    systemLabel: 'Nervensystem',
    function: 'Koordination von Bewegungsabläufen, Steuerung des Gleichgewichts und der Muskelspannung.',
    nursing: 'Sturzgefahr einschätzen bei Kleinhirn-Ataxie (Koordinationsstörung). Unterstützung durch Haltegriffe/Rollator.',
    diseases: 'Ataxie, Kleinhirnblutung, Schwindelzustände.',
    meds: ['Dimenhydrinat (Vomex gegen Schwindel)']
  }
};

const MESH_PARTS = [
  // SKIN / BODY OUTLINE (Silhouette)
  { id: 'skin', file: 'FMA7163.stl', system: 'skin' },

  // SKELETON
  // Skull
  { id: 'frontal_bone', file: 'FMA52734.stl', system: 'skeleton' },
  { id: 'occipital_bone', file: 'FMA52735.stl', system: 'skeleton' },
  { id: 'mandible', file: 'FMA52748.stl', system: 'skeleton' },
  // Spine (cervical to lumbar)
  { id: 'atlas_c1', file: 'FMA12519.stl', system: 'skeleton' },
  { id: 'cervical_c7', file: 'FMA12525.stl', system: 'skeleton' },
  { id: 'thoracic_t3', file: 'FMA9209.stl', system: 'skeleton' },
  { id: 'thoracic_t8', file: 'FMA9991.stl', system: 'skeleton' },
  { id: 'lumbar_vertebra', file: 'FMA13072.stl', system: 'skeleton' },
  { id: 'lumbar_l5', file: 'FMA13076.stl', system: 'skeleton' },
  { id: 'sacrum', file: 'FMA16202.stl', system: 'skeleton' },
  // Ribcage
  { id: 'sternum', file: 'FMA7487.stl', system: 'skeleton' },
  { id: 'rib_r1', file: 'FMA7857.stl', system: 'skeleton' },
  { id: 'rib_l1', file: 'FMA7987.stl', system: 'skeleton' },
  { id: 'rib_r3', file: 'FMA7909.stl', system: 'skeleton' },
  { id: 'rib_l3', file: 'FMA8039.stl', system: 'skeleton' },
  { id: 'rib_r5', file: 'FMA8066.stl', system: 'skeleton' },
  { id: 'rib_l5', file: 'FMA8093.stl', system: 'skeleton' },
  { id: 'rib_r7', file: 'FMA8229.stl', system: 'skeleton' },
  { id: 'rib_l7', file: 'FMA8256.stl', system: 'skeleton' },
  { id: 'rib_r9', file: 'FMA8364.stl', system: 'skeleton' },
  { id: 'rib_l9', file: 'FMA8391.stl', system: 'skeleton' },
  { id: 'rib_r11', file: 'FMA8531.stl', system: 'skeleton' },
  { id: 'rib_l11', file: 'FMA8532.stl', system: 'skeleton' },
  // Shoulder & Arms
  { id: 'clavicle_r', file: 'FMA13322.stl', system: 'skeleton' },
  { id: 'clavicle_l', file: 'FMA13323.stl', system: 'skeleton' },
  { id: 'scapula_r', file: 'FMA13395.stl', system: 'skeleton' },
  { id: 'scapula_l', file: 'FMA13396.stl', system: 'skeleton' },
  { id: 'humerus_r', file: 'FMA23130.stl', system: 'skeleton' },
  { id: 'humerus_l', file: 'FMA23131.stl', system: 'skeleton' },
  { id: 'radius_r', file: 'FMA23464.stl', system: 'skeleton' },
  { id: 'radius_l', file: 'FMA23465.stl', system: 'skeleton' },
  { id: 'ulna_r', file: 'FMA23467.stl', system: 'skeleton' },
  { id: 'ulna_l', file: 'FMA23468.stl', system: 'skeleton' },
  // Pelvis & Legs
  { id: 'hip_bone_r', file: 'FMA16586.stl', system: 'skeleton' },
  { id: 'hip_bone_l', file: 'FMA16587.stl', system: 'skeleton' },
  { id: 'femur_r', file: 'FMA24474.stl', system: 'skeleton' },
  { id: 'femur_l', file: 'FMA24475.stl', system: 'skeleton' },
  { id: 'tibia_r', file: 'FMA24477.stl', system: 'skeleton' },
  { id: 'tibia_l', file: 'FMA24478.stl', system: 'skeleton' },
  { id: 'fibula_r', file: 'FMA24480.stl', system: 'skeleton' },
  { id: 'fibula_l', file: 'FMA24481.stl', system: 'skeleton' },
  { id: 'patella_r', file: 'FMA24486.stl', system: 'skeleton' },
  { id: 'patella_l', file: 'FMA24487.stl', system: 'skeleton' },

  // MUSCLES
  { id: 'gluteus_max_r', file: 'FMA22328.stl', system: 'muscular' },
  { id: 'gluteus_max_l', file: 'FMA22329.stl', system: 'muscular' },

  // ORGANS
  { id: 'heart', file: 'FMA7274.stl', system: 'organs' },
  { id: 'aorta_arch', file: 'FMA3768.stl', system: 'organs' },
  { id: 'superior_vena_cava', file: 'FMA4720.stl', system: 'organs' },
  { id: 'inferior_vena_cava', file: 'FMA10951.stl', system: 'organs' },
  { id: 'lung_r_upper', file: 'FMA7333.stl', system: 'organs' },
  { id: 'lung_l_upper', file: 'FMA7370.stl', system: 'organs' },
  { id: 'trachea', file: 'FMA7394.stl', system: 'organs' },
  { id: 'esophagus', file: 'FMA7131.stl', system: 'organs' },
  { id: 'stomach', file: 'FMA7148.stl', system: 'organs' },
  { id: 'liver', file: 'FMA7197.stl', system: 'organs' },
  { id: 'gallbladder', file: 'FMA7202.stl', system: 'organs' },
  { id: 'duodenum', file: 'FMA7206.stl', system: 'organs' },
  { id: 'jejunum', file: 'FMA7207.stl', system: 'organs' },
  { id: 'ileum', file: 'FMA7208.stl', system: 'organs' },
  { id: 'rectum', file: 'FMA14544.stl', system: 'organs' },
  { id: 'kidney_r', file: 'FMA7204.stl', system: 'organs' },
  { id: 'kidney_l', file: 'FMA7205.stl', system: 'organs' },
  { id: 'urinary_bladder', file: 'FMA15900.stl', system: 'organs' },

  // NERVOUS
  { id: 'cerebral_white', file: 'FMA61822.stl', system: 'nervous' },
  { id: 'cerebellum', file: 'FMA67944.stl', system: 'nervous' }
];

export default function Anatomie({ onHome }) {
  const [selectedPartKey, setSelectedPartKey] = useState('heart');
  const [activeSystem, setActiveSystem] = useState('all'); // all, skeleton, organs, muscular, nervous, skin
  const [searchQuery, setSearchQuery] = useState('');
  
  // 3D Rendering states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const canvasContainerRef = useRef(null);
  const meshesRef = useRef({});
  const groupRef = useRef(new THREE.Group());
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  const selectedPart = useMemo(() => {
    if (selectedPartKey.startsWith('rib_')) {
      return {
        name: 'Rippen (Brustkorb)',
        latin: 'Costae',
        system: 'skeleton',
        systemLabel: 'Skelettsystem',
        function: 'Schützt Herz und Lunge, bildet den knöchernen Rahmen für die Atembewegungen.',
        nursing: 'Schmerzüberwachung bei Atemnot. Unterstützung der Atmung (Lagerung). Vorsicht bei Kompressionen.',
        diseases: 'Rippenfraktur, Rippenprellung.',
        meds: ['Analgetika (Novalgin, Ibuprofen)']
      };
    }
    return ANATOMY_DATA[selectedPartKey] || null;
  }, [selectedPartKey]);

  // Filter keys matching search / systems
  const filteredParts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return Object.entries(ANATOMY_DATA).filter(([key, part]) => {
      const matchesSearch = part.name.toLowerCase().includes(query) || 
                            part.latin.toLowerCase().includes(query) || 
                            part.systemLabel.toLowerCase().includes(query);
      const matchesSystem = activeSystem === 'all' || part.system === activeSystem;
      return matchesSearch && matchesSystem;
    });
  }, [searchQuery, activeSystem]);

  // 1. Initial Load Three.js Canvas Boilerplate
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // Clear any leftover canvases from previous mounts to prevent WebGL context leaks
    canvasContainerRef.current.innerHTML = '';

    let isCancelled = false;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // sleek clinical off-white
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      45, 
      canvasContainerRef.current.clientWidth / canvasContainerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 24); // centered height, further back to fit full body
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    canvasContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50;
    controls.minDistance = 3;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-10, 10, -15);
    scene.add(dirLight2);

    // FLOOR GRID HELPER (Placed at -4.25 to align with model bottom)
    const gridHelper = new THREE.GridHelper(30, 30, 0xcbd5e1, 0xe2e8f0);
    gridHelper.position.y = -4.25;
    scene.add(gridHelper);

    // GROUP FOR BODY MESHES
    const bodyGroup = groupRef.current;
    // Reset group rotation, position and scale in case of remounts
    bodyGroup.rotation.set(0, 0, 0);
    bodyGroup.position.set(0, 0, 0);
    bodyGroup.scale.set(1, 1, 1);
    bodyGroup.clear(); // remove any old meshes on remount
    scene.add(bodyGroup);

    // LOAD MESHES
    const loader = new STLLoader();
    let localLoadedCount = 0;

    const materials = {
      skeleton: new THREE.MeshStandardMaterial({ 
        color: 0xf8fafc, 
        roughness: 0.5, 
        metalness: 0.1 
      }),
      muscular: new THREE.MeshStandardMaterial({ 
        color: 0xfca5a5, 
        roughness: 0.6, 
        metalness: 0.0 
      }),
      organs: new THREE.MeshStandardMaterial({ 
        color: 0x93c5fd, 
        roughness: 0.4, 
        metalness: 0.1 
      }),
      nervous: new THREE.MeshStandardMaterial({ 
        color: 0xc084fc, 
        roughness: 0.4, 
        metalness: 0.1 
      }),
      skin: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
        metalness: 0.1,
        opacity: 0.12,
        transparent: true,
        depthWrite: false
      })
    };

    // Specific tints per organ key
    const organTints = {
      heart: 0xef4444, // Crimson Red
      aorta_arch: 0xdc2626, // Bright Red
      superior_vena_cava: 0x2563eb, // Royal Blue
      inferior_vena_cava: 0x2563eb,
      lung_r_upper: 0x34d399, // Green
      lung_l_upper: 0x34d399,
      trachea: 0x38bdf8, // Cyan Blue
      esophagus: 0xf472b6, // Pink
      stomach: 0xfca5a5, // Pinkish
      liver: 0xeab308, // Amber Yellow
      gallbladder: 0x10b981, // Emerald Green
      duodenum: 0xd97706, // Amber Orange
      jejunum: 0xd97706,
      ileum: 0xd97706,
      rectum: 0x92400e, // Dark Brown
      kidney_r: 0xf87171, // Red Brown
      kidney_l: 0xf87171,
      urinary_bladder: 0xfacc15 // Yellow
    };

    // Map over MESH_PARTS to load STL data in throttled sequential batches of 4
    const loadMeshes = async () => {
      const batchSize = 4;
      for (let i = 0; i < MESH_PARTS.length; i += batchSize) {
        if (isCancelled) return;
        const batch = MESH_PARTS.slice(i, i + batchSize);
        await Promise.all(
          batch.map(part => {
            return new Promise((resolve) => {
              loader.load(
                `/api/stl/${part.file}`, 
                (geometry) => {
                  if (isCancelled) {
                    geometry.dispose();
                    resolve();
                    return;
                  }

                  let material = materials[part.system].clone();
                  if (part.system === 'organs' && organTints[part.id]) {
                    material.color.setHex(organTints[part.id]);
                  }

                  const mesh = new THREE.Mesh(geometry, material);
                  mesh.userData = { 
                    id: part.id, 
                    system: part.system,
                    name: ANATOMY_DATA[part.id]?.name || part.id 
                  };

                  meshesRef.current[part.id] = mesh;
                  bodyGroup.add(mesh);

                  localLoadedCount++;
                  setLoadedCount(localLoadedCount);
                  setLoadingProgress(Math.round((localLoadedCount / MESH_PARTS.length) * 100));
                  resolve();
                },
                undefined,
                (err) => {
                  console.error(`Error loading STL: ${part.file}`, err);
                  if (isCancelled) {
                    resolve();
                    return;
                  }
                  localLoadedCount++;
                  setLoadedCount(localLoadedCount);
                  setLoadingProgress(Math.round((localLoadedCount / MESH_PARTS.length) * 100));
                  resolve();
                }
              );
            });
          })
        );
      }

      if (isCancelled) return;
      setIsLoading(false);

      // Compute compound bounding box of all meshes locally
      const box = new THREE.Box3();
      bodyGroup.children.forEach(child => {
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          box.union(child.geometry.boundingBox);
        }
      });

      const center = new THREE.Vector3();
      box.getCenter(center);

      // Center all child meshes relative to each other locally
      bodyGroup.children.forEach(child => {
        child.position.sub(center);
      });

      // Re-rotate bodyGroup since BodyParts3D meshes are Z-up
      // We rotate around X-axis by -90 degrees (-Math.PI / 2) so Z becomes Y (Up)
      bodyGroup.rotation.x = -Math.PI / 2;

      // Scale to fit viewport perfectly (standing figure height of 8.5 units)
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = 8.5 / maxDim; 
      bodyGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // Center the group in world space (y = 0 coordinates)
      bodyGroup.position.set(0, 0, 0);
    };

    loadMeshes();

    // RAYCASTING / MOUSE CLICK SELECTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children, true);

      // Filter out 'skin' from clicks so we can click through the outer transparent silhouette
      const clickableIntersects = intersects.filter(i => i.object.userData.system !== 'skin');

      if (clickableIntersects.length > 0) {
        const hitMesh = clickableIntersects[0].object;
        const partId = hitMesh.userData.id;
        if (partId && (ANATOMY_DATA[partId] || partId.startsWith('rib_'))) {
          setSelectedPartKey(partId);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // RESIZE EVENT
    const handleResize = () => {
      if (!canvasContainerRef.current) return;
      camera.aspect = canvasContainerRef.current.clientWidth / canvasContainerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION RENDER LOOP
    let animationFrameId;
    const animate = () => {
      if (isCancelled) return;
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // CLEANUP
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      if (renderer.domElement && canvasContainerRef.current) {
        renderer.domElement.removeEventListener('click', handleCanvasClick);
        canvasContainerRef.current.removeChild(renderer.domElement);
      }

      // Dispose of geometries & materials inside the group
      bodyGroup.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      // Dispose materials lookup
      Object.values(materials).forEach(m => m.dispose());

      renderer.dispose();
    };
  }, []);

  // 2. Synchronize selected part highlighting emissive glow & camera focus
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Reset all mesh materials emissive colors
    group.children.forEach(mesh => {
      if (mesh.material) {
        mesh.material.emissive?.setHex(0x000000);
      }
    });

    // Highlight selected part
    const selectedMesh = meshesRef.current[selectedPartKey];
    if (selectedMesh && selectedMesh.material) {
      // Neon blue glow emissive color
      selectedMesh.material.emissive?.setHex(0x2563eb);
      selectedMesh.material.emissiveIntensity = 0.55;

      // Adjust camera focus target towards the selected mesh position
      if (controlsRef.current && cameraRef.current) {
        // Calculate mesh world position
        const worldPosition = new THREE.Vector3();
        selectedMesh.getWorldPosition(worldPosition);

        // Smoothly pan OrbitControls target to focused organ
        controlsRef.current.target.copy(worldPosition);
      }
    }
  }, [selectedPartKey]);

  // 3. Synchronize category/layer visibility toggles
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    group.children.forEach(mesh => {
      const partSystem = mesh.userData.system;
      if (!partSystem) return;

      // Set mesh visibility based on current active system categories
      const matchesSystem = activeSystem === 'all' || partSystem === activeSystem;
      mesh.visible = matchesSystem;
    });
  }, [activeSystem]);

  // Camera Presets for ease of navigation (removes zoom/pan frustration)
  const resetCameraToFullBody = () => {
    if (cameraRef.current && controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      cameraRef.current.position.set(0, 0, 24); // centered height, further back to fit full body
      controlsRef.current.update();
    }
  };

  const focusCameraArea = (area) => {
    if (!cameraRef.current || !controlsRef.current) return;
    if (area === 'head') {
      controlsRef.current.target.set(0, 3.2, 0); // skull/brain level (height 8.5/2 = 4.25 top)
      cameraRef.current.position.set(0, 3.2, 5.5);
    } else if (area === 'torso') {
      controlsRef.current.target.set(0, 0.5, 0); // chest/stomach level
      cameraRef.current.position.set(0, 0.5, 7.5);
    } else if (area === 'legs') {
      controlsRef.current.target.set(0, -2.5, 0); // femur/tibia level
      cameraRef.current.position.set(0, -2.5, 7.5);
    }
    controlsRef.current.update();
  };

  // Programmatic manual movement / pan / zoom
  const moveCamera = (direction) => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const panSpeed = 1.2;
    const zoomSpeed = 1.5;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const tempVec = new THREE.Vector3();
    
    camera.matrix.extractBasis(right, up, tempVec);
    
    if (direction === 'up') {
      camera.position.addScaledVector(up, panSpeed);
      controls.target.addScaledVector(up, panSpeed);
    } else if (direction === 'down') {
      camera.position.addScaledVector(up, -panSpeed);
      controls.target.addScaledVector(up, -panSpeed);
    } else if (direction === 'left') {
      camera.position.addScaledVector(right, -panSpeed);
      controls.target.addScaledVector(right, -panSpeed);
    } else if (direction === 'right') {
      camera.position.addScaledVector(right, panSpeed);
      controls.target.addScaledVector(right, panSpeed);
    } else if (direction === 'zoomIn') {
      const lookDir = new THREE.Vector3();
      camera.getWorldDirection(lookDir);
      camera.position.addScaledVector(lookDir, zoomSpeed);
    } else if (direction === 'zoomOut') {
      const lookDir = new THREE.Vector3();
      camera.getWorldDirection(lookDir);
      camera.position.addScaledVector(lookDir, -zoomSpeed);
    }
    
    controls.update();
  };

  // Nav Pad Button Style
  const navPadBtnStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid var(--outline-variant)',
    background: 'white',
    color: 'var(--on-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    outline: 'none',
    padding: 0
  };

  return (
    <div className="meds-lookup-workspace" style={{ display: 'grid', gridTemplateColumns: '320px 1fr 400px', padding: 0, height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR: Search & Filters */}
      <aside className="meds-sidebar" style={{ borderRight: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div 
          onClick={onHome} 
          style={{ padding: '20px 20px 12px 20px', cursor: onHome ? 'pointer' : 'default' }}
          title={onHome ? "Zurück zur Startseite" : ""}
        >
          <h4 style={{ fontWeight: 800, color: 'var(--on-surface)', margin: '0 0 4px 0', fontSize: '1.05rem' }}>Anatomie-Explorer 3D</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>High-Fidelity 3D-Körpermodell (STL-Katalog)</p>
        </div>

        {/* Search */}
        <div style={{ padding: '0 20px 15px 20px' }}>
          <div className="meds-search-input-wrapper-sidebar">
            <span className="material-symbols-outlined meds-search-icon-sidebar">search</span>
            <input 
              type="text" 
              placeholder="Körperteil suchen (z.B. Herz)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Systems filter menu */}
        <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '8px' }}>Körpersystem filtern</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { id: 'all', label: 'Alle' },
              { id: 'skeleton', label: '💀 Skelett' },
              { id: 'muscular', label: '💪 Muskeln' },
              { id: 'organs', label: '🫁 Organe' },
              { id: 'nervous', label: '⚡ Nerven' },
              { id: 'skin', label: '👤 Haut / Kontur' }
            ].map(sys => (
              <button 
                key={sys.id} 
                className={activeSystem === sys.id ? "meds-preset-tag active" : "meds-preset-tag"}
                style={{ margin: 0, fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => setActiveSystem(sys.id)}
              >
                {sys.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of elements */}
        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 15px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: '8px', paddingLeft: '5px' }}>Körperteile ({filteredParts.length})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredParts.map(([key, part]) => (
              <button
                key={key}
                onClick={() => setSelectedPartKey(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedPartKey === key ? 'var(--primary-container)' : 'transparent',
                  color: selectedPartKey === key ? 'var(--on-primary-container)' : 'var(--on-surface)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: selectedPartKey === key ? 700 : 500,
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{part.name}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, fontStyle: 'italic' }}>{part.latin}</div>
                </div>
                <span className="meds-details-badge" style={{ fontSize: '0.62rem', padding: '2px 6px', margin: 0, opacity: 0.9 }}>
                  {part.system === 'organs' ? 'Organe' : part.system === 'skeleton' ? 'Skelett' : part.system === 'muscular' ? 'Muskeln' : part.system === 'nervous' ? 'Nerven' : 'Haut'}
                </span>
              </button>
            ))}
            {filteredParts.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center', padding: '20px' }}>
                Keine Ergebnisse für Ihre Auswahl.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* CENTER STAGE: Three.js WebGL 3D Anatomy Canvas */}
      <main style={{ display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', overflow: 'hidden' }}>
        
        {/* Loading Progress Bar Panel Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(241, 245, 249, 0.95)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span className="material-symbols-outlined text-[48px] text-[var(--primary)] animate-spin">progress_activity</span>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)' }}>Lade 3D-Körperteile aus der Anatomiedatenbank...</div>
            <div style={{ width: '240px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${loadingProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s ease' }}></div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{loadedCount} von {MESH_PARTS.length} geladen ({loadingProgress}%)</div>
          </div>
        )}

        {/* Viewport Control Badges overlay */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', padding: '6px 14px', borderRadius: '20px', backdropFilter: 'blur(8px)', border: '1px solid var(--outline-variant)', fontSize: '0.72rem', fontWeight: 600 }}>
            🖱️ Modell drehen: Links-Mausziehen • Verschieben: Rechts-Mausziehen • Zoom: Scrollen
          </div>
          
          <button 
            onClick={resetCameraToFullBody}
            style={{ 
              background: 'var(--primary)', 
              color: 'var(--on-primary)', 
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>zoom_out_map</span>
            👤 Ganzkörper-Ansicht
          </button>

          <button 
            onClick={() => focusCameraArea('head')}
            style={{ 
              background: 'white', 
              color: 'var(--on-surface)', 
              border: '1px solid var(--outline-variant)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            💀 Kopf-Fokus
          </button>

          <button 
            onClick={() => focusCameraArea('torso')}
            style={{ 
              background: 'white', 
              color: 'var(--on-surface)', 
              border: '1px solid var(--outline-variant)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🫁 Torso-Fokus
          </button>

          <button 
            onClick={() => focusCameraArea('legs')}
            style={{ 
              background: 'white', 
              color: 'var(--on-surface)', 
              border: '1px solid var(--outline-variant)', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.72rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🦵 Beine-Fokus
          </button>
        </div>

        {/* WebGL Canvas Mount point */}
        <div ref={canvasContainerRef} style={{ width: '100%', height: '100%', outline: 'none' }}></div>

        {/* Floating Navigation Control Pad (Bottom-Right) */}
        <div style={{ 
          position: 'absolute', 
          bottom: '50px', 
          right: '20px', 
          zIndex: 10, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          background: 'rgba(255,255,255,0.85)', 
          padding: '12px', 
          borderRadius: '16px', 
          backdropFilter: 'blur(8px)', 
          border: '1px solid var(--outline-variant)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', textAlign: 'center', display: 'block', marginBottom: '4px' }}>Modell bewegen</label>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gridTemplateRows: 'repeat(3, 36px)', gap: '4px', justifyItems: 'center', alignItems: 'center' }}>
            <div></div>
            <button onClick={() => moveCamera('up')} style={navPadBtnStyle} title="Nach oben bewegen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_upward</span>
            </button>
            <div></div>
            
            <button onClick={() => moveCamera('left')} style={navPadBtnStyle} title="Nach links bewegen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            </button>
            <button onClick={resetCameraToFullBody} style={{ ...navPadBtnStyle, background: 'var(--primary)', color: 'white' }} title="Ansicht zentrieren">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            </button>
            <button onClick={() => moveCamera('right')} style={navPadBtnStyle} title="Nach rechts bewegen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </button>
            
            <div></div>
            <button onClick={() => moveCamera('down')} style={navPadBtnStyle} title="Nach unten bewegen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_downward</span>
            </button>
            <div></div>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--outline-variant)', margin: '4px 0' }}></div>

          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            <button onClick={() => moveCamera('zoomIn')} style={{ ...navPadBtnStyle, width: '54px', borderRadius: '18px' }} title="Heranzoomen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>zoom_in</span>
            </button>
            <button onClick={() => moveCamera('zoomOut')} style={{ ...navPadBtnStyle, width: '54px', borderRadius: '18px' }} title="Wegzoomen">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>zoom_out</span>
            </button>
          </div>
        </div>

        {/* Legal CC compliance attribution notice footer */}
        <footer style={{ 
          position: 'absolute', 
          bottom: '8px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 10, 
          fontSize: '0.62rem', 
          color: 'var(--on-surface-variant)', 
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)',
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          Mesh-Daten: BodyParts3D, Copyright© 2008 Life Science Integrated Database Center lizenziert unter CC BY-SA 2.1 JP
        </footer>
      </main>

      {/* RIGHT SIDEBAR: Anatomy Details and Medical/Nursing Relevance Card */}
      <aside className="meds-details-card" style={{ borderLeft: '1px solid var(--outline-variant)', overflowY: 'auto', display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
        {selectedPart ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header info */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="meds-details-badge" style={{ backgroundColor: 'var(--primary)' }}>
                  {selectedPart.system === 'organs' ? 'Organe' : selectedPart.system === 'skeleton' ? 'Skelett' : selectedPart.system === 'muscular' ? 'Muskeln' : selectedPart.system === 'nervous' ? 'Nerven' : 'Haut'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                  Ref: FMA-{selectedPartKey.substring(0, 4).toUpperCase()}
                </span>
              </div>
              <h3 style={{ fontWeight: 800, color: 'var(--on-surface)', fontSize: '1.4rem', margin: '0 0 2px 0' }}>{selectedPart.name}</h3>
              <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--on-surface-variant)', margin: 0 }}>Anatomisch: {selectedPart.latin}</p>
            </div>

            {/* Physiological Function */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '15px' }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>Physiologische Funktion</h5>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.45', margin: 0, color: 'var(--on-surface)' }}>{selectedPart.function}</p>
            </div>

            {/* Nursing Relevance (Pflegerische Relevanz) */}
            <div className="meds-advisory-section" style={{ borderLeftColor: 'var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">clinical_notes</span>
                <h5 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary)', margin: 0 }}>Pflegerische Relevanz & Praxis</h5>
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.45', margin: 0, color: 'var(--on-surface)' }}>
                {selectedPart.nursing}
              </p>
            </div>

            {/* Common Pathologies */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '15px' }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>Typische Krankheitsbilder</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPart.diseases.split(', ').map((dis, idx) => (
                  <span key={idx} className="meds-side-effect-tag" style={{ margin: 0 }}>
                    ⚠️ {dis}
                  </span>
                ))}
              </div>
            </div>

            {/* Associated Medications */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '15px' }}>
              <h5 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>Verbundene Arzneimittel (Med-DB)</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedPart.meds.map((med, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '8px 12px', 
                      backgroundColor: 'var(--surface-variant)', 
                      borderRadius: '6px', 
                      border: '1px solid var(--outline-variant)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px' 
                    }}
                  >
                    <span className="material-symbols-outlined text-[16px] text-purple-600">pill</span>
                    <strong>{med}</strong>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
            <span className="material-symbols-outlined text-[48px]" style={{ opacity: 0.5, marginBottom: '12px' }}>body_system</span>
            <p>Wählen Sie eine Struktur auf der Anatomiekarte aus, um klinische Details und Medikamentenzuordnungen anzuzeigen.</p>
          </div>
        )}
      </aside>

    </div>
  );
}
