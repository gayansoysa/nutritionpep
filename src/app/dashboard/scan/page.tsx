"use client";

import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/table-skeleton";
import { toast } from 'sonner';
import { CameraIcon } from "@radix-ui/react-icons";

export default function ScanPage() {
  const [barcode, setBarcode] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null); // For storing controls to stop scanning

  useEffect(() => {
    // Check if camera is available
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasCamera(true))
      .catch(() => setHasCamera(false));
      
    // Initialize barcode reader
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    // Cleanup on unmount
    return () => {
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch (e) {
          console.error("Error stopping barcode reader:", e);
        }
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    
    setIsScanning(true);
    
    try {
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        toast.error("No camera found");
        setHasCamera(false);
        setIsScanning(false);
        return;
      }
      
      // Use the first camera
      const deviceId = videoInputDevices[0].deviceId;
      
      const controls = codeReaderRef.current.decodeFromVideoDevice(
        deviceId, 
        videoRef.current, 
        (result, error) => {
          if (result) {
            setBarcode(result.getText());
            stopScanning();
            lookupBarcode(result.getText());
          }
          
          if (error) {
            // Only log non-not-found errors
            if (!error.message.includes("not found")) {
              console.error("Scanning error:", error);
              if (error.message.includes("checksum") || error.message.includes("format")) {
                toast.error("Invalid barcode format");
              }
            }
          }
        }
      );
      
      // Store controls for stopping later
      controlsRef.current = controls;
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Failed to access camera");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
        controlsRef.current = null;
      } catch (e) {
        console.error("Error stopping barcode reader:", e);
      }
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      setBarcode(manualBarcode);
      lookupBarcode(manualBarcode);
    }
  };

  const lookupBarcode = async (code: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      
      if (response.ok && data.food) {
        toast.success(`Found: ${data.food.name}`);
        // Redirect to add item form with prefilled data
        window.location.href = `/dashboard/search?barcode=${encodeURIComponent(code)}`;
      } else {
        toast.error(data.error || "Food not found");
      }
    } catch (error) {
      console.error("Error looking up barcode:", error);
      toast.error("Failed to lookup barcode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scan Barcode</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Camera Scanner</CardTitle>
        </CardHeader>
        <CardContent>
          {isScanning ? (
            <div className="relative aspect-video w-full max-w-md mx-auto bg-black rounded-md overflow-hidden">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none"></div>
            </div>
          ) : (
            <div className="aspect-video w-full max-w-md mx-auto bg-muted rounded-md flex items-center justify-center">
              <CameraIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {isScanning ? (
            <Button onClick={stopScanning} variant="outline">
              Cancel Scanning
            </Button>
          ) : (
            <Button 
              onClick={startScanning} 
              disabled={!hasCamera || isLoading}
              className="gap-2"
            >
              <CameraIcon className="h-4 w-4" />
              Start Scanning
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {barcode && (
        <Card>
          <CardHeader>
            <CardTitle>Last Scanned</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse w-48" />
                <div className="h-4 bg-muted rounded animate-pulse w-32" />
              </div>
            ) : (
              <p className="font-mono text-lg">{barcode}</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {isLoading && (
        <CardSkeleton />
      )}
    </div>
  );
}