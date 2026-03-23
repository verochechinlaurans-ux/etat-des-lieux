"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Home,
  Camera,
  Plus,
  Trash2,
  Download,
  Sparkles,
  BedDouble,
  Bath,
  ChefHat,
  Trees,
  RefreshCw,
  Save,
  Share2,
  Copy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const conditionOptions = ["Neuf", "Très bon", "Bon", "Usure légère", "Abîmé"];

const conditionWeight = {
  Neuf: 0,
  "Très bon": 1,
  Bon: 2,
  "Usure légère": 3,
  Abîmé: 4,
};

const villaTemplate = [
  {
    id: "entree",
    name: "Entrée",
    icon: Home,
    structure: ["Porte d’entrée", "Murs", "Sol", "Plafond", "Éclairage", "Interphone / alarme"],
    items: ["Console", "Miroir", "Clés", "Télécommandes", "Décoration"],
  },
  {
    id: "salon",
    name: "Salon",
    icon: Home,
    structure: ["Murs", "Sol", "Plafond", "Baies vitrées", "Rideaux", "Éclairage"],
    items: ["Canapé", "Fauteuils", "Table basse", "Tapis", "Télévision", "Objets décoratifs"],
  },
  {
    id: "cuisine",
    name: "Cuisine",
    icon: ChefHat,
    structure: ["Murs", "Sol", "Plafond", "Plan de travail", "Éclairage", "Fenêtres"],
    items: ["Réfrigérateur", "Four", "Plaques", "Lave-vaisselle", "Vaisselle", "Petit électroménager"],
  },
  {
    id: "suite",
    name: "Suite principale",
    icon: BedDouble,
    structure: ["Murs", "Sol", "Plafond", "Fenêtres", "Rideaux", "Éclairage"],
    items: ["Lit", "Matelas", "Linge", "Chevets", "Lampes", "Dressing"],
  },
  {
    id: "sdb",
    name: "Salle de bain",
    icon: Bath,
    structure: ["Murs", "Sol", "Plafond", "Ventilation", "Miroirs", "Éclairage"],
    items: ["Lavabo", "Robinetterie", "Douche / baignoire", "WC", "Linge", "Sèche-cheveux"],
  },
  {
    id: "exterieur",
    name: "Extérieurs",
    icon: Trees,
    structure: ["Façade", "Terrasse", "Piscine", "Jardin", "Portail", "Éclairage extérieur"],
    items: ["Transats", "Table extérieure", "Barbecue", "Parasols", "Coussins", "Accessoires piscine"],
  },
];

function makeChecklist(entries) {
  return entries.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    condition: "Bon",
    reserve: "",
    photos: [],
  }));
}

function createInspectionRooms() {
  return villaTemplate.map((room) => ({
    ...room,
    structureChecks: makeChecklist(room.structure),
    itemChecks: makeChecklist(room.items),
    globalNote: "",
  }));
}

function createInspection() {
  return {
    createdAt: new Date().toISOString(),
    villa: "Villa Signature",
    guest: "",
    manager: "",
    arrivalDate: "",
    departureDate: "",
    generalReserve: "",
    tenantValidation: "",
    hostSignature: "",
    tenantSignature: "",
    rooms: createInspectionRooms(),
  };
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function sortBySeverity(data) {
  return [...data].sort((a, b) => conditionWeight[b.condition] - conditionWeight[a.condition]);
}

function flattenChecks(rooms) {
  return rooms.flatMap((room) => [
    ...room.structureChecks.map((check) => ({ ...check, room: room.name, group: "Structure" })),
    ...room.itemChecks.map((check) => ({ ...check, room: room.name, group: "Mobilier & objets" })),
  ]);
}

function signatureToImage(canvas) {
  return canvas.toDataURL("image/png");
}

function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const width = parent.clientWidth;
    const height = 160;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = value;
    }
  }, [value]);

  const start = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  };

  const draw = (x, y) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(signatureToImage(canvasRef.current));
  };

  const clear = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={clear}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Effacer
        </Button>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ touchAction: "pan-y" }}
          onMouseDown={(e) => {
            const p = getPos(e);
            start(p.x, p.y);
          }}
          onMouseMove={(e) => {
            const p = getPos(e);
            draw(p.x, p.y);
          }}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={(e) => {
            const p = getPos(e);
            start(p.x, p.y);
          }}
          onTouchMove={(e) => {
            if (!drawing.current) return;
            e.preventDefault();
            const p = getPos(e);
            draw(p.x, p.y);
          }}
          onTouchEnd={end}
        />
      </div>
    </div>
  );
}

