/**
 * KoerperView.jsx — AnatomyXR Clinical Anatomy Explorer
 * 
 * Clean reset to exact design matching reference screenshot:
 * 1. Top Bar: Brand "✚ AnatomyXR Clinical Anatomy Explorer", Tabs ("3D Viewer", "Quiz", "Library"), Search input ("Search organs, conditions..."), and action buttons (Settings ⚙️, Help ❓, User avatar).
 * 2. Organ Category Pills: Horizontal filter bar (Herz 🫀, Gehirn 🧠, Lunge 🫁, Leber 🩸, Nieren 🫘, Auge 👁️, Darm 🌀, Bauchspeicheldrüse 🥞, Haut 🖐️).
 * 3. 3D Canvas Viewer (Left Box):
 *    - Title: Herz / Herz-Kreislauf-System
 *    - Controls: "Latin (TA2)", "X-Ray: OFF", "Auto-Rotate: ON", "Camera".
 *    - Interactive 3D Model Rendering with Three.js (Rotatable GLB/STL model with OrbitControls).
 *    - Bottom Pins Bar: "📍 Aorta", "📍 Linker Vorhof", "📍 Rechter Vorhof", "📍 Linke Herzkammer", "📍 Rechte Herzkammer".
 * 4. Right Anatomical Data Panel:
 *    - Tip box: "💡 Click directly on a 3D hotspot in the model or on the pins below to view details."
 *    - Anatomical Data stats grid: WEIGHT (250-350 g), SIZE (ca. faustgroß), OUTPUT (4.9 - 5.5 L/min).
 *    - Relevant Diseases pill tags: Koronare Herzkrankheit (KHK), Herzinsuffizienz, Herzinfarkt, Vorhofflimmern.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { UserProfileMenu } from './feedShared';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const ORGANS_DATA = [
  {
    id: 'heart',
    name: 'Herz',
    latin: 'Cor',
    system: 'Herz-Kreislauf-System',
    model: '/models/heart.glb',
    stl: 'FMA7274.stl',
    icon: '🫀',
    accent: '#0066cc',
    stats: { weight: '250 - 350 g', size: 'ca. faustgroß', output: '4.9 - 5.5 L/min' },
    function: 'Hohlmuskel, der als zentrale Pumpe den Körper- und Lungenkreislauf antreibt und Gewebe mit Sauerstoff versorgt.',
    nursing: 'Vitalzeichenkontrolle (Puls, RR, SpO2), Herzfrequenz-Monitoring, Pflegedokumentation bei Herzinsuffizienz und KHK.',
    diseases: ['Koronare Herzkrankheit (KHK)', 'Herzinsuffizienz', 'Herzinfarkt', 'Vorhofflimmern'],
    meds: ['Metoprolol (Betablocker)', 'Ramipril (ACE-Hemmer)', 'Marcumar (Antikoagulanz)', 'Digitoxin'],
    hotspots: [
      { id: 'aorta', name: 'Aorta', latin: 'Aorta', position: [-0.35, 1.45, 0.4], color: '#ef4444', desc: 'Leitet sauerstoffreiches Blut in den Körperkreislauf.' },
      { id: 'left-atrium', name: 'Linker Vorhof', latin: 'Atrium sinistrum', position: [0.6, 0.5, 0.4], color: '#3b82f6', desc: 'Nimmt sauerstoffreiches Blut aus den Lungenvenen auf.' },
      { id: 'right-atrium', name: 'Rechter Vorhof', latin: 'Atrium dextrum', position: [-0.6, 0.3, 0.4], color: '#06b6d4', desc: 'Sammelt sauerstoffarmes Blut aus den Hohlvenen.' },
      { id: 'left-ventricle', name: 'Linke Herzkammer', latin: 'Ventriculus sinister', position: [0.5, -0.6, 0.5], color: '#3b82f6', desc: 'Pumpstärkste Kammer für den Körperkreislauf.' },
      { id: 'right-ventricle', name: 'Rechte Herzkammer', latin: 'Ventriculus dexter', position: [-0.5, -0.5, 0.5], color: '#ef4444', desc: 'Pumpt Blut durch die Lungenarterie zur Lunge.' }
    ]
  },
  {
    id: 'brain',
    name: 'Gehirn',
    latin: 'Encephalon',
    system: 'Nervensystem',
    model: '/models/brain.glb',
    stl: 'FMA61822.stl',
    icon: '🧠',
    accent: '#8b5cf6',
    stats: { weight: '1300 - 1400 g', size: 'ca. 86 Mrd. Neuronen', output: '15 - 20% Blutanteil' },
    function: 'Zentrales Steuerorgan für Motorik, Sensorik, Kognition, Emotionen, Bewusstsein und vegetative Körperfunktionen.',
    nursing: 'Neurologischer Status (Glasgow Coma Scale), Pupillenkontrolle, Sturzprophylaxe, Apoplex-Früherkennung (FAST-Test).',
    diseases: ['Schlaganfall (Apoplex)', 'Demenz (Alzheimer)', 'Parkinson', 'Epilepsie'],
    meds: ['Donepezil', 'L-Dopa', 'Levetiracetam'],
    hotspots: [
      { id: 'frontal', name: 'Stirnlappen', latin: 'Lobus frontalis', position: [-0.5, 0.5, 0.6], color: '#8b5cf6', desc: 'Handlungssteuerung, Persönlichkeit und Motorik.' },
      { id: 'parietal', name: 'Scheitellappen', latin: 'Lobus parietalis', position: [0.1, 0.8, 0.5], color: '#3b82f6', desc: 'Verarbeitet somatosensorische Informationen.' },
      { id: 'temporal', name: 'Schläfenlappen', latin: 'Lobus temporalis', position: [0.6, -0.1, 0.6], color: '#06b6d4', desc: 'Hörzentrum und Sprachverständnis.' },
      { id: 'cerebellum', name: 'Kleinhirn', latin: 'Cerebellum', position: [0.5, -0.7, 0.4], color: '#ec4899', desc: 'Feinmotorik, Gleichgewicht und Bewegungskoordination.' }
    ]
  },
  {
    id: 'lungs',
    name: 'Lunge',
    latin: 'Pulmones',
    system: 'Atmungssystem',
    model: '/models/lungs.glb',
    stl: 'FMA7333.stl',
    icon: '🫁',
    accent: '#06b6d4',
    stats: { weight: '6 L Totalkapazität', size: 'ca. 300 Mio. Alveolen', output: 'ca. 100 m² Fläche' },
    function: 'Gasaustausch: Aufnahme von Sauerstoff ins Blut und Abgabe von Kohlendioxid bei der Ausatmung.',
    nursing: 'Atembeobachtung (Frequenz, Tiefe, Atemgeräusche), Inhalationstherapie, Sekretmobilisation.',
    diseases: ['COPD', 'Pneumonie', 'Asthma bronchiale', 'Lungenemphysem'],
    meds: ['Salbutamol', 'Budesonid', 'Ambroxol'],
    hotspots: [
      { id: 'trachea', name: 'Luftröhre', latin: 'Trachea', position: [0, 1.3, 0.2], color: '#06b6d4', desc: 'Knorpelschlauch zur Führung der Atemluft.' },
      { id: 'right-lung', name: 'Rechter Lungenflügel', latin: 'Pulmo dexter', position: [-0.9, 0.1, 0.5], color: '#ef4444', desc: 'Besteht aus 3 Lungenlappen.' },
      { id: 'left-lung', name: 'Linker Lungenflügel', latin: 'Pulmo sinister', position: [0.9, 0.1, 0.5], color: '#3b82f6', desc: 'Besteht aus 2 Lungenlappen mit Herzeinschnitt.' }
    ]
  },
  {
    id: 'liver',
    name: 'Leber',
    latin: 'Hepar',
    system: 'Verdauungs- & Stoffwechselsystem',
    model: '/models/liver.glb',
    stl: 'FMA7197.stl',
    icon: '🩸',
    accent: '#f59e0b',
    stats: { weight: '1400 - 1800 g', size: '1.5 L/min Fluss', output: '4 Leberlappen' },
    function: 'Zentrale Entgiftungs- und Stoffwechselzentrale, Synthese von Gerinnungsfaktoren und Gallensekretion.',
    nursing: 'Überwachung auf Ikterus, Asziteskontrolle (Bauchumfang messen), Medikamentendosierung bei Leberinsuffizienz.',
    diseases: ['Leberzirrhose', 'Hepatitis A/B/C', 'Fettleber (NAFLD)', 'Cholestase'],
    meds: ['Silymarin', 'Ursodeoxycholic Acid', 'Vitamin K'],
    hotspots: [
      { id: 'right-lobe', name: 'Rechter Leberlappen', latin: 'Lobus hepatis dexter', position: [-0.6, 0.3, 0.6], color: '#f59e0b', desc: 'Größter Leberlappen unter dem rechten Rippenbogen.' },
      { id: 'left-lobe', name: 'Linker Leberlappen', latin: 'Lobus hepatis sinister', position: [0.7, 0.2, 0.6], color: '#3b82f6', desc: 'Erstreckt sich über die Oberbauchmitte nach links.' }
    ]
  },
  {
    id: 'kidneys',
    name: 'Nieren',
    latin: 'Renes',
    system: 'Harnsystem',
    model: '/models/kidneys.glb',
    stl: 'FMA7204.stl',
    icon: '🫘',
    accent: '#10b981',
    stats: { weight: '120 - 200 g je Niere', size: 'ca. 1 Mio. Nephrone', output: '1.5 - 2.0 L/Tag' },
    function: 'Harnpflichtige Substanzen filtern, Blutdruckregulation (Renin-Angiotensin System), Elektrolyt- und Säure-Basen-Haushalt.',
    nursing: 'Flüssigkeitsbilanzierung (Einfuhr/Ausfuhr), Urindiagnostik, Ödemkontrolle an Beinen.',
    diseases: ['Chronische Niereninsuffizienz', 'Pyelonephritis', 'Nierensteine'],
    meds: ['Furosemid', 'Torasemid', 'Erythropoetin (EPO)'],
    hotspots: [
      { id: 'cortex', name: 'Nierenrinde', latin: 'Cortex renalis', position: [-0.7, 0.4, 0.5], color: '#10b981', desc: 'Enthält die Glomeruli zur Primärharn-Filtration.' },
      { id: 'medulla', name: 'Nierenmark', latin: 'Medulla renalis', position: [0.6, -0.2, 0.5], color: '#06b6d4', desc: 'Besteht aus Nierenpyramiden zur Rückresorption.' }
    ]
  },
  {
    id: 'eyeball',
    name: 'Auge',
    latin: 'Oculus',
    system: 'Sinnesorgan (Visuelles System)',
    model: '/models/eyeball.glb',
    icon: '👁️',
    accent: '#3b82f6',
    stats: { weight: 'ca. 7.5 g', size: '24 mm Durchmesser', output: '126 Mio. Fotorezeptoren' },
    function: 'Optisches Sinnesorgan zur Wahrnehmung von Licht, Farben und räumlicher Tiefe.',
    nursing: 'Augentropfengabe, Lichtreaktionsprüfung der Pupillomotorik, postoperative Augenpflege.',
    diseases: ['Katarakt (Grauer Star)', 'Glaukom (Grüner Star)', 'Makuladegeneration', 'Konjunktivitis'],
    meds: ['Timolol Augentropfen', 'Dexamethason', 'Künstliche Tränen'],
    hotspots: [
      { id: 'cornea', name: 'Hornhaut', latin: 'Cornea', position: [0, 0, 1.2], color: '#3b82f6', desc: 'Transparentes Gewebe an der Augenvorderseite.' },
      { id: 'retina', name: 'Netzhaut', latin: 'Retina', position: [0, 0, -1.1], color: '#ef4444', desc: 'Fotorezeptorenschicht zur Umwandlung von Lichtsignalen.' }
    ]
  },
  {
    id: 'intestine',
    name: 'Darm',
    latin: 'Intestinum',
    system: 'Verdauungstrakt',
    model: '/models/intestine.glb',
    stl: 'FMA7207.stl',
    icon: '🌀',
    accent: '#a855f7',
    stats: { weight: 'ca. 6 - 8 m Länge', size: '32 m² Fläche', output: 'Trillionen Bakterien' },
    function: 'Nährstoffaufnahme (Dünndarm), Elektrolyt- und Wasserresorption (Dickdarm) sowie Stuhleindickung.',
    nursing: 'Stuhlbeobachtung (Bristol-Stuhlformen-Skala), Obstipationsprophylaxe, Stoma-Pflege, Sondenernährung.',
    diseases: ['Colitis ulcerosa', 'Morbus Crohn', 'Ileus (Darmverschluss)', 'Darmkrebs'],
    meds: ['Lactulose', 'Loperamid', 'Mesalazin'],
    hotspots: [
      { id: 'small-intestine', name: 'Dünndarm', latin: 'Intestinum tenue', position: [0, -0.2, 0.4], color: '#a855f7', desc: 'Hauptort der enzymatischen Verdauung und Resorption.' },
      { id: 'colon', name: 'Dickdarm', latin: 'Intestinum crassum', position: [0, 0.6, 0.5], color: '#f59e0b', desc: 'Entzieht dem Verdauungsbrei Wasser.' }
    ]
  },
  {
    id: 'pancreas',
    name: 'Bauchspeicheldrüse',
    latin: 'Pancreas',
    system: 'Endokrines & Exokrines System',
    model: '/models/pancreas.glb',
    icon: '🥞',
    accent: '#f59e0b',
    stats: { weight: '70 - 100 g', size: '15 - 20 cm Länge', output: 'Langerhans-Inseln' },
    function: 'Produktion von Verdauungsenzymen (Lipase, Amylase) und Hormonen zur Blutzuckerregulation (Insulin, Glukagon).',
    nursing: 'Blutzuckermessung (BZ-Tagesprofil), Injektion von Humaninsulin, Ernährungsberatung bei Diabetes.',
    diseases: ['Diabetes mellitus Typ 1 & 2', 'Pancreatitis', 'Pancreaskarzinom'],
    meds: ['Human / Analog Insulin', 'Metformin', 'Kreon'],
    hotspots: [
      { id: 'head', name: 'Pankreaskopf', latin: 'Caput pancreatis', position: [-0.6, 0.1, 0.5], color: '#f59e0b', desc: 'Liegt in der C-Schlinge des Zwölffingerdarms.' },
      { id: 'tail', name: 'Pankreasschwanz', latin: 'Cauda pancreatis', position: [0.7, 0.3, 0.5], color: '#3b82f6', desc: 'Reicht bis zum Milzhilum.' }
    ]
  },
  {
    id: 'skin',
    name: 'Haut',
    latin: 'Cutis / Integumentum',
    system: 'Integumentäres System',
    model: '/models/skin.glb',
    stl: 'FMA7163.stl',
    icon: '🖐️',
    accent: '#ec4899',
    stats: { weight: '3 - 5 kg', size: '1.5 - 2.0 m² Fläche', output: 'Epidermis, Dermis, Subcutis' },
    function: 'Schutzbarriere gegen Erreger, mechanische Reize und UV-Strahlung; Thermoregulation und Tastsinn.',
    nursing: 'Dekubitusprophylaxe (Braden-Skala, Umlagerung), Hautinspektion, Intertrigoprophylaxe, Wunddokumentation.',
    diseases: ['Dekubitus (Druckgeschwür)', 'Intertrigo', 'Neurodermitis', 'Skin Tear'],
    meds: ['Panthenol Wundsalbe', 'Octenisept', 'Hydrokortison Creme'],
    hotspots: [
      { id: 'epidermis', name: 'Oberhaut', latin: 'Epidermis', position: [0, 0.8, 0.3], color: '#ec4899', desc: 'Gefäßlose Schutzschicht mit Verhornung.' },
      { id: 'dermis', name: 'Lederhaut', latin: 'Dermis', position: [0, 0, 0.3], color: '#f2a33b', desc: 'Enthält Kollagenfasern, Blutgefäße und Nervenendigung.' }
    ]
  }
];

const QUIZ_QUESTIONS = [
  {
    question: "Welches Blutgefäß leitet sauerstoffreiches Blut aus der linken Herzkammer in den Körperkreislauf?",
    options: ["Lungenarterie", "Aorta", "Obere Hohlvene", "Sinus coronarius"],
    correct: 1,
    explanation: "Die Aorta ist die größte Schlagader des Körpers und entspringt aus der linken Herzkammer."
  },
  {
    question: "Was ist die Hauptfunktion der Nierenrinde (Cortex renalis)?",
    options: ["Gallenspeicherung", "Primärharn-Filtration in den Glomeruli", "Hormonsekretion von Insulin", "Surfactant-Bildung"],
    correct: 1,
    explanation: "In der Nierenrinde befinden sich die Glomeruli zur Ultrafiltration des Blutes."
  },
  {
    question: "Welches Organ produziert Insulin in den Langerhans-Inseln?",
    options: ["Leber", "Bauchspeicheldrüse (Pankreas)", "Gallenblase", "Milz"],
    correct: 1,
    explanation: "Die Beta-Zellen der Langerhans-Inseln im Pankreas bilden das blutzuckersenkende Hormon Insulin."
  }
];

export default function KoerperView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [activeTopTab, setActiveTopTab] = useState('3d'); // '3d' | 'quiz' | 'library'
  const [selectedOrganId, setSelectedOrganId] = useState('heart');
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  
  // Controls state
  const [latinMode, setLatinMode] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // 3D Canvas state
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const selectedOrgan = useMemo(() => {
    return ORGANS_DATA.find(o => o.id === selectedOrganId) || ORGANS_DATA[0];
  }, [selectedOrganId]);

  const activeHotspot = useMemo(() => {
    if (!selectedHotspotId || !selectedOrgan.hotspots) return null;
    return selectedOrgan.hotspots.find(h => h.id === selectedHotspotId);
  }, [selectedHotspotId, selectedOrgan]);

  // -------------------------------------------------------------
  // THREE.JS 3D CANVAS INITIALIZATION & MODEL LOADING
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeTopTab !== '3d' || !mountRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.8);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // GLTF / GLB / STL 3D Model Loader
    setIsLoadingModel(true);
    const gltfLoader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    if (selectedOrgan.model) {
      gltfLoader.load(
        selectedOrgan.model,
        (gltf) => {
          if (modelRef.current) scene.remove(modelRef.current);

          const model = gltf.scene;
          model.scale.set(1.5, 1.5, 1.5);
          model.position.set(0, 0, 0);

          // Center Model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (xrayMode) {
                child.material.transparent = true;
                child.material.opacity = 0.35;
                child.material.wireframe = true;
              }
            }
          });

          scene.add(model);
          modelRef.current = model;
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.warn("Using STL / procedural model for:", selectedOrgan.name, err);
          createFallbackProceduralModel(scene, selectedOrgan, xrayMode);
          setIsLoadingModel(false);
        }
      );
    } else {
      createFallbackProceduralModel(scene, selectedOrgan, xrayMode);
      setIsLoadingModel(false);
    }

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [selectedOrganId, activeTopTab]);

  // Handle AutoRotate & XRay updates dynamically
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.material.transparent = xrayMode;
          child.material.opacity = xrayMode ? 0.4 : 1.0;
          child.material.wireframe = xrayMode;
        }
      });
    }
  }, [xrayMode]);

  // 3D STL & Procedural Fallback Model Creator
  function createFallbackProceduralModel(scene, organ, isXray) {
    if (modelRef.current) scene.remove(modelRef.current);

    const group = new THREE.Group();

    if (organ.stl) {
      const stlLoader = new STLLoader();
      stlLoader.load(
        `/api/stl/${organ.stl}`,
        (geometry) => {
          geometry.center();
          const colorHex = organ.accent ? organ.accent.replace('#', '0x') : 0x0066cc;
          const material = new THREE.MeshStandardMaterial({
            color: parseInt(colorHex, 16),
            roughness: 0.35,
            metalness: 0.15,
            wireframe: isXray,
            transparent: isXray,
            opacity: isXray ? 0.4 : 1.0
          });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.scale.set(0.008, 0.008, 0.008);
          mesh.rotation.x = -Math.PI / 2;
          group.add(mesh);
        },
        undefined,
        (err) => {
          const color = organ.accent || '#0066cc';
          const geometry = new THREE.SphereGeometry(1.1, 32, 32);
          const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, wireframe: isXray });
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        }
      );
    } else {
      const color = organ.accent || '#0066cc';
      const geometry = new THREE.SphereGeometry(1.1, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, wireframe: isXray });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    }

    scene.add(group);
    modelRef.current = group;
  }

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleQuizAnswer = (optionIdx) => {
    setQuizSelectedOption(optionIdx);
    if (optionIdx === QUIZ_QUESTIONS[quizIndex].correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleQuizNext = () => {
    if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
      setQuizIndex(prev => prev + 1);
      setQuizSelectedOption(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setQuizSelectedOption(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const filteredOrgans = ORGANS_DATA.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return o.name.toLowerCase().includes(q) || o.latin.toLowerCase().includes(q) || o.system.toLowerCase().includes(q);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: "#0f172a" }}>
      
      {/* ============================================================ */}
      {/* 1. TOP HEADER NAVIGATION (Matched 1:1 to Reference Screenshot) */}
      {/* ============================================================ */}
      <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        
        {/* Left Brand */}
        <div onClick={onHome} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} title="Zurück zur Startseite">
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#0047ab", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: 900, fontSize: "1.1rem" }}>
            ✚
          </div>
          <div>
            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#0047ab", letterSpacing: "-0.02em", lineHeight: 1 }}>
              AnatomyXR
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>
              Clinical Anatomy Explorer
            </div>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav style={{ display: "flex", gap: "32px" }}>
          <button
            onClick={() => setActiveTopTab("3d")}
            style={{
              height: "64px",
              background: "none",
              border: "none",
              borderBottom: activeTopTab === "3d" ? "3px solid #0047ab" : "3px solid transparent",
              color: activeTopTab === "3d" ? "#0047ab" : "#64748b",
              fontWeight: activeTopTab === "3d" ? 800 : 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>3D Viewer</span>
          </button>

          <button
            onClick={() => setActiveTopTab("quiz")}
            style={{
              height: "64px",
              background: "none",
              border: "none",
              borderBottom: activeTopTab === "quiz" ? "3px solid #0047ab" : "3px solid transparent",
              color: activeTopTab === "quiz" ? "#0047ab" : "#64748b",
              fontWeight: activeTopTab === "quiz" ? 800 : 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>Quiz</span>
          </button>

          <button
            onClick={() => setActiveTopTab("library")}
            style={{
              height: "64px",
              background: "none",
              border: "none",
              borderBottom: activeTopTab === "library" ? "3px solid #0047ab" : "3px solid transparent",
              color: activeTopTab === "library" ? "#0047ab" : "#64748b",
              fontWeight: activeTopTab === "library" ? 800 : 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>Library</span>
          </button>
        </nav>

        {/* Center Search & Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          <div style={{ position: "relative", width: "260px" }}>
            <span style={{ position: "absolute", left: "12px", top: "9px", color: "#94a3b8", fontSize: "0.85rem" }}>🔍</span>
            <input
              type="text"
              placeholder="Search organs, conditions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "20px",
                border: "1px solid #cbd5e1",
                background: "#f1f5f9",
                fontSize: "0.85rem",
                outline: "none",
                color: "#0f172a"
              }}
            />
          </div>

          <button style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }} title="Settings">⚙️</button>
          <button style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }} title="Help">❓</button>

          <UserProfileMenu
            variant="light"
            userRole={userRole}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            onOpenAuthModal={onOpenAuthModal}
            onOpenAvatarPicker={onOpenAvatarPicker}
          />

        </div>

      </header>

      {/* ============================================================ */}
      {/* 2. QUICK ORGAN CATEGORY PILLS BAR (Matched 1:1 to Screenshot) */}
      {/* ============================================================ */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px" }}>
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "2px" }}>
          {filteredOrgans.map(organ => {
            const isSelected = organ.id === selectedOrganId;

            return (
              <button
                key={organ.id}
                onClick={() => { setSelectedOrganId(organ.id); setSelectedHotspotId(null); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  border: isSelected ? "none" : "1px solid #cbd5e1",
                  background: isSelected ? "#0066cc" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#334155",
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 6px rgba(0, 102, 204, 0.25)" : "none"
                }}
              >
                <span>{organ.icon}</span>
                <span>{organ.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN WORKSPACE VIEW ROUTING */}
      {/* ============================================================ */}

      {/* 3D VIEWER WORKSPACE */}
      {activeTopTab === "3d" && (
        <main style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "flex-start" }}>
          
          {/* LEFT 3D CANVAS BOX (Matched to Reference Screenshot) */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
            
            {/* Header Controls Bar */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{selectedOrgan.icon}</span>
                  <span>{latinMode ? selectedOrgan.latin : selectedOrgan.name}</span>
                </h2>
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>
                  {selectedOrgan.system}
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div style={{ display: "flex", gap: "8px" }}>
                
                <button
                  onClick={() => setLangMode(prev => prev === "de" ? "latin" : "de")}
                  style={{ background: latinMode ? "#e0f2fe" : "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>🌐</span>
                  <span>Latin (TA2)</span>
                </button>

                <button
                  onClick={() => setXrayMode(prev => !prev)}
                  style={{ background: xrayMode ? "#e0f2fe" : "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>📷</span>
                  <span>X-Ray: {xrayMode ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={() => setAutoRotate(prev => !prev)}
                  style={{ background: autoRotate ? "#0047ab" : "#ffffff", color: autoRotate ? "#ffffff" : "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>🔄</span>
                  <span>Auto-Rotate: {autoRotate ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={handleResetCamera}
                  style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 12px", fontSize: "0.78rem", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <span>📷</span>
                  <span>Camera</span>
                </button>

              </div>
            </div>

            {/* 3D Model Rendering Canvas Container */}
            <div style={{ position: "relative", width: "100%", height: "460px", background: "#f8fafc" }}>
              
              <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

              {/* Loading Overlay */}
              {isLoadingModel && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(248, 250, 252, 0.8)", backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", border: "3px solid #cbd5e1", borderTopColor: "#0066cc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0066cc" }}>Lade 3D Anatomie-Modell...</span>
                </div>
              )}

            </div>

            {/* Bottom Hotspot Pins Row */}
            <div style={{ padding: "16px 24px", background: "#ffffff", borderTop: "1px solid #f1f5f9", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {selectedOrgan.hotspots?.map(spot => {
                const isSpotSelected = spot.id === selectedHotspotId;

                return (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedHotspotId(spot.id)}
                    style={{
                      background: isSpotSelected ? "#fee2e2" : "#f1f5f9",
                      color: isSpotSelected ? "#dc2626" : "#334155",
                      border: isSpotSelected ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span style={{ color: "#dc2626" }}>📍</span>
                    <span>{spot.name}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* RIGHT ANATOMICAL DATA PANEL (Matched 1:1 to Reference Screenshot) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Top Tip Card */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.2rem", color: "#0066cc" }}>💡</span>
              <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.4 }}>
                Click directly on a 3D hotspot in the model or on the pins below to view details.
              </div>
            </div>

            {/* Anatomical Data Container */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#0066cc" }}>📊</span> Anatomical Data
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>WEIGHT</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0066cc", marginTop: "4px" }}>
                    {selectedOrgan.stats.weight}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>SIZE</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0066cc", marginTop: "4px" }}>
                    {selectedOrgan.stats.size}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", gridColumn: "span 2" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>OUTPUT</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0066cc", marginTop: "4px" }}>
                    {selectedOrgan.stats.output}
                  </div>
                </div>

              </div>

              {/* Relevant Diseases Section (Matched to Screenshot) */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🩺</span> Relevant Diseases
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedOrgan.diseases.map((d, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        padding: "6px 12px",
                        borderRadius: "14px",
                        fontSize: "0.78rem",
                        fontWeight: 700
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selected Hotspot Description if Active */}
              {activeHotspot && (
                <div style={{ marginTop: "20px", background: "#eff6ff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0284c7" }}>📍 {activeHotspot.name}</div>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "#334155", lineHeight: 1.4 }}>{activeHotspot.desc}</p>
                </div>
              )}

            </div>

          </div>

        </main>
      )}

      {/* QUIZ WORKSPACE */}
      {activeTopTab === "quiz" && (
        <main style={{ padding: "40px", maxWidth: "680px", margin: "0 auto" }}>
          
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "36px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0066cc" }}>Klinisches Quiz • Frage {quizIndex + 1} von {QUIZ_QUESTIONS.length}</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#059669" }}>Punkte: {quizScore}</span>
            </div>

            {!quizCompleted ? (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
                  {QUIZ_QUESTIONS[quizIndex].question}
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  {QUIZ_QUESTIONS[quizIndex].options.map((opt, idx) => {
                    const isSelected = quizSelectedOption === idx;
                    const isCorrect = idx === QUIZ_QUESTIONS[quizIndex].correct;

                    let bg = "#ffffff";
                    let border = "1px solid #cbd5e1";
                    let color = "#334155";

                    if (quizSelectedOption !== null) {
                      if (isCorrect) {
                        bg = "#dcfce7";
                        border = "1px solid #86efac";
                        color = "#166534";
                      } else if (isSelected) {
                        bg = "#fee2e2";
                        border = "1px solid #fca5a5";
                        color = "#991b1b";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuizAnswer(idx)}
                        disabled={quizSelectedOption !== null}
                        style={{ padding: "14px 18px", borderRadius: "12px", border: border, background: bg, color: color, fontWeight: 700, fontSize: "0.92rem", textAlign: "left", cursor: "pointer" }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quizSelectedOption !== null && (
                  <div>
                    <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", fontSize: "0.85rem", color: "#475569", marginBottom: "20px" }}>
                      💡 {QUIZ_QUESTIONS[quizIndex].explanation}
                    </div>
                    <button onClick={handleQuizNext} style={{ width: "100%", background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px", fontWeight: 800, cursor: "pointer" }}>
                      Nächste Frage →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "10px" }}>🎉</div>
                <h2>Quiz Beendet!</h2>
                <p>Dein Endergebnis: {quizScore} von {QUIZ_QUESTIONS.length} Punkten.</p>
                <button onClick={handleResetQuiz} style={{ background: "#0047ab", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: 800, cursor: "pointer", marginTop: "16px" }}>
                  Erneut versuchen 🔄
                </button>
              </div>
            )}

          </div>

        </main>
      )}

      {/* LIBRARY WORKSPACE */}
      {activeTopTab === "library" && (
        <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ margin: "0 0 20px 0" }}>Anatomische Bibliothek & Lexikon</h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {ORGANS_DATA.map(organ => (
              <div key={organ.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{organ.icon}</div>
                <h3 style={{ margin: "0 0 4px 0" }}>{organ.name} ({organ.latin})</h3>
                <div style={{ fontSize: "0.8rem", color: "#0066cc", fontWeight: 700, marginBottom: "10px" }}>{organ.system}</div>
                <p style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.4 }}>{organ.function}</p>
                <button onClick={() => { setSelectedOrganId(organ.id); setActiveTopTab("3d"); }} style={{ background: "#0066cc", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}>3D Modell öffnen →</button>
              </div>
            ))}
          </div>
        </main>
      )}

    </div>
  );
}
