"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { Camera, Download, Plus, RefreshCw, Trash2 } from "lucide-react";

const roomsTemplate = [
  { id: "entree", name: "Entrée", structure: ["Porte", "Murs"], items: ["Console"] },
  { id: "salon", name: "Salon", structure: ["Murs"], items: ["Canapé"] },
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
    rooms: roomsTemplate.map((room) => ({
      ...room,
      structureChecks: makeChecks(room.structure),
      itemChecks: makeChecks(room.items),
      open: false,
    })),
    hostSignature: "",
    tenantSignature: "",
  };
}

function SignatureModal({ open, title, value, onClose, onSave }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;

    const width = wrapper.clientWidth;
    const height = 260;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = value;
    }
  }, [open, value]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const start = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawing.current = true;
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const save = () => {
    onSave(canvasRef.current.toDataURL());
    onClose();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>

        <div ref={wrapperRef} style={{ border: "2px solid #ccc" }}>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: 260, touchAction: "none" }}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>

        <button onClick={clear}>Effacer</button>
        <button onClick={save}>Valider</button>
      </div>
    </div>
  );
}

function SignatureField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div>
        <strong>{label}</strong>
        <button onClick={() => setOpen(true)}>Signer</button>
        {value && <img src={value} style={{ width: "100%" }} />}
      </div>

      <SignatureModal
        open={open}
        title={label}
        value={value}
        onClose={() => setOpen(false)}
        onSave={onChange}
      />
    </>
  );
}

export default function Page() {
  const [data, setData] = useState(createData);

  return (
    <div style={{ padding: 20 }}>
      <h1>État des lieux</h1>

      <SignatureField
        label="Signature gestionnaire"
        value={data.hostSignature}
        onChange={(v) => setData({ ...data, hostSignature: v })}
      />

      <SignatureField
        label="Signature locataire"
        value={data.tenantSignature}
        onChange={(v) => setData({ ...data, tenantSignature: v })}
      />
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "#fff",
  padding: 20,
  width: "90%",
};