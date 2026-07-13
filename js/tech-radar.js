/**
 * Tech Radar 3D & Architecture Explorer
 * Interactive 3D Technology Universe for Portfolio
 * 
 * Dependencies: Three.js r128, OrbitControls, CSS2DRenderer (loaded via CDN)
 * 
 * Exposes: window.initTechRadar(), window.switch3DMode(mode)
 */
(function () {
    'use strict';

    // ============================================================
    // DATA - Tech Node Groups (Skills Mode)
    // ============================================================

    const TECH_NODE_GROUPS = {
        languages: {
            label: { pt: 'Linguagens', en: 'Languages' },
            color: 0x63b3ed,
            nodes: [
                { id: 'java', label: 'Java / Kotlin' },
                { id: 'csharp', label: 'C# /.NET' },
                { id: 'python', label: 'Python' },
                { id: 'js', label: 'JavaScript' },
                { id: 'ts', label: 'TypeScript' }
            ]
        },
        frontend: {
            label: { pt: 'Front-end', en: 'Front-end' },
            color: 0x68d391,
            nodes: [
                { id: 'react', label: 'React' },
                { id: 'angular', label: 'Angular' },
                { id: 'vue', label: 'Vue.js' },
                { id: 'blazor', label: 'Blazor' }
            ]
        },
        backend: {
            label: { pt: 'Back-end', en: 'Back-end' },
            color: 0xf6ad55,
            nodes: [
                { id: 'spring', label: 'Spring Boot' },
                { id: 'node', label: 'Node.js' },
                { id: 'dotnet', label: '.NET Core' },
                { id: 'go', label: 'Golang' }
            ]
        },
        database: {
            label: { pt: 'Bancos de Dados', en: 'Databases' },
            color: 0xfc8181,
            nodes: [
                { id: 'oracle', label: 'Oracle' },
                { id: 'sqlserver', label: 'SQL Server' },
                { id: 'postgres', label: 'PostgreSQL' },
                { id: 'mongodb', label: 'MongoDB' },
                { id: 'redis', label: 'Redis' }
            ]
        },
        cloud: {
            label: { pt: 'Cloud & DevOps', en: 'Cloud & DevOps' },
            color: 0xb794f4,
            nodes: [
                { id: 'aws', label: 'AWS' },
                { id: 'azure', label: 'Azure' },
                { id: 'docker', label: 'Docker' },
                { id: 'k8s', label: 'Kubernetes' },
                { id: 'terraform', label: 'Terraform' },
                { id: 'cicd', label: 'CI/CD' }
            ]
        },
        messaging: {
            label: { pt: 'Mensageria', en: 'Messaging' },
            color: 0xf687d3,
            nodes: [
                { id: 'kafka', label: 'Apache Kafka' },
                { id: 'rabbitmq', label: 'RabbitMQ' },
                { id: 'azuresb', label: 'Azure SB' }
            ]
        },
        observability: {
            label: { pt: 'Observabilidade', en: 'Observability' },
            color: 0x81e6d9,
            nodes: [
                { id: 'prometheus', label: 'Prometheus' },
                { id: 'grafana', label: 'Grafana' },
                { id: 'elk', label: 'ELK Stack' },
                { id: 'otel', label: 'OpenTelemetry' }
            ]
        }
    };

    // ============================================================
    // DATA - Architecture Mode
    // ============================================================

    const ARCH_NODES = [
        { id: 'LB', label: 'NGINX / HAProxy', layer: 0, color: 0x63b3ed },
        { id: 'GW', label: 'Kong / Spring Gateway', layer: 1, color: 0xf6ad55 },
        { id: 'IAM', label: 'Keycloak / Azure AD', layer: 1, color: 0xb794f4 },
        { id: 'ERP', label: 'Java / .NET', layer: 2, color: 0x68d391 },
        { id: 'CRM', label: 'Node.js / Python', layer: 2, color: 0x68d391 },
        { id: 'BI', label: 'Power BI / Python', layer: 2, color: 0x68d391 },
        { id: 'DB', label: 'Oracle / SQL Server', layer: 3, color: 0xfc8181 },
        { id: 'RC', label: 'Redis', layer: 3, color: 0xfc8181 },
        { id: 'DW', label: 'Snowflake / Hadoop', layer: 3, color: 0xfc8181 },
        { id: 'MQ', label: 'Kafka / RabbitMQ', layer: 4, color: 0xf687d3 },
        { id: 'WK', label: '.NET / Java Workers', layer: 5, color: 0x68d391 },
        { id: 'MN', label: 'Prometheus / Grafana', layer: 6, color: 0x81e6d9 }
    ];

    const ARCH_EDGES = [
        { from: 'LB', to: 'GW' },
        { from: 'GW', to: 'IAM' },
        { from: 'GW', to: 'ERP' },
        { from: 'GW', to: 'CRM' },
        { from: 'GW', to: 'BI' },
        { from: 'ERP', to: 'DB' },
        { from: 'CRM', to: 'RC' },
        { from: 'BI', to: 'DW' },
        { from: 'ERP', to: 'MQ' },
        { from: 'CRM', to: 'MQ' },
        { from: 'MQ', to: 'WK' },
        { from: 'GW', to: 'MN' }
    ];

    // ============================================================
    // CONSTANTS
    // ============================================================

    const VISIBILITY = {
        FOCUSED_LABEL_OPACITY: 1,
        FOCUSED_NODE_EMISSIVE: 0.5,
        DIMMED_LABEL_OPACITY: 0.12,
        DIMMED_CATEGORY_OPACITY: 0.15,
        DIMMED_NODE_EMISSIVE: 0.05,
        DIMMED_OPACITY: 0.2,
        HOVER_EMISSIVE: 0.9,
        DEFAULT_EMISSIVE: 0.3,
        LINE_OPACITY_VISIBLE: 0.45,
        LINE_OPACITY_DEFAULT: 0.25,
        ANIMATION_DURATION: 'opacity 0.4s ease'
    };

    const CORE_NODE_ID = 'core';

    const SCENE_CONFIG = {
        camera: { fov: 45, near: 0.1, far: 1000, initialPos: [0, 5, 16] },
        controls: { dampingFactor: 0.08, minDistance: 4, maxDistance: 35, autoRotateSpeed: 0.7 },
        // Each group orbits at its own radius (concentric rings)
        // orbitBaseRadius: innermost orbit distance
        // orbitStep: additional distance per orbit level
        // categoryRadiusOffset: how far out the category label sits from its orbit
        skills: { orbitBaseRadius: 3.0, orbitStep: 1.4, categoryRadiusOffset: 0.9, coreScale: 1.4, coreYOffset: -1.5, labelYOffset: 0.7, nodeArcHeight: 0.1, nodeSpacing: 1.1 },
        arch: { layerSpacing: 2.5, nodeSpacing: 4.5, labelOffset: 1.2, cameraPos: [-10, 8, 14], target: [0, 0.5, 0] }
    };

    // ============================================================
    // STATE
    // ============================================================

    let scene, camera, renderer, labelRenderer, controls;
    let starField;
    const nodeObjects = {};
    let flowParticles = [];
    let animationId = null;
    let currentMode = 'skills';
    let isInitialized = false;
    let raycaster, mouse;
    let hoveredObject = null;
    let clock;
    let container;

    // Group tracking for Skills mode focus
    let allLabels = [];
    let allLines = [];
    let allNodeMeshes = [];
    let nodeGroupMap = {};
    let focusGroup = null;
    let categoryLabels = [];
    let coreNode = null;
    let coreLabel = null;

    // ============================================================
    // PUBLIC: initTechRadar
    // ============================================================

    function initTechRadar() {
        if (isInitialized) {
            destroyTechRadar();
        }

        container = document.getElementById('mermaid-container');
        if (!container) return;
        if (typeof THREE === 'undefined') {
            console.warn('[TechRadar] Three.js not available, keeping Mermaid fallback.');
            return;
        }

        isInitialized = true;
        clock = new THREE.Clock();

        setupScene();
        setupCamera();
        setupRenderers();
        setupControls();
        setupRaycaster();
        setupLights();
        createStarField();

        renderSkillsMode();

        attachEventListeners();
        animate();
    }

    // ============================================================
    // SETUP
    // ============================================================

    function setupScene() {
        scene = new THREE.Scene();
    }

    function setupCamera() {
        const cfg = SCENE_CONFIG.camera;
        camera = new THREE.PerspectiveCamera(
            cfg.fov,
            container.clientWidth / container.clientHeight,
            cfg.near,
            cfg.far
        );
        camera.position.set(...cfg.initialPos);
        camera.lookAt(0, 0, 0);
    }

    function setupRenderers() {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x1a202c, 0);
        container.innerHTML = '';
        container.style.position = 'relative';
        container.appendChild(renderer.domElement);

        labelRenderer = new THREE.CSS2DRenderer();
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.left = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);
    }

    function setupControls() {
        const cfg = SCENE_CONFIG.controls;
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = cfg.dampingFactor;
        controls.minDistance = cfg.minDistance;
        controls.maxDistance = cfg.maxDistance;
        controls.autoRotate = true;
        controls.autoRotateSpeed = cfg.autoRotateSpeed;
        controls.target.set(0, 0, 0);
    }

    function setupRaycaster() {
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
    }

    function setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 10, 7);
        scene.add(dir);
        const dir2 = new THREE.DirectionalLight(0x4488ff, 0.4);
        dir2.position.set(-5, -3, -5);
        scene.add(dir2);
    }

    function attachEventListeners() {
        renderer.domElement.addEventListener('click', onCanvasClick);
        renderer.domElement.addEventListener('touchend', onCanvasTouchEnd, { passive: false });
        renderer.domElement.addEventListener('mousemove', onCanvasMove);
        renderer.domElement.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
        window.addEventListener('resize', handleResize);
    }

    // ============================================================
    // STAR FIELD
    // ============================================================

    function createStarField() {
        const count = 600;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 200;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
            const c = 0.4 + Math.random() * 0.6;
            colors[i * 3] = c;
            colors[i * 3 + 1] = c;
            colors[i * 3 + 2] = c + Math.random() * 0.3;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        starField = new THREE.Points(geo, mat);
        scene.add(starField);
    }

    // ============================================================
    // SKILLS MODE
    // ============================================================

    function renderSkillsMode() {
        clearScene();
        currentMode = 'skills';
        controls.autoRotate = true;

        resetSkillsTracking();

        const groups = Object.entries(TECH_NODE_GROUPS);
        const cfg = SCENE_CONFIG.skills;

        // Define logical software engineering layers from core to periphery
        // Each layer sits on its own concentric orbit
        const LAYER_ORDER = [
            // Innermost (closest to core): fundamental languages
            'languages',
            // Presentation layer
            'frontend',
            // Business logic layer
            'backend',
            // Data layer
            'database',
            // Integration layer (messaging between services)
            'messaging',
            // Infrastructure & deployment layer
            'cloud',
            // Outermost: monitoring and observability (cross-cutting)
            'observability'
        ];

        // Build ordered group list following software engineering layers
        const layerGroups = LAYER_ORDER
            .map(key => {
                const entry = groups.find(([k]) => k === key);
                return entry ? { key: entry[0], group: entry[1] } : null;
            })
            .filter(Boolean);

        // Each layer gets its own orbital ring, evenly spaced around the circle
        layerGroups.forEach(({ key, group }, index) => {
            const orbitRadius = cfg.orbitBaseRadius + index * cfg.orbitStep;

            // Distribute each layer evenly around 360°, offset by layer index
            // so different layers don't overlap in angle
            const layerAngleOffset = (index / layerGroups.length) * Math.PI * 2;
            const nodeArc = (group.nodes.length / 10) * Math.PI; // proportional arc
            const halfArc = nodeArc / 2;

            // Center the group arc at the layer's angle position
            const angleMid = layerAngleOffset;
            const angleStart = angleMid - halfArc;
            const angleEnd = angleMid + halfArc;

            createCategoryLabel(key, group, angleMid, orbitRadius, cfg);
            createGroupNodes(key, group, angleStart, angleEnd, orbitRadius, cfg);
            createIntraGroupLines(key, group);
        });

        createCoreNode();
    }

    function resetSkillsTracking() {
        allLabels = [];
        allLines = [];
        allNodeMeshes = [];
        nodeGroupMap = {};
        categoryLabels = [];
        focusGroup = null;
        coreNode = null;
        coreLabel = null;
    }

    function createCategoryLabel(groupKey, group, angleMid, orbitRadius, cfg) {
        const catRadius = orbitRadius + cfg.categoryRadiusOffset;
        const catLabel = makeLabel(group.label.pt, group.color, true);
        catLabel.position.set(
            Math.cos(angleMid) * catRadius,
            0.3,
            Math.sin(angleMid) * catRadius
        );
        scene.add(catLabel);
        categoryLabels.push({ labelObj: catLabel, groupKey: groupKey });
    }

    function createGroupNodes(groupKey, group, angleStart, angleEnd, orbitRadius, cfg) {
        const nodeCount = group.nodes.length;
        const centerY = 0;
        const { nodeArcHeight, nodeSpacing } = cfg;

        // For groups with many nodes in a small arc, spread them out along the orbit
        // by evenly distributing them across the arc
        group.nodes.forEach((node, nodeIndex) => {
            const t = nodeCount > 1 ? nodeIndex / (nodeCount - 1) : 0.5;
            const angle = angleStart + (angleEnd - angleStart) * t;
            const x = Math.cos(angle) * orbitRadius;
            const z = Math.sin(angle) * orbitRadius;
            const yOffset = Math.sin(t * Math.PI) * nodeArcHeight;

            const sphere = makeNode(node.id, node.label, group.color);
            sphere.position.set(x, centerY + yOffset, z);
            sphere.userData.groupKey = groupKey;
            sphere.userData._baseY = centerY + yOffset;
            scene.add(sphere);
            nodeObjects[node.id] = sphere;
            nodeGroupMap[node.id] = groupKey;
            allNodeMeshes.push({ mesh: sphere, groupKey: groupKey });

            const label = makeLabel(node.label, group.color, false);
            const labelYOffset = centerY + yOffset + SCENE_CONFIG.skills.labelYOffset;
            label.position.set(x, labelYOffset, z);
            scene.add(label);
            allLabels.push({ labelObj: label, groupKey: groupKey });
        });
    }

    function createIntraGroupLines(groupKey, group) {
        const groupLines = [];
        for (let i = 0; i < group.nodes.length - 1; i++) {
            const n1 = nodeObjects[group.nodes[i].id];
            const n2 = nodeObjects[group.nodes[i + 1].id];
            if (n1 && n2) {
                const line = makeLine(n1.position, n2.position, group.color, false);
                scene.add(line);
                groupLines.push(line);
            }
        }
        allLines.push({ lines: groupLines, groupKey: groupKey });
    }

    function createCoreNode() {
        const cfg = SCENE_CONFIG.skills;
        const core = makeNode(CORE_NODE_ID, 'Full Stack', 0x007acc);
        core.scale.set(cfg.coreScale, cfg.coreScale, cfg.coreScale);
        core.position.set(0, 0, 0);
        scene.add(core);
        nodeObjects[CORE_NODE_ID] = core;
        coreNode = core;

        const coreLabelObj = makeLabel('Full Stack', 0x007acc, true);
        coreLabelObj.position.set(0, cfg.coreYOffset, 0);
        scene.add(coreLabelObj);
        coreLabel = coreLabelObj;
    }

    // ============================================================
    // ARCHITECTURE MODE
    // ============================================================

    function renderArchitectureMode() {
        clearScene();
        currentMode = 'arch';
        controls.autoRotate = false;

        const layers = groupByLayer(ARCH_NODES);
        const layerKeys = Object.keys(layers).sort((a, b) => a - b);
        const cfg = SCENE_CONFIG.arch;

        layerKeys.forEach((layerKey, layerIndex) => {
            const nodes = layers[layerKey];
            const y = (layerKeys.length - 1 - layerIndex) * cfg.layerSpacing - 2;
            const totalWidth = (nodes.length - 1) * cfg.nodeSpacing;

            nodes.forEach((node, nodeIndex) => {
                const x = nodeIndex * cfg.nodeSpacing - totalWidth / 2;

                const sphere = makeNode(node.id, node.label, node.color);
                sphere.position.set(x, y, 0);
                sphere.userData._baseY = y;
                scene.add(sphere);
                nodeObjects[node.id] = sphere;

                const label = makeLabel(node.label, node.color, false);
                label.position.set(x, y - cfg.labelOffset, 0);
                scene.add(label);
            });
        });

        ARCH_EDGES.forEach(edge => {
            const from = nodeObjects[edge.from];
            const to = nodeObjects[edge.to];
            if (from && to) {
                const line = makeLine(from.position, to.position, 0x63b3ed, true);
                scene.add(line);
                makeFlowParticles(from.position, to.position);
            }
        });

        camera.position.set(...cfg.cameraPos);
        controls.target.set(...cfg.target);
        controls.update();
    }

    function groupByLayer(nodes) {
        const layers = {};
        nodes.forEach(n => {
            if (!layers[n.layer]) layers[n.layer] = [];
            layers[n.layer].push(n);
        });
        return layers;
    }

    // ============================================================
    // HELPERS: 3D Objects
    // ============================================================

    function makeNode(id, label, color) {
        const geo = new THREE.SphereGeometry(0.55, 24, 24);
        const mat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: VISIBILITY.DEFAULT_EMISSIVE,
            shininess: 90,
            specular: new THREE.Color(0x555577)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { id: id, label: label, type: 'node', color: color };

        // Add a subtle glow ring around the node
        const ringGeo = new THREE.RingGeometry(0.62, 0.75, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.1;
        mesh.add(ring);

        return mesh;
    }

    function makeLabel(text, color, isCategory) {
        const hex = '#' + new THREE.Color(color).getHexString();
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;

        const div = document.createElement('div');
        div.textContent = text;
        div.style.color = '#e2e8f0';
        div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        div.style.fontSize = isCategory ? '14px' : '12px';
        div.style.fontWeight = isCategory ? '700' : '600';
        div.style.letterSpacing = isCategory ? '0.03em' : '0.01em';
        div.style.textShadow = '0 0 14px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)';
        div.style.background = isCategory
            ? `rgba(${r}, ${g}, ${b}, 0.25)`
            : 'rgba(0,0,0,0.55)';
        div.style.padding = isCategory ? '5px 16px' : '3px 10px';
        div.style.borderRadius = isCategory ? '14px' : '6px';
        div.style.border = isCategory
            ? `1px solid rgba(${r}, ${g}, ${b}, 0.4)`
            : '1px solid rgba(255,255,255,0.08)';
        div.style.backdropFilter = 'blur(6px)';
        div.style.boxShadow = isCategory
            ? `0 0 20px rgba(${r}, ${g}, ${b}, 0.15)`
            : '0 2px 8px rgba(0,0,0,0.4)';
        div.style.whiteSpace = 'nowrap';
        div.style.pointerEvents = 'none';
        return new THREE.CSS2DObject(div);
    }

    function makeLine(from, to, color, isArchEdge) {
        const points = [from.clone(), to.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: isArchEdge ? VISIBILITY.LINE_OPACITY_VISIBLE : VISIBILITY.LINE_OPACITY_DEFAULT,
            blending: THREE.AdditiveBlending
        });
        return new THREE.Line(geo, mat);
    }

    function makeFlowParticles(from, to) {
        const count = 15;
        const positions = new Float32Array(count * 3);
        const progress = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            progress[i] = i / count;
            const point = new THREE.Vector3().lerpVectors(from, to, progress[i]);
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0x63b3ed,
            size: 0.12,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geo, mat);
        particles.userData = {
            from: from,
            to: to,
            progress: progress,
            speed: 0.4 + Math.random() * 0.2
        };
        scene.add(particles);
        flowParticles.push(particles);
    }

    // ============================================================
    // SCENE CLEANUP
    // ============================================================

    function clearScene() {
        const keep = new Set();
        keep.add(starField);
        scene.children.forEach(child => {
            if (child.type === 'AmbientLight' || child.type === 'DirectionalLight' || child.type === 'Scene') {
                keep.add(child);
            }
        });

        const remove = [];
        scene.children.forEach(child => {
            if (!keep.has(child)) remove.push(child);
        });

        remove.forEach(child => {
            scene.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });

        for (const key in nodeObjects) delete nodeObjects[key];
        flowParticles = [];
    }

    // ============================================================
    // PUBLIC: switch3DMode
    // ============================================================

    function switch3DMode(mode) {
        if (!isInitialized) return;
        clearScene();

        const btnSkills = document.getElementById('btn-skills');
        const btnArch = document.getElementById('btn-arch');
        if (btnSkills) btnSkills.classList.toggle('active', mode === 'skills');
        if (btnArch) btnArch.classList.toggle('active', mode === 'arch');

        if (mode === 'skills') renderSkillsMode();
        else if (mode === 'arch') renderArchitectureMode();
    }

    // ============================================================
    // INTERACTION - Helpers
    // ============================================================

    function getMousePosition(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getTouchPosition(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        const touch = event.changedTouches[0];
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getHitNode(event) {
        getMousePosition(event);
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children);

        for (const hit of hits) {
            if (hit.object.userData && hit.object.userData.type === 'node') {
                return hit.object;
            }
        }
        return null;
    }

    function getHitNodeAtPosition() {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children);

        for (const hit of hits) {
            if (hit.object.userData && hit.object.userData.type === 'node') {
                return hit.object;
            }
        }
        return null;
    }

    let touchStartPos = null;
    let touchHandled = false;

    // ============================================================
    // INTERACTION - Touch (Mobile)
    // ============================================================

    function onCanvasTouchStart(event) {
        const touch = event.changedTouches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        touchHandled = false;
    }

    function onCanvasTouchEnd(event) {
        // Only trigger click if it was a tap (not a drag/scroll)
        if (!touchStartPos) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - touchStartPos.x;
        const dy = touch.clientY - touchStartPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If user dragged more than 10px, it was a scroll/pan — ignore
        if (dist > 10) {
            touchStartPos = null;
            return;
        }
        touchStartPos = null;

        // Prevent default to avoid double-firing with click
        event.preventDefault();

        // Mark as handled so onCanvasClick ignores this interaction
        touchHandled = true;

        // Reuse click logic with touch coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        const t = event.changedTouches[0];
        mouse.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;

        const hitNode = getHitNodeAtPosition();

        if (hitNode) {
            const userData = hitNode.userData;

            if (userData.id === CORE_NODE_ID) {
                resetFocusSkills();
                showNodeInfo(userData);
                return;
            }

            if (currentMode === 'skills') {
                const groupKey = userData.groupKey;
                if (groupKey) {
                    if (focusGroup === groupKey) {
                        resetFocusSkills();
                    } else {
                        focusGroupSkills(groupKey);
                    }
                    showNodeInfo(userData);
                    return;
                }
            }

            showNodeInfo(userData);
            return;
        }

        if (currentMode === 'skills' && focusGroup !== null) {
            resetFocusSkills();
        }
    }

    // ============================================================
    // INTERACTION - Click
    // ============================================================

    function onCanvasClick(event) {
        // If touch already handled this interaction, ignore the click event
        if (touchHandled) {
            touchHandled = false;
            return;
        }
        const hitNode = getHitNode(event);

        if (hitNode) {
            const userData = hitNode.userData;

            if (userData.id === CORE_NODE_ID) {
                resetFocusSkills();
                showNodeInfo(userData);
                return;
            }

            if (currentMode === 'skills') {
                const groupKey = userData.groupKey;
                if (groupKey) {
                    if (focusGroup === groupKey) {
                        resetFocusSkills();
                    } else {
                        focusGroupSkills(groupKey);
                    }
                    showNodeInfo(userData);
                    return;
                }
            }

            showNodeInfo(userData);
            return;
        }

        if (currentMode === 'skills' && focusGroup !== null) {
            resetFocusSkills();
        }
    }

    // ============================================================
    // INTERACTION - Hover
    // ============================================================

    function onCanvasMove(event) {
        const hitNode = getHitNode(event);

        if (hitNode) {
            document.body.style.cursor = 'pointer';
            if (hoveredObject && hoveredObject !== hitNode) {
                setGlowIntensity(hoveredObject, VISIBILITY.DEFAULT_EMISSIVE);
            }
            setGlowIntensity(hitNode, VISIBILITY.HOVER_EMISSIVE);
            hoveredObject = hitNode;
        } else {
            document.body.style.cursor = 'default';
            if (hoveredObject) {
                setGlowIntensity(hoveredObject, VISIBILITY.DEFAULT_EMISSIVE);
                hoveredObject = null;
            }
        }
    }

    function setGlowIntensity(mesh, intensity) {
        if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = intensity;
        }
    }

    // ============================================================
    // NODE INFO TOOLTIP
    // ============================================================

    function showNodeInfo(data) {
        const existing = document.getElementById('tech-radar-tooltip');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'tech-radar-tooltip';
        div.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26, 32, 44, 0.95);
            border: 1px solid rgba(99, 179, 237, 0.3);
            border-radius: 12px;
            padding: 14px 28px;
            color: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 9999;
            backdrop-filter: blur(8px);
            text-align: center;
            animation: techRadarFadeIn 0.3s ease;
            pointer-events: none;
            max-width: 90vw;
        `;
        div.innerHTML = `
            <div style="font-size:15px;font-weight:600;margin-bottom:2px;">${data.label}</div>
            <div style="font-size:11px;color:#a0aec0;margin-bottom:2px;">${
                data.id !== CORE_NODE_ID
                    ? 'Clique para isolar este grupo'
                    : 'Clique para resetar visualização'
            }</div>
        `;
        document.body.appendChild(div);

        const dismissTooltip = (event) => {
            if (!div.contains(event.target) && event.target !== renderer.domElement) {
                div.remove();
                document.removeEventListener('click', dismissTooltip);
            }
        };
        setTimeout(() => document.addEventListener('click', dismissTooltip), 150);
    }

    // ============================================================
    // SKILLS FOCUS (Group Highlight)
    // ============================================================

    function setElementOpacity(element, opacity, transition) {
        element.style.opacity = opacity;
        element.style.transition = transition || VISIBILITY.ANIMATION_DURATION;
    }

    function setMeshVisibility(mesh, emissiveIntensity, transparent, opacity) {
        if (mesh.material) {
            mesh.material.emissiveIntensity = emissiveIntensity;
            mesh.material.transparent = transparent;
            mesh.material.opacity = opacity;
        }
    }

    function setLineVisibility(line, opacity, visible) {
        line.material.opacity = opacity;
        line.visible = visible;
    }

    function focusGroupSkills(groupKey) {
        focusGroup = groupKey;

        // Dim all category labels except the focused one
        categoryLabels.forEach(({ labelObj, groupKey: currentKey }) => {
            const opacity = currentKey === groupKey
                ? VISIBILITY.FOCUSED_LABEL_OPACITY
                : VISIBILITY.DIMMED_CATEGORY_OPACITY;
            setElementOpacity(labelObj.element, opacity);
        });

        // Dim all node labels except the focused group
        allLabels.forEach(({ labelObj, groupKey: currentKey }) => {
            const opacity = currentKey === groupKey
                ? VISIBILITY.FOCUSED_LABEL_OPACITY
                : VISIBILITY.DIMMED_LABEL_OPACITY;
            setElementOpacity(labelObj.element, opacity);
        });

        // Dim meshes (nodes) except the focused group
        allNodeMeshes.forEach(({ mesh, groupKey: currentKey }) => {
            if (currentKey === groupKey) {
                setMeshVisibility(mesh, VISIBILITY.FOCUSED_NODE_EMISSIVE, false, 1);
            } else {
                setMeshVisibility(mesh, VISIBILITY.DIMMED_NODE_EMISSIVE, true, VISIBILITY.DIMMED_OPACITY);
            }
        });

        // Dim core node
        if (coreNode) {
            setMeshVisibility(coreNode, VISIBILITY.DIMMED_NODE_EMISSIVE, true, VISIBILITY.DIMMED_OPACITY);
        }
        if (coreLabel) {
            setElementOpacity(coreLabel.element, VISIBILITY.DIMMED_LABEL_OPACITY);
        }

        // Show only focused group lines
        allLines.forEach(({ lines, groupKey: currentKey }) => {
            const opacity = currentKey === groupKey
                ? VISIBILITY.LINE_OPACITY_VISIBLE
                : VISIBILITY.LINE_OPACITY_DEFAULT;
            const visible = currentKey === groupKey;
            lines.forEach(line => setLineVisibility(line, opacity, visible));
        });
    }

    function resetFocusSkills() {
        focusGroup = null;

        // Restore all category labels
        categoryLabels.forEach(({ labelObj }) => {
            setElementOpacity(labelObj.element, VISIBILITY.FOCUSED_LABEL_OPACITY);
        });

        // Restore all node labels
        allLabels.forEach(({ labelObj }) => {
            setElementOpacity(labelObj.element, VISIBILITY.FOCUSED_LABEL_OPACITY);
        });

        // Restore all meshes
        allNodeMeshes.forEach(({ mesh }) => {
            setMeshVisibility(mesh, VISIBILITY.DEFAULT_EMISSIVE, false, 1);
        });

        // Restore core
        if (coreNode) {
            setMeshVisibility(coreNode, VISIBILITY.DEFAULT_EMISSIVE, false, 1);
        }
        if (coreLabel) {
            setElementOpacity(coreLabel.element, VISIBILITY.FOCUSED_LABEL_OPACITY);
        }

        // Restore all lines
        allLines.forEach(({ lines }) => {
            lines.forEach(line => setLineVisibility(line, VISIBILITY.LINE_OPACITY_DEFAULT, true));
        });
    }

    // ============================================================
    // ANIMATION LOOP
    // ============================================================

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        animateNodeFloat(time);
        animateFlowParticles();
        animateStarField();

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    function animateNodeFloat(time) {
        let index = 0;
        for (const key in nodeObjects) {
            const node = nodeObjects[key];
            if (node && node.position) {
                if (node.userData._floatOffset === undefined) {
                    node.userData._floatOffset = Math.random() * Math.PI * 2;
                }
                if (node.userData._baseY === undefined) {
                    node.userData._baseY = node.position.y;
                }
                const floatY = Math.sin(time * 0.4 + node.userData._floatOffset + index * 0.3) * 0.08;
                node.position.y = node.userData._baseY + floatY;
            }
            index++;
        }
    }

    function animateFlowParticles() {
        flowParticles.forEach(particles => {
            const positions = particles.geometry.attributes.position.array;
            const { from, to, progress, speed } = particles.userData;
            const dt = 0.008;
            for (let i = 0; i < progress.length; i++) {
                progress[i] = (progress[i] + dt) % 1;
                const point = new THREE.Vector3().lerpVectors(from, to, progress[i]);
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = point.z;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        });
    }

    function animateStarField() {
        if (starField) {
            starField.rotation.y += 0.0004;
            starField.rotation.x += 0.0001;
        }
    }

    // ============================================================
    // RESIZE
    // ============================================================

    function handleResize() {
        if (!container || !renderer) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        labelRenderer.setSize(width, height);
    }

    // ============================================================
    // DESTROY
    // ============================================================

    function destroyTechRadar() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (renderer) {
            renderer.domElement.removeEventListener('click', onCanvasClick);
            renderer.domElement.removeEventListener('touchend', onCanvasTouchEnd);
            renderer.domElement.removeEventListener('mousemove', onCanvasMove);
            renderer.domElement.removeEventListener('touchstart', onCanvasTouchStart);
            renderer.dispose();
            renderer = null;
        }

        if (labelRenderer) {
            labelRenderer.domElement.remove();
            labelRenderer = null;
        }

        if (controls) {
            controls.dispose();
            controls = null;
        }

        window.removeEventListener('resize', handleResize);

        scene = null;
        camera = null;
        starField = null;
        flowParticles = [];
        for (const key in nodeObjects) delete nodeObjects[key];
        hoveredObject = null;
        isInitialized = false;

        document.body.style.cursor = 'default';

        const tooltip = document.getElementById('tech-radar-tooltip');
        if (tooltip) tooltip.remove();
    }

    // ============================================================
    // EXPOSE PUBLIC API
    // ============================================================

    window.initTechRadar = initTechRadar;
    window.switch3DMode = switch3DMode;
    window.destroyTechRadar = destroyTechRadar;

})();