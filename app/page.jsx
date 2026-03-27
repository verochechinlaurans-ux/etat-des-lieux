"use client";

import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Camera, Download, Mail, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const conditionOptions = ["Neuf", "Très bon", "Bon", "Usure légère", "Abîmé", "Manquant"];

const defaultRooms = [
  { id: "entree", name: "Entrée", items: ["Porte d’entrée", "Clés", "Télécommandes", "Console"] },
  { id: "salon", name: "Salon", items: ["Canapé", "Fauteuils", "Table basse", "Tapis", "Télévision"] },
  { id: "cuisine", name: "Cuisine", items: ["Réfrigérateur", "Four", "Plaques", "Lave-vaisselle", "Vaisselle"] },
  { id: "chambre1", name: "Chambre 1", items: ["Lit", "Matelas", "Tables de chevet", "Lampes", "Armoire"] },
  { id: "sdb", name: "Salle de bain", items: ["Lavabo", "Douche", "WC", "Miroir", "Sèche-cheveux"] },
  { id: "exterieur", name: "Extérieurs", items: ["Table extérieure", "Chaises", "Transats", "Parasols", "Barbecue"] },
];

function makeItems(items) {
  return items.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    condition: "Bon",
    comment: "",
    photos: [],
  }));
}

function createFormData() {
  return {
    villa: "LA MASIA DE POUMARET",
    inspectionType: "Entrée",
    guest: "",
    manager: "",
    arrivalDate: "",
    departureDate: "",
    tenantValidation: "",
    generalComments: "",
    rooms: defaultRooms.map((room) => ({
      ...room,
      items: makeItems(room.items),
    })),
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

function FieldCard({ roomId, item, updateItem, addPhotos, removePhoto }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="space-y-1">
        <p className="font-medium text-slate-900">{item.label}</p>
        <p className="text-sm text-slate-500">État, commentaire éventuel et photos</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>État</Label>
          <Select value={item.condition} onValueChange={(value) => updateItem(roomId, item.id, { condition: value })}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Commentaire / réserve</Label>
          <Textarea
            className="min-h-[92px] rounded-xl"
            value={item.comment}
            onChange={(e) => updateItem(roomId, item.id, { comment: e.target.value })}
            placeholder="Ex. trace sur mur, verre ébréché, coussin taché..."
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Photos</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          className="rounded-xl"
          onChange={(e) => e.target.files && addPhotos(roomId, item.id, e.target.files)}
        />

        {!!item.photos.length && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {item.photos.map((photo, index) => (
              <div key={index} className="relative overflow-hidden rounded-2xl border bg-slate-50">
                <img src={photo} alt={`${item.label}-${index}`} className="h-28 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(roomId, item.id, index)}
                  className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EtatDesLieuxFormulaireSimple() {
  const [data, setData] = useState(createFormData);
  const [newRoomName, setNewRoomName] = useState("");
  const [newItemsByRoom, setNewItemsByRoom] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("edl-formulaire-simple-v1");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("edl-formulaire-simple-v1", JSON.stringify(data));
  }, [data]);

  const stats = useMemo(() => {
    const allItems = data.rooms.flatMap((room) => room.items);
    return {
      rooms: data.rooms.length,
      items: allItems.length,
      photos: allItems.reduce((sum, item) => sum + item.photos.length, 0),
      comments: allItems.filter((item) => item.comment.trim()).length,
    };
  }, [data]);

  const updateField = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (roomId, itemId, patch) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              items: room.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
      ),
    }));
  };

  const addPhotos = async (roomId, itemId, files) => {
    const photos = await Promise.all(Array.from(files).map(toDataUrl));
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              items: room.items.map((item) =>
                item.id === itemId ? { ...item, photos: [...item.photos, ...photos] } : item
              ),
            }
      ),
    }));
  };

  const removePhoto = (roomId, itemId, index) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              items: room.items.map((item) =>
                item.id === itemId ? { ...item, photos: item.photos.filter((_, i) => i !== index) } : item
              ),
            }
      ),
    }));
  };

  const addRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    setData((prev) => ({
      ...prev,
      rooms: [
        ...prev.rooms,
        {
          id: `room-${Date.now()}`,
          name,
          items: [],
        },
      ],
    }));
    setNewRoomName("");
  };

  const addItemToRoom = (roomId) => {
    const label = (newItemsByRoom[roomId] || "").trim();
    if (!label) return;
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              items: [
                ...room.items,
                {
                  id: `${label}-${Date.now()}`,
                  label,
                  condition: "Bon",
                  comment: "",
                  photos: [],
                },
              ],
            }
      ),
    }));
    setNewItemsByRoom((prev) => ({ ...prev, [roomId]: "" }));
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    let y = 42;

    const ensureSpace = (space = 40) => {
      if (y + space > pageHeight - margin) {
        doc.addPage();
        y = 42;
      }
    };

    const writeWrapped = (text, x, size = 11, lineHeight = 15) => {
      const lines = doc.splitTextToSize(text || "", pageWidth - margin * 2);
      ensureSpace(lines.length * lineHeight + 8);
      doc.setFontSize(size);
      doc.text(lines, x, y);
      y += lines.length * lineHeight;
    };

    doc.setFontSize(20);
    doc.text(`État des lieux ${data.inspectionType.toLowerCase()} — ${data.villa}`, margin, y);
    y += 22;
    doc.setFontSize(11);
    doc.text(`Locataire : ${data.guest || "-"}`, margin, y);
    y += 15;
    doc.text(`Gestionnaire : ${data.manager || "-"}`, margin, y);
    y += 15;
    doc.text(`Séjour : ${data.arrivalDate || "-"} → ${data.departureDate || "-"}`, margin, y);
    y += 20;

    if (data.generalComments.trim()) {
      doc.setFontSize(13);
      doc.text("Commentaires généraux", margin, y);
      y += 16;
      writeWrapped(data.generalComments, margin, 10, 14);
      y += 4;
    }

    data.rooms.forEach((room) => {
      ensureSpace(26);
      doc.setFontSize(14);
      doc.text(room.name, margin, y);
      y += 16;

      room.items.forEach((item) => {
        const line = `• ${item.label} — ${item.condition}${item.comment ? ` — ${item.comment}` : ""}`;
        writeWrapped(line, margin + 10, 10, 13);

        if (item.photos?.length) {
          item.photos.slice(0, 2).forEach((photo) => {
            ensureSpace(84);
            try {
              doc.addImage(photo, "JPEG", margin + 14, y, 74, 56);
            } catch {
              try {
                doc.addImage(photo, "PNG", margin + 14, y, 74, 56);
              } catch {}
            }
            y += 64;
          });
        }
      });

      y += 6;
    });

    ensureSpace(70);
    doc.setFontSize(13);
    doc.text("Validation du locataire", margin, y);
    y += 16;
    writeWrapped(data.tenantValidation || "Validation non renseignée.", margin, 10, 14);

    doc.save(`etat-des-lieux-${data.inspectionType.toLowerCase()}-${data.villa.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  const sendByEmail = () => {
    const subject = encodeURIComponent(`État des lieux ${data.inspectionType.toLowerCase()} - ${data.villa}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver en pièce jointe le PDF de l'état des lieux ${data.inspectionType.toLowerCase()} pour ${data.villa}.\n\nLocataire : ${data.guest || "-"}\nDates : ${data.arrivalDate || "-"} → ${data.departureDate || "-"}\n\nCordialement`
    );
    window.location.href = `mailto:veronique@cleide.fr?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="rounded-[28px] border-0 shadow-xl bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950">
                  État des lieux simple avec photos et PDF
                </h1>
                <p className="mt-2 text-slate-600">
                  Formulaire clair, pièce par pièce, sans signature. Le locataire peut compléter sa validation, puis exporter le PDF et l’envoyer par email.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border p-4"><p className="text-sm text-slate-500">Pièces</p><p className="text-2xl font-semibold">{stats.rooms}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-sm text-slate-500">Objets</p><p className="text-2xl font-semibold">{stats.items}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-sm text-slate-500">Photos</p><p className="text-2xl font-semibold">{stats.photos}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-sm text-slate-500">Commentaires</p><p className="text-2xl font-semibold">{stats.comments}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Informations du séjour</CardTitle>
            <CardDescription>Données générales de l’état des lieux</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type d’état des lieux</Label>
              <Select value={data.inspectionType} onValueChange={(value) => updateField("inspectionType", value)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrée">Entrée</SelectItem>
                  <SelectItem value="Sortie">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom du bien</Label>
              <Input className="rounded-xl" value={data.villa} onChange={(e) => updateField("villa", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Locataire</Label>
              <Input className="rounded-xl" value={data.guest} onChange={(e) => updateField("guest", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Gestionnaire</Label>
              <Input className="rounded-xl" value={data.manager} onChange={(e) => updateField("manager", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date d’entrée</Label>
              <Input type="date" className="rounded-xl" value={data.arrivalDate} onChange={(e) => updateField("arrivalDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date de sortie</Label>
              <Input type="date" className="rounded-xl" value={data.departureDate} onChange={(e) => updateField("departureDate", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Commentaires généraux</Label>
              <Textarea className="min-h-[110px] rounded-xl" value={data.generalComments} onChange={(e) => updateField("generalComments", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Validation / commentaire du locataire</Label>
              <Textarea
                className="min-h-[110px] rounded-xl"
                value={data.tenantValidation}
                onChange={(e) => updateField("tenantValidation", e.target.value)}
                placeholder="Ex. Je confirme avoir consulté l’état des lieux et j’ajoute mes éventuelles réserves."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Ajouter une pièce</CardTitle>
            <CardDescription>Pour compléter l’inventaire selon la villa</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Input className="rounded-xl" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Ex. Pool house, cave, buanderie..." />
            <Button className="rounded-xl" onClick={addRoom}><Plus className="h-4 w-4 mr-2" />Ajouter une pièce</Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {data.rooms.map((room) => (
            <Card key={room.id} className="rounded-[28px] border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                <CardDescription>État des objets et photos de cette pièce</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    className="rounded-xl"
                    value={newItemsByRoom[room.id] || ""}
                    onChange={(e) => setNewItemsByRoom((prev) => ({ ...prev, [room.id]: e.target.value }))}
                    placeholder={`Ajouter un objet dans ${room.name.toLowerCase()}`}
                  />
                  <Button className="rounded-xl" onClick={() => addItemToRoom(room.id)}><Plus className="h-4 w-4 mr-2" />Ajouter un objet</Button>
                </div>

                <Accordion type="multiple" defaultValue={[`room-${room.id}`]} className="space-y-3">
                  <AccordionItem value={`room-${room.id}`} className="border rounded-2xl px-4">
                    <AccordionTrigger className="text-base font-semibold">Voir / compléter les objets</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {room.items.map((item) => (
                          <FieldCard
                            key={item.id}
                            roomId={room.id}
                            item={item}
                            updateItem={updateItem}
                            addPhotos={addPhotos}
                            removePhoto={removePhoto}
                          />
                        ))}
                        {!room.items.length && (
                          <p className="text-sm text-slate-500">Aucun objet pour cette pièce. Ajoute-en un ci-dessus.</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[28px] border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Finalisation</CardTitle>
            <CardDescription>Exporter le PDF puis l’envoyer par email</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Button className="rounded-xl h-11" onClick={exportPdf}><Download className="h-4 w-4 mr-2" />Exporter le PDF</Button>
            <Button variant="outline" className="rounded-xl h-11" onClick={sendByEmail}><Mail className="h-4 w-4 mr-2" />Envoyer par email à veronique@cleide.fr</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
