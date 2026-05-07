AFRAME.registerComponent("sparkle-frame", {
  schema: {
    width: { type: "number", default: 1.08 },
    height: { type: "number", default: 0.58 },
    depth: { type: "number", default: 0.035 },
    shape: { type: "string", default: "rectangle" },
    sparkleCount: { type: "number", default: 38 },
    notchWidth: { type: "number", default: 0.22 },
    notchDepth: { type: "number", default: 0.12 },
    cloud: { type: "boolean", default: false },
    cloudOpacity: { type: "number", default: 0.18 },
  },

  init() {
    this.sparkles = [];
    this.clouds = [];
    this.clock = new THREE.Clock();

    this.createGlowFrame();
    this.createSparkles();
    this.createCloudLayer();
  },

  createGlowFrame() {
    const { width, height, depth } = this.data;
    const group = document.createElement("a-entity");
    group.setAttribute("position", `0 0 ${depth}`);

    if (this.data.shape === "fan") {
      return;
    }

    const lines = [
      { x: 0, y: height / 2, sx: width, sy: 0.012 },
      { x: 0, y: -height / 2, sx: width, sy: 0.012 },
      { x: -width / 2, y: 0, sx: 0.012, sy: height },
      { x: width / 2, y: 0, sx: 0.012, sy: height },
    ];

    lines.forEach((line) => {
      const glow = document.createElement("a-plane");
      glow.setAttribute("position", `${line.x} ${line.y} 0`);
      glow.setAttribute("width", line.sx);
      glow.setAttribute("height", line.sy);
      glow.setAttribute(
        "material",
        "color: #fff4a8; transparent: true; opacity: 0.32; side: double; depthTest: false"
      );
      group.appendChild(glow);
    });

    this.el.appendChild(group);
  },

  createSparkles() {
    const { width, height, depth, sparkleCount } = this.data;
    const palette = ["#ffffff", "#fff27a", "#6dff9c", "#75d7ff", "#ff79b8"];
    const positions = this.makeBorderPositions(width, height, sparkleCount);

    positions.forEach((position, index) => {
      const sparkle = document.createElement("a-entity");
      const color = palette[index % palette.length];
      const size = 0.026 + Math.random() * 0.035;
      const delay = Math.random() * 1000;
      const duration = 850 + Math.random() * 900;

      sparkle.setAttribute("position", `${position.x} ${position.y} ${depth + 0.01}`);
      sparkle.setAttribute("rotation", `0 0 ${45 + Math.random() * 35}`);
      sparkle.setAttribute("scale", "1 1 1");

      const vertical = this.createRay(size, color, 0);
      const horizontal = this.createRay(size, color, 90);
      const core = this.createCore(size * 0.32, color);

      sparkle.appendChild(vertical);
      sparkle.appendChild(horizontal);
      sparkle.appendChild(core);
      this.el.appendChild(sparkle);

      this.sparkles.push({
        el: sparkle,
        baseScale: 0.55 + Math.random() * 0.65,
        phase: Math.random() * Math.PI * 2,
        speed: (Math.PI * 2) / duration,
        delay,
      });
    });
  },

  makeBorderPositions(width, height, count) {
    if (this.data.shape === "fan") {
      return this.makeFanBorderPositions(width, height, count);
    }

    const positions = [];
    const halfW = width / 2;
    const halfH = height / 2;

    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      const side = i % 4;
      const jitter = 0.025;

      if (side === 0) {
        positions.push({ x: -halfW + width * t + this.rand(jitter), y: halfH + this.rand(jitter) });
      } else if (side === 1) {
        positions.push({ x: halfW + this.rand(jitter), y: halfH - height * t + this.rand(jitter) });
      } else if (side === 2) {
        positions.push({ x: halfW - width * t + this.rand(jitter), y: -halfH + this.rand(jitter) });
      } else {
        positions.push({ x: -halfW + this.rand(jitter), y: -halfH + height * t + this.rand(jitter) });
      }
    }

    return positions;
  },

  makeFanBorderPositions(width, height, count) {
    const positions = [];
    const halfW = width / 2;
    const halfH = height / 2;
    const notchHalf = this.data.notchWidth / 2;
    const notchDepth = this.data.notchDepth;
    const topCount = Math.ceil(count * 0.64);
    const sideCount = Math.max(2, Math.floor((count - topCount) / 2));
    const arcY = -halfH + height * 0.12;
    const radiusX = halfW;
    const radiusY = height * 0.88;

    for (let i = 0; i < topCount; i += 1) {
      const t = i / Math.max(1, topCount - 1);
      const angle = Math.PI - Math.PI * t;
      positions.push({
        x: Math.cos(angle) * radiusX + this.rand(0.018),
        y: arcY + Math.sin(angle) * radiusY + this.rand(0.018),
      });
    }

    for (let i = 0; i < sideCount; i += 1) {
      const t = i / Math.max(1, sideCount - 1);
      const edgeY = -halfH + height * 0.14;
      const innerY = edgeY - notchDepth;

      positions.push({
        x: -halfW + (halfW - notchHalf) * t + this.rand(0.016),
        y: edgeY + (innerY - edgeY) * t + this.rand(0.014),
      });
      positions.push({
        x: halfW - (halfW - notchHalf) * t + this.rand(0.016),
        y: edgeY + (innerY - edgeY) * t + this.rand(0.014),
      });
    }

    return positions;
  },

  createRay(length, color, rotation) {
    const ray = document.createElement("a-plane");
    ray.setAttribute("width", length);
    ray.setAttribute("height", length * 0.12);
    ray.setAttribute("rotation", `0 0 ${rotation}`);
    ray.setAttribute(
      "material",
      `color: ${color}; transparent: true; opacity: 0.82; side: double; depthTest: false; blending: additive`
    );
    return ray;
  },

  createCore(size, color) {
    const core = document.createElement("a-circle");
    core.setAttribute("radius", size);
    core.setAttribute(
      "material",
      `color: ${color}; transparent: true; opacity: 0.95; side: double; depthTest: false; blending: additive`
    );
    return core;
  },

  createCloudLayer() {
    if (!this.data.cloud) return;

    const { width, height, depth, cloudOpacity } = this.data;
    const group = document.createElement("a-entity");
    group.setAttribute("position", `0 ${height * 0.05} ${depth + 0.018}`);

    const cloudParts = [
      { x: -width * 0.18, y: height * 0.03, sx: width * 0.38, sy: height * 0.14 },
      { x: width * 0.02, y: height * 0.07, sx: width * 0.5, sy: height * 0.18 },
      { x: width * 0.24, y: height * 0.01, sx: width * 0.34, sy: height * 0.12 },
    ];

    cloudParts.forEach((part, index) => {
      const cloud = document.createElement("a-circle");
      cloud.setAttribute("position", `${part.x} ${part.y} 0`);
      cloud.setAttribute("scale", `${part.sx} ${part.sy} 1`);
      cloud.setAttribute(
        "material",
        `color: #ffffff; transparent: true; opacity: ${cloudOpacity}; side: double; depthTest: false; blending: additive`
      );
      group.appendChild(cloud);
      this.clouds.push({
        el: cloud,
        baseX: part.x,
        phase: index * 1.7,
      });
    });

    this.el.appendChild(group);
  },

  rand(amount) {
    return (Math.random() - 0.5) * amount;
  },

  tick(time) {
    this.sparkles.forEach((sparkle) => {
      const wave = Math.sin(sparkle.phase + (time - sparkle.delay) * sparkle.speed);
      const alpha = Math.max(0, wave);
      const scale = sparkle.baseScale * (0.35 + alpha * 1.15);

      sparkle.el.object3D.scale.set(scale, scale, scale);
      sparkle.el.object3D.visible = alpha > 0.06;

      sparkle.el.object3D.children.forEach((child) => {
        if (child.material) {
          child.material.opacity = 0.25 + alpha * 0.75;
        }
      });
    });

    this.clouds.forEach((cloud) => {
      const drift = Math.sin(time * 0.00045 + cloud.phase) * 0.018;
      cloud.el.object3D.position.x = cloud.baseX + drift;
    });
  },
});
