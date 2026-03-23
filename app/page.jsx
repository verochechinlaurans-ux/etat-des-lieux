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