const CheckCard = ({ roomId, sectionKey, check, updateCheck, addPhoto, removePhoto }) => (
  <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
    <CardContent className="p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-950">{check.label}</p>
          <p className="text-sm text-slate-500">État, réserves détaillées et preuves photo</p>
        </div>
        <Badge variant={check.condition === "Abîmé" ? "destructive" : "secondary"}>
          {check.condition}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>État</Label>
          <Select
            value={check.condition}
            onValueChange={(value) =>
              updateCheck(roomId, sectionKey, check.id, { condition: value })
            }
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Réserve / commentaire</Label>
          <Textarea
            className="min-h-[96px] rounded-2xl"
            value={check.reserve}
            onChange={(e) =>
              updateCheck(roomId, sectionKey, check.id, { reserve: e.target.value })
            }
            placeholder="Ex. rayure légère, manque 1 verre, angle du meuble marqué..."
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photos
        </Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          className="rounded-2xl"
          onChange={(e) =>
            e.target.files && addPhoto(roomId, sectionKey, check.id, e.target.files)
          }
        />

        {!!check.photos.length && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {check.photos.map((photo, index) => (
              <div key={index} className="relative rounded-2xl overflow-hidden border bg-slate-50">
                <img
                  src={photo}
                  alt={`${check.label}-${index}`}
                  className="h-28 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(roomId, sectionKey, check.id, index)}
                  className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const SectionEditor = ({
  room,
  title,
  sectionKey,
  updateCheck,
  addPhoto,
  removePhoto,
  addLine,
}) => {
  const [newLabel, setNewLabel] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="rounded-2xl"
          placeholder={`Ajouter un point dans ${title.toLowerCase()}`}
        />
        <Button
          type="button"
          className="rounded-2xl"
          onClick={() => {
            addLine(room.id, sectionKey, newLabel);
            setNewLabel("");
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <div className="grid gap-4">
        {room[sectionKey].map((check) => (
          <CheckCard
            key={check.id}
            roomId={room.id}
            sectionKey={sectionKey}
            check={check}
            updateCheck={updateCheck}
            addPhoto={addPhoto}
            removePhoto={removePhoto}
          />
        ))}
      </div>
    </div>
  );
};

export default function EtatDesLieuxVillaLuxe() {
  const [entryInspection, setEntryInspection] = useState(createInspection);
  const [exitInspection, setExitInspection] = useState(createInspection);
  const [activeInspection, setActiveInspection] = useState("Entrée");
  const [brandName, setBrandName] = useState("Conciergerie Signature");
  const [villaReference, setVillaReference] = useState("LA MASIA DE POUMARET");
  const [allowGuestMode, setAllowGuestMode] = useState(true);
  const [saveNotice, setSaveNotice] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const inspection = activeInspection === "Entrée" ? entryInspection : exitInspection;
  const setInspection = activeInspection === "Entrée" ? setEntryInspection : setExitInspection;

  useEffect(() => {
    const saved = localStorage.getItem("villa-luxe-edl-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.entryInspection) setEntryInspection(parsed.entryInspection);
        if (parsed.exitInspection) setExitInspection(parsed.exitInspection);
        if (parsed.brandName) setBrandName(parsed.brandName);
        if (parsed.villaReference) setVillaReference(parsed.villaReference);
        if (typeof parsed.allowGuestMode === "boolean") setAllowGuestMode(parsed.allowGuestMode);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "villa-luxe-edl-v2",
      JSON.stringify({ entryInspection, exitInspection, brandName, villaReference, allowGuestMode })
    );
    setSaveNotice("Sauvegardé localement");
    const t = setTimeout(() => setSaveNotice(""), 1200);
    return () => clearTimeout(t);
  }, [entryInspection, exitInspection, brandName, villaReference, allowGuestMode]);

  const stats = useMemo(() => {
    const allChecks = flattenChecks(inspection.rooms);
    return {
      total: allChecks.length,
      photos: allChecks.reduce((sum, c) => sum + c.photos.length, 0),
      reserves: allChecks.filter((c) => c.reserve.trim()).length + (inspection.generalReserve.trim() ? 1 : 0),
      damaged: allChecks.filter((c) => c.condition === "Abîmé").length,
      wear: allChecks.filter((c) => c.condition === "Usure légère").length,
    };
  }, [inspection]);

  const deltas = useMemo(() => {
    const list = [];
    entryInspection.rooms.forEach((entryRoom, roomIndex) => {
      const exitRoom = exitInspection.rooms[roomIndex];
      if (!exitRoom) return;

      [
        [entryRoom.structureChecks, exitRoom.structureChecks],
        [entryRoom.itemChecks, exitRoom.itemChecks],
      ].forEach(([entryChecks, exitChecks]) => {
        entryChecks.forEach((entryCheck, index) => {
          const exitCheck = exitChecks[index];
          if (!exitCheck) return;

          if (
            conditionWeight[exitCheck.condition] > conditionWeight[entryCheck.condition] ||
            exitCheck.reserve.trim()
          ) {
            list.push({
              room: entryRoom.name,
              label: entryCheck.label,
              before: entryCheck.condition,
              after: exitCheck.condition,
              reserve: exitCheck.reserve,
            });
          }
        });
      });
    });
    return list;
  }, [entryInspection, exitInspection]);

  const updateInspectionField = (field, value) => {
    setInspection((prev) => ({ ...prev, [field]: value }));
  };

  const updateCheck = (roomId, section, checkId, patch) => {
    setInspection((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((c) => (c.id === checkId ? { ...c, ...patch } : c)),
            }
      ),
    }));
  };

  const addPhoto = async (roomId, section, checkId, files) => {
    const photos = await Promise.all(Array.from(files).map(toDataUrl));
    setInspection((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((c) =>
                c.id === checkId ? { ...c, photos: [...c.photos, ...photos] } : c
              ),
            }
      ),
    }));
  };

  const removePhoto = (roomId, section, checkId, index) => {
    setInspection((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((c) =>
                c.id === checkId ? { ...c, photos: c.photos.filter((_, i) => i !== index) } : c
              ),
            }
      ),
    }));
  };

  const addLine = (roomId, section, label) => {
    if (!label.trim()) return;

    setInspection((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: [
                ...room[section],
                {
                  id: `${label}-${Date.now()}`,
                  label: label.trim(),
                  condition: "Bon",
                  reserve: "",
                  photos: [],
                },
              ],
            }
      ),
    }));
  };

  const addCustomRoom = () => {
    if (!newRoomName.trim()) return;

    const room = {
      id: `custom-${Date.now()}`,
      name: newRoomName.trim(),
      icon: Home,
      structureChecks: makeChecklist(["Murs", "Sol", "Plafond"]),
      itemChecks: makeChecklist(["Mobilier principal"]),
      globalNote: "",
    };

    setInspection((prev) => ({ ...prev, rooms: [...prev.rooms, room] }));
    setNewRoomName("");
  };

  const duplicateEntryToExit = () => {
    setExitInspection(JSON.parse(JSON.stringify(entryInspection)));
    setSaveNotice("Entrée dupliquée vers sortie");
    setTimeout(() => setSaveNotice(""), 1200);
  };

  const copyGuestLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}?mode=locataire&inspection=${activeInspection.toLowerCase()}`;
    await navigator.clipboard.writeText(link);
    setSaveNotice("Lien locataire copié");
    setTimeout(() => setSaveNotice(""), 1200);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 38;
    let y = 44;

    const ensureSpace = (space = 40) => {
      if (y + space > pageHeight - margin) {
        doc.addPage();
        y = 44;
      }
    };

    const writeWrapped = (text, x, size = 11, lineHeight = 15) => {
      const lines = doc.splitTextToSize(text || "", pageWidth - margin * 2);
      ensureSpace(lines.length * lineHeight + 8);
      doc.setFontSize(size);
      doc.text(lines, x, y);
      y += lines.length * lineHeight;
    };

    doc.setFontSize(22);
    doc.text(`${brandName}`, margin, y);
    y += 24;
    doc.setFontSize(18);
    doc.text(`État des lieux ${activeInspection.toLowerCase()} — ${villaReference}`, margin, y);
    y += 20;
    doc.setFontSize(11);
    doc.text(`Villa : ${inspection.villa || villaReference}`, margin, y);
    y += 15;
    doc.text(`Locataire : ${inspection.guest || "-"}`, margin, y);
    y += 15;
    doc.text(`Gestionnaire : ${inspection.manager || "-"}`, margin, y);
    y += 15;
    doc.text(`Séjour : ${inspection.arrivalDate || "-"} → ${inspection.departureDate || "-"}`, margin, y);
    y += 22;

    writeWrapped(
      `Résumé : ${stats.total} contrôles, ${stats.photos} photos, ${stats.reserves} réserve(s), ${stats.wear} usure(s) légère(s), ${stats.damaged} élément(s) abîmé(s).`,
      margin,
      11,
      15
    );
    y += 8;

    if (inspection.generalReserve.trim()) {
      doc.setFontSize(13);
      ensureSpace(24);
      doc.text("Réserves générales", margin, y);
      y += 16;
      writeWrapped(inspection.generalReserve, margin, 10, 14);
      y += 4;
    }

    inspection.rooms.forEach((room) => {
      ensureSpace(30);
      doc.setFontSize(15);
      doc.text(room.name, margin, y);
      y += 16;

      [
        { title: "Structure", data: sortBySeverity(room.structureChecks) },
        { title: "Mobilier & objets", data: sortBySeverity(room.itemChecks) },
      ].forEach((section) => {
        ensureSpace(18);
        doc.setFontSize(12);
        doc.text(section.title, margin + 6, y);
        y += 14;

        section.data.forEach((check) => {
          const line = `• ${check.label} — ${check.condition}${
            check.reserve ? ` — Réserve : ${check.reserve}` : ""
          }`;
          writeWrapped(line, margin + 12, 10, 13);

          if (check.photos?.length) {
            check.photos.slice(0, 2).forEach((photo) => {
              ensureSpace(82);
              try {
                doc.addImage(photo, "JPEG", margin + 16, y, 72, 54);
              } catch {
                try {
                  doc.addImage(photo, "PNG", margin + 16, y, 72, 54);
                } catch {}
              }
              y += 62;
            });
          }
        });
      });

      if (room.globalNote?.trim()) {
        doc.setFontSize(11);
        ensureSpace(20);
        doc.text("Note de pièce", margin + 6, y);
        y += 14;
        writeWrapped(room.globalNote, margin + 12, 10, 13);
      }

      y += 8;
    });

    if (activeInspection === "Sortie" && deltas.length) {
      ensureSpace(32);
      doc.setFontSize(14);
      doc.text("Évolutions constatées entre entrée et sortie", margin, y);
      y += 18;

      deltas.forEach((delta) => {
        writeWrapped(
          `• ${delta.room} — ${delta.label} : ${delta.before} → ${delta.after}${
            delta.reserve ? ` — ${delta.reserve}` : ""
          }`,
          margin + 8,
          10,
          13
        );
      });

      y += 4;
    }

    ensureSpace(150);
    doc.setFontSize(12);
    doc.text("Validation et signatures", margin, y);
    y += 18;
    writeWrapped(inspection.tenantValidation || "Aucun commentaire de validation.", margin, 10, 14);
    y += 10;

    if (inspection.hostSignature) {
      try {
        doc.addImage(inspection.hostSignature, "PNG", margin, y, 150, 60);
      } catch {}
      doc.text("Signature gestionnaire", margin, y + 72);
    }

    if (inspection.tenantSignature) {
      try {
        doc.addImage(inspection.tenantSignature, "PNG", margin + 220, y, 150, 60);
      } catch {}
      doc.text("Signature locataire", margin + 220, y + 72);
    }

    doc.save(
      `etat-des-lieux-${activeInspection.toLowerCase()}-${villaReference
        .toLowerCase()
        .replace(/\s+/g, "-")}.pdf`
    );
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden touch-pan-y bg-[radial-gradient(circle_at_top,#f8fafc,#eef2ff_45%,#ffffff)] p-3 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Card className="rounded-[32px] border-0 shadow-2xl bg-white">
            <CardContent className="p-5 md:p-8">
              <div className="grid grid-cols-1 2xl:grid-cols-[1.65fr_1fr] gap-6 items-start">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
                    <Sparkles className="h-4 w-4" />
                    Version très haut de gamme — conciergerie premium
                  </div>

                  <div>
                    <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-950">
                      État des lieux luxe avec signatures, comparaison entrée/sortie et expérience mobile
                    </h1>
                    <p className="mt-3 max-w-3xl text-slate-600 text-base md:text-lg">
                      Une base haut de gamme pensée pour des villas premium : parcours fluide, photos,
                      réserves détaillées, mode locataire, signatures tactiles, sauvegarde locale et rapport PDF élégant.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="rounded-3xl shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Contrôles</p>
                      <p className="text-2xl font-semibold">{stats.total}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Photos</p>
                      <p className="text-2xl font-semibold">{stats.photos}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Réserves</p>
                      <p className="text-2xl font-semibold">{stats.reserves}</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl shadow-sm bg-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-slate-500">Évolutions sortie</p>
                      <p className="text-2xl font-semibold">{deltas.length}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[1.05fr_2fr] gap-6 items-start">
          <Card className="rounded-[32px] border-0 shadow-xl bg-white">
            <CardHeader>
              <CardTitle className="text-xl">Pilotage premium</CardTitle>
              <CardDescription>Marque, inspection active, sauvegarde et partage locataire</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Nom de ta conciergerie</Label>
                <Input className="rounded-2xl" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Référence villa</Label>
                <Input className="rounded-2xl" value={villaReference} onChange={(e) => setVillaReference(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Inspection en cours</Label>
                <Tabs value={activeInspection} onValueChange={setActiveInspection} className="w-full">
                  <TabsList className="grid grid-cols-2 rounded-2xl h-11 bg-white">
                    <TabsTrigger value="Entrée" className="rounded-2xl">
                      Entrée
                    </TabsTrigger>
                    <TabsTrigger value="Sortie" className="rounded-2xl">
                      Sortie
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center justify-between rounded-2xl border px-4 py-3 gap-4">
                <div>
                  <p className="font-medium text-slate-900">Mode locataire autorisé</p>
                  <p className="text-sm text-slate-500">
                    Permet de partager un lien pour consultation / commentaires
                  </p>
                </div>
                <Switch checked={allowGuestMode} onCheckedChange={setAllowGuestMode} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button className="rounded-2xl" variant="secondary" onClick={duplicateEntryToExit}>
                  <Copy className="h-4 w-4 mr-2" />
                  Dupliquer entrée → sortie
                </Button>

                <Button className="rounded-2xl" variant="outline" onClick={copyGuestLink} disabled={!allowGuestMode}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Copier lien locataire
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button className="rounded-2xl h-11" onClick={exportPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>

                <div className="rounded-2xl border h-11 flex items-center justify-center text-sm text-slate-600">
                  <Save className="h-4 w-4 mr-2" />
                  {saveNotice || "Sauvegarde locale active"}
                </div>
              </div>

              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full rounded-2xl">
                    Prévisualiser le mode locataire
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Mode locataire</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-slate-600">
                    <p>
                      Le locataire peut consulter l’état des lieux sur mobile, ajouter ses commentaires
                      de validation et signer directement sur écran tactile.
                    </p>
                    <p>
                      Dans une version déployée avec base de données, ce lien serait unique par séjour et sécurisé.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Dossier séjour</CardTitle>
                <CardDescription>Informations générales, réserves globales et validation</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du bien</Label>
                  <Input className="rounded-2xl" value={inspection.villa} onChange={(e) => updateInspectionField("villa", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Locataire</Label>
                  <Input className="rounded-2xl" value={inspection.guest} onChange={(e) => updateInspectionField("guest", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Gestionnaire / concierge</Label>
                  <Input className="rounded-2xl" value={inspection.manager} onChange={(e) => updateInspectionField("manager", e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date entrée</Label>
                    <Input type="date" className="rounded-2xl" value={inspection.arrivalDate} onChange={(e) => updateInspectionField("arrivalDate", e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Date sortie</Label>
                    <Input type="date" className="rounded-2xl" value={inspection.departureDate} onChange={(e) => updateInspectionField("departureDate", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Réserves générales</Label>
                  <Textarea
                    className="min-h-[110px] rounded-2xl"
                    value={inspection.generalReserve}
                    onChange={(e) => updateInspectionField("generalReserve", e.target.value)}
                    placeholder="Ex. éclat sur pierre naturelle, télécommande portail capricieuse, une chaise marquée..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Commentaire de validation du locataire</Label>
                  <Textarea
                    className="min-h-[110px] rounded-2xl"
                    value={inspection.tenantValidation}
                    onChange={(e) => updateInspectionField("tenantValidation", e.target.value)}
                    placeholder="Le locataire peut confirmer l’état des lieux ou formuler ses réserves complémentaires."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Signatures tactiles</CardTitle>
                <CardDescription>Très utile sur tablette ou téléphone lors du check-in / check-out</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SignaturePad
                  value={inspection.hostSignature}
                  onChange={(value) => updateInspectionField("hostSignature", value)}
                  label="Signature gestionnaire"
                />
                <SignaturePad
                  value={inspection.tenantSignature}
                  onChange={(value) => updateInspectionField("tenantSignature", value)}
                  label="Signature locataire"
                />
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Pièces et inventaire détaillé</CardTitle>
                <CardDescription>Ajoute des pièces personnalisées, structure, mobilier, objets, photos et réserves.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    className="rounded-2xl"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Ajouter une pièce premium : pool house, cave à vin, salle cinéma..."
                  />
                  <Button className="rounded-2xl" onClick={addCustomRoom}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une pièce
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue={inspection.rooms[0]?.id} className="space-y-4">
              <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl p-1 h-auto justify-start bg-white">
                {inspection.rooms.map((room) => (
                  <TabsTrigger
                    key={room.id}
                    value={room.id}
                    className="rounded-2xl whitespace-normal text-left"
                  >
                    {room.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {inspection.rooms.map((room) => (
                <TabsContent key={room.id} value={room.id} className="space-y-4">
                  <Card className="rounded-[32px] border-0 shadow-xl bg-white">
                    <CardHeader>
                      <CardTitle className="text-2xl">{room.name}</CardTitle>
                      <CardDescription>Contrôle de la structure, du mobilier et commentaires de pièce</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <Accordion type="multiple" defaultValue={["structure", "items", "notes"]} className="space-y-4">
                        <AccordionItem value="structure" className="border rounded-3xl px-4">
                          <AccordionTrigger className="text-base font-semibold">
                            Structure de la pièce
                          </AccordionTrigger>
                          <AccordionContent>
                            <SectionEditor
                              room={room}
                              title="Structure"
                              sectionKey="structureChecks"
                              updateCheck={updateCheck}
                              addPhoto={addPhoto}
                              removePhoto={removePhoto}
                              addLine={addLine}
                            />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="items" className="border rounded-3xl px-4">
                          <AccordionTrigger className="text-base font-semibold">
                            Mobilier et objets
                          </AccordionTrigger>
                          <AccordionContent>
                            <SectionEditor
                              room={room}
                              title="Mobilier et objets"
                              sectionKey="itemChecks"
                              updateCheck={updateCheck}
                              addPhoto={addPhoto}
                              removePhoto={removePhoto}
                              addLine={addLine}
                            />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="notes" className="border rounded-3xl px-4">
                          <AccordionTrigger className="text-base font-semibold">
                            Commentaire global de pièce
                          </AccordionTrigger>
                          <AccordionContent>
                            <Textarea
                              className="min-h-[120px] rounded-2xl mt-2"
                              value={room.globalNote}
                              onChange={(e) =>
                                setInspection((prev) => ({
                                  ...prev,
                                  rooms: prev.rooms.map((r) =>
                                    r.id === room.id ? { ...r, globalNote: e.target.value } : r
                                  ),
                                }))
                              }
                              placeholder="Ex. ambiance générale impeccable, légère usure sur rideau, 2 verres à repositionner..."
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            <Card className="rounded-[32px] border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">Comparatif intelligent entrée / sortie</CardTitle>
                <CardDescription>
                  Utile pour identifier rapidement les changements et préparer une retenue ou une discussion avec le locataire.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {deltas.length ? (
                  <div className="space-y-3">
                    {deltas.map((delta, index) => (
                      <div key={index} className="rounded-2xl border p-4 bg-white">
                        <p className="font-medium text-slate-900">
                          {delta.room} — {delta.label}
                        </p>
                        <p className="text-sm text-slate-600">
                          {delta.before} → {delta.after}
                        </p>
                        {!!delta.reserve && (
                          <p className="mt-1 text-sm text-slate-500">Réserve : {delta.reserve}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                    Aucun écart détecté pour le moment entre l’entrée et la sortie.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}