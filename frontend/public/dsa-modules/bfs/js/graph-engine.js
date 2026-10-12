/**
 * BFS Problem Solving — Graph Engine
 * Handles graph math, adjacency list, SVG rendering, node state animations, and BFS path highlights.
 */

class GraphEngine {
  constructor(containerEl, svgEl) {
    this.container = containerEl;
    this.svg = svgEl;
    this.currentGraph = null;
    this.adjacency = {};
    this.nodeMap = {};
  }

  loadGraph(graphData) {
    this.currentGraph = graphData;
    this.adjacency = {};
    this.nodeMap = {};

    graphData.nodes.forEach(node => {
      this.adjacency[node.id] = [];
      this.nodeMap[node.id] = node;
    });

    graphData.edges.forEach(edge => {
      // Undirected graph by default
      if (this.adjacency[edge.from] && !this.adjacency[edge.from].includes(edge.to)) {
        this.adjacency[edge.from].push(edge.to);
      }
      if (this.adjacency[edge.to] && !this.adjacency[edge.to].includes(edge.from)) {
        this.adjacency[edge.to].push(edge.from);
      }
    });

    // Sort neighbors alphabetically for deterministic BFS order
    for (const k in this.adjacency) {
      this.adjacency[k].sort();
    }
  }

  getNeighbors(nodeId) {
    return this.adjacency[nodeId] || [];
  }

  calculateShortestPath(startNodeId, targetNodeId) {
    if (!startNodeId || !targetNodeId) return [];
    const queue = [startNodeId];
    const visited = new Set([startNodeId]);
    const parent = { [startNodeId]: null };

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === targetNodeId) break;

