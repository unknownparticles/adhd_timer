import React, { useEffect, useRef, useState } from "react";
import { SensorData, TimerDirection, AppSettings } from "../types";
import { playCollisionSound } from "../utils/audio";

interface GravityParticlesCanvasProps {
  sensorData: SensorData;
  activeDirection: TimerDirection | null;
  settings: AppSettings;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  baseColor: string;
  color: string;
}

// Color schemes per timer mode to create adaptive visual themes
const MODE_COLORS: Record<TimerDirection, string[]> = {
  [TimerDirection.PORTRAIT_UP]: ["#fda4af", "#f43f5e", "#be123c", "#ffe4e6"], // Rose (Pomodoro)
  [TimerDirection.LANDSCAPE_RIGHT]: ["#6ee7b7", "#10b981", "#047857", "#ecfdf5"], // Emerald (Short Break)
  [TimerDirection.PORTRAIT_DOWN]: ["#7dd3fc", "#3b82f6", "#1d4ed8", "#f0f9ff"], // Sky/Blue (Long Break)
  [TimerDirection.LANDSCAPE_LEFT]: ["#c084fc", "#8b5cf6", "#5b21b6", "#faf5ff"], // Purple (Quick Focus)
};

export const GravityParticlesCanvas: React.FC<GravityParticlesCanvasProps> = ({
  sensorData,
  activeDirection,
  settings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const activeDirectionRef = useRef<TimerDirection | null>(null);

  // Mouse/Touch tracking for interactive scattering
  const [mouse, setMouse] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const canvasWidth = 300;
  const canvasHeight = 300;
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const boundaryRadius = 120; // Circle radius inside canvas

  // Keep track of current active direction to detect mode changes
  useEffect(() => {
    activeDirectionRef.current = activeDirection;
  }, [activeDirection]);

  // Handle initialization and window resize (high-DPI canvas crispness)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Generate initial particles scattered within the boundary circle
    const numParticles = 40;
    const particles: Particle[] = [];
    const mode = activeDirection || TimerDirection.PORTRAIT_UP;
    const colors = MODE_COLORS[mode];

    for (let i = 0; i < numParticles; i++) {
      // Find a random point inside the boundary circle
      const r = Math.random() * (boundaryRadius - 15);
      const theta = Math.random() * Math.PI * 2;
      const x = centerX + Math.cos(theta) * r;
      const y = centerY + Math.sin(theta) * r;
      const radius = 4.5 + Math.random() * 4; // Varying bead sizes
      const baseColor = colors[Math.floor(Math.random() * (colors.length - 1))];

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius,
        mass: radius * radius, // Mass proportional to area
        baseColor,
        color: baseColor,
      });
    }

    particlesRef.current = particles;
  }, []);

  // Update particle colors smoothly when the mode changes
  useEffect(() => {
    const currentMode = activeDirection || TimerDirection.PORTRAIT_UP;
    const targetColors = MODE_COLORS[currentMode];
    
    // Smoothly shift existing particles to the new color scheme
    particlesRef.current.forEach((p) => {
      p.baseColor = targetColors[Math.floor(Math.random() * (targetColors.length - 1))];
      p.color = p.baseColor;
    });
  }, [activeDirection]);

  // Main physics & animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear with transparent background
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Extract raw pitch & roll orientations
      const { beta, gamma } = sensorData;

      // Calculate physical gravity force vectors
      // Limit angles to [-90, 90] to avoid extreme velocity explosions
      const clampedBeta = Math.max(-90, Math.min(90, beta));
      const clampedGamma = Math.max(-90, Math.min(90, gamma));

      // Calculate gravity strength based on phone tilts
      // ax controls horizontal gravity (gamma/roll), ay controls vertical gravity (beta/pitch)
      const gravityFactor = 0.15; // Tuning sensitivity
      const ax = Math.sin((clampedGamma * Math.PI) / 180) * gravityFactor;
      const ay = Math.sin((clampedBeta * Math.PI) / 180) * gravityFactor;

      const particles = particlesRef.current;
      const damping = 0.97; // Surface friction / air resistance
      const elasticity = 0.45; // Rebound elasticity

      // 1. Update Positions, apply gravity and mouse forces
      particles.forEach((p) => {
        // Apply gravity vector
        p.vx += ax;
        p.vy += ay;

        // Apply mouse interaction (repulsion)
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 55) {
            // Push beads away from mouse cursor
            const force = ((55 - dist) / 55) * 1.5;
            p.vx += (dx / (dist || 1)) * force;
            p.vy += (dy / (dist || 1)) * force;
          }
        }

        // Apply velocities & damping
        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;

        // Add tiny ambient random motion (thermal jitter) so they don't freeze fully
        p.vx += (Math.random() - 0.5) * 0.04;
        p.vy += (Math.random() - 0.5) * 0.04;
      });

      // 2. Resolve Particle-to-Particle Collisions (Elastic 2D Collisions)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p1.radius + p2.radius;

          if (dist < minDist) {
            // Collision detected! Push apart to prevent overlapping
            const overlap = minDist - dist;
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);

            // Separate relative to their masses
            const totalMass = p1.mass + p2.mass;
            p1.x -= nx * overlap * (p2.mass / totalMass);
            p1.y -= ny * overlap * (p2.mass / totalMass);
            p2.x += nx * overlap * (p1.mass / totalMass);
            p2.y += ny * overlap * (p1.mass / totalMass);

            // Calculate relative velocity in normal direction
            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const vn = kx * nx + ky * ny;

            // Only bounce if they are moving towards each other
            if (vn > 0) {
              const impulse = (2 * vn) / totalMass;
              p1.vx -= impulse * p2.mass * nx * elasticity;
              p1.vy -= impulse * p2.mass * ny * elasticity;
              p2.vx += impulse * p1.mass * nx * elasticity;
              p2.vy += impulse * p1.mass * ny * elasticity;

              // Play collision sound on substantial relative movement
              if (settings.soundEnabled && vn > 0.2) {
                playCollisionSound(vn, settings.volume);
              }
            }
          }
        }
      }

      // 3. Resolve Circular Boundary Collisions
      particles.forEach((p) => {
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = boundaryRadius - p.radius;

        if (dist > maxDist) {
          // Exceeded circle bounds, snap back and bounce!
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);

          p.x = centerX + nx * maxDist;
          p.y = centerY + ny * maxDist;

          // Reflect velocity across normal
          const dot = p.vx * nx + p.vy * ny;
          p.vx = (p.vx - 2 * dot * nx) * elasticity;
          p.vy = (p.vy - 2 * dot * ny) * elasticity;

          // Play collision sound on wall bounce
          if (settings.soundEnabled && dot > 0.2) {
            playCollisionSound(dot, settings.volume);
          }
        }
      });

      // 4. Render Particles to Canvas
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        // Solid fill with light shading for 3D sphere look
        const gradient = ctx.createRadialGradient(
          p.x - p.radius * 0.3,
          p.y - p.radius * 0.3,
          p.radius * 0.1,
          p.x,
          p.y,
          p.radius
        );
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.3, p.color);
        gradient.addColorStop(1, p.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Very subtle outline
        ctx.strokeStyle = "rgba(28, 25, 23, 0.1)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Request next frame
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [sensorData, mouse]);

  // Handle mouse events to trigger repulsion interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Convert screen coordinates to 300x300 internal canvas coordinates
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    setMouse({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true,
    });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;

    setMouse({
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setMouse((prev) => ({ ...prev, active: false }));
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-[340px] sm:h-[340px] cursor-grab active:cursor-grabbing z-0 pointer-events-auto"
    />
  );
};
