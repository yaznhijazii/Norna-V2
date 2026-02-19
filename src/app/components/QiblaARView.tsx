import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, CameraOff, AlertCircle, Compass } from 'lucide-react';
import { useQiblaDirection } from '../hooks/useQiblaDirection';

interface QiblaARViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QiblaARView({ isOpen, onClose }: QiblaARViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

    const { qiblaDirection, deviceHeading, needsPermission, loading, requestPermission } = useQiblaDirection();

    // Compute compass offset in degrees (-180..180)
    const getOffset = useCallback(() => {
        if (qiblaDirection === null || deviceHeading === null) return null;
        let off = qiblaDirection - deviceHeading;
        // normalise to -180..180
        while (off > 180) off -= 360;
        while (off < -180) off += 360;
        return off;
    }, [qiblaDirection, deviceHeading]);

    // Start rear camera
    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setCameraReady(true);
            }
        } catch {
            setCameraError('لا يمكن الوصول إلى الكاميرا. تأكد من منح الإذن.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraReady(false);
    }, []);

    // Resize canvas to match video / screen
    useEffect(() => {
        if (!isOpen) return;
        const update = () => {
            setCanvasDims({ w: window.innerWidth, h: window.innerHeight });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [isOpen]);

    // Open / close camera with the view
    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    // RAFloop: draw AR overlay on canvas
    useEffect(() => {
        if (!isOpen || !cameraReady) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let hue = 0; // animate golden glow

        const draw = () => {
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            const offset = getOffset(); // null | number (-180..180)
            const isAligned = offset !== null && Math.abs(offset) < 5;

            // --- HUD: Heading bar (horizontal arc indicator) ---
            drawHeadingArc(ctx, W, H, offset);

            // --- Qibla beam ---
            if (offset !== null) {
                drawQiblaBeam(ctx, W, H, offset, isAligned, hue);
            }

            // --- Corner crosshair reticle ---
            drawReticle(ctx, W, H, isAligned, hue);

            hue = (hue + 1) % 360;
            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [isOpen, cameraReady, getOffset]);

    if (!isOpen) return null;

    const offset = getOffset();
    const isAligned = offset !== null && Math.abs(offset) < 5;

    return (
        <AnimatePresence>
            <motion.div
                key="ar-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[200] bg-black overflow-hidden"
                dir="rtl"
            >
                {/* Camera feed */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                />

                {/* Haptic feedback on alignment */}
                <HapticTrigger isAligned={isAligned} />

                {/* AR Canvas overlay */}
                <canvas
                    ref={canvasRef}
                    width={canvasDims.w}
                    height={canvasDims.h}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 z-10 pt-safe">
                    <div className="flex items-center justify-between px-5 pt-12 pb-4">
                        <button
                            onClick={onClose}
                            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="bg-black/40 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full flex items-center gap-2">
                            <Compass className="w-4 h-4 text-amber-400" />
                            <span className="text-white text-sm font-bold">القبلة بالواقع المعزز</span>
                        </div>

                        <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
                            {cameraReady ? (
                                <Camera className="w-5 h-5 text-green-400" />
                            ) : (
                                <CameraOff className="w-5 h-5 text-red-400" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom status card */}
                <div className="absolute bottom-0 inset-x-0 z-10 pb-safe px-5 pb-12">
                    <AnimatePresence mode="wait">
                        {isAligned ? (
                            <motion.div
                                key="aligned"
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-emerald-500/90 backdrop-blur-md border border-emerald-400/50 rounded-3xl px-6 py-4 flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="w-3 h-3 bg-white rounded-full"
                                />
                                <span className="text-white font-black text-lg">أنت تواجه القبلة ✓</span>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                                    className="w-3 h-3 bg-white rounded-full"
                                />
                            </motion.div>
                        ) : needsPermission ? (
                            <motion.div
                                key="permission"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-5"
                            >
                                <p className="text-white text-center text-sm mb-3 opacity-80">يلزم إذن البوصلة للكشف عن اتجاه القبلة</p>
                                <button
                                    onClick={requestPermission}
                                    className="w-full bg-amber-500 text-white py-3 rounded-2xl font-black flex items-center justify-center gap-2"
                                >
                                    <Compass className="w-5 h-5" />
                                    تفعيل البوصلة
                                </button>
                            </motion.div>
                        ) : cameraError ? (
                            <motion.div
                                key="cam-error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-500/80 backdrop-blur-md border border-red-400/50 rounded-3xl px-6 py-4 flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
                                <span className="text-white text-sm font-semibold">{cameraError}</span>
                            </motion.div>
                        ) : loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-4 flex items-center justify-center gap-3"
                            >
                                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-white text-sm font-semibold">جارٍ تحديد الموقع واتجاه القبلة...</span>
                            </motion.div>
                        ) : offset !== null ? (
                            <motion.div
                                key="direction"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl px-6 py-4 flex items-center justify-center gap-3"
                            >
                                <motion.div
                                    animate={{ x: offset > 0 ? [0, 6, 0] : [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="text-amber-400 text-xl"
                                >
                                    {offset > 0 ? '→' : '←'}
                                </motion.div>
                                <span className="text-white text-sm font-semibold">
                                    {offset > 0
                                        ? `أدر الجوال ${Math.round(Math.abs(offset))}° لليمين`
                                        : `أدر الجوال ${Math.round(Math.abs(offset))}° لليسار`}
                                </span>
                                <motion.div
                                    animate={{ x: offset > 0 ? [0, 6, 0] : [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    className="text-amber-400 text-xl"
                                >
                                    {offset > 0 ? '→' : '←'}
                                </motion.div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function HapticTrigger({ isAligned }: { isAligned: boolean }) {
    useEffect(() => {
        if (isAligned && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([40, 30, 40]);
        }
    }, [isAligned]);
    return null;
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────

/**
 * Draws the horizontal heading arc bar across the top-center of the canvas.
 * The Qibla tick moves left/right depending on the angular offset.
 */
function drawHeadingArc(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    offset: number | null
) {
    const barY = H * 0.22;
    const barW = W * 0.85;
    const barH = 3;
    const barX = (W - barW) / 2;

    // Background bar
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(barX, barY - barH / 2, barW, barH, 4);
    ctx.fill();
    ctx.restore();

    if (offset === null) return;

    // Qibla tick on the bar
    // map offset (-180..180) -> bar position (0..barW)
    const clampedOffset = Math.max(-90, Math.min(90, offset));
    const tickX = barX + barW / 2 + (clampedOffset / 90) * (barW / 2);

    const isAligned = Math.abs(offset) < 5;
    const tickColor = isAligned ? '#10b981' : '#f59e0b';

    // Glow
    ctx.save();
    ctx.globalAlpha = 0.6;
    const grd = ctx.createRadialGradient(tickX, barY, 0, tickX, barY, 18);
    grd.addColorStop(0, tickColor);
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(tickX, barY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tick dot
    ctx.save();
    ctx.fillStyle = tickColor;
    ctx.beginPath();
    ctx.arc(tickX, barY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Small kaaba icon above tick
    ctx.save();
    ctx.globalAlpha = isAligned ? 1 : 0.8;
    ctx.fillStyle = '#1c1c1c';
    ctx.strokeStyle = tickColor;
    ctx.lineWidth = 2;
    const kSize = 18;
    ctx.beginPath();
    ctx.roundRect(tickX - kSize / 2, barY - 38, kSize, kSize, 3);
    ctx.fill();
    ctx.stroke();
    // Kiswa stripe
    ctx.globalAlpha = (isAligned ? 1 : 0.8);
    ctx.fillStyle = tickColor;
    ctx.fillRect(tickX - kSize / 2 + 2, barY - 38 + 3, kSize - 4, 2);
    ctx.restore();

    // Label "القبلة"
    ctx.save();
    ctx.globalAlpha = isAligned ? 1 : 0.7;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = tickColor;
    ctx.textAlign = 'center';
    ctx.fillText('القبلة', tickX, barY - 42);
    ctx.restore();
}

/**
 * Draws the main Qibla pointer beam radiating from the bottom-center of the screen.
 */
function drawQiblaBeam(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    offset: number,
    isAligned: boolean,
    hue: number
) {
    const originX = W / 2;
    const originY = H * 0.75;

    // Angle: 0 offset = straight up, positive offset = left, negative offset = right
    // We want the beam to point to where Qibla is on screen
    // If offset > 0 the Qibla is to the left, angle from up = -offset (in screen coords)
    // Angle: 0 offset = straight up, positive offset = right, negative offset = left
    // We want the beam to point to where Qibla is in relation to current heading
    const angleDeg = offset;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Beam length
    const beamLen = H * 0.7;

    // Endpoint
    const endX = originX + Math.sin(angleRad) * beamLen;
    const endY = originY - Math.cos(angleRad) * beamLen;

    // Beam gradient
    const beamColor = isAligned ? '#10b981' : '#f59e0b';
    const beamGlow = isAligned ? '#10b98180' : '#f59e0b80';

    // Outer glow beam
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.05 * Math.sin(hue * 0.06);
    const grd = ctx.createLinearGradient(originX, originY, endX, endY);
    grd.addColorStop(0, beamColor);
    grd.addColorStop(1, 'transparent');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    // Mid glow
    ctx.save();
    ctx.globalAlpha = 0.3;
    const grd2 = ctx.createLinearGradient(originX, originY, endX, endY);
    grd2.addColorStop(0, beamColor);
    grd2.addColorStop(1, 'transparent');
    ctx.strokeStyle = grd2;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    // Core beam
    ctx.save();
    ctx.globalAlpha = 0.85;
    const grd3 = ctx.createLinearGradient(originX, originY, endX, endY);
    grd3.addColorStop(0, '#ffffff');
    grd3.addColorStop(0.2, beamColor);
    grd3.addColorStop(1, 'transparent');
    ctx.strokeStyle = grd3;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    // Tip: Kaaba icon representation at end of beam
    if (beamLen > 100) {
        const kSize = 30 + (isAligned ? 10 : 0);
        ctx.save();
        ctx.translate(endX, endY);
        // We want the Kaaba to be upright or slightly rotated for perspective
        // But for AR, keeping it mostly upright is usually clearer

        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';

        // Main Cube
        ctx.fillStyle = '#1a1a1a';
        ctx.strokeStyle = '#cbb061';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-kSize / 2, -kSize / 2, kSize, kSize, 4);
        ctx.fill();
        ctx.stroke();

        // Golden Kiswa Stripe
        ctx.fillStyle = '#cbb061';
        ctx.fillRect(-kSize / 2 + 2, -kSize / 2 + 6, kSize - 4, 3);

        // Door
        ctx.fillStyle = '#cbb061';
        ctx.fillRect(kSize / 6, kSize / 6, kSize / 4, kSize / 3);

        // Name "مكة" or "الكعبة" if aligned
        if (isAligned) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px IBM Plex Sans Arabic';
            ctx.textAlign = 'center';
            ctx.fillText('الكعبة المشرفة', 0, -kSize / 2 - 10);
        }

        ctx.restore();

        // Glow circle at tip with pulsing animation
        ctx.save();
        const tipGlowSize = 35 + 8 * Math.sin(hue * 0.1);
        ctx.globalAlpha = 0.4 + 0.2 * Math.sin(hue * 0.1);
        const tipGlow = ctx.createRadialGradient(endX, endY, 0, endX, endY, tipGlowSize);
        tipGlow.addColorStop(0, beamColor);
        tipGlow.addColorStop(0.5, beamColor + '40');
        tipGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = tipGlow;
        ctx.beginPath();
        ctx.arc(endX, endY, tipGlowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Origin pulse ring
    ctx.save();
    const pulseR = 20 + 8 * Math.sin(hue * 0.08);
    ctx.globalAlpha = 0.5 * (1 - (pulseR - 20) / 8);
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(originX, originY, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Floating particles along the beam for "energy" effect
    ctx.save();
    for (let i = 0; i < 5; i++) {
        const t = ((hue * 0.01 + i * 0.2) % 1.0);
        const px = originX + Math.sin(angleRad) * beamLen * t;
        const py = originY - Math.cos(angleRad) * beamLen * t;
        const pSize = 2 + (1 - t) * 3;

        ctx.globalAlpha = (1 - t) * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = beamColor;
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 15;
    ctx.shadowColor = beamColor;
    ctx.beginPath();
    ctx.arc(originX, originY, 8, 0, Math.PI * 2);
    ctx.fill();

    // inner white dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(originX, originY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

/**
 * Corner viewfinder crosshair reticle with alignment effects
 */
function drawReticle(ctx: CanvasRenderingContext2D, W: number, H: number, isAligned: boolean, hue: number) {
    const color = isAligned ? '#10b981' : 'rgba(255,255,255,0.6)';
    const cx = W / 2;
    const cy = H / 2;
    const size = 60;
    const thick = 3;
    const corner = 16;

    ctx.save();

    // Aligned "Energy Waves"
    if (isAligned) {
        ctx.save();
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
            const progress = (hue * 0.05 + i / waveCount) % 1;
            const r = size + progress * 60;
            const opacity = (1 - progress) * 0.4;

            ctx.strokeStyle = '#10b981';
            ctx.globalAlpha = opacity;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = thick;
    ctx.lineCap = 'round';
    ctx.globalAlpha = isAligned ? (0.7 + 0.3 * Math.sin(Date.now() * 0.01)) : 0.45;

    // Pulse effect scale
    const pulseScale = isAligned ? (1 + 0.05 * Math.sin(Date.now() * 0.008)) : 1;
    ctx.translate(cx, cy);
    ctx.scale(pulseScale, pulseScale);
    ctx.translate(-cx, -cy);

    // Glow if aligned
    if (isAligned) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
    }

    // Top-left
    ctx.beginPath(); ctx.moveTo(cx - size, cy - size + corner); ctx.lineTo(cx - size, cy - size); ctx.lineTo(cx - size + corner, cy - size); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(cx + size - corner, cy - size); ctx.lineTo(cx + size, cy - size); ctx.lineTo(cx + size, cy - size + corner); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(cx - size, cy + size - corner); ctx.lineTo(cx - size, cy + size); ctx.lineTo(cx - size + corner, cy + size); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(cx + size - corner, cy + size); ctx.lineTo(cx + size, cy + size); ctx.lineTo(cx + size, cy + size - corner); ctx.stroke();

    ctx.restore();
}
