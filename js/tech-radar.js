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
    let allLabels = [];           // { labelObj, groupKey }
    let allLines = [];            // { lineObj, groupKey }
    let allNodeMeshes = [];       // { mesh, groupKey }
    let nodeGroupMap = {};        // nodeId -> groupKey
    let focusGroup = null;        // currently focused group key, null = all visible
    let categoryLabels = [];      // { labelObj, groupKey }
    let coreNode = null;
    let coreLabel = null;

    // ============================================================
    // PUBLIC: initTechRadar
    // ============================================================

    function initTechRadar() {
        // Destroy previous instance if re-initializing (e.g. language switch)
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

        // Scene
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 6, 16);
        camera.lookAt(0, 0, 0);

        // WebGL Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x1a202c, 0);
        container.innerHTML = '';
        container.style.position = 'relative';
        container.appendChild(renderer.domElement);

        // CSS2D Label Renderer
        labelRenderer = new THREE.CSS2DRenderer();
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.left = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 4;
        controls.maxDistance = 35;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
        controls.target.set(0, 0, 0);

        // Raycaster
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Lights
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(5, 10, 7);
        scene.add(dir);
        const dir2 = new THREE.DirectionalLight(0x4488ff, 0.4);
        dir2.position.set(-5, -3, -5);
        scene.add(dir2);

        // Starfield
        createStarField();

        // Render default mode
        renderSkillsMode();

        // Events
        renderer.domElement.addEventListener('click', onCanvasClick);
        renderer.domElement.addEventListener('mousemove', onCanvasMove);
        window.addEventListener('resize', handleResize);

        // Start loop
        animate();
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

        // Reset tracking
        allLabels = [];
        allLines = [];
        allNodeMeshes = [];
        nodeGroupMap = {};
        categoryLabels = [];
        focusGroup = null;
        coreNode = null;
        coreLabel = null;

        const groups = Object.entries(TECH_NODE_GROUPS);
        const gCount = groups.length;
        const radius = 4.5;
        const cY = 0;

        groups.forEach(([key, group], gi) => {
            const aStart = (gi / gCount) * Math.PI * 2;
            const aEnd = ((gi + 1) / gCount) * Math.PI * 2;
            const aMid = (aStart + aEnd) / 2;
            const nCount = group.nodes.length;
            const nRadius = radius + (nCount > 4 ? 0.3 : 0);

            // Category label
            const catR = radius + 1.5;
            const catLbl = makeLabel(group.label.pt, group.color, true);
            catLbl.position.set(Math.cos(aMid) * catR, cY + 0.3, Math.sin(aMid) * catR);
            scene.add(catLbl);
            categoryLabels.push({ labelObj: catLbl, groupKey: key });

            // Nodes
            group.nodes.forEach((node, ni) => {
                const t = nCount > 1 ? ni / (nCount - 1) : 0.5;
                const angle = aStart + (aEnd - aStart) * t;
                const x = Math.cos(angle) * nRadius;
                const z = Math.sin(angle) * nRadius;
                const yOff = Math.sin(t * Math.PI) * 0.6;

                const sphere = makeNode(node.id, node.label, group.color);
                sphere.position.set(x, cY + yOff, z);
                sphere.userData.groupKey = key;
                scene.add(sphere);
                nodeObjects[node.id] = sphere;
                nodeGroupMap[node.id] = key;
                allNodeMeshes.push({ mesh: sphere, groupKey: key });

                const lbl = makeLabel(node.label, group.color, false);
                lbl.position.set(x, cY + yOff + 0.8, z);
                scene.add(lbl);
                allLabels.push({ labelObj: lbl, groupKey: key });
            });
        });

        // Core
        const core = makeNode('core', 'Full Stack', 0x007acc);
        core.scale.set(1.4, 1.4, 1.4);
        core.position.set(0, cY, 0);
        scene.add(core);
        nodeObjects.core = core;
        coreNode = core;

        const coreLbl = makeLabel('Full Stack', 0x007acc, true);
        coreLbl.position.set(0, cY - 1.2, 0);
        scene.add(coreLbl);
        coreLabel = coreLbl;

        // Intra-group connections
        groups.forEach(([key, group]) => {
            const gLines = [];
            for (let i = 0; i < group.nodes.length - 1; i++) {
                const n1 = nodeObjects[group.nodes[i].id];
                const n2 = nodeObjects[group.nodes[i + 1].id];
                if (n1 && n2) {
                    const line = makeLine(n1.position, n2.position, group.color, 0.12);
                    scene.add(line);
                    gLines.push(line);
                }
            }
            allLines.push({ lines: gLines, groupKey: key });
        });
    }

    // ============================================================
    // ARCHITECTURE MODE
    // ============================================================

    function renderArchitectureMode() {
        clearScene();
        currentMode = 'arch';
        controls.autoRotate = false;

        // Group by layer
        const layers = {};
        ARCH_NODES.forEach(n => {
            if (!layers[n.layer]) layers[n.layer] = [];
            layers[n.layer].push(n);
        });

        const lKeys = Object.keys(layers).sort((a, b) => a - b);
        const lSpacing = 2.0;

        lKeys.forEach((lk, li) => {
            const nodes = layers[lk];
            const y = (lKeys.length - 1 - li) * lSpacing - 2;
            const spacing = 3.2;
            const totalW = (nodes.length - 1) * spacing;

            nodes.forEach((node, ni) => {
                const x = ni * spacing - totalW / 2;

                const sphere = makeNode(node.id, node.label, node.color);
                sphere.position.set(x, y, 0);
                scene.add(sphere);
                nodeObjects[node.id] = sphere;

                const lbl = makeLabel(node.label, node.color, false);
                lbl.position.set(x, y - 0.9, 0);
                scene.add(lbl);
            });
        });

        // Edges
        ARCH_EDGES.forEach(edge => {
            const from = nodeObjects[edge.from];
            const to = nodeObjects[edge.to];
            if (from && to) {
                const line = makeLine(from.position, to.position, 0x63b3ed, 1.0);
                scene.add(line);
                makeFlowParticles(from.position, to.position);
            }
        });

        // Camera position
        camera.position.set(-8, 6, 12);
        controls.target.set(0, 0.5, 0);
        controls.update();
    }

    // ============================================================
    // HELPERS: 3D Objects
    // ============================================================

    function makeNode(id, label, color) {
        const geo = new THREE.SphereGeometry(0.45, 20, 20);
        const mat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.25,
            shininess: 70,
            specular: new THREE.Color(0x333366)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData = { id: id, label: label, type: 'node', color: color };
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
        div.style.fontSize = isCategory ? '13px' : '11px';
        div.style.fontWeight = isCategory ? '700' : '500';
        div.style.letterSpacing = isCategory ? '0.03em' : '0';
        div.style.textShadow = '0 0 12px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)';
        div.style.background = isCategory
            ? `rgba(${r}, ${g}, ${b}, 0.15)`
            : 'rgba(0,0,0,0.3)';
        div.style.padding = isCategory ? '4px 14px' : '2px 8px';
        div.style.borderRadius = isCategory ? '12px' : '4px';
        div.style.border = isCategory
            ? `1px solid rgba(${r}, ${g}, ${b}, 0.25)`
            : 'none';
        div.style.backdropFilter = 'blur(4px)';
        div.style.whiteSpace = 'nowrap';
        div.style.pointerEvents = 'none';
        return new THREE.CSS2DObject(div);
    }

    function makeLine(from, to, color, width) {
        const pts = [from.clone(), to.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: width > 0.5 ? 0.35 : 0.15,
            blending: THREE.AdditiveBlending
        });
        return new THREE.Line(geo, mat);
    }

    function makeFlowParticles(from, to) {
        const count = 15;
        const pos = new Float32Array(count * 3);
        const prog = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            prog[i] = i / count;
            const p = new THREE.Vector3().lerpVectors(from, to, prog[i]);
            pos[i * 3] = p.x;
            pos[i * 3 + 1] = p.y;
            pos[i * 3 + 2] = p.z;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0x63b3ed,
            size: 0.12,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const pts = new THREE.Points(geo, mat);
        pts.userData = { from: from, to: to, progress: prog, speed: 0.4 + Math.random() * 0.2 };
        scene.add(pts);
        flowParticles.push(pts);
    }

    // ============================================================
    // SCENE CLEANUP
    // ============================================================

    function clearScene() {
        const keep = new Set();
        keep.add(starField);
        scene.children.forEach(c => {
            if (c.type === 'AmbientLight' || c.type === 'DirectionalLight' || c.type === 'Scene') {
                keep.add(c);
            }
        });

        const remove = [];
        scene.children.forEach(c => {
            if (!keep.has(c)) remove.push(c);
        });

        remove.forEach(c => {
            scene.remove(c);
            if (c.geometry) c.geometry.dispose();
            if (c.material) {
                if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                else c.material.dispose();
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
    // INTERACTION
    // ============================================================

    function onCanvasClick(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children);

        for (const h of hits) {
            if (h.object.userData && h.object.userData.type === 'node') {
                // If clicking on core node, reset focus
                if (h.object.userData.id === 'core') {
                    resetFocusSkills();
                    showNodeInfo(h.object.userData);
                    return;
                }

                // In skills mode, focus on the clicked node's group
                if (currentMode === 'skills') {
                    const gk = h.object.userData.groupKey;
                    if (gk) {
                        if (focusGroup === gk) {
                            resetFocusSkills();
                        } else {
                            focusGroupSkills(gk);
                        }
                        showNodeInfo(h.object.userData);
                        return;
                    }
                }

                showNodeInfo(h.object.userData);
                return;
            }
        }

        // Click on empty space -> reset focus
        if (currentMode === 'skills' && focusGroup !== null) {
            resetFocusSkills();
        }
    }

    function onCanvasMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(scene.children);

        let found = false;
        for (const h of hits) {
            if (h.object.userData && h.object.userData.type === 'node') {
                document.body.style.cursor = 'pointer';
                if (hoveredObject && hoveredObject !== h.object) resetGlow(hoveredObject);
                setGlow(h.object);
                hoveredObject = h.object;
                found = true;
                break;
            }
        }
        if (!found) {
            document.body.style.cursor = 'default';
            if (hoveredObject) { resetGlow(hoveredObject); hoveredObject = null; }
        }
    }

    function setGlow(mesh) {
        if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = 0.9;
        }
    }

    function resetGlow(mesh) {
        if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
            mesh.material.emissiveIntensity = 0.25;
        }
    }

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
            <div style="font-size:11px;color:#a0aec0;margin-bottom:2px;">${data.id !== 'core' ? 'Clique para isolar este grupo' : 'Clique para resetar visualização'}</div>
        `;
        document.body.appendChild(div);

        const closer = (e) => {
            if (!div.contains(e.target) && e.target !== renderer.domElement) {
                div.remove();
                document.removeEventListener('click', closer);
            }
        };
        setTimeout(() => document.addEventListener('click', closer), 150);
    }

    // ============================================================
    // SKILLS FOCUS (Group Highlight)
    // ============================================================

    function focusGroupSkills(groupKey) {
        focusGroup = groupKey;

        // Dim all category labels except the focused one
        categoryLabels.forEach(({ labelObj, groupKey: gk }) => {
            const el = labelObj.element;
            if (gk === groupKey) {
                el.style.opacity = '1';
                el.style.transition = 'opacity 0.4s ease';
            } else {
                el.style.opacity = '0.15';
                el.style.transition = 'opacity 0.4s ease';
            }
        });

        // Dim all node labels except the focused group
        allLabels.forEach(({ labelObj, groupKey: gk }) => {
            const el = labelObj.element;
            if (gk === groupKey) {
                el.style.opacity = '1';
                el.style.transition = 'opacity 0.4s ease';
            } else {
                el.style.opacity = '0.12';
                el.style.transition = 'opacity 0.4s ease';
            }
        });

        // Dim meshes (nodes) except the focused group
        allNodeMeshes.forEach(({ mesh, groupKey: gk }) => {
            if (gk === groupKey) {
                if (mesh.material) {
                    mesh.material.emissiveIntensity = 0.5;
                    mesh.material.opacity = 1;
                    mesh.material.transparent = false;
                }
            } else {
                if (mesh.material) {
                    mesh.material.emissiveIntensity = 0.05;
                    mesh.material.transparent = true;
                    mesh.material.opacity = 0.2;
                }
            }
        });

        // Dim core node slightly
        if (coreNode && coreNode.material) {
            coreNode.material.transparent = true;
            coreNode.material.opacity = 0.25;
            coreNode.material.emissiveIntensity = 0.05;
        }
        if (coreLabel && coreLabel.element) {
            coreLabel.element.style.opacity = '0.12';
            coreLabel.element.style.transition = 'opacity 0.4s ease';
        }

        // Show only focused group lines
        allLines.forEach(({ lines, groupKey: gk }) => {
            lines.forEach(line => {
                if (gk === groupKey) {
                    line.material.opacity = 0.35;
                    line.visible = true;
                } else {
                    line.visible = false;
                }
            });
        });
    }

    function resetFocusSkills() {
        focusGroup = null;

        // Restore all category labels
        categoryLabels.forEach(({ labelObj }) => {
            const el = labelObj.element;
            el.style.opacity = '1';
            el.style.transition = 'opacity 0.4s ease';
        });

        // Restore all node labels
        allLabels.forEach(({ labelObj }) => {
            const el = labelObj.element;
            el.style.opacity = '1';
            el.style.transition = 'opacity 0.4s ease';
        });

        // Restore all meshes
        allNodeMeshes.forEach(({ mesh }) => {
            if (mesh.material) {
                mesh.material.emissiveIntensity = 0.25;
                mesh.material.transparent = false;
                mesh.material.opacity = 1;
            }
        });

        // Restore core
        if (coreNode && coreNode.material) {
            coreNode.material.transparent = false;
            coreNode.material.opacity = 1;
            coreNode.material.emissiveIntensity = 0.25;
        }
        if (coreLabel && coreLabel.element) {
            coreLabel.element.style.opacity = '1';
            coreLabel.element.style.transition = 'opacity 0.4s ease';
        }

        // Restore all lines
        allLines.forEach(({ lines }) => {
            lines.forEach(line => {
                line.material.opacity = 0.15;
                line.visible = true;
            });
        });
    }

    // ============================================================
    // ANIMATION LOOP
    // ============================================================

    function animate() {
        animationId = requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Float nodes gently
        let idx = 0;
        for (const key in nodeObjects) {
            const n = nodeObjects[key];
            if (n && n.position) {
                const off = n.userData._floatOff;
                if (off === undefined) n.userData._floatOff = Math.random() * Math.PI * 2;
                n.position.y += Math.sin(time * 0.4 + n.userData._floatOff + idx * 0.3) * 0.0008;
            }
            idx++;
        }

        // Animate flow particles
        flowParticles.forEach(fp => {
            const pos = fp.geometry.attributes.position.array;
            const { from, to, progress, speed } = fp.userData;
            const dt = 0.008;
            for (let i = 0; i < progress.length; i++) {
                progress[i] = (progress[i] + dt) % 1;
                const p = new THREE.Vector3().lerpVectors(from, to, progress[i]);
                pos[i * 3] = p.x;
                pos[i * 3 + 1] = p.y;
                pos[i * 3 + 2] = p.z;
            }
            fp.geometry.attributes.position.needsUpdate = true;
        });

        // Rotate starfield
        if (starField) {
            starField.rotation.y += 0.0004;
            starField.rotation.x += 0.0001;
        }

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    // ============================================================
    // RESIZE
    // ============================================================

    function handleResize() {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
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
            renderer.domElement.removeEventListener('mousemove', onCanvasMove);
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

        const tip = document.getElementById('tech-radar-tooltip');
        if (tip) tip.remove();
    }

    // ============================================================
    // EXPOSE PUBLIC API
    // ============================================================

    window.initTechRadar = initTechRadar;
    window.switch3DMode = switch3DMode;
    window.destroyTechRadar = destroyTechRadar;

})();