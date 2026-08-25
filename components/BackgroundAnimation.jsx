"use client";

import { useEffect, useRef } from "react";

export default function BackgroundAnimation() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener("resize", handleResize);

        // Neon Spark/Beam class
        class NeonElement {
            constructor() {
                this.reset(true);
            }

            reset(init = false) {
                // Sparks drift upwards; Beams sweep diagonally
                this.type = Math.random() > 0.45 ? "spark" : "beam";
                
                if (this.type === "spark") {
                    this.x = Math.random() * width;
                    this.y = init ? Math.random() * height : height + 20;
                    this.size = Math.random() * 2.5 + 1;
                    this.speedY = -(Math.random() * 0.9 + 0.3);
                    this.speedX = Math.random() * 0.4 - 0.2;
                    this.opacity = Math.random() * 0.6 + 0.3;
                    this.fadeSpeed = Math.random() * 0.002 + 0.001;
                } else {
                    // Glowing beam/ray
                    this.x = Math.random() * (width + 200) - 200;
                    this.y = init ? Math.random() * (height + 200) - 200 : -150;
                    this.length = Math.random() * 180 + 80;
                    this.angle = Math.PI / 4; // 45 degrees
                    this.speedY = Math.random() * 0.4 + 0.15;
                    this.speedX = this.speedY; // diagonal sweep
                    this.opacity = 0;
                    this.maxOpacity = Math.random() * 0.3 + 0.05;
                    this.fadePhase = 0; // 0 = fading in, 1 = solid, 2 = fading out
                    this.solidDuration = 0;
                }
                
                // Neon Blue & Neon Green colors
                this.colorType = Math.random() > 0.5 ? "blue" : "green";
                if (this.colorType === "blue") {
                    this.color = "0, 162, 255"; // Neon Cyan-Blue
                    this.glowColor = "rgba(0, 162, 255, 0.9)";
                } else {
                    this.color = "34, 255, 110"; // Neon Green
                    this.glowColor = "rgba(34, 255, 110, 0.9)";
                }
            }

            update() {
                if (this.type === "spark") {
                    this.y += this.speedY;
                    this.x += this.speedX;
                    this.opacity -= this.fadeSpeed;

                    if (this.opacity <= 0 || this.y < -20 || this.x < -20 || this.x > width + 20) {
                        this.reset(false);
                    }
                } else {
                    this.y += this.speedY;
                    this.x += this.speedX;
                    
                    if (this.fadePhase === 0) {
                        this.opacity += 0.003;
                        if (this.opacity >= this.maxOpacity) {
                            this.opacity = this.maxOpacity;
                            this.fadePhase = 1;
                            this.solidDuration = Math.random() * 120 + 60;
                        }
                    } else if (this.fadePhase === 1) {
                        this.solidDuration--;
                        if (this.solidDuration <= 0) {
                            this.fadePhase = 2;
                        }
                    } else {
                        this.opacity -= 0.003;
                        if (this.opacity <= 0) {
                            this.reset(false);
                        }
                    }

                    if (this.y > height + 150 || this.x > width + 150) {
                        this.reset(false);
                    }
                }
            }

            draw() {
                if (this.opacity <= 0) return;
                
                ctx.save();
                if (this.type === "spark") {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
                    ctx.shadowBlur = this.size * 3.5;
                    ctx.shadowColor = this.glowColor;
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
                    ctx.strokeStyle = `rgba(${this.color}, ${this.opacity})`;
                    ctx.lineWidth = 2.0;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = this.glowColor;
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        const maxElements = Math.min(50, Math.floor((width * height) / 30000));
        const elements = Array.from({ length: maxElements }, () => new NeonElement());

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Dark radial background with blue/green hue
            const bgGrad = ctx.createRadialGradient(
                width / 2,
                height / 2,
                10,
                width / 2,
                height / 2,
                Math.max(width, height)
            );
            bgGrad.addColorStop(0, "#010806"); // Ultra deep blue-green-charcoal core
            bgGrad.addColorStop(1, "#010103"); // Dark black-blue edges
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Render neon sparks and diagonal scanning lines
            elements.forEach((el) => {
                el.update();
                el.draw();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full z-0 overflow-hidden bg-[#020205]">
            {/* Canvas for neon particles and lasers */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

            {/* Neon Green glowing blobs */}
            <div className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-[#22ff6e]/15 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-[-15%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-[#00ff88]/10 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />

            {/* Neon Blue glowing blobs */}
            <div className="absolute bottom-[-15%] right-[-10%] w-[65vw] h-[65vw] rounded-full bg-gradient-to-tl from-[#0066ff]/15 to-transparent blur-[160px] animate-pulse" style={{ animationDuration: '11s' }} />
            <div className="absolute top-[30%] right-[-20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-l from-[#00f2ff]/10 to-transparent blur-[110px] animate-pulse" style={{ animationDuration: '13s' }} />
        </div>
    );
}
