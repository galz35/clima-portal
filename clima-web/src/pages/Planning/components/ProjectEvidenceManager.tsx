import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';

import { clarityService } from '../../../services/clarity.service';
import type { ProyectoEvidencia } from '../../../types/modelos';
import { useToast } from '../../../context/ToastContext';

const MAX_EVIDENCE_BYTES = 1_000_000;
const EVIDENCE_SLOTS = [1, 2] as const;

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer la imagen.'));
        };
        img.src = url;
    });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('No se pudo convertir la imagen.'));
                return;
            }
            resolve(blob);
        }, type, quality);
    });

const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const base64 = result.includes(',') ? result.split(',')[1] : result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('No se pudo preparar el archivo.'));
        reader.readAsDataURL(blob);
    });

const compressImageToWebp = async (file: File) => {
    const image = await loadImage(file);
    const dimensions = [1600, 1280, 1024, 860];
    const qualities = [0.82, 0.72, 0.62, 0.52, 0.42];

    for (const maxDimension of dimensions) {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Tu navegador no pudo preparar la compresión de imagen.');
        }

        ctx.drawImage(image, 0, 0, width, height);

        for (const quality of qualities) {
            const blob = await canvasToBlob(canvas, 'image/webp', quality);
            if (blob.size <= MAX_EVIDENCE_BYTES) {
                const originalStem = file.name.replace(/\.[^.]+$/, '').trim() || 'evidencia';
                return {
                    blob,
                    fileName: `${originalStem}.webp`,
                    mimeType: 'image/webp',
                };
            }
        }
    }

    throw new Error('La imagen sigue pesando más de 1 MB incluso después de comprimirla.');
};

interface ProjectEvidenceManagerProps {
    projectId: number;
}

export const ProjectEvidenceManager: React.FC<ProjectEvidenceManagerProps> = ({ projectId }) => {
    const { showToast } = useToast();
    const [evidences, setEvidences] = useState<ProyectoEvidencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const loadEvidences = async () => {
        setLoading(true);
        try {
            const data = await clarityService.getProyectoEvidencias(projectId);
            setEvidences(data);
        } catch (error) {
            console.error(error);
            showToast('No se pudieron cargar las evidencias del proyecto', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadEvidences();
    }, [projectId]);

    const handleChooseFile = (slot: number) => {
        inputRefs.current[slot]?.click();
    };

    const handleUpload = async (slot: number, file?: File | null) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Solo se permiten imágenes', 'warning');
            return;
        }

        setActiveSlot(slot);
        try {
            const compressed = await compressImageToWebp(file);
            const contentBase64 = await blobToBase64(compressed.blob);
            const updated = await clarityService.uploadProyectoEvidencia(projectId, {
                slot,
                fileName: compressed.fileName,
                mimeType: compressed.mimeType,
                contentBase64,
            });
            setEvidences(updated);
            showToast('Evidencia guardada', 'success');
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'No se pudo guardar la evidencia';
            showToast(message, 'error');
        } finally {
            setActiveSlot(null);
            const input = inputRefs.current[slot];
            if (input) input.value = '';
        }
    };

    const handleDelete = async (slot: number) => {
        setActiveSlot(slot);
        try {
            const updated = await clarityService.deleteProyectoEvidencia(projectId, slot);
            setEvidences(updated);
            showToast('Evidencia eliminada', 'success');
        } catch (error) {
            console.error(error);
            showToast('No se pudo eliminar la evidencia', 'error');
        } finally {
            setActiveSlot(null);
        }
    };

    return (
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-cyan-50/70 p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Camera size={14} className="text-emerald-600" />
                        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Evidencias</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                        Máximo 2 fotos por proyecto. Se convierten a WebP y deben quedar por debajo de 1 MB.
                    </p>
                </div>
                {loading && <Loader2 size={16} className="animate-spin text-emerald-600" />}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {EVIDENCE_SLOTS.map((slot) => {
                    const evidence = evidences.find((item) => item.slot === slot);
                    const busy = activeSlot === slot;

                    return (
                        <div key={slot} className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-sm">
                            <input
                                ref={(node) => {
                                    inputRefs.current[slot] = node;
                                }}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(event) => void handleUpload(slot, event.target.files?.[0])}
                            />

                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                    Evidencia {slot}
                                </span>
                                {evidence && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                                        {formatBytes(evidence.fileSizeBytes)}
                                    </span>
                                )}
                            </div>

                            {evidence?.dataUrl ? (
                                <div className="space-y-3 p-4">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                        <img
                                            src={evidence.dataUrl}
                                            alt={`Evidencia ${slot}`}
                                            className="h-48 w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-800">{evidence.fileNameOriginal}</p>
                                        <p className="text-[11px] font-medium text-slate-400">
                                            {evidence.mimeType} · {formatBytes(evidence.fileSizeBytes)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleChooseFile(slot)}
                                            disabled={busy}
                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                            Reemplazar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => void handleDelete(slot)}
                                            disabled={busy}
                                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2.5 text-rose-600 transition-all hover:bg-rose-50 disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleChooseFile(slot)}
                                    disabled={busy || loading}
                                    className="flex h-[280px] w-full flex-col items-center justify-center gap-3 p-6 text-center transition-all hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {busy ? (
                                        <Loader2 size={28} className="animate-spin text-emerald-600" />
                                    ) : (
                                        <ImagePlus size={28} className="text-emerald-600" />
                                    )}
                                    <div>
                                        <p className="text-sm font-black text-slate-800">Subir foto liviana</p>
                                        <p className="mt-1 text-xs font-medium text-slate-400">
                                            JPG, PNG o WebP. El sistema la deja comprimida.
                                        </p>
                                    </div>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
