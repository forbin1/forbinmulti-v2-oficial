import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

type Area = { x: number; y: number; width: number; height: number };

/** Recorta a região selecionada e redimensiona para caber em maxW/maxH (JPEG leve). */
async function cropToFile(
  imageSrc: string,
  crop: Area,
  maxW: number,
  maxH: number,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a imagem"));
    img.src = imageSrc;
  });

  const scale = Math.min(1, maxW / crop.width, maxH / crop.height);
  const outW = Math.max(1, Math.round(crop.width * scale));
  const outH = Math.max(1, Math.round(crop.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("Falha ao processar a imagem");
  return new File([blob], fileName, { type: "image/jpeg" });
}

export function ImageCropModal({
  file,
  aspect,
  cropShape = "rect",
  title,
  maxWidth = 1280,
  maxHeight = 1280,
  onCancel,
  onConfirm,
}: {
  file: File;
  aspect: number;
  cropShape?: "rect" | "round";
  title: string;
  maxWidth?: number;
  maxHeight?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [src, setSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, px: Area) => setAreaPixels(px), []);

  const confirm = async () => {
    if (!areaPixels) return;
    setProcessing(true);
    try {
      const name = file.name.replace(/\.\w+$/, "") + ".jpg";
      const out = await cropToFile(src, areaPixels, maxWidth, maxHeight, name);
      onConfirm(out);
    } catch {
      setProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !processing && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={cropShape === "round" ? "relative mx-auto h-72 w-72 overflow-hidden rounded-2xl bg-neutral-900" : "relative h-64 w-full overflow-hidden rounded-2xl bg-neutral-900"}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1 pt-1">
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
            aria-label="Zoom"
          />
        </div>
        <p className="px-1 text-xs text-muted-foreground">Arraste para posicionar e use o zoom para enquadrar.</p>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={processing}>Cancelar</Button>
          <Button onClick={confirm} disabled={processing || !areaPixels}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
