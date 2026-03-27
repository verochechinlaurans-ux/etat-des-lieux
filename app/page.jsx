"use client";

import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Camera, Download, Plus, Trash2 } from "lucide-react";

const roomsTemplate = [
  {
    id: "entree",
    name: "Entrée",
    structure: ["Porte d’entrée", "Murs", "Sol", "Plafond", "Éclairage"],
    items: ["Console", "Miroir", "Clés", "Télécommandes"],
  },
  {
    id: "salon",
    name: "Salon",
    structure: ["Murs", "Sol", "Plafond", "Baies vitrées", "Rideaux"],
    items: ["Canapé", "Fauteuils", "Table basse", "Tapis", "Télévision"],
  },
  {
    id: "cuisine",
    name: "Cuisine",
    structure: ["Murs", "Sol", "Plafond", "Plan de travail"],
    items: ["Réfrigérateur", "Four", "Plaques", "Lave-vaisselle", "Vaisselle"],
  },
  {
    id: "chambre",
    name: "Suite principale",
    structure: ["Murs", "Sol", "Plafond", "Fenêtres", "Rideaux"],
    items: ["Lit", "Matelas", "Chevets", "Lampes", "Dressing"],
  },
  {
    id: "sdb",
    name: "Salle de bain",
    structure: ["Murs", "Sol", "Plafond", "Miroirs", "Ventilation"],
    items: ["Lavabo", "Robinetterie", "Douche / baignoire", "WC"],
  },
  {
    id: "exterieur",
    name: "Extérieurs",
    structure: ["Façade", "Terrasse", "Piscine", "Jardin"],
    items: ["Transats", "Table extérieure", "Barbecue", "Parasols"],
  },
];

const conditionOptions = ["Neuf", "Très bon", "Bon", "Usure légère", "Abîmé"];

function makeChecks(list) {
  return list.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    condition: "Bon",
    reserve: "",
    photos: [],
  }));
}