      const neighbors = this.getNeighbors(curr);
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          parent[n] = curr;
          queue.push(n);
        }
      }
    }

    if (!visited.has(targetNodeId)) return [];

    const path = [];
    let cur = targetNodeId;
    while (cur !== null) {
      path.unshift(cur);
      cur = parent[cur];
    }
    return path;
  }

  highlightShortestPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
      this.highlightEdge(path[i], path[i + 1], "#2563eb", "5");
    }
  }

  highlightEdge(fromId, toId, color = "url(#primary-gradient)", width = "4.5") {
    const edgeId1 = `edge-${fromId}-${toId}`;
    const edgeId2 = `edge-${toId}-${fromId}`;
    const edgeEl = document.getElementById(edgeId1) || document.getElementById(edgeId2);
    if (edgeEl) {
      edgeEl.setAttribute("stroke", color);
      edgeEl.setAttribute("stroke-width", width);
      edgeEl.classList.add("edge-glow-active");
    }
  }

  render(nodeStates, activeExplorerNodeId, targetNodeId, onNodeDragStart, onNodeClick) {
    if (!this.currentGraph || !this.svg) return;

    const isDark = document.body.classList.contains("dark-theme") || 
                   document.documentElement.getAttribute("data-theme") === "dark";

    // ViewBox dimensions
    const width = 600;
    const height = 400;
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.innerHTML = '';

    // Defs for gradients, patterns & luminous filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <!-- Shared Reusable Global Gradient for Tree Nodes, Links, and Badges -->
      <linearGradient id="primary-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#2E55FA"/>
        <stop offset="100%" stop-color="#7A27FD"/>
      </linearGradient>

      <!-- Ambient Blueprint Dot Pattern -->
      <pattern id="graph-grid-dots" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="14" cy="14" r="1.2" fill="${isDark ? '#4f46e5' : '#64748b'}" fill-opacity="${isDark ? '0.2' : '0.12'}"/>
      </pattern>

      <!-- Center Ambient Glow -->
      <radialGradient id="graph-ambient-glow" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#2E55FA" stop-opacity="${isDark ? '0.12' : '0.05'}"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>

      <!-- Glow Filters (Subtle blue-to-violet glow derived from #2E55FA and #7A27FD) -->
      <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="${isDark ? '0.6' : '0.15'}"/>
      </filter>
      <filter id="glow-unvisited" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#2E55FA" flood-opacity="${isDark ? '0.5' : '0.25'}"/>
      </filter>
      <filter id="glow-beacon" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#7A27FD" flood-opacity="0.8"/>
      </filter>
      <filter id="glow-gold" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#7A27FD" flood-opacity="0.8"/>
      </filter>
      <filter id="glow-current" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="7" flood-color="#7A27FD" flood-opacity="0.85"/>
      </filter>
      <filter id="glow-visited" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#2E55FA" flood-opacity="0.75"/>
      </filter>

      <!-- Node Gradients (Inside kept dark) -->
      <linearGradient id="unvisited-dark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="unvisited-light-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <linearGradient id="visited-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="current-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="queued-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="neighbor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <linearGradient id="target-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2e1065"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    `;
    this.svg.appendChild(defs);

    // 0. Ambient Grid Background
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", width);
    bgRect.setAttribute("height", height);
    bgRect.setAttribute("fill", "url(#graph-grid-dots)");
    this.svg.appendChild(bgRect);

    const glowRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    glowRect.setAttribute("width", width);
    glowRect.setAttribute("height", height);
    glowRect.setAttribute("fill", "url(#graph-ambient-glow)");
    this.svg.appendChild(glowRect);

    // 1. Render Graph Edges (Solid vibrant paths so vertical/horizontal/diagonal lines never clip)
    const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    edgesGroup.setAttribute("class", "graph-edges-group");

    this.currentGraph.edges.forEach(edge => {
      const u = this.nodeMap[edge.from];
      const v = this.nodeMap[edge.to];
      if (!u || !v) return;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("id", `edge-${edge.from}-${edge.to}`);
      line.setAttribute("x1", u.x);
      line.setAttribute("y1", u.y);
      // If x1 == x2 (vertical line), add tiny 0.1 delta for SVG gradient bounding box calculation
      const x2 = (u.x === v.x) ? v.x + 0.1 : v.x;
      line.setAttribute("x2", x2);
      line.setAttribute("y2", v.y);
      line.setAttribute("stroke", "url(#primary-gradient)");
      line.setAttribute("stroke-opacity", "1");
      line.setAttribute("stroke-width", "3.2");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("class", "graph-canvas-edge");
      edgesGroup.appendChild(line);
    });
    this.svg.appendChild(edgesGroup);

    // Active unvisited neighbors list for beacon indicators
    const unvisitedNeighbors = activeExplorerNodeId
      ? this.getNeighbors(activeExplorerNodeId).filter(n => nodeStates[n] === "unvisited")
      : [];

    // 2. Render Graph Nodes
    const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("class", "graph-nodes-group");

    this.currentGraph.nodes.forEach(node => {
      const state = nodeStates[node.id] || "unvisited";
      const isTarget = node.id === targetNodeId;
      const isCurrent = node.id === activeExplorerNodeId;
      const isUnvisitedNeighbor = unvisitedNeighbors.includes(node.id);

      const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeG.setAttribute("class", `graph-node-interactive node-state-${state} ${isUnvisitedNeighbor ? 'node-is-neighbor-target' : ''}`);
      nodeG.setAttribute("id", `node-${node.id}`);
      nodeG.setAttribute("transform", `translate(${node.x}, ${node.y})`);
      nodeG.setAttribute("filter", "url(#node-shadow)");
      nodeG.style.cursor = "grab";

      // Pulsing Beacon ring for unvisited neighbors of active current node
      if (isUnvisitedNeighbor) {
        const beaconRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        beaconRing.setAttribute("r", "29");
        beaconRing.setAttribute("fill", "none");
        beaconRing.setAttribute("stroke", "url(#primary-gradient)");
        beaconRing.setAttribute("stroke-width", "2");
        beaconRing.setAttribute("stroke-dasharray", "4 4");
        beaconRing.setAttribute("filter", "url(#glow-beacon)");
        beaconRing.innerHTML = `
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3.5s" repeatCount="indefinite"/>
          <animate attributeName="r" values="27;31;27" dur="1.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.6s" repeatCount="indefinite"/>
        `;
        nodeG.appendChild(beaconRing);
      }

      // Outer Glow / Ring for Current active node
      if (isCurrent) {
        const currentRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        currentRing.setAttribute("r", "28");
        currentRing.setAttribute("fill", "none");
        currentRing.setAttribute("stroke", "url(#primary-gradient)");
        currentRing.setAttribute("stroke-width", "2.5");
        currentRing.setAttribute("stroke-dasharray", "5 3");
        currentRing.setAttribute("filter", "url(#glow-current)");
        currentRing.innerHTML = `
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite"/>
          <animate attributeName="r" values="26;29;26" dur="1.8s" repeatCount="indefinite"/>
        `;
        nodeG.appendChild(currentRing);
      }

      // Main Node Circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "23");
      circle.setAttribute("stroke-width", "3");

      let fill = isDark ? "url(#unvisited-dark-grad)" : "#ffffff";
      let stroke = "url(#primary-gradient)"; // Use exact blue-to-violet gradient
      let textColor = isDark ? "#ffffff" : "#0f172a";
      let filter = "url(#glow-unvisited)";

      if (node.isUnreachable) {
        fill = isDark ? "#1e293b" : "#f1f5f9";
        stroke = "#94a3b8";
        textColor = "#64748b";
        circle.setAttribute("stroke-dasharray", "4 3");
        filter = "";
      } else if (state === "current") {
        fill = isDark ? "url(#current-grad)" : "#f5f3ff";
        stroke = "url(#primary-gradient)";
        textColor = isDark ? "#ffffff" : "#4338ca";
        filter = "url(#glow-current)";
      } else if (state === "visited") {
        fill = isDark ? "url(#visited-grad)" : "#eff6ff";
        stroke = "url(#primary-gradient)";
        textColor = isDark ? "#ffffff" : "#1d4ed8";
        filter = "url(#glow-visited)";
      } else if (state === "in_queue") {
        fill = isDark ? "url(#queued-grad)" : "#f5f3ff";
        stroke = "url(#primary-gradient)";
        textColor = isDark ? "#ffffff" : "#6d28d9";
        filter = "url(#glow-beacon)";
      } else if (isTarget) {
        fill = isDark ? "url(#target-grad)" : "#faf5ff";
        stroke = "url(#primary-gradient)";
        textColor = isDark ? "#ffffff" : "#7c3aed";
        filter = "url(#glow-gold)";
      } else if (isUnvisitedNeighbor) {
        fill = isDark ? "url(#neighbor-grad)" : "#ffffff";
        stroke = "url(#primary-gradient)";
        textColor = isDark ? "#ffffff" : "#0f172a";
        filter = "url(#glow-beacon)";
      }

      circle.setAttribute("fill", fill);
      circle.setAttribute("stroke", stroke);
      if (filter) circle.setAttribute("filter", filter);
      nodeG.appendChild(circle);

      // Node Label Text (High-contrast, bold, centered)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dy", "5.5");
      text.setAttribute("font-size", "14");
      text.setAttribute("font-weight", "900");
      text.setAttribute("letter-spacing", "0.5");
      text.setAttribute("fill", textColor);
      text.textContent = node.id;
      nodeG.appendChild(text);

      // Sub-badge: Level tag formatted as a modern mini pill with blue-to-violet gradient stroke
      if (!node.isUnreachable && node.level !== undefined && node.level >= 0) {
        const badgeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        badgeG.setAttribute("class", "node-level-pill");

        const pillBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        pillBg.setAttribute("x", "-13");
        pillBg.setAttribute("y", "26");
        pillBg.setAttribute("width", "26");
        pillBg.setAttribute("height", "14");
        pillBg.setAttribute("rx", "7");
        pillBg.setAttribute("fill", isDark ? "#070d1c" : "#ffffff");
        pillBg.setAttribute("stroke", "url(#primary-gradient)");
        pillBg.setAttribute("stroke-width", "1.5");
        badgeG.appendChild(pillBg);

        const subText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        subText.setAttribute("text-anchor", "middle");
        subText.setAttribute("x", "0");
        subText.setAttribute("y", "36.5");
        subText.setAttribute("font-size", "8.5");
        subText.setAttribute("font-weight", "800");
        subText.setAttribute("fill", isDark ? "#ffffff" : "#1e1b4b");
        subText.textContent = `L${node.level}`;
        badgeG.appendChild(subText);

        nodeG.appendChild(badgeG);
      }

      // Drag & Drop Event Listeners + Click fallback
      nodeG.addEventListener("mousedown", (e) => {
        if (onNodeDragStart) onNodeDragStart(node.id, e);
      });
      nodeG.addEventListener("touchstart", (e) => {
        if (onNodeDragStart) onNodeDragStart(node.id, e);
      }, { passive: true });

      nodeG.addEventListener("click", () => {
        if (onNodeClick) onNodeClick(node.id);
      });

      nodesGroup.appendChild(nodeG);
    });

    this.svg.appendChild(nodesGroup);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GraphEngine };
}
