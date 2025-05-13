/**
 * Trump-Boyer Magic Cube Visualization
 * -----------------------------------
 * A 3D visualization of the 5×5×5 magic cube discovered by Walter Trump and
 * Christian Boyer in 2003.
 *
 * Magic cubes are three-dimensional arrays where all rows, columns, pillars,
 * and space diagonals sum to the same number.
 *
 * @author José Fernández Ramos
 * @version 1.0.0
 * @license MIT
 * @see https://github.com/elatomo/trump-boyer-cube
 */

import {
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const TrumpBoyerCube = (function () {
  /**
   * Default configuration settings for the visualization
   */
  const DEFAULT_CONFIG = {
    /** Visualization options */
    autoRotate: true, // Enable/disable automatic rotation
    showCubeWireframe: true, // Show cube outline
    showNodes: true, // Show nodes (spheres)
    showNodeNumbers: true, // Show numbers on nodes
    lineMode: "full", // 'full', 'even', 'odd', or 'none'

    /** Geometry settings */
    nodeSize: 0.15, // Size of the spheres representing nodes

    /** Animation settings */
    rotationSpeed: 0.003, // Speed of auto-rotation

    /** Camera settings */
    camera: {
      fov: 75, // Field of view in degrees (45-90 common)
      distance: 25, // Distance from cube center
    },

    /** Color palette */
    colors: {
      background: 0xffffff, // White
      nodes: 0x333333, // Dark gray
      wireframe: 0x333333, // Dark gray
      sequenceLine: 0x000000, // Black
    },
  };

  const CUBE_SCALE = 2.5; // Controls overall cube size (node spacing and wireframe)

  /**
   * Creates a new Trump-Boyer magic cube visualization
   */
  function create(container, userConfig = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error(
        "TrumpBoyerCube.create requires a valid DOM element as first parameter",
      );
    }

    // Instance variables
    let config = mergeConfigs(DEFAULT_CONFIG, userConfig);
    let elements = {
      nodes: [],
      nodeLabels: [],
      group: new Group(),
      labelContainer: null,
    };
    let data = {
      numberToPosition: {},
      positionToNumber: {},
    };
    let scene, camera, renderer, controls;
    let autoRotate;

    // Setup function
    function init() {
      autoRotate = config.autoRotate;

      // Create scene
      scene = new Scene();
      scene.background = new Color(config.colors.background);

      // Create camera
      camera = new PerspectiveCamera(
        config.camera.fov,
        container.clientWidth / container.clientHeight,
        0.1,
        1000,
      );
      camera.position.set(0, 0, config.camera.distance);

      // Create renderer
      renderer = new WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      // Create label container
      elements.labelContainer = createLabelContainer();

      // Setup orbit controls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Handle controls events
      controls.addEventListener("end", function () {
        if (config.autoRotate) {
          setTimeout(() => {
            autoRotate = true;
          }, 500);
        }
      });

      controls.addEventListener("start", function () {
        autoRotate = false;
      });

      // Create the visualization
      createNodes();

      // Handle window resize
      const resizeHandler = () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };

      window.addEventListener("resize", resizeHandler);

      // Start animation loop
      animate();

      // Return destroy method to clean up
      return function destroy() {
        window.removeEventListener("resize", resizeHandler);
        cancelAnimationFrame(animationFrameId);
        controls.dispose();
        container.removeChild(renderer.domElement);
        document.body.removeChild(elements.labelContainer);
      };
    }

    /**
     * Magic cube data (order 5)
     * Each layer represents a z-level in the cube
     */
    const magicCube = [
      // Layer 1
      [
        [25, 16, 80, 104, 90],
        [115, 98, 4, 1, 97],
        [42, 111, 85, 2, 75],
        [66, 72, 27, 102, 48],
        [67, 18, 119, 106, 5],
      ],
      // Layer 2
      [
        [91, 77, 71, 6, 70],
        [52, 64, 117, 69, 13],
        [30, 118, 21, 123, 23],
        [26, 39, 92, 44, 114],
        [116, 17, 14, 73, 95],
      ],
      // Layer 3
      [
        [47, 61, 45, 76, 86],
        [107, 43, 38, 33, 94],
        [89, 68, 63, 58, 37],
        [32, 93, 88, 83, 19],
        [40, 50, 81, 65, 79],
      ],
      // Layer 4
      [
        [31, 53, 112, 109, 10],
        [12, 82, 34, 87, 100],
        [103, 3, 105, 8, 96],
        [113, 57, 9, 62, 74],
        [56, 120, 55, 49, 35],
      ],
      // Layer 5
      [
        [121, 108, 7, 20, 59],
        [29, 28, 122, 125, 11],
        [51, 15, 41, 124, 84],
        [78, 54, 99, 24, 60],
        [36, 110, 46, 22, 101],
      ],
    ];

    /**
     * Helper function to deep merge two configuration objects
     */
    function mergeConfigs(defaultConfig, userConfig) {
      const result = { ...defaultConfig };

      for (const key in userConfig) {
        if (
          typeof userConfig[key] === "object" &&
          userConfig[key] !== null &&
          typeof defaultConfig[key] === "object" &&
          defaultConfig[key] !== null
        ) {
          result[key] = mergeConfigs(defaultConfig[key], userConfig[key]);
        } else if (userConfig[key] !== undefined) {
          result[key] = userConfig[key];
        }
      }

      return result;
    }

    /**
     * Creates a container for the HTML node labels
     */
    function createLabelContainer() {
      const container = document.createElement("div");
      Object.assign(container.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      });
      document.body.appendChild(container);
      return container;
    }

    /**
     * Creates all nodes in the visualization based on the magic cube data
     */
    function createNodes() {
      // Clear existing nodes and labels
      elements.group.clear();
      elements.nodes = [];
      clearLabels();

      // Iterate through all positions in the cube
      for (let z = 0; z < 5; z++) {
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            const number = magicCube[z][y][x];

            // Normalized position with cube center at (0,0,0)
            const posX = (x - 2) * CUBE_SCALE;
            const posY = -(y - 2) * CUBE_SCALE; // Inverted so Y+ is up
            const posZ = (z - 2) * CUBE_SCALE;

            // Store position mappings
            const position = new Vector3(posX, posY, posZ);
            data.numberToPosition[number] = position;
            data.positionToNumber[`${posX},${posY},${posZ}`] = number;

            // Create visible node if enabled
            if (config.showNodes) {
              createNode(number, position);
            }

            // Create node label if enabled
            if (config.showNodeNumbers) {
              createNodeLabel(number, position);
            }
          }
        }
      }

      scene.add(elements.group);

      // Create additional visualization elements
      if (config.showCubeWireframe) {
        createCubeWireframe();
      }

      if (config.lineMode !== "none") {
        createSequenceLine();
      }
    }

    /**
     * Creates a sphere to represent a node at the given position
     */
    function createNode(number, position) {
      const geometry = new SphereGeometry(config.nodeSize, 16, 16);
      const material = new MeshBasicMaterial({
        color: config.colors.nodes,
      });
      const sphere = new Mesh(geometry, material);
      sphere.position.copy(position);
      sphere.userData = { number };
      elements.group.add(sphere);
      elements.nodes.push(sphere);
    }

    /**
     * Creates an HTML label for a node
     */
    function createNodeLabel(number, position) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "node-label";
      labelDiv.textContent = number;
      labelDiv.style.display = "none"; // Initially hidden
      elements.labelContainer.appendChild(labelDiv);

      elements.nodeLabels.push({
        element: labelDiv,
        position: position.clone(),
        number: number,
      });
    }

    /**
     * Clears all node labels from the container
     */
    function clearLabels() {
      while (elements.labelContainer.firstChild) {
        elements.labelContainer.removeChild(elements.labelContainer.firstChild);
      }
      elements.nodeLabels = [];
    }

    /**
     * Creates a wireframe representation of the cube
     */
    function createCubeWireframe() {
      // Remove old wireframe if exists
      const oldWireframe = elements.group.getObjectByName("wireframe");
      if (oldWireframe) {
        elements.group.remove(oldWireframe);
      }

      // If wireframe is disabled, just return after removing the old one
      if (!config.showCubeWireframe) {
        return null;
      }

      const wireframe = new Group();
      wireframe.name = "wireframe";
      const cubeSize = CUBE_SCALE * 2; // 2 units from center to edge

      // Define cube vertices (corners)
      const vertices = [
        new Vector3(-cubeSize, cubeSize, -cubeSize), // 0: top-left-back
        new Vector3(cubeSize, cubeSize, -cubeSize), // 1: top-right-back
        new Vector3(cubeSize, cubeSize, cubeSize), // 2: top-right-front
        new Vector3(-cubeSize, cubeSize, cubeSize), // 3: top-left-front
        new Vector3(-cubeSize, -cubeSize, -cubeSize), // 4: bottom-left-back
        new Vector3(cubeSize, -cubeSize, -cubeSize), // 5: bottom-right-back
        new Vector3(cubeSize, -cubeSize, cubeSize), // 6: bottom-right-front
        new Vector3(-cubeSize, -cubeSize, cubeSize), // 7: bottom-left-front
      ];

      // Define edges by vertex indices
      const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0], // Top face
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4], // Bottom face
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7], // Connecting edges
      ];

      // Create dashed lines for edges
      for (let [startIdx, endIdx] of edges) {
        const line = createDashedLine(vertices[startIdx], vertices[endIdx]);
        wireframe.add(line);
      }

      elements.group.add(wireframe);
      return wireframe;
    }

    /**
     * Creates a dashed line between two points
     */
    function createDashedLine(start, end) {
      const geometry = new BufferGeometry().setFromPoints([start, end]);
      const material = new LineDashedMaterial({
        color: config.colors.wireframe,
        linewidth: 1,
        dashSize: 0.3,
        gapSize: 0.3,
      });
      const line = new Line(geometry, material);
      line.computeLineDistances(); // Required for dashed lines
      return line;
    }

    /**
     * Creates a line connecting numbers in sequence
     */
    function createSequenceLine() {
      // Remove old line if exists
      const oldLine = elements.group.getObjectByName("sequenceLine");
      if (oldLine) {
        elements.group.remove(oldLine);
      }

      if (config.lineMode === "none") {
        return null;
      }

      // Get all numbers in the cube
      let allNumbers = Object.keys(data.numberToPosition)
        .map(Number)
        .sort((a, b) => a - b);

      // Filter numbers based on mode
      if (config.lineMode === "even") {
        allNumbers = allNumbers.filter((num) => num % 2 === 0);
      } else if (config.lineMode === "odd") {
        allNumbers = allNumbers.filter((num) => num % 2 === 1);
      }

      // Create points in sequential order
      const linePoints = allNumbers
        .map((num) => data.numberToPosition[num])
        .filter(Boolean);

      const material = new LineBasicMaterial({
        color: config.colors.sequenceLine,
        linewidth: 1,
      });

      const geometry = new BufferGeometry().setFromPoints(linePoints);
      const line = new Line(geometry, material);
      line.name = "sequenceLine";

      elements.group.add(line);
      return line;
    }

    /**
     * Updates HTML label positions based on camera view
     */
    function updateNodeLabels() {
      if (!config.showNodeNumbers) return;

      for (const label of elements.nodeLabels) {
        // Get world position (accounting for group rotation)
        const worldPos = new Vector3();
        worldPos.copy(label.position);
        worldPos.applyMatrix4(elements.group.matrixWorld);

        // Project to screen coordinates
        worldPos.project(camera);

        const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

        // Position the label
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;

        // Show label only if it's in front of the camera
        if (worldPos.z < 0.9) {
          label.element.style.display = "block";

          // Adjust opacity based on depth
          const opacity = Math.max(0.3, 1 - (worldPos.z + 1) / 2);
          label.element.style.opacity = opacity.toString();

          // Set z-index based on depth (further away = lower z-index)
          const zIndex = Math.round((1 - worldPos.z) * 1000);
          label.element.style.zIndex = zIndex;
        } else {
          label.element.style.display = "none";
        }
      }
    }

    // Animation loop
    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate) {
        elements.group.rotation.y += config.rotationSpeed;
      }

      controls.update();

      if (config.showNodeNumbers) {
        updateNodeLabels();
      }

      renderer.render(scene, camera);
    }

    /**
     * Updates the visualization configuration
     */
    function updateConfig(newConfig) {
      config = mergeConfigs(config, newConfig);

      // Handle specific updates
      if (newConfig.autoRotate !== undefined) {
        autoRotate = newConfig.autoRotate;
      }

      if (
        newConfig.showNodes !== undefined ||
        newConfig.showNodeNumbers !== undefined ||
        newConfig.nodeSize !== undefined ||
        (newConfig.colors && newConfig.colors.nodes !== undefined)
      ) {
        createNodes();
      }

      if (
        newConfig.showCubeWireframe !== undefined ||
        (newConfig.colors && newConfig.colors.wireframe !== undefined)
      ) {
        createCubeWireframe();
      }

      if (
        newConfig.lineMode !== undefined ||
        (newConfig.colors && newConfig.colors.sequenceLine !== undefined)
      ) {
        createSequenceLine();
      }

      if (newConfig.colors && newConfig.colors.background !== undefined) {
        scene.background = new Color(config.colors.background);
      }

      if (newConfig.camera !== undefined) {
        if (newConfig.camera.fov !== undefined) {
          camera.fov = newConfig.camera.fov;
          camera.updateProjectionMatrix();
        }

        if (newConfig.camera.distance !== undefined) {
          camera.position.setLength(newConfig.camera.distance);
          camera.updateProjectionMatrix();
        }
      }

      return api; // For chaining
    }

    // Initialize
    const destroy = init();

    // Public API
    const api = {
      updateConfig,
      getConfig: () => ({ ...config }), // Return a copy to prevent direct modification
      destroy,
    };

    return api;
  }

  // Public module API
  return {
    create,
  };
})();

// For ESM environments
export default TrumpBoyerCube;

// For IIFE/script tag environments (will be removed in ESM builds)
if (typeof window !== "undefined") {
  window.TrumpBoyerCube = TrumpBoyerCube;
}
