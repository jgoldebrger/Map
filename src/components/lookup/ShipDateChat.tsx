"use client";

import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipDateChatCore } from "@/components/lookup/ShipDateChatCore";

export function ShipDateChat() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Ask Maps
        </CardTitle>
        <CardDescription>
          Ask in plain English — the assistant looks up real territory schedules from your map data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ShipDateChatCore />
      </CardContent>
    </Card>
  );
}