function createData() {
  return {
    villa: "LA MASIA DE POUMARET",
    guest: "",
    manager: "",
    arrivalDate: "",
    departureDate: "",
    generalReserve: "",
    tenantValidationText: "",
    tenantAccepted: false,
    rooms: roomsTemplate.map((room) => ({
      ...room,
      structureChecks: makeChecks(room.structure),
      itemChecks: makeChecks(room.items),
      globalNote: "",
      open: false,
    })),
  };
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function CheckItem({ check, onChange, onAddPhotos, onRemovePhoto }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 14,
        background: "#fff",
        marginTop: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
        <div>
          <div style={{ fontWeight: 600 }}>{check.label}</div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>État, réserve et photos</div>
        </div>
        <div
          style={{
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 999,
            background: "#f3f4f6",
          }}
        >
          {check.condition}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>État</label>
        <select
          value={check.condition}
          onChange={(e) => onChange({ condition: e.target.value })}
          style={selectStyle}
        >
          {conditionOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>Réserve / commentaire</label>
        <textarea
          value={check.reserve}
          onChange={(e) => onChange({ reserve: e.target.value })}
          rows={3}
          style={inputStyle}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>
          <Camera size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && onAddPhotos(e.target.files)}
          style={{ fontSize: 16 }}
        />
      </div>

      {check.photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {check.photos.map((photo, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
              }}
            >
              <img
                src={photo}
                alt=""
                style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(i)}
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  border: 0,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.9)",
                  padding: 6,
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  title,
  items,
  roomId,
  section,
  updateRoomCheck,
  addPhotos,
  removePhoto,
  addLine,
}) {
  const [newLabel, setNewLabel] = useState("");

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ marginBottom: 10 }}>{title}</h3>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={`Ajouter un point dans ${title.toLowerCase()}`}
          style={{ ...inputStyle, margin: 0, flex: "1 1 220px" }}
        />
        <button
          type="button"
          onClick={() => {
            addLine(roomId, section, newLabel);
            setNewLabel("");
          }}
          style={{ ...secondaryButtonStyle, whiteSpace: "nowrap" }}
        >
          <Plus size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Ajouter
        </button>
      </div>

      {items.map((check) => (
        <CheckItem
          key={check.id}
          check={check}
          onChange={(patch) => updateRoomCheck(roomId, section, check.id, patch)}
          onAddPhotos={(files) => addPhotos(roomId, section, check.id, files)}
          onRemovePhoto={(index) => removePhoto(roomId, section, check.id, index)}
        />
      ))}
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState(createData);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("edl-mobile-simple-no-signature");
      if (saved) {
        setData(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("edl-mobile-simple-no-signature", JSON.stringify(data));
      } catch {}
    }, 300);

    return () => clearTimeout(timer);
  }, [data]);

  const totalPhotos = useMemo(() => {
    return data.rooms.reduce(
      (sum, room) =>
        sum +
        room.structureChecks.reduce((a, c) => a + c.photos.length, 0) +
        room.itemChecks.reduce((a, c) => a + c.photos.length, 0),
      0
    );
  }, [data]);

  const updateRoomCheck = (roomId, section, checkId, patch) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((check) =>
                check.id === checkId ? { ...check, ...patch } : check
              ),
            }
      ),
    }));
  };

  const addPhotos = async (roomId, section, checkId, files) => {
    const imgs = await Promise.all(Array.from(files).map(toDataUrl));

    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((check) =>
                check.id === checkId ? { ...check, photos: [...check.photos, ...imgs] } : check
              ),
            }
      ),
    }));
  };

  const removePhoto = (roomId, section, checkId, index) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id !== roomId
          ? room
          : {
              ...room,
              [section]: room[section].map((check) =>
                check.id === checkId
                  ? { ...check, photos: check.photos.filter((_, i) => i !== index) }
                  : check
              ),
            }
      ),
    }));
  };

  const toggleRoom = (roomId) => {
    setData((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId ? { ...room, open: !room.open } : room
      ),
    }));
  };

  const addLine = (roomId, section, label) => {
    if (!label.trim()) return;

    setData((prev) => ({
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

  const buildPdf = () => {
    const doc = new jsPDF();
    let y = 15;

    doc.setFontSize(16);
    doc.text("État des lieux villa", 10, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Villa : ${data.villa}`, 10, y);
    y += 8;
    doc.text(`Locataire : ${data.guest || "-"}`, 10, y);
    y += 8;
    doc.text(`Gestionnaire : ${data.manager || "-"}`, 10, y);
    y += 8;
    doc.text(`Séjour : ${data.arrivalDate || "-"} -> ${data.departureDate || "-"}`, 10, y);
    y += 8;
    doc.text(`Validation locataire : ${data.tenantAccepted ? "Oui" : "Non"}`, 10, y);
    y += 10;

    if (data.generalReserve) {
      const lines = doc.splitTextToSize(`Réserves générales : ${data.generalReserve}`, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 4;
    }

    if (data.tenantValidationText) {
      const lines = doc.splitTextToSize(`Commentaire validation locataire : ${data.tenantValidationText}`, 180);
      doc.text(lines, 10, y);
      y += lines.length * 5 + 6;
    }

    data.rooms.forEach((room) => {
      if (y > 250) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(13);
      doc.text(room.name, 10, y);
      y += 8;

      [...room.structureChecks, ...room.itemChecks].forEach((check) => {
        const line = `${check.label} - ${check.condition}${check.reserve ? ` - ${check.reserve}` : ""}`;
        const lines = doc.splitTextToSize(line, 180);
        doc.setFontSize(10);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 2;
      });

      if (room.globalNote) {
        const lines = doc.splitTextToSize(`Note : ${room.globalNote}`, 180);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 3;
      }

      y += 4;
    });

    return doc;
  };

  const exportPdf = () => {
    const doc = buildPdf();
    doc.save("etat-des-lieux.pdf");
  };

  const validateAndPrepareEmail = () => {
    if (!data.tenantAccepted) {
      alert("Veuillez cocher la validation du locataire avant de préparer l'envoi.");
      return;
    }

    const doc = buildPdf();
    doc.save("etat-des-lieux.pdf");

    const subject = encodeURIComponent(
      `État des lieux - ${data.villa} - ${data.guest || "Locataire"}`
    );

    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint l'état des lieux.\n\nBien : ${data.villa}\nLocataire : ${data.guest || "-"}\nGestionnaire : ${data.manager || "-"}\nSéjour : ${data.arrivalDate || "-"} -> ${data.departureDate || "-"}\nValidation locataire : Oui\n\nMerci.`
    );

    window.location.href = `mailto:veronique@cleide.fr?subject=${subject}&body=${body}`;
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        padding: 12,
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Version mobile terrain</div>
          <h1 style={{ fontSize: 28, lineHeight: 1.1, margin: 0 }}>État des lieux mobile</h1>
          <p style={{ color: "#6b7280" }}>Version sans signature, optimisée pour un usage fiable sur iPhone.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Pièces</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.rooms.length}</div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 16, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Photos</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{totalPhotos}</div>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 14 }}>
          <h2 style={{ marginTop: 0 }}>Dossier séjour</h2>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nom du bien</label>
              <input
                value={data.villa}
                onChange={(e) => setData((prev) => ({ ...prev, villa: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Locataire</label>
              <input
                value={data.guest}
                onChange={(e) => setData((prev) => ({ ...prev, guest: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Gestionnaire</label>
              <input
                value={data.manager}
                onChange={(e) => setData((prev) => ({ ...prev, manager: e.target.value }))}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Date entrée</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="AAAA-MM-JJ"
                  value={data.arrivalDate}
                  onChange={(e) => setData((prev) => ({ ...prev, arrivalDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date sortie</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="AAAA-MM-JJ"
                  value={data.departureDate}
                  onChange={(e) => setData((prev) => ({ ...prev, departureDate: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Réserves générales</label>
              <textarea
                value={data.generalReserve}
                onChange={(e) => setData((prev) => ({ ...prev, generalReserve: e.target.value }))}
                rows={4}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Commentaire de validation locataire</label>
              <textarea
                value={data.tenantValidationText}
                onChange={(e) => setData((prev) => ({ ...prev, tenantValidationText: e.target.value }))}
                rows={4}
                style={inputStyle}
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "start",
                gap: 10,
                background: "#f8fafc",
                borderRadius: 14,
                padding: 12,
                fontSize: 15,
              }}
            >
              <input
                type="checkbox"
                checked={data.tenantAccepted}
                onChange={(e) => setData((prev) => ({ ...prev, tenantAccepted: e.target.checked }))}
                style={{ marginTop: 3, transform: "scale(1.2)" }}
              />
              <span>Le locataire valide l’inventaire et reconnaît l’état des lieux ci-dessus.</span>
            </label>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {data.rooms.map((room) => (
            <div key={room.id} style={{ ...cardStyle, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => toggleRoom(room.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {room.name} {room.open ? "−" : "+"}
              </button>

              {room.open && (
                <div style={{ marginTop: 14 }}>
                  <SectionBlock
                    title="Structure"
                    items={room.structureChecks}
                    roomId={room.id}
                    section="structureChecks"
                    updateRoomCheck={updateRoomCheck}
                    addPhotos={addPhotos}
                    removePhoto={removePhoto}
                    addLine={addLine}
                  />

                  <SectionBlock
                    title="Mobilier et objets"
                    items={room.itemChecks}
                    roomId={room.id}
                    section="itemChecks"
                    updateRoomCheck={updateRoomCheck}
                    addPhotos={addPhotos}
                    removePhoto={removePhoto}
                    addLine={addLine}
                  />

                  <div style={{ marginTop: 16 }}>
                    <label style={labelStyle}>Commentaire global de pièce</label>
                    <textarea
                      rows={4}
                      value={room.globalNote}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          rooms: prev.rooms.map((r) =>
                            r.id === room.id ? { ...r, globalNote: e.target.value } : r
                          ),
                        }))
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10, marginBottom: 30 }}>
          <button
            type="button"
            onClick={exportPdf}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 18,
              background: "#111827",
              color: "#fff",
              padding: 14,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <Download size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Export PDF
          </button>

          <button
            type="button"
            onClick={validateAndPrepareEmail}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 18,
              background: "#2563eb",
              color: "#fff",
              padding: 14,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Valider et préparer l’envoi email
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  borderRadius: 24,
  padding: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.06)",
};

const labelStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  marginTop: 6,
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
  boxSizing: "border-box",
  fontSize: 16,
  lineHeight: 1.4,
  WebkitAppearance: "none",
  appearance: "none",
};

const selectStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 12,
  background: "#fff",
  fontSize: 16,
  lineHeight: 1.4,
  WebkitAppearance: "none",
  appearance: "none",
};

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  background: "#fff",
  padding: "10px 12px",
  fontSize: 15,
